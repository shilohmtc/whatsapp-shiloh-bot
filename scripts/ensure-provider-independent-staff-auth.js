require('dotenv').config();
const { pool } = require('../src/db/pool');
const { verifyMigrationFile } = require('../src/services/migrations');

const FILENAME = '081_provider_independent_staff_auth.sql';

async function main() {
  const status = await verifyMigrationFile(FILENAME);
  console.log(JSON.stringify({
    event: 'provider_independent_staff_auth_schema_verified',
    filename: FILENAME,
    appliedNow: false,
    checksumVerified: status.checksumMatches === true,
    appliedAt: status.appliedAt || null,
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
