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
    const bindings = await db.query(
      `SELECT DISTINCT cc.client_id
         FROM client_contacts cc
        WHERE regexp_replace(COALESCE(cc.normalized_value, cc.value, ''), '[^0-9]', '', 'g')=$1
          AND cc.contact_type IN ('whatsapp','mobile')`,
      [demo.normalized_phone]
    );
    return bindings.rowCount === 0
      ? { status: 'unbound', demoKey: demo.demo_key, normalizedPhone: demo.normalized_phone, client: null }
      : { status: 'identity_conflict', demoKey: demo.demo_key, normalizedPhone: demo.normalized_phone, client: null };
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
  const phones = [...new Set(contacts.rows.map((row) => normalizeControlledPhone(row.normalized_value)).filter(Boolean))];
  if (phones.length !== 1 || phones[0] !== demo.normalized_phone) {
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

  const policy = await db.query(
    `SELECT client_id,approver_admin_id,active
       FROM client_booking_approval_policies
      WHERE policy_key=$1`,
    [POLICY_KEY]
  );
  if (policy.rowCount !== 1
      || policy.rows[0].active !== true
      || String(policy.rows[0].client_id || '') !== String(demo.current_client_id)) {
    return { status: 'policy_drift', demoKey: demo.demo_key, normalizedPhone: demo.normalized_phone, client: client.rows[0] };
  }

  return {
    status: 'bound',
    demoKey: demo.demo_key,
    normalizedPhone: demo.normalized_phone,
    client: client.rows[0],
    approverAdminId: policy.rows[0].approver_admin_id,
  };
}

async function resolveCurrentControlledDemoCrmV2Client(db = pool) {
  const legacy = await resolveCurrentControlledDemoClient(db);
  if (legacy.status !== 'bound') return { ...legacy, crmV2Client: null };

  const result = await db.query(
    `SELECT id,name,normalized_mobile,status
       FROM crm_v2_clients
      WHERE normalized_mobile=$1
        AND status='active'
      ORDER BY id
      LIMIT 2`,
    [legacy.normalizedPhone]
  );
  if (result.rowCount !== 1) {
    return {
      ...legacy,
      status: result.rowCount === 0 ? 'crm_v2_unbound' : 'crm_v2_identity_conflict',
      crmV2Client: null,
    };
  }

  return { ...legacy, status: 'bound', crmV2Client: result.rows[0] };
}

module.exports = {
  DEMO_KEY,
  POLICY_KEY,
  EXPECTED_DISPLAY_NAME,
  normalizeControlledPhone,
  getControlledDemoIdentity,
  resolveCurrentControlledDemoClient,
  resolveCurrentControlledDemoCrmV2Client,
};
