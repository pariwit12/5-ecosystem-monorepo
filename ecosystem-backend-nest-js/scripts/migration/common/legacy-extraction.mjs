const textOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
};

const dateOrNull = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const commonRecord = (source, row) => ({
  source,
  legacyId: Number(row.id),
  cid: textOrNull(row.cid),
  firstName: textOrNull(row.first_name),
  lastName: textOrNull(row.last_name),
  nickname: textOrNull(row.nickname),
  phone: textOrNull(row.telephone),
  birthDate: dateOrNull(row.birth_day),
});

export const mapLegacyIdentityRows = ({ patients, staff, doctors }) => [
  ...patients.map((row) =>
    commonRecord('patients', { ...row, cid: row.id_number }),
  ),
  ...staff.map((row) => ({
    ...commonRecord('staff', row),
    legacyRole: textOrNull(row.role),
  })),
  ...doctors.map((row) => ({
    ...commonRecord('doctors', row),
    licenseNumber: textOrNull(row.license_number),
  })),
];
