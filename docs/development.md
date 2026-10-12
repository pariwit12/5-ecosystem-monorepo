# Development workflow

## Local setup

1. Install the repository's pinned pnpm version.
2. Run `pnpm install --frozen-lockfile` from the repository root.
3. Copy the relevant `.env.example` to the package environment file and fill in local values.
4. Generate and validate Prisma Client:

```bash
pnpm run prisma:validate
pnpm run prisma:generate
```

## Verification before a commit

```bash
pnpm run typecheck:backend
pnpm run typecheck:frontend
pnpm run lint:backend
pnpm run lint:frontend
pnpm run build:backend
pnpm run build:frontend
pnpm run test:backend
pnpm run test:e2e
```

GitHub Actions runs the non-production verification checks on pushes and pull requests.

The same checks can be run with one command:

```bash
pnpm run verify
```

Run `pnpm run test:e2e` separately when the required local environment is available.

## Database changes

Inspect migration status first:

```bash
pnpm run prisma:migrate:status
```

Create migrations only on a local or staging database:

```bash
pnpm run prisma:migrate:dev --name <short-description>
```

Deploy only reviewed, committed migrations:

```bash
pnpm run prisma:migrate:deploy
```

## Coding Agent workflow

Give each task a bounded objective and acceptance checks. For example:

> Add tests for the organization handlers. Do not change business behavior or connect to a real database. Run the relevant tests, typecheck, and lint. Leave changes uncommitted for review.

Keep unrelated work out of the same change. Review `git diff` and `git status` before committing.
