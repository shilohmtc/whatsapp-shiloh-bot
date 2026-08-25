const { pool } = require('../db/pool');

const EVIDENCE_TYPES = Object.freeze({
  EXPLICIT_CLIENT_CONFIRMATION: 'explicit_client_confirmation',
  VERIFIED_REGISTRATION_INTAKE: 'verified_registration_intake',
  AUDITED_STAFF_CORRECTION: 'audited_staff_correction',
});
const ALLOWED_EVIDENCE_TYPES = new Set(Object.values(EVIDENCE_TYPES));

function normalizeClientName(value = '') {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 120) return null;
  return name;
}

function normalizedAlias(value = '') {
  const name = normalizeClientName(value);
  return name ? name.toLowerCase() : null;
}

function evidenceObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
}

function authorityError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validatePromotion({ name, evidenceType, evidenceReference, actorType, actorReference }) {
  const currentName = normalizeClientName(name);
  if (!currentName) throw authorityError('CLIENT_FACING_NAME_INVALID', 'A non-empty client-facing name is required.');
  if (!ALLOWED_EVIDENCE_TYPES.has(evidenceType)) {
    throw authorityError('CLIENT_FACING_NAME_EVIDENCE_NOT_AUTHORIZED', 'Client-facing name promotion evidence is not authorized.');
  }
  if (!evidenceObject(evidenceReference)) {
    throw authorityError('CLIENT_FACING_NAME_EVIDENCE_REQUIRED', 'Direct evidence/reference metadata is required for client-facing name promotion.');
  }
  if (!['client', 'staff', 'system'].includes(actorType)) {
    throw authorityError('CLIENT_FACING_NAME_ACTOR_INVALID', 'A controlled client-facing name promotion actor is required.');
  }
  if (evidenceType === EVIDENCE_TYPES.AUDITED_STAFF_CORRECTION) {
    if (actorType !== 'staff' || !String(actorReference || '').trim()) {
      throw authorityError('CLIENT_FACING_NAME_STAFF_EVIDENCE_REQUIRED', 'Audited staff correction requires an attributable staff actor.');
    }
  }
  return currentName;
}

async function preserveAlias(db, {
  clientId,
  name,
  sourceType,
  sourceKey = '',
  sourceReference = {},
}) {
  const aliasName = normalizeClientName(name);
  if (!aliasName) return null;
  const result = await db.query(
    `INSERT INTO client_name_aliases
       (client_id,alias_name,normalized_alias_name,source_type,source_key,source_reference)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb)
     ON CONFLICT (client_id,normalized_alias_name,source_type,source_key) DO NOTHING
     RETURNING id`,
    [clientId, aliasName, normalizedAlias(aliasName), sourceType, String(sourceKey || ''), JSON.stringify(sourceReference || {})]
  );
  return result.rows[0]?.id || null;
}

async function resolveClientFacingName(clientId, db = pool) {
  if (!/^\d+$/.test(String(clientId || '')) || Number(clientId) <= 0) {
    return { status: 'none', clientId: null, name: null, authorityId: null, evidenceType: null };
  }
  const result = await db.query(
    `SELECT id,current_name,evidence_type,promoted_at
       FROM client_facing_name_authorities
      WHERE client_id=$1
        AND revoked_at IS NULL
      ORDER BY promoted_at DESC,id DESC
      LIMIT 1`,
    [clientId]
  );
  const row = result.rows[0] || null;
  if (!row) {
    return { status: 'neutral', clientId: Number(clientId), name: null, authorityId: null, evidenceType: null };
  }
  return {
    status: 'authoritative',
    clientId: Number(clientId),
    name: row.current_name,
    authorityId: Number(row.id),
    evidenceType: row.evidence_type,
    promotedAt: row.promoted_at,
  };
}

