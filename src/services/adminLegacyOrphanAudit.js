const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

function hasPermission(admin, permission) { return admin?.permissions?.[permission] === true; }
async function getAdmin(sender) {
  const r = await pool.query(`SELECT id, staff_id, display_name, role, permissions FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`, [normalizePhone(sender)]);
  return r.rows[0] || null;
}
async function logAudit(adminId, metadata) {
  await pool.query(`INSERT INTO crm_audit_events (actor_admin_id, action, entity_type, entity_id, metadata) VALUES ($1,'admin.legacy_orphan_audit','client',NULL,$2::jsonb)`, [adminId, JSON.stringify(metadata)]);
}

async function processAdminLegacyOrphanAuditMessage(sender, text) {
  if (!/^legacy\s+orphan\s+audit$/i.test(String(text || '').trim())) return { handled: false };
  const admin = await getAdmin(sender);
  if (!admin) return { handled: false };
  if (!hasPermission(admin, 'schedule:manage')) return { handled: true, admin, reply: "You don't have permission to run CRM maintenance audits." };

  const retired = [2,49,53,59,60,61,62];
  const result = await pool.query(`
    WITH affected AS (
      SELECT DISTINCT a.client_id
      FROM appointments a
      JOIN appointment_services aps ON aps.appointment_id = a.id
      WHERE a.client_id IS NOT NULL AND aps.service_id = ANY($1::bigint[])
    ), per_client AS (
      SELECT c.id, c.display_name, c.status, c.source,
        COUNT(DISTINCT cc.id)::int AS contacts,
        COUNT(DISTINCT CASE WHEN cc.contact_type='whatsapp' THEN cc.id END)::int AS whatsapp_contacts,
        COUNT(DISTINCT a.id)::int AS appointments,
        COUNT(DISTINCT CASE WHEN EXISTS (
          SELECT 1 FROM appointment_services x WHERE x.appointment_id=a.id AND x.service_id = ANY($1::bigint[])
        ) THEN a.id END)::int AS appointments_touching_retired,
        COUNT(DISTINCT CASE WHEN EXISTS (
          SELECT 1 FROM appointment_services x WHERE x.appointment_id=a.id AND (x.service_id IS NULL OR NOT (x.service_id = ANY($1::bigint[])))
        ) THEN a.id END)::int AS appointments_with_other_services,
        COUNT(DISTINCT CASE WHEN a.starts_at >= NOW() AND a.status NOT IN ('cancelled','no_show') THEN a.id END)::int AS future_appointments,
        MAX(CASE WHEN cos.client_id IS NOT NULL AND cos.state='complete' THEN 1 ELSE 0 END)::int AS onboarding_complete
      FROM affected af
      JOIN clients c ON c.id=af.client_id
      LEFT JOIN client_contacts cc ON cc.client_id=c.id
      LEFT JOIN appointments a ON a.client_id=c.id
      LEFT JOIN client_onboarding_sessions cos ON cos.client_id=c.id
      GROUP BY c.id,c.display_name,c.status,c.source
    )
    SELECT *,
      CASE
        WHEN future_appointments > 0 OR appointments_with_other_services > 0 OR onboarding_complete = 1 THEN 'keep'
        WHEN appointments > 0 AND appointments = appointments_touching_retired AND appointments_with_other_services = 0 THEN 'legacy_only'
        ELSE 'review'
      END AS classification
    FROM per_client
    ORDER BY classification, LOWER(COALESCE(display_name,'')), id
  `, [retired]);

  const rows = result.rows;
  const counts = rows.reduce((a,r)=>{a[r.classification]=(a[r.classification]||0)+1; return a;},{});
  await logAudit(admin.id, { retiredServiceIds: retired, affectedClients: rows.length, counts });

  const legacyOnly = rows.filter(r=>r.classification==='legacy_only');
  const review = rows.filter(r=>r.classification==='review');
  const keep = rows.filter(r=>r.classification==='keep');
  const lines = [
    '*Legacy orphan audit*','',
    `${rows.length} client${rows.length===1?'':'s'} are linked to retired services.`,
    `• ${keep.length} keep — other/future CRM activity or completed onboarding`,
    `• ${review.length} review — ambiguous legacy history`,
    `• ${legacyOnly.length} legacy-only deletion candidate${legacyOnly.length===1?'':'s'}`,'',
  ];
  if (legacyOnly.length) {
    lines.push('*Legacy-only candidates*');
    for (const r of legacyOnly.slice(0,20)) lines.push(`- CRM #${r.id} ${r.display_name || '(no name)'} — ${r.appointments} appt${r.appointments===1?'':'s'} · ${r.contacts} contact${r.contacts===1?'':'s'} · source ${r.source}`);
    if (legacyOnly.length > 20) lines.push(`…and ${legacyOnly.length-20} more.`);
    lines.push('');
  }
  if (review.length) lines.push(`${review.length} ambiguous client${review.length===1?'':'s'} need a closer check before deletion.`,'');
  lines.push('Read-only audit. No clients, contacts or appointments were changed.');
  return { handled: true, admin, reply: lines.join('\n') };
}

module.exports = { processAdminLegacyOrphanAuditMessage };
