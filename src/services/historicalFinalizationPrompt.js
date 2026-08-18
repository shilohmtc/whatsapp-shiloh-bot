const { pool } = require('../db/pool');
const { sendWhatsAppTemplate } = require('./whatsapp');
const {
  ACTION_TEMPLATE_NAME,
  ACTION_BUTTON_PAYLOAD,
  getStaffFinalizationActionTemplateStatus,
} = require('./staffFinalizationTemplateProvisioning');
const logger = require('../lib/logger');
const { certificationStaffIds } = require('./attendanceFinalizationAuthority');

const LANGUAGE_CODE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';
const SCAN_MINUTES = Math.max(Number(process.env.HISTORICAL_FINALIZATION_PROMPT_SCAN_MINUTES || 15), 5);
let timer = null;
let running = false;

async function ensurePromptLedger() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS historical_finalization_prompts (
      admin_id BIGINT PRIMARY KEY REFERENCES staff_admin_accounts(id) ON DELETE CASCADE,
      pending_count INTEGER NOT NULL CHECK (pending_count > 0),
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function approvedActionTemplate() {
  try {
    const status = await getStaffFinalizationActionTemplateStatus();
    const providerStatus = String(status?.template?.status || '').toUpperCase();
    if (providerStatus !== 'APPROVED') return { approved: false, providerStatus: providerStatus || status?.reason || 'not_found' };
    return { approved: true, templateName: ACTION_TEMPLATE_NAME, providerStatus };
  } catch (error) {
    logger.warn({ err: error }, 'Historical finalization action template status check failed; prompt remains fail-closed');
    return { approved: false, providerStatus: 'status_check_failed' };
  }
}

async function recipients() {
  const result = await pool.query(`
    SELECT id AS admin_id, staff_id, normalized_whatsapp, display_name, lower(trim(display_name)) AS admin_name
      FROM staff_admin_accounts
     WHERE active=TRUE
       AND lower(trim(display_name)) IN ('christel','abigail','marietjie')
     ORDER BY id
  `);
  return result.rows;
}

async function pendingTotalForAuthority(admin) {
  const allowed = await certificationStaffIds(admin);
  if (!allowed.length) return 0;

  const result = await pool.query(`
    SELECT COUNT(*)::int AS count
      FROM (
        SELECT a.id
          FROM appointments a
          JOIN appointment_staff ast ON ast.appointment_id=a.id
         WHERE a.ends_at < NOW()
           AND a.status NOT IN ('completed','cancelled','no_show')
         GROUP BY a.id
        HAVING COUNT(*) FILTER (WHERE ast.staff_id IS NOT NULL) > 0
           AND BOOL_AND(ast.staff_id = ANY($1::bigint[]))
      ) pending
  `, [allowed]);
  return Number(result.rows[0]?.count || 0);
}

async function claim(adminId, pendingCount) {
  await ensurePromptLedger();
  const result = await pool.query(`
    INSERT INTO historical_finalization_prompts (admin_id,pending_count)
    VALUES ($1,$2)
    ON CONFLICT (admin_id) DO NOTHING
    RETURNING admin_id
  `, [adminId, pendingCount]);
  return Boolean(result.rowCount);
}

async function undoClaim(adminId) {
  await pool.query(`DELETE FROM historical_finalization_prompts WHERE admin_id=$1`, [adminId]);
}

async function processHistoricalFinalizationPrompts() {
  const template = await approvedActionTemplate();
  if (!template.approved) return { enabled: false, sent: 0, reason: 'action_template_not_approved', providerStatus: template.providerStatus };

  await ensurePromptLedger();
  const admins = await recipients();
  let sent = 0;
  const results = [];

  for (const admin of admins) {
    const pendingCount = await pendingTotalForAuthority(admin);
    if (!pendingCount) { results.push({ admin: admin.admin_name, pendingCount: 0, sent: false }); continue; }
    if (!(await claim(admin.admin_id, pendingCount))) { results.push({ admin: admin.admin_name, pendingCount, sent: false, reason: 'already_prompted' }); continue; }
    try {
      await sendWhatsAppTemplate(
        admin.normalized_whatsapp,
        template.templateName,
        [admin.display_name, String(pendingCount)],
        LANGUAGE_CODE,
        [ACTION_BUTTON_PAYLOAD]
      );
      sent += 1;
      results.push({ admin: admin.admin_name, pendingCount, sent: true });
      logger.info({ adminId: admin.admin_id, pendingCount, templateName: template.templateName }, 'Historical finalization button prompt sent');
    } catch (error) {
      await undoClaim(admin.admin_id);
      results.push({ admin: admin.admin_name, pendingCount, sent: false, reason: 'send_failed' });
      logger.error({ err: error, adminId: admin.admin_id, pendingCount }, 'Historical finalization button prompt failed');
    }
  }
  return { enabled: true, sent, results };
}

async function runScan() {
  if (running) return;
  running = true;
  try { await processHistoricalFinalizationPrompts(); }
  catch (error) { logger.error({ err: error }, 'Historical finalization prompt scan failed'); }
  finally { running = false; }
}

function startHistoricalFinalizationPromptScheduler() {
  if (timer) return;
  logger.info({ scanMinutes: SCAN_MINUTES, templateName: ACTION_TEMPLATE_NAME }, 'Historical finalization button prompt scheduler started');
  setTimeout(runScan, 10000).unref();
  timer = setInterval(runScan, SCAN_MINUTES * 60 * 1000);
  timer.unref();
}

module.exports = {
  ensurePromptLedger,
  approvedActionTemplate,
  pendingTotalForAuthority,
  processHistoricalFinalizationPrompts,
  startHistoricalFinalizationPromptScheduler,
};
