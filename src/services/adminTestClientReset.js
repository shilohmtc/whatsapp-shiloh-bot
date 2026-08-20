const { pool } = require('../db/pool');
const {
  DEMO_KEY,
  POLICY_KEY,
  normalizeControlledPhone,
  getControlledDemoIdentity,
} = require('./controlledDemoIdentity');

const CONTROLLED_DEMO_NAME = 'Juvan Botha';
const CONFIRM_ID = 'admin_controlled_demo_reset_confirm:juvan_botha';
const CANCEL_ID = 'admin_controlled_demo_reset_cancel:juvan_botha';

function normalizedAdminName(admin) {
  return String(admin?.display_name || '').trim().toLowerCase();
}

function canResetJuvan(admin) {
  return normalizedAdminName(admin) === 'jean-pierre'
    && admin?.business_role === 'business_admin'
    && admin?.calendar_scope === 'all_business'
    && admin?.service_scope === 'all_services';
}

async function getAdmin(sender, db = pool) {
  const normalized = normalizeControlledPhone(sender);
  const result = await db.query(
    `SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope
       FROM staff_admin_accounts
      WHERE normalized_whatsapp=$1
        AND active=TRUE`,
    [normalized]
  );
  return result.rows[0] || null;
}

function targetFromText(text = '') {
  const raw = String(text || '').trim();
  if (/^reset (?:test client )?juvan(?: botha| profile)?$/i.test(raw)) return { mode: 'preview' };
  if (/^admin_controlled_demo_reset_confirm:juvan_botha$/i.test(raw)
      || /^admin_test_client_reset_confirm:juvan$/i.test(raw)) return { mode: 'confirm' };
  if (/^admin_controlled_demo_reset_cancel:juvan_botha$/i.test(raw)
      || /^admin_test_client_reset_cancel:juvan$/i.test(raw)) return { mode: 'cancel' };
  return null;
}

async function releaseContactsForClient(clientId, db = pool, lock = false) {
  const result = await db.query(
    `SELECT id,contact_type,normalized_value,is_primary
       FROM client_contacts
      WHERE client_id=$1
        AND contact_type IN ('whatsapp','mobile')
      ORDER BY is_primary DESC,contact_type,id${lock ? ' FOR UPDATE' : ''}`,
    [clientId]
  );
  return result.rows;
}

function releasePhones(contacts = []) {
  return [...new Set(contacts.map((row) => normalizeControlledPhone(row.normalized_value)).filter(Boolean))];
}

async function findSharedActiveIdentity(clientId, normalizedPhone, db = pool) {
  if (!normalizedPhone) return { rowCount: 0, rows: [] };
  return db.query(
    `SELECT DISTINCT cc.client_id,c.display_name
       FROM client_contacts cc
       JOIN clients c ON c.id=cc.client_id
      WHERE regexp_replace(COALESCE(cc.normalized_value, cc.value, ''), '[^0-9]', '', 'g')=$1
        AND cc.contact_type IN ('whatsapp','mobile')
        AND cc.client_id<>$2
        AND c.status='active'
      ORDER BY cc.client_id
      LIMIT 10`,
    [normalizedPhone, clientId]
  );
}

async function resolveBoundJuvan(db = pool, lock = false) {
  let demo;
  try {
    demo = await getControlledDemoIdentity(db, lock);
  } catch (error) {
    if (error.code === 'CONTROLLED_DEMO_CONFIG') return { status: 'config_error' };
    throw error;
  }

  if (!demo.current_client_id) {
    return { status: 'unbound', demo };
  }

  const clientResult = await db.query(
    `SELECT id,display_name,status
       FROM clients
      WHERE id=$1${lock ? ' FOR UPDATE' : ''}`,
    [demo.current_client_id]
  );
  if (clientResult.rowCount !== 1 || clientResult.rows[0].status !== 'active') {
    return { status: 'client_drift', demo, client: clientResult.rows[0] || null };
  }

  const client = clientResult.rows[0];
  const contacts = await releaseContactsForClient(client.id, db, lock);
  const phones = releasePhones(contacts);
  if (!contacts.length || phones.length !== 1 || phones[0] !== demo.normalized_phone) {
    return { status: 'identity_drift', demo, client, contacts, phones };
  }

  const sharedIdentity = await findSharedActiveIdentity(client.id, demo.normalized_phone, db);
  if (sharedIdentity.rowCount) {
    return {
      status: 'identity_conflict',
      demo,
      client,
      contacts,
      phones,
      conflicts: sharedIdentity.rows,
    };
  }

  return { status: 'ready', demo, client, contacts, phones, conflicts: [] };
}

