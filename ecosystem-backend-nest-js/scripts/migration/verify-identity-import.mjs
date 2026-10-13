import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { buildIdentityPlan } from './common/identity-mapping.mjs';
import {
  reconcileIdentityImport,
  summarizeIdentityReconciliation,
} from './common/identity-reconciliation.mjs';

const usesExternalState = Boolean(
  process.env.MIGRATION_IDENTITY_INPUT || process.env.MIGRATION_TARGET_STATE,
);
const sourcePath = resolve(
  process.env.MIGRATION_IDENTITY_INPUT ||
    'scripts/migration/fixtures/identity-apply-sanitized.json',
);
const targetPath = resolve(
  process.env.MIGRATION_TARGET_STATE ||
    'scripts/migration/fixtures/target-identity-applied-sanitized.json',
);
const clinicId =
  process.env.MIGRATION_CLINIC_ID ||
  (usesExternalState ? null : '00000000-0000-7000-8000-000000000010');
if (!clinicId) {
  throw new Error(
    'MIGRATION_CLINIC_ID is required for external migration data.',
  );
}

const sourceInput = JSON.parse(await readFile(sourcePath, 'utf8'));
const sourceRecords = Array.isArray(sourceInput)
  ? sourceInput
  : sourceInput.records;
const targetState = JSON.parse(await readFile(targetPath, 'utf8'));
if (!Array.isArray(sourceRecords) || !Array.isArray(targetState.persons)) {
  throw new Error('Source records and target persons must be arrays.');
}

const result = reconcileIdentityImport(
  buildIdentityPlan(sourceRecords),
  targetState,
  clinicId,
);
process.stdout.write(
  `${JSON.stringify(
    {
      reportVersion: 1,
      mode: 'verify-identity-import',
      databaseConnections: 0,
      writes: 0,
      ...summarizeIdentityReconciliation(result),
    },
    null,
    2,
  )}\n`,
);
if (result.status !== 'PASS') process.exitCode = 1;
