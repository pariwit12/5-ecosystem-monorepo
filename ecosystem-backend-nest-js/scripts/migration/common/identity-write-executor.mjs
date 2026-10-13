const personIdFromDocuments = async (tx, operations) => {
  const documents = operations
    .filter((operation) => operation.type === 'ENSURE_IDENTITY_DOCUMENT')
    .map((operation) => operation.document);
  if (documents.length === 0) return [];

  const rows = await tx.personIdentityDocument.findMany({
    where: {
      OR: documents.map((document) => ({
        type: document.type,
        issuingCountry: document.issuingCountry,
        normalizedValue: document.normalizedValue,
      })),
    },
    select: { personId: true },
  });
  return rows.map((row) => row.personId);
};

const personIdFromLegacyIdentities = async (tx, operations) => {
  const identities = operations
    .filter((operation) => operation.type === 'ENSURE_LEGACY_IDENTITY')
    .map((operation) => operation.identity);
  if (identities.length === 0) return [];

  const rows = await tx.personLegacyIdentity.findMany({
    where: {
      OR: identities.map((identity) => ({
        source: identity.source,
        entityType: identity.entityType,
        legacyId: identity.legacyId,
      })),
    },
    select: { personId: true },
  });
  return rows.map((row) => row.personId);
};

const resolvePersonId = async (tx, entry) => {
  const candidateIds = new Set([
    ...(entry.targetPersonId ? [entry.targetPersonId] : []),
    ...(await personIdFromDocuments(tx, entry.operations)),
    ...(await personIdFromLegacyIdentities(tx, entry.operations)),
  ]);

  if (candidateIds.size > 1) throw new Error('TARGET_IDENTITY_CONFLICT');
  const personId = [...candidateIds][0];
  if (!personId) return null;

  const exists = await tx.person.findUnique({
    where: { id: personId },
    select: { id: true },
  });
  if (!exists) throw new Error('TARGET_PERSON_NOT_FOUND');
  return personId;
};

const profileForCreate = (operation) => ({
  ...operation.profile,
  birthDate: operation.profile.birthDate
    ? new Date(`${operation.profile.birthDate}T00:00:00.000Z`)
    : null,
});

const allocatePatientNumber = async (tx, clinicId) => {
  const sequence = await tx.patientNumberSequence.upsert({
    where: { organizationDentalClinicId: clinicId },
    create: { organizationDentalClinicId: clinicId, nextNumber: 2 },
    update: { nextNumber: { increment: 1 } },
    select: { nextNumber: true },
  });
  return String(sequence.nextNumber - 1);
};

const executeOperation = async (tx, personId, operation) => {
  switch (operation.type) {
    case 'CREATE_PERSON':
      return;
    case 'ENSURE_IDENTITY_DOCUMENT':
      await tx.personIdentityDocument.createMany({
        data: [
          {
            personId,
            ...operation.document,
            expiresAt: operation.document.expiresAt
              ? new Date(`${operation.document.expiresAt}T00:00:00.000Z`)
              : null,
          },
        ],
        skipDuplicates: true,
      });
      return;
    case 'ENSURE_LEGACY_IDENTITY':
      await tx.personLegacyIdentity.createMany({
        data: [{ personId, ...operation.identity }],
        skipDuplicates: true,
      });
      return;
    case 'ENSURE_PATIENT_ROLE':
      await tx.personDentalPatient.upsert({
        where: { personId },
        create: { personId },
        update: {},
      });
      return;
    case 'ENSURE_PATIENT_CLINIC_AFFILIATION': {
      const where = {
        personDentalPatientId_organizationDentalClinicId: {
          personDentalPatientId: personId,
          organizationDentalClinicId: operation.clinicId,
        },
      };
      const existing = await tx.personDentalPatientAffiliation.findUnique({
        where,
        select: { patientNumber: true },
      });
      if (existing) return;

      const patientNumber = await allocatePatientNumber(tx, operation.clinicId);
      await tx.personDentalPatientAffiliation.create({
        data: {
          personDentalPatientId: personId,
          organizationDentalClinicId: operation.clinicId,
          patientNumber,
        },
      });
      return;
    }
    case 'ENSURE_STAFF_ROLE':
      await tx.personStaff.upsert({
        where: { personId },
        create: { personId },
        update: {},
      });
      return;
    case 'ENSURE_STAFF_CLINIC_AFFILIATION':
      await tx.personStaffAffiliation.upsert({
        where: {
          personStaffId_organizationDentalClinicId: {
            personStaffId: personId,
            organizationDentalClinicId: operation.clinicId,
          },
        },
        create: {
          personStaffId: personId,
          organizationDentalClinicId: operation.clinicId,
          role: operation.role,
          legacyRole: operation.legacyRole,
        },
        update: {},
      });
      return;
    case 'ENSURE_DENTIST_ROLE':
      await tx.personDentist.upsert({
        where: { personId },
        create: { personId, licenseNumber: operation.licenseNumber },
        update: {},
      });
      return;
    case 'ENSURE_DENTIST_CLINIC_AFFILIATION':
      await tx.personDentistAffiliation.upsert({
        where: {
          personDentistId_organizationDentalClinicId: {
            personDentistId: personId,
            organizationDentalClinicId: operation.clinicId,
          },
        },
        create: {
          personDentistId: personId,
          organizationDentalClinicId: operation.clinicId,
        },
        update: {},
      });
      return;
    default:
      throw new Error(`UNSUPPORTED_WRITE_OPERATION:${operation.type}`);
  }
};

const validateManifest = (manifest) => {
  if (manifest.formatVersion !== 1) {
    throw new Error('UNSUPPORTED_MANIFEST_VERSION');
  }
  for (const entry of manifest.persons) {
    if (entry.transactionBoundary !== 'PERSON') {
      throw new Error('INVALID_TRANSACTION_BOUNDARY');
    }
    for (const operation of entry.operations) {
      if (operation.clinicId && operation.clinicId !== manifest.clinicId) {
        throw new Error('MIXED_TARGET_CLINICS');
      }
    }
  }
};

export const executeIdentityWriteManifest = async (
  prisma,
  manifest,
  options = {},
) => {
  validateManifest(manifest);
  const clinic = await prisma.organizationDentalClinic.findUnique({
    where: { id: manifest.clinicId },
    select: { id: true, deletedAt: true },
  });
  if (!clinic || clinic.deletedAt) throw new Error('TARGET_CLINIC_NOT_ACTIVE');

  const summary = { createdPersons: 0, reusedPersons: 0, processedPersons: 0 };
  for (const entry of manifest.persons) {
    const result = await prisma.$transaction(
      async (tx) => {
        let personId = await resolvePersonId(tx, entry);
        let created = false;
        if (!personId) {
          const createOperation = entry.operations.find(
            (operation) => operation.type === 'CREATE_PERSON',
          );
          if (!createOperation)
            throw new Error('CREATE_PERSON_OPERATION_MISSING');
          const person = await tx.person.create({
            data: profileForCreate(createOperation),
            select: { id: true },
          });
          personId = person.id;
          created = true;
        }

        for (const operation of entry.operations) {
          await executeOperation(tx, personId, operation);
        }
        return { created };
      },
      { isolationLevel: 'Serializable', maxWait: 10000, timeout: 60000 },
    );

    summary.processedPersons += 1;
    summary[result.created ? 'createdPersons' : 'reusedPersons'] += 1;
    await options.onPersonCommitted?.({ ...summary });
  }
  return summary;
};
