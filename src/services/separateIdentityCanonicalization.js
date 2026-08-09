const { pool } = require('../db/pool');
const { getManualQueue } = require('./manualReconciliationQueue');

const EXEC_CONFIRMATION = 'EXECUTE_SEPARATE_IDENTITY_CANONICALIZATION';

function normalizedName(value = '') {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function buildSeparateIdentityPlan({ clientBatchId = '1', appointmentBatchId = '2' } = {}) {
  const queue = await getManualQueue({ clientBatchId, appointmentBatchId });
  const baseEligible = queue.items.filter((item) =>
    item.reason === 'duplicate_goldie_primary_phone' &&
    item.appointmentEvidence === 'supports_separate_identities' &&
    item.exactAppointmentCount >= 1
  );

  const byPhone = new Map();
  for (const item of baseEligible) {
    const key = item.normalizedPhone || '';
    if (!byPhone.has(key)) byPhone.set(key, []);
    byPhone.get(key).push(item);
  }

  const eligible = [];
  const excluded = [];
  for (const item of baseEligible) {
    const group = byPhone.get(item.normalizedPhone || '') || [];
    const sameNameCount = group.filter((g) => normalizedName(g.displayName) === normalizedName(item.displayName)).length;
    if (sameNameCount > 1) {
      excluded.push({ queueId: item.queueId, displayName: item.displayName, reason: 'duplicate_normalized_name_within_shared_phone_group' });
      continue;
    }
    eligible.push(item);
  }

  return {
    mode: 'dry_run', writesPerformed: false,
    clientBatchId: String(clientBatchId), appointmentBatchId: String(appointmentBatchId),
    policy: {
      requiredReason: 'duplicate_goldie_primary_phone',
      requiredAppointmentEvidence: 'supports_separate_identities',
      minimumExactAppointmentCount: 1,
      duplicateNormalizedNamesExcluded: true,
      sharedPhoneContactCollisionStrategy: 'create_distinct_clients; attach canonical phone only when unowned; otherwise retain source phone in custom_attributes',
      executionConfirmation: EXEC_CONFIRMATION,
    },
    summary: {
      pendingManualReview: queue.summary.total,
      baseEligible: baseEligible.length,
      eligible: eligible.length,
      excluded: excluded.length,
      distinctSharedPhoneGroups: new Set(eligible.map((i) => i.normalizedPhone)).size,
    },
    eligible: eligible.map((i) => ({ queueId: i.queueId, goldieClientId: i.goldieClientId, displayName: i.displayName, normalizedPhone: i.normalizedPhone, exactAppointmentCount: i.exactAppointmentCount, nearAppointmentCount: i.nearAppointmentCount, appointmentEvidence: i.appointmentEvidence })),
    excluded,
  };
}

async function findPhoneOwner(client, normalizedPhone) {
  if (!normalizedPhone) return null;
  const result = await client.query(
    `SELECT c.id, c.display_name FROM client_contacts cc JOIN clients c ON c.id=cc.client_id WHERE cc.normalized_value=$1 AND cc.contact_type = ANY($2::text[]) ORDER BY c.id LIMIT 1`,
    [normalizedPhone, ['whatsapp','mobile','other']]
  );
  return result.rows[0] || null;
}

async function executeSeparateIdentityCanonicalization({ clientBatchId = '1', appointmentBatchId = '2', confirmation } = {}) {
  if (confirmation !== EXEC_CONFIRMATION) {
    const error = new Error(`Execution requires confirmation value: ${EXEC_CONFIRMATION}`); error.code = 'CONFIRMATION_REQUIRED'; throw error;
  }
  const plan = await buildSeparateIdentityPlan({ clientBatchId, appointmentBatchId });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let createdCanonicalClients = 0, linkedExternalRecords = 0, canonicalPhonesAttached = 0, sharedPhonesRetainedAsSourceOnly = 0;
    const created = [];
    for (const item of plan.eligible) {
      const locked = await client.query(
        `SELECT q.id AS queue_id,q.status,q.reason,er.id AS external_record_id,er.external_id,er.reconciliation_status,er.shiloh_entity_id,ecr.display_name,ecr.email,ecr.phone,ecr.normalized_phone,ecr.secondary_phone,ecr.normalized_secondary_phone,ecr.address,ecr.notes,ecr.has_photo,ecr.is_blocked FROM client_reconciliation_queue q JOIN external_records er ON er.id=q.external_record_id JOIN external_client_records ecr ON ecr.external_record_id=er.id WHERE q.id=$1 FOR UPDATE OF q,er`,
        [item.queueId]
      );
      const row = locked.rows[0];
      if (!row || row.status !== 'needs_review' || row.reason !== 'duplicate_goldie_primary_phone') { const e=new Error(`Queue ${item.queueId} changed since dry-run`); e.code='PLAN_BLOCKED'; throw e; }
      if (row.reconciliation_status === 'matched' || row.shiloh_entity_id) { const e=new Error(`Queue ${item.queueId} is already canonicalized`); e.code='PLAN_BLOCKED'; throw e; }
      if (normalizedName(row.display_name) !== normalizedName(item.displayName) || row.normalized_phone !== item.normalizedPhone) { const e=new Error(`Queue ${item.queueId} identity evidence changed since dry-run`); e.code='PLAN_BLOCKED'; throw e; }

      const phoneOwner = await findPhoneOwner(client, row.normalized_phone);
      const inserted = await client.query(
        `INSERT INTO clients (display_name,source,custom_attributes) VALUES ($1,'goldie_import',$2::jsonb) RETURNING id`,
        [row.display_name || null, JSON.stringify({ goldie_import_batch_id:String(clientBatchId), goldie_external_id:row.external_id, reconciliation_policy:'appointment_evidence_supports_separate_identity', source_primary_phone:row.phone||null, source_normalized_phone:row.normalized_phone||null, shared_phone_owner_client_id:phoneOwner?String(phoneOwner.id):null, exact_appointment_count_at_reconciliation:item.exactAppointmentCount, address:row.address||null, notes:row.notes||null, has_photo:Boolean(row.has_photo), is_blocked:Boolean(row.is_blocked) })]
      );
      const clientId = inserted.rows[0].id;
      if (row.phone && row.normalized_phone && !phoneOwner) {
        await client.query(`INSERT INTO client_contacts (client_id,contact_type,value,normalized_value,is_primary) VALUES ($1,'mobile',$2,$3,TRUE)`, [clientId,row.phone,row.normalized_phone]);
        canonicalPhonesAttached += 1;
      } else if (row.normalized_phone) sharedPhonesRetainedAsSourceOnly += 1;

      if (row.email) {
        const email = String(row.email).trim().toLowerCase();
        if (email) {
          const owner = await client.query(`SELECT 1 FROM client_contacts WHERE normalized_value=$1 AND contact_type='email' LIMIT 1`, [email]);
          if (!owner.rows.length) await client.query(`INSERT INTO client_contacts (client_id,contact_type,value,normalized_value,is_primary) VALUES ($1,'email',$2,$3,$4)`, [clientId,row.email,email,!row.normalized_phone]);
        }
      }
      const evidence = JSON.stringify({ policy:'appointment_evidence_supports_separate_identity', queue_id:String(item.queueId), exact_appointment_count:item.exactAppointmentCount, appointment_evidence:'supports_separate_identities', shared_phone_stored_as_source_only:Boolean(phoneOwner) });
      await client.query(`UPDATE external_records SET shiloh_entity_type='client',shiloh_entity_id=$2,reconciliation_status='matched',match_method='separate_identity_canonicalization',match_confidence=1.0,reconciled_at=NOW(),updated_at=NOW() WHERE id=$1`, [row.external_record_id,clientId]);
      await client.query(`UPDATE client_reconciliation_queue SET status='matched',resolution='separate_identity_new_canonical_client',resolved_client_id=$2,resolved_by='system:separate_identity_canonicalization',resolved_at=NOW(),candidate_score=1.0,evidence=evidence || $3::jsonb WHERE id=$1`, [row.queue_id,clientId,evidence]);
      await client.query(`INSERT INTO client_reconciliation_history (external_record_id,client_id,action,method,confidence,evidence,performed_by) VALUES ($1,$2,'created','separate_identity_canonicalization',1.0,$3::jsonb,'system:separate_identity_canonicalization')`, [row.external_record_id,clientId,evidence]);
      createdCanonicalClients += 1; linkedExternalRecords += 1; created.push({ queueId:String(row.queue_id), clientId:String(clientId) });
    }
    await client.query('COMMIT');
    return { mode:'execute', writesPerformed:createdCanonicalClients>0, createdCanonicalClients, linkedExternalRecords, canonicalPhonesAttached, sharedPhonesRetainedAsSourceOnly, excludedByPlan:plan.excluded.length, created };
  } catch (error) { try { await client.query('ROLLBACK'); } catch (_) {} throw error; }
  finally { client.release(); }
}

async function runConfiguredSeparateIdentityCanonicalization(logger=console) {
  const confirmation = process.env.SEPARATE_IDENTITY_EXEC_CONFIRMATION;
  if (!confirmation) return null;
  const clientBatchId = process.env.SEPARATE_IDENTITY_CLIENT_BATCH || '1';
  const appointmentBatchId = process.env.SEPARATE_IDENTITY_APPOINTMENT_BATCH || '2';
  const result = await executeSeparateIdentityCanonicalization({ clientBatchId, appointmentBatchId, confirmation });
  logger.info?.({ separateIdentityExecution: { createdCanonicalClients:result.createdCanonicalClients, linkedExternalRecords:result.linkedExternalRecords, canonicalPhonesAttached:result.canonicalPhonesAttached, sharedPhonesRetainedAsSourceOnly:result.sharedPhonesRetainedAsSourceOnly, excludedByPlan:result.excludedByPlan } }, 'Separate identity canonicalization completed');
  return result;
}

module.exports = { buildSeparateIdentityPlan, executeSeparateIdentityCanonicalization, runConfiguredSeparateIdentityCanonicalization, EXEC_CONFIRMATION };
