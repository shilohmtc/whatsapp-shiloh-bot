const { pool } = require('../db/pool');
const { sendWhatsAppTemplate } = require('./whatsapp');
const { TEMPLATE_NAME, getStaffFinalizationTemplateStatus } = require('./staffFinalizationTemplateProvisioning');
const logger = require('../lib/logger');

const SCAN_MINUTES = Math.max(Number(process.env.ATTENDANCE_FINALIZATION_SCAN_MINUTES || 15), 5);
const END_OF_DAY_HOUR = Math.min(Math.max(Number(process.env.ATTENDANCE_FINALIZATION_EOD_HOUR || 19), 0), 23);
const NEXT_MORNING_HOUR = Math.min(Math.max(Number(process.env.ATTENDANCE_FINALIZATION_MORNING_HOUR || 8), 0), 23);
const TEMPLATE_OVERRIDE = process.env.WHATSAPP_STAFF_FINALIZATION_TEMPLATE || '';
const LANGUAGE_CODE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';
const TEMPLATE_STATUS_CACHE_MS = Math.max(Number(process.env.STAFF_FINALIZATION_TEMPLATE_STATUS_CACHE_MINUTES || 30), 5) * 60 * 1000;

let timer = null;
let running = false;
let initialized = false;
let templateStatusCache = { checkedAt: 0, templateName: null, providerStatus: null };

