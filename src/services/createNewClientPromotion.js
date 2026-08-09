const { pool } = require('../db/pool');

const EXECUTION_CONFIRMATION = 'EXECUTE_GOLDIE_CREATE_NEW_PROMOTION';

function normalizeEmail(value='') { return String(value || '').trim().toLowerCase(); }

async function findContactOwner(client, type, normalized) {
  if (!normalized) return null;
  const types = type === 'phone' ? ['whatsapp','mobile','other'] : ['email'];
  const result = await client.query(
    `SELECT c.id, c.display_name, cc.contact_type
     FROM client_contacts cc JOIN clients c ON c.id=cc.client_id
     WHERE cc.normalized_value=$1 AND cc.contact_type = ANY($2::text[])
     ORDER BY c.id LIMIT 1`, [normalized, types]
  );
  return result.rows[0] || null;
}

async function buildCreateNewPlan(batchId) {
  if (!batchId) throw new Error('batchId is required');
  const client = await pool.connect();
  try {
    const rows = await client.query(
      `SELECT er.id AS external_record_id, er.external_id, er.shiloh_entity_id, er.reconciliation_status,
              ecr.display_name, ecr.email, ecr.phone, ecr.normalized_phone,
              ecr.secondary_phone, ecr.normalized_secondary_phone, ecr.address, ecr.notes,
              ecr.has_photo, ecr.is_blocked, q.status AS queue_status, q.reason
       FROM external_records er
       JOIN external_client_records ecr ON ecr.external_record_id=er.id
       JOIN client_reconciliation_queue q ON q.external_record_id=er.id
       WHERE er.source='goldie' AND er.entity_type='client' AND er.import_batch_id=$1
         AND q.status='create_new'
       ORDER BY er.external_id`, [String(batchId)]
    );

    const eligible = [];
    const blocked = [];
    const alreadyApplied = [];
    for (const row of rows.rows) {
      if (row.reconciliation_status === 'matched' && row.shiloh_entity_id) {
        alreadyApplied.push({ externalId: row.external_id, clientId: String(row.shiloh_entity_id) });
        continue;
      }
      const phoneOwner = await findContactOwner(client, 'phone', row.normalized_phone);
      const email = normalizeEmail(row.email);
      const emailOwner = await findContactOwner(client, 'email', email);
      if (phoneOwner || emailOwner) {
        blocked.push({ externalId: row.external_id, reason: phoneOwner ? 'canonical_phone_collision' : 'canonical_email_collision' });
      } else {
        eligible.push(row);
      }
    }

    const held = await client.query(
      `SELECT q.status, q.reason, COUNT(*)::int AS count
       FROM client_reconciliation_queue q
       JOIN external_records er ON er.id=q.external_record_id
       WHERE er.source='goldie' AND er.entity_type='client' AND er.import_batch_id=$1
         AND q.status='needs_review'
       GROUP BY q.status,q.reason ORDER BY q.reason`, [String(batchId)]
    );

    return {
      batchId: String(batchId),
      policy: { allowedQueueStatus: 'create_new', lowerConfidenceWritesAllowed: false, collisionWritesAllowed: false },
      summary: { stagedCreateNew: rows.rows.length, eligible: eligible.length, blocked: blocked.length, alreadyApplied: alreadyApplied.length },
      eligible, blocked, alreadyApplied,
      heldLowerConfidence: held.rows,
    };
  } finally { client.release(); }
}

