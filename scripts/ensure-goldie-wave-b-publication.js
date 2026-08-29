require('dotenv').config();
const { pool } = require('../src/db/pool');
const { verifyMigrationFile } = require('../src/services/migrations');
const {
  MIGRATION_FILENAME,
  SOURCE_EXPORT_SHA256,
} = require('../src/services/goldieWaveBPublicationBootstrap');

async function main() {
  const result = await verifyMigrationFile(MIGRATION_FILENAME);
  console.log(JSON.stringify({
    event: 'goldie_wave_b_publication_verified',
    filename: MIGRATION_FILENAME,
    sourceExportSha256: SOURCE_EXPORT_SHA256,
    appliedNow: false,
    checksumVerified: result.checksumMatches === true,
    appliedAt: result.appliedAt || null,
  }));
}

main()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(JSON.stringify({
      event: 'goldie_wave_b_publication_failed',
      filename: MIGRATION_FILENAME,
      message: error.message,
    }));
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  });
