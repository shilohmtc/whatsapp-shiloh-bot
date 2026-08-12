const { pool } = require('../db/pool');

async function ensureDemoClientPermissions(db = pool) {
  const granted = await db.query(
    `UPDATE staff_admin_accounts
        SET permissions = COALESCE(permissions, '{}'::jsonb) || '{"demo:client":true}'::jsonb,
            updated_at = NOW()
      WHERE active = TRUE
        AND (
          (LOWER(display_name) = 'christel' AND business_role = 'owner')
          OR (LOWER(display_name) = 'abigail' AND business_role = 'employee_practitioner')
          OR (LOWER(display_name) = 'marietjie' AND business_role = 'tenant_practitioner')
        )`
  );

  const revoked = await db.query(
    `UPDATE staff_admin_accounts
        SET permissions = COALESCE(permissions, '{}'::jsonb) - 'demo:client',
            updated_at = NOW()
      WHERE active = TRUE
        AND permissions ? 'demo:client'
        AND NOT (
          (LOWER(display_name) = 'christel' AND business_role = 'owner')
          OR (LOWER(display_name) = 'abigail' AND business_role = 'employee_practitioner')
          OR (LOWER(display_name) = 'marietjie' AND business_role = 'tenant_practitioner')
        )`
  );

  return { granted: granted.rowCount, revoked: revoked.rowCount };
}

module.exports = { ensureDemoClientPermissions };