async function executeCreateNewPromotion(batchId, confirmation) {
  if (confirmation !== EXECUTION_CONFIRMATION) throw new Error('confirmation required');
  const plan = await buildCreateNewPlan(batchId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let created = 0;
    let linked = 0;
    for (const row of plan.eligible) {
      const locked = await client.query(
        `SELECT er.id AS external_record_id, er.external_id, er.shiloh_entity_id, er.reconciliation_status,
                ecr.display_name,ecr.email,ecr.phone,ecr.normalized_phone,ecr.secondary_phone,ecr.normalized_secondary_phone,
                ecr.address,ecr.notes,ecr.has_photo,ecr.is_blocked
         FROM external_records er JOIN external_client_records ecr ON ecr.external_record_id=er.id
         JOIN client_reconciliation_queue q ON q.external_record_id=er.id
         WHERE er.id=$1 AND q.status='create_new' FOR UPDATE OF er,q`, [row.external_record_id]
      );
      const r = locked.rows[0];
      if (!r || (r.reconciliation_status === 'matched' && r.shiloh_entity_id)) continue;
      const phoneOwner = await findContactOwner(client, 'phone', r.normalized_phone);
      const email = normalizeEmail(r.email);
      const emailOwner = await findContactOwner(client, 'email', email);
      if (phoneOwner || emailOwner) continue;

      const inserted = await client.query(
        `INSERT INTO clients (display_name,source,custom_attributes)
         VALUES ($1,'goldie_import',$2::jsonb) RETURNING id`,
        [r.display_name || null, JSON.stringify({ goldie_import_batch_id:String(batchId), goldie_external_id:r.external_id, address:r.address || null, notes:r.notes || null, has_photo:r.has_photo, is_blocked:r.is_blocked })]
      );
      const clientId = inserted.rows[0].id;
      if (r.phone && r.normalized_phone) {
        await client.query(`INSERT INTO client_contacts (client_id,contact_type,value,normalized_value,is_primary) VALUES ($1,'mobile',$2,$3,TRUE)`, [clientId,r.phone,r.normalized_phone]);
      }
      if (r.email && email) {
        await client.query(`INSERT INTO client_contacts (client_id,contact_type,value,normalized_value,is_primary) VALUES ($1,'email',$2,$3,$4)`, [clientId,r.email,email,!r.normalized_phone]);
      }
      if (r.secondary_phone && r.normalized_secondary_phone && r.normalized_secondary_phone !== r.normalized_phone) {
        const secondaryOwner = await findContactOwner(client,'phone',r.normalized_secondary_phone);
        if (!secondaryOwner) {
          await client.query(`INSERT INTO client_contacts (client_id,contact_type,value,normalized_value,is_primary) VALUES ($1,'other',$2,$3,FALSE) ON CONFLICT (contact_type,normalized_value) DO NOTHING`, [clientId,r.secondary_phone,r.normalized_secondary_phone]);
        }
      }
      const evidence = JSON.stringify({ canonicalization_policy:'create_new_only', original_queue_reason:'no_existing_canonical_phone_match' });
      await client.query(`UPDATE external_records SET shiloh_entity_type='client',shiloh_entity_id=$2,reconciliation_status='matched',match_method='create_new_promotion',match_confidence=1.0,reconciled_at=NOW(),updated_at=NOW() WHERE id=$1`, [r.external_record_id,clientId]);
      await client.query(`UPDATE client_reconciliation_queue SET status='matched',resolution='promoted_create_new',resolved_client_id=$2,resolved_by='system:create_new_promotion',resolved_at=NOW(),candidate_score=1.0,evidence=evidence || $3::jsonb WHERE external_record_id=$1`, [r.external_record_id,clientId,evidence]);
      await client.query(`INSERT INTO client_reconciliation_history (external_record_id,client_id,action,method,confidence,evidence,performed_by) VALUES ($1,$2,'created','create_new_promotion',1.0,$3::jsonb,'system:create_new_promotion')`, [r.external_record_id,clientId,evidence]);
      created += 1; linked += 1;
    }
    await client.query('COMMIT');
    return { mode:'execute', writesPerformed:created>0, createdCanonicalClients:created, linkedExternalRecords:linked, skippedBlocked:plan.blocked.length, skippedAlreadyApplied:plan.alreadyApplied.length, heldLowerConfidence:plan.heldLowerConfidence };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

async function runConfiguredCreateNewPromotion(logger=console) {
  const batchId = process.env.PROMOTE_GOLDIE_CREATE_NEW_BATCH;
  const confirmation = process.env.PROMOTE_GOLDIE_CREATE_NEW_CONFIRMATION;
  if (!batchId || !confirmation) return null;
  const result = await executeCreateNewPromotion(batchId, confirmation);
  logger.info?.({ goldieCreateNewPromotion: {
    batchId:String(batchId), createdCanonicalClients:result.createdCanonicalClients,
    linkedExternalRecords:result.linkedExternalRecords, skippedBlocked:result.skippedBlocked,
    skippedAlreadyApplied:result.skippedAlreadyApplied, heldLowerConfidence:result.heldLowerConfidence,
  }}, 'Goldie create-new promotion completed');
  return result;
}

module.exports = { buildCreateNewPlan, executeCreateNewPromotion, runConfiguredCreateNewPromotion, EXECUTION_CONFIRMATION };