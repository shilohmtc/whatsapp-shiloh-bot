require('dotenv').config();
const { pool } = require('../src/db/pool');
const { applyMigrationFile, getMigrationStatus } = require('../src/services/migrations');

const FILENAME = '078_staff_browser_sessions.sql';

async function main() {
  const applied = await applyMigrationFile(FILENAME);
  const status = (await getMigrationStatus()).find((item) => item.filename === FILENAME);
  if (!status?.applied || status.checksumMatches !== true) {
    throw new Error(`Staff browser session migration failed verification: ${FILENAME}`);
  }
  console.log(JSON.stringify({
    event: 'staff_browser_session_schema_verified',
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
      event: 'staff_browser_session_schema_failed',
      filename: FILENAME,
      message: error.message,
    }));
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  });
