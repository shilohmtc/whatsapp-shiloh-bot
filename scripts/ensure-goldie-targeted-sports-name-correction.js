require('dotenv').config();
const { pool } = require('../src/db/pool');
const {
  MIGRATION_FILENAME,
  ensureGoldieTargetedSportsNameCorrection,
} = require('../src/services/goldieTargetedSportsNameCorrectionBootstrap');

async function main() {
  const result = await ensureGoldieTargetedSportsNameCorrection();
  console.log(JSON.stringify({
    event: 'goldie_targeted_sports_name_correction_verified',
    filename: MIGRATION_FILENAME,
    appliedNow: result.applied === true,
    checksumVerified: result.checksumVerified === true,
    externalId: result.externalId,
    targetName: result.targetName,
    descriptionPreserved: result.descriptionPreserved === true,
    mappingsPreserved: result.mappingsPreserved === true,
    nonTargetNamesPreserved: result.nonTargetNamesPreserved === true,
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