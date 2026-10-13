# Legacy dental-clinic inventory

This inventory is based on a read-only review of the legacy projects. It is a planning document, not a migration script. The first concrete mapping batch is documented in [migration-batch-001-identity-patient-foundation.md](migration-batch-001-identity-patient-foundation.md).

## Legacy database models

The legacy Prisma schema currently contains these domains:

| Legacy model          | Domain                       | Target status                                                               |
| --------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| `patients`            | Patient records              | Target foundation implemented; import pending                               |
| `doctors`             | Dentist records              | Target role and clinic affiliation implemented; import pending              |
| `staff`               | Staff records                | Target role, clinic affiliation, and invitation implemented; import pending |
| `appointments`        | Appointments                 | Target model not implemented                                                |
| `doctor_schedules`    | Dentist schedules            | Target model not finalized                                                  |
| `clinic_queue`        | Clinic queue                 | Target model not implemented                                                |
| `visits`              | Visits/treatment visits      | Target model not implemented                                                |
| `visit_procedures`    | Procedures per visit         | Target model not implemented                                                |
| `procedures`          | Procedure catalog            | Target catalog foundation implemented; import pending                       |
| `money_received`      | Payments                     | Target model not implemented                                                |
| `payment_methods`     | Payment methods              | Target clinic catalog implemented; import pending                           |
| `continue_tx_list`    | Continuing treatment catalog | Target model not implemented                                                |
| `continue_tx_patient` | Continuing treatment records | Target model not implemented                                                |
| `doctor_fee_rates`    | Dentist fee rules            | Target default/override schema implemented; import pending                  |
| `feedback_surveys`    | Feedback                     | Target model not implemented                                                |
| `image_urls`          | Patient images               | Storage and ownership decision required                                     |
| `io_exam_patient`     | Intraoral examination        | Target model not implemented                                                |
| `io_finding_list`     | Examination findings         | Target model not implemented                                                |

## First-batch conclusion

The identity and patient foundation is implemented. Authentication lives in `UserAccount`; real-person profile and globally unique CID live in `Person`; dentist, staff, and patient roles use separate tables and clinic affiliations. The next migration step is a read-only legacy extractor and reconciliation report, not a direct production import.

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

## Deferred decisions

- Patient self-service account linking will be designed with the patient portal; CID alone must never authorize linking.
- Whether historical payments and visits are imported as immutable history.
- Where patient images will be stored and how old URLs are validated.
- Which legacy fields are required for the first production release.