async function resolveClientFacingNameByPhone(phone, db = pool) {
  const normalizedPhone = String(phone || '').replace(/[^0-9]/g, '');
  if (!normalizedPhone) return { status: 'none', clientId: null, name: null, authorityId: null, evidenceType: null };
  const clients = await db.query(
    `SELECT DISTINCT c.id
       FROM clients c
       JOIN client_contacts cc ON cc.client_id=c.id
      WHERE cc.normalized_value=$1
        AND cc.contact_type IN ('whatsapp','mobile','phone')
        AND c.status='active'
      ORDER BY c.id
      LIMIT 2`,
    [normalizedPhone]
  );
  if (clients.rowCount !== 1) {
    return {
      status: clients.rowCount > 1 ? 'ambiguous' : 'none',
      clientId: null,
      name: null,
      authorityId: null,
      evidenceType: null,
    };
  }
  return resolveClientFacingName(clients.rows[0].id, db);
}

async function resolveClientFacingNameForAppointment(appointmentId, db = pool) {
  if (!/^\d+$/.test(String(appointmentId || '')) || Number(appointmentId) <= 0) {
    return { status: 'none', clientId: null, name: null, authorityId: null, evidenceType: null };
  }
  const result = await db.query(`SELECT client_id FROM appointments WHERE id=$1`, [appointmentId]);
  const clientId = result.rows[0]?.client_id || null;
  if (!clientId) return { status: 'none', clientId: null, name: null, authorityId: null, evidenceType: null };
  return resolveClientFacingName(clientId, db);
}

async function promoteClientFacingNameInTransaction(db, {
  clientId,
  name,
  evidenceType,
  evidenceReference,
  actorType,
  actorReference = null,
}) {
  const currentName = validatePromotion({ name, evidenceType, evidenceReference, actorType, actorReference });
  if (!/^\d+$/.test(String(clientId || '')) || Number(clientId) <= 0) {
    throw authorityError('CLIENT_FACING_NAME_CLIENT_INVALID', 'A canonical client id is required.');
  }

  const lockedClient = await db.query(`SELECT id,display_name FROM clients WHERE id=$1 FOR UPDATE`, [clientId]);
  if (lockedClient.rowCount !== 1) throw authorityError('CLIENT_FACING_NAME_CLIENT_NOT_FOUND', 'Canonical client was not found.');
  const compatibilityName = lockedClient.rows[0].display_name;

  const active = await db.query(
    `SELECT id,current_name,evidence_type,promoted_at
       FROM client_facing_name_authorities
      WHERE client_id=$1 AND revoked_at IS NULL
      FOR UPDATE`,
    [clientId]
  );
  const previous = active.rows[0] || null;

  if (compatibilityName) {
    await preserveAlias(db, {
      clientId,
      name: compatibilityName,
      sourceType: 'compatibility_projection_before_promotion',
      sourceReference: { controlAuthority: 'PR488' },
    });
  }
  if (previous?.current_name) {
    await preserveAlias(db, {
      clientId,
      name: previous.current_name,
      sourceType: 'prior_authoritative_name',
      sourceKey: String(previous.id),
      sourceReference: { authorityId: Number(previous.id), evidenceType: previous.evidence_type },
    });
    await db.query(
      `UPDATE client_facing_name_authorities
          SET revoked_at=NOW(),revoked_by=$2,revocation_reason='superseded_by_new_evidence'
        WHERE id=$1 AND revoked_at IS NULL`,
      [previous.id, `${actorType}:${String(actorReference || evidenceType)}`]
    );
  }

  const inserted = await db.query(
    `INSERT INTO client_facing_name_authorities
       (client_id,current_name,normalized_name,evidence_type,evidence_reference,actor_type,actor_reference)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)
     RETURNING id,current_name,evidence_type,promoted_at`,
    [clientId, currentName, normalizedAlias(currentName), evidenceType, JSON.stringify(evidenceReference), actorType, actorReference]
  );
  const authority = inserted.rows[0];

  // Compatibility/cache projection only. All client-facing readers must resolve
  // the authority table rather than treating clients.display_name as independent truth.
  await db.query(`UPDATE clients SET display_name=$2,updated_at=NOW() WHERE id=$1`, [clientId, currentName]);
  await db.query(
    `INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
     VALUES ('client.facing_name_promoted','client',$1,$2::jsonb)`,
    [clientId, JSON.stringify({
      authorityId: Number(authority.id),
      evidenceType,
      evidenceReference,
      actorType,
      actorReference,
      previousAuthorityId: previous ? Number(previous.id) : null,
      compatibilityProjectionUpdated: true,
      controlAuthority: 'PR488',
    })]
  );
  return {
    status: 'promoted',
    clientId: Number(clientId),
    name: authority.current_name,
    authorityId: Number(authority.id),
    evidenceType: authority.evidence_type,
    promotedAt: authority.promoted_at,
  };
}

