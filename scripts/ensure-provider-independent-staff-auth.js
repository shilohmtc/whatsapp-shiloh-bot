require('dotenv').config();
const { pool } = require('../src/db/pool');
const { applyMigrationFile, getMigrationStatus } = require('../src/services/migrations');

const FILENAMES = [
  '081_provider_independent_staff_auth.sql',
  '082_staff_auth_recovery_hash_constraint.sql',
];

async function main() {
  const migrations = [];
  for (const filename of FILENAMES) {
    const applied = await applyMigrationFile(filename);
    const status = (await getMigrationStatus()).find((item) => item.filename === filename);
    if (!status?.applied || status.checksumMatches !== true) {
      throw new Error(`Provider-independent staff auth migration failed verification: ${filename}`);
    }
    migrations.push({
      filename,
      appliedNow: applied.applied,
      checksumVerified: applied.checksumVerified === true && status.checksumMatches === true,
      appliedAt: status.appliedAt || applied.appliedAt || null,
    });
  }
  console.log(JSON.stringify({
    event: 'provider_independent_staff_auth_schema_verified',
    filename: FILENAMES.at(-1),
    migrations,
  }));
}

main()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(JSON.stringify({
      event: 'provider_independent_staff_auth_schema_failed',
      filename: FILENAMES.at(-1),
      message: error.message,
    }));
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  });
