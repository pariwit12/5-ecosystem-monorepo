const sources = new Set(['patients', 'staff', 'doctors']);

const cleanText = (value) => {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim();
  return cleaned === '' ? null : cleaned;
};

const normalizeRecord = (record) => ({
  source: record.source,
  legacyId: record.legacyId,
  cid: cleanText(record.cid),
  firstName: cleanText(record.firstName),
  lastName: cleanText(record.lastName),
  nickname: cleanText(record.nickname),
  phone: cleanText(record.phone),
  birthDate: cleanText(record.birthDate),
  licenseNumber: cleanText(record.licenseNumber),
  legacyRole: cleanText(record.legacyRole),
});

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
    if (record.cid !== null && !/^\d{13}$/.test(record.cid)) {
      rejected.push({ identity, reason: 'INVALID_CID' });
      continue;
    }
    valid.push(record);
  }

  const groups = new Map();
  for (const record of valid) {
    const key = record.cid
      ? `cid:${record.cid}`
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
    if (!records[0].cid) warnings.push('MISSING_CID_NO_AUTOMATIC_MERGE');
    if (conflicts.length > 0) warnings.push('CONFLICTING_PROFILE_FIELDS');

    const firstValue = (field) =>
      records.find((record) => record[field] !== null)?.[field] ?? null;
    const person = {
      identityKey,
      cid: records[0].cid,
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
