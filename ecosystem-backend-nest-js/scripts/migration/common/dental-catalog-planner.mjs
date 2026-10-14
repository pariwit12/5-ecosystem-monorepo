// Pure, database-free planner for importing ToothCraft catalog records.
// It deliberately emits plans only; applying a plan requires a separately guarded executor.
const text = (value) => typeof value === 'string' ? value.trim() : '';
const key = (source, legacyId) => `${source}:${String(legacyId)}`;
const numberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export function planDentalCatalogImport({ clinicId, legacySource, source, target }) {
  const errors = [];
  const operations = [];
  const manualReview = [];
  if (typeof clinicId !== 'string' || !clinicId.trim()) errors.push('TARGET_CLINIC_REQUIRED');
  if (typeof legacySource !== 'string' || !legacySource.trim()) errors.push('LEGACY_SOURCE_REQUIRED');

  const sourceProcedures = Array.isArray(source?.procedures) ? source.procedures : [];
  const sourcePaymentMethods = Array.isArray(source?.paymentMethods) ? source.paymentMethods : [];
  const sourceFeeRates = Array.isArray(source?.dentistFeeRates) ? source.dentistFeeRates : [];
  const targetProcedures = Array.isArray(target?.procedures) ? target.procedures : [];
  const targetPaymentMethods = Array.isArray(target?.paymentMethods) ? target.paymentMethods : [];
  const targetFeeRates = Array.isArray(target?.dentistFeeRates) ? target.dentistFeeRates : [];

  const procedureByLegacy = new Map();
  for (const row of targetProcedures) {
    if (row.legacySource && row.legacyId !== null && row.legacyId !== undefined) {
      procedureByLegacy.set(key(row.legacySource, row.legacyId), row);
    }
  }
  const paymentByLegacy = new Map();
  for (const row of targetPaymentMethods) {
    if (row.legacySource && row.legacyId !== null && row.legacyId !== undefined) {
      paymentByLegacy.set(key(row.legacySource, row.legacyId), row);
    }
  }
  const dentistIds = new Set((target?.dentists || []).map((row) => String(row.legacyId)));
  const seenProcedures = new Set();
  const seenPayments = new Set();
  const plannedProcedureIds = new Set();

  for (const row of sourceProcedures) {
    const id = row?.legacyId;
    const name = text(row?.name);
    const rowKey = key(legacySource, id);
    if (id === null || id === undefined || String(id).trim() === '' || !name) {
      manualReview.push({ entity: 'procedure', legacyId: id ?? null, reason: 'MISSING_ID_OR_NAME' });
      continue;
    }
    if (seenProcedures.has(rowKey)) {
      manualReview.push({ entity: 'procedure', legacyId: id, reason: 'DUPLICATE_SOURCE_LEGACY_ID' });
      continue;
    }
    seenProcedures.add(rowKey);
    const defaultPrice = numberOrNull(row.defaultPrice);
    const minPrice = numberOrNull(row.minPrice);
    const maxPrice = numberOrNull(row.maxPrice);
    const feePercent = numberOrNull(row.defaultDentistFeePercent);
    if ([defaultPrice, minPrice, maxPrice].some(Number.isNaN) ||
        (minPrice !== null && minPrice < 0) ||
        (maxPrice !== null && maxPrice < 0) ||
        (defaultPrice !== null && defaultPrice < 0) ||
        (minPrice !== null && maxPrice !== null && minPrice > maxPrice) ||
        (feePercent !== null && (Number.isNaN(feePercent) || feePercent < 0 || feePercent > 100))) {
      manualReview.push({ entity: 'procedure', legacyId: id, reason: 'INVALID_PRICE_OR_FEE_RANGE' });
      continue;
    }
    const existing = procedureByLegacy.get(rowKey);
    if (existing) {
      if (text(existing.name).toLocaleLowerCase() !== name.toLocaleLowerCase()) {
        manualReview.push({ entity: 'procedure', legacyId: id, reason: 'EXISTING_LEGACY_MAPPING_CONFLICT' });
      } else {
        operations.push({ action: 'REUSE', entity: 'procedure', legacyId: id, targetId: existing.id });
        plannedProcedureIds.add(String(id));
      }
      continue;
    }
    operations.push({
      action: 'CREATE', entity: 'procedure', legacyId: id,
      data: { name, category: text(row.category) || null, defaultPrice, minPrice, maxPrice,
        defaultDentistFeePercent: feePercent, active: row.active !== false },
    });
    plannedProcedureIds.add(String(id));
  }

  for (const row of sourcePaymentMethods) {
    const id = row?.legacyId;
    const name = text(row?.name);
    const rowKey = key(legacySource, id);
    if (id === null || id === undefined || String(id).trim() === '' || !name) {
      manualReview.push({ entity: 'paymentMethod', legacyId: id ?? null, reason: 'MISSING_ID_OR_NAME' });
      continue;
    }
    if (seenPayments.has(rowKey)) {
      manualReview.push({ entity: 'paymentMethod', legacyId: id, reason: 'DUPLICATE_SOURCE_LEGACY_ID' });
      continue;
    }
    seenPayments.add(rowKey);
    const existing = paymentByLegacy.get(rowKey);
    if (existing) {
      if (text(existing.name).toLocaleLowerCase() !== name.toLocaleLowerCase()) {
        manualReview.push({ entity: 'paymentMethod', legacyId: id, reason: 'EXISTING_LEGACY_MAPPING_CONFLICT' });
      } else {
        operations.push({ action: 'REUSE', entity: 'paymentMethod', legacyId: id, targetId: existing.id });
      }
      continue;
    }
    const sameName = targetPaymentMethods.find((item) => text(item.name).toLocaleLowerCase() === name.toLocaleLowerCase());
    if (sameName) {
      manualReview.push({ entity: 'paymentMethod', legacyId: id, reason: 'NAME_MATCH_WITHOUT_LEGACY_MAPPING' });
      continue;
    }
    operations.push({ action: 'CREATE', entity: 'paymentMethod', legacyId: id,
      data: { name, active: row.active !== false } });
  }

  for (const row of sourceFeeRates) {
    const id = row?.legacyId;
    const dentistLegacyId = row?.dentistLegacyId;
    const procedureLegacyId = row?.procedureLegacyId;
    const percent = numberOrNull(row?.feePercent);
    if (id === null || id === undefined || dentistLegacyId === null || dentistLegacyId === undefined ||
        procedureLegacyId === null || procedureLegacyId === undefined || Number.isNaN(percent) ||
        percent === null || percent < 0 || percent > 100) {
      manualReview.push({ entity: 'dentistFeeRate', legacyId: id ?? null, reason: 'INVALID_REFERENCE_OR_FEE_PERCENT' });
      continue;
    }
    if (!dentistIds.has(String(dentistLegacyId)) || !plannedProcedureIds.has(String(procedureLegacyId))) {
      manualReview.push({ entity: 'dentistFeeRate', legacyId: id, reason: 'DENTIST_OR_PROCEDURE_NOT_MAPPED' });
      continue;
    }
    const existing = targetFeeRates.find((item) =>
      String(item.legacySource) === String(legacySource) && String(item.legacyId) === String(id));
    if (existing) {
      if (String(existing.personDentistId) !== String(row.targetDentistId ?? existing.personDentistId) ||
          String(existing.dentalProcedureId) !== String(row.targetProcedureId ?? existing.dentalProcedureId) ||
          Number(existing.feePercent) !== percent) {
        manualReview.push({ entity: 'dentistFeeRate', legacyId: id, reason: 'EXISTING_LEGACY_MAPPING_CONFLICT' });
      } else {
        operations.push({ action: 'REUSE', entity: 'dentistFeeRate', legacyId: id, targetId: existing.id });
      }
      continue;
    }
    operations.push({ action: 'CREATE', entity: 'dentistFeeRate', legacyId: id,
      data: { dentistLegacyId, procedureLegacyId, feePercent: percent } });
  }

  return {
    status: errors.length ? 'BLOCKED' : manualReview.length ? 'REQUIRES_REVIEW' : 'READY',
    clinicId: text(clinicId),
    legacySource: text(legacySource),
    summary: {
      create: operations.filter((item) => item.action === 'CREATE').length,
      reuse: operations.filter((item) => item.action === 'REUSE').length,
      manualReview: manualReview.length,
      errors: errors.length,
    },
    errors,
    operations,
    manualReview,
  };
}
