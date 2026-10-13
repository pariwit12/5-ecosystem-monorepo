import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIdentityPlan } from './common/identity-mapping.mjs';
import {
  buildIdentityWriteManifest,
  summarizeIdentityWriteManifest,
} from './common/identity-write-manifest.mjs';
import { planTargetIdentityImport } from './common/target-import-planner.mjs';

const clinicId = '00000000-0000-7000-8000-000000000010';

const prepare = (records, persons = []) => {
  const sourcePlan = buildIdentityPlan(records);
  const targetPlan = planTargetIdentityImport(sourcePlan, { persons });
  return { sourcePlan, targetPlan };
};

test('prepares ordered create operations with transactional patient number allocation', () => {
  const { sourcePlan, targetPlan } = prepare([
    {
      source: 'patients',
      legacyId: 1,
      cid: '1111111111111',
      firstName: 'Sample',
    },
  ]);
  const manifest = buildIdentityWriteManifest(sourcePlan, targetPlan, clinicId);
  const operationTypes = manifest.persons[0].operations.map(
    (operation) => operation.type,
  );
  const affiliation = manifest.persons[0].operations.find(
    (operation) => operation.type === 'ENSURE_PATIENT_CLINIC_AFFILIATION',
  );

  assert.deepEqual(operationTypes, [
    'CREATE_PERSON',
    'ENSURE_IDENTITY_DOCUMENT',
    'ENSURE_LEGACY_IDENTITY',
    'ENSURE_PATIENT_ROLE',
    'ENSURE_PATIENT_CLINIC_AFFILIATION',
  ]);
  assert.equal(
    affiliation.patientNumber.strategy,
    'ALLOCATE_NEXT_TRANSACTIONALLY',
  );
});

test('reuses a person without planning a profile update', () => {
  const record = {
    source: 'patients',
    legacyId: 1,
    cid: '1111111111111',
    firstName: 'Must not overwrite',
  };
  const { sourcePlan, targetPlan } = prepare(
    [record],
    [
      {
        id: 'person-1',
        identityDocuments: [
          {
            type: 'THAI_CID',
            issuingCountry: 'TH',
            normalizedValue: '1111111111111',
          },
        ],
        roles: ['PATIENT'],
      },
    ],
  );
  const manifest = buildIdentityWriteManifest(sourcePlan, targetPlan, clinicId);

  assert.equal(manifest.persons[0].mode, 'REUSE');
  assert.ok(
    manifest.persons[0].operations.every(
      (operation) => operation.type !== 'CREATE_PERSON',
    ),
  );
  assert.ok(
    manifest.persons[0].operations.every(
      (operation) => operation.type !== 'UPDATE_PERSON',
    ),
  );
});

test('preserves legacy staff role while assigning the safe default role', () => {
  const { sourcePlan, targetPlan } = prepare([
    {
      source: 'staff',
      legacyId: 7,
      cid: '1111111111111',
      legacyRole: 'front desk',
    },
  ]);
  const manifest = buildIdentityWriteManifest(sourcePlan, targetPlan, clinicId);
  const affiliation = manifest.persons[0].operations.find(
    (operation) => operation.type === 'ENSURE_STAFF_CLINIC_AFFILIATION',
  );

  assert.equal(affiliation.role, 'OTHER');
  assert.equal(affiliation.legacyRole, 'front desk');
});

test('refuses to prepare writes while source rejection or manual review remains', () => {
  const rejected = prepare([
    { source: 'patients', legacyId: 0, cid: '1111111111111' },
  ]);
  const review = prepare([{ source: 'patients', legacyId: 1 }]);

  assert.throws(
    () =>
      buildIdentityWriteManifest(
        rejected.sourcePlan,
        rejected.targetPlan,
        clinicId,
      ),
    /SOURCE_RECORDS_REJECTED/,
  );
  assert.throws(
    () =>
      buildIdentityWriteManifest(
        review.sourcePlan,
        review.targetPlan,
        clinicId,
      ),
    /MANUAL_REVIEW_REQUIRED/,
  );
});

test('summarizes the manifest without exposing identity values', () => {
  const { sourcePlan, targetPlan } = prepare([
    { source: 'doctors', legacyId: 3, cid: '2222222222222' },
  ]);
  const summary = summarizeIdentityWriteManifest(
    buildIdentityWriteManifest(sourcePlan, targetPlan, clinicId),
  );

  assert.deepEqual(summary, {
    persons: 1,
    createPersons: 1,
    reusePersons: 0,
    operations: 5,
    patientAffiliations: 0,
    staffAffiliations: 0,
    dentistAffiliations: 1,
  });
  assert.equal(JSON.stringify(summary).includes('2222222222222'), false);
});
