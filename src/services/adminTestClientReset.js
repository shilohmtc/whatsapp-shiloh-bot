const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

const TEST_CLIENTS = Object.freeze({
  chenique: 'Chenique',
  juvan: 'Juvan',
  dummy_test: 'Dummy Test',
});

const TEST_CLIENT_ALIASES = Object.freeze({
  chenique: Object.freeze(['Chenique']),
  juvan: Object.freeze(['Juvan']),
  dummy_test: Object.freeze(['Dummy Test', 'CRM Dummy Test']),
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
  let match = raw.match(/^reset test client (chenique|juvan|dummy test|crm dummy test)$/i);
  if (match) {
    const key = match[1].toLowerCase().replace(/\s+/g, '_');
    return { mode: 'preview', key: key === 'crm_dummy_test' ? 'dummy_test' : key };
  }
  match = raw.match(/^admin_test_client_reset_confirm:(chenique|juvan|dummy_test)$/i);
  if (match) return { mode: 'confirm', key: match[1].toLowerCase() };
  match = raw.match(/^admin_test_client_reset_cancel:(chenique|juvan|dummy_test)$/i);
  if (match) return { mode: 'cancel', key: match[1].toLowerCase() };
  return null;
}

async function activeTargetClient(targetKey, db = pool, lock = false) {
  const aliases = TEST_CLIENT_ALIASES[targetKey];
  if (!aliases) return { status: 'invalid_target', rows: [] };
  const names = aliases.map((value) => value.toLowerCase());
  const result = await db.query(
    `SELECT id,display_name,status
       FROM clients
      WHERE lower(trim(display_name)) = ANY($1::text[])
        AND status='active'
      ORDER BY id${lock ? ' FOR UPDATE' : ''}`,
    [names]
  );
  if (result.rowCount === 0) return { status: 'not_found', rows: [] };
  if (result.rowCount !== 1) return { status: 'ambiguous', rows: result.rows };
  return { status: 'unique', client: result.rows[0], rows: result.rows };
}

async function releaseContactsForClient(clientId, db = pool, lock = false) {
  const result = await db.query(
    `SELECT id,contact_type,normalized_value,is_primary
       FROM client_contacts
      WHERE client_id=$1
        AND contact_type IN ('whatsapp','mobile')
      ORDER BY is_primary DESC, contact_type, id${lock ? ' FOR UPDATE' : ''}`,
    [clientId]
  );
  return result.rows;
}

function releasePhones(contacts = []) {
  return [...new Set(contacts.map((row) => normalizePhone(row.normalized_value)).filter(Boolean))];
}

async function findSharedActiveIdentity(clientId, phones, db = pool) {
  if (!phones.length) return { rowCount: 0, rows: [] };
  return db.query(
    `SELECT DISTINCT cc.client_id,c.display_name
       FROM client_contacts cc
       JOIN clients c ON c.id=cc.client_id
      WHERE regexp_replace(COALESCE(cc.normalized_value, cc.value, ''), '[^0-9]', '', 'g') = ANY($1::text[])
        AND cc.contact_type IN ('whatsapp','mobile')
        AND cc.client_id <> $2
        AND c.status='active'
      ORDER BY cc.client_id
      LIMIT 10`,
    [phones, clientId]
  );
}

function previewPhone(value) {
  const phone = normalizePhone(value);
  return phone ? `+${phone}` : String(value || '').trim();
}

function confirmationInteractive(targetKey, client, contacts = []) {
  const identities = contacts.map((contact) => {
    const type = contact.contact_type === 'whatsapp' ? 'WhatsApp' : 'Mobile';
    const primary = contact.is_primary ? ' — primary' : '';
    return `• ${type}: ${previewPhone(contact.normalized_value)}${primary}`;
  });
  const identityLines = identities.length ? identities : ['• No WhatsApp/mobile identity is currently attached.'];

  return {
    type: 'button',
    body: [
      '*Reset approved test client?*',
      '',
      `CRM profile: ${client.display_name}`,
      `CRM ID: #${client.id}`,
      'WhatsApp/mobile identity to release:',
      ...identityLines,
      '',
      'Confirm only if this is the exact CRM profile and phone identity intended for reassignment.',
      '',
      'The CRM profile will be archived; existing appointments and CRM/audit history will be preserved.',
      '',
      'This action remains limited to the approved Chenique/Juvan/Dummy Test booking-test profiles.',
    ].join('\n'),
    buttons: [
      { id: `admin_test_client_reset_confirm:${targetKey}`, title: 'Confirm reset' },
      { id: `admin_test_client_reset_cancel:${targetKey}`, title: 'Cancel' },
    ],
  };
}

async function previewTargetRelease(targetKey, db = pool) {
  const resolved = await activeTargetClient(targetKey, db, false);
  if (resolved.status !== 'unique') return resolved;

  const client = resolved.client;
  const contacts = await releaseContactsForClient(client.id, db, false);
  const phones = releasePhones(contacts);
  const sharedIdentity = await findSharedActiveIdentity(client.id, phones, db);
  if (sharedIdentity.rowCount) {
    return {
      status: 'identity_conflict',
      client,
      contacts,
      phones,
      conflicts: sharedIdentity.rows,
    };
  }

  return { status: 'ready', client, contacts, phones, conflicts: [] };
}

async function optionalPhoneCleanup(db, tableName, sql, phones) {
  if (!phones.length) return 0;
  const exists = await db.query('SELECT to_regclass($1) AS table_name', [`public.${tableName}`]);
  if (!exists.rows[0]?.table_name) return 0;
  const result = await db.query(sql, [phones]);
  return Number(result.rowCount || 0);
}

async function resetTargetClient(admin, targetKey, poolAdapter = pool) {
  const displayName = TEST_CLIENTS[targetKey];
  if (!displayName) return { status: 'invalid_target', reply: 'That test client is not eligible for reset.' };

  const db = await poolAdapter.connect();
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
    const contacts = await releaseContactsForClient(client.id, db, true);
    const phones = releasePhones(contacts);

    // Race-safe second guard: the preview check is advisory only; recheck while the reset transaction is open.
    const sharedIdentity = await findSharedActiveIdentity(client.id, phones, db);
    if (sharedIdentity.rowCount) {
      await db.query('ROLLBACK');
      return {
        status: 'identity_conflict',
        reply: `Reset blocked: ${client.display_name}'s WhatsApp/mobile number is also linked to another active CRM client. Resolve that identity conflict before releasing the number.`,
      };
    }

    let clearedConversationSessions = 0;
    let clearedUserProfiles = 0;
    if (phones.length) {
      await db.query(`DELETE FROM booking_intents WHERE phone = ANY($1::text[])`, [phones]);
      await db.query(`DELETE FROM client_onboarding_sessions WHERE phone = ANY($1::text[])`, [phones]);
      await db.query(`DELETE FROM booking_policy_acceptances WHERE phone = ANY($1::text[])`, [phones]);
      clearedConversationSessions = await optionalPhoneCleanup(
        db,
        'conversation_sessions',
        `DELETE FROM conversation_sessions WHERE phone = ANY($1::text[])`,
        phones
      );
      clearedUserProfiles = await optionalPhoneCleanup(
        db,
        'user_profiles',
        `DELETE FROM user_profiles
          WHERE regexp_replace(phone::text, '[^0-9]', '', 'g') = ANY($1::text[])`,
        phones
      );
    }

    const released = await db.query(
      `DELETE FROM client_contacts
        WHERE client_id=$1
          AND contact_type IN ('whatsapp','mobile')`,
      [client.id]
    );

    const residualContacts = await db.query(
      `SELECT COUNT(*)::int AS count
         FROM client_contacts
        WHERE client_id=$1
          AND contact_type IN ('whatsapp','mobile')`,
      [client.id]
    );
    if (Number(residualContacts.rows[0]?.count || 0) !== 0) {
      throw new Error('Test-client identity release postcondition failed');
    }

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
        clearedConversationSessions,
        clearedUserProfiles,
        preservedAppointmentHistory: true,
        purpose: 'real_whatsapp_booking_simulation',
      })]
    );

    await db.query('COMMIT');
    return {
      status: 'reset',
      client,
      reply: [
        `✅ ${client.display_name} test client reset complete.`,
        '',
        `Old CRM profile #${client.id} is archived and ${released.rowCount} WhatsApp/mobile contact record${released.rowCount === 1 ? '' : 's'} released.`,
        'Existing appointment and audit history was preserved, and temporary conversation/profile state was cleared.',
        '',
        'The next booking message from the released WhatsApp identity can now go through Shiloh as a new client registration.',
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
    const preview = await previewTargetRelease(target.key);
    if (preview.status === 'not_found') return { handled: true, admin, reply: `There is no active ${displayName} CRM profile to reset.` };
    if (preview.status === 'ambiguous') return { handled: true, admin, reply: `Reset blocked: more than one active ${displayName} CRM profile exists. Resolve the duplicate profiles before resetting.` };
    if (preview.status === 'identity_conflict') {
      return {
        handled: true,
        admin,
        reply: `Reset blocked before confirmation: ${preview.client.display_name}'s WhatsApp/mobile identity is also linked to another active CRM client. Resolve that identity conflict before releasing the number.`,
      };
    }
    if (preview.status !== 'ready') return { handled: true, admin, reply: 'Reset blocked: the approved test-client identity could not be resolved safely.' };
    return { handled: true, admin, interactive: confirmationInteractive(target.key, preview.client, preview.contacts) };
  }

  const result = await resetTargetClient(admin, target.key);
  return { handled: true, admin, reply: result.reply };
}

module.exports = {
  TEST_CLIENTS,
  TEST_CLIENT_ALIASES,
  canResetTestClients,
  targetFromText,
  activeTargetClient,
  releaseContactsForClient,
  releasePhones,
  findSharedActiveIdentity,
  previewPhone,
  confirmationInteractive,
  previewTargetRelease,
  optionalPhoneCleanup,
  resetTargetClient,
  processAdminTestClientResetMessage,
};
