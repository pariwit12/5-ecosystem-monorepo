import { mkdir, open, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { validateIdentityApplyEnvironment } from './common/identity-apply-safety.mjs';
import { buildIdentityPlan } from './common/identity-mapping.mjs';
import { executeIdentityWriteManifest } from './common/identity-write-executor.mjs';
import { buildIdentityWriteManifest } from './common/identity-write-manifest.mjs';
import { planTargetIdentityImport } from './common/target-import-planner.mjs';

const help = `Usage:
  pnpm run migration:apply:identity

Required environment:
  MIGRATION_TARGET_DATABASE_URL  Target PostgreSQL writer connection
  MIGRATION_IDENTITY_INPUT       Source identity JSON outside Git
  MIGRATION_TARGET_STATE         Target state JSON outside Git
  MIGRATION_CLINIC_ID            Target clinic UUID
  MIGRATION_APPLY_ENVIRONMENT    disposable, staging, or production
  MIGRATION_APPLY_ACK            Exact acknowledgement for the environment
  MIGRATION_APPLY_REPORT         New report JSON path outside Git

Acknowledgements:
  disposable  APPLY_TO_DISPOSABLE_TARGET
  staging     APPLY_TO_STAGING_TARGET
  production  APPLY_TO_PRODUCTION_TARGET

This command writes to the selected target. Run the read-only extraction and
planning commands first. Never point this command at the legacy database.
`;

if (process.argv.includes('--help')) {
  process.stdout.write(help);
  process.exit(0);
}

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
let config;
try {
  config = validateIdentityApplyEnvironment(process.env, repositoryRoot);
} catch (error) {
  process.stderr.write(
    `Identity apply configuration rejected: ${error.message}\n`,
  );
  process.exit(1);
}

const safeErrorCode = (error) => {
  const message = error instanceof Error ? error.message : '';
  return /^[A-Z][A-Z0-9_]*(?::[A-Z][A-Z0-9_]*)?$/.test(message)
    ? message
    : 'DATABASE_WRITE_FAILED';
};

const startedAt = new Date().toISOString();
const report = {
  reportVersion: 1,
  mode: 'identity-apply',
  status: 'RUNNING',
  targetEnvironment: config.targetEnvironment,
  targetFingerprint: config.targetFingerprint,
  clinicId: config.clinicId,
  startedAt,
  completedAt: null,
  createdPersons: 0,
  reusedPersons: 0,
  processedPersons: 0,
};

await mkdir(dirname(config.reportPath), { recursive: true });
const reportHandle = await open(config.reportPath, 'wx');
await reportHandle.writeFile(`${JSON.stringify(report, null, 2)}\n`);
await reportHandle.close();
const saveReport = () =>
  writeFile(config.reportPath, `${JSON.stringify(report, null, 2)}\n`);

let pool;
let prisma;
try {
  const [sourceInput, targetState] = await Promise.all([
    readFile(config.sourcePath, 'utf8').then(JSON.parse),
    readFile(config.targetStatePath, 'utf8').then(JSON.parse),
  ]);
  const sourceRecords = Array.isArray(sourceInput)
    ? sourceInput
    : sourceInput.records;
  if (!Array.isArray(sourceRecords) || !Array.isArray(targetState.persons)) {
    throw new Error('INVALID_MIGRATION_INPUT');
  }
  if (targetState.target?.fingerprint !== report.targetFingerprint) {
    throw new Error('TARGET_STATE_DATABASE_MISMATCH');
  }

  const sourcePlan = buildIdentityPlan(sourceRecords);
  const targetPlan = planTargetIdentityImport(sourcePlan, targetState);
  const manifest = buildIdentityWriteManifest(
    sourcePlan,
    targetPlan,
    config.clinicId,
  );

  pool = new Pool({
    connectionString: config.connectionString,
    application_name: 'ecosystem-identity-migration',
    max: 2,
  });
  prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  await prisma.$connect();
  await executeIdentityWriteManifest(prisma, manifest, {
    onPersonCommitted: async (current) => {
      Object.assign(report, current);
      await saveReport();
    },
  });

  report.status = 'COMPLETE';
  report.completedAt = new Date().toISOString();
  await saveReport();
  process.stdout.write(
    `Identity import complete: ${report.processedPersons} persons processed.\n`,
  );
} catch (error) {
  report.status = 'FAILED';
  report.completedAt = new Date().toISOString();
  report.errorCode = safeErrorCode(error);
  await saveReport().catch(() => undefined);
  process.stderr.write(`Identity import failed: ${report.errorCode}\n`);
  process.exitCode = 1;
} finally {
  await prisma?.$disconnect().catch(() => undefined);
  await pool?.end().catch(() => undefined);
}
