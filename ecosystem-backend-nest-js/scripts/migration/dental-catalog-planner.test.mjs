import assert from 'node:assert/strict';
import test from 'node:test';
import { planDentalCatalogImport } from './common/dental-catalog-planner.mjs';

const base = {
  clinicId: 'clinic-1',
  legacySource: 'toothcraft',
  source: {
    procedures: [{ legacyId: 1, name: 'Cleaning', defaultPrice: '800', minPrice: 600, maxPrice: 1000, defaultDentistFeePercent: 40 }],
    paymentMethods: [{ legacyId: 1, name: 'Cash' }],
    dentistFeeRates: [{ legacyId: 1, dentistLegacyId: 7, procedureLegacyId: 1, feePercent: 35 }],
  },
  target: { procedures: [], paymentMethods: [], dentistFeeRates: [], dentists: [{ legacyId: 7 }] },
};

test('plans procedures and payment methods before fee rates without database writes', () => {
  const plan = planDentalCatalogImport(base);
  assert.equal(plan.status, 'READY');
  assert.deepEqual(plan.summary, { create: 3, reuse: 0, manualReview: 0, errors: 0 });
  assert.equal(plan.operations.find((x) => x.entity === 'procedure').data.defaultPrice, 800);
  assert.equal(plan.operations.find((x) => x.entity === 'dentistFeeRate').data.feePercent, 35);
});

test('blocks a missing clinic or legacy source', () => {
  const plan = planDentalCatalogImport({ ...base, clinicId: '', legacySource: '' });
  assert.equal(plan.status, 'BLOCKED');
  assert.deepEqual(plan.errors, ['TARGET_CLINIC_REQUIRED', 'LEGACY_SOURCE_REQUIRED']);
});

test('routes duplicate source IDs and invalid prices to manual review', () => {
  const plan = planDentalCatalogImport({
    ...base,
    source: { ...base.source, procedures: [
      { legacyId: 1, name: 'Cleaning', minPrice: 900, maxPrice: 500 },
      { legacyId: 1, name: 'Cleaning' },
    ] },
  });
  assert.equal(plan.status, 'REQUIRES_REVIEW');
  assert.ok(plan.manualReview.some((x) => x.reason === 'INVALID_PRICE_OR_FEE_RANGE'));
  assert.ok(plan.manualReview.some((x) => x.reason === 'DUPLICATE_SOURCE_LEGACY_ID'));
});

test('does not silently match a payment method by name without legacy mapping', () => {
  const plan = planDentalCatalogImport({
    ...base,
    target: { ...base.target, paymentMethods: [{ id: 'cash-existing', name: 'Cash' }] },
  });
  assert.ok(plan.manualReview.some((x) => x.reason === 'NAME_MATCH_WITHOUT_LEGACY_MAPPING'));
});

test('requires a mapped dentist and procedure before creating fee rates', () => {
  const plan = planDentalCatalogImport({
    ...base,
    target: { ...base.target, dentists: [] },
  });
  assert.ok(plan.manualReview.some((x) => x.entity === 'dentistFeeRate' && x.reason === 'DENTIST_OR_PROCEDURE_NOT_MAPPED'));
});

test('reuses a matching legacy mapping idempotently', () => {
  const plan = planDentalCatalogImport({
    ...base,
    target: {
      ...base.target,
      procedures: [{ id: 'procedure-1', legacySource: 'toothcraft', legacyId: 1, name: 'Cleaning' }],
      paymentMethods: [{ id: 'payment-1', legacySource: 'toothcraft', legacyId: 1, name: 'Cash' }],
    },
  });
  assert.equal(plan.operations.filter((x) => x.action === 'REUSE').length, 2);
});
