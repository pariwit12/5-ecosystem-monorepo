# Migration/import workflow

Migration code should be kept separate from request handlers and application startup. The import must be safe to rehearse repeatedly against a database copy.

## Required properties

- Read from a snapshot or export of the legacy database.
- Write only to an explicitly selected target database.
- Require an explicit environment/mode such as `staging` or `production`.
- Use stable legacy identifiers and an import mapping table where needed.
- Be idempotent: a second run must not create duplicate people, patients, visits, or payments.
- Use transactions for each bounded unit of work.
- Record inserted, updated, skipped, and rejected rows.
- Never silently discard invalid data.
- Never delete source data.
- Never run automatically during API startup or deployment.

## Suggested layout

```text
scripts/
└─ migration/
   ├─ README.md
   ├─ common/
   ├─ batches/
   │  ├─ 001-identity/
   │  ├─ 002-patients/
   │  └─ 003-clinic-history/
   └─ reports/
```

The first read-only aggregate audit is implemented under `ecosystem-backend-nest-js/scripts/migration`. Import/apply tooling remains intentionally unimplemented until a source audit and mapping rehearsal are reviewed.

## Run contract

Every batch should expose a dry-run and an apply mode, for example:

```text
pnpm migration:patients -- --source <snapshot> --target staging --dry-run
pnpm migration:patients -- --source <snapshot> --target staging --apply
```

The exact commands and credentials must be defined only after the source-to-target mapping is approved. Do not put connection strings in scripts or commit them to Git.

## Current audit command

```text
pnpm run migration:audit:legacy
```

The command requires `LEGACY_DATABASE_URL`, refuses to run when it matches `DATABASE_URL`, opens a PostgreSQL `READ ONLY` transaction, and emits aggregate counts only. See `ecosystem-backend-nest-js/scripts/migration/README.md`.
