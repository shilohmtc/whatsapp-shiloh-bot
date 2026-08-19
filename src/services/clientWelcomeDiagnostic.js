const { pool } = require('../db/pool');
const {
  UNIVERSAL_WELCOME_VERSION,
  UNIVERSAL_WELCOME_ATTRIBUTE,
  normalizePhone,
} = require('./clientTransitionWelcome');

function normalizeDiagnosticPhone(value = '') {
  const normalized = normalizePhone(value);
  if (!/^\d{8,15}$/.test(normalized)) {
    const error = new Error('A valid WhatsApp phone number is required');
    error.code = 'INVALID_PHONE';
    throw error;
  }
  return normalized;
}

function identityStatusForCount(count) {
  if (count === 0) return 'none';
  if (count === 1) return 'unique';
  return 'ambiguous';
}

async function getClientWelcomeDiagnostic(phone, query = pool.query.bind(pool)) {
  const normalized = normalizeDiagnosticPhone(phone);

  const ledgerResult = await query(
    `SELECT sent_at
       FROM client_whatsapp_welcome_deliveries
      WHERE phone = $1
        AND welcome_version = $2
      LIMIT 1`,
    [normalized, UNIVERSAL_WELCOME_VERSION]
  );

  const canonicalResult = await query(
    `SELECT COUNT(DISTINCT c.id)::int AS active_client_count,
            COUNT(DISTINCT CASE
              WHEN COALESCE(c.custom_attributes->>$2, '') <> '' THEN c.id
            END)::int AS marker_client_count,
            CASE
              WHEN COUNT(DISTINCT c.id) = 1
                THEN MAX(NULLIF(c.custom_attributes->>$2, ''))
              ELSE NULL
            END AS marker_sent_at
       FROM clients c
       JOIN client_contacts cc ON cc.client_id = c.id
      WHERE cc.normalized_value = $1
        AND cc.contact_type IN ('whatsapp', 'mobile')
        AND c.status = 'active'`,
    [normalized, UNIVERSAL_WELCOME_ATTRIBUTE]
  );

  const row = canonicalResult.rows?.[0] || {};
  const activeClientCount = Number(row.active_client_count || 0);
  const identityStatus = identityStatusForCount(activeClientCount);
  const markerClientCount = Number(row.marker_client_count || 0);
  const uniqueIdentity = identityStatus === 'unique';

  return {
    phoneSuffix: normalized.slice(-4),
    welcomeVersion: UNIVERSAL_WELCOME_VERSION,
    ledger: {
      exists: ledgerResult.rowCount > 0,
      sentAt: ledgerResult.rows?.[0]?.sent_at || null,
    },
    canonicalIdentity: {
      status: identityStatus,
      activeClientCount,
    },
    canonicalMarker: {
      status: identityStatus === 'ambiguous'
        ? 'ambiguous'
        : identityStatus === 'none'
          ? 'not_applicable'
          : 'resolved',
      exists: uniqueIdentity ? markerClientCount === 1 : null,
      sentAt: uniqueIdentity ? row.marker_sent_at || null : null,
    },
  };
}

module.exports = {
  normalizeDiagnosticPhone,
  identityStatusForCount,
  getClientWelcomeDiagnostic,
};