function previewPhone(value) {
  const phone = normalizeControlledPhone(value);
  return phone ? `+${phone}` : String(value || '').trim();
}

function confirmationInteractive(client, contacts = []) {
  const identities = contacts.map((contact) => {
    const type = contact.contact_type === 'whatsapp' ? 'WhatsApp' : 'Mobile';
    const primary = contact.is_primary ? ' — primary' : '';
    return `• ${type}: ${previewPhone(contact.normalized_value)}${primary}`;
  });

  return {
    type: 'button',
    body: [
      '*Reset controlled Juvan demo identity?*',
      '',
      `CRM profile: ${client.display_name}`,
      `CRM ID: #${client.id}`,
      'Controlled WhatsApp/mobile identity to release:',
      ...(identities.length ? identities : ['• No releasable identity found']),
      '',
      'Confirm only if this is the exact business-controlled Juvan device and current CRM profile.',
      '',
      'The current CRM profile will be archived. Existing appointments and CRM/audit history will be preserved.',
      'The controlled demo identity will remain unbound until this same phone completes normal new-client registration.',
    ].join('\n'),
    buttons: [
      { id: CONFIRM_ID, title: 'Confirm reset' },
      { id: CANCEL_ID, title: 'Cancel' },
    ],
  };
}

async function optionalPhoneCleanup(db, tableName, sql, phones) {
  if (!phones.length) return 0;
  const exists = await db.query('SELECT to_regclass($1) AS table_name', [`public.${tableName}`]);
  if (!exists.rows[0]?.table_name) return 0;
  const result = await db.query(sql, [phones]);
  return Number(result.rowCount || 0);
}

function resolutionReply(status) {
  if (status === 'unbound') return 'Reset blocked: the controlled Juvan demo identity is already unbound. Complete the normal new-client registration from the controlled Juvan phone before another reset.';
  if (status === 'identity_conflict') return 'Reset blocked: the controlled Juvan WhatsApp/mobile identity is also linked to another active CRM client. Resolve that identity conflict before releasing the number.';
  if (status === 'identity_drift') return 'Reset blocked: the current Juvan CRM profile no longer has exactly the configured controlled WhatsApp/mobile identity. Resolve the CRM identity drift before resetting.';
  if (status === 'client_drift') return 'Reset blocked: the controlled Juvan identity points to a missing or inactive current CRM client. Resolve the controlled identity pointer before resetting.';
  return 'Reset blocked: the controlled Juvan demo identity could not be resolved safely.';
}

