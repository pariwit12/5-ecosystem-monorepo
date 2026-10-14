# Step 7 — Patient Role Permissions Decision

## Status

- Permission decisions recorded from the product discussion on 2026-10-14.
- Documentation only. No application code or database was changed.
- Implementation must wait for review and explicit approval of this permission plan.

## Confirmed receptionist permissions

For patients belonging to the receptionist's own clinic:

| Capability | Receptionist permission |
|---|---|
| View patient Thai national ID | Allowed: all 13 digits |
| Edit patient Thai national ID | Not allowed |
| View patient name | Allowed |
| Edit patient name | Allowed |
| View patient phone number | Allowed |
| Edit patient phone number | Allowed |
| View patient address | Allowed |
| Edit patient address | Allowed |
| Create a patient record | Not allowed |

Only dentists may create patient records, as explicitly decided in the discussion. Do not infer that dentists have unrestricted access to all other patient fields; other role permissions still need to be defined.

## Security and implementation requirements

1. Enforce clinic membership on every patient read and write; a staff member must not access or change a patient through another clinic's ID.
2. Enforce permissions on the server/API, not only by hiding controls in the frontend.
3. Treat the Thai national ID as sensitive personal data. Receptionists may view the full value for identity verification, but must not edit it. Avoid including the full value in application logs, errors, analytics, or audit messages.
4. Record relevant access and changes for accountability without copying sensitive ID values into logs.
5. Confirm the shared-person-profile behavior before implementation: changing a name, phone number, or address in one clinic may affect a Person record shared with another clinic. Do not assume cross-clinic propagation is acceptable.
6. Add tests for allowed and denied actions, including cross-clinic access, receptionist attempts to create records, and attempts to edit Thai ID numbers.
7. Preserve the existing Clerk-based staff authentication direction. Staff/doctor account migration is being handled separately by the project owner.

## Not yet decided

This document does not define all permissions for dentists, administrators, managers, or other staff roles. It also does not settle whether patient profile edits are clinic-specific or shared across clinics. Those details must be reviewed before implementing broader role-based authorization.

## Validation

This is a decision record only. No tests or builds were run, no production database or patient records were accessed, and no application code was changed.
