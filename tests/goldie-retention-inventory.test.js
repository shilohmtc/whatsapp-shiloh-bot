const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  buildGoldieRetentionClassification,
  getGoldieRetentionInventory,
} = require('../src/services/goldieRetentionInventory');

test('Goldie retention classification separates raw personal staging from audit provenance and non-personal catalogue history', () => {
  const classification = buildGoldieRetentionClassification({
    importBatches: 2,
    externalClientRecords: 975,
    externalClientSourcePayloads: 975,
    externalAppointmentSourcePayloads: 40,
    reconciliationQueueRecords: 975,
    reconciliationHistoryRecords: 975,
    goldieKnowledgeDocuments: 1,
    futurePayloadConfigured: true,
  });

  const byKey = Object.fromEntries(classification.categories.map((item) => [item.key, item]));

  assert.equal(byKey.raw_client_staging.personalInformation, true);
  assert.equal(byKey.raw_client_staging.retentionState, 'policy_decision_required');
  assert.equal(byKey.raw_source_payloads.personalInformation, true);
  assert.equal(byKey.raw_source_payloads.retentionState, 'policy_decision_required');
  assert.equal(byKey.reconciliation_provenance.retentionState, 'retain_pending_legal_basis');
  assert.equal(byKey.service_catalogue_history.personalInformation, false);
  assert.equal(byKey.service_catalogue_history.retentionState, 'retain_non_personal_operational_history');
  assert.equal(byKey.future_import_environment_payload.retentionState, 'policy_decision_required');
  assert.equal(classification.destructiveActionAllowed, false);
  assert.equal(classification.executionReady, false);
});

test('read-only inventory returns sanitized counts and configuration presence without source values or payloads', async () => {
  const queries = [];
  const fakeDb = {
    async query(sql) {
      queries.push(sql);
      if (sql.includes("FROM import_batches")) return { rows: [{ count: 2 }] };
      if (sql.includes("FROM external_client_records")) return { rows: [{ count: 975 }] };
      if (sql.includes("entity_type = 'client'")) return { rows: [{ count: 975 }] };
      if (sql.includes("entity_type = 'appointment'")) return { rows: [{ count: 40 }] };
      if (sql.includes("FROM client_reconciliation_queue")) return { rows: [{ count: 975 }] };
      if (sql.includes("FROM client_reconciliation_history")) return { rows: [{ count: 975 }] };
      if (sql.includes("FROM knowledge_documents")) return { rows: [{ count: 1 }] };
      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  const result = await getGoldieRetentionInventory({
    db: fakeDb,
    env: { GOLDIE_FUTURE_IMPORT_PAYLOAD_B64: 'present-but-never-returned' },
  });

  assert.equal(result.mode, 'read_only');
  assert.equal(result.writesPerformed, false);
  assert.equal(result.destructiveActionAllowed, false);
  assert.equal(result.executionReady, false);
  assert.equal(result.inventory.externalClientRecords, 975);
  assert.equal(result.inventory.futurePayloadConfigured, true);
  assert.doesNotMatch(JSON.stringify(result), /present-but-never-returned/);
  assert.equal(queries.some((sql) => /INSERT|UPDATE|DELETE/i.test(sql)), false);
});

test('missing historical tables fail closed as unavailable rather than inventing zero counts', async () => {
  const fakeDb = {
    async query() {
      const error = new Error('relation does not exist');
      error.code = '42P01';
      throw error;
    },
  };

  const result = await getGoldieRetentionInventory({ db: fakeDb, env: {} });
  assert.equal(result.mode, 'read_only');
  assert.equal(result.inventoryAvailable, false);
  assert.equal(result.executionReady, false);
  assert.equal(result.destructiveActionAllowed, false);
  assert.equal(result.reason, 'historical_retention_inventory_unavailable');
});

test('retention inventory source contains no mutation statements and never decodes the future Goldie payload', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../src/services/goldieRetentionInventory.js'),
    'utf8'
  );

  assert.doesNotMatch(source, /INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM/i);
  assert.doesNotMatch(source, /Buffer\.from|gunzip|JSON\.parse\s*\(.*GOLDIE_FUTURE_IMPORT_PAYLOAD_B64/i);
  assert.doesNotMatch(source, /source_payload\s*(?:,|FROM|AS)/i);
});
