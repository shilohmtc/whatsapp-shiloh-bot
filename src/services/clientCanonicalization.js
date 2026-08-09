const { pool } = require("../db/pool");
const { getRecommendationReport } = require("./reconciliationRecommendations");

const APPROVED_EXISTING_MATCH = Object.freeze({
  goldieClientId: "df21510e-7a8a-41c2-896c-ba408030c253",
  canonicalClientId: "3",
  normalizedPhone: "27825600139",
  minimumConfidence: 0.95,
});

const EXECUTION_CONFIRMATION = "EXECUTE_HIGH_CONFIDENCE_CANONICALIZATION";

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function pickAuthoritativeRecord(records) {
  return [...records].sort((a, b) => {
    const aScore = (a.email ? 1000 : 0) + (a.displayName ? a.displayName.length : 0);
    const bScore = (b.email ? 1000 : 0) + (b.displayName ? b.displayName.length : 0);
    return bScore - aScore || String(a.goldieClientId).localeCompare(String(b.goldieClientId));
  })[0];
}

async function findCanonicalPhoneOwners(client, normalizedPhone) {
  if (!normalizedPhone) return [];
  const result = await client.query(
    `SELECT DISTINCT c.id, c.display_name, cc.contact_type
     FROM client_contacts cc
     JOIN clients c ON c.id=cc.client_id
     WHERE cc.normalized_value=$1
       AND cc.contact_type IN ('whatsapp','mobile')
     ORDER BY c.id`,
    [normalizedPhone]
  );
  return result.rows;
}

async function findEmailOwner(client, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const result = await client.query(
    `SELECT c.id, c.display_name
     FROM client_contacts cc
     JOIN clients c ON c.id=cc.client_id
     WHERE cc.contact_type='email' AND cc.normalized_value=$1
     LIMIT 1`,
    [normalized]
  );
  return result.rows[0] || null;
}

