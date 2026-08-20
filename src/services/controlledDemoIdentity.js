const { pool } = require('../db/pool');

const DEMO_KEY = 'juvan_botha';
const POLICY_KEY = 'juvan_botha_jp_booking_approval';
const EXPECTED_DISPLAY_NAME = 'Juvan Botha';

function normalizeControlledPhone(value = '') {
  return String(value || '').replace(/[^0-9]/g, '');
}

async function getControlledDemoIdentity(db = pool, lock = false) {
  const result = await db.query(
    `SELECT demo_key,normalized_phone,current_client_id,expected_display_name,active,last_bound_at,last_unbound_at
       FROM controlled_demo_identities
      WHERE demo_key=$1
        AND active=TRUE${lock ? ' FOR UPDATE' : ''}`,
    [DEMO_KEY]
  );
  if (result.rowCount !== 1) {
    const error = new Error('Controlled Juvan demo identity is not configured uniquely');
    error.code = 'CONTROLLED_DEMO_CONFIG';
    throw error;
  }
  return result.rows[0];
}

async function resolveCurrentControlledDemoClient(db = pool) {
  const demo = await getControlledDemoIdentity(db, false);
  if (!demo.current_client_id) {
    return { status: 'unbound', demoKey: demo.demo_key, normalizedPhone: demo.normalized_phone, client: null };
  }

  const client = await db.query(
    `SELECT id,display_name,status
       FROM clients
      WHERE id=$1`,
    [demo.current_client_id]
  );
  if (client.rowCount !== 1 || client.rows[0].status !== 'active') {
    return { status: 'drift', demoKey: demo.demo_key, normalizedPhone: demo.normalized_phone, client: client.rows[0] || null };
  }

  const contacts = await db.query(
    `SELECT id,client_id,contact_type,normalized_value
       FROM client_contacts
      WHERE client_id=$1
        AND contact_type IN ('whatsapp','mobile')
      ORDER BY id`,
    [demo.current_client_id]
  );
  const anchored = contacts.rows.filter((row) => normalizeControlledPhone(row.normalized_value) === demo.normalized_phone);
  if (!anchored.length) {
    return { status: 'drift', demoKey: demo.demo_key, normalizedPhone: demo.normalized_phone, client: client.rows[0] };
  }

  const shared = await db.query(
    `SELECT DISTINCT cc.client_id
       FROM client_contacts cc
       JOIN clients c ON c.id=cc.client_id
      WHERE regexp_replace(COALESCE(cc.normalized_value, cc.value, ''), '[^0-9]', '', 'g')=$1
        AND cc.contact_type IN ('whatsapp','mobile')
        AND c.status='active'
        AND cc.client_id<>$2
      LIMIT 1`,
    [demo.normalized_phone, demo.current_client_id]
  );
  if (shared.rowCount) {
    return { status: 'identity_conflict', demoKey: demo.demo_key, normalizedPhone: demo.normalized_phone, client: client.rows[0] };
  }

  return {
    status: 'bound',
    demoKey: demo.demo_key,
    normalizedPhone: demo.normalized_phone,
    client: client.rows[0],
  };
}

