import assert from 'node:assert/strict';
import test from 'node:test';
import { mapLegacyIdentityRows } from './common/legacy-extraction.mjs';

test('maps only approved identity fields and excludes credentials', () => {
  const records = mapLegacyIdentityRows({
    patients: [
      {
        id: 1,
        id_number: ' FOREIGN-1 ',
        first_name: ' Patient ',
        password: 'must-not-leak',
      },
    ],
    staff: [
      {
        id: 2,
        cid: '1111111111111',
        role: 'staff',
        username: 'must-not-leak',
        password: 'must-not-leak',
      },
    ],
    doctors: [
      {
        id: 3,
        cid: null,
        license_number: ' D-1 ',
        username: 'must-not-leak',
        password: 'must-not-leak',
      },
    ],
  });

  assert.equal(records.length, 3);
  assert.equal(records[0].cid, 'FOREIGN-1');
  assert.equal(records[0].firstName, 'Patient');
  assert.equal(records[1].legacyRole, 'staff');
  assert.equal(records[2].licenseNumber, 'D-1');
  assert.ok(records.every((record) => !('password' in record)));
  assert.ok(records.every((record) => !('username' in record)));
});
