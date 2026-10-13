import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildIdentityPlan,
  summarizeIdentityPlan,
} from './common/identity-mapping.mjs';

test('merges matching CID records into one person with multiple roles', () => {
  const records = [
    {
      source: 'patients',
      legacyId: 1,
      cid: '1111111111111',
      firstName: 'Same',
    },
    {
      source: 'staff',
      legacyId: 2,
      cid: '1111111111111',
      firstName: 'Same',
    },
  ];
  const plan = buildIdentityPlan(records);

  assert.equal(plan.persons.length, 1);
  assert.deepEqual(plan.persons[0].roles, ['PATIENT', 'STAFF']);
  assert.equal(plan.persons[0].legacyIdentities.length, 2);
});

test('never merges missing-CID records by name', () => {
  const plan = buildIdentityPlan([
    { source: 'patients', legacyId: 1, firstName: 'Same', lastName: 'Name' },
    { source: 'patients', legacyId: 2, firstName: 'Same', lastName: 'Name' },
  ]);

  assert.equal(plan.persons.length, 2);
  assert.equal(plan.manualReview.length, 2);
  assert.ok(
    plan.manualReview.every((item) =>
      item.reasons.includes('MISSING_CID_NO_AUTOMATIC_MERGE'),
    ),
  );
});

test('flags conflicting profile values for the same CID', () => {
  const plan = buildIdentityPlan([
    {
      source: 'patients',
      legacyId: 1,
      cid: '1111111111111',
      firstName: 'First',
    },
    {
      source: 'doctors',
      legacyId: 3,
      cid: '1111111111111',
      firstName: 'Different',
    },
  ]);

  assert.deepEqual(plan.manualReview[0].conflictFields, ['firstName']);
});

test('rejects invalid CID and duplicate source identity', () => {
  const records = [
    { source: 'patients', legacyId: 1, cid: 'invalid' },
    { source: 'staff', legacyId: 2, cid: '2222222222222' },
    { source: 'staff', legacyId: 2, cid: '3333333333333' },
  ];
  const plan = buildIdentityPlan(records);
  const summary = summarizeIdentityPlan(records, plan);

  assert.deepEqual(summary.rejectionReasons, {
    INVALID_CID: 1,
    DUPLICATE_LEGACY_IDENTITY: 1,
  });
});
