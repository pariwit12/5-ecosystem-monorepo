const actionByIdentityKey = (targetPlan) =>
  new Map(targetPlan.actions.map((action) => [action.identityKey, action]));

const roleOperations = (person, clinicId) => {
  const operations = [];

  if (person.roles.includes('PATIENT')) {
    operations.push(
      { type: 'ENSURE_PATIENT_ROLE' },
      {
        type: 'ENSURE_PATIENT_CLINIC_AFFILIATION',
        clinicId,
        onExisting: 'PRESERVE',
        patientNumber: { strategy: 'ALLOCATE_NEXT_TRANSACTIONALLY' },
      },
    );
  }

  if (person.roles.includes('STAFF')) {
    operations.push(
      { type: 'ENSURE_STAFF_ROLE' },
      {
        type: 'ENSURE_STAFF_CLINIC_AFFILIATION',
        clinicId,
        role: 'OTHER',
        legacyRole: person.staff?.legacyRole ?? null,
        onExisting: 'PRESERVE',
      },
    );
  }

  if (person.roles.includes('DENTIST')) {
    operations.push(
      {
        type: 'ENSURE_DENTIST_ROLE',
        licenseNumber: person.dentist?.licenseNumber ?? null,
        onExisting: 'PRESERVE',
      },
      {
        type: 'ENSURE_DENTIST_CLINIC_AFFILIATION',
        clinicId,
        onExisting: 'PRESERVE',
      },
    );
  }

  return operations;
};

export const buildIdentityWriteManifest = (
  sourcePlan,
  targetPlan,
  clinicId,
) => {
  if (!clinicId) throw new Error('MISSING_TARGET_CLINIC_ID');
  if (sourcePlan.rejected.length > 0 || targetPlan.rejected.length > 0) {
    throw new Error('SOURCE_RECORDS_REJECTED');
  }

  const manualReview = targetPlan.actions.filter(
    (action) => action.action === 'MANUAL_REVIEW',
  );
  if (manualReview.length > 0) {
    throw new Error('MANUAL_REVIEW_REQUIRED');
  }

  const actions = actionByIdentityKey(targetPlan);
  const persons = sourcePlan.persons.map((person) => {
    const action = actions.get(person.identityKey);
    if (!action) throw new Error('TARGET_ACTION_MISSING');

    const isInsert = action.action === 'INSERT_PERSON';
    const identityDocuments = action.identityDocumentsToAdd;
    const operations = [];

    if (isInsert) {
      operations.push({ type: 'CREATE_PERSON', profile: person.profile });
    }
    operations.push(
      ...identityDocuments.map((document) => ({
        type: 'ENSURE_IDENTITY_DOCUMENT',
        document,
      })),
      ...action.legacyIdentitiesToAdd.map((identity) => ({
        type: 'ENSURE_LEGACY_IDENTITY',
        identity,
      })),
      ...roleOperations(person, clinicId),
    );

    return {
      identityKey: person.identityKey,
      mode: isInsert ? 'CREATE' : 'REUSE',
      targetPersonId: action.targetPersonId ?? null,
      transactionBoundary: 'PERSON',
      operations,
    };
  });

  return { formatVersion: 1, clinicId, persons };
};

export const summarizeIdentityWriteManifest = (manifest) => ({
  persons: manifest.persons.length,
  createPersons: manifest.persons.filter((person) => person.mode === 'CREATE')
    .length,
  reusePersons: manifest.persons.filter((person) => person.mode === 'REUSE')
    .length,
  operations: manifest.persons.reduce(
    (total, person) => total + person.operations.length,
    0,
  ),
  patientAffiliations: manifest.persons.filter((person) =>
    person.operations.some(
      (operation) => operation.type === 'ENSURE_PATIENT_CLINIC_AFFILIATION',
    ),
  ).length,
  staffAffiliations: manifest.persons.filter((person) =>
    person.operations.some(
      (operation) => operation.type === 'ENSURE_STAFF_CLINIC_AFFILIATION',
    ),
  ).length,
  dentistAffiliations: manifest.persons.filter((person) =>
    person.operations.some(
      (operation) => operation.type === 'ENSURE_DENTIST_CLINIC_AFFILIATION',
    ),
  ).length,
});
