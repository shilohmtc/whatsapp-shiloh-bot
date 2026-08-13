const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

const TEST_CLIENTS = Object.freeze({
  chenique: 'Chenique',
  juvan: 'Juvan',
  dummy_test: 'Dummy Test',
});

function normalizedName(admin) {
  return String(admin?.display_name || '').trim().toLowerCase();
}

function canResetTestClients(admin) {
  const name = normalizedName(admin);
  if (name === 'christel') {
    return ['owner', 'business_admin'].includes(admin?.business_role) && admin?.calendar_scope === 'all_business';
  }
  if (name === 'jean-pierre') {
    return admin?.business_role === 'business_admin' && admin?.calendar_scope === 'all_business' && admin?.service_scope === 'all_services';
  }
  return false;
}

async function getAdmin(sender, db = pool) {
  const result = await db.query(
    `SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope
       FROM staff_admin_accounts
      WHERE normalized_whatsapp=$1 AND active=TRUE`,
    [normalizePhone(sender)]
  );
  return result.rows[0] || null;
}

function targetFromText(text = '') {
  const raw = String(text).trim();
  let match = raw.match(/^reset test client (chenique|juvan|dummy test)$/i);
  if (match) return { mode: 'preview', key: match[1].toLowerCase().replace(/\s+/g, '_') };
  match = raw.match(/^admin_test_client_reset_confirm:(chenique|juvan|dummy_test)$/i);
  if (match) return { mode: 'confirm', key: match[1].toLowerCase() };
  match = raw.match(/^admin_test_client_reset_cancel:(chenique|juvan|dummy_test)$/i);
  if (match) return { mode: 'cancel', key: match[1].toLowerCase() };
  return null;
}

async function activeTargetClient(targetKey, db = pool, lock = false) {
  const displayName = TEST_CLIENTS[targetKey];
  if (!displayName) return { status: 'invalid_target', rows: [] };
  const result = await db.query(
    `SELECT id,display_name,status
       FROM clients
      WHERE lower(trim(display_name))=$1
        AND status='active'
      ORDER BY id${lock ? ' FOR UPDATE' : ''}`,
    [displayName.toLowerCase()]
  );
  if (result.rowCount === 0) return { status: 'not_found', rows: [] };
  if (result.rowCount !== 1) return { status: 'ambiguous', rows: result.rows };
  return { status: 'unique', client: result.rows[0], rows: result.rows };
}

function confirmationInteractive(targetKey, client) {
  const displayName = TEST_CLIENTS[targetKey];
  return {
    type: 'button',
    body: [
      `*Reset ${displayName} test client?*`,
      '',
      `CRM #${client.id} will be archived and its WhatsApp/mobile identity released so the next booking from that account starts as a brand-new client registration.`,
      '',
      'Existing appointments and historical CRM/audit records will be preserved.',
      '',
      'This action is limited to the Chenique/Juvan booking-test profiles.',
    ].join('\n'),
    buttons: [
      { id: `admin_test_client_reset_confirm:${targetKey}`, title: 'Confirm reset' },
      { id: `admin_test_client_reset_cancel:${targetKey}`, title: 'Cancel' },
    ],
  };
}

