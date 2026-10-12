# Legacy dental-clinic inventory

This inventory is based on a read-only review of the legacy projects. It is a planning document, not a migration script. The first concrete mapping batch is documented in [migration-batch-001-identity-patient-foundation.md](migration-batch-001-identity-patient-foundation.md).

## Legacy database models

The legacy Prisma schema currently contains these domains:

| Legacy model | Domain | Target status |
|---|---|---|
| `patients` | Patient records | Target model not finalized |
| `doctors` | Dentist records | Map to `Person` plus a dentist role/affiliation |
| `staff` | Staff records | Map to `Person` plus staff role/affiliation |
| `appointments` | Appointments | Target model not implemented |
| `doctor_schedules` | Dentist schedules | Target model not finalized |
| `clinic_queue` | Clinic queue | Target model not implemented |
| `visits` | Visits/treatment visits | Target model not implemented |
| `visit_procedures` | Procedures per visit | Target model not implemented |
| `procedures` | Procedure catalog | Target model not implemented |
| `money_received` | Payments | Target model not implemented |
| `payment_methods` | Payment methods | Target model not implemented |
| `continue_tx_list` | Continuing treatment catalog | Target model not implemented |
| `continue_tx_patient` | Continuing treatment records | Target model not implemented |
| `doctor_fee_rates` | Dentist fee rules | Target model not implemented |
| `feedback_surveys` | Feedback | Target model not implemented |
| `image_urls` | Patient images | Storage and ownership decision required |
| `io_exam_patient` | Intraoral examination | Target model not implemented |
| `io_finding_list` | Examination findings | Target model not implemented |

## First-batch conclusion

The first migration batch should be identity and patient foundation, but it is not ready for implementation yet. The target `Person` model currently only contains `clerkId`; it does not yet have profile, legacy-id, dentist, staff, or patient fields. Therefore the next implementation step is to finalize the target domain models and identity rules, not to write an import script.

## Legacy application modules

The legacy NestJS application contains modules for patients, staff, doctors, appointments, doctor schedules, clinic queue, payments, and shared filtering. The older Express/React application contains the corresponding route/controller and utility layers.

## Recommended migration order

1. Identity and organization mapping.
2. Dentists and staff.
3. Patient records and legacy identifiers.
4. Procedure catalog and payment methods.
5. Appointments and schedules.
6. Visits, treatment procedures, and payments.
7. Queue, images, examinations, feedback, and continuing treatment.

## Open decisions before implementation

- The canonical patient identifier and duplicate-patient matching rule.
- Whether dentists and staff share the `Person` table or use separate role tables.
- How old usernames/passwords map to Clerk identities.
- Whether historical payments and visits are imported as immutable history.
- Where patient images will be stored and how old URLs are validated.
- Which legacy fields are required for the first production release.
