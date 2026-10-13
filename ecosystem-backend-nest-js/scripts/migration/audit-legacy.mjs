import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import pg from 'pg';

const { Client } = pg;

const help = `Usage:
  pnpm run migration:audit:legacy

Required environment:
  LEGACY_DATABASE_URL       Read-only PostgreSQL connection for a legacy snapshot

Optional environment:
  LEGACY_DATABASE_SCHEMA    Source schema (default: public)
  MIGRATION_REPORT_PATH     JSON output path; omit to print the report

The command opens a READ ONLY transaction and reports aggregate counts only.
It never includes CID, names, phone numbers, usernames, or connection strings.
`;

if (process.argv.includes('--help')) {
  process.stdout.write(help);
  process.exit(0);
}

const connectionString = process.env.LEGACY_DATABASE_URL;
if (!connectionString) {
  process.stderr.write(
    'LEGACY_DATABASE_URL is required. Use a read-only legacy snapshot account.\n',
  );
  process.exit(1);
}

if (
  process.env.DATABASE_URL &&
  connectionString.trim() === process.env.DATABASE_URL.trim()
) {
  process.stderr.write(
    'Refusing to audit because LEGACY_DATABASE_URL matches DATABASE_URL.\n',
  );
  process.exit(1);
}

const schema = process.env.LEGACY_DATABASE_SCHEMA || 'public';
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
  process.stderr.write('LEGACY_DATABASE_SCHEMA is not a valid identifier.\n');
  process.exit(1);
}

const qualified = (table) => `"${schema}"."${table}"`;
const scalar = async (client, sql) => {
  const result = await client.query(sql);
  return Number(result.rows[0]?.value ?? 0);
};

const tableExists = async (client, table) => {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = $1 AND table_name = $2
     ) AS value`,
    [schema, table],
  );
  return Boolean(result.rows[0]?.value);
};

const auditIdentityTable = async (client, table, cidColumn) => {
  if (!(await tableExists(client, table))) {
    return { present: false };
  }

  const source = qualified(table);
  const cid = `"${cidColumn}"`;
  return {
    present: true,
    rows: await scalar(client, `SELECT COUNT(*) AS value FROM ${source}`),
    missingCid: await scalar(
      client,
      `SELECT COUNT(*) AS value FROM ${source}
       WHERE ${cid} IS NULL OR BTRIM(${cid}) = ''`,
    ),
    invalidCidLength: await scalar(
      client,
      `SELECT COUNT(*) AS value FROM ${source}
       WHERE ${cid} IS NOT NULL AND BTRIM(${cid}) <> ''
         AND LENGTH(BTRIM(${cid})) <> 13`,
    ),
    duplicateCidGroups: await scalar(
      client,
      `SELECT COUNT(*) AS value FROM (
         SELECT BTRIM(${cid})
         FROM ${source}
         WHERE ${cid} IS NOT NULL AND BTRIM(${cid}) <> ''
         GROUP BY BTRIM(${cid}) HAVING COUNT(*) > 1
       ) duplicates`,
    ),
    missingName: await scalar(
      client,
      `SELECT COUNT(*) AS value FROM ${source}
       WHERE "first_name" IS NULL OR BTRIM("first_name") = ''
          OR "last_name" IS NULL OR BTRIM("last_name") = ''`,
    ),
  };
};

const client = new Client({
  connectionString,
  application_name: 'ecosystem-legacy-read-only-audit',
});

try {
  await client.connect();
  await client.query('BEGIN TRANSACTION READ ONLY');
  await client.query("SET LOCAL statement_timeout = '30s'");

  const [patients, staff, doctors] = await Promise.all([
    auditIdentityTable(client, 'patients', 'id_number'),
    auditIdentityTable(client, 'staff', 'cid'),
    auditIdentityTable(client, 'doctors', 'cid'),
  ]);

  let duplicateDoctorLicenseGroups = 0;
  if (doctors.present) {
    duplicateDoctorLicenseGroups = await scalar(
      client,
      `SELECT COUNT(*) AS value FROM (
         SELECT BTRIM("license_number")
         FROM ${qualified('doctors')}
         WHERE "license_number" IS NOT NULL
           AND BTRIM("license_number") <> ''
         GROUP BY BTRIM("license_number") HAVING COUNT(*) > 1
       ) duplicates`,
    );
  }

  const identitySources = [
    patients.present
      ? `SELECT BTRIM("id_number") AS cid FROM ${qualified('patients')}`
      : null,
    staff.present
      ? `SELECT BTRIM("cid") AS cid FROM ${qualified('staff')}`
      : null,
    doctors.present
      ? `SELECT BTRIM("cid") AS cid FROM ${qualified('doctors')}`
      : null,
  ].filter(Boolean);
  let crossRoleDuplicateCidGroups = 0;
  let crossRoleDuplicateCidRows = 0;
  if (identitySources.length > 1) {
    const crossRole = await client.query(
      `SELECT COUNT(*) AS groups, COALESCE(SUM(record_count), 0) AS rows
       FROM (
         SELECT cid, COUNT(*) AS record_count
         FROM (${identitySources.join(' UNION ALL ')}) identities
         WHERE cid IS NOT NULL AND cid <> ''
         GROUP BY cid HAVING COUNT(*) > 1
       ) duplicates`,
    );
    crossRoleDuplicateCidGroups = Number(crossRole.rows[0]?.groups ?? 0);
    crossRoleDuplicateCidRows = Number(crossRole.rows[0]?.rows ?? 0);
  }

  await client.query('ROLLBACK');

  const report = {
    reportVersion: 1,
    generatedAt: new Date().toISOString(),
    source: { kind: 'legacy-postgresql-snapshot', schema },
    containsPersonalData: false,
    crossRoleIdentity: {
      duplicateCidGroups: crossRoleDuplicateCidGroups,
      recordsInDuplicateCidGroups: crossRoleDuplicateCidRows,
    },
    tables: {
      patients,
      staff,
      doctors: {
        ...doctors,
        duplicateLicenseGroups: duplicateDoctorLicenseGroups,
      },
    },
  };
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  const outputPath = process.env.MIGRATION_REPORT_PATH;

  if (outputPath) {
    const absolutePath = resolve(outputPath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, serialized, { flag: 'wx' });
    process.stdout.write(`Aggregate audit report written to ${absolutePath}\n`);
  } else {
    process.stdout.write(serialized);
  }
} catch (error) {
  try {
    await client.query('ROLLBACK');
  } catch {
    // The connection may have failed before a transaction was opened.
  }
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`Legacy audit failed: ${message}\n`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
