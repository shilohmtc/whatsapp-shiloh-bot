const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const {
  parseChristelEarningsCommand,
  christelEarningsData,
  renderChristelEarnings,
} = require('./adminChristelEarnings');
const { scanBookingIntegrity, renderIntegrity } = require('./bookingIntegrityMonitor');

function clean(value = '') { return String(value || '').trim().replace(/\s+/g, ' '); }
function normalize(value = '') { return clean(value).toLowerCase(); }

async function getJeanPierreBusinessAdmin(sender) {
  const result = await pool.query(`
    SELECT id, staff_id, display_name, role, permissions, service_scope, business_role, calendar_scope
      FROM staff_admin_accounts
     WHERE normalized_whatsapp = $1
       AND active = TRUE
     LIMIT 1
  `, [normalizePhone(sender)]);
  const admin = result.rows[0] || null;
  if (!admin) return null;
  return normalize(admin.display_name) === 'jean-pierre'
    && admin.business_role === 'business_admin'
    && admin.calendar_scope === 'all_business'
    && admin.service_scope === 'all_services'
    ? admin
    : null;
}

async function audit(adminId, action, metadata = {}) {
  await pool.query(`
    INSERT INTO crm_audit_events (actor_admin_id, action, entity_type, entity_id, metadata)
    VALUES ($1, $2, 'admin_control_plane', NULL, $3::jsonb)
  `, [adminId, action, JSON.stringify(metadata)]);
}

async function processJeanPierreControlPlaneMessage(sender, text) {
  const earningsCommand = parseChristelEarningsCommand(text);
  const normalized = normalize(text);
  const calendarCommand = ['calendar integrity', 'calendar integrity scan', 'calendar integrity issues'].includes(normalized);
  if (!earningsCommand && !calendarCommand) return { handled: false };

  const admin = await getJeanPierreBusinessAdmin(sender);
  if (!admin) return { handled: false };
  if (admin.permissions?.['appointment:view'] !== true) {
    return { handled: true, admin, reply: 'Your admin account does not currently have permission to view this business-wide report.' };
  }

  if (earningsCommand) {
    const data = await christelEarningsData(earningsCommand.period);
    await audit(admin.id, `admin.report.christel_earnings_${earningsCommand.period}`, {
      authorizedViewer: 'business_admin',
      reportOwner: 'Christel',
      qualifyingAppointments: data.qualifying.length,
      integrityClean: data.integrity.clean,
    });
    return { handled: true, admin, reply: renderChristelEarnings(data, earningsCommand.period) };
  }

  const result = await scanBookingIntegrity();
  await audit(admin.id, 'admin.calendar_integrity_review', {
    authorizedViewer: 'business_admin',
    bookingLike: result.issues?.length || 0,
    automaticImport: false,
  });
  return { handled: true, admin, reply: renderIntegrity(result) };
}

module.exports = { getJeanPierreBusinessAdmin, processJeanPierreControlPlaneMessage };
