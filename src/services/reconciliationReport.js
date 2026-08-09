const { pool } = require("../db/pool");

async function getReconciliationSummary(batchId) {
  const params = [];
  let batchFilter = "";
  if (batchId) {
    params.push(batchId);
    batchFilter = `AND er.import_batch_id = $${params.length}`;
  }

  const summary = await pool.query(
    `SELECT
       q.status,
       q.reason,
       COUNT(*)::int AS count
     FROM client_reconciliation_queue q
     JOIN external_records er ON er.id = q.external_record_id
     WHERE er.source = 'goldie' AND er.entity_type = 'client'
       ${batchFilter}
     GROUP BY q.status, q.reason
     ORDER BY q.status, count DESC, q.reason`,
    params
  );

  const batchStats = await pool.query(
    `SELECT
       ib.id,
       ib.source_file,
       ib.source_exported_at,
       ib.checksum,
       ib.status,
       ib.metadata,
       ib.created_at,
       ib.completed_at,
       COUNT(er.id)::int AS staged_records
     FROM import_batches ib
     LEFT JOIN external_records er ON er.import_batch_id = ib.id
     WHERE ib.source = 'goldie'
       ${batchId ? `AND ib.id = $1` : ""}
     GROUP BY ib.id
     ORDER BY ib.id DESC`,
    batchId ? [batchId] : []
  );

  const phoneGroups = await pool.query(
    `SELECT
       ecr.normalized_phone,
       COUNT(*)::int AS record_count,
       ARRAY_AGG(ecr.external_client_id ORDER BY ecr.external_client_id) AS external_client_ids,
       ARRAY_AGG(COALESCE(ecr.display_name, '') ORDER BY ecr.external_client_id) AS names
     FROM external_client_records ecr
     JOIN external_records er ON er.id = ecr.external_record_id
     WHERE er.source = 'goldie' AND er.entity_type = 'client'
       AND ecr.normalized_phone IS NOT NULL AND ecr.normalized_phone <> ''
       ${batchFilter}
     GROUP BY ecr.normalized_phone
     HAVING COUNT(*) > 1
     ORDER BY record_count DESC, ecr.normalized_phone
     LIMIT 100`,
    params
  );

  return {
    batches: batchStats.rows,
    breakdown: summary.rows,
    duplicatePhoneGroups: phoneGroups.rows,
  };
}

async function listReconciliationCases({ batchId, status, reason, limit = 100, offset = 0 }) {
  const params = [];
  const where = ["er.source = 'goldie'", "er.entity_type = 'client'"];
  if (batchId) {
    params.push(batchId);
    where.push(`er.import_batch_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`q.status = $${params.length}`);
  }
  if (reason) {
    params.push(reason);
    where.push(`q.reason = $${params.length}`);
  }
  params.push(Math.min(Math.max(Number(limit) || 100, 1), 500));
  const limitParam = `$${params.length}`;
  params.push(Math.max(Number(offset) || 0, 0));
  const offsetParam = `$${params.length}`;

  const result = await pool.query(
    `SELECT
       q.id AS queue_id,
       er.import_batch_id,
       er.external_id AS goldie_client_id,
       er.reconciliation_status,
       q.status,
       q.reason,
       q.candidate_score,
       q.candidate_client_id,
       q.resolved_client_id,
       ecr.display_name,
       ecr.email,
       ecr.phone,
       ecr.normalized_phone,
       ecr.secondary_phone,
       ecr.address,
       ecr.is_blocked,
       q.evidence,
       cl.display_name AS candidate_client_name,
       q.created_at,
       q.resolved_at
     FROM client_reconciliation_queue q
     JOIN external_records er ON er.id = q.external_record_id
     JOIN external_client_records ecr ON ecr.external_record_id = er.id
     LEFT JOIN clients cl ON cl.id = q.candidate_client_id
     WHERE ${where.join(" AND ")}
     ORDER BY q.status, q.reason, ecr.display_name NULLS LAST, er.external_id
     LIMIT ${limitParam} OFFSET ${offsetParam}`,
    params
  );

  return result.rows;
}

async function getReconciliationCase(queueId) {
  const result = await pool.query(
    `SELECT
       q.*,
       er.import_batch_id,
       er.external_id AS goldie_client_id,
       er.reconciliation_status,
       er.source_payload,
       ecr.display_name,
       ecr.email,
       ecr.phone,
       ecr.normalized_phone,
       ecr.secondary_phone,
       ecr.normalized_secondary_phone,
       ecr.address,
       ecr.notes,
       ecr.has_photo,
       ecr.is_blocked,
       cl.display_name AS candidate_client_name,
       cl.status AS candidate_client_status,
       COALESCE(
         (SELECT jsonb_agg(jsonb_build_object(
           'contactType', cc.contact_type,
           'value', cc.value,
           'normalizedValue', cc.normalized_value,
           'isPrimary', cc.is_primary
         ) ORDER BY cc.id)
          FROM client_contacts cc
          WHERE cc.client_id = q.candidate_client_id),
         '[]'::jsonb
       ) AS candidate_contacts,
       COALESCE(
         (SELECT jsonb_agg(jsonb_build_object(
           'action', h.action,
           'method', h.method,
           'confidence', h.confidence,
           'performedBy', h.performed_by,
           'createdAt', h.created_at
         ) ORDER BY h.created_at)
          FROM client_reconciliation_history h
          WHERE h.external_record_id = q.external_record_id),
         '[]'::jsonb
       ) AS history
     FROM client_reconciliation_queue q
     JOIN external_records er ON er.id = q.external_record_id
     JOIN external_client_records ecr ON ecr.external_record_id = er.id
     LEFT JOIN clients cl ON cl.id = q.candidate_client_id
     WHERE q.id = $1`,
    [queueId]
  );

  return result.rows[0] || null;
}

module.exports = {
  getReconciliationSummary,
  listReconciliationCases,
  getReconciliationCase,
};
