# Step 5 — Patient and Authentication Contract Audit

Date: 2026-10-14  
Status: Static source comparison of inspected route/controller/DTO/guard files. This is not a security penetration test and does not establish runtime behavior.

## Scope and safety

Compared the legacy Express routes and handlers with the target NestJS person controller, DTOs, and Clerk guard. No database connection or production data access was performed. No application code was changed. Task Manager remains out of scope.

## Executive finding

The target patient API is not a drop-in replacement for the legacy patient API. It changes identity, identifier types, request/response shapes, search semantics, pagination, update semantics, and authentication. These changes can be reasonable, but the frontend and migration plan need an explicit adapter/contract before cutover.

## Endpoint comparison

| Legacy API | Target API inspected | Finding |
|---|---|---|
| `POST /auth/login/staff` | Clerk guard; no equivalent login route found in target controller tree | Not equivalent. Legacy accepts username/password and returns a JWT token. |
| `POST /auth/login/doctor` | Clerk guard; no equivalent login route found | Not equivalent. Legacy creates a doctor-role JWT. |
| `POST /auth/login-patient-liff` | No target LIFF login route found | Not equivalent. Legacy handler accepts `patient_id`, looks up the patient, and returns a one-hour patient-role JWT. The handler shown does not itself validate a LINE LIFF token or LINE user identity; verify whether another upstream layer guarantees that before relying on it. |
| `GET /auth/me` | No target equivalent found | Legacy returns role plus a staff/doctor/patient database record selected by JWT role. Target identity is Clerk subject data and does not have the same response contract. |
| `GET /patients` | `GET /api/person/dental-patients?organizationDentalClinicId=...&search=...&page=...&pageSize=...` | Partial overlap, incompatible response. Legacy returns an array; target returns `patients` plus pagination metadata. Target page size is limited to 50, default 20. |
| `GET /patients/:id` | `GET /api/person/dental-patients/:person_id?organizationDentalClinicId=...` | Partial overlap. Legacy integer patient ID versus target UUID person ID; target response includes patient number, version and identity documents. |
| `POST /patients` | `POST /api/person/dental-patients` | Partial overlap. Legacy snake_case body; target camelCase body and required clinic UUID. Target accepts either 13-digit `cid` or an identity document, not both. |
| `PUT /patients/:id` | `PATCH /api/person/dental-patients/:person_id?organizationDentalClinicId=...` | Incompatible contract. Target requires `version` for concurrency and at least one field change. The inspected target update DTO does not expose legacy insurance fields or identity-number updates. |
| `DELETE /patients/:id` | No target delete endpoint found in inspected PersonController | No equivalent confirmed. Do not add destructive behavior without defining retention and clinical-record rules. |
| `GET /patients/check-id/:id_number` | No direct equivalent endpoint found | Target stores identity documents and a CID field, but this does not establish equivalent duplicate-check behavior or authorization. |
| `GET /patients/search-by-field?hn=&name=&telephone=&id_number=` | Target list `search` parameter | Not equivalent yet. Legacy builds AND conditions across supplied fields and uses contains searches for names/phone/ID; target exposes one general search parameter. Need handler-level comparison to determine actual fields and matching semantics. |
| `GET /patients/by-insurance-type?label=...` | No equivalent target endpoint found | Legacy filters by insurance type and positive insurance balance. Target patient DTOs inspected do not include insurance type/balance. |

## Legacy behavior observed

### Authentication
- Staff login looks up a staff row by username, compares the supplied password directly with the stored password, and returns a signed JWT containing role and database ID.
- Doctor login does the same for a doctor row and sets role to `doctor`.
- Patient LIFF login receives `patient_id`, finds the patient by numeric ID, and returns a token with role `patient` and a one-hour expiry plus basic name fields.
- `GET /auth/me` uses token role to choose staff, doctor, or patient lookup.
- Logout is client-side only; server returns a message asking the client to delete its token.

**Security follow-up:** direct password comparison suggests password storage may be plaintext or otherwise directly comparable; inspect the schema and credential migration path before any reuse. More importantly, the LIFF login handler shown does not verify a LINE ID token itself. Confirm how identity is established upstream; do not expose this flow as secure based solely on the patient ID.

