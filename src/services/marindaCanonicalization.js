const { pool } = require('../db/pool');
const { getManualQueue } = require('./manualReconciliationQueue');

const QUEUE_ID = '775';
const EXPECTED_NAME = 'Marinda Botha';
const EXEC_CONFIRMATION = 'EXECUTE_MARINDA_CANONICALIZATION';

async function buildMarindaPlan({ clientBatchId = '1', appointmentBatchId = '2' } = {}) {
  const queue = await getManualQueue({ clientBatchId, appointmentBatchId });
  const item = queue.items.find((i) => String(i.queueId) === QUEUE_ID);
  const blockers = [];
  if (!item) blockers.push('queue_case_not_pending');
  if (item && item.displayName !== EXPECTED_NAME) blockers.push('unexpected_display_name');
  if (item && item.reason !== 'missing_primary_phone') blockers.push('unexpected_reason');
  if (item && item.normalizedPhone) blockers.push('primary_phone_present');
  if (item && item.exactAppointmentCount < 1) blockers.push('no_exact_appointment_evidence');
  if (item && item.emailPresent) blockers.push('unexpected_email_contact');
  if (item && item.secondaryPhonePresent) blockers.push('unexpected_secondary_phone');
  return {
    mode: 'dry_run', writesPerformed: false, eligible: blockers.length === 0,
    policy: { queueId: QUEUE_ID, expectedName: EXPECTED_NAME, requiredReason: 'missing_primary_phone', minimumExactAppointmentCount: 1, requiresNoPrimaryPhone: true, requiresNoEmail: true, requiresNoSecondaryPhone: true, executionConfirmation: EXEC_CONFIRMATION },
    case: item || null, blockers,
  };
}

async function executeMarindaCanonicalization({ clientBatchId = '1', appointmentBatchId = '2', confirmation } = {}) {
  if (confirmation !== EXEC_CONFIRMATION) { const e = new Error(`Execution requires confirmation value: ${EXEC_CONFIRMATION}`); e.code = 'CONFIRMATION_REQUIRED'; throw e; }
  const plan = await buildMarindaPlan({ clientBatchId, appointmentBatchId });
  if (!plan.eligible) { const e = new Error(`Marinda plan blocked: ${plan.blockers.join(', ')}`); e.code = 'PLAN_BLOCKED'; throw e; }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query(
      `SELECT q.id AS queue_id,q.status,q.reason,er.id AS external_record_id,er.external_id,er.reconciliation_status,er.shiloh_entity_id,
              ecr.display_name,ecr.email,ecr.phone,ecr.normalized_phone,ecr.secondary_phone,ecr.normalized_secondary_phone,ecr.address,ecr.notes,ecr.has_photo,ecr.is_blocked
       FROM client_reconciliation_queue q JOIN external_records er ON er.id=q.external_record_id JOIN external_client_records ecr ON ecr.external_record_id=er.id
       WHERE q.id=$1 FOR UPDATE OF q,er`, [QUEUE_ID]);
    const row = locked.rows[0];
    if (!row || row.status !== 'needs_review' || row.reason !== 'missing_primary_phone' || row.display_name !== EXPECTED_NAME || row.normalized_phone || row.email || row.secondary_phone || row.reconciliation_status === 'matched' || row.shiloh_entity_id) {
      const e = new Error('Marinda identity evidence changed since dry-run'); e.code = 'PLAN_BLOCKED'; throw e;
    }
    const custom = { goldie_import_batch_id: String(clientBatchId), goldie_external_id: row.external_id, reconciliation_policy: 'missing_phone_exact_appointment_identity', exact_appointment_count_at_reconciliation: plan.case.exactAppointmentCount, address: row.address || null, notes: row.notes || null, has_photo: Boolean(row.has_photo), is_blocked: Boolean(row.is_blocked) };
    const inserted = await client.query(`INSERT INTO clients (display_name,source,custom_attributes) VALUES ($1,'goldie_import',$2::jsonb) RETURNING id`, [row.display_name, JSON.stringify(custom)]);
    const clientId = inserted.rows[0].id;
    const evidence = JSON.stringify({ policy: 'missing_phone_exact_appointment_identity', queue_id: QUEUE_ID, exact_appointment_count: plan.case.exactAppointmentCount, source_has_no_contact_identifiers: true });
    await client.query(`UPDATE external_records SET shiloh_entity_type='client',shiloh_entity_id=$2,reconciliation_status='matched',match_method='missing_phone_exact_appointment_canonicalization',match_confidence=1.0,reconciled_at=NOW(),updated_at=NOW() WHERE id=$1`, [row.external_record_id, clientId]);
    await client.query(`UPDATE client_reconciliation_queue SET status='matched',resolution='missing_phone_exact_appointment_new_canonical_client',resolved_client_id=$2,resolved_by='system:marinda_canonicalization',resolved_at=NOW(),candidate_score=1.0,evidence=evidence || $3::jsonb WHERE id=$1`, [QUEUE_ID, clientId, evidence]);
    await client.query(`INSERT INTO client_reconciliation_history (external_record_id,client_id,action,method,confidence,evidence,performed_by) VALUES ($1,$2,'created','missing_phone_exact_appointment_canonicalization',1.0,$3::jsonb,'system:marinda_canonicalization')`, [row.external_record_id, clientId, evidence]);
    await client.query('COMMIT');
    return { mode: 'execute', writesPerformed: true, queueId: QUEUE_ID, clientId: String(clientId), displayName: EXPECTED_NAME, exactAppointmentCount: plan.case.exactAppointmentCount };
  } catch (error) { try { await client.query('ROLLBACK'); } catch (_) {} throw error; } finally { client.release(); }
}

async function runConfiguredMarindaCanonicalization(logger = console) {
  const confirmation = process.env.MARINDA_CANONICALIZATION_CONFIRMATION;
  if (!confirmation) return { skipped: true, reason: 'confirmation_not_configured' };
  const result = await executeMarindaCanonicalization({ confirmation });
  logger.info({ marindaCanonicalization: result }, 'Marinda canonicalization completed');
  return result;
}

module.exports = { buildMarindaPlan, executeMarindaCanonicalization, runConfiguredMarindaCanonicalization, EXEC_CONFIRMATION };
