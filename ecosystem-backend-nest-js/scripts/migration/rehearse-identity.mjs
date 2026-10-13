import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import {
  buildIdentityPlan,
  summarizeIdentityPlan,
} from './common/identity-mapping.mjs';

const inputArgument = process.argv.slice(2).find((value) => value !== '--');
const fixturePath = resolve(
  process.env.MIGRATION_IDENTITY_INPUT ||
    inputArgument ||
    'scripts/migration/fixtures/identity-sanitized.json',
);
const input = JSON.parse(await readFile(fixturePath, 'utf8'));
const records = Array.isArray(input) ? input : input.records;
if (!Array.isArray(records))
  throw new Error('Identity input must be an array.');

const plan = buildIdentityPlan(records);
const summary = {
  reportVersion: 1,
  mode: 'in-memory-rehearsal',
  databaseConnections: 0,
  input: fixturePath,
  ...summarizeIdentityPlan(records, plan),
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
