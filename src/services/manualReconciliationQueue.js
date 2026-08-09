const { pool } = require("../db/pool");
const { getAppointmentIdentityEvidence } = require("./appointmentIdentityEvidence");
const { getSecondPassReconciliation } = require("./secondPassReconciliation");

const ALLOWED_ACTIONS = new Set(["keep_separate", "merge_into", "match_existing", "leave_unresolved"]);
const EXEC_CONFIRMATION = "EXECUTE_MANUAL_RECONCILIATION_DECISION";

function priorityScore(item) {
  let score = 0;
  if (item.reason === "phone_match_name_requires_review") score += 100;
  if (item.reason === "missing_primary_phone") score += 70;
  if (item.exactAppointmentCount > 0) score += 25;
  if (item.nearAppointmentCount > 0) score += 10;
  if (item.appointmentEvidence === "supports_separate_identities") score += 35;
  if (item.secondPassClassification === "manual_review") score += 15;
  return score;
}

async function getManualQueue({ clientBatchId = "1", appointmentBatchId = "2" } = {}) {
  const evidence = await getAppointmentIdentityEvidence({ clientBatchId, appointmentBatchId });
  const secondPass = await getSecondPassReconciliation({ clientBatchId, appointmentBatchId });
  const secondByPhone = new Map(secondPass.groups.map((g) => [g.normalizedPhone, g]));
  const groupByPhone = new Map(evidence.groups.map((g) => [g.normalizedPhone, g]));

  const rows = await pool.query(
    `SELECT q.id AS queue_id, q.reason, q.status, q.candidate_client_id,
            er.external_id AS goldie_client_id, ecr.display_name, ecr.email,
            ecr.phone, ecr.normalized_phone, ecr.secondary_phone, ecr.notes
     FROM client_reconciliation_queue q
     JOIN external_records er ON er.id=q.external_record_id
     JOIN external_client_records ecr ON ecr.external_record_id=er.id
     WHERE er.source='goldie' AND er.entity_type='client' AND er.import_batch_id=$1
       AND q.status='needs_review'
     ORDER BY q.id`,
    [clientBatchId]
  );

  const evidenceByQueue = new Map();
  for (const group of evidence.groups) for (const record of group.records) evidenceByQueue.set(String(record.queueId), { ...record, appointmentEvidence: group.appointmentEvidence });
  for (const record of evidence.missingPhoneCases) evidenceByQueue.set(String(record.queueId), record);
  for (const record of evidence.existingClientReviewCases) evidenceByQueue.set(String(record.queueId), record);

  const items = rows.rows.map((row) => {
    const ev = evidenceByQueue.get(String(row.queue_id)) || {};
    const group = row.normalized_phone ? groupByPhone.get(row.normalized_phone) : null;
    const second = row.normalized_phone ? secondByPhone.get(row.normalized_phone) : null;
    const supportedActions = ["leave_unresolved"];
    if (row.reason === "phone_match_name_requires_review" && row.candidate_client_id) supportedActions.push("match_existing");
    if (row.reason === "duplicate_goldie_primary_phone") supportedActions.push("keep_separate", "merge_into");
    if (row.reason === "missing_primary_phone") supportedActions.push("keep_separate");

    const item = {
      queueId: String(row.queue_id),
      goldieClientId: row.goldie_client_id,
      displayName: row.display_name,
      reason: row.reason,
      candidateClientId: row.candidate_client_id ? String(row.candidate_client_id) : null,
      normalizedPhone: row.normalized_phone,
      emailPresent: Boolean(row.email),
      secondaryPhonePresent: Boolean(row.secondary_phone),
      exactAppointmentCount: Number(ev.exactAppointmentCount || 0),
      nearAppointmentCount: Number(ev.nearAppointmentCount || 0),
      appointmentEvidence: ev.appointmentEvidence || group?.appointmentEvidence || null,
      secondPassClassification: second?.classification || null,
      secondPassConfidence: second?.confidence ?? null,
      supportedActions,
    };
    item.priority = priorityScore(item);
    return item;
  }).sort((a, b) => b.priority - a.priority || Number(a.queueId) - Number(b.queueId));

  return {
    safety: { mode: "manual_review", writesPerformed: false },
    clientBatchId: String(clientBatchId), appointmentBatchId: String(appointmentBatchId),
    summary: {
      total: items.length,
      duplicatePhone: items.filter((i) => i.reason === "duplicate_goldie_primary_phone").length,
      missingPhone: items.filter((i) => i.reason === "missing_primary_phone").length,
      existingClientReview: items.filter((i) => i.reason === "phone_match_name_requires_review").length,
    },
    items,
  };
}

