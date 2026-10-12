# Ecosystem monorepo instructions

## Scope

This repository contains a NestJS backend and a Next.js frontend for the dental-clinic ecosystem.
The older Express/React application is outside this repository and is used only as a migration source.

## Commands

Run commands from the repository root when a root script exists:

```bash
pnpm install --frozen-lockfile
pnpm run prisma:validate
pnpm run prisma:generate
pnpm run typecheck:backend
pnpm run typecheck:frontend
pnpm run lint:backend
pnpm run lint:frontend
pnpm run build:backend
pnpm run build:frontend
pnpm run test:backend
pnpm run test:e2e
pnpm run verify
```

`pnpm run verify` is the standard pre-commit verification command. It excludes e2e tests because those may require deployment-specific environment or database access.

The backend and frontend can still be run directly from their package directories.

## Database and Prisma

- Never use `prisma db push` against a shared or production database.
- Use committed migrations for schema changes.
- Use `prisma migrate dev` only for local or staging development.
- Use `prisma migrate deploy` only for reviewed migrations during deployment.
- Do not reset, drop, or truncate a database without explicit user approval.
- Unit tests must mock Prisma and must not connect to a real database.

## Coding rules

- Preserve existing business behavior unless the task explicitly requests a behavior change.
- Keep unfinished examples/templates outside `src/`; use `docs/snippets/`.
- Add or update tests for non-trivial backend behavior.
- Run the narrowest relevant test, then typecheck and lint before reporting completion.
- Do not commit automatically. Leave changes available for review unless the user asks to commit.
- Never expose environment variable values, credentials, tokens, or connection strings.

## Migration work

- Treat the old Express/React project as a source system, not as a runtime dependency.
- Before migrating data, document source-to-target table and field mappings.
- Prefer additive, reversible migration steps and preserve an audit trail for transformations.
- Stop and ask the user when a mapping, identity rule, deletion rule, or data-loss decision is ambiguous.
