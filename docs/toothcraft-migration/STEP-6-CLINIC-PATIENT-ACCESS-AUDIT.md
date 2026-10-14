# Step 6 — Clinic Patient Access Audit

## Scope

Read-only review of the current NestJS patient handlers, clinic staff access service, Clerk guard, and their unit-test files. This review did not access a production database or patient records. Tests were inspected but not executed.

## Findings

### Clinic boundaries are present in the inspected handlers

- `GET /api/person/dental-patients` calls `DentalClinicStaffAccessService.verify` before querying and filters patient affiliations by the requested clinic ID.
- `GET /api/person/dental-patients/:person_id` verifies staff membership and looks up the patient's affiliation using both the patient ID and clinic ID.
- `PATCH /api/person/dental-patients/:person_id` verifies staff membership and confirms the patient has an affiliation with the requested clinic before updating.
- `POST /api/person/dental-patients` checks that the Clerk account belongs to staff with an active affiliation to the requested clinic before creating or affiliating a patient.
- The controller applies `ClerkAuthGuard` and passes the verified Clerk subject to these handlers.

Relevant code:
- `ecosystem-backend-nest-js/src/modules/person/person.controller.ts`
- `ecosystem-backend-nest-js/src/common/guards/clerk-auth.guard.ts`
- `ecosystem-backend-nest-js/src/modules/person/services/dental-clinic-staff-access.service.ts`
- Patient list/detail handlers and create/update handlers under `ecosystem-backend-nest-js/src/modules/person/`

### Existing unit-test coverage is useful but incomplete

Tests currently cover examples such as denied list access, a patient not affiliated with the selected clinic, a creator without clinic staff affiliation, and update concurrency conflicts. These are unit tests with mocked dependencies; they do not by themselves prove end-to-end behavior through a running API and real authorization configuration.

Recommended test additions:
1. Patient in Clinic B cannot be fetched or updated using Clinic A's ID.
2. Staff affiliated only with Clinic B cannot list or create patients in Clinic A.
3. Unauthenticated or invalid Clerk tokens are rejected at the controller boundary.
4. Any role-specific permissions are enforced if different staff roles should have different capabilities.

## Questions and risks to resolve

1. **Role permissions:** The access service returns a clinic role, but the inspected patient handlers do not appear to enforce role-specific differences. Confirm whether receptionists, dentists, and administrators should have different read/update permissions.
2. **Shared person profile:** Patient affiliations are clinic-specific, but the update handler modifies the shared `Person` record. Confirm whether a profile change made at one clinic is intentionally visible to other clinics that share the same person record.
3. **Sensitive identity documents:** The detail endpoint returns identity-document values. Confirm which roles may view full Thai national ID values and whether masking is required.
4. **Legacy data mapping:** This audit does not yet map all legacy fields. Insurance type/balance, LINE identity/linking, and other legacy patient fields still need a separate field-by-field mapping.
5. **Runtime validation:** No tests, build, or live API checks were run as part of this source-only review.

## Conclusion

The inspected patient endpoints already contain clinic-membership checks and clinic-scoped patient lookups. This is a positive initial finding, not a guarantee of complete security. Next, define role permissions and shared-profile rules, add explicit cross-clinic tests, and then run the relevant test suite before migrating more patient features.

No application code was changed. No production database or real patient records were accessed.