async function decideManualCase({ queueId, action, targetClientId, mode = "dry_run", confirmation, performedBy = "user:manual_reconciliation" }) {
  if (!queueId) throw new Error("queueId is required");
  if (!ALLOWED_ACTIONS.has(action)) throw new Error("Unsupported action");
  if (!['dry_run','execute'].includes(mode)) throw new Error("mode must be dry_run or execute");
  if (["merge_into","match_existing"].includes(action) && !targetClientId) throw new Error("targetClientId is required for this action");

  const client = await pool.connect();
  try {
    const current = await client.query(
      `SELECT q.*, er.id AS external_record_id, er.external_id AS goldie_client_id, er.reconciliation_status,
              ecr.display_name, ecr.normalized_phone
       FROM client_reconciliation_queue q
       JOIN external_records er ON er.id=q.external_record_id
       JOIN external_client_records ecr ON ecr.external_record_id=er.id
       WHERE q.id=$1`, [queueId]
    );
    const row = current.rows[0];
    if (!row) throw new Error("Reconciliation case not found");
    if (row.status !== "needs_review") throw new Error("Case is no longer pending manual review");

    const plan = { queueId: String(queueId), goldieClientId: row.goldie_client_id, action, targetClientId: targetClientId ? String(targetClientId) : null, currentReason: row.reason };
    if (mode === "dry_run") return { mode, writesPerformed: false, executionConfirmationRequired: EXEC_CONFIRMATION, plan };
    if (confirmation !== EXEC_CONFIRMATION) { const e = new Error(`Execution requires confirmation value: ${EXEC_CONFIRMATION}`); e.code = "CONFIRMATION_REQUIRED"; throw e; }

    await client.query("BEGIN");
    if (action === "leave_unresolved") {
      await client.query(`UPDATE client_reconciliation_queue SET evidence=evidence || $2::jsonb WHERE id=$1`, [queueId, JSON.stringify({ manual_decision: "leave_unresolved", manual_decision_at: new Date().toISOString() })]);
    } else if (action === "keep_separate") {
      await client.query(`UPDATE client_reconciliation_queue SET status='create_new', resolution='manual_keep_separate', resolved_by=$2, resolved_at=NOW() WHERE id=$1`, [queueId, performedBy]);
      await client.query(`UPDATE external_records SET reconciliation_status='unmatched', match_method='manual_keep_separate', updated_at=NOW() WHERE id=$1`, [row.external_record_id]);
      await client.query(`INSERT INTO client_reconciliation_history (external_record_id, action, method, evidence, performed_by) VALUES ($1,'unmatched','manual_keep_separate',$2::jsonb,$3)`, [row.external_record_id, JSON.stringify({ queue_id: String(queueId), decision: "keep_separate" }), performedBy]);
    } else {
      const target = await client.query(`SELECT id FROM clients WHERE id=$1`, [targetClientId]);
      if (!target.rows.length) throw new Error("Target canonical client not found");
      const method = action === "match_existing" ? "manual_match_existing" : "manual_merge_into";
      await client.query(`UPDATE external_records SET shiloh_entity_type='client', shiloh_entity_id=$2, reconciliation_status='matched', match_method=$3, match_confidence=1.0, reconciled_at=NOW(), updated_at=NOW() WHERE id=$1`, [row.external_record_id, targetClientId, method]);
      await client.query(`UPDATE client_reconciliation_queue SET status='matched', resolution=$2, resolved_client_id=$3, resolved_by=$4, resolved_at=NOW(), candidate_score=1.0 WHERE id=$1`, [queueId, method, targetClientId, performedBy]);
      await client.query(`INSERT INTO client_reconciliation_history (external_record_id, client_id, action, method, confidence, evidence, performed_by) VALUES ($1,$2,'matched',$3,1.0,$4::jsonb,$5)`, [row.external_record_id, targetClientId, method, JSON.stringify({ queue_id: String(queueId), decision: action }), performedBy]);
    }
    await client.query("COMMIT");
    return { mode, writesPerformed: action !== "leave_unresolved", applied: true, plan };
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    throw error;
  } finally { client.release(); }
}

module.exports = { getManualQueue, decideManualCase, EXEC_CONFIRMATION };
