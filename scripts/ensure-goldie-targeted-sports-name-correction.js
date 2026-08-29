require('dotenv').config();
const { pool } = require('../src/db/pool');
const { verifyMigrationFile } = require('../src/services/migrations');
const {
  MIGRATION_FILENAME,
} = require('../src/services/goldieTargetedSportsNameCorrectionBootstrap');

async function main() {
  const result = await verifyMigrationFile(MIGRATION_FILENAME);
  console.log(JSON.stringify({
    event: 'goldie_targeted_sports_name_correction_verified',
    filename: MIGRATION_FILENAME,
    appliedNow: false,
    checksumVerified: result.checksumMatches === true,
    appliedAt: result.appliedAt || null,
  }));
}

main()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(JSON.stringify({ event: 'goldie_targeted_sports_name_correction_failed', filename: MIGRATION_FILENAME, message: error.message }));
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  });
