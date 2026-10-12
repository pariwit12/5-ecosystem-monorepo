# Dental clinic migration plan

## Systems

- Target: this NestJS + Next.js monorepo.
- Source: the older Express + React application in `D:\1-dental-clinic`.
- Database target: the PostgreSQL database managed by the Prisma migrations in this repository.

## Phases

1. Inventory the old routes, tables, roles, and integrations.
2. Freeze and document the target domain model for each migrated feature.
3. Create source-to-target field mappings and transformation rules.
4. Build an idempotent migration/import script that can run against a database copy.
5. Validate row counts, identifiers, relationships, dates, money, and representative records.
6. Run a rehearsal migration and record the results.
7. Migrate production data with a backup and a rollback/read-only plan.
8. Run parallel verification before switching users to the new application.

## Rules

- Do not migrate directly from the old application into production during development.
- Do not delete or overwrite source records as part of an import.
- Preserve legacy identifiers where they are needed for traceability.
- Record rejected rows and transformation warnings rather than silently skipping them.
- Treat patient, doctor, appointment, visit, and payment data as sensitive.

## Decisions still required

- Which old modules are in scope for the first migration release.
- The canonical identity mapping between old users and Clerk/Person records.
- Whether legacy records should be imported into the new domain tables or retained in legacy tables.
- The cutover date and read-only period for the old application.
