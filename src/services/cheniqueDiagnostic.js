const { pool } = require("../db/pool");

function dateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

async function inspectCheniqueIdentity() {
  const result = await pool.query(`
    SELECT c.id AS client_id,
           c.display_name,
           c.date_of_birth,
           c.status,
           c.source,
           cc.id AS contact_id,
           cc.contact_type,
           cc.normalized_value,
           cc.is_primary,
           cc.verified_at
      FROM clients c
      LEFT JOIN client_contacts cc ON cc.client_id = c.id
     WHERE LOWER(c.display_name) LIKE '%chenique%'
        OR RIGHT(COALESCE(cc.normalized_value, ''), 9) = '825600139'
     ORDER BY c.id, cc.id
  `);

  const sessions = await pool.query(`
    SELECT phone, client_id, state, pending_name, pending_date_of_birth,
           booking_requested, created_at, updated_at
      FROM client_onboarding_sessions
     WHERE RIGHT(phone, 9) = '825600139'
        OR LOWER(COALESCE(pending_name, '')) LIKE '%chenique%'
     ORDER BY updated_at DESC
  `);

  return {
    clientContacts: result.rows.map((row) => ({
      clientId: String(row.client_id),
      displayName: row.display_name,
      dateOfBirth: dateOnly(row.date_of_birth),
      status: row.status,
      source: row.source,
      contactId: row.contact_id == null ? null : String(row.contact_id),
      contactType: row.contact_type,
      contactSuffix: row.normalized_value ? String(row.normalized_value).slice(-4) : null,
      contactDigits: row.normalized_value ? String(row.normalized_value).length : null,
      isPrimary: row.is_primary,
      verified: Boolean(row.verified_at),
    })),
    onboardingSessions: sessions.rows.map((row) => ({
      phoneSuffix: row.phone ? String(row.phone).slice(-4) : null,
      clientId: row.client_id == null ? null : String(row.client_id),
      state: row.state,
      pendingName: row.pending_name,
      pendingDateOfBirth: dateOnly(row.pending_date_of_birth),
      bookingRequested: row.booking_requested,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

module.exports = { inspectCheniqueIdentity };
