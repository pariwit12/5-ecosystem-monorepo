# Prisma migration workflow

The backend uses the Prisma schema in `ecosystem-backend-nest-js/prisma/schema`.
Migration files belong in `ecosystem-backend-nest-js/prisma/migrations` and must be committed to Git.

## Before creating the first migration

1. Confirm which database is represented by the current schema.
2. Take a backup of the target database.
3. Use a local or staging database for the first migration experiment.
4. Run Prisma validation and generation.
5. Run `pnpm run prisma:migrate:status` from the backend directory.

Do not run `prisma migrate dev` against production. It is a development command and can alter the database.

## Local or staging

```bash
pnpm run prisma:validate
pnpm run prisma:generate
pnpm run prisma:migrate:status
pnpm run prisma:migrate:dev --name <short-description>
```

Review the generated SQL and migration directory before committing it.

## Deployment

After the migration has been reviewed and tested on staging:

```bash
pnpm run prisma:migrate:deploy
```

`migrate:deploy` applies committed migrations and does not create new migrations.

## Current repository state

At the time this document was added, the repository had no `prisma/migrations` directory.
The first migration must therefore be treated as a baseline decision, not generated blindly.
Compare the current schema with the live database before creating it.
