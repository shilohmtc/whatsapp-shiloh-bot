const { pool } = require("../db/pool");

const APPROVED_CHENIQUE = {
  goldieClientId: "df21510e-7a8a-41c2-896c-ba408030c253",
  canonicalClientId: "3",
};

const BLOCKED_PHONE = "27725128605";

async function getPostCanonicalizationAudit(batchId) {
  if (!batchId) throw new Error("batchId is required");

  const client = await pool.connect();
  try {
    const [
      clientCounts,
      linkedCounts,
      historyCounts,
      partialLinks,
      duplicateContacts,
      chenique,
      blockedGroup,
      queueCounts,
    ] = await Promise.all([
      client.query(`
        SELECT
          COUNT(*)::int AS total_clients,
          COUNT(*) FILTER (WHERE source='goldie_import')::int AS goldie_import_clients,
          COUNT(*) FILTER (WHERE source='legacy_user_profile')::int AS legacy_profile_clients
        FROM clients
      `),
      client.query(`
        SELECT
          COUNT(*)::int AS total_external_clients,
          COUNT(*) FILTER (WHERE reconciliation_status='matched')::int AS matched_external_clients,
          COUNT(*) FILTER (WHERE reconciliation_status='matched' AND shiloh_entity_type='client' AND shiloh_entity_id IS NOT NULL)::int AS valid_client_links,
          COUNT(*) FILTER (WHERE reconciliation_status='matched' AND (shiloh_entity_type IS DISTINCT FROM 'client' OR shiloh_entity_id IS NULL))::int AS invalid_matched_links
        FROM external_records
        WHERE source='goldie' AND entity_type='client' AND import_batch_id=$1
      `, [batchId]),
      client.query(`
        SELECT action, method, COUNT(*)::int AS count
        FROM client_reconciliation_history h
        JOIN external_records er ON er.id=h.external_record_id
        WHERE er.source='goldie' AND er.entity_type='client' AND er.import_batch_id=$1
        GROUP BY action, method
        ORDER BY action, method
      `, [batchId]),
      client.query(`
        SELECT er.external_id, er.reconciliation_status, er.shiloh_entity_type, er.shiloh_entity_id,
               q.status AS queue_status, q.resolved_client_id
        FROM external_records er
        LEFT JOIN client_reconciliation_queue q ON q.external_record_id=er.id
        WHERE er.source='goldie' AND er.entity_type='client' AND er.import_batch_id=$1
          AND (
            (er.reconciliation_status='matched' AND (er.shiloh_entity_type IS DISTINCT FROM 'client' OR er.shiloh_entity_id IS NULL))
            OR (q.status='matched' AND q.resolved_client_id IS NULL)
            OR (er.shiloh_entity_id IS NOT NULL AND q.resolved_client_id IS NOT NULL AND er.shiloh_entity_id<>q.resolved_client_id)
          )
        ORDER BY er.external_id
      `, [batchId]),
      client.query(`
        SELECT contact_type, normalized_value, COUNT(*)::int AS owner_count,
               ARRAY_AGG(client_id ORDER BY client_id) AS client_ids
        FROM client_contacts
        GROUP BY contact_type, normalized_value
        HAVING COUNT(*)>1
        ORDER BY contact_type, normalized_value
      `),
      client.query(`
        SELECT er.external_id, er.reconciliation_status, er.shiloh_entity_type, er.shiloh_entity_id,
               q.status AS queue_status, q.resolved_client_id, q.resolution,
               c.display_name AS canonical_name
        FROM external_records er
        LEFT JOIN client_reconciliation_queue q ON q.external_record_id=er.id
        LEFT JOIN clients c ON c.id=er.shiloh_entity_id
        WHERE er.source='goldie' AND er.entity_type='client' AND er.import_batch_id=$1 AND er.external_id=$2
      `, [batchId, APPROVED_CHENIQUE.goldieClientId]),
      client.query(`
        SELECT er.external_id, ecr.display_name, ecr.normalized_phone,
               er.reconciliation_status, er.shiloh_entity_id,
               q.status AS queue_status, q.resolved_client_id
        FROM external_records er
        JOIN external_client_records ecr ON ecr.external_record_id=er.id
        LEFT JOIN client_reconciliation_queue q ON q.external_record_id=er.id
        WHERE er.source='goldie' AND er.entity_type='client' AND er.import_batch_id=$1
          AND ecr.normalized_phone=$2
        ORDER BY er.external_id
      `, [batchId, BLOCKED_PHONE]),
      client.query(`
        SELECT status, COUNT(*)::int AS count
        FROM client_reconciliation_queue q
        JOIN external_records er ON er.id=q.external_record_id
        WHERE er.source='goldie' AND er.entity_type='client' AND er.import_batch_id=$1
        GROUP BY status
        ORDER BY status
      `, [batchId]),
    ]);

    const cheniqueRow = chenique.rows[0] || null;
    const cheniquePass = Boolean(
      cheniqueRow &&
      cheniqueRow.reconciliation_status === 'matched' &&
      cheniqueRow.shiloh_entity_type === 'client' &&
      String(cheniqueRow.shiloh_entity_id) === APPROVED_CHENIQUE.canonicalClientId &&
      cheniqueRow.queue_status === 'matched' &&
      String(cheniqueRow.resolved_client_id) === APPROVED_CHENIQUE.canonicalClientId
    );

    const blockedUntouched = blockedGroup.rows.length === 2 && blockedGroup.rows.every((row) =>
      row.reconciliation_status !== 'matched' && row.shiloh_entity_id == null && row.resolved_client_id == null
    );

    const matched = Number(linkedCounts.rows[0]?.matched_external_clients || 0);
    const valid = Number(linkedCounts.rows[0]?.valid_client_links || 0);
    const invalid = Number(linkedCounts.rows[0]?.invalid_matched_links || 0);
    const duplicateCanonicalContacts = duplicateContacts.rows.length;
    const partialLinkCount = partialLinks.rows.length;

    const checks = {
      noInvalidMatchedLinks: invalid === 0,
      noPartialOrMismatchedLinks: partialLinkCount === 0,
      noDuplicateCanonicalContacts: duplicateCanonicalContacts === 0,
      cheniqueLinkedToClient3: cheniquePass,
      blockedChristelPhoneGroupUntouched: blockedUntouched,
      matchedLinkCountsConsistent: matched === valid,
    };

    return {
      safety: {
        mode: 'read_only_audit',
        writesPerformed: false,
      },
      batchId: String(batchId),
      overallPass: Object.values(checks).every(Boolean),
      checks,
      counts: {
        clients: clientCounts.rows[0],
        externalLinks: linkedCounts.rows[0],
        queueByStatus: queueCounts.rows,
      },
      reconciliationHistory: historyCounts.rows,
      anomalies: {
        partialOrMismatchedLinks: partialLinks.rows,
        duplicateCanonicalContacts: duplicateContacts.rows,
      },
      approvedCheniqueMatch: cheniqueRow,
      blockedChristelPhoneGroup: {
        normalizedPhone: BLOCKED_PHONE,
        untouched: blockedUntouched,
        records: blockedGroup.rows,
      },
    };
  } finally {
    client.release();
  }
}

module.exports = { getPostCanonicalizationAudit };
