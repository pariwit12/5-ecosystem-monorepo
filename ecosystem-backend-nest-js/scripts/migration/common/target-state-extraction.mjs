export const mapTargetIdentityState = ({
  persons,
  documents,
  legacyIdentities,
  patientRoles,
  staffRoles,
  dentistRoles,
}) => {
  const byId = new Map(
    persons.map((person) => [
      person.id,
      {
        id: person.id,
        identityDocuments: [],
        legacyIdentities: [],
        roles: [],
      },
    ]),
  );

  for (const document of documents) {
    byId.get(document.person_id)?.identityDocuments.push({
      type: document.type,
      issuingCountry: document.issuing_country.trim(),
      normalizedValue: document.normalized_value,
    });
  }
  for (const identity of legacyIdentities) {
    byId.get(identity.person_id)?.legacyIdentities.push({
      source: identity.source,
      entityType: identity.entity_type,
      legacyId: Number(identity.legacy_id),
    });
  }
  const addRole = (rows, role) => {
    for (const row of rows) byId.get(row.person_id)?.roles.push(role);
  };
  addRole(patientRoles, 'PATIENT');
  addRole(staffRoles, 'STAFF');
  addRole(dentistRoles, 'DENTIST');

  return { persons: [...byId.values()] };
};