async function resetControlledJuvan(admin, poolAdapter = pool) {
  if (!canResetJuvan(admin)) {
    return { status: 'unauthorized', reply: 'Reset Juvan is restricted to Jean-Pierre business administration.' };
  }

  const db = await poolAdapter.connect();
  try {
    await db.query('BEGIN');

    const resolved = await resolveBoundJuvan(db, true);
    if (resolved.status !== 'ready') {
      await db.query('ROLLBACK');
      return { status: resolved.status, reply: resolutionReply(resolved.status) };
    }

    const { demo, client, contacts, phones } = resolved;
    const policy = await db.query(
      `SELECT policy_key,client_id,approver_admin_id,active
         FROM client_booking_approval_policies
        WHERE policy_key=$1
        FOR UPDATE`,
      [POLICY_KEY]
    );
    if (policy.rowCount !== 1
        || policy.rows[0].active !== true
        || String(policy.rows[0].client_id || '') !== String(client.id)
        || String(policy.rows[0].approver_admin_id || '') !== String(admin.id)) {
      await db.query('ROLLBACK');
      return {
        status: 'policy_drift',
        reply: 'Reset blocked: the controlled Juvan approval policy does not match the current canonical client and Jean-Pierre authority.',
      };
    }

    const controlledPhone = demo.normalized_phone;
    if (phones.length !== 1 || phones[0] !== controlledPhone) {
      await db.query('ROLLBACK');
      return { status: 'identity_drift', reply: resolutionReply('identity_drift') };
    }

    await db.query('DELETE FROM booking_intents WHERE phone = ANY($1::text[])', [phones]);
    await db.query('DELETE FROM client_onboarding_sessions WHERE phone = ANY($1::text[])', [phones]);
    await db.query('DELETE FROM booking_policy_acceptances WHERE phone = ANY($1::text[])', [phones]);

    const clearedConversationSessions = await optionalPhoneCleanup(
      db,
      'conversation_sessions',
      'DELETE FROM conversation_sessions WHERE phone = ANY($1::text[])',
      phones
    );
    const clearedUserProfiles = await optionalPhoneCleanup(
      db,
      'user_profiles',
      `DELETE FROM user_profiles
        WHERE regexp_replace(phone::text, '[^0-9]', '', 'g') = ANY($1::text[])`,
      phones
    );
    const clearedWelcomeDeliveries = await optionalPhoneCleanup(
      db,
      'client_whatsapp_welcome_deliveries',
      `DELETE FROM client_whatsapp_welcome_deliveries
        WHERE regexp_replace(phone::text, '[^0-9]', '', 'g') = ANY($1::text[])`,
      phones
    );

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
      throw new Error('Controlled Juvan identity release postcondition failed');
    }

    await db.query(
      `UPDATE clients
          SET status='inactive',
              updated_at=NOW(),
              custom_attributes=COALESCE(custom_attributes,'{}'::jsonb) || jsonb_build_object(
                'controlled_demo_reset', TRUE,
                'controlled_demo_key', $2::text,
                'controlled_demo_reset_by_admin_id', $3::bigint,
                'controlled_demo_reset_at', NOW()::text
              )
        WHERE id=$1`,
      [client.id, DEMO_KEY, admin.id]
    );

    const unboundDemo = await db.query(
      `UPDATE controlled_demo_identities
          SET current_client_id=NULL,
              last_unbound_at=NOW(),
              updated_at=NOW()
        WHERE demo_key=$1
          AND current_client_id=$2`,
      [DEMO_KEY, client.id]
    );
    if (unboundDemo.rowCount !== 1) {
      throw new Error('Controlled Juvan demo identity could not be unbound atomically');
    }

    const unboundPolicy = await db.query(
      `UPDATE client_booking_approval_policies
          SET client_id=NULL,
              updated_at=NOW()
        WHERE policy_key=$1
          AND client_id=$2
          AND approver_admin_id=$3
          AND active=TRUE`,
      [POLICY_KEY, client.id, admin.id]
    );
    if (unboundPolicy.rowCount !== 1) {
      throw new Error('Controlled Juvan approval policy could not be unbound atomically');
    }

    await db.query(
      `INSERT INTO crm_audit_events
         (actor_admin_id,action,entity_type,entity_id,metadata)
       VALUES ($1,'admin.controlled_demo_reset','client',$2,$3::jsonb)`,
      [admin.id, String(client.id), JSON.stringify({
        demoKey: DEMO_KEY,
        displayName: client.display_name,
        releasedContactRows: Number(released.rowCount || 0),
        releasedIdentityCount: phones.length,
        clearedConversationSessions,
        clearedUserProfiles,
        clearedWelcomeDeliveries,
        preservedAppointmentHistory: true,
        controlledIdentityUnbound: true,
        purpose: 'reusable_juvan_demo_identity',
      })]
    );

    await db.query('COMMIT');
    return {
      status: 'reset',
      client,
      normalizedPhone: controlledPhone,
      reply: [
        `✅ ${client.display_name} controlled demo reset complete.`,
        '',
        `Old CRM profile #${client.id} is archived and ${released.rowCount} WhatsApp/mobile contact record${released.rowCount === 1 ? '' : 's'} released.`,
        'Existing appointments and CRM/audit history were preserved.',
        'The controlled Juvan identity is now unbound and will rebind only after this exact phone completes normal new-client registration.',
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
  if (!canResetJuvan(admin)) {
    return { handled: true, admin, reply: 'Reset Juvan is restricted to Jean-Pierre business administration.' };
  }

  if (target.mode === 'cancel') {
    return { handled: true, admin, reply: 'Juvan controlled-demo reset cancelled. Nothing was changed.' };
  }

  if (target.mode === 'preview') {
    const preview = await resolveBoundJuvan(pool, false);
    if (preview.status !== 'ready') {
      return { handled: true, admin, reply: resolutionReply(preview.status) };
    }
    return { handled: true, admin, interactive: confirmationInteractive(preview.client, preview.contacts) };
  }

  const result = await resetControlledJuvan(admin);
  return { handled: true, admin, reply: result.reply };
}

module.exports = {
  CONTROLLED_DEMO_NAME,
  CONFIRM_ID,
  CANCEL_ID,
  canResetJuvan,
  targetFromText,
  releaseContactsForClient,
  releasePhones,
  findSharedActiveIdentity,
  resolveBoundJuvan,
  previewPhone,
  confirmationInteractive,
  optionalPhoneCleanup,
  resetControlledJuvan,
  processAdminTestClientResetMessage,
};
