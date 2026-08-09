const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

function hasPermission(admin, permission) { return admin?.permissions?.[permission] === true; }

async function getAdmin(sender) {
  const result = await pool.query(
    `SELECT id, staff_id, display_name, role, permissions
       FROM staff_admin_accounts
      WHERE normalized_whatsapp = $1
        AND active = TRUE`,
    [normalizePhone(sender)]
  );
  return result.rows[0] || null;
}

async function audit(adminId, metadata) {
  await pool.query(
    `INSERT INTO crm_audit_events (actor_admin_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'admin.nail_services_audit', 'service', NULL, $2::jsonb)`,
    [adminId, JSON.stringify(metadata)]
  );
}

async function processAdminNailServicesAuditMessage(sender, text) {
  if (!/^nail\s+services\s+audit$/i.test(String(text || '').trim())) return { handled: false };

  const admin = await getAdmin(sender);
  if (!admin) return { handled: false };
  if (!hasPermission(admin, 'schedule:manage')) {
    return { handled: true, admin, reply: "You don't have permission to run catalogue audits." };
  }

  const result = await pool.query(`
    SELECT
      s.id,
      s.name,
      s.status,
      COUNT(DISTINCT ss.staff_id)::int AS eligible_staff_count,
      COUNT(DISTINCT aps.appointment_id)::int AS appointment_count
    FROM services s
    LEFT JOIN staff_services ss ON ss.service_id = s.id
    LEFT JOIN appointment_services aps ON aps.service_id = s.id
    WHERE LOWER(s.name) ~ '(nail|gel|manicure|pedicure|medi[- ]?heel)'
    GROUP BY s.id, s.name, s.status
    ORDER BY LOWER(s.name), s.id
  `);

  await audit(admin.id, {
    serviceIds: result.rows.map((r) => r.id),
    count: result.rows.length,
  });

  if (!result.rows.length) {
    return {
      handled: true,
      admin,
      reply: '*Nail services audit*\n\nNo matching canonical services were found.\n\nRead-only audit. Nothing was changed.'
    };
  }

  const lines = ['*Nail services audit*', '', `${result.rows.length} matching canonical service${result.rows.length === 1 ? '' : 's'}:`, ''];
  for (const row of result.rows) {
    lines.push(`- #${row.id} ${row.name}`);
    lines.push(`  Status: ${row.status} · Staff: ${row.eligible_staff_count} · Appointments: ${row.appointment_count}`);
  }
  lines.push('', 'Read-only audit. No services, clients, appointments or staff eligibility were changed.');
  return { handled: true, admin, reply: lines.join('\n') };
}

module.exports = { processAdminNailServicesAuditMessage };
