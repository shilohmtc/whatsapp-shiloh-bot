const { pool } = require('../db/pool');
const { findClients } = require('./adminClientLookup');
const {
  exactPhoneCandidates,
  normalizePhone,
} = require('./clientVerifiedIdentity');
const {
  EVIDENCE_TYPES,
  normalizeClientName,
  promoteClientFacingNameInTransaction,
} = require('./clientFacingNameAuthority');
const { normalizeZaMobile } = require('./adminProvisionalClient');

const AUTHORITY_VERSION = 'operator_contact_confirmation_v1';
const VERIFICATION_METHOD = 'operator_confirmed';
const OPERATOR_ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  OPERATIONS_ADMIN: 'operations_admin',
});
const USABLE_CONTACT_TYPES = new Set(['whatsapp', 'mobile']);

function authorityError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function canonicalId(value, code, message) {
  const raw = String(value || '').trim();
  if (!/^[1-9]\d*$/.test(raw)) throw authorityError(code, message);
  const id = Number(raw);
  if (!Number.isSafeInteger(id)) throw authorityError(code, message);
  return id;
}

// The legacy role column still contains admin/manager. These mappings expose the
// ratified capability roles without renaming production accounts or adding a
// second staff-authority model: JP's business_admin authority is super_admin and
// Christel's owner authority is operations_admin.
function operatorRoleForAdmin(admin = {}) {
  const role = String(admin.role || '').trim().toLowerCase();
  const businessRole = String(admin.business_role || '').trim().toLowerCase();
  if (role === OPERATOR_ROLES.SUPER_ADMIN || role === OPERATOR_ROLES.OPERATIONS_ADMIN) return role;
  if (businessRole === 'business_admin' && role === 'admin') return OPERATOR_ROLES.SUPER_ADMIN;
  if (businessRole === 'owner' && ['manager', 'admin'].includes(role)) return OPERATOR_ROLES.OPERATIONS_ADMIN;
  return null;
}

function normalizedUsablePhone(value) {
  const normalized = normalizePhone(value);
  if (!/^\d{10,15}$/.test(normalized)) return null;
  return normalizeZaMobile(value) || normalized;
}

function maskContact(value = '') {
  const normalized = normalizePhone(value);
  return normalized.length >= 4 ? `ending in ${normalized.slice(-4)}` : 'contact on file';
}

function serializeSearchClient(client = {}) {
  const contacts = Array.isArray(client.contacts) ? client.contacts : [];
  const primary = contacts.find((contact) => contact.isPrimary) || contacts[0];
  return {
    id: Number(client.id),
    displayName: client.client_facing_name || client.display_name || 'Unnamed client',
    nameAuthority: client.client_facing_name ? 'authoritative' : 'unconfirmed',
    status: client.status || 'unknown',
    source: client.source || null,
    contactHint: primary ? maskContact(primary.normalizedValue || primary.value) : null,
  };
}

