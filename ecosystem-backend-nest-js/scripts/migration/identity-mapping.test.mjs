import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildIdentityPlan,
  summarizeIdentityPlan,
} from './common/identity-mapping.mjs';

test('maps legacy CID and merges matching documents into one person', () => {
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
  assert.deepEqual(plan.persons[0].identityDocuments, [
    {
      type: 'THAI_CID',
      issuingCountry: 'TH',
      normalizedValue: '1111111111111',
      expiresAt: null,
    },
  ]);
});

test('never merges records without identity documents by name', () => {
  const plan = buildIdentityPlan([
    { source: 'patients', legacyId: 1, firstName: 'Same', lastName: 'Name' },
    { source: 'patients', legacyId: 2, firstName: 'Same', lastName: 'Name' },
  ]);

  assert.equal(plan.persons.length, 2);
  assert.equal(plan.manualReview.length, 2);
  assert.ok(
    plan.manualReview.every((item) =>
      item.reasons.includes('MISSING_IDENTITY_DOCUMENT_NO_AUTOMATIC_MERGE'),
    ),
  );
});

test('merges a normalized passport and flags conflicting profile values', () => {
  const plan = buildIdentityPlan([
    {
      source: 'patients',
      legacyId: 1,
      identityDocument: {
        type: 'PASSPORT',
        issuingCountry: 'gb',
        value: 'ab12345',
      },
      firstName: 'First',
    },
    {
      source: 'doctors',
      legacyId: 3,
      identityDocument: {
        type: 'PASSPORT',
        issuingCountry: 'GB',
        value: 'AB12345',
      },
      firstName: 'Different',
    },
  ]);

  assert.deepEqual(plan.manualReview[0].conflictFields, ['firstName']);
});

test('sends unclassified legacy identity to review without dropping it', () => {
  const records = [{ source: 'patients', legacyId: 1, cid: 'FOREIGN-123' }];
  const plan = buildIdentityPlan(records);
  const summary = summarizeIdentityPlan(records, plan);

  assert.equal(summary.plannedPersons, 1);
  assert.equal(summary.rejectedRecords, 0);
  assert.deepEqual(summary.reviewReasons, {
    UNCLASSIFIED_LEGACY_IDENTITY_DOCUMENT: 1,
  });
});

test('rejects invalid explicit document and duplicate source identity', () => {
  const records = [
    {
      source: 'patients',
      legacyId: 1,
      identityDocument: {
        type: 'PASSPORT',
        issuingCountry: 'GB',
        value: '?',
      },
    },
    { source: 'staff', legacyId: 2, cid: '2222222222222' },
    { source: 'staff', legacyId: 2, cid: '3333333333333' },
  ];
  const plan = buildIdentityPlan(records);
  const summary = summarizeIdentityPlan(records, plan);

  assert.deepEqual(summary.rejectionReasons, {
    INVALID_PASSPORT: 1,
    DUPLICATE_LEGACY_IDENTITY: 1,
  });
});
