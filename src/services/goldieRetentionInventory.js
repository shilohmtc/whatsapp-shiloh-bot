const { pool } = require('../db/pool');

function countValue(result) {
  return Number(result?.rows?.[0]?.count || 0);
}

function category({ key, label, personalInformation, count, retentionState, purpose, blocker = null }) {
  return {
    key,
    label,
    personalInformation,
    count: Number(count || 0),
    retentionState,
    purpose,
    ...(blocker ? { blocker } : {}),
  };
}

function buildGoldieRetentionClassification(inventory = {}) {
  const rawPayloadCount = Number(inventory.externalClientSourcePayloads || 0)
    + Number(inventory.externalAppointmentSourcePayloads || 0);
  const provenanceCount = Number(inventory.reconciliationQueueRecords || 0)
    + Number(inventory.reconciliationHistoryRecords || 0);

  return {
    mode: 'classification_only',
    executionReady: false,
    destructiveActionAllowed: false,
    categories: [
      category({
        key: 'raw_client_staging',
        label: 'Goldie raw client staging',
        personalInformation: true,
        count: inventory.externalClientRecords,
        retentionState: 'policy_decision_required',
        purpose: 'Historical migration and identity reconciliation staging.',
        blocker: 'Approved retention/legal basis is not yet established.',
      }),
      category({
        key: 'raw_source_payloads',
        label: 'Goldie raw source payload copies',
        personalInformation: true,
        count: rawPayloadCount,
        retentionState: 'policy_decision_required',
        purpose: 'Source replay, migration verification and reconciliation evidence.',
        blocker: 'Raw duplicated source content must not be declared erasable or retainable indefinitely without policy authority.',
      }),
      category({
        key: 'reconciliation_provenance',
        label: 'Goldie reconciliation provenance',
        personalInformation: true,
        count: provenanceCount,
        retentionState: 'retain_pending_legal_basis',
        purpose: 'Evidence of how external identities were matched, held, ignored or linked to canonical CRM records.',
        blocker: 'Final retention period/legal basis remains an owner/legal-policy decision.',
      }),
      category({
        key: 'import_batch_metadata',
        label: 'Goldie import batch metadata',
        personalInformation: false,
        count: inventory.importBatches,
        retentionState: 'retain_operational_provenance',
        purpose: 'Checksums, source-file provenance, import status and aggregate migration metadata.',
      }),
      category({
        key: 'service_catalogue_history',
        label: 'Historical Goldie service catalogue',
        personalInformation: false,
        count: inventory.historicalServiceRecords,
        retentionState: 'retain_non_personal_operational_history',
        purpose: 'Inactive historical treatment/service reconciliation and appointment interpretation.',
      }),
      category({
        key: 'public_business_knowledge_snapshot',
        label: 'Historical Goldie public business knowledge snapshot',
        personalInformation: false,
        count: inventory.goldieKnowledgeDocuments,
        retentionState: 'retain_public_business_reference',
        purpose: 'Historical public-facing business/service knowledge reference.',
      }),
      category({
        key: 'future_import_environment_payload',
        label: 'Goldie future-import environment payload',
        personalInformation: true,
        count: inventory.futurePayloadConfigured ? 1 : 0,
        retentionState: inventory.futurePayloadConfigured ? 'policy_decision_required' : 'not_configured',
        purpose: 'Replay/reconciliation baseline for historical future appointments.',
        ...(inventory.futurePayloadConfigured
          ? { blocker: 'Payload presence is reported only as a boolean; contents are intentionally never decoded by this inventory.' }
          : {}),
      }),
    ],
  };
}

async function getGoldieRetentionInventory({ db = pool, env = process.env } = {}) {
  try {
    const importBatches = countValue(await db.query(
      `SELECT COUNT(*)::int AS count FROM import_batches WHERE source = 'goldie'`
    ));
    const externalClientRecords = countValue(await db.query(
      `SELECT COUNT(*)::int AS count
         FROM external_client_records ecr
         JOIN external_records er ON er.id = ecr.external_record_id
        WHERE er.source = 'goldie'`
    ));
    const externalClientSourcePayloads = countValue(await db.query(
      `SELECT COUNT(*)::int AS count
         FROM external_records
        WHERE source = 'goldie'
          AND entity_type = 'client'
          AND source_payload <> '{}'::jsonb`
    ));
    const externalAppointmentSourcePayloads = countValue(await db.query(
      `SELECT COUNT(*)::int AS count
         FROM external_records
        WHERE source = 'goldie'
          AND entity_type = 'appointment'
          AND source_payload <> '{}'::jsonb`
    ));
    const reconciliationQueueRecords = countValue(await db.query(
      `SELECT COUNT(*)::int AS count
         FROM client_reconciliation_queue q
         JOIN external_records er ON er.id = q.external_record_id
        WHERE er.source = 'goldie'`
    ));
    const reconciliationHistoryRecords = countValue(await db.query(
      `SELECT COUNT(*)::int AS count
         FROM client_reconciliation_history h
         JOIN external_records er ON er.id = h.external_record_id
        WHERE er.source = 'goldie'`
    ));
    const goldieKnowledgeDocuments = countValue(await db.query(
      `SELECT COUNT(*)::int AS count
         FROM documents
        WHERE source = 'goldie:shiloh-booking-page'`
    ));
    const historicalServiceRecords = countValue(await db.query(
      `SELECT COUNT(*)::int AS count
         FROM services
        WHERE external_source = 'goldie_historical'`
    ));

    const inventory = {
      importBatches,
      externalClientRecords,
      externalClientSourcePayloads,
      externalAppointmentSourcePayloads,
      reconciliationQueueRecords,
      reconciliationHistoryRecords,
      goldieKnowledgeDocuments,
      historicalServiceRecords,
      futurePayloadConfigured: Boolean(env?.GOLDIE_FUTURE_IMPORT_PAYLOAD_B64),
    };

    return {
      mode: 'read_only',
      writesPerformed: false,
      inventoryAvailable: true,
      executionReady: false,
      destructiveActionAllowed: false,
      inventory,
      classification: buildGoldieRetentionClassification(inventory),
    };
  } catch (error) {
    return {
      mode: 'read_only',
      writesPerformed: false,
      inventoryAvailable: false,
      reason: 'historical_retention_inventory_unavailable',
      errorCode: error?.code || null,
      executionReady: false,
      destructiveActionAllowed: false,
    };
  }
}

module.exports = {
  buildGoldieRetentionClassification,
  getGoldieRetentionInventory,
};
