const documentKey = (document) =>
  `${document.type}:${document.issuingCountry}:${document.normalizedValue}`;

const legacyKey = (identity) =>
  `${identity.source}:${identity.entityType}:${identity.legacyId}`;

const addOwner = (owners, key, personId) => {
  const ids = owners.get(key) ?? new Set();
  ids.add(personId);
  owners.set(key, ids);
};

const hasClinicAffiliation = (person, role, clinicId) => {
  const collection =
    {
      PATIENT: 'patients',
      STAFF: 'staff',
      DENTIST: 'dentists',
    }[role] ?? '';
  return (person.clinicAffiliations?.[collection] ?? []).some(
    (affiliation) => affiliation.clinicId === clinicId,
  );
};

export const reconcileIdentityImport = (sourcePlan, targetState, clinicId) => {
  const documentOwners = new Map();
  const legacyOwners = new Map();
  const targetPeople = new Map();
  for (const person of targetState.persons) {
    targetPeople.set(person.id, person);
    for (const document of person.identityDocuments ?? []) {
      addOwner(documentOwners, documentKey(document), person.id);
    }
    for (const identity of person.legacyIdentities ?? []) {
      addOwner(legacyOwners, legacyKey(identity), person.id);
    }
  }

  const issues = [];
  let personIssueCount = 0;
  for (const person of sourcePlan.persons) {
    const sourceReferences = person.legacyIdentities.map(
      (identity) => `${identity.entityType}:${identity.legacyId}`,
    );
    const reasons = [...person.warnings];
    const candidateIds = new Set();

    for (const document of person.identityDocuments) {
      const owners = documentOwners.get(documentKey(document)) ?? new Set();
      if (owners.size === 0) reasons.push('MISSING_IDENTITY_DOCUMENT');
      for (const owner of owners) candidateIds.add(owner);
    }
    for (const identity of person.legacyIdentities) {
      const owners = legacyOwners.get(legacyKey(identity)) ?? new Set();
      if (owners.size === 0) reasons.push('MISSING_LEGACY_IDENTITY');
      for (const owner of owners) candidateIds.add(owner);
    }

    if (candidateIds.size === 0) reasons.push('MISSING_TARGET_PERSON');
    if (candidateIds.size > 1) reasons.push('TARGET_IDENTITY_CONFLICT');
    if (candidateIds.size === 1) {
      const targetPerson = targetPeople.get([...candidateIds][0]);
      for (const role of person.roles) {
        if (!(targetPerson.roles ?? []).includes(role)) {
          reasons.push(`MISSING_${role}_ROLE`);
        }
        if (!hasClinicAffiliation(targetPerson, role, clinicId)) {
          reasons.push(`MISSING_${role}_CLINIC_AFFILIATION`);
        }
      }
    }

    if (reasons.length > 0) {
      issues.push({ sourceReferences, reasons: [...new Set(reasons)] });
      personIssueCount += 1;
    }
  }

  for (const rejected of sourcePlan.rejected) {
    issues.push({
      sourceReferences: [rejected.identity],
      reasons: [`SOURCE_REJECTED:${rejected.reason}`],
    });
  }

  const patientNumbers = new Map();
  for (const person of targetState.persons) {
    for (const affiliation of person.clinicAffiliations?.patients ?? []) {
      if (affiliation.clinicId !== clinicId) continue;
      if (!affiliation.patientNumber) {
        issues.push({
          sourceReferences: [],
          reasons: ['EMPTY_PATIENT_NUMBER'],
        });
        continue;
      }
      const owners = patientNumbers.get(affiliation.patientNumber) ?? new Set();
      owners.add(person.id);
      patientNumbers.set(affiliation.patientNumber, owners);
    }
  }
  const duplicatePatientNumbers = [...patientNumbers.values()].filter(
    (owners) => owners.size > 1,
  ).length;
  if (duplicatePatientNumbers > 0) {
    issues.push({
      sourceReferences: [],
      reasons: ['DUPLICATE_PATIENT_NUMBER'],
    });
  }

  return {
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    sourcePersons: sourcePlan.persons.length,
    reconciledPersons: sourcePlan.persons.length - personIssueCount,
    issues,
    duplicatePatientNumbers,
  };
};

export const summarizeIdentityReconciliation = (result) => ({
  status: result.status,
  sourcePersons: result.sourcePersons,
  reconciledPersons: result.reconciledPersons,
  issueGroups: result.issues.length,
  duplicatePatientNumbers: result.duplicatePatientNumbers,
  issueReasons: Object.fromEntries(
    [...new Set(result.issues.flatMap((issue) => issue.reasons))].map(
      (reason) => [
        reason,
        result.issues.filter((issue) => issue.reasons.includes(reason)).length,
      ],
    ),
  ),
});
