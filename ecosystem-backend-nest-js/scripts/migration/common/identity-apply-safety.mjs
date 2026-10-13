import { isAbsolute, relative, resolve } from 'node:path';
import { databaseTargetFingerprint } from './database-target.mjs';

const acknowledgements = {
  disposable: 'APPLY_TO_DISPOSABLE_TARGET',
  staging: 'APPLY_TO_STAGING_TARGET',
  production: 'APPLY_TO_PRODUCTION_TARGET',
};

const outsideRepository = (repositoryRoot, setting) => {
  const path = resolve(setting);
  const relativePath = relative(repositoryRoot, path);
  return {
    path,
    outside:
      relativePath !== '' &&
      (relativePath.startsWith('..') || isAbsolute(relativePath)),
  };
};

export const validateIdentityApplyEnvironment = (
  environment,
  repositoryRoot,
) => {
  const required = [
    'MIGRATION_TARGET_DATABASE_URL',
    'MIGRATION_IDENTITY_INPUT',
    'MIGRATION_TARGET_STATE',
    'MIGRATION_CLINIC_ID',
    'MIGRATION_APPLY_ENVIRONMENT',
    'MIGRATION_APPLY_ACK',
    'MIGRATION_APPLY_REPORT',
  ];
  for (const name of required) {
    if (!environment[name]) throw new Error(`MISSING_ENVIRONMENT:${name}`);
  }

  const targetEnvironment = environment.MIGRATION_APPLY_ENVIRONMENT;
  const expectedAcknowledgement = acknowledgements[targetEnvironment];
  if (!expectedAcknowledgement) throw new Error('INVALID_APPLY_ENVIRONMENT');
  if (environment.MIGRATION_APPLY_ACK !== expectedAcknowledgement) {
    throw new Error('INVALID_APPLY_ACKNOWLEDGEMENT');
  }
  let targetFingerprint;
  try {
    targetFingerprint = databaseTargetFingerprint(
      environment.MIGRATION_TARGET_DATABASE_URL,
    );
    if (
      environment.LEGACY_DATABASE_URL &&
      targetFingerprint ===
        databaseTargetFingerprint(environment.LEGACY_DATABASE_URL)
    ) {
      throw new Error('TARGET_MATCHES_LEGACY_DATABASE');
    }
  } catch (error) {
    if (error.message === 'TARGET_MATCHES_LEGACY_DATABASE') throw error;
    throw new Error('INVALID_TARGET_DATABASE_URL');
  }

  const input = outsideRepository(
    repositoryRoot,
    environment.MIGRATION_IDENTITY_INPUT,
  );
  const state = outsideRepository(
    repositoryRoot,
    environment.MIGRATION_TARGET_STATE,
  );
  const report = outsideRepository(
    repositoryRoot,
    environment.MIGRATION_APPLY_REPORT,
  );
  if (!input.outside || !state.outside || !report.outside) {
    throw new Error('MIGRATION_FILES_MUST_BE_OUTSIDE_REPOSITORY');
  }
  if (new Set([input.path, state.path, report.path]).size !== 3) {
    throw new Error('MIGRATION_FILE_PATHS_MUST_BE_DISTINCT');
  }

  return {
    connectionString: environment.MIGRATION_TARGET_DATABASE_URL,
    sourcePath: input.path,
    targetStatePath: state.path,
    clinicId: environment.MIGRATION_CLINIC_ID,
    targetEnvironment,
    reportPath: report.path,
    targetFingerprint,
  };
};
