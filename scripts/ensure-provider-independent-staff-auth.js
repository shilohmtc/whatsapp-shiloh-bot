require('dotenv').config();
const { pool } = require('../src/db/pool');
const { applyMigrationFile, getMigrationStatus } = require('../src/services/migrations');

const FILENAME = '081_provider_independent_staff_auth.sql';

async function main() {
  const applied = await applyMigrationFile(FILENAME);
  const status = (await getMigrationStatus()).find((item) => item.filename === FILENAME);
  if (!status?.applied || status.checksumMatches !== true) {
    throw new Error(`Provider-independent staff auth migration failed verification: ${FILENAME}`);
  }
  console.log(JSON.stringify({
    event: 'provider_independent_staff_auth_schema_verified',
    filename: FILENAME,
    appliedNow: applied.applied,
    checksumVerified: applied.checksumVerified === true && status.checksumMatches === true,
    appliedAt: status.appliedAt || applied.appliedAt || null,
  }));
}

main()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(JSON.stringify({
      event: 'provider_independent_staff_auth_schema_failed',
      filename: FILENAME,
      message: error.message,
    }));
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  });
