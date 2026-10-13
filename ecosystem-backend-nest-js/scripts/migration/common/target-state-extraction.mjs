export const mapTargetIdentityState = ({
  persons,
  documents,
  legacyIdentities,
  patientRoles,
  staffRoles,
  dentistRoles,
  patientAffiliations = [],
  staffAffiliations = [],
  dentistAffiliations = [],
}) => {
  const byId = new Map(
    persons.map((person) => [
      person.id,
      {
        id: person.id,
        identityDocuments: [],
        legacyIdentities: [],
        roles: [],
        clinicAffiliations: {
          patients: [],
          staff: [],
          dentists: [],
        },
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

  for (const affiliation of patientAffiliations) {
    byId
      .get(affiliation.person_dental_patient_id)
      ?.clinicAffiliations.patients.push({
        clinicId: affiliation.organization_dental_clinic_id,
        patientNumber: affiliation.patient_number,
      });
  }
  for (const affiliation of staffAffiliations) {
    byId.get(affiliation.person_staff_id)?.clinicAffiliations.staff.push({
      clinicId: affiliation.organization_dental_clinic_id,
      role: affiliation.role,
      legacyRole: affiliation.legacy_role,
    });
  }
  for (const affiliation of dentistAffiliations) {
    byId.get(affiliation.person_dentist_id)?.clinicAffiliations.dentists.push({
      clinicId: affiliation.organization_dental_clinic_id,
    });
  }

  return { persons: [...byId.values()] };
};
