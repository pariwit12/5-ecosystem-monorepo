# Step 10 — Patient Endpoint Permission Implementation Plan

## Status

Planning only. This document records proposed changes for review. No application code is changed by this plan.

## Goal

Enforce the agreed patient-information permissions in the backend, while retaining clinic-level access checks. Permission checks must happen on the server; hiding fields in the frontend is not sufficient.

## Agreed permission rules

All access is limited to patients affiliated with the selected clinic.

| Action / field | Receptionist | Dentist | Manager | Admin |
|---|---|---|---|---|
| View patient name | Yes | Yes | Yes | Yes |
| View Thai national ID / identity documents | Yes | No | Yes | Yes |
| View phone number | Yes | No | Yes | Yes |
| View address | Yes | No | Yes | Yes |
| Edit patient name, phone, address | Yes | No | No | Yes |
| Edit Thai national ID / identity documents | No | No | No | Yes |
| Create patient record | No | Yes | No | Yes |
| View dental records | Yes | Yes, within allowed patient access | Yes | Yes |
| Edit dental records | No | Only own records | No | Yes, all dentists' records in clinic |

Dentists may create dental records and may edit only records belonging to themselves. They must not edit another dentist's record. Dental-record ownership checks are outside the immediate patient-profile implementation, but must remain a separate required permission check.

## Findings from source review

1. `GetDentalPatientByIdHandler` returns identity document values and the legacy `cid` field after checking clinic access, without filtering by role.
2. `GetDentalPatientsHandler` returns phone numbers. This leaks a field to dentists even though their view is limited to patient name.
3. `UpdateDentalPatientHandler` verifies staff clinic membership but does not enforce the role's editable fields. It updates shared `Person` profile data.
4. `CreateDentalPatientHandler` verifies staff affiliation but does not enforce the agreed role rule. The agreed rule allows Dentist and Admin to create patient records, not Receptionist or Manager.
5. `DentalClinicStaffAccessService.verify` returns a staff role. Dentist affiliation is stored separately, so dentist access needs a deliberate design rather than assuming every dentist is staff.
6. The currently reviewed `Person` model does not include an address field. Locate the actual address storage and its endpoints before implementing address permissions.

## Proposed implementation steps

### A. Centralize and enforce access decisions

- Keep clinic affiliation checks on every patient request.
- Add explicit, reusable checks for staff role and dentist affiliation as appropriate.
- Do not trust a role or clinic identifier supplied by the client.
- Ensure a person from another clinic cannot be accessed by guessing their ID.

### B. Return role-specific patient data

- Receptionist: patient name, phone, and other agreed ordinary profile fields; may see identity documents.
- Dentist: patient name only from the patient profile endpoints; do not return phone, address, birth date, Thai CID, passport, or other identity-document values unless a later explicit decision changes this.
- Manager: may view patient profile information, including identity documents, but cannot modify it.
- Admin: may view all patient profile fields, including identity documents.
- Avoid returning redundant sensitive fields such as both `cid` and the same value in `identityDocuments` unless a caller genuinely needs both.

### C. Restrict profile updates

- Receptionist may edit ordinary patient fields only; reject attempts to edit identity documents or protected fields.
- Admin may edit ordinary patient fields and identity documents.
- Dentist and Manager cannot update patient profile information.
- Keep optimistic version checks and clinic-affiliation checks.
- Avoid accepting unknown or disallowed fields silently; validate update DTOs strictly.

### D. Restrict patient creation

- Allow Dentist and Admin only, after verifying their affiliation with the selected clinic.
- Reject Receptionist and Manager with a forbidden response.
- Keep patient creation and clinic affiliation changes within the same transaction.
- Ensure creation does not accidentally overwrite a globally matched person's existing profile data.
- Decide which identity fields a dentist is allowed to submit during creation; the agreed viewing rule does not automatically mean a dentist needs to handle identity numbers.

### E. Tests

Add or update tests for:
- Each role's permitted and forbidden profile fields.
- Full identity-document values never appearing in dentist responses.
- Phone/address not appearing in dentist responses.
- Receptionist cannot update CID or create a patient.
- Manager cannot update or create a patient.
- Admin can update identity documents and create a patient.
- Dentist can create a patient but cannot update profile information.
- Clinic isolation and unaffiliated-user denial.
- Validation rejects attempts to smuggle protected fields into update requests.

## Suggested file areas

- `src/modules/person/services/dental-clinic-staff-access.service.ts`
- `src/modules/person/queries/get-dental-patients.handler.ts`
- `src/modules/person/queries/get-dental-patient-by-id.handler.ts`
- `src/modules/person/commands/update-dental-patient.handler.ts`
- `src/modules/person/commands/create-dental-patient.handler.ts`
- Related DTOs and unit tests in `src/modules/person/`

## Important cautions

- `Person` profile data is shared across clinics when the same person is linked to multiple clinics. A receptionist editing shared profile data may affect what linked clinics see. This behavior was previously accepted as the working assumption, but should be kept visible during implementation.
- The exact address storage and any additional patient endpoints have not yet been identified. Search for them before claiming the address rule is fully enforced.
- This is a plan, not proof of a complete audit. Dental-record endpoints require a separate ownership/role audit before those permissions can be considered implemented.

## Acceptance criteria

- Backend responses expose only fields permitted for the caller's role.
- Backend writes enforce both clinic access and role/action permission.
- All important allow/deny cases have automated tests.
- No changes are merged until the plan and implementation PR are reviewed.
