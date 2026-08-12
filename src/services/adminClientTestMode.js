const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

const START_COMMAND = /^(?:start\s+)?client test(?: mode)?$|^test as (?:a )?new client$/i;
const EXIT_COMMAND = /^(?:exit|end|stop)\s+client test(?: mode)?$|^admin mode$|^back to admin$/i;

function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function lowerName(value = '') {
  return clean(value).toLowerCase();
}

async function ensureClientTestModeSchema(db = pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_client_test_sessions (
      admin_id BIGINT PRIMARY KEY REFERENCES staff_admin_accounts(id) ON DELETE CASCADE,
      normalized_whatsapp TEXT NOT NULL UNIQUE,
      active BOOLEAN NOT NULL DEFAULT FALSE,
      started_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureJeanPierreAdminCapabilities(db = pool) {
  await ensureClientTestModeSchema(db);
  const result = await db.query(`
    UPDATE staff_admin_accounts jp
       SET role = 'admin',
           business_role = 'business_admin',
           calendar_scope = 'all_business',
           service_scope = 'all_services',
           permissions = (COALESCE(c.permissions, '{}'::jsonb) - 'demo:client') || '{"client:test_mode":true}'::jsonb,
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

async function findAdminByPhone(sender) {
  const normalized = normalizePhone(sender);
  const result = await pool.query(`
    SELECT id, display_name, role, business_role, calendar_scope, service_scope, permissions, active
      FROM staff_admin_accounts
     WHERE normalized_whatsapp = $1
     LIMIT 1
  `, [normalized]);
  return result.rows[0] || null;
}

async function getSessionByPhone(sender) {
  await ensureClientTestModeSchema();
  const normalized = normalizePhone(sender);
  const result = await pool.query(`
    SELECT s.*, a.display_name, a.permissions, a.active AS admin_active
      FROM admin_client_test_sessions s
      JOIN staff_admin_accounts a ON a.id = s.admin_id
     WHERE s.normalized_whatsapp = $1
     LIMIT 1
  `, [normalized]);
  return result.rows[0] || null;
}

async function countActiveClientsForPhone(sender) {
  const normalized = normalizePhone(sender);
  const result = await pool.query(`
    SELECT COUNT(DISTINCT c.id)::int AS client_count
      FROM clients c
      JOIN client_contacts cc ON cc.client_id = c.id
     WHERE c.status = 'active'
       AND cc.normalized_value = $1
       AND cc.contact_type IN ('whatsapp','phone','mobile')
  `, [normalized]);
  return Number(result.rows[0]?.client_count || 0);
}

async function hasActiveDemoSession(adminId) {
  const result = await pool.query(`
    SELECT 1
      FROM admin_client_demo_sessions
     WHERE admin_id = $1 AND active = TRUE
     LIMIT 1
  `, [adminId]);
  return result.rowCount > 0;
}

async function clearTemporaryClientState(sender) {
  const normalized = normalizePhone(sender);
  await pool.query('DELETE FROM booking_intents WHERE phone = $1', [normalized]);
  await pool.query('DELETE FROM client_onboarding_sessions WHERE phone = $1', [normalized]);
  await pool.query('DELETE FROM booking_policy_acceptances WHERE phone = $1', [normalized]);
}

async function audit(adminId, action, metadata = {}) {
  await pool.query(`
    INSERT INTO crm_audit_events (actor_admin_id, action, entity_type, entity_id, metadata)
    VALUES ($1, $2, 'admin_client_test', NULL, $3::jsonb)
  `, [adminId, action, JSON.stringify(metadata)]);
}

async function startClientTest(admin, sender) {
  if (!admin?.active || admin?.permissions?.['client:test_mode'] !== true || lowerName(admin.display_name) !== 'jean-pierre') {
    return { handled: false, active: false };
  }

  const activeClients = await countActiveClientsForPhone(sender);
  if (activeClients > 0) {
    return {
      handled: true,
      active: false,
      admin,
      reply: 'Client Test Mode was not started because this WhatsApp number is already linked to an active Shiloh CRM client. A first-time-client acceptance test must begin with an unlinked client identity.',
    };
  }

  if (await hasActiveDemoSession(admin.id)) {
    return {
      handled: true,
      active: false,
      admin,
      reply: 'Client Test Mode was not started because a Demo Client session is still active. Exit or clean up Demo Client first, then start Client Test Mode.',
    };
  }

  await clearTemporaryClientState(sender);
  const normalized = normalizePhone(sender);
  await pool.query(`
    INSERT INTO admin_client_test_sessions (admin_id, normalized_whatsapp, active, started_at, ended_at, updated_at)
    VALUES ($1, $2, TRUE, NOW(), NULL, NOW())
    ON CONFLICT (admin_id) DO UPDATE SET
      normalized_whatsapp = EXCLUDED.normalized_whatsapp,
      active = TRUE,
      started_at = NOW(),
      ended_at = NULL,
      updated_at = NOW()
  `, [admin.id, normalized]);
  await audit(admin.id, 'admin.client_test_started', { realWhatsAppIdentity: true, adminAuthorizationPreserved: true });
  return {
    handled: true,
    active: true,
    admin,
    reply: '*Client Test Mode active 🧪*\n\nYour Admin authorization is still intact, but Admin routing is temporarily suppressed for this WhatsApp conversation. Your next message will be processed exactly through Shiloh’s normal client journey using this real number.\n\nFor a first-time-client test, send *Hello* or *Book now*.\n\nWhen the booking is complete, send *ADMIN MODE* to restore Admin routing. The CRM appointment and Google Calendar entries will remain in place for verification until we deliberately clean them up.',
  };
}

async function exitClientTest(session) {
  await pool.query(`
    UPDATE admin_client_test_sessions
       SET active = FALSE, ended_at = NOW(), updated_at = NOW()
     WHERE admin_id = $1
  `, [session.admin_id]);
  await audit(session.admin_id, 'admin.client_test_ended', { recordsPreservedForVerification: true });
  return {
    handled: true,
    active: false,
    reply: '*Admin mode restored ✅*\n\nClient Test Mode is off. Your Admin authorization was never removed. Any CRM client/appointment and Google Calendar entries created during the test remain untouched so we can verify them before deliberate cleanup.',
  };
}

async function processAdminClientTestModeControl(sender, text) {
  await ensureClientTestModeSchema();
  const raw = clean(text);
  const session = await getSessionByPhone(sender);

  if (session?.active) {
    if (EXIT_COMMAND.test(raw)) return exitClientTest(session);
    return { handled: false, active: true, adminId: session.admin_id };
  }

  if (!START_COMMAND.test(raw)) return { handled: false, active: false };
  const admin = await findAdminByPhone(sender);
  return startClientTest(admin, sender);
}

module.exports = {
  START_COMMAND,
  EXIT_COMMAND,
  ensureClientTestModeSchema,
  ensureJeanPierreAdminCapabilities,
  processAdminClientTestModeControl,
};
