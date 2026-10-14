# Step 9 — Patient Identity Document Access Audit

**Status:** Source-code audit findings only. No application code or schema changes are included.

## Purpose

Review how patient identity documents—especially Thai national ID numbers—are accepted, matched, returned, and changed through the current person/patient API paths.

## Code reviewed

Repository: `pariwit12/5-ecosystem-monorepo`

- `ecosystem-backend-nest-js/src/modules/person/person.controller.ts`
- `ecosystem-backend-nest-js/src/modules/person/identity-document.ts`
- `ecosystem-backend-nest-js/src/modules/person/identity-document.spec.ts`
- `ecosystem-backend-nest-js/src/modules/person/commands/create-dental-patient.command.ts`
- `ecosystem-backend-nest-js/src/modules/person/commands/create-dental-patient.handler.ts`
- `ecosystem-backend-nest-js/src/modules/person/commands/update-dental-patient.command.ts`
- `ecosystem-backend-nest-js/src/modules/person/commands/update-dental-patient.handler.ts`
- `ecosystem-backend-nest-js/src/modules/person/queries/get-dental-patient-by-id.handler.ts`
- `ecosystem-backend-nest-js/prisma/schema/1-person.prisma`

This was a source-code review only. No production database or patient records were accessed. Tests and builds were not run.

## Findings

### 1. Identity documents are accepted during patient creation

The create request accepts either the legacy `cid` field or an `identityDocument` object, but not both. The input schema supports `THAI_CID`, `PASSPORT`, `FOREIGN_ID`, and `OTHER`.

For Thai CID input, validation requires 13 digits and issuing country `TH`. Passport input has a format check. Values and issuing-country codes are trimmed/normalized to uppercase.

The current schema tests cover normalization of a passport and rejection of an invalid Thai CID/country combination. This audit did not run those tests.

### 2. Identity matching is global across clinics

The create handler searches `PersonIdentityDocument` by the unique combination of document type, issuing country, and normalized value. The schema declares that combination unique across the table, not per clinic.

When a matching document exists, the handler reuses the associated `Person`, then creates a patient affiliation for the requested clinic if one does not already exist. This supports a shared person identity across clinics, but it also makes the authorization and identity-matching behavior security-sensitive.

The code reviewed checks that the creator is affiliated with the requested clinic. It does not appear to enforce the agreed policy that only dentists may create patient records. A clinic staff member may cause the system to link an existing identity to another clinic if the request passes the current checks. Confirm that this is intended and protected by role permissions before implementation.

### 3. Patient detail returns full identity-document values

The patient detail handler selects all identity documents and returns each document's `normalizedValue` as `value`. It also returns the Thai CID in the legacy `cid` field.

The handler verifies staff membership and that the person has a patient affiliation with the selected clinic. The reviewed code does not apply a role-specific field filter before returning the identity values. Therefore, based on this path, every staff role that passes the current membership check may receive full identity-document values.

This conflicts with the agreed policy unless access is restricted by role: receptionists may view the full Thai CID for their own clinic's patients, but other roles' identity-document visibility has not yet been decided. The API should not expose identity values to roles whose permission has not been approved.

### 4. The current patient update API cannot edit identity documents

The update request schema allows name, nickname, phone, and birth date fields, with optimistic concurrency through `version`. It does not accept `cid` or `identityDocuments`.

The reviewed update handler writes only the validated profile fields to `Person`; it does not update identity-document records. This means identity-document editing is not exposed through this patient update route. Any other identity-document write path must be found and reviewed before concluding that document values cannot be changed elsewhere.

### 5. Sensitive values must not leak through logs or errors

Treat Thai CID, passport, and other identity-document values as sensitive. Do not include full values in application logs, error responses, analytics, or audit messages. Log the action, actor, clinic, and record reference as appropriate without copying the raw document value.

## Risks and questions to resolve

1. Apply role-based field filtering to patient detail responses; clinic membership alone is not enough to decide who may see identity values.
2. Enforce dentist-only patient creation on the backend, consistent with the agreed product policy.
3. Decide whether a dentist may link an existing globally matched person to another clinic and whether any additional confirmation or safeguards are required.
4. Define identity-document permissions for clinic roles other than receptionists and dentists.
5. Search for any identity-document create/update/delete endpoints outside the reviewed `person` controller before implementation.
6. Review whether identity-match outcomes reveal whether a person with a given identity document already exists; avoid exposing sensitive existence information to unauthorized callers.

## Recommended tests

1. A receptionist can retrieve the full Thai CID for a patient affiliated with their clinic, as agreed.
2. A staff member without approved identity-document visibility cannot retrieve full identity values.
3. A caller cannot retrieve a patient's identity documents through a clinic where that patient has no affiliation.
4. A receptionist cannot create a patient record.
5. A non-dentist cannot create or link a patient record, including when the identity document already belongs to an existing person.
6. An authorized dentist can create a patient under the approved clinic-membership rules.
7. Creating a patient with an existing identity document creates at most one affiliation per clinic and does not duplicate the identity document.
8. The API does not disclose full identity values through errors, logs, or identity-match failure responses.
9. The profile update API rejects attempts to pass unsupported identity-document fields.
10. Any future identity-document write endpoint enforces explicit role checks and validation.

## Proposed next sequence

1. Finish searching the repository for every identity-document read/write path, including indirect queries and alternate controllers.
2. Confirm visibility and write permissions for all staff roles.
3. Implement server-side role checks and response-field filtering only after those decisions are documented.
4. Add tests for cross-clinic isolation, role-based visibility, create/link behavior, and sensitive-data handling.
5. Run relevant tests and type checks, reporting actual results before proposing an implementation PR.

## Scope and safety

This document records source-code observations and proposed safeguards only. It changes no application code, schema, permissions, or data. No production data was accessed. No pull request should be merged without explicit approval.
