import assert from 'node:assert/strict';
import test from 'node:test';
import { mapTargetIdentityState } from './common/target-state-extraction.mjs';

test('builds minimal target matching state without account or profile data', () => {
  const state = mapTargetIdentityState({
    persons: [
      { id: 'person-1', clerk_id: 'must-not-leak', first_name: 'Hidden' },
    ],
    documents: [
      {
        person_id: 'person-1',
        type: 'PASSPORT',
        issuing_country: 'GB',
        normalized_value: 'AB12345',
      },
    ],
    legacyIdentities: [
      {
        person_id: 'person-1',
        source: 'legacy-dental-clinic',
        entity_type: 'patients',
        legacy_id: 4,
      },
    ],
    patientRoles: [{ person_id: 'person-1' }],
    staffRoles: [],
    dentistRoles: [{ person_id: 'person-1' }],
  });

  assert.deepEqual(state.persons[0], {
    id: 'person-1',
    identityDocuments: [
      {
        type: 'PASSPORT',
        issuingCountry: 'GB',
        normalizedValue: 'AB12345',
      },
    ],
    legacyIdentities: [
      {
        source: 'legacy-dental-clinic',
        entityType: 'patients',
        legacyId: 4,
      },
    ],
    roles: ['PATIENT', 'DENTIST'],
  });
  assert.ok(!('clerkId' in state.persons[0]));
  assert.ok(!('firstName' in state.persons[0]));
});
