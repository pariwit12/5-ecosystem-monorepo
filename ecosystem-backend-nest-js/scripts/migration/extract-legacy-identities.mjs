import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import pg from 'pg';
import { mapLegacyIdentityRows } from './common/legacy-extraction.mjs';

const { Client } = pg;
const help = `Usage:
  pnpm run migration:extract:legacy-identities

Required environment:
  LEGACY_DATABASE_URL       Read-only PostgreSQL connection for a snapshot
  LEGACY_SNAPSHOT_ACK       Must equal READ_ONLY_SNAPSHOT
  MIGRATION_IDENTITY_INPUT  Output JSON path outside this repository

Optional environment:
  LEGACY_DATABASE_SCHEMA    Source schema (default: public)
  MIGRATION_MAX_ROWS        Safety limit across the three tables (default: 100000)

This command reads patients, staff, and doctors in a READ ONLY transaction.
The output contains personal data. It refuses paths inside this repository.
`;

if (process.argv.includes('--help')) {
  process.stdout.write(help);
  process.exit(0);
}

const connectionString = process.env.LEGACY_DATABASE_URL;
const outputSetting = process.env.MIGRATION_IDENTITY_INPUT;
if (!connectionString || !outputSetting) {
  process.stderr.write(
    'LEGACY_DATABASE_URL and MIGRATION_IDENTITY_INPUT are required.\n',
  );
  process.exit(1);
}
if (process.env.LEGACY_SNAPSHOT_ACK !== 'READ_ONLY_SNAPSHOT') {
  process.stderr.write(
    'Set LEGACY_SNAPSHOT_ACK=READ_ONLY_SNAPSHOT after selecting a snapshot.\n',
  );
  process.exit(1);
}
if (
  process.env.DATABASE_URL &&
  connectionString.trim() === process.env.DATABASE_URL.trim()
) {
  process.stderr.write(
    'Refusing extraction because LEGACY_DATABASE_URL matches DATABASE_URL.\n',
  );
  process.exit(1);
}

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const outputPath = resolve(outputSetting);
const outputRelativeToRepository = relative(repositoryRoot, outputPath);
if (
  outputRelativeToRepository === '' ||
  (!outputRelativeToRepository.startsWith('..') &&
    !isAbsolute(outputRelativeToRepository))
) {
  process.stderr.write('MIGRATION_IDENTITY_INPUT must be outside Git.\n');
  process.exit(1);
}

const schema = process.env.LEGACY_DATABASE_SCHEMA || 'public';
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
  process.stderr.write('LEGACY_DATABASE_SCHEMA is not a valid identifier.\n');
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
  application_name: 'ecosystem-legacy-identity-extractor',
});

try {
  await client.connect();
  await client.query('BEGIN TRANSACTION READ ONLY');
  await client.query("SET LOCAL statement_timeout = '60s'");

  const counts = await client.query(
    `SELECT
       (SELECT COUNT(*) FROM ${table('patients')})::int AS patients,
       (SELECT COUNT(*) FROM ${table('staff')})::int AS staff,
       (SELECT COUNT(*) FROM ${table('doctors')})::int AS doctors`,
  );
  const totalRows =
    Number(counts.rows[0].patients) +
    Number(counts.rows[0].staff) +
    Number(counts.rows[0].doctors);
  if (totalRows > maxRows) {
    throw new Error(
      `Source row count exceeds MIGRATION_MAX_ROWS (${maxRows}).`,
    );
  }

  const [patients, staff, doctors] = await Promise.all([
    client.query(
      `SELECT id, id_number, first_name, last_name, telephone, birth_day
       FROM ${table('patients')} ORDER BY id`,
    ),
    client.query(
      `SELECT id, cid, first_name, last_name, nickname, telephone, birth_day, role
       FROM ${table('staff')} ORDER BY id`,
    ),
    client.query(
      `SELECT id, cid, first_name, last_name, nickname, telephone, birth_day, license_number
       FROM ${table('doctors')} ORDER BY id`,
    ),
  ]);
  await client.query('ROLLBACK');

  const payload = {
    formatVersion: 1,
    containsPersonalData: true,
    extractedAt: new Date().toISOString(),
    source: { kind: 'legacy-postgresql-snapshot', schema },
    records: mapLegacyIdentityRows({
      patients: patients.rows,
      staff: staff.rows,
      doctors: doctors.rows,
    }),
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, {
    flag: 'wx',
  });
  process.stdout.write(
    `Extracted ${payload.records.length} identity records to an external file.\n`,
  );
} catch (error) {
  try {
    await client.query('ROLLBACK');
  } catch {
    // The connection may have failed before a transaction was opened.
  }
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`Legacy identity extraction failed: ${message}\n`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
