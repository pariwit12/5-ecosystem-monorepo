import { createHash } from 'node:crypto';

export const databaseTargetFingerprint = (connectionString) => {
  const url = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('UNSUPPORTED_DATABASE_PROTOCOL');
  }
  const target = `${url.hostname.toLowerCase()}:${url.port || '5432'}${url.pathname}`;
  return createHash('sha256').update(target).digest('hex');
};