async function ensureReminderTable() {
  if (initialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_finalization_reminders (
      id BIGSERIAL PRIMARY KEY,
      admin_id BIGINT NOT NULL REFERENCES staff_admin_accounts(id) ON DELETE CASCADE,
      clinic_date DATE NOT NULL,
      reminder_kind TEXT NOT NULL CHECK (reminder_kind IN ('end_of_day','next_morning')),
      pending_count INTEGER NOT NULL CHECK (pending_count > 0),
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (admin_id, clinic_date, reminder_kind)
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendance_finalization_reminders_date ON attendance_finalization_reminders (clinic_date, reminder_kind)`);
  initialized = true;
}

async function resolveApprovedTemplateName(nowMs = Date.now()) {
  if (TEMPLATE_OVERRIDE) return { templateName: TEMPLATE_OVERRIDE, providerStatus: 'explicit_override' };
  if (templateStatusCache.checkedAt && nowMs - templateStatusCache.checkedAt < TEMPLATE_STATUS_CACHE_MS) return templateStatusCache;
  try {
    const status = await getStaffFinalizationTemplateStatus();
    const providerStatus = String(status?.template?.status || '').toUpperCase() || null;
    templateStatusCache = {
      checkedAt: nowMs,
      templateName: providerStatus === 'APPROVED' ? TEMPLATE_NAME : null,
      providerStatus: providerStatus || status?.reason || 'not_found',
    };
  } catch (error) {
    logger.warn({ err: error }, 'Staff finalization template status check failed; reminders remain disabled');
    templateStatusCache = { checkedAt: nowMs, templateName: null, providerStatus: 'status_check_failed' };
  }
  return templateStatusCache;
}

function johannesburgParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
  }).formatToParts(now);
  const p = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}

function offsetClinicDate(dateText, offsetDays) {
  const date = new Date(`${dateText}T12:00:00+02:00`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function reminderWindow(now = new Date()) {
  const local = johannesburgParts(now);
  if (local.hour >= END_OF_DAY_HOUR) return { clinicDate: local.date, kind: 'end_of_day' };
  if (local.hour >= NEXT_MORNING_HOUR && local.hour < END_OF_DAY_HOUR) return { clinicDate: offsetClinicDate(local.date, -1), kind: 'next_morning' };
  return null;
}

async function reminderRecipients() {
  const result = await pool.query(`SELECT saa.id AS admin_id, saa.normalized_whatsapp, saa.display_name, saa.staff_id, lower(trim(saa.display_name)) AS admin_name FROM staff_admin_accounts saa WHERE saa.active=TRUE AND lower(trim(saa.display_name)) IN ('christel','abigail','marietjie') ORDER BY saa.id`);
  return result.rows;
}

async function activeStaffIdsByName(names) {
  const result = await pool.query(`SELECT id, lower(trim(display_name)) AS name FROM staff WHERE status='active' AND lower(trim(display_name)) = ANY($1::text[])`, [names]);
  return new Map(result.rows.map((row) => [row.name, Number(row.id)]));
}

async function pendingCountForAuthority(admin, clinicDate, staffMap) {
  let allowed = [];
  if (admin.admin_name === 'christel') allowed = [staffMap.get('christel'), staffMap.get('abigail')].filter(Boolean);
  if (admin.admin_name === 'abigail') allowed = [staffMap.get('abigail')].filter(Boolean);
  if (admin.admin_name === 'marietjie') allowed = [staffMap.get('marietjie')].filter(Boolean);
  if (!allowed.length) return 0;
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM (SELECT a.id FROM appointments a JOIN appointment_staff ast ON ast.appointment_id=a.id WHERE (a.ends_at AT TIME ZONE 'Africa/Johannesburg')::date=$1::date AND a.ends_at < NOW() AND a.status NOT IN ('completed','cancelled','no_show') GROUP BY a.id HAVING COUNT(*) FILTER (WHERE ast.staff_id IS NOT NULL) > 0 AND BOOL_AND(ast.staff_id = ANY($2::bigint[]))) pending`, [clinicDate, allowed]);
  return Number(result.rows[0]?.count || 0);
}

async function claimReminder(adminId, clinicDate, kind, pendingCount) {
  await ensureReminderTable();
  const result = await pool.query(`INSERT INTO attendance_finalization_reminders (admin_id, clinic_date, reminder_kind, pending_count) VALUES ($1,$2,$3,$4) ON CONFLICT (admin_id, clinic_date, reminder_kind) DO NOTHING RETURNING id`, [adminId, clinicDate, kind, pendingCount]);
  return result.rows[0]?.id || null;
}

async function undoClaim(id) { if (id) await pool.query(`DELETE FROM attendance_finalization_reminders WHERE id=$1`, [id]); }
function reminderLabel(kind) { return kind === 'next_morning' ? 'still need finalization from the previous clinic day' : 'need finalization from today'; }

async function processAttendanceFinalizationReminders(now = new Date()) {
  const template = await resolveApprovedTemplateName();
  if (!template.templateName) return { enabled: false, sent: 0, reason: 'template_not_approved', providerStatus: template.providerStatus };
  await ensureReminderTable();
  const window = reminderWindow(now);
  if (!window) return { enabled: true, sent: 0, reason: 'outside_window' };
  const [admins, staffMap] = await Promise.all([reminderRecipients(), activeStaffIdsByName(['christel', 'abigail', 'marietjie'])]);
  let sent = 0;
  for (const admin of admins) {
    const pendingCount = await pendingCountForAuthority(admin, window.clinicDate, staffMap);
    if (!pendingCount) continue;
    const claimId = await claimReminder(admin.admin_id, window.clinicDate, window.kind, pendingCount);
    if (!claimId) continue;
    try {
      await sendWhatsAppTemplate(admin.normalized_whatsapp, template.templateName, [admin.display_name, String(pendingCount), window.clinicDate, reminderLabel(window.kind)], LANGUAGE_CODE);
      sent += 1;
      logger.info({ adminId: admin.admin_id, clinicDate: window.clinicDate, kind: window.kind, pendingCount }, 'Attendance finalization reminder sent');
    } catch (error) {
      await undoClaim(claimId);
      logger.error({ err: error, adminId: admin.admin_id, clinicDate: window.clinicDate, kind: window.kind }, 'Attendance finalization reminder failed');
    }
  }
  return { enabled: true, sent, clinicDate: window.clinicDate, kind: window.kind };
}

async function runScan() { if (running) return; running=true; try { await processAttendanceFinalizationReminders(); } catch (error) { logger.error({ err:error }, 'Attendance finalization reminder scan failed'); } finally { running=false; } }
function startAttendanceFinalizationReminderScheduler() {
  if (timer) return;
  logger.info({ templateOverrideConfigured:Boolean(TEMPLATE_OVERRIDE), scanMinutes:SCAN_MINUTES, endOfDayHour:END_OF_DAY_HOUR, nextMorningHour:NEXT_MORNING_HOUR }, 'Attendance finalization reminder scheduler started');
  setTimeout(runScan,7000).unref(); timer=setInterval(runScan,SCAN_MINUTES*60*1000); timer.unref();
}

module.exports = { ensureReminderTable, resolveApprovedTemplateName, johannesburgParts, offsetClinicDate, reminderWindow, pendingCountForAuthority, processAttendanceFinalizationReminders, startAttendanceFinalizationReminderScheduler };
