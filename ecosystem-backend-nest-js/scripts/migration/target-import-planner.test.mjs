import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIdentityPlan } from './common/identity-mapping.mjs';
import {
  planTargetIdentityImport,
  summarizeTargetImportPlan,
} from './common/target-import-planner.mjs';

test('reuses a target person matched by document and adds missing roles', () => {
  const sourcePlan = buildIdentityPlan([
    { source: 'staff', legacyId: 7, cid: '1111111111111' },
  ]);
  const targetPlan = planTargetIdentityImport(sourcePlan, {
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
        legacyIdentities: [],
        roles: ['PATIENT'],
      },
    ],
  });

  assert.equal(targetPlan.actions[0].action, 'REUSE_PERSON');
  assert.deepEqual(targetPlan.actions[0].rolesToAdd, ['STAFF']);
  assert.equal(targetPlan.actions[0].legacyIdentitiesToAdd.length, 1);
});

test('plans a new person when no target identity matches', () => {
  const sourcePlan = buildIdentityPlan([
    { source: 'doctors', legacyId: 3, cid: '2222222222222' },
  ]);
  const targetPlan = planTargetIdentityImport(sourcePlan, { persons: [] });

  assert.equal(targetPlan.actions[0].action, 'INSERT_PERSON');
});

test('blocks warnings and conflicting target owners for manual review', () => {
  const sourcePlan = buildIdentityPlan([
    { source: 'patients', legacyId: 1, cid: '1111111111111' },
    { source: 'patients', legacyId: 2 },
  ]);
  sourcePlan.persons[0].legacyIdentities.push({
    source: 'legacy-dental-clinic',
    entityType: 'staff',
    legacyId: 9,
  });
  const targetPlan = planTargetIdentityImport(sourcePlan, {
    persons: [
      {
        id: 'person-by-document',
        identityDocuments: [
          {
            type: 'THAI_CID',
            issuingCountry: 'TH',
            normalizedValue: '1111111111111',
          },
        ],
      },
      {
        id: 'person-by-legacy',
        legacyIdentities: [
          {
            source: 'legacy-dental-clinic',
            entityType: 'staff',
            legacyId: 9,
          },
        ],
      },
    ],
  });
  const summary = summarizeTargetImportPlan(targetPlan);

  assert.equal(summary.manualReview, 2);
  assert.equal(summary.insertPersons, 0);
});
