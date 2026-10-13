const documentKey = (document) =>
  `${document.type}:${document.issuingCountry}:${document.normalizedValue}`;

const legacyKey = (identity) =>
  `${identity.source}:${identity.entityType}:${identity.legacyId}`;

export const planTargetIdentityImport = (sourcePlan, targetState) => {
  const documentOwners = new Map();
  const legacyOwners = new Map();
  const targetPeople = new Map();

  for (const person of targetState.persons) {
    targetPeople.set(person.id, person);
    for (const document of person.identityDocuments ?? []) {
      documentOwners.set(documentKey(document), person.id);
    }
    for (const identity of person.legacyIdentities ?? []) {
      legacyOwners.set(legacyKey(identity), person.id);
    }
  }

  const actions = [];
  for (const person of sourcePlan.persons) {
    if (person.warnings.length > 0) {
      actions.push({
        identityKey: person.identityKey,
        action: 'MANUAL_REVIEW',
        reasons: person.warnings,
      });
      continue;
    }

    const candidateIds = new Set([
      ...person.identityDocuments
        .map((document) => documentOwners.get(documentKey(document)))
        .filter(Boolean),
      ...person.legacyIdentities
        .map((identity) => legacyOwners.get(legacyKey(identity)))
        .filter(Boolean),
    ]);

    if (candidateIds.size > 1) {
      actions.push({
        identityKey: person.identityKey,
        action: 'MANUAL_REVIEW',
        reasons: ['TARGET_IDENTITY_CONFLICT'],
      });
      continue;
    }

    const targetPersonId = [...candidateIds][0];
    if (!targetPersonId) {
      actions.push({
        identityKey: person.identityKey,
        action: 'INSERT_PERSON',
        identityDocumentsToAdd: person.identityDocuments,
        rolesToAdd: person.roles,
        legacyIdentitiesToAdd: person.legacyIdentities,
      });
      continue;
    }

    const targetPerson = targetPeople.get(targetPersonId);
    const existingRoles = new Set(targetPerson.roles ?? []);
    const existingDocuments = new Set(
      (targetPerson.identityDocuments ?? []).map(documentKey),
    );
    const existingLegacyIdentities = new Set(
      (targetPerson.legacyIdentities ?? []).map(legacyKey),
    );
    actions.push({
      identityKey: person.identityKey,
      action: 'REUSE_PERSON',
      targetPersonId,
      identityDocumentsToAdd: person.identityDocuments.filter(
        (document) => !existingDocuments.has(documentKey(document)),
      ),
      rolesToAdd: person.roles.filter((role) => !existingRoles.has(role)),
      legacyIdentitiesToAdd: person.legacyIdentities.filter(
        (identity) => !existingLegacyIdentities.has(legacyKey(identity)),
      ),
    });
  }

  return { actions, rejected: sourcePlan.rejected };
};

export const summarizeTargetImportPlan = (targetPlan) => {
  const count = (action) =>
    targetPlan.actions.filter((item) => item.action === action).length;
  return {
    insertPersons: count('INSERT_PERSON'),
    reusePersons: count('REUSE_PERSON'),
    manualReview: count('MANUAL_REVIEW'),
    rejectedSourceRecords: targetPlan.rejected.length,
    rolesToAdd: targetPlan.actions.reduce(
      (total, item) => total + (item.rolesToAdd?.length ?? 0),
      0,
    ),
    legacyIdentitiesToAdd: targetPlan.actions.reduce(
      (total, item) => total + (item.legacyIdentitiesToAdd?.length ?? 0),
      0,
    ),
    identityDocumentsToAdd: targetPlan.actions.reduce(
      (total, item) => total + (item.identityDocumentsToAdd?.length ?? 0),
      0,
    ),
  };
};
