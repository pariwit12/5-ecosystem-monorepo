import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIdentityPlan } from './common/identity-mapping.mjs';
import {
  reconcileIdentityImport,
  summarizeIdentityReconciliation,
} from './common/identity-reconciliation.mjs';

const clinicId = 'clinic-1';
const sourcePlan = () =>
  buildIdentityPlan([
    { source: 'patients', legacyId: 1, cid: '1111111111111' },
    {
      source: 'staff',
      legacyId: 7,
      cid: '1111111111111',
      legacyRole: 'staff',
    },
  ]);

const completeTarget = () => ({
  persons: [
    {
      id: 'person-1',
      identityDocuments: [
        {
          type: 'THAI_CID',
          issuingCountry: 'TH',
          normalizedValue: '1111111111111',
        },
      ],
      legacyIdentities: [
        {
          source: 'legacy-dental-clinic',
          entityType: 'patients',
          legacyId: 1,
        },
        {
          source: 'legacy-dental-clinic',
          entityType: 'staff',
          legacyId: 7,
        },
      ],
      roles: ['PATIENT', 'STAFF'],
      clinicAffiliations: {
        patients: [{ clinicId, patientNumber: '1' }],
        staff: [{ clinicId, role: 'OTHER', legacyRole: 'staff' }],
        dentists: [],
      },
    },
  ],
});

test('passes when identities, roles, affiliations, and HN are complete', () => {
  const result = reconcileIdentityImport(
    sourcePlan(),
    completeTarget(),
    clinicId,
  );

  assert.deepEqual(summarizeIdentityReconciliation(result), {
    status: 'PASS',
    sourcePersons: 1,
    reconciledPersons: 1,
    issueGroups: 0,
    duplicatePatientNumbers: 0,
    issueReasons: {},
  });
});

test('reports missing role and clinic affiliation without exposing document values', () => {
  const target = completeTarget();
  target.persons[0].roles = ['PATIENT'];
  target.persons[0].clinicAffiliations.staff = [];
  const result = reconcileIdentityImport(sourcePlan(), target, clinicId);
  const summary = summarizeIdentityReconciliation(result);

  assert.equal(summary.status, 'FAIL');
  assert.equal(summary.issueReasons.MISSING_STAFF_ROLE, 1);
  assert.equal(summary.issueReasons.MISSING_STAFF_CLINIC_AFFILIATION, 1);
  assert.equal(JSON.stringify(summary).includes('1111111111111'), false);
});

test('reports identities split across target people', () => {
  const target = completeTarget();
  target.persons.push({
    id: 'person-2',
    identityDocuments: [],
    legacyIdentities: [target.persons[0].legacyIdentities.pop()],
    roles: ['STAFF'],
    clinicAffiliations: { patients: [], staff: [], dentists: [] },
  });
  const result = reconcileIdentityImport(sourcePlan(), target, clinicId);

  assert.equal(
    summarizeIdentityReconciliation(result).issueReasons
      .TARGET_IDENTITY_CONFLICT,
    1,
  );
});

test('detects duplicate HN values in the target clinic', () => {
  const target = completeTarget();
  target.persons.push({
    id: 'person-2',
    identityDocuments: [],
    legacyIdentities: [],
    roles: ['PATIENT'],
    clinicAffiliations: {
      patients: [{ clinicId, patientNumber: '1' }],
      staff: [],
      dentists: [],
    },
  });
  const result = reconcileIdentityImport(sourcePlan(), target, clinicId);

  assert.equal(result.duplicatePatientNumbers, 1);
  assert.equal(result.status, 'FAIL');
});