async function promoteClientFacingName(input) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const result = await promoteClientFacingNameInTransaction(db, input);
    await db.query('COMMIT');
    return result;
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

async function revokeClientFacingNameInTransaction(db, {
  clientId,
  revokedBy,
  reason,
}) {
  if (!/^\d+$/.test(String(clientId || '')) || Number(clientId) <= 0) {
    throw authorityError('CLIENT_FACING_NAME_CLIENT_INVALID', 'A canonical client id is required.');
  }
  if (!String(revokedBy || '').trim() || !String(reason || '').trim()) {
    throw authorityError('CLIENT_FACING_NAME_REVOCATION_EVIDENCE_REQUIRED', 'Revocation requires an attributable actor and reason.');
  }
  const client = await db.query(`SELECT id,display_name FROM clients WHERE id=$1 FOR UPDATE`, [clientId]);
  if (client.rowCount !== 1) throw authorityError('CLIENT_FACING_NAME_CLIENT_NOT_FOUND', 'Canonical client was not found.');
  const active = await db.query(
    `SELECT id,current_name,evidence_type
       FROM client_facing_name_authorities
      WHERE client_id=$1 AND revoked_at IS NULL
      FOR UPDATE`,
    [clientId]
  );
  const authority = active.rows[0] || null;
  if (!authority) return { status: 'already_neutral', clientId: Number(clientId), name: null, authorityId: null };

  await preserveAlias(db, {
    clientId,
    name: authority.current_name,
    sourceType: 'prior_authoritative_name',
    sourceKey: String(authority.id),
    sourceReference: { authorityId: Number(authority.id), evidenceType: authority.evidence_type },
  });
  await db.query(
    `UPDATE client_facing_name_authorities
        SET revoked_at=NOW(),revoked_by=$2,revocation_reason=$3
      WHERE id=$1 AND revoked_at IS NULL`,
    [authority.id, String(revokedBy).trim(), String(reason).trim()]
  );
  await db.query(`UPDATE clients SET display_name=NULL,updated_at=NOW() WHERE id=$1`, [clientId]);
  await db.query(
    `INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
     VALUES ('client.facing_name_revoked','client',$1,$2::jsonb)`,
    [clientId, JSON.stringify({
      authorityId: Number(authority.id),
      revokedBy: String(revokedBy).trim(),
      reason: String(reason).trim(),
      compatibilityProjectionCleared: true,
      controlAuthority: 'PR488',
    })]
  );
  return { status: 'revoked', clientId: Number(clientId), name: null, authorityId: Number(authority.id) };
}

async function revokeClientFacingName(input) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const result = await revokeClientFacingNameInTransaction(db, input);
    await db.query('COMMIT');
    return result;
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

module.exports = {
  EVIDENCE_TYPES,
  ALLOWED_EVIDENCE_TYPES,
  normalizeClientName,
  resolveClientFacingName,
  resolveClientFacingNameByPhone,
  resolveClientFacingNameForAppointment,
  preserveAlias,
  promoteClientFacingNameInTransaction,
  promoteClientFacingName,
  revokeClientFacingNameInTransaction,
  revokeClientFacingName,
};
