const crypto = require('crypto');
const { pool } = require('../db/pool');

const QUEUE_IDS = ['723', '726'];
const EXEC_CONFIRMATION = 'EXECUTE_CHANTEL_DUPLICATE_CANONICALIZATION';

function payloadFingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value || {})).digest('hex');
}
function normalizeEmail(value = '') { return String(value || '').trim().toLowerCase(); }
async function findContactOwner(client, type, normalized) {
  if (!normalized) return null;
  const types = type === 'phone' ? ['whatsapp', 'mobile', 'other'] : ['email'];
  const result = await client.query(`SELECT c.id, c.display_name FROM client_contacts cc JOIN clients c ON c.id = cc.client_id WHERE cc.normalized_value = $1 AND cc.contact_type = ANY($2::text[]) ORDER BY c.id LIMIT 1`, [normalized, types]);
  return result.rows[0] || null;
}
async function loadPair(client, forUpdate = false) {
  const result = await client.query(`SELECT q.id AS queue_id, q.status, q.reason, er.id AS external_record_id, er.external_id, er.reconciliation_status, er.shiloh_entity_id, er.source_payload, ecr.display_name, ecr.email, ecr.phone, ecr.normalized_phone, ecr.secondary_phone, ecr.normalized_secondary_phone, ecr.address, ecr.notes, ecr.has_photo, ecr.is_blocked FROM client_reconciliation_queue q JOIN external_records er ON er.id = q.external_record_id JOIN external_client_records ecr ON ecr.external_record_id = er.id WHERE q.id = ANY($1::bigint[]) ORDER BY q.id ${forUpdate ? 'FOR UPDATE OF q, er' : ''}`, [QUEUE_IDS]);
  return result.rows;
}
function validatePair(rows) {
  const blockers = [];
  if (rows.length !== 2) blockers.push('expected_exactly_two_queue_records');
  if (rows.some((r) => r.status !== 'needs_review')) blockers.push('queue_status_changed');
  if (rows.some((r) => r.reason !== 'duplicate_goldie_primary_phone')) blockers.push('unexpected_queue_reason');
  if (rows.some((r) => r.reconciliation_status === 'matched' || r.shiloh_entity_id)) blockers.push('already_canonicalized');
  if (rows.length === 2) {
    const [a, b] = rows;
    if (String(a.display_name || '').trim().toLowerCase() !== String(b.display_name || '').trim().toLowerCase()) blockers.push('display_name_mismatch');
    if (!(a.normalized_phone && b.normalized_phone && a.normalized_phone === b.normalized_phone)) blockers.push('primary_phone_mismatch');
    if (payloadFingerprint(a.source_payload) !== payloadFingerprint(b.source_payload)) blockers.push('source_payload_mismatch');
  }
  return blockers;
}
async function buildChantelDuplicatePlan() {
  const client = await pool.connect();
  try {
    const rows = await loadPair(client, false);
    const blockers = validatePair(rows);
    let contactCollision = null;
    if (!blockers.length) {
      const preferred = rows[0];
      const phoneOwner = await findContactOwner(client, 'phone', preferred.normalized_phone);
      const emailOwner = await findContactOwner(client, 'email', normalizeEmail(preferred.email));
      if (phoneOwner || emailOwner) {
        contactCollision = { type: phoneOwner ? 'canonical_phone_collision' : 'canonical_email_collision', clientId: String((phoneOwner || emailOwner).id) };
        blockers.push(contactCollision.type);
      }
    }
    return { mode:'dry_run', writesPerformed:false, policy:{allowedQueueIds:QUEUE_IDS,requiresSameNormalizedName:true,requiresSameNormalizedPhone:true,requiresIdenticalSourcePayload:true,canonicalContactCollisionAllowed:false,executionConfirmation:EXEC_CONFIRMATION}, eligible:blockers.length===0, blockers, contactCollision, pair:rows.map(r=>({queueId:String(r.queue_id),externalId:r.external_id,displayName:r.display_name,hasEmail:Boolean(r.email),hasSecondaryPhone:Boolean(r.secondary_phone),payloadFingerprint:payloadFingerprint(r.source_payload).slice(0,12)})) };
  } finally { client.release(); }
}
async function executeChantelDuplicateCanonicalization(confirmation) {
  if (confirmation !== EXEC_CONFIRMATION) { const error = new Error(`Execution requires confirmation value: ${EXEC_CONFIRMATION}`); error.code='CONFIRMATION_REQUIRED'; throw error; }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rows = await loadPair(client, true);
    const blockers = validatePair(rows);
    if (blockers.length) { const error = new Error(`Chantel duplicate canonicalization blocked: ${blockers.join(', ')}`); error.code='PLAN_BLOCKED'; error.blockers=blockers; throw error; }
    const preferred = rows[0];
    const phoneOwner = await findContactOwner(client, 'phone', preferred.normalized_phone);
    const email = normalizeEmail(preferred.email);
    const emailOwner = await findContactOwner(client, 'email', email);
    if (phoneOwner || emailOwner) { const error = new Error('Chantel duplicate canonicalization blocked by canonical contact collision'); error.code='PLAN_BLOCKED'; error.blockers=[phoneOwner?'canonical_phone_collision':'canonical_email_collision']; throw error; }
    const inserted = await client.query(`INSERT INTO clients (display_name, source, custom_attributes) VALUES ($1,'goldie_import',$2::jsonb) RETURNING id`, [preferred.display_name || 'Chantel Symons', JSON.stringify({goldie_duplicate_group:true,goldie_external_ids:rows.map(r=>r.external_id),reconciliation_queue_ids:QUEUE_IDS,address:preferred.address||null,notes:preferred.notes||null,has_photo:Boolean(preferred.has_photo),is_blocked:Boolean(preferred.is_blocked)})]);
    const clientId = inserted.rows[0].id;
    if (preferred.phone && preferred.normalized_phone) await client.query(`INSERT INTO client_contacts (client_id,contact_type,value,normalized_value,is_primary) VALUES ($1,'mobile',$2,$3,TRUE)`, [clientId,preferred.phone,preferred.normalized_phone]);
    if (preferred.email && email) await client.query(`INSERT INTO client_contacts (client_id,contact_type,value,normalized_value,is_primary) VALUES ($1,'email',$2,$3,$4)`, [clientId,preferred.email,email,!preferred.normalized_phone]);
    if (preferred.secondary_phone && preferred.normalized_secondary_phone && preferred.normalized_secondary_phone !== preferred.normalized_phone) {
      const secondaryOwner = await findContactOwner(client,'phone',preferred.normalized_secondary_phone);
      if (!secondaryOwner) await client.query(`INSERT INTO client_contacts (client_id,contact_type,value,normalized_value,is_primary) VALUES ($1,'other',$2,$3,FALSE) ON CONFLICT (contact_type,normalized_value) DO NOTHING`, [clientId,preferred.secondary_phone,preferred.normalized_secondary_phone]);
    }
    const evidence = JSON.stringify({policy:'exact_goldie_duplicate_pair_only',queue_ids:QUEUE_IDS,same_name:true,same_primary_phone:true,identical_source_payload:true});
    for (const row of rows) {
      await client.query(`UPDATE external_records SET shiloh_entity_type='client',shiloh_entity_id=$2,reconciliation_status='matched',match_method='manual_duplicate_group_canonicalization',match_confidence=1.0,reconciled_at=NOW(),updated_at=NOW() WHERE id=$1`, [row.external_record_id,clientId]);
      await client.query(`UPDATE client_reconciliation_queue SET status='matched',resolution='duplicate_group_single_canonical_client',resolved_client_id=$2,resolved_by='system:chantel_duplicate_canonicalization',resolved_at=NOW(),candidate_score=1.0,evidence=evidence || $3::jsonb WHERE id=$1`, [row.queue_id,clientId,evidence]);
      await client.query(`INSERT INTO client_reconciliation_history (external_record_id,client_id,action,method,confidence,evidence,performed_by) VALUES ($1,$2,'created','manual_duplicate_group_canonicalization',1.0,$3::jsonb,'system:chantel_duplicate_canonicalization')`, [row.external_record_id,clientId,evidence]);
    }
    await client.query('COMMIT');
    return {mode:'execute',writesPerformed:true,createdCanonicalClients:1,linkedExternalRecords:rows.length,canonicalClientId:String(clientId),queueIds:QUEUE_IDS};
  } catch (error) { try { await client.query('ROLLBACK'); } catch (_) {} throw error; } finally { client.release(); }
}
async function runConfiguredChantelDuplicateCanonicalization(logger=console) {
  if (process.env.EXECUTE_CHANTEL_DUPLICATE !== '1') return null;
  const confirmation = process.env.EXECUTE_CHANTEL_DUPLICATE_CONFIRMATION;
  const result = await executeChantelDuplicateCanonicalization(confirmation);
  logger.info?.({ chantelDuplicateExecution: result }, 'Chantel duplicate canonicalization completed');
  return result;
}
module.exports = { buildChantelDuplicatePlan, executeChantelDuplicateCanonicalization, runConfiguredChantelDuplicateCanonicalization, EXEC_CONFIRMATION };
