const { pool } = require('../db/pool');

async function ensureDemoClientPermissions(db = pool) {
  const revoked = await db.query(
    `UPDATE staff_admin_accounts
        SET permissions = COALESCE(permissions, '{}'::jsonb) - 'demo:client',
            updated_at = NOW()
      WHERE active = TRUE
        AND permissions ? 'demo:client'`
  );

  return { granted: 0, revoked: revoked.rowCount, productionUiEnabled: false };
}

module.exports = { ensureDemoClientPermissions };
