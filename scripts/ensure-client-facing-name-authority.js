require('dotenv').config();
const { pool } = require('../src/db/pool');
const { verifyMigrationFile } = require('../src/services/migrations');

const FILENAME = '080_client_facing_name_authority.sql';

async function verifySchema() {
  const result = await pool.query(`
    SELECT
      to_regclass('public.client_name_aliases') IS NOT NULL AS alias_table,
      to_regclass('public.client_facing_name_authorities') IS NOT NULL AS authority_table,
      EXISTS (
        SELECT 1 FROM pg_indexes
         WHERE schemaname='public'
           AND indexname='uq_client_facing_name_one_active'
      ) AS one_active_index,
      (SELECT COUNT(*)::int FROM client_name_aliases) AS alias_count,
      (SELECT COUNT(*)::int FROM client_facing_name_authorities WHERE revoked_at IS NULL) AS active_authority_count
  `);
  const row = result.rows[0] || {};
  if (!row.alias_table || !row.authority_table || !row.one_active_index) {
    throw new Error('Client-facing-name authority schema invariant verification failed');
  }
  return row;
}

async function main() {
  const status = await verifyMigrationFile(FILENAME);
  const schema = await verifySchema();
  console.log(JSON.stringify({
    event: 'client_facing_name_authority_schema_verified',
    filename: FILENAME,
    appliedNow: false,
    checksumVerified: status.checksumMatches === true,
    appliedAt: status.appliedAt || null,
    aliasTable: schema.alias_table === true,
    authorityTable: schema.authority_table === true,
    oneActiveIndex: schema.one_active_index === true,
    aliasCount: Number(schema.alias_count || 0),
    activeAuthorityCount: Number(schema.active_authority_count || 0),
    heuristicPromotionPerformed: false,
  }));
}

main()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(JSON.stringify({
      event: 'client_facing_name_authority_schema_failed',
      filename: FILENAME,
      message: error.message,
    }));
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  });