async function rebindControlledDemoIdentityIfPhone(db, phone, clientId) {
  const normalizedPhone = normalizeControlledPhone(phone);
  if (!normalizedPhone) return { matched: false, rebound: false };

  const demoResult = await db.query(
    `SELECT demo_key,normalized_phone,current_client_id,active
       FROM controlled_demo_identities
      WHERE normalized_phone=$1
        AND active=TRUE
      FOR UPDATE`,
    [normalizedPhone]
  );
  if (demoResult.rowCount === 0) return { matched: false, rebound: false };
  if (demoResult.rowCount !== 1) {
    const error = new Error('Controlled demo phone is not unique');
    error.code = 'CONTROLLED_DEMO_AMBIGUOUS';
    throw error;
  }

  const demo = demoResult.rows[0];
  if (demo.current_client_id && String(demo.current_client_id) !== String(clientId)) {
    const error = new Error('Controlled Juvan demo identity is already bound to another canonical client');
    error.code = 'CONTROLLED_DEMO_ALREADY_BOUND';
    throw error;
  }

  const client = await db.query(
    `SELECT id,status
       FROM clients
      WHERE id=$1
      FOR UPDATE`,
    [clientId]
  );
  if (client.rowCount !== 1 || client.rows[0].status !== 'active') {
    const error = new Error('Controlled Juvan demo identity can bind only to one active canonical client');
    error.code = 'CONTROLLED_DEMO_CLIENT_INVALID';
    throw error;
  }

  const bindings = await db.query(
    `SELECT cc.id,cc.client_id,cc.contact_type,c.status AS client_status
       FROM client_contacts cc
       JOIN clients c ON c.id=cc.client_id
      WHERE regexp_replace(COALESCE(cc.normalized_value, cc.value, ''), '[^0-9]', '', 'g')=$1
        AND cc.contact_type IN ('whatsapp','mobile')
      ORDER BY cc.client_id,cc.id
      FOR UPDATE OF cc,c`,
    [normalizedPhone]
  );
  const boundClientIds = [...new Set(bindings.rows.map((row) => String(row.client_id)))];
  if (boundClientIds.length !== 1 || boundClientIds[0] !== String(clientId)) {
    const error = new Error('Controlled Juvan phone identity is ambiguous and cannot be rebound');
    error.code = 'CONTROLLED_DEMO_IDENTITY_CONFLICT';
    throw error;
  }

  const policy = await db.query(
    `SELECT policy_key,client_id,approver_admin_id,active
       FROM client_booking_approval_policies
      WHERE policy_key=$1
      FOR UPDATE`,
    [POLICY_KEY]
  );
  if (policy.rowCount !== 1 || policy.rows[0].active !== true) {
    const error = new Error('Controlled Juvan booking approval policy is not configured uniquely');
    error.code = 'CONTROLLED_DEMO_POLICY_INVALID';
    throw error;
  }
  if (policy.rows[0].client_id && String(policy.rows[0].client_id) !== String(clientId)) {
    const error = new Error('Controlled Juvan booking policy still points at another canonical client');
    error.code = 'CONTROLLED_DEMO_POLICY_STALE';
    throw error;
  }

  const previousClientId = demo.current_client_id || null;
  await db.query(
    `UPDATE controlled_demo_identities
        SET current_client_id=$2,
            last_bound_at=NOW(),
            updated_at=NOW()
      WHERE demo_key=$1`,
    [DEMO_KEY, clientId]
  );
  const policyUpdate = await db.query(
    `UPDATE client_booking_approval_policies
        SET client_id=$2,
            updated_at=NOW()
      WHERE policy_key=$1
        AND active=TRUE`,
    [POLICY_KEY, clientId]
  );
  if (policyUpdate.rowCount !== 1) {
    const error = new Error('Controlled Juvan booking policy could not be rebound atomically');
    error.code = 'CONTROLLED_DEMO_POLICY_REBIND_FAILED';
    throw error;
  }

  await db.query(
    `INSERT INTO crm_audit_events (action,entity_type,entity_id,metadata)
     VALUES ('controlled_demo_identity.rebound','client',$1,$2::jsonb)`,
    [String(clientId), JSON.stringify({
      demoKey: DEMO_KEY,
      previousClientId: previousClientId ? String(previousClientId) : null,
      currentClientId: String(clientId),
      phoneSuffix: normalizedPhone.slice(-4),
      source: 'whatsapp_onboarding',
    })]
  );

  return {
    matched: true,
    rebound: true,
    demoKey: DEMO_KEY,
    previousClientId,
    currentClientId: clientId,
  };
}

module.exports = {
  DEMO_KEY,
  POLICY_KEY,
  EXPECTED_DISPLAY_NAME,
  normalizeControlledPhone,
  getControlledDemoIdentity,
  resolveCurrentControlledDemoClient,
  rebindControlledDemoIdentityIfPhone,
};
