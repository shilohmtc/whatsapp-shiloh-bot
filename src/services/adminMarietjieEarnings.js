const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { earningsIntegrity, integrityLines } = require('./adminReportingIntegrity');

function senderKey(sender) { return normalizePhone(sender); }
function money(value) { return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(Number(value || 0)); }
function normalizedName(value = '') { return String(value || '').trim().toLowerCase().replace(/\s+/g, ' '); }
function clinicBounds(period = 'today') {
  if (period === 'month') return `a.starts_at >= (date_trunc('month', NOW() AT TIME ZONE 'Africa/Johannesburg') AT TIME ZONE 'Africa/Johannesburg') AND a.starts_at < ((date_trunc('month', NOW() AT TIME ZONE 'Africa/Johannesburg') + INTERVAL '1 month') AT TIME ZONE 'Africa/Johannesburg')`;
  if (period === 'last_week') return `a.starts_at >= ((date_trunc('week', NOW() AT TIME ZONE 'Africa/Johannesburg') - INTERVAL '7 days') AT TIME ZONE 'Africa/Johannesburg') AND a.starts_at < (date_trunc('week', NOW() AT TIME ZONE 'Africa/Johannesburg') AT TIME ZONE 'Africa/Johannesburg')`;
  if (period === 'week') return `a.starts_at >= (date_trunc('week', NOW() AT TIME ZONE 'Africa/Johannesburg') AT TIME ZONE 'Africa/Johannesburg') AND a.starts_at < ((date_trunc('week', NOW() AT TIME ZONE 'Africa/Johannesburg') + INTERVAL '7 days') AT TIME ZONE 'Africa/Johannesburg')`;
  return `a.starts_at >= (((NOW() AT TIME ZONE 'Africa/Johannesburg')::date)::timestamp AT TIME ZONE 'Africa/Johannesburg') AND a.starts_at < ((((NOW() AT TIME ZONE 'Africa/Johannesburg')::date + 1)::timestamp) AT TIME ZONE 'Africa/Johannesburg')`;
}
function periodLabel(period = 'today') {
  if (period === 'last_week') {
    const now = new Date(); const local = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' })); const day = local.getDay() === 0 ? 7 : local.getDay();
    const start = new Date(local); start.setDate(local.getDate() + 1 - day - 7); const end = new Date(start); end.setDate(start.getDate() + 6);
    const f = new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short' }); return `${f.format(start)}–${f.format(end)}`;
  }
  const options = period === 'month' ? { month: 'long', year: 'numeric' } : period === 'week' ? { day: '2-digit', month: 'short' } : { weekday: 'long', day: '2-digit', month: 'long' };
  if (period !== 'week') return new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', ...options }).format(new Date());
  const now = new Date(); const local = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' })); const day = local.getDay() === 0 ? 7 : local.getDay();
  const start = new Date(local); start.setDate(local.getDate() + 1 - day); const end = new Date(local); end.setDate(local.getDate() + 7 - day);
  const f = new Intl.DateTimeFormat('en-ZA', options); return `${f.format(start)}–${f.format(end)}`;
}
async function getAdmin(sender) {
  const r = await pool.query(`SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`, [senderKey(sender)]);
  return r.rows[0] || null;
}
async function resolveMarietjieStaff() {
  const r = await pool.query(`SELECT id, display_name FROM staff WHERE status='active' AND lower(trim(display_name))='marietjie' ORDER BY id`);
  if (r.rowCount !== 1) throw new Error(`Expected exactly one active Marietjie staff record; found ${r.rowCount}`);
  return r.rows[0];
}
function parseMarietjieEarningsCommand(raw = '') {
  const text = String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
  const match = /^marietjie(?:'s)? earnings(?: (today|this week|week|last week|this month|month))?$/.exec(text);
  if (!match) return null;
  const token = match[1] || 'today';
  return { period: token === 'last week' ? 'last_week' : token.includes('month') ? 'month' : token.includes('week') ? 'week' : 'today' };
}
function authorizedViewer(admin, marietjie = null) {
  const name = normalizedName(admin?.display_name);
  const christel = name === 'christel' && ['owner', 'business_admin'].includes(admin?.business_role) && admin?.calendar_scope === 'all_business';
  const jeanPierre = name === 'jean-pierre' && admin?.business_role === 'business_admin' && admin?.calendar_scope === 'all_business' && admin?.service_scope === 'all_services';
  const marietjieSelf = name === 'marietjie' && marietjie && String(admin.staff_id || '') === String(marietjie.id);
  return christel || jeanPierre || marietjieSelf;
}
async function marietjieEarningsData(period = 'today') {
  const marietjie = await resolveMarietjieStaff(); const bounds = clinicBounds(period);
  const rows = (await pool.query(`SELECT a.id,a.starts_at,a.total_price,COALESCE(c.display_name,a.source_client_name,'Unknown client') AS client_name,COUNT(DISTINCT ast.staff_id)::int AS staff_count,COALESCE(string_agg(DISTINCT aps.service_name_snapshot, ', ') FILTER (WHERE aps.service_name_snapshot IS NOT NULL), '') AS services FROM appointments a JOIN appointment_staff ast_marietjie ON ast_marietjie.appointment_id=a.id AND ast_marietjie.staff_id=$1 JOIN appointment_staff ast ON ast.appointment_id=a.id LEFT JOIN appointment_services aps ON aps.appointment_id=a.id LEFT JOIN clients c ON c.id=a.client_id WHERE ${bounds} AND a.status='completed' GROUP BY a.id,c.display_name,a.source_client_name ORDER BY a.starts_at,a.id`, [marietjie.id])).rows;
  const qualifying = rows.filter(r => Number(r.staff_count) === 1 && r.total_price !== null);
  const joint = rows.filter(r => Number(r.staff_count) > 1);
  const unpriced = rows.filter(r => Number(r.staff_count) === 1 && r.total_price === null);
  const completedValue = qualifying.reduce((sum, row) => sum + Number(row.total_price || 0), 0);
  const integrity = await earningsIntegrity({ staffId: marietjie.id, staffName: marietjie.display_name, period });
  return { marietjie, rows, qualifying, joint, unpriced, completedValue, integrity };
}
function renderMarietjieEarnings(data, period = 'today') {
  const lines = ['*MARIETJIE — TREATMENT EARNINGS*', periodLabel(period), ''];
  const warnings = integrityLines(data.integrity); if (warnings.length) lines.push(...warnings, '');
  lines.push(`Completed solo appointments: *${data.qualifying.length}*`, `Completed treatment value: *${money(data.completedValue)}*`, `Marietjie earnings (100%): *${money(data.completedValue)}*${data.integrity?.clean ? '' : ' — provisional'}`);
  if (data.joint.length) lines.push('', `Joint-practitioner appointments excluded: *${data.joint.length}*`, 'They are not included until service-level attribution is explicit.');
  if (data.unpriced.length) lines.push('', `Completed appointments without a CRM price excluded: *${data.unpriced.length}*`);
  lines.push('', 'Marietjie earnings = 100% of qualifying completed treatments personally performed by Marietjie.', 'No fixed salary is included. Clinic-wide revenue and other practitioner earnings are kept separate.');
  return lines.join('\n');
}
async function audit(admin, period, data) {
  await pool.query(`INSERT INTO crm_audit_events (actor_admin_id, action, entity_type, entity_id, metadata) VALUES ($1,$2,'admin_report',NULL,$3::jsonb)`, [admin.id, `admin.report.marietjie_earnings_${period}`, JSON.stringify({ scope: normalizedName(admin.display_name), earningsRule: '100_percent_qualifying_completed_treatments_no_salary', qualifyingAppointments: data.qualifying.length, jointExcluded: data.joint.length, unpricedExcluded: data.unpriced.length, completedValue: data.completedValue, integrityClean: data.integrity.clean, pendingCanonicalStatus: data.integrity.pendingStatus.length, unresolvedGoldie: data.integrity.unresolvedGoldie.length, unresolvedGoldieValue: data.integrity.unresolvedGoldieValue })]);
}
async function processAdminMarietjieEarningsMessage(sender, text) {
  const command = parseMarietjieEarningsCommand(text); if (!command) return { handled: false };
  const admin = await getAdmin(sender); if (!admin) return { handled: false };
  if (admin?.permissions?.['appointment:view'] !== true) return { handled: true, admin, reply: 'Your admin account does not currently have permission to view appointment reports.' };
  const marietjie = await resolveMarietjieStaff();
  if (!authorizedViewer(admin, marietjie)) return { handled: true, admin, reply: 'Marietjie earnings are available only to Marietjie, Christel, and the authorized business admin.' };
  const data = await marietjieEarningsData(command.period); await audit(admin, command.period, data);
  return { handled: true, admin, reply: renderMarietjieEarnings(data, command.period) };
}
module.exports = { processAdminMarietjieEarningsMessage, parseMarietjieEarningsCommand, marietjieEarningsData, renderMarietjieEarnings, resolveMarietjieStaff, authorizedViewer, clinicBounds };