async function resetTargetClient(admin, targetKey) {
  const displayName = TEST_CLIENTS[targetKey];
  if (!displayName) return { status: 'invalid_target', reply: 'That test client is not eligible for reset.' };

  const db = await pool.connect();
  try {
    await db.query('BEGIN');

    const locked = await activeTargetClient(targetKey, db, true);
    if (locked.status === 'not_found') {
      await db.query('ROLLBACK');
      return { status: 'not_found', reply: `There is no active ${displayName} CRM profile to reset.` };
    }
    if (locked.status !== 'unique') {
      await db.query('ROLLBACK');
      return { status: 'ambiguous', reply: `Reset blocked: more than one active ${displayName} CRM profile exists. Resolve the duplicate profiles before resetting.` };
    }

    const client = locked.client;
    const contacts = await db.query(
      `SELECT id,normalized_value
         FROM client_contacts
        WHERE client_id=$1
          AND contact_type IN ('whatsapp','mobile')
        FOR UPDATE`,
      [client.id]
    );
    const phones = [...new Set(contacts.rows.map((row) => normalizePhone(row.normalized_value)).filter(Boolean))];

    if (phones.length) {
      await db.query(`DELETE FROM booking_intents WHERE phone = ANY($1::text[])`, [phones]);
      await db.query(`DELETE FROM client_onboarding_sessions WHERE phone = ANY($1::text[])`, [phones]);
      await db.query(`DELETE FROM booking_policy_acceptances WHERE phone = ANY($1::text[])`, [phones]);
    }

    const released = await db.query(
      `DELETE FROM client_contacts
        WHERE client_id=$1
          AND contact_type IN ('whatsapp','mobile')`,
      [client.id]
    );

    await db.query(
      `UPDATE clients
          SET status='inactive',
              updated_at=NOW(),
              custom_attributes=COALESCE(custom_attributes,'{}'::jsonb) || jsonb_build_object(
                'test_client_reset', TRUE,
                'test_client_reset_by_admin_id', $2::bigint,
                'test_client_reset_at', NOW()::text,
                'test_client_reset_reason', 'real_whatsapp_booking_simulation'
              )
        WHERE id=$1`,
      [client.id, admin.id]
    );

    await db.query(
      `INSERT INTO crm_audit_events
         (actor_admin_id,action,entity_type,entity_id,metadata)
       VALUES ($1,'admin.test_client_reset','client',$2,$3::jsonb)`,
      [admin.id, String(client.id), JSON.stringify({
        target: targetKey,
        displayName: client.display_name,
        releasedContactRows: released.rowCount,
        releasedIdentityCount: phones.length,
        preservedAppointmentHistory: true,
        purpose: 'real_whatsapp_booking_simulation',
      })]
    );

    await db.query('COMMIT');
    return {
      status: 'reset',
      client,
      reply: [
        `✅ ${displayName} test client reset complete.`,
        '',
        `Old CRM profile #${client.id} is archived and ${released.rowCount} WhatsApp/mobile contact record${released.rowCount === 1 ? '' : 's'} released.`,
        'Existing appointment and audit history was preserved.',
        '',
        `The next booking message from ${displayName}'s WhatsApp can now go through Shiloh as a new client registration.`,
      ].join('\n'),
    };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

async function processAdminTestClientResetMessage(sender, text) {
  const target = targetFromText(text);
  if (!target) return { handled: false };

  const admin = await getAdmin(sender);
  if (!admin) return { handled: false };
  if (!canResetTestClients(admin)) {
    return { handled: true, admin, reply: 'This test-client reset is restricted to Christel and Jean-Pierre business administration.' };
  }

  const displayName = TEST_CLIENTS[target.key];
  if (target.mode === 'cancel') {
    return { handled: true, admin, reply: `${displayName} test-client reset cancelled. Nothing was changed.` };
  }

  if (target.mode === 'preview') {
    const resolved = await activeTargetClient(target.key);
    if (resolved.status === 'not_found') return { handled: true, admin, reply: `There is no active ${displayName} CRM profile to reset.` };
    if (resolved.status !== 'unique') return { handled: true, admin, reply: `Reset blocked: more than one active ${displayName} CRM profile exists. Resolve the duplicate profiles before resetting.` };
    return { handled: true, admin, interactive: confirmationInteractive(target.key, resolved.client) };
  }

  const result = await resetTargetClient(admin, target.key);
  return { handled: true, admin, reply: result.reply };
}

module.exports = {
  TEST_CLIENTS,
  canResetTestClients,
  targetFromText,
  activeTargetClient,
  confirmationInteractive,
  resetTargetClient,
  processAdminTestClientResetMessage,
};