### Patient CRUD
- List endpoint returns all patient rows without pagination in the shown controller.
- Search endpoint can search numeric HN/ID, name, telephone, and identity number. Supplied conditions are combined with AND; name uses case-insensitive contains matching.
- Create endpoint accepts `first_name`, `last_name`, `telephone`, `id_number`, and `birth_day`, and checks birth date against current date.
- Update endpoint writes first/last name, phone, ID number, birth date, insurance type and insurance balance.
- Delete endpoint attempts a hard delete and returns a success message if it completes.
- Some error paths return HTTP 500 for errors that may include validation or constraint failures; exact normalization is not consistent.

## Target behavior/contracts observed

### Authentication guard
- Target `ClerkAuthGuard` requires an `Authorization: Bearer <token>` header and calls Clerk `verifyToken` with `CLERK_SECRET_KEY`.
- It attaches the verified token payload to the request and returns 401 for missing/invalid tokens.
- Person endpoints use `ClerkAuthGuard`; controller passes the Clerk subject into command/query objects.

### Patient list and read
- List requires `organizationDentalClinicId` as a UUID.
- Optional `search` is trimmed and limited to 100 characters.
- Pagination defaults to page 1 and page size 20, with page size max 50.
- List response fields are camelCase: person ID, patient number, first/last name, nickname, phone, birth date, and pagination.
- Detail requires a UUID person ID and clinic UUID. Response includes version, patient number, CID and identity documents.

### Patient create/update
- Create requires clinic UUID and non-empty first/last name. Optional phone, birth date, and one of a 13-digit CID or identity-document object are accepted.
- Update requires a positive integer `version`, accepts selected demographic fields, and requires at least one change. It supports nickname and nullable phone/birth date; the inspected DTO does not support legacy insurance balance/type or identity changes.
- Update is PATCH and uses UUID, not legacy PUT and integer ID.

**Authorization still needs handler verification:** a guard authenticates a Clerk token, but it does not alone prove the caller has access to the requested clinic. Confirm the query/command handlers check clinic affiliation and access for every operation.

## Migration blockers to resolve before frontend cutover

1. **Identity and roles:** define how existing staff, doctors and patients map to Clerk users, person records, affiliations, and permissions. Decide whether legacy JWT sessions will be retired or temporarily bridged.
2. **LIFF verification:** verify LINE identity server-side before linking a LINE account to a patient. A client-supplied patient ID alone must not be treated as proof of identity.
3. **Credential storage:** inspect legacy schema and authentication setup to determine password hashing and plan a secure migration; never copy plaintext passwords into a new system.
4. **Legacy IDs:** create explicit mapping from old numeric patient IDs to target person UUIDs/patient numbers. Do not infer the mapping from names or national ID.
5. **Search contract:** define supported fields, AND/OR behavior, partial matching, pagination, sorting and access control.
6. **Patient fields:** decide where insurance type, insurance balance, LINE identity and any other required legacy fields live in the target domain.
7. **Update concurrency:** preserve the target version check when migrating UI edit flows; define conflict response and retry UX.
8. **Deletion and retention:** do not automatically port hard-delete behavior for a patient who may have clinical/financial history. Define archive/deactivation and legal retention rules first.
9. **Privacy and logging:** avoid putting national IDs, tokens, passwords, or patient data in logs, audit docs, or test fixtures.
10. **Contract tests:** add tests using synthetic patients and fake identities for authorization, validation, response shape, duplicate IDs, version conflicts, and cross-clinic isolation.

## Recommended next step

Before implementing missing routes, inspect the target patient query/command handlers and their tests to verify clinic-access enforcement and data writes. Then document the legacy-to-target patient field mapping and authentication decision. Only after review should implementation start.

## Verification status
- Static source files inspected: legacy auth routes/handler, patient routes/handler, target PersonController, patient DTOs and Clerk guard.
- Runtime tests/build were not run.
- No database, patient records, or production credentials were accessed.
- Documentation only; no API implementation or schema changes.
