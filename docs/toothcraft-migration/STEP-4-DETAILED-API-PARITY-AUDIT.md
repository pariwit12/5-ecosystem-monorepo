# Step 4 — Detailed ToothCraft API Parity Audit (Source Inventory)

Date: 2026-10-14  
Status: Initial detailed route inventory; handler-level contract review and tests remain open.

## Scope and safety

This audit reads source files in the legacy Express backend and target NestJS backend. No database was connected, no patient data was accessed, and no runtime tests were claimed. It excludes Task Manager routes. Findings marked “not confirmed” mean no matching endpoint was found in the target controller inventory inspected for this pass; they are not a claim that no related code exists anywhere.

## Target controller inventory

The target backend currently exposes controller files in these areas:
- `PersonController`: person and dental-patient create/list/read/update, staff-invitation claim.
- `OrganizationsController`: organization list/create/read/update, dental clinic creation, staff invitations.
- `WebhooksController`: Clerk webhook.
- Work-schedule controllers: log-in, min/max, place/places, position, slot template/type/slot, staff position/staff.
- Agent controller.

No target controllers named for appointments, clinic queue, dental visits, visit procedures, money received, receipts, intraoral exams/findings, patient images/GCS, LINE, or medical certificates were found in the current target `src/modules` controller tree. Work-schedule modules may provide related scheduling primitives, but they are not assumed to replace dental appointment or doctor-schedule workflows.

## Detailed legacy route inventory

### Authentication and identity
- `POST /auth/login/staff`
- `POST /auth/login/doctor`
- `POST /auth/login-patient-liff`
- `GET /auth/me` (JWT verification middleware)
- `POST /auth/logout` (client-side logout)
- Patient-specific endpoints: `GET /patients/check-id/:id_number`, `GET /patients/search-by-field`, `GET /patients/by-insurance-type`

**Target comparison:** the inspected target person and organization endpoints use `ClerkAuthGuard`. Target Clerk authentication is not a direct equivalent to legacy staff/doctor JWT login or patient LIFF login. Need a deliberate auth and role plan before frontend cutover.

### Patients
Legacy route declarations:
- `GET /patients/by-insurance-type`
- `GET /patients/check-id/:id_number`
- `GET /patients/search-by-field`
- `GET /patients/`, `GET /patients/:id`
- `POST /patients/`, `PUT /patients/:id`, `DELETE /patients/:id`

Target candidate:
- `POST /api/person/dental-patients`
- `GET /api/person/dental-patients`
- `GET /api/person/dental-patients/:person_id`
- `PATCH /api/person/dental-patients/:person_id`

**Status:** partial functional overlap only. Differences include PUT versus PATCH, integer legacy ID versus person UUID, and unconfirmed compatibility for insurance filtering, duplicate identity checking, deletion, search fields, pagination and response shape.

### Appointments
Legacy route declarations include:
- `GET /appointments/confirm-create`
- `PATCH /appointments/:id/mark-confirm-create`
- `GET /appointments/today/:doctorId`
- `PATCH /appointments/:id/mark-reminded`
- `GET /appointments/reminders`
- `GET /appointments/patient/:patientId`
- `GET /appointments/in-day`
- CRUD: `GET /appointments/`, `GET /appointments/:id`, `POST /appointments/`, `PUT /appointments/:id`, `DELETE /appointments/:id`

**Target comparison:** no equivalent dental appointment controller confirmed. Target work-schedule modules exist, but do not establish parity for patient appointments, reminder/confirmation flags, or daily appointment views.

### Clinic queue and room handoff
Legacy routes:
- CRUD under `/clinic-queue`
- `PUT /clinic-queue/:id/refer` for room transfer

**Target comparison:** no equivalent clinic-queue controller confirmed. Queue ordering, room state transitions, transfer notes, and concurrency behavior remain unmapped.

### Doctor schedules
Legacy routes include:
- `PATCH /doctor-schedules/safe-update/:id`
- `DELETE /doctor-schedules/safe-delete/:id`
- `GET /doctor-schedules/in-month-by-doctor`
- `GET /doctor-schedules/in-month`
- CRUD under `/doctor-schedules`

**Target comparison:** target work-schedule modules are present, but they appear to represent a different general scheduling model. Do not equate them with dental doctor availability until date/time fields, guarantee income, recurrence, clinic scope and frontend use are compared.

### Doctors, staff, procedure catalog and payment methods
Legacy CRUD endpoints:
- `/doctors`: GET collection/item, POST, PUT item, DELETE item.
- `/staff`: GET collection/item, POST, PUT item, DELETE item.
- `/procedures`: GET collection/item, POST, PUT item, DELETE item.
- `/payment-methods`: GET collection/item, POST, PUT item, DELETE item.
- `/doctor-fee-rates`: GET collection/item, POST, PUT item, DELETE item.