async function buildPlan(batchId) {
  if (!batchId) throw new Error("batchId is required");
  const report = await getRecommendationReport(String(batchId));
  const client = await pool.connect();
  try {
    const groups = [];
    for (const group of report.duplicatePhoneGroups.filter((item) => item.groupRecommendation === "high_confidence_duplicate_group")) {
      const owners = await findCanonicalPhoneOwners(client, group.normalizedPhone);
      const authoritative = pickAuthoritativeRecord(group.records);
      const emailOwner = await findEmailOwner(client, authoritative.email);
      const existingLinks = await client.query(
        `SELECT er.external_id, er.shiloh_entity_id, er.reconciliation_status
         FROM external_records er
         WHERE er.source='goldie' AND er.entity_type='client'
           AND er.external_id = ANY($1::text[])
         ORDER BY er.external_id`,
        [group.records.map((record) => record.goldieClientId)]
      );
      const linkedIds = [...new Set(existingLinks.rows.filter((row) => row.shiloh_entity_id).map((row) => String(row.shiloh_entity_id)))];

      let eligibility = "eligible_create_canonical";
      let blockReason = null;
      if (linkedIds.length === 1 && existingLinks.rows.length === group.records.length && existingLinks.rows.every((row) => row.reconciliation_status === "matched")) {
        eligibility = "already_applied";
      } else if (linkedIds.length > 0) {
        eligibility = "blocked";
        blockReason = "source_records_already_linked_or_partially_linked";
      } else if (owners.length > 0) {
        eligibility = "blocked";
        blockReason = "canonical_phone_collision";
      } else if (emailOwner) {
        eligibility = "blocked";
        blockReason = "canonical_email_collision";
      }

      groups.push({
        normalizedPhone: group.normalizedPhone,
        recordCount: group.recordCount,
        goldieClientIds: group.records.map((record) => record.goldieClientId),
        authoritativeRecord: authoritative,
        recommendation: group.groupRecommendation,
        minimumPairConfidence: Math.min(...group.comparisons.map((item) => item.confidence)),
        eligibility,
        blockReason,
        canonicalPhoneOwners: owners,
        canonicalEmailOwner: emailOwner,
        existingCanonicalLinks: linkedIds,
      });
    }

    const approved = report.existingClientCandidates.find((item) =>
      item.goldieClientId === APPROVED_EXISTING_MATCH.goldieClientId &&
      String(item.canonicalClientId) === APPROVED_EXISTING_MATCH.canonicalClientId &&
      item.normalizedPhone === APPROVED_EXISTING_MATCH.normalizedPhone &&
      item.recommendation === "probable_existing_client_match" &&
      Number(item.confidence) >= APPROVED_EXISTING_MATCH.minimumConfidence
    );

    let chenique = {
      goldieClientId: APPROVED_EXISTING_MATCH.goldieClientId,
      canonicalClientId: APPROVED_EXISTING_MATCH.canonicalClientId,
      eligibility: approved ? "eligible_match_existing" : "blocked",
      blockReason: approved ? null : "approved_match_no_longer_meets_guardrails",
      recommendation: approved || null,
    };

    const cheniqueState = await client.query(
      `SELECT reconciliation_status, shiloh_entity_id
       FROM external_records
       WHERE source='goldie' AND entity_type='client' AND external_id=$1`,
      [APPROVED_EXISTING_MATCH.goldieClientId]
    );
    if (cheniqueState.rows[0]?.reconciliation_status === "matched" && String(cheniqueState.rows[0]?.shiloh_entity_id) === APPROVED_EXISTING_MATCH.canonicalClientId) {
      chenique = { ...chenique, eligibility: "already_applied", blockReason: null };
    } else if (cheniqueState.rows[0]?.shiloh_entity_id && String(cheniqueState.rows[0].shiloh_entity_id) !== APPROVED_EXISTING_MATCH.canonicalClientId) {
      chenique = { ...chenique, eligibility: "blocked", blockReason: "source_record_linked_to_different_client" };
    }

    const counts = groups.reduce((acc, group) => {
      acc[group.eligibility] = (acc[group.eligibility] || 0) + 1;
      return acc;
    }, {});

    return {
      batchId: String(batchId),
      policy: {
        allowedDuplicateGroup: "high_confidence_duplicate_group",
        approvedExistingMatch: APPROVED_EXISTING_MATCH,
        probableDuplicatesAllowed: false,
        manualReviewAllowed: false,
        mixedSharedContactAllowed: false,
        bulkCreateAllowed: false,
      },
      summary: {
        recommendedHighConfidenceGroups: groups.length,
        ...counts,
        approvedExistingMatchEligibility: chenique.eligibility,
      },
      groups,
      approvedExistingMatch: chenique,
    };
  } finally {
    client.release();
  }
}

