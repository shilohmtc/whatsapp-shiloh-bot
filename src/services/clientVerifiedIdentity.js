const { pool } = require('../db/pool');
const { registrationStatus } = require('./clientRegistrationPolicy');
const { resolveCurrentControlledDemoClient } = require('./controlledDemoIdentity');

function normalizePhone(value = '') {
  return String(value || '').replace(/[^0-9]/g, '');
}

function registrationComplete(client = {}) {
  return registrationStatus({
    fullName: client.display_name,
    mobileNumber: client.normalized_value,
    dateOfBirth: client.date_of_birth,
  }).complete;
}

function classifyCandidateAuthority(candidate, { verification = null, controlled = null } = {}) {
  if (!candidate) return { status: 'none', reason: 'no_exact_phone_candidate' };

  if (controlled) {
    if (controlled.status === 'bound' && String(controlled.client?.id || '') === String(candidate.id)) {
      return {
        status: 'verified_client',
        reason: 'controlled_demo_binding',
        verificationMethod: 'controlled_demo_binding',
      };
    }
    return { status: 'manual_review', reason: `controlled_demo_${controlled.status || 'conflict'}` };
  }

  if (verification) {
    return {
      status: 'verified_client',
      reason: 'explicit_verification_evidence',
      verificationMethod: verification.verification_method,
      verificationId: verification.id,
      verifiedAt: verification.verified_at,
    };
  }

  if (candidate.has_appointment_history === true) {
    return { status: 'historical_unverified', reason: 'history_without_explicit_verification' };
  }

  if (candidate.source === 'goldie_import') {
    return { status: 'claim_required', reason: 'imported_contact_unverified' };
  }

  if (
    candidate.source === 'admin_provisional_booking'
    || candidate.registration_status === 'provisional'
    || candidate.profile_incomplete === 'true'
  ) {
    return { status: 'provisional', reason: 'provisional_unverified_client' };
  }

  return { status: 'unverified_client', reason: 'existing_client_without_explicit_verification' };
}

async function exactPhoneCandidates(phone, db = pool) {
  const normalized = normalizePhone(phone);
  if (!normalized) return [];

  const result = await db.query(
    `SELECT c.id,
            c.display_name,
            c.date_of_birth,
            c.status,
            c.source,
            c.custom_attributes->>'gender' AS gender,
            c.custom_attributes->>'registration_status' AS registration_status,
            c.custom_attributes->>'profile_incomplete' AS profile_incomplete,
            cc.id AS contact_id,
            cc.contact_type,
            cc.normalized_value,
            cc.verified_at,
            EXISTS (SELECT 1 FROM appointments a WHERE a.client_id = c.id) AS has_appointment_history
       FROM clients c
       JOIN client_contacts cc ON cc.client_id = c.id
      WHERE cc.normalized_value = $1
        AND cc.contact_type IN ('whatsapp','mobile')
        AND c.status = 'active'
      ORDER BY c.id, CASE WHEN cc.contact_type = 'whatsapp' THEN 0 ELSE 1 END, cc.id`,
    [normalized]
  );

  const byClient = new Map();
  for (const row of result.rows) {
    const key = String(row.id);
    if (!byClient.has(key)) {
      byClient.set(key, { ...row, contact_ids: [row.contact_id] });
      continue;
    }
    const existing = byClient.get(key);
    if (!existing.contact_ids.includes(row.contact_id)) existing.contact_ids.push(row.contact_id);
  }
  return [...byClient.values()];
}

async function activeVerificationForCandidate(candidate, normalizedPhone, db = pool) {
  const contactIds = (candidate.contact_ids || [candidate.contact_id]).filter(Boolean);
  const result = await db.query(
    `SELECT v.id, v.verification_method, v.client_contact_id, v.verified_at
       FROM client_identity_verifications v
       LEFT JOIN client_contacts vc ON vc.id = v.client_contact_id
      WHERE v.client_id = $1
        AND v.status = 'active'
        AND (
          v.client_contact_id IS NULL
          OR (
            v.client_contact_id = ANY($2::bigint[])
            AND vc.client_id = v.client_id
            AND vc.normalized_value = $3
            AND vc.contact_type IN ('whatsapp','mobile')
          )
        )
      ORDER BY v.verified_at DESC, v.id DESC
      LIMIT 1`,
    [candidate.id, contactIds, normalizedPhone]
  );
  return result.rows[0] || null;
}

async function controlledAuthorityForPhone(normalizedPhone, db = pool) {
  const configured = await db.query(
    `SELECT 1
       FROM controlled_demo_identities
      WHERE normalized_phone = $1
        AND active = TRUE
      LIMIT 1`,
    [normalizedPhone]
  );
  if (!configured.rowCount) return null;
  return resolveCurrentControlledDemoClient(db);
}

async function resolveVerifiedClientByWhatsApp(phone, db = pool) {
  const normalized = normalizePhone(phone);
  if (!normalized) return { status: 'none', clients: [], reason: 'missing_phone' };

  const clients = await exactPhoneCandidates(normalized, db);
  if (!clients.length) return { status: 'none', clients: [], reason: 'no_exact_phone_candidate' };
  if (clients.length > 1) {
    return { status: 'ambiguous', clients, reason: 'multiple_active_clients_for_exact_phone' };
  }

  const client = clients[0];
  const controlled = await controlledAuthorityForPhone(normalized, db);
  const verification = controlled ? null : await activeVerificationForCandidate(client, normalized, db);
  const authority = classifyCandidateAuthority(client, { verification, controlled });

  return {
    ...authority,
    client,
    clients,
    registrationComplete: registrationComplete(client),
  };
}

function isVerifiedRegistration(identity) {
  return identity?.status === 'verified_client' && identity.registrationComplete === true;
}

module.exports = {
  normalizePhone,
  registrationComplete,
  classifyCandidateAuthority,
  exactPhoneCandidates,
  activeVerificationForCandidate,
  controlledAuthorityForPhone,
  resolveVerifiedClientByWhatsApp,
  isVerifiedRegistration,
};
