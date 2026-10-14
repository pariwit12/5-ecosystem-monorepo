# Step 11 — Patient Permission Implementation Notes

## Status

Implementation changes are proposed on the `security/patient-role-permissions` branch for review. This document does not claim that every patient-data permission is complete.

## Implemented in this change

- Patient list and detail handlers verify clinic access and allow only Admin, Manager, Receptionist, and Dentist roles.
- Dentist affiliation is checked separately from staff affiliation.
- Dentist patient-list results contain the patient name and clinic patient number, without nickname, phone, birth date, or identity-document values.
- Dentist search is limited to patient name and clinic patient number, so phone numbers and identity documents cannot be used as hidden search filters.
- Receptionists may update first name, last name, nickname, and phone, but may not update birth date.
- Managers and dentists cannot update patient profile information.
- Admins may update the fields currently supported by the update DTO.
- Patient creation is restricted to a dentist affiliated with the clinic or an Admin affiliated as clinic staff.
- Dentist patient creation is blocked when the request includes a Thai CID or another identity document. This is a least-privilege default until the product owner explicitly approves a different rule.
- Update and create DTOs reject unknown fields instead of silently accepting them.
- Unit tests were added for role filtering, clinic affiliation access, and allowed/denied writes.

## Findings and limitations

### Address is not modeled in the current backend schema

The reviewed `Person` model has first name, last name, nickname, phone, and birth date, but no patient address field. The clinic model has an old commented-out address field for the clinic itself; that is not a patient address. No patient-address endpoint was found in the repository tree during this review.

Therefore, this change does not add address storage or an address endpoint. The address permission rule cannot be enforced until the intended patient-address data model and API are defined.

### Identity-document editing is not currently exposed by the patient update DTO

The existing patient update endpoint does not accept identity-document edits. This change rejects unknown update fields and does not create a new identity-document editing contract. The existing detail endpoint continues to return identity documents to Receptionists, Managers, and Admins, but not Dentists. A dedicated Admin-only identity-document edit flow remains follow-up work.

### Dental-record permissions are separate

This change does not audit or modify dental-record create/edit endpoints. Dentist ownership checks and Admin access to all dentists' records within the same clinic remain a separate required task.

## Validation

Tests and type checks have not been run in a local checkout as part of preparing this remote branch. Review the pull-request checks before merging. No production database or patient records were accessed.