async function applyGroup(client, group, batchId) {
  const sourceRows = await client.query(
    `SELECT er.id AS external_record_id, er.external_id, ecr.display_name, ecr.email, ecr.phone,
            ecr.normalized_phone, ecr.secondary_phone, ecr.normalized_secondary_phone
     FROM external_records er
     JOIN external_client_records ecr ON ecr.external_record_id=er.id
     WHERE er.source='goldie' AND er.entity_type='client' AND er.import_batch_id=$1
       AND er.external_id = ANY($2::text[])
     FOR UPDATE OF er`,
    [batchId, group.goldieClientIds]
  );
  if (sourceRows.rows.length !== group.goldieClientIds.length) throw new Error(`Source record count changed for phone ${group.normalizedPhone}`);

  const owners = await findCanonicalPhoneOwners(client, group.normalizedPhone);
  if (owners.length) throw new Error(`Canonical phone collision appeared for ${group.normalizedPhone}`);

  const authoritative = sourceRows.rows.find((row) => row.external_id === group.authoritativeRecord.goldieClientId) || sourceRows.rows[0];
  const newClient = await client.query(
    `INSERT INTO clients (display_name, source, custom_attributes)
     VALUES ($1, 'goldie_import', $2::jsonb)
     RETURNING id, display_name`,
    [authoritative.display_name || null, JSON.stringify({ goldie_import_batch_id: String(batchId) })]
  );
  const clientId = newClient.rows[0].id;

  if (authoritative.phone && authoritative.normalized_phone) {
    await client.query(
      `INSERT INTO client_contacts (client_id, contact_type, value, normalized_value, is_primary)
       VALUES ($1,'mobile',$2,$3,TRUE)`,
      [clientId, authoritative.phone, authoritative.normalized_phone]
    );
  }

  const emails = [...new Set(sourceRows.rows.map((row) => normalizeEmail(row.email)).filter(Boolean))];
  for (const email of emails) {
    const owner = await findEmailOwner(client, email);
    if (owner) throw new Error(`Canonical email collision appeared for ${email}`);
    const original = sourceRows.rows.find((row) => normalizeEmail(row.email) === email)?.email || email;
    await client.query(
      `INSERT INTO client_contacts (client_id, contact_type, value, normalized_value, is_primary)
       VALUES ($1,'email',$2,$3,$4)`,
      [clientId, original, email, emails.indexOf(email) === 0]
    );
  }

  const secondaryPhones = [...new Map(sourceRows.rows
    .filter((row) => row.secondary_phone && row.normalized_secondary_phone && row.normalized_secondary_phone !== group.normalizedPhone)
    .map((row) => [row.normalized_secondary_phone, row.secondary_phone])).entries()];
  for (const [normalized, value] of secondaryPhones) {
    const secondaryOwners = await findCanonicalPhoneOwners(client, normalized);
    if (!secondaryOwners.length) {
      await client.query(
        `INSERT INTO client_contacts (client_id, contact_type, value, normalized_value, is_primary)
         VALUES ($1,'other',$2,$3,FALSE)
         ON CONFLICT (contact_type, normalized_value) DO NOTHING`,
        [clientId, value, normalized]
      );
    }
  }

  for (const row of sourceRows.rows) {
    const evidence = {
      canonicalization_policy: "high_confidence_duplicate_group_only",
      normalized_phone: group.normalizedPhone,
      group_goldie_client_ids: group.goldieClientIds,
      authoritative_goldie_client_id: authoritative.external_id,
      minimum_pair_confidence: group.minimumPairConfidence,
    };
    await client.query(
      `UPDATE external_records SET
         shiloh_entity_type='client', shiloh_entity_id=$2, reconciliation_status='matched',
         match_method='high_confidence_duplicate_group_canonicalization', match_confidence=$3,
         reconciled_at=NOW(), updated_at=NOW()
       WHERE id=$1`,
      [row.external_record_id, clientId, group.minimumPairConfidence]
    );
    await client.query(
      `UPDATE client_reconciliation_queue SET
         status='matched', resolution='canonicalized_high_confidence_duplicate_group',
         resolved_client_id=$2, resolved_by='system:controlled_canonicalization', resolved_at=NOW(),
         candidate_score=$3, evidence=evidence || $4::jsonb
       WHERE external_record_id=$1`,
      [row.external_record_id, clientId, group.minimumPairConfidence, JSON.stringify(evidence)]
    );
    await client.query(
      `INSERT INTO client_reconciliation_history
         (external_record_id, client_id, action, method, confidence, evidence, performed_by)
       VALUES ($1,$2,'created','high_confidence_duplicate_group_canonicalization',$3,$4::jsonb,'system:controlled_canonicalization')`,
      [row.external_record_id, clientId, group.minimumPairConfidence, JSON.stringify(evidence)]
    );
  }
  return { clientId: String(clientId), displayName: newClient.rows[0].display_name, goldieClientIds: group.goldieClientIds };
}

