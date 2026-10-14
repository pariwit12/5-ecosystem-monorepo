# Step 3 — ToothCraft API Endpoint Audit (First Pass)

Date: 2026-10-14  
Status: First-pass source inspection; full endpoint contract and handler-level parity review remains in progress.

## Scope and safety
Compared committed source files in the legacy Express backend (`pariwit12/toothcraft-v2-backend-and-task-manager`) and target NestJS backend (`pariwit12/5-ecosystem-monorepo`). Static source inspection only: no database connection, production data access, code changes, or data migration. Task Manager routes are excluded from dental scope.

## Confirmed legacy route registration
The legacy `src/index.js` registers public prefixes: `/auth`, `/public`, `/receipt`, `/medical-certificate`, `/cron`, `/line-webhook`.
It registers these behind shared JWT middleware: `/appointments`, `/clinic-queue`, `/continue-tx-patient`, `/doctor-fee-rates`, `/doctor-schedules`, `/doctors`, `/feedback-surveys`, `/gcs`, `/io-exam-patient`, `/io-finding-list`, `/line`, `/money-received`, `/patients`, `/payment-methods`, `/procedures`, `/staff`, `/visit-procedures`, `/visits`.
Additional route groups: `/1-login->doctor`, `/1-login->staff`, and `/3-by-doctor->money_received`. These are route prefixes, not complete contracts.

## Sample route-level findings confirmed from source

| Legacy endpoint | Method | Behavior | Target parity |
|---|---|---|---|
| `/auth/login/staff` | POST | Staff login | Not confirmed; target uses Clerk auth in inspected controllers |
| `/auth/login/doctor` | POST | Doctor login | Not confirmed |
| `/auth/login-patient-liff` | POST | Patient login via LINE LIFF | Not confirmed |
| `/auth/me` | GET | Read/validate current JWT identity | Not confirmed |
| `/patients/by-insurance-type` | GET | Filter patients by insurance | No equivalent confirmed |
| `/patients/check-id/:id_number` | GET | Check duplicate national ID | No equivalent confirmed |
| `/patients/search-by-field` | GET | Search by HN/name/phone/identity number | Partial candidate: target `GET /api/person/dental-patients`; compatibility unverified |
| `/patients` | GET/POST | List/create patients | Partial candidate: target `GET/POST /api/person/dental-patients`; not assumed compatible |
| `/patients/:id` | GET/PUT/DELETE | Read/update/delete patient | Target has GET/PATCH by UUID; delete parity absent from inspected controller |
| `/appointments` | GET/POST/PUT/DELETE | Appointment CRUD | No equivalent target controller confirmed |
| `/appointments/in-day` | GET | Daily appointments and schedule | No equivalent confirmed |
| `/appointments/reminders` | GET | Appointments needing reminders | No equivalent confirmed |
| `/clinic-queue` | GET/POST/PUT/DELETE | Queue operations | No equivalent confirmed |
| `/clinic-queue/:id/refer` | PUT | Transfer patient to another room | No equivalent confirmed |
| `/visits` | GET/POST/PUT/DELETE | Visit CRUD | No equivalent confirmed |
| `/visits/with-procedures` | POST | Create visit with procedures | No equivalent confirmed |
| `/visits/history/:patientId` | GET | Patient visit history | No equivalent confirmed |

“No equivalent confirmed” means not found in the target controller surface inspected so far; it is not proof that no implementation exists anywhere.

## Target endpoints confirmed in inspected controllers
The target `PersonController` uses `@Controller('api/person')` and `ClerkAuthGuard` on:
- `POST /api/person`
- `POST /api/person/dental-patients`
- `GET /api/person/dental-patients`
- `GET /api/person/dental-patients/:person_id`
- `PATCH /api/person/dental-patients/:person_id`
- `POST /api/person/staff-invitations/claim`

The target `OrganizationsController` exposes guarded organization list/create/read/update, clinic creation, and staff invitation endpoints under `/api/organizations`. The target `WebhooksController` exposes `POST /api/webhooks/clerk` and verifies Svix signature headers. This does not replace the legacy LINE webhook or patient LIFF login.

## Initial gaps and risks
1. **Authentication mismatch:** legacy staff/doctor JWT login and patient LIFF login differ from target Clerk auth. Explicitly design role migration, patient identity, sessions, and authorization.
2. **Method/path mismatch:** legacy patient update uses PUT and integer IDs; target uses PATCH and a person UUID. Frontend migration needs an adapter or planned API change.
3. **Patient coverage:** insurance filtering, national-ID duplicate checking, and delete behavior are not shown as equivalent.
4. **Core workflow coverage:** appointments, queue/room handoff, visits/treatment, payments, receipts, and reports require deeper target inspection.
5. **Integration mismatch:** LINE/LIFF/webhook/reminder workflows need separate mapping; the Clerk webhook is not a replacement.
6. **Authorization:** verify clinic-level authorization in each handler, not only authentication guards.
7. **Side effects:** document reminder flags, visit-plus-procedure writes, room transfers, payments, and receipts before implementation.

## Next audit pass
For every legacy route file and target controller, record exact method/path, auth and clinic scope, query/path/body fields, response/errors, database writes and external side effects, target match/gap, tests, and legacy frontend callers. Then group confirmed gaps into small implementation batches. Do not implement endpoints or change schemas in this audit document.

## Acceptance and safety
- No production database access or real patient-data import.
- No secrets or real patient identifiers in documentation or fixtures.
- Do not call an endpoint migrated until handler behavior, authorization, validation, and tests are checked.
- Keep work in a branch/PR; do not merge without explicit user approval.
