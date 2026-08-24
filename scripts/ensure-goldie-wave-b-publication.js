require('dotenv').config();
const { pool } = require('../src/db/pool');
const {
  MIGRATION_FILENAME,
  SOURCE_EXPORT_SHA256,
  ensureGoldieWaveBPublication,
} = require('../src/services/goldieWaveBPublicationBootstrap');

async function main() {
  const result = await ensureGoldieWaveBPublication();
  console.log(JSON.stringify({
    event: 'goldie_wave_b_publication_verified',
    filename: MIGRATION_FILENAME,
    sourceExportSha256: SOURCE_EXPORT_SHA256,
    appliedNow: result.applied === true,
    checksumVerified: result.checksumVerified === true,
    targetCount: result.targetCount,
    exactDescriptionCount: result.exactDescriptionCount,
    activePublicCatalogueTargetCount: result.activePublicCatalogueTargetCount,
    retainedInactiveTargetCount: result.retainedInactiveTargetCount,
    retainedInactiveUnmappedTargetCount: result.retainedInactiveUnmappedTargetCount,
    mappingsPreserved: result.mappingsPreserved === true,
    nonTargetDescriptionsPreserved: result.nonTargetDescriptionsPreserved === true,
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