async function applyChenique(client, batchId) {
  const rowResult = await client.query(
    `SELECT er.id AS external_record_id, er.shiloh_entity_id, er.reconciliation_status, q.id AS queue_id
     FROM external_records er
     JOIN client_reconciliation_queue q ON q.external_record_id=er.id
     WHERE er.source='goldie' AND er.entity_type='client' AND er.import_batch_id=$1 AND er.external_id=$2
     FOR UPDATE OF er, q`,
    [batchId, APPROVED_EXISTING_MATCH.goldieClientId]
  );
  const row = rowResult.rows[0];
  if (!row) throw new Error("Approved Chenique source record was not found in this batch");
  if (row.reconciliation_status === "matched" && String(row.shiloh_entity_id) === APPROVED_EXISTING_MATCH.canonicalClientId) {
    return { alreadyApplied: true, clientId: APPROVED_EXISTING_MATCH.canonicalClientId };
  }
  if (row.shiloh_entity_id && String(row.shiloh_entity_id) !== APPROVED_EXISTING_MATCH.canonicalClientId) throw new Error("Approved Chenique source record is linked to a different client");

  const target = await client.query("SELECT id FROM clients WHERE id=$1", [APPROVED_EXISTING_MATCH.canonicalClientId]);
  if (!target.rows.length) throw new Error("Approved Chenique canonical client no longer exists");

  const evidence = {
    canonicalization_policy: "explicit_approved_existing_match",
    goldie_client_id: APPROVED_EXISTING_MATCH.goldieClientId,
    expected_normalized_phone: APPROVED_EXISTING_MATCH.normalizedPhone,
    approval: "user_approved_in_shiloh_os_migration_workflow",
  };
  await client.query(
    `UPDATE external_records SET shiloh_entity_type='client', shiloh_entity_id=$2,
       reconciliation_status='matched', match_method='approved_existing_client_match', match_confidence=0.95,
       reconciled_at=NOW(), updated_at=NOW() WHERE id=$1`,
    [row.external_record_id, APPROVED_EXISTING_MATCH.canonicalClientId]
  );
  await client.query(
    `UPDATE client_reconciliation_queue SET status='matched', resolution='approved_existing_client_match',
       resolved_client_id=$2, resolved_by='system:controlled_canonicalization', resolved_at=NOW(),
       candidate_score=0.95, evidence=evidence || $3::jsonb WHERE external_record_id=$1`,
    [row.external_record_id, APPROVED_EXISTING_MATCH.canonicalClientId, JSON.stringify(evidence)]
  );
  await client.query(
    `INSERT INTO client_reconciliation_history
       (external_record_id, client_id, action, method, confidence, evidence, performed_by)
     VALUES ($1,$2,'matched','approved_existing_client_match',0.95,$3::jsonb,'system:controlled_canonicalization')`,
    [row.external_record_id, APPROVED_EXISTING_MATCH.canonicalClientId, JSON.stringify(evidence)]
  );
  return { alreadyApplied: false, clientId: APPROVED_EXISTING_MATCH.canonicalClientId };
}

async function canonicalizeClients({ batchId, mode = "dry_run", confirmation }) {
  if (!batchId) throw new Error("batchId is required");
  if (!['dry_run', 'execute'].includes(mode)) throw new Error("mode must be dry_run or execute");
  const plan = await buildPlan(batchId);
  if (mode === "dry_run") {
    return {
      mode: "dry_run",
      writesPerformed: false,
      executionConfirmationRequired: EXECUTION_CONFIRMATION,
      plan,
    };
  }
  if (confirmation !== EXECUTION_CONFIRMATION) {
    const error = new Error(`Execution requires confirmation value: ${EXECUTION_CONFIRMATION}`);
    error.code = "CONFIRMATION_REQUIRED";
    throw error;
  }

  const eligibleGroups = plan.groups.filter((group) => group.eligibility === "eligible_create_canonical");
  const blockedGroups = plan.groups.filter((group) => group.eligibility === "blocked");
  if (plan.approvedExistingMatch.eligibility === "blocked") {
    const error = new Error("Execution blocked because the approved Chenique match no longer satisfies guardrails");
    error.code = "PLAN_BLOCKED";
    error.plan = plan;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const created = [];
    for (const group of eligibleGroups) created.push(await applyGroup(client, group, String(batchId)));
    const chenique = plan.approvedExistingMatch.eligibility === "eligible_match_existing"
      ? await applyChenique(client, String(batchId))
      : { alreadyApplied: true, clientId: APPROVED_EXISTING_MATCH.canonicalClientId };
    await client.query("COMMIT");
    return {
      mode: "execute",
      writesPerformed: created.length > 0 || !chenique.alreadyApplied,
      safetyPolicy: plan.policy,
      createdCanonicalClients: created.length,
      created,
      approvedExistingMatch: chenique,
      skippedBlockedGroups: blockedGroups.map((group) => ({
        normalizedPhone: group.normalizedPhone,
        goldieClientIds: group.goldieClientIds,
        blockReason: group.blockReason,
        canonicalPhoneOwners: group.canonicalPhoneOwners,
        canonicalEmailOwner: group.canonicalEmailOwner,
      })),
      skippedAlreadyAppliedGroups: plan.groups.filter((group) => group.eligibility === "already_applied").length,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  canonicalizeClients,
  buildPlan,
  EXECUTION_CONFIRMATION,
};