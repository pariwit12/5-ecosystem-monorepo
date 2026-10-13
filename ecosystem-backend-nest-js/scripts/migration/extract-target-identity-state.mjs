import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import pg from 'pg';
import { mapTargetIdentityState } from './common/target-state-extraction.mjs';
import { databaseTargetFingerprint } from './common/database-target.mjs';

const { Client } = pg;
const help = `Usage:
  pnpm run migration:extract:target-identities

Required environment:
  MIGRATION_TARGET_DATABASE_URL  Read-only target connection
  MIGRATION_TARGET_ACK           Must equal READ_ONLY_TARGET
  MIGRATION_TARGET_STATE         Output JSON path outside this repository

Optional environment:
  MIGRATION_TARGET_SCHEMA        Target schema (default: public)
  MIGRATION_MAX_ROWS             Person safety limit (default: 100000)

This command reads identity matching state in a READ ONLY transaction.
It never reads Clerk IDs or person profile fields and performs no writes.
`;

if (process.argv.includes('--help')) {
  process.stdout.write(help);
  process.exit(0);
}

const connectionString = process.env.MIGRATION_TARGET_DATABASE_URL;
const outputSetting = process.env.MIGRATION_TARGET_STATE;
if (!connectionString || !outputSetting) {
  process.stderr.write(
    'MIGRATION_TARGET_DATABASE_URL and MIGRATION_TARGET_STATE are required.\n',
  );
  process.exit(1);
}
if (process.env.MIGRATION_TARGET_ACK !== 'READ_ONLY_TARGET') {
  process.stderr.write(
    'Set MIGRATION_TARGET_ACK=READ_ONLY_TARGET after selecting the target.\n',
  );
  process.exit(1);
}
try {
  if (
    process.env.LEGACY_DATABASE_URL &&
    databaseTargetFingerprint(connectionString) ===
      databaseTargetFingerprint(process.env.LEGACY_DATABASE_URL)
  ) {
    process.stderr.write(
      'Refusing extraction because target matches LEGACY_DATABASE_URL.\n',
    );
    process.exit(1);
  }
} catch {
  process.stderr.write('Target database URL is invalid.\n');
  process.exit(1);
}

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const outputPath = resolve(outputSetting);
const relativeOutput = relative(repositoryRoot, outputPath);
if (
  relativeOutput === '' ||
  (!relativeOutput.startsWith('..') && !isAbsolute(relativeOutput))
) {
  process.stderr.write('MIGRATION_TARGET_STATE must be outside Git.\n');
  process.exit(1);
}

const schema = process.env.MIGRATION_TARGET_SCHEMA || 'public';
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
  process.stderr.write('MIGRATION_TARGET_SCHEMA is not a valid identifier.\n');
  process.exit(1);
}
const maxRows = Number(process.env.MIGRATION_MAX_ROWS || 100000);
if (!Number.isInteger(maxRows) || maxRows < 1) {
  process.stderr.write('MIGRATION_MAX_ROWS must be a positive integer.\n');
  process.exit(1);
}

const table = (name) => `"${schema}"."${name}"`;
const client = new Client({
  connectionString,
  application_name: 'ecosystem-target-identity-state-extractor',
});

try {
  await client.connect();
  await client.query('BEGIN TRANSACTION READ ONLY');
  await client.query("SET LOCAL statement_timeout = '60s'");

  const count = await client.query(
    `SELECT COUNT(*)::int AS value FROM ${table('person')}`,
  );
  if (Number(count.rows[0].value) > maxRows) {
    throw new Error(
      `Target person count exceeds MIGRATION_MAX_ROWS (${maxRows}).`,
    );
  }

  const persons = await client.query(
    `SELECT id FROM ${table('person')} ORDER BY id`,
  );
  const documents = await client.query(
    `SELECT person_id, type, issuing_country, normalized_value
     FROM ${table('person_identity_document')} ORDER BY person_id`,
  );
  const legacy = await client.query(
    `SELECT person_id, source, entity_type, legacy_id
     FROM ${table('person_legacy_identity')} ORDER BY person_id`,
  );
  const patients = await client.query(
    `SELECT person_id FROM ${table('person_dental_patient')}`,
  );
  const staff = await client.query(
    `SELECT person_id FROM ${table('person_staff')}`,
  );
  const dentists = await client.query(
    `SELECT person_id FROM ${table('person_dentist')}`,
  );
  const patientAffiliations = await client.query(
    `SELECT person_dental_patient_id, organization_dental_clinic_id, patient_number
     FROM ${table('person_dental_patient_affiliation')}
     ORDER BY person_dental_patient_id, organization_dental_clinic_id`,
  );
  const staffAffiliations = await client.query(
    `SELECT person_staff_id, organization_dental_clinic_id, role, legacy_role
     FROM ${table('person_staff_affiliation')}
     ORDER BY person_staff_id, organization_dental_clinic_id`,
  );
  const dentistAffiliations = await client.query(
    `SELECT person_dentist_id, organization_dental_clinic_id
     FROM ${table('person_dentist_affiliation')}
     ORDER BY person_dentist_id, organization_dental_clinic_id`,
  );
  await client.query('ROLLBACK');

  const state = mapTargetIdentityState({
    persons: persons.rows,
    documents: documents.rows,
    legacyIdentities: legacy.rows,
    patientRoles: patients.rows,
    staffRoles: staff.rows,
    dentistRoles: dentists.rows,
    patientAffiliations: patientAffiliations.rows,
    staffAffiliations: staffAffiliations.rows,
    dentistAffiliations: dentistAffiliations.rows,
  });
  const payload = {
    formatVersion: 1,
    containsPersonalData: true,
    extractedAt: new Date().toISOString(),
    target: {
      kind: 'ecosystem-postgresql',
      schema,
      fingerprint: databaseTargetFingerprint(connectionString),
    },
    ...state,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, {
    flag: 'wx',
  });
  process.stdout.write(
    `Extracted matching state for ${payload.persons.length} target persons.\n`,
  );
} catch (error) {
  try {
    await client.query('ROLLBACK');
  } catch {
    // The connection may have failed before a transaction was opened.
  }
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`Target identity extraction failed: ${message}\n`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
