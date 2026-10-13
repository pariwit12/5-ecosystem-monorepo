import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { buildIdentityPlan } from './common/identity-mapping.mjs';
import {
  planTargetIdentityImport,
  summarizeTargetImportPlan,
} from './common/target-import-planner.mjs';

const argument = (index) =>
  process.argv.slice(2).filter((value) => value !== '--')[index];
const sourcePath = resolve(
  process.env.MIGRATION_IDENTITY_INPUT ||
    argument(0) ||
    'scripts/migration/fixtures/identity-sanitized.json',
);
const targetPath = resolve(
  process.env.MIGRATION_TARGET_STATE ||
    argument(1) ||
    'scripts/migration/fixtures/target-identity-sanitized.json',
);

const sourceInput = JSON.parse(await readFile(sourcePath, 'utf8'));
const sourceRecords = Array.isArray(sourceInput)
  ? sourceInput
  : sourceInput.records;
const targetState = JSON.parse(await readFile(targetPath, 'utf8'));
if (!Array.isArray(sourceRecords) || !Array.isArray(targetState.persons)) {
  throw new Error('Source records and target persons must be arrays.');
}

const sourcePlan = buildIdentityPlan(sourceRecords);
const targetPlan = planTargetIdentityImport(sourcePlan, targetState);
const report = {
  reportVersion: 1,
  mode: 'dry-run-target-planner',
  databaseConnections: 0,
  writes: 0,
  ...summarizeTargetImportPlan(targetPlan),
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
