const { getMigrationStatus, applyPendingMigrations } = require('./migrations');
const logger = require('../lib/logger');

const ALLOWED = new Set([
  '038_service_customer_content.sql',
  '039_service_customer_descriptions.sql',
]);

async function applyServiceCatalogueMigrations() {
  const status = await getMigrationStatus();
  const changed = status.filter((item) => item.applied && item.checksumMatches === false);
  if (changed.length) {
    throw new Error(`Applied migration checksum mismatch: ${changed.map((item) => item.filename).join(', ')}`);
  }

  const pending = status.filter((item) => !item.applied);
  const unexpected = pending.filter((item) => !ALLOWED.has(item.filename));
  if (unexpected.length) {
    throw new Error(`Refusing catalogue migration because unexpected migrations are pending: ${unexpected.map((item) => item.filename).join(', ')}`);
  }

  const result = await applyPendingMigrations();
  const appliedUnexpected = result.applied.filter((filename) => !ALLOWED.has(filename));
  if (appliedUnexpected.length) {
    throw new Error(`Unexpected migration applied: ${appliedUnexpected.join(', ')}`);
  }

  logger.info({ result }, 'Guarded service catalogue migrations completed');
  return { status: 'complete', ...result };
}

module.exports = { applyServiceCatalogueMigrations, ALLOWED };
