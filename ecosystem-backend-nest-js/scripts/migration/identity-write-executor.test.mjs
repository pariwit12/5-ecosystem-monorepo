import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIdentityPlan } from './common/identity-mapping.mjs';
import { executeIdentityWriteManifest } from './common/identity-write-executor.mjs';
import { buildIdentityWriteManifest } from './common/identity-write-manifest.mjs';
import { planTargetIdentityImport } from './common/target-import-planner.mjs';

const clinicId = '00000000-0000-7000-8000-000000000010';

const manifestFor = (records, persons = []) => {
  const sourcePlan = buildIdentityPlan(records);
  const targetPlan = planTargetIdentityImport(sourcePlan, { persons });
  return buildIdentityWriteManifest(sourcePlan, targetPlan, clinicId);
};

const fakePrisma = (overrides = {}) => {
  const calls = [];
  const record = (name, result) => async (input) => {
    calls.push({ name, input });
    return typeof result === 'function' ? result(input) : result;
  };
  const tx = {
    person: {
      findUnique: record('person.findUnique', { id: 'person-1' }),
      create: record('person.create', { id: 'person-new' }),
    },
    personIdentityDocument: {
      findMany: record('personIdentityDocument.findMany', []),
      createMany: record('personIdentityDocument.createMany', { count: 1 }),
    },
    personLegacyIdentity: {
      findMany: record('personLegacyIdentity.findMany', []),
      createMany: record('personLegacyIdentity.createMany', { count: 1 }),
    },
    personDentalPatient: {
      upsert: record('personDentalPatient.upsert', {}),
    },
    personDentalPatientAffiliation: {
      findUnique: record('personDentalPatientAffiliation.findUnique', null),
      create: record('personDentalPatientAffiliation.create', {}),
    },
    patientNumberSequence: {
      upsert: record('patientNumberSequence.upsert', { nextNumber: 2 }),
    },
    personStaff: { upsert: record('personStaff.upsert', {}) },
    personStaffAffiliation: {
      upsert: record('personStaffAffiliation.upsert', {}),
    },
    personDentist: { upsert: record('personDentist.upsert', {}) },
    personDentistAffiliation: {
      upsert: record('personDentistAffiliation.upsert', {}),
    },
    ...overrides.tx,
  };
  const prisma = {
    organizationDentalClinic: {
      findUnique: record('organizationDentalClinic.findUnique', {
        id: clinicId,
        deletedAt: null,
      }),
    },
    $transaction: async (callback) => callback(tx),
    ...overrides.prisma,
  };
  return { prisma, tx, calls };
};

test('creates a patient and allocates the HN inside the person transaction', async () => {
  const manifest = manifestFor([
    {
      source: 'patients',
      legacyId: 1,
      cid: '1111111111111',
      birthDate: '1990-01-01',
    },
  ]);
  const { prisma, calls } = fakePrisma();

  const summary = await executeIdentityWriteManifest(prisma, manifest);

  assert.deepEqual(summary, {
    createdPersons: 1,
    reusedPersons: 0,
    processedPersons: 1,
  });
  assert.ok(calls.some((call) => call.name === 'person.create'));
  assert.ok(calls.some((call) => call.name === 'patientNumberSequence.upsert'));
  const affiliation = calls.find(
    (call) => call.name === 'personDentalPatientAffiliation.create',
  );
  assert.equal(affiliation.input.data.patientNumber, '1');
});

test('reuses a person and existing patient affiliation without consuming an HN', async () => {
  const manifest = manifestFor([
    { source: 'patients', legacyId: 1, cid: '1111111111111' },
  ]);
  const { prisma, calls } = fakePrisma({
    tx: {
      personIdentityDocument: {
        findMany: async () => [{ personId: 'person-1' }],
        createMany: async () => ({ count: 0 }),
      },
      personDentalPatientAffiliation: {
        findUnique: async () => ({ patientNumber: '9' }),
        create: async () => {
          throw new Error('must not create an existing affiliation');
        },
      },
    },
  });

  const summary = await executeIdentityWriteManifest(prisma, manifest);

  assert.equal(summary.reusedPersons, 1);
  assert.equal(
    calls.some((call) => call.name === 'person.create'),
    false,
  );
  assert.equal(
    calls.some((call) => call.name === 'patientNumberSequence.upsert'),
    false,
  );
});

test('stops when current target identities point to different people', async () => {
  const manifest = manifestFor([
    { source: 'patients', legacyId: 1, cid: '1111111111111' },
  ]);
  const { prisma } = fakePrisma({
    tx: {
      personIdentityDocument: {
        findMany: async () => [{ personId: 'person-1' }],
        createMany: async () => ({ count: 0 }),
      },
      personLegacyIdentity: {
        findMany: async () => [{ personId: 'person-2' }],
        createMany: async () => ({ count: 0 }),
      },
    },
  });

  await assert.rejects(
    executeIdentityWriteManifest(prisma, manifest),
    /TARGET_IDENTITY_CONFLICT/,
  );
});

test('refuses a missing or deleted target clinic before starting transactions', async () => {
  const manifest = manifestFor([
    { source: 'doctors', legacyId: 3, cid: '2222222222222' },
  ]);
  const { prisma } = fakePrisma({
    prisma: {
      organizationDentalClinic: { findUnique: async () => null },
    },
  });

  await assert.rejects(
    executeIdentityWriteManifest(prisma, manifest),
    /TARGET_CLINIC_NOT_ACTIVE/,
  );
});
