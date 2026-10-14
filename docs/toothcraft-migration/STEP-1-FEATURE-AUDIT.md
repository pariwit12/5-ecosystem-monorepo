# ToothCraft Migration Audit — Step 1

Date: 2026-10-14  
Status: Initial repository inventory; detailed endpoint and screen mapping remains in progress.

## Scope and source repositories

- Legacy frontend: `pariwit12/toothcraft-frontend` (React 19, React Router, Create React App, LIFF, Axios, date-fns-tz, Luxon).
- Legacy backend: `pariwit12/toothcraft-v2-backend-and-task-manager` (Express 5, Prisma 6, PostgreSQL, JWT; also contains a separate Task Manager API and MongoDB connection).
- Target: `pariwit12/5-ecosystem-monorepo` (Next.js frontend, NestJS backend, Prisma schema split into modules).

## Confirmed legacy frontend screens

The legacy frontend source tree includes these pages:

- Authentication: staff login, doctor login, login selection, logout.
- Clinic operations: clinic overview, doctor room, staff dashboard, doctor dashboard, public dashboard.
- Patients: search, detail, patient dashboard, insurance patient list, LINE patient registration and selection.
- Appointments: appointment calendar, appointments in a day, patient appointments, reminders.
- Treatment: doctor treatment form, patient visit procedures, patient treatment plan, continuing-treatment patient list.
- Reports: visit-today summary, doctor-today summary, dentist fee summary, money received reports.
- Other: feedback list, public registration, camera check-in, LINE linking, medical/admin workflows.

The treatment form is behavior-rich: it loads patient/queue data, procedure catalog, visit history, intraoral findings/exams, continuing treatment, patient images/X-rays, and doctor details. Migration must preserve these workflows, not just the page shell.

## Confirmed legacy backend API groups

The Express entry point registers protected API groups for:

- appointments, clinic queue, continuing treatment
- doctor fee rates, doctor schedules, doctors, staff
- patients, procedures, payment methods
- visits, visit procedures, money received, receipts
- intraoral exams and findings, patient image/GCS
- feedback surveys, LINE integration, public endpoints, medical certificates, cron/reminders
- separate Task Manager routes (out of scope for the ToothCraft migration unless a shared dependency is identified)

The legacy Prisma schema includes appointment, queue, patient, doctor, treatment/visit, procedure, fee-rate, intraoral exam, and related records. Some legacy models use nullable fields and older relational conventions; mappings need explicit review before migration.

## Target monorepo foundation already present

The target has a dental-clinic Prisma schema with clinic ownership/timezone, patient-number sequencing, patient and dentist clinic affiliations, dental procedures, payment methods, and dentist procedure fee rates. The target backend already has patient create/update/query handlers and clinic staff-access and patient-number services. The Next.js frontend has dental-clinic setup pages.

This is a foundation, not evidence that all legacy workflows are already implemented.

## Initial migration matrix

| Feature group | Legacy evidence | Target evidence | Next action |
|---|---|---|---|
| Clinic setup/catalog | Procedures, payment methods, dentist fee-rate APIs | Clinic, procedure, payment method, fee-rate models; catalog migration planner PR #1 | Complete catalog mapping and review constraints |
| Authentication/access | Staff/doctor JWT login and protected Express route groups; LINE patient flow | Existing person/role/clinic affiliation architecture | Map roles, clinic scoping, and patient login before UI migration |
| Patients | Search/detail/registration and patient API | Dental patient handlers and patient-number service | Compare field-by-field and document unsupported fields |
| Appointments/schedules | Appointment pages and APIs; doctor schedules | No complete equivalent confirmed in this inventory | Inspect target modules and design missing handlers/pages |
| Queue/rooms | Clinic queue API and doctor-room UI | No complete equivalent confirmed in this inventory | Define queue state transitions and clinic-safe access |
| Clinical treatment | Treatment form, visits, visit procedures, continuing treatment, intraoral findings/exams, images | No complete equivalent confirmed in this inventory | Model clinical records and preserve tooth/surface workflows |
| Billing/receipts/reports | Money received, receipts, fee summaries and daily summaries | Not yet confirmed as complete | Map calculations and report definitions before implementation |
| LINE/reminders | LINE, webhook, public patient registration, reminder/cron APIs | Not yet confirmed as complete | Audit integrations and define secrets/webhook requirements |
| Task Manager | Separate routes/models in legacy backend | Separate project exists in source repository | Keep out of this dental migration unless required by shared architecture |

## Safety and acceptance rules

1. Do not write to production databases or import real patient data as part of this audit.
2. Do not commit patient names, phone numbers, national IDs, credentials, connection strings, or real database exports.
3. Use sanitized fixtures for tests and migration rehearsals.
4. Keep changes on feature branches and open pull requests; do not merge without the user's go-ahead.
5. For each feature, record API/UI parity, validation, authorization, time-zone behavior, and tests.
6. Do not mark a feature complete based on schema presence alone. Require implemented handlers/UI and relevant tests.
7. Verify existing tests/build/type-checks where tooling permits; report any checks that could not be run.

## Step 1 result and remaining work

Repository trees and key package/schema/entry files were inspected. The broad feature inventory above is confirmed from the source tree and backend route registration. The detailed endpoint-by-endpoint mapping, full Prisma field comparison, and executable test/build results are not yet complete; they belong to the next audit pass.
