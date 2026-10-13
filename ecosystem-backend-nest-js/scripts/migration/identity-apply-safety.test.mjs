import assert from 'node:assert/strict';
import test from 'node:test';
import { databaseTargetFingerprint } from './common/database-target.mjs';
import { validateIdentityApplyEnvironment } from './common/identity-apply-safety.mjs';

const repositoryRoot = 'D:\\repo';
const validEnvironment = {
  MIGRATION_TARGET_DATABASE_URL:
    'postgresql://writer:secret@target.example:5432/ecosystem?sslmode=require',
  MIGRATION_IDENTITY_INPUT: 'D:\\migration-private\\identity.json',
  MIGRATION_TARGET_STATE: 'D:\\migration-private\\target.json',
  MIGRATION_CLINIC_ID: '00000000-0000-7000-8000-000000000010',
  MIGRATION_APPLY_ENVIRONMENT: 'disposable',
  MIGRATION_APPLY_ACK: 'APPLY_TO_DISPOSABLE_TARGET',
  MIGRATION_APPLY_REPORT: 'D:\\migration-private\\apply-report.json',
};

test('fingerprints a database target without depending on credentials', () => {
  const first = databaseTargetFingerprint(
    'postgresql://one:secret@target.example/ecosystem?sslmode=require',
  );
  const second = databaseTargetFingerprint(
    'postgresql://two:different@target.example:5432/ecosystem',
  );

  assert.equal(first, second);
  assert.equal(first.includes('secret'), false);
  assert.equal(first.length, 64);
});

test('accepts an explicitly acknowledged disposable target with external files', () => {
  const config = validateIdentityApplyEnvironment(
    validEnvironment,
    repositoryRoot,
  );

  assert.equal(config.targetEnvironment, 'disposable');
  assert.equal(config.clinicId, validEnvironment.MIGRATION_CLINIC_ID);
});

test('rejects missing acknowledgement and repository-local files', () => {
  assert.throws(
    () =>
      validateIdentityApplyEnvironment(
        { ...validEnvironment, MIGRATION_APPLY_ACK: 'YES' },
        repositoryRoot,
      ),
    /INVALID_APPLY_ACKNOWLEDGEMENT/,
  );
  assert.throws(
    () =>
      validateIdentityApplyEnvironment(
        {
          ...validEnvironment,
          MIGRATION_IDENTITY_INPUT: 'D:\\repo\\private\\identity.json',
        },
        repositoryRoot,
      ),
    /MIGRATION_FILES_MUST_BE_OUTSIDE_REPOSITORY/,
  );
});

test('rejects a target connection equal to the legacy database', () => {
  assert.throws(
    () =>
      validateIdentityApplyEnvironment(
        {
          ...validEnvironment,
          LEGACY_DATABASE_URL:
            'postgresql://readonly:other@target.example/ecosystem',
        },
        repositoryRoot,
      ),
    /TARGET_MATCHES_LEGACY_DATABASE/,
  );
});

test('rejects an invalid target database URL without returning its value', () => {
  assert.throws(
    () =>
      validateIdentityApplyEnvironment(
        { ...validEnvironment, MIGRATION_TARGET_DATABASE_URL: 'not-a-url' },
        repositoryRoot,
      ),
    (error) =>
      error.message === 'INVALID_TARGET_DATABASE_URL' &&
      !error.message.includes('not-a-url'),
  );
});
