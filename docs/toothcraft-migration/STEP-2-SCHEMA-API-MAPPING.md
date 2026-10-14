# Step 2 — ToothCraft Schema and API Mapping (Initial)

Date: 2026-10-14

## Scope and safety

This is a source-code/schema comparison only. No database connection was opened, no production data was read or written, and no patient data was copied. This document is an initial mapping from the committed Prisma schemas and Express route registrations; it is not a claim that the migration is complete.

## Architecture difference

- Legacy backend: Express routes protected by a shared JWT middleware, with Prisma/PostgreSQL. The same repository also registers a separate Task Manager API and MongoDB connection; Task Manager is out of dental scope.
- Target: NestJS modules and a modular Prisma schema, with UUID-based person and clinic identities and clinic-scoped affiliations.
- IDs differ: legacy records mainly use integer auto-increment IDs; target people and dental entities use UUIDs. Preserve explicit source/entity/legacy-ID mapping; do not assume IDs can be copied directly.
- Legacy data has many nullable columns and legacy composite uniqueness rules. Target relationships often use restrictive deletes and clinic-scoped unique constraints. These require explicit transformation and conflict review.

## Initial entity mapping

| Legacy Prisma model | Target model(s) observed | Status / migration concern |
|---|---|---|
| `patients` | `Person`, `PersonDentalPatient`, `PersonDentalPatientAffiliation` | Partial structural match. Legacy patient fields include telephone, national ID, birth date, LINE user ID, insurance type/balance. Target person schema has name, phone, birth date and identity documents; target patient model has `legacyPatientId` and clinic patient number, but the reviewed schema does not show direct equivalents for LINE identity or insurance balance/type. Confirm target modules or design before migration. |
| `doctors` | `Person`, `PersonDentist`, `PersonDentistAffiliation` | Partial structural match. Legacy username/password, nickname, phone, CID, birth date and license number do not map one-to-one to target identity/account/auth design. Never migrate password hashes or identity data without a reviewed security plan. |
| `staff` | `Person`, `PersonStaff`, `PersonStaffAffiliation` | Partial structural match. Legacy role is a free-text string; target uses `StaffRole` plus optional `legacyRole`. Define a reviewed role mapping and handle unknown roles explicitly. |
| `procedures` | `DentalProcedure` | Strong catalog match for name, category and price range. Target adds clinic scope, active/version fields and legacy source/ID fields. Legacy continuing-treatment fields need separate mapping. |
| `payment_methods` | `ClinicPaymentMethod` | Strong catalog match for method name, but target adds clinic scope, active/version and legacy mapping. |
| `doctor_fee_rates` | `DentistProcedureFeeRate` | Structural match for dentist + procedure + percentage. Target requires both clinic-scoped affiliations and a non-null fee percentage; legacy foreign keys and percentages may be nullable. Validate each row before mapping. |
| `appointments` | No equivalent confirmed in reviewed target schema paths | Gap to investigate: patient/dentist, timestamp, note, reminder state, confirmation state. |
| `doctor_schedules` | No equivalent confirmed in reviewed target schema paths | Gap to investigate: start/end timestamps and guarantee income. |
| `clinic_queue` | No equivalent confirmed in reviewed target schema paths | Gap to investigate: one current queue row per legacy patient, room and handoff note. |
| `visits` | No equivalent confirmed in reviewed target schema paths | Gap to investigate: patient, dentist, visit timestamp, treatment note and next-visit value. |
| `visit_procedures` | No equivalent confirmed in reviewed target schema paths | Gap to investigate: visit/procedure links, tooth, surface, price and paid state. |
| `money_received` | No equivalent confirmed in reviewed target schema paths | Gap to investigate: payment date, amount, fee percent, payment method and procedure link. Financial totals must reconcile before cutover. |
| `continue_tx_list`, `continue_tx_patient` | No equivalent confirmed in reviewed target schema paths | Gap to investigate: treatment command, tooth, dentist, dates, notes and historical uniqueness behavior. |
| `io_finding_list`, `io_exam_patient` | No equivalent confirmed in reviewed target schema paths | Gap to investigate: intraoral finding/plan, tooth/surface, dentist and active/end dates. |
| `image_urls` | No equivalent confirmed in reviewed target schema paths | Gap to investigate: image ownership, storage URLs, access controls and retention. Do not copy URLs or images into fixtures. |
| `feedback_surveys` | No equivalent confirmed in reviewed target schema paths | Gap to investigate: patient and sent timestamp. |
| `receipts` / medical certificates / reminder workflows | No direct model mapping confirmed in the reviewed schema | Trace route/controller implementation and storage dependencies before deciding whether these are tables, generated documents or external workflows. |

## Legacy API groups confirmed by `src/index.js`

Public route registrations:
- `/auth`, `/public`, `/receipt`, `/medical-certificate`, `/cron`, `/line-webhook`

JWT-protected route registrations:
- `/appointments`, `/clinic-queue`, `/continue-tx-patient`, `/doctor-fee-rates`, `/doctor-schedules`, `/doctors`, `/feedback-surveys`, `/gcs`, `/io-exam-patient`, `/io-finding-list`, `/line`, `/money-received`, `/patients`, `/payment-methods`, `/procedures`, `/staff`, `/visit-procedures`, `/visits`

Additional legacy route groups:
- `/1-login->doctor`, `/1-login->staff`, `/3-by-doctor->money_received`

These are route prefixes, not a full endpoint contract. The next audit must inspect each route file for HTTP method, path, request/response shape, authorization, side effects, and frontend callers. Target NestJS controller coverage has not yet been confirmed endpoint by endpoint.

## Important migration risks to resolve

1. **Identity and authorization:** legacy username/password/JWT roles vs target person/account/clinic-affiliation model.
2. **Tenant isolation:** target dental catalog and fee rates are clinic-scoped; every migrated record must be assigned to the correct clinic.
3. **Legacy ID preservation:** use explicit source + entity type + legacy ID mapping where supported; don't infer matches from names alone.
4. **Financial correctness:** preserve decimal precision and reconcile paid/unpaid procedure records and receipts.
5. **Timezones:** legacy timestamps use PostgreSQL `Timestamptz(6)`; target clinic has an IANA timezone. Confirm display and conversion rules, especially for appointment and visit timestamps.
6. **Deleted/unknown values:** review nullable legacy fields, duplicate rows, unknown staff roles and target-required fields before import.
7. **Clinical and image data:** keep patient information out of test fixtures and avoid broad data access during the audit.
8. **Task Manager:** exclude its tables and endpoints from the dental migration unless a concrete shared dependency is identified.

## Acceptance criteria before implementation

- Produce a route-by-route API matrix with target controller/handler, method/path, authorization, request/response compatibility, and test status.
- Complete a field-by-field schema mapping including enum conversions, nullable-to-required fields, uniqueness, foreign keys and date/time behavior.
- Identify target gaps as explicit implementation tasks; do not mark a feature complete merely because a related model exists.
- Use sanitized synthetic fixtures for planner tests.
- No production DB changes or real patient-data import without separate explicit approval.
- Do not merge implementation PRs until review and checks are complete.