**Target comparison:** related person/role and catalog schema structures exist, but exact target CRUD endpoint parity, validation, clinic scope, deletion behavior and response contracts are not yet confirmed. Existing schema matches are not proof of working API parity.

### Dental visits and treatment
Legacy visits:
- `GET /visits/check-have-today-visit-by-doctor`
- `GET /visits/today-by-all-doctor`
- `GET /visits/today-by-doctor/:doctorId`
- `GET /visits/history/:patientId`
- `POST /visits/with-procedures`
- CRUD under `/visits`

Legacy visit procedures:
- `POST /visit-procedures/add-multiple`
- `GET /visit-procedures/unpaid/patient/:patientId`
- `GET /visit-procedures/:patientId` (declared before the generic item route)
- `GET /visit-procedures/:id`
- CRUD under `/visit-procedures`
- One additional multiline `router.put(...)` declaration requires exact body inspection.

Continuing treatment and intraoral records:
- `GET /continue-tx-patient/last/:patientId`
- `GET /continue-tx-patient/patient/:patientId`
- `GET /continue-tx-patient/doctor`
- `PATCH /continue-tx-patient/:id`
- `PATCH /continue-tx-patient/:id/note`
- `GET /continue-tx-patient/`
- `GET /io-exam-patient/patient/:patientId`
- `PUT /io-exam-patient/update-multi-date-end`
- `POST /io-exam-patient/multi-insert`
- `GET /io-exam-patient/last/:patientId`
- `GET /io-finding-list/`

**Target comparison:** no equivalent dental visit, visit-procedure, continuing-treatment, or intraoral-record controllers confirmed. These are high-priority clinical workflow gaps. Tooth/surface data, procedure paid status, historical records and dentist attribution must be preserved.

### Payments, reports, receipts
Legacy money-received endpoints:
- `GET /money-received/my-df-summary` (additional doctor-role middleware)
- `GET /money-received/by-date-range-group-by-doctor`
- `GET /money-received/by-date-range`
- CRUD under `/money-received`

Legacy receipt routes are registered under `/receipt`; exact subpaths need route-file inspection. Medical certificate and reporting endpoints likewise require detailed route-file review.

**Target comparison:** no equivalent money-received, receipt, or dental fee-summary controller confirmed. Financial migration needs a field/decimal mapping and reconciliation plan before implementation.

### Feedback, images, LINE, public and scheduled integrations
Legacy route groups confirmed by entry-point registration:
- `/feedback-surveys` (routes include list and delete)
- `/gcs` (image/storage integration)
- `/line`, `/line-webhook`
- `/public`
- `/medical-certificate`
- `/cron`

Target has `POST /api/webhooks/clerk`, which verifies Svix headers; this is not equivalent to LINE webhook or LIFF patient registration. No target equivalents for the other integration groups were confirmed in the inspected controller tree.

## Cross-cutting compatibility risks

1. **Authentication:** legacy JWT roles and patient LIFF identity versus target Clerk user identity.
2. **Clinic authorization:** verify tenant/clinic authorization in every handler, not merely authentication guards.
3. **Identifier mapping:** legacy integer IDs versus target UUIDs; retain explicit source/entity/legacy-ID mappings.
4. **Request/response compatibility:** HTTP methods, parameter names, pagination, status codes and error bodies may differ.
5. **Data validation:** legacy validation middleware and DTO rules need field-by-field comparison.
6. **Side effects:** reminders, appointment confirmations, room transfers, multi-record clinical writes, payment updates, image storage and webhooks need idempotency and failure handling.
7. **Dates/time zones:** compare timestamp semantics and clinic timezone conversion.
8. **Delete semantics:** determine hard delete, soft delete, restrictive relations and audit requirements.
9. **Tests:** no test or build command was run for this static audit; no test status should be inferred from this report.

## Recommended order for the next work batch

1. Complete exact route/controller extraction for all legacy files and map each endpoint to target handler or explicit gap.
2. Inspect target handler/query/command code and DTOs for patients and clinic/catalog endpoints; document contracts and clinic authorization.
3. Inspect legacy controllers and validators for the highest-risk workflows: auth, patient, appointments, queue, visits/treatment and payments.
4. Turn verified gaps into small implementation proposals, starting with one bounded domain after the user reviews the audit.
5. Add contract/unit tests with synthetic data before claiming parity.

## Safety
No production database access, patient data export, schema changes, or application-code changes were performed for this audit. This document is for review only. Do not merge or implement a migration batch without user approval.
