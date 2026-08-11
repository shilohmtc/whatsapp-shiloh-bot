const { pool } = require('../db/pool');
const { buildRetentionDecisionPlan } = require('./privacyRetentionPolicy');

const RETENTION_CLASSIFICATIONS = Object.freeze({
  appointments: 'retain_pending_policy',
  client_contacts: 'erase_or_deidentify_candidate',
  client_onboarding_sessions: 'temporary_should_expire',
});

function validClientId(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function quoteIdentifier(value) {
  const text = String(value);
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) {
    throw new Error('Unsafe database identifier');
  }
  return `"${text}"`;
}

async function tableExists(db, tableName) {
  const result = await db.query('SELECT to_regclass($1) AS table_name', [`public.${tableName}`]);
  return Boolean(result.rows[0]?.table_name);
}

async function countPhoneLinkedRows(db, tableName, columnName, normalizedPhones, normalizeStored = false) {
  if (!normalizedPhones.length || !(await tableExists(db, tableName))) return 0;
  const table = quoteIdentifier(tableName);
  const column = quoteIdentifier(columnName);
  const expression = normalizeStored
    ? `regexp_replace(${column}::text, '[^0-9]', '', 'g')`
    : `${column}::text`;
  const result = await db.query(
    `SELECT COUNT(*)::int AS count FROM ${table} WHERE ${expression} = ANY($1::text[])`,
    [normalizedPhones]
  );
  return Number(result.rows[0]?.count || 0);
}

function classifyDirectReference(tableName) {
  return RETENTION_CLASSIFICATIONS[tableName] || 'manual_review_required';
}

async function getClientPrivacyInventory(clientId, db = pool) {
  if (!validClientId(clientId)) return { status: 'invalid_client' };

  const clientResult = await db.query(
    `SELECT id, status, source, created_at, updated_at FROM clients WHERE id = $1`,
    [clientId]
  );
  const client = clientResult.rows[0];
  if (!client) return { status: 'not_found' };

  const fkResult = await db.query(`
    SELECT DISTINCT kcu.table_schema, kcu.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON kcu.constraint_name = tc.constraint_name
       AND kcu.constraint_schema = tc.constraint_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.constraint_schema = tc.constraint_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND ccu.table_schema = 'public'
       AND ccu.table_name = 'clients'
       AND ccu.column_name = 'id'
       AND kcu.table_schema = 'public'
     ORDER BY kcu.table_name, kcu.column_name
  `);

  const directReferences = [];
  for (const reference of fkResult.rows) {
    const table = quoteIdentifier(reference.table_name);
    const column = quoteIdentifier(reference.column_name);
    const countResult = await db.query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE ${column} = $1`, [clientId]);
    directReferences.push({
      table: reference.table_name,
      column: reference.column_name,
      count: Number(countResult.rows[0]?.count || 0),
      classification: classifyDirectReference(reference.table_name),
    });
  }

  const contactResult = await db.query(
    `SELECT DISTINCT normalized_value
       FROM client_contacts
      WHERE client_id = $1
        AND contact_type IN ('whatsapp', 'mobile')
        AND normalized_value <> ''`,
    [clientId]
  );
  const phones = contactResult.rows.map((row) => String(row.normalized_value));

  const phoneLinked = [];
  const phoneSources = [
    ['user_profiles', 'phone', true, 'erase_or_deidentify_candidate'],
    ['conversation_sessions', 'phone', false, 'erase_candidate_short_lived'],
    ['booking_intents', 'phone', false, 'erase_candidate_operational'],
    ['client_onboarding_sessions', 'phone', false, 'temporary_should_expire'],
  ];
  for (const [table, column, normalizeStored, classification] of phoneSources) {
    const count = await countPhoneLinkedRows(db, table, column, phones, normalizeStored);
    if (count > 0) phoneLinked.push({ table, column, count, classification });
  }

  const auditEventCount = (await tableExists(db, 'crm_audit_events'))
    ? Number((await db.query(
        `SELECT COUNT(*)::int AS count FROM crm_audit_events WHERE entity_type = 'client' AND entity_id = $1`,
        [clientId]
      )).rows[0]?.count || 0)
    : 0;

  const appointmentReference = directReferences.find((item) => item.table === 'appointments');
  const hasAppointmentHistory = Number(appointmentReference?.count || 0) > 0;

  const inventory = {
    status: 'ok',
    client: {
      id: Number(client.id),
      status: client.status,
      source: client.source,
      createdAt: client.created_at,
      updatedAt: client.updated_at,
    },
    summary: {
      directReferenceRows: directReferences.reduce((sum, item) => sum + item.count, 0),
      phoneLinkedRows: phoneLinked.reduce((sum, item) => sum + item.count, 0),
      auditEventCount,
      hasAppointmentHistory,
    },
    directReferences,
    phoneLinked,
    auditEvidence: {
      count: auditEventCount,
      classification: auditEventCount ? 'manual_review_required' : 'none',
    },
    proposedAction: hasAppointmentHistory
      ? 'deidentify_after_retention_review'
      : 'erase_or_deidentify_after_identity_and_legal_review',
    destructiveActionAllowed: false,
  };

  inventory.retentionDecisionPlan = buildRetentionDecisionPlan(inventory);
  return inventory;
}

module.exports = {
  getClientPrivacyInventory,
  validClientId,
  quoteIdentifier,
  classifyDirectReference,
};
