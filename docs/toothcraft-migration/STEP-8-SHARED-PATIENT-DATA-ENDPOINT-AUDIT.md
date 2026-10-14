# Step 8 — Shared Patient Data and Endpoint Access Audit

**Status:** Audit findings only. No application code changes are included in this document.

## Purpose

Record how patient profile data is shared across dental clinics and identify access-control work needed before changing implementation.

## Working product decision

The same person profile may be linked to more than one clinic. Shared profile fields such as the patient's name, phone number, and address should be treated as person-level data: an authorized update to the shared profile is visible to other clinics linked to that same person.

Clinic-specific information, such as the clinic's patient number, remains on the clinic affiliation and is not shared as a single global value.

This is the agreed working direction for the audit; the implementation must continue to enforce clinic membership and role-based permissions on the server.

## Code reviewed

Repository: `pariwit12/5-ecosystem-monorepo`

- `ecosystem-backend-nest-js/src/modules/person/person.controller.ts`
- `ecosystem-backend-nest-js/src/modules/person/queries/get-dental-patients.handler.ts`
- `ecosystem-backend-nest-js/src/modules/person/queries/get-dental-patient-by-id.handler.ts`
- `ecosystem-backend-nest-js/src/modules/person/commands/update-dental-patient.handler.ts`
- `ecosystem-backend-nest-js/src/modules/person/commands/create-dental-patient.handler.ts`
- `ecosystem-backend-nest-js/src/modules/person/services/dental-clinic-staff-access.service.ts`

This was a source-code review only. No production database or patient records were accessed, and no tests or builds were run for this audit.

## Findings

### 1. Shared person profile is supported

- The patient list query scopes results through `PersonDentalPatientAffiliation` for the selected clinic, then reads profile fields, including `phone`, from the related `Person` record.
- The patient detail query checks the selected clinic's affiliation before returning the shared profile.
- The update handler checks the selected clinic's affiliation and updates the shared `Person` record using `person.updateMany`.
- The patient creation handler can reuse an existing person when a matching identity document is found, then create a clinic affiliation for that person.

Therefore, an update to a shared `Person` profile can be seen by other clinics linked to that same person. This is a code-path conclusion, not a claim that every endpoint or permission rule is already correct.

### 2. Clinic membership checks exist on the reviewed patient paths

The list and detail handlers call `DentalClinicStaffAccessService.verify`, and the update handler also verifies staff access and checks that the patient has an affiliation with the selected clinic. The create handler checks that the creator is affiliated with the requested clinic.

These checks are important and should be retained. Tests should ensure that one clinic cannot read or update a patient who is not affiliated with that clinic.

### 3. Role-specific patient permissions are not fully enforced in the reviewed paths

- `DentalClinicStaffAccessService.verify` returns the staff role after verifying clinic membership.
- The reviewed update handler does not use that role to restrict which staff roles may update patient profile fields.
- The reviewed create handler checks clinic staff affiliation, but the inspected code does not restrict creation to dentists.

The agreed policy to carry forward is:
- Receptionists may view the Thai national ID for patients belonging to their clinic, but may not edit it.
- Receptionists may view and edit patient name, phone number, and address.
- Receptionists may not create patient records.
- Only dentists may create patient records.
- Permissions for other staff roles and dentists' other actions remain undecided unless separately specified.

These rules must be enforced by the backend, not only by the frontend. The existing identity-document routes and any alternate patient write paths should be reviewed before implementation.

### 4. Sensitive identity data requires special care

Thai national ID values must not be copied into application logs, error messages, analytics, or audit messages. Log the action and relevant record reference without recording the full ID value.

## Recommended tests before or alongside implementation

1. A staff member can list and retrieve only patients affiliated with their selected clinic.
2. A staff member from Clinic A cannot retrieve or update a patient affiliated only with Clinic B.
3. An authorized receptionist can update permitted shared profile fields, and the updated values are returned when the same person is fetched through another clinic where they are affiliated.
4. A receptionist cannot edit the Thai national ID or other identity-document values.
5. A receptionist cannot create a patient record.
6. A dentist can create a patient record, subject to the intended clinic membership rules.
7. Other staff roles are denied patient actions until their permissions are explicitly defined.
8. Clinic-specific patient numbers remain distinct between clinics.
9. Concurrent updates preserve the existing version-conflict behavior.
10. Error and audit logging never includes the full Thai national ID.

## Proposed implementation sequence

1. Finish reviewing all patient read/write paths, including identity-document operations.
2. Confirm permissions for roles other than receptionists and dentists.
3. Implement backend role checks and field-level allowlists.
4. Add or update unit/integration tests for permitted actions, denied actions, and cross-clinic isolation.
5. Run the relevant test suite and type checks, and report actual results before proposing a code PR.

## Scope and safety

This PR is documentation only. It does not change application code, schema, permissions, or data. It does not access production data. No PR should be merged without explicit approval.
