import path, { win32 } from 'node:path';
import { databaseTargetFingerprint } from './database-target.mjs';

const acknowledgements = {
  disposable: 'APPLY_TO_DISPOSABLE_TARGET',
  staging: 'APPLY_TO_STAGING_TARGET',
  production: 'APPLY_TO_PRODUCTION_TARGET',
};

const outsideRepository = (repositoryRoot, setting) => {
  // Migration configuration may be validated on a different OS from the one
  // whose paths it describes (for example, Windows paths in Linux CI tests).
  const pathApi =
    win32.isAbsolute(repositoryRoot) || win32.isAbsolute(setting)
      ? win32
      : path;
  const resolvedRepositoryRoot = pathApi.resolve(repositoryRoot);
  const resolvedPath = pathApi.resolve(setting);
  const relativePath = pathApi.relative(resolvedRepositoryRoot, resolvedPath);
  return {
    path: resolvedPath,
    outside:
      relativePath !== '' &&
      (relativePath === '..' ||
        relativePath.startsWith(`..${pathApi.sep}`) ||
        pathApi.isAbsolute(relativePath)),
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
