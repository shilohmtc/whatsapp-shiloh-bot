const { pool } = require('../db/pool');

async function ensureJeanPierreAdminCapabilities(db = pool) {
  const result = await db.query(`
    UPDATE staff_admin_accounts jp
       SET role = 'admin',
           business_role = 'business_admin',
           calendar_scope = 'all_business',
           service_scope = 'all_services',
           permissions = COALESCE(c.permissions, '{}'::jsonb) - 'demo:client' - 'client:test_mode',
           active = TRUE,
           updated_at = NOW()
      FROM staff_admin_accounts c
     WHERE LOWER(jp.display_name) = 'jean-pierre'
       AND LOWER(c.display_name) = 'christel'
       AND c.active = TRUE
  RETURNING jp.id, jp.display_name, jp.business_role, jp.calendar_scope, jp.service_scope, jp.permissions
  `);
  return result.rows[0] || null;
}

module.exports = { ensureJeanPierreAdminCapabilities };