function createOperatorContactAuthorityService({
  db = pool,
  clientFinder = findClients,
  phoneCandidateResolver = exactPhoneCandidates,
  namePromoter = promoteClientFacingNameInTransaction,
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Operator contact authority db is required');

  async function resolveAuthorizedOperator(adminId, queryable = db, { lock = false } = {}) {
    const id = canonicalId(
      adminId,
      'OPERATOR_AUTHORITY_UNAUTHORIZED',
      'An authenticated staff operator is required.'
    );
    const result = await queryable.query(
      `SELECT a.id,a.staff_id,a.display_name,a.role,a.business_role,a.active AS admin_active,
              s.status AS staff_status
         FROM staff_admin_accounts a
         LEFT JOIN staff s ON s.id=a.staff_id
        WHERE a.id=$1
          AND a.active=TRUE
        LIMIT 1${lock ? '\n        FOR UPDATE OF a' : ''}`,
      [id]
    );
    const admin = result.rows[0] || null;
    const operatorRole = operatorRoleForAdmin(admin || {});
    const linkedStaffInactive = admin?.staff_id != null && admin.staff_status !== 'active';
    if (!admin || !operatorRole || linkedStaffInactive) {
      throw authorityError(
        'OPERATOR_AUTHORITY_FORBIDDEN',
        'Current staff authority does not permit client contact confirmation.'
      );
    }
    return { ...admin, operatorRole };
  }

  async function searchClients({ actorAdminId, query } = {}) {
    await resolveAuthorizedOperator(actorAdminId);
    const cleaned = String(query || '').trim().replace(/\s+/g, ' ').slice(0, 120);
    if (cleaned.length < 2) return { clients: [], requiresExplicitSelection: true, ambiguous: false };
    const found = await clientFinder(cleaned, 10);
    const clients = (found.clients || []).map(serializeSearchClient);
    return {
      clients,
      requiresExplicitSelection: true,
      ambiguous: clients.length > 1,
    };
  }

  async function clientAuthorityRows(clientId, queryable = db) {
    const id = canonicalId(
      clientId,
      'OPERATOR_AUTHORITY_CLIENT_INVALID',
      'Select one exact canonical client.'
    );
    const clientResult = await queryable.query(
      `SELECT c.id,c.display_name,c.status,c.source,
              authority.id AS name_authority_id,
              authority.current_name AS authoritative_name,
              authority.evidence_type AS name_evidence_type,
              authority.promoted_at AS name_promoted_at
         FROM clients c
         LEFT JOIN LATERAL (
           SELECT n.id,n.current_name,n.evidence_type,n.promoted_at
             FROM client_facing_name_authorities n
            WHERE n.client_id=c.id
              AND n.revoked_at IS NULL
            ORDER BY n.promoted_at DESC,n.id DESC
            LIMIT 1
         ) authority ON TRUE
        WHERE c.id=$1
        LIMIT 1`,
      [id]
    );
    const client = clientResult.rows[0] || null;
    if (!client) {
      throw authorityError('OPERATOR_AUTHORITY_CLIENT_NOT_FOUND', 'Canonical client was not found.');
    }
    const contactsResult = await queryable.query(
      `SELECT cc.id,cc.client_id,cc.contact_type,cc.value,cc.normalized_value,
              cc.is_primary,cc.verified_at,
              verification.id AS identity_verification_id,
              verification.verification_method,
              verification.verified_at AS identity_verified_at
         FROM client_contacts cc
         LEFT JOIN LATERAL (
           SELECT v.id,v.verification_method,v.verified_at
             FROM client_identity_verifications v
            WHERE v.client_id=cc.client_id
              AND v.client_contact_id=cc.id
              AND v.status='active'
            ORDER BY CASE WHEN v.verification_method='operator_confirmed' THEN 0 ELSE 1 END,
                     v.verified_at DESC,v.id DESC
            LIMIT 1
         ) verification ON TRUE
        WHERE cc.client_id=$1
        ORDER BY cc.is_primary DESC,
                 CASE cc.contact_type WHEN 'whatsapp' THEN 0 WHEN 'mobile' THEN 1 ELSE 2 END,
                 cc.id`,
      [id]
    );
    return { client, contacts: contactsResult.rows };
  }

  async function classifyContact(client, contact, queryable = db) {
    const contactType = String(contact.contact_type || '').toLowerCase();
    const storedNormalized = normalizePhone(contact.normalized_value);
    if (!USABLE_CONTACT_TYPES.has(contactType) || !/^\d{10,15}$/.test(storedNormalized)) {
      return { authorityStatus: 'unusable', conflict: false, activeOwnerClientIds: [] };
    }
    const candidates = await phoneCandidateResolver(storedNormalized, queryable);
    const activeOwnerClientIds = candidates.map((candidate) => Number(candidate.id));
    const exactOwner = candidates.length === 1 && String(candidates[0].id) === String(client.id);
    const exactContact = exactOwner
      && (candidates[0].contact_ids || [candidates[0].contact_id]).map(String).includes(String(contact.id));
    const conflict = client.status === 'active' && (!exactOwner || !exactContact);
    const completeVerification = contact.verified_at != null && contact.identity_verification_id != null;
    return {
      authorityStatus: conflict ? 'ambiguous' : completeVerification ? 'verified' : 'unverified',
      conflict,
      activeOwnerClientIds,
    };
  }

  async function loadClientAuthorityState({ actorAdminId, clientId } = {}) {
    const operator = await resolveAuthorizedOperator(actorAdminId);
    const rows = await clientAuthorityRows(clientId);
    const contacts = [];
    for (const row of rows.contacts) {
      const classification = await classifyContact(rows.client, row);
      contacts.push({
        id: Number(row.id),
        type: row.contact_type,
        currentValue: row.value,
        normalizedValue: row.normalized_value,
        isPrimary: row.is_primary === true,
        verifiedAt: row.verified_at || null,
        identityVerificationId: row.identity_verification_id ? Number(row.identity_verification_id) : null,
        verificationMethod: row.verification_method || null,
        identityVerifiedAt: row.identity_verified_at || null,
        ...classification,
      });
    }
    const verifiedContacts = contacts.filter((contact) => contact.authorityStatus === 'verified');
    const ambiguous = contacts.some((contact) => contact.authorityStatus === 'ambiguous');
    const nameAuthority = rows.client.name_authority_id
      ? {
          status: 'authoritative',
          id: Number(rows.client.name_authority_id),
          name: rows.client.authoritative_name,
          evidenceType: rows.client.name_evidence_type,
          promotedAt: rows.client.name_promoted_at,
        }
      : { status: 'unconfirmed', id: null, name: null, evidenceType: null, promotedAt: null };
    const confirmationSafe = rows.client.status === 'active'
      && verifiedContacts.length > 0
      && !ambiguous
      && nameAuthority.status === 'authoritative';
    return {
      operatorRole: operator.operatorRole,
      client: {
        id: Number(rows.client.id),
        displayName: rows.client.authoritative_name || rows.client.display_name || 'Unnamed client',
        status: rows.client.status,
        source: rows.client.source,
      },
      contacts,
      nameAuthority,
      confirmationSafe,
      stage: confirmationSafe
        ? 'confirmation_safe'
        : ambiguous
          ? 'ambiguous_contact'
          : verifiedContacts.length
            ? 'contact_verified_name_unconfirmed'
            : 'contact_unverified',
    };
  }

  async function lockExactContactAuthority(queryable, { clientId, contactId, expectedContactValue } = {}) {
    const canonicalClientId = canonicalId(
      clientId,
      'OPERATOR_AUTHORITY_CLIENT_INVALID',
      'Select one exact canonical client.'
    );
    const canonicalContactId = canonicalId(
      contactId,
      'OPERATOR_AUTHORITY_CONTACT_INVALID',
      'Select one exact mobile or WhatsApp contact.'
    );
    const expectedNormalized = normalizedUsablePhone(expectedContactValue);
    if (!expectedNormalized) {
      throw authorityError(
        'OPERATOR_AUTHORITY_CONTACT_VALUE_INVALID',
        'Enter the exact current mobile or WhatsApp number confirmed by the client.'
      );
    }
    const clientResult = await queryable.query(
      `SELECT id,status
         FROM clients
        WHERE id=$1
        FOR UPDATE`,
      [canonicalClientId]
    );
    const client = clientResult.rows[0] || null;
    if (!client) throw authorityError('OPERATOR_AUTHORITY_CLIENT_NOT_FOUND', 'Canonical client was not found.');
    if (client.status !== 'active') {
      throw authorityError('OPERATOR_AUTHORITY_CLIENT_INACTIVE', 'Only an active canonical client can receive contact authority.');
    }
    const contactResult = await queryable.query(
      `SELECT id,client_id,contact_type,value,normalized_value,verified_at
         FROM client_contacts
        WHERE id=$1
        FOR UPDATE`,
      [canonicalContactId]
    );
    const contact = contactResult.rows[0] || null;
    if (!contact) throw authorityError('OPERATOR_AUTHORITY_CONTACT_NOT_FOUND', 'Canonical client contact was not found.');
    if (String(contact.client_id) !== String(canonicalClientId)) {
      throw authorityError('OPERATOR_AUTHORITY_CONTACT_OWNER_MISMATCH', 'That contact no longer belongs to the selected canonical client.');
    }
    if (!USABLE_CONTACT_TYPES.has(String(contact.contact_type || '').toLowerCase())) {
      throw authorityError('OPERATOR_AUTHORITY_CONTACT_TYPE_INVALID', 'Only a mobile or WhatsApp contact can be confirmed.');
    }
    const storedNormalized = normalizePhone(contact.normalized_value);
    const comparableServerNormalized = normalizedUsablePhone(contact.normalized_value);
    if (!comparableServerNormalized || comparableServerNormalized !== expectedNormalized) {
      throw authorityError('OPERATOR_AUTHORITY_CONTACT_VALUE_MISMATCH', 'The current CRM contact no longer matches the confirmed number. Reload before retrying.');
    }
    await queryable.query(
      `SELECT pg_advisory_xact_lock(hashtextextended('operator-contact-authority:' || $1::text,0))`,
      [storedNormalized]
    );
    const candidates = await phoneCandidateResolver(storedNormalized, queryable);
    const exactCandidate = candidates.length === 1 && String(candidates[0].id) === String(canonicalClientId)
      ? candidates[0]
      : null;
    const exactContact = exactCandidate
      && (exactCandidate.contact_ids || [exactCandidate.contact_id]).map(String).includes(String(canonicalContactId));
    if (!exactCandidate || !exactContact) {
      throw authorityError('OPERATOR_AUTHORITY_CONTACT_AMBIGUOUS', 'Another active canonical client owns this mobile number, or exact ownership is no longer unique.');
    }
    return { client, contact, normalized: storedNormalized };
  }

  async function withTransaction(work) {
    const queryable = typeof db.connect === 'function' ? await db.connect() : db;
    try {
      await queryable.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
      const result = await work(queryable);
      await queryable.query('COMMIT');
      return result;
    } catch (error) {
      try { await queryable.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      if (queryable !== db && typeof queryable.release === 'function') queryable.release();
    }
  }

  async function confirmContact({ actorAdminId, clientId, contactId, confirmedValue } = {}) {
    const operation = await withTransaction(async (queryable) => {
      const operator = await resolveAuthorizedOperator(actorAdminId, queryable, { lock: true });
      const locked = await lockExactContactAuthority(queryable, {
        clientId,
        contactId,
        expectedContactValue: confirmedValue,
      });
      const evidenceReference = {
        authorityVersion: AUTHORITY_VERSION,
        confirmationMode: 'live_operator_client_interaction',
        actorAdminId: Number(operator.id),
        clientId: Number(locked.client.id),
        clientContactId: Number(locked.contact.id),
      };
      const existing = await queryable.query(
        `SELECT id,verified_at,evidence_reference
           FROM client_identity_verifications
          WHERE client_id=$1
            AND client_contact_id=$2
            AND verification_method=$3
            AND status='active'
          ORDER BY verified_at DESC,id DESC
          LIMIT 1
          FOR UPDATE`,
        [locked.client.id, locked.contact.id, VERIFICATION_METHOD]
      );
      await queryable.query(
        `UPDATE client_contacts
            SET verified_at=COALESCE(verified_at,NOW()),
                updated_at=CASE WHEN verified_at IS NULL THEN NOW() ELSE updated_at END
          WHERE id=$1
            AND client_id=$2`,
        [locked.contact.id, locked.client.id]
      );
      let verification = existing.rows[0] || null;
      if (!verification) {
        const inserted = await queryable.query(
          `INSERT INTO client_identity_verifications
             (client_id,client_contact_id,verification_method,status,verified_at,evidence_reference)
           VALUES ($1,$2,$3,'active',NOW(),$4::jsonb)
           ON CONFLICT DO NOTHING
           RETURNING id,verified_at,evidence_reference`,
          [locked.client.id, locked.contact.id, VERIFICATION_METHOD, JSON.stringify(evidenceReference)]
        );
        verification = inserted.rows[0] || null;
        if (!verification) {
          const replay = await queryable.query(
            `SELECT id,verified_at,evidence_reference
               FROM client_identity_verifications
              WHERE client_id=$1
                AND client_contact_id=$2
                AND verification_method=$3
                AND status='active'
              ORDER BY verified_at DESC,id DESC
              LIMIT 1
              FOR UPDATE`,
            [locked.client.id, locked.contact.id, VERIFICATION_METHOD]
          );
          verification = replay.rows[0] || null;
        }
      }
      if (!verification) throw new Error('Operator contact verification could not be durably established');
      const idempotent = existing.rowCount > 0;
      await queryable.query(
        `INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
         VALUES ($1,$2,'client',$3,$4::jsonb)`,
        [
          operator.id,
          idempotent ? 'client.contact_operator_confirmation_reaffirmed' : 'client.contact_operator_confirmed',
          locked.client.id,
          JSON.stringify({
            authorityVersion: AUTHORITY_VERSION,
            clientId: Number(locked.client.id),
            contactId: Number(locked.contact.id),
            verificationId: Number(verification.id),
            verificationMethod: VERIFICATION_METHOD,
            operatorRole: operator.operatorRole,
            idempotent,
            contactVerifiedAtEstablished: locked.contact.verified_at == null,
          }),
        ]
      );
      return {
        status: idempotent ? 'already_confirmed' : 'confirmed',
        clientId: Number(locked.client.id),
        contactId: Number(locked.contact.id),
        verificationId: Number(verification.id),
        verificationMethod: VERIFICATION_METHOD,
        operatorRole: operator.operatorRole,
      };
    });
    return { ...operation, authority: await loadClientAuthorityState({ actorAdminId, clientId }) };
  }

  async function confirmName({
    actorAdminId,
    clientId,
    contactId,
    expectedContactValue,
    confirmedName,
    explicitlyConfirmed,
  } = {}) {
    if (explicitlyConfirmed !== true) {
      throw authorityError(
        'OPERATOR_AUTHORITY_NAME_AFFIRMATION_REQUIRED',
        'Confirm separately that the client explicitly stated this name.'
      );
    }
    const name = normalizeClientName(confirmedName);
    if (!name) throw authorityError('OPERATOR_AUTHORITY_NAME_INVALID', 'Enter the exact name explicitly confirmed by the client.');
    const operation = await withTransaction(async (queryable) => {
      const operator = await resolveAuthorizedOperator(actorAdminId, queryable, { lock: true });
      const locked = await lockExactContactAuthority(queryable, {
        clientId,
        contactId,
        expectedContactValue,
      });
      const boundVerification = await queryable.query(
        `SELECT id,verification_method,verified_at
           FROM client_identity_verifications
          WHERE client_id=$1
            AND client_contact_id=$2
            AND status='active'
          ORDER BY CASE WHEN verification_method='operator_confirmed' THEN 0 ELSE 1 END,
                   verified_at DESC,id DESC
          LIMIT 1
          FOR UPDATE`,
        [locked.client.id, locked.contact.id]
      );
      const verification = boundVerification.rows[0] || null;
      if (locked.contact.verified_at == null || !verification) {
        throw authorityError(
          'OPERATOR_AUTHORITY_CONTACT_NOT_VERIFIED',
          'Confirm the exact contact before confirming the client-facing name.'
        );
      }
      const authority = await namePromoter(queryable, {
        clientId: locked.client.id,
        name,
        evidenceType: EVIDENCE_TYPES.EXPLICIT_CLIENT_CONFIRMATION,
        evidenceReference: {
          authorityVersion: AUTHORITY_VERSION,
          affirmation: 'client_explicitly_confirmed_name',
          actorAdminId: Number(operator.id),
          clientContactId: Number(locked.contact.id),
          identityVerificationId: Number(verification.id),
        },
        actorType: 'staff',
        actorReference: `staff_admin:${operator.id}`,
      });
      await queryable.query(
        `INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
         VALUES ($1,'client.facing_name_explicitly_confirmed_by_operator','client',$2,$3::jsonb)`,
        [
          operator.id,
          locked.client.id,
          JSON.stringify({
            authorityVersion: AUTHORITY_VERSION,
            authorityId: Number(authority.authorityId),
            contactId: Number(locked.contact.id),
            identityVerificationId: Number(verification.id),
            evidenceType: EVIDENCE_TYPES.EXPLICIT_CLIENT_CONFIRMATION,
            operatorRole: operator.operatorRole,
          }),
        ]
      );
      return {
        status: 'name_confirmed',
        clientId: Number(locked.client.id),
        contactId: Number(locked.contact.id),
        nameAuthorityId: Number(authority.authorityId),
        evidenceType: EVIDENCE_TYPES.EXPLICIT_CLIENT_CONFIRMATION,
        operatorRole: operator.operatorRole,
      };
    });
    return { ...operation, authority: await loadClientAuthorityState({ actorAdminId, clientId }) };
  }

  return {
    resolveAuthorizedOperator,
    searchClients,
    loadClientAuthorityState,
    confirmContact,
    confirmName,
  };
}

module.exports = {
  AUTHORITY_VERSION,
  VERIFICATION_METHOD,
  OPERATOR_ROLES,
  USABLE_CONTACT_TYPES,
  authorityError,
  operatorRoleForAdmin,
  normalizedUsablePhone,
  serializeSearchClient,
  createOperatorContactAuthorityService,
};
