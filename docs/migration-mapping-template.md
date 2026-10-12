# Migration mapping template

Copy this template for each migration batch. Do not mark a row as ready until the source, target, transformation, validation, and rollback behavior are understood.

## Batch metadata

| Field | Value |
|---|---|
| Batch name | |
| Source project/database | |
| Target migration/release | |
| Owner | |
| Status | Draft / Review / Rehearsed / Ready / Complete |
| Rehearsal date | |

## Table and field mapping

| Source table.field | Target table.field | Transformation | Null/default rule | Validation | Decision/owner |
|---|---|---|---|---|---|
| | | | | | |

## Relationship mapping

| Source relationship | Target relationship | Key mapping | Validation |
|---|---|---|---|
| | | | |

## Identity and deduplication

Document the stable key used to identify an existing target record. Never use a display name alone for identity matching.

| Entity | Source key | Target key | Duplicate rule | Manual review rule |
|---|---|---|---|---|
| Person | | | | |
| Patient | | | | |
| Organization | | | | |

## Reconciliation checklist

- [ ] Source row counts recorded.
- [ ] Target inserted/updated/rejected counts recorded.
- [ ] Foreign-key violations checked.
- [ ] Duplicate and unmatched records reviewed.
- [ ] Date/timezone conversion checked.
- [ ] Money/decimal rounding checked.
- [ ] Representative records manually verified.
- [ ] Rejected rows exported with reasons.
- [ ] Re-run produces no unintended duplicates.
- [ ] Rollback or restore procedure tested.
