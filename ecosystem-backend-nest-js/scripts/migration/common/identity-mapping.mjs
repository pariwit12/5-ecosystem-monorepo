const sources = new Set(['patients', 'staff', 'doctors']);
const documentTypes = new Set(['THAI_CID', 'PASSPORT', 'FOREIGN_ID', 'OTHER']);

const cleanText = (value) => {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim();
  return cleaned === '' ? null : cleaned;
};

const normalizeDocument = (document) => {
  if (!document) return null;
  return {
    type: cleanText(document.type)?.toUpperCase() ?? null,
    issuingCountry: cleanText(document.issuingCountry)?.toUpperCase() ?? null,
    normalizedValue: cleanText(document.value)?.toUpperCase() ?? null,
    expiresAt: cleanText(document.expiresAt),
  };
};

const normalizeRecord = (record) => {
  const legacyIdentityValue = cleanText(record.cid);
  const explicitDocument = normalizeDocument(record.identityDocument);
  const inferredThaiCid =
    !explicitDocument && /^\d{13}$/.test(legacyIdentityValue ?? '')
      ? {
          type: 'THAI_CID',
          issuingCountry: 'TH',
          normalizedValue: legacyIdentityValue,
          expiresAt: null,
        }
      : null;

  return {
    source: record.source,
    legacyId: record.legacyId,
    identityDocument: explicitDocument ?? inferredThaiCid,
    hasAmbiguousIdentityInput: Boolean(explicitDocument && legacyIdentityValue),
    hasUnclassifiedLegacyIdentity: Boolean(
      legacyIdentityValue && !explicitDocument && !inferredThaiCid,
    ),
    firstName: cleanText(record.firstName),
    lastName: cleanText(record.lastName),
    nickname: cleanText(record.nickname),
    phone: cleanText(record.phone),
    birthDate: cleanText(record.birthDate),
    licenseNumber: cleanText(record.licenseNumber),
    legacyRole: cleanText(record.legacyRole),
  };
};

const documentValidationError = (document) => {
  if (!documentTypes.has(document.type)) return 'INVALID_DOCUMENT_TYPE';
  if (!/^[A-Z]{2}$/.test(document.issuingCountry ?? ''))
    return 'INVALID_ISSUING_COUNTRY';
  if (!document.normalizedValue) return 'MISSING_DOCUMENT_VALUE';
  if (
    document.type === 'THAI_CID' &&
    (document.issuingCountry !== 'TH' ||
      !/^\d{13}$/.test(document.normalizedValue))
  ) {
    return 'INVALID_THAI_CID';
  }
  if (
    document.type === 'PASSPORT' &&
    !/^[A-Z0-9]{5,20}$/.test(document.normalizedValue)
  ) {
    return 'INVALID_PASSPORT';
  }
  return null;
};

const profileConflictFields = ['firstName', 'lastName', 'birthDate', 'phone'];

const findConflicts = (records) =>
  profileConflictFields.filter((field) => {
    const values = new Set(
      records
        .map((record) => record[field])
        .filter((value) => value !== null)
        .map((value) => value.toLocaleLowerCase('th-TH')),
    );
    return values.size > 1;
  });

const roleForSource = (source) =>
  ({ patients: 'PATIENT', staff: 'STAFF', doctors: 'DENTIST' })[source];

export const buildIdentityPlan = (inputRecords) => {
  const rejected = [];
  const valid = [];
  const seenLegacyIdentities = new Set();

  for (const input of inputRecords) {
    const record = normalizeRecord(input);
    const identity = `${record.source}:${record.legacyId}`;

    if (!sources.has(record.source)) {
      rejected.push({ identity, reason: 'UNSUPPORTED_SOURCE' });
      continue;
    }
    if (!Number.isInteger(record.legacyId) || record.legacyId <= 0) {
      rejected.push({ identity, reason: 'INVALID_LEGACY_ID' });
      continue;
    }
    if (seenLegacyIdentities.has(identity)) {
      rejected.push({ identity, reason: 'DUPLICATE_LEGACY_IDENTITY' });
      continue;
    }
    seenLegacyIdentities.add(identity);
    if (record.hasAmbiguousIdentityInput) {
      rejected.push({ identity, reason: 'AMBIGUOUS_IDENTITY_INPUT' });
      continue;
    }
    if (record.identityDocument) {
      const error = documentValidationError(record.identityDocument);
      if (error) {
        rejected.push({ identity, reason: error });
        continue;
      }
    }
    valid.push(record);
  }

  const groups = new Map();
  for (const record of valid) {
    const document = record.identityDocument;
    const key = document
      ? `document:${document.type}:${document.issuingCountry}:${document.normalizedValue}`
      : `legacy:${record.source}:${record.legacyId}`;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }

  const persons = [];
  const manualReview = [];
  for (const [identityKey, records] of groups) {
    const conflicts = findConflicts(records);
    const warnings = [];
    if (records.some((record) => record.hasUnclassifiedLegacyIdentity)) {
      warnings.push('UNCLASSIFIED_LEGACY_IDENTITY_DOCUMENT');
    } else if (!records[0].identityDocument) {
      warnings.push('MISSING_IDENTITY_DOCUMENT_NO_AUTOMATIC_MERGE');
    }
    if (conflicts.length > 0) warnings.push('CONFLICTING_PROFILE_FIELDS');

    const firstValue = (field) =>
      records.find((record) => record[field] !== null)?.[field] ?? null;
    const person = {
      identityKey,
      identityDocuments: records[0].identityDocument
        ? [records[0].identityDocument]
        : [],
      profile: {
        firstName: firstValue('firstName'),
        lastName: firstValue('lastName'),
        nickname: firstValue('nickname'),
        phone: firstValue('phone'),
        birthDate: firstValue('birthDate'),
      },
      roles: [
        ...new Set(records.map((record) => roleForSource(record.source))),
      ],
      legacyIdentities: records.map((record) => ({
        source: 'legacy-dental-clinic',
        entityType: record.source,
        legacyId: record.legacyId,
      })),
      dentist:
        records.find((record) => record.source === 'doctors') === undefined
          ? null
          : {
              licenseNumber:
                records.find((record) => record.source === 'doctors')
                  ?.licenseNumber ?? null,
            },
      warnings,
    };
    persons.push(person);

    if (warnings.length > 0) {
      manualReview.push({
        identityKey,
        reasons: warnings,
        conflictFields: conflicts,
      });
    }
  }

  return { persons, rejected, manualReview };
};

export const summarizeIdentityPlan = (inputRecords, plan) => ({
  sourceRecords: inputRecords.length,
  plannedPersons: plan.persons.length,
  rejectedRecords: plan.rejected.length,
  manualReviewGroups: plan.manualReview.length,
  roles: {
    patients: plan.persons.filter((person) => person.roles.includes('PATIENT'))
      .length,
    staff: plan.persons.filter((person) => person.roles.includes('STAFF'))
      .length,
    dentists: plan.persons.filter((person) => person.roles.includes('DENTIST'))
      .length,
  },
  rejectionReasons: Object.fromEntries(
    [...new Set(plan.rejected.map((item) => item.reason))].map((reason) => [
      reason,
      plan.rejected.filter((item) => item.reason === reason).length,
    ]),
  ),
  reviewReasons: Object.fromEntries(
    [...new Set(plan.manualReview.flatMap((item) => item.reasons))].map(
      (reason) => [
        reason,
        plan.manualReview.filter((item) => item.reasons.includes(reason))
          .length,
      ],
    ),
  ),
});
