# Dental catalog migration planner

This is a **planning-only** stage for migrating the ToothCraft catalog into the monorepo. It does not connect to a database, write records, or read production credentials.

## Planner input

Call `planDentalCatalogImport({ clinicId, legacySource, source, target })` from `common/dental-catalog-planner.mjs`.

- `source.procedures`: `legacyId, name, category, defaultPrice, minPrice, maxPrice, defaultDentistFeePercent, active`
- `source.paymentMethods`: `legacyId, name, active`
- `source.dentistFeeRates`: `legacyId, dentistLegacyId, procedureLegacyId, feePercent`
- `target.procedures`, `target.paymentMethods`, `target.dentistFeeRates`: existing target rows including legacy mapping fields
- `target.dentists`: dentist mappings represented by `legacyId`

Prices and fee percentages are validated. Existing rows with matching `legacySource + legacyId` are reused only when their identifying values agree. Same-name payment methods without a legacy mapping, conflicting mappings, duplicate source IDs, invalid amounts, and missing dentist/procedure mappings are sent to manual review.

## Status rules

- `BLOCKED`: required target clinic/source label is missing.
- `REQUIRES_REVIEW`: at least one record is ambiguous or invalid; do not apply the plan.
- `READY`: all records in the supplied catalog have a safe planned operation.

## Tests

From `ecosystem-backend-nest-js` run:

```powershell
node --test scripts/migration/dental-catalog-planner.test.mjs
pnpm run migration:test
```

This planner intentionally has no database executor yet. Before implementing one, the legacy schema and actual clinic data must be inspected read-only, the output must be reconciled, and the executor must use explicit target/environment acknowledgements, transaction boundaries, and a private report path outside Git. Never put real patient data or raw clinic exports into this repository.
