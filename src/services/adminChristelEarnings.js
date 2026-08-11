const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { isBusinessWide } = require('./staffAdminScope');

function senderKey(sender) { return normalizePhone(sender); }
function money(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function clinicBounds(period = 'today') {
  if (period === 'month') {
    return `a.starts_at >= (date_trunc('month', NOW() AT TIME ZONE 'Africa/Johannesburg') AT TIME ZONE 'Africa/Johannesburg')
      AND a.starts_at < ((date_trunc('month', NOW() AT TIME ZONE 'Africa/Johannesburg') + INTERVAL '1 month') AT TIME ZONE 'Africa/Johannesburg')`;
  }
  if (period === 'week') {
    return `a.starts_at >= (date_trunc('week', NOW() AT TIME ZONE 'Africa/Johannesburg') AT TIME ZONE 'Africa/Johannesburg')
      AND a.starts_at < ((date_trunc('week', NOW() AT TIME ZONE 'Africa/Johannesburg') + INTERVAL '7 days') AT TIME ZONE 'Africa/Johannesburg')`;
  }
  return `a.starts_at >= (((NOW() AT TIME ZONE 'Africa/Johannesburg')::date)::timestamp AT TIME ZONE 'Africa/Johannesburg')
      AND a.starts_at < ((((NOW() AT TIME ZONE 'Africa/Johannesburg')::date + 1)::timestamp) AT TIME ZONE 'Africa/Johannesburg')`;
}

function periodLabel(period = 'today') {
  const options = period === 'month'
    ? { month: 'long', year: 'numeric' }
    : period === 'week'
      ? { day: '2-digit', month: 'short' }
      : { weekday: 'long', day: '2-digit', month: 'long' };
  if (period !== 'week') {
    return new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', ...options }).format(new Date());
  }
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
  const day = local.getDay() === 0 ? 7 : local.getDay();
  const start = new Date(local); start.setDate(local.getDate() + 1 - day);
  const end = new Date(local); end.setDate(local.getDate() + 7 - day);
  const f = new Intl.DateTimeFormat('en-ZA', options);
  return `${f.format(start)}–${f.format(end)}`;
}

async function getAdmin(sender) {
  const result = await pool.query(
    `SELECT id, staff_id, display_name, role, permissions, service_scope, business_role, calendar_scope
       FROM staff_admin_accounts
      WHERE normalized_whatsapp = $1 AND active = TRUE`,
    [senderKey(sender)]
  );
  return result.rows[0] || null;
}

async function resolveChristelStaff() {
  const result = await pool.query(
    `SELECT id, display_name FROM staff
      WHERE status = 'active' AND lower(trim(display_name)) = 'christel'
      ORDER BY id`
  );
  if (result.rowCount !== 1) {
    throw new Error(`Expected exactly one active Christel staff record; found ${result.rowCount}`);
  }
  return result.rows[0];
}

function parseChristelEarningsCommand(raw = '') {
  const text = String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
  const named = /^christel(?:'s)? earnings(?: (today|this week|week|this month|month))?$/.exec(text);
  const own = /^my earnings(?: (today|this week|week|this month|month))?$/.exec(text);
  const match = named || own;
  if (!match) return null;
  const token = match[1] || 'today';
  return {
    period: token.includes('month') ? 'month' : token.includes('week') ? 'week' : 'today',
    own: Boolean(own),
  };
}

async function christelEarningsData(period = 'today') {
  const christel = await resolveChristelStaff();
  const bounds = clinicBounds(period);
  const rows = (await pool.query(`
    SELECT a.id, a.starts_at, a.total_price,
           COALESCE(c.display_name, a.source_client_name, 'Unknown client') AS client_name,
           COUNT(DISTINCT ast.staff_id)::int AS staff_count,
           COALESCE(string_agg(DISTINCT aps.service_name_snapshot, ', ')
             FILTER (WHERE aps.service_name_snapshot IS NOT NULL), '') AS services
      FROM appointments a
      JOIN appointment_staff ast_christel
        ON ast_christel.appointment_id = a.id AND ast_christel.staff_id = $1
      JOIN appointment_staff ast ON ast.appointment_id = a.id
      LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
      LEFT JOIN clients c ON c.id = a.client_id
     WHERE ${bounds}
       AND a.status = 'completed'
     GROUP BY a.id, c.display_name, a.source_client_name
     ORDER BY a.starts_at, a.id`, [christel.id])).rows;

  const qualifying = rows.filter((row) => Number(row.staff_count) === 1 && row.total_price !== null);
  const joint = rows.filter((row) => Number(row.staff_count) > 1);
  const unpriced = rows.filter((row) => Number(row.staff_count) === 1 && row.total_price === null);
  const completedValue = qualifying.reduce((sum, row) => sum + Number(row.total_price || 0), 0);
  return { christel, rows, qualifying, joint, unpriced, completedValue };
}

function renderChristelEarnings(data, period = 'today') {
  const lines = ['*CHRISTEL — TREATMENT EARNINGS*', periodLabel(period), ''];
  lines.push(`Completed solo appointments: *${data.qualifying.length}*`);
  lines.push(`Completed treatment value: *${money(data.completedValue)}*`);
  lines.push(`Christel earnings (100%): *${money(data.completedValue)}*`);
  if (data.joint.length) {
    lines.push('', `Joint-practitioner appointments excluded: *${data.joint.length}*`,
      'They are not included until service-level attribution is explicit.');
  }
  if (data.unpriced.length) {
    lines.push('', `Completed appointments without a CRM price excluded: *${data.unpriced.length}*`);
  }
  lines.push('', 'Christel earnings = 100% of qualifying completed treatments personally performed by Christel.');
  lines.push('Clinic-wide revenue and Abigail earnings are kept separate.');
  return lines.join('\n');
}

async function audit(admin, period, data) {
  await pool.query(
    `INSERT INTO crm_audit_events
      (actor_admin_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, 'admin_report', NULL, $3::jsonb)`,
    [admin.id, `admin.report.christel_earnings_${period}`, JSON.stringify({
      scope: 'christel_self',
      earningsRule: '100_percent_qualifying_completed_treatments',
      qualifyingAppointments: data.qualifying.length,
      jointExcluded: data.joint.length,
      unpricedExcluded: data.unpriced.length,
      completedValue: data.completedValue,
    })]
  );
}

async function processAdminChristelEarningsMessage(sender, text) {
  const command = parseChristelEarningsCommand(text);
  if (!command) return { handled: false };

  const admin = await getAdmin(sender);
  if (!admin) return { handled: false };
  if (admin?.permissions?.['appointment:view'] !== true) {
    return { handled: true, admin, reply: 'Your admin account does not currently have permission to view appointment reports.' };
  }

  const christel = await resolveChristelStaff();
  const isChristel = String(admin.staff_id || '') === String(christel.id);
  if (!isChristel || !isBusinessWide(admin)) {
    if (command.own) return { handled: false };
    return { handled: true, admin, reply: 'Christel earnings are available only to Christel’s authorized owner/admin account.' };
  }

  const data = await christelEarningsData(command.period);
  await audit(admin, command.period, data);
  return { handled: true, admin, reply: renderChristelEarnings(data, command.period) };
}

module.exports = {
  processAdminChristelEarningsMessage,
  parseChristelEarningsCommand,
  christelEarningsData,
  renderChristelEarnings,
  resolveChristelStaff,
  clinicBounds,
};
