const crypto = require("crypto");
const { pool } = require("../db/pool");

const REQUIRED_COLUMNS = ["Id", "Name", "Email", "Phone Number", "Notes", "Has Photo", "Is Blocked", "Secondary Phone", "Address"];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = "";
    } else if (ch === '\n') {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  if (!rows.length) return [];
  rows[0][0] = String(rows[0][0] || "").replace(/^\uFEFF/, "");
  const headers = rows[0];
  return rows.slice(1).filter((values) => values.some((v) => String(v).trim() !== "")).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function unwrapExcelValue(value = "") {
  const trimmed = String(value).trim();
  const match = trimmed.match(/^="(.*)"$/s);
  return match ? match[1] : trimmed;
}

function normalizePhone(value = "") {
  return unwrapExcelValue(value).replace(/\D/g, "");
}

function boolValue(value) {
  return String(value).trim().toLowerCase() === "true";
}

async function stageGoldieClients(buffer, filename = "Clients.csv") {
  const raw = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(raw);
  if (!rows.length) throw new Error("Clients CSV is empty");

  const missing = REQUIRED_COLUMNS.filter((column) => !(column in rows[0]));
  if (missing.length) throw new Error(`Clients CSV is missing columns: ${missing.join(", ")}`);

  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
  const phoneCounts = new Map();
  for (const row of rows) {
    const phone = normalizePhone(row["Phone Number"]);
    if (phone) phoneCounts.set(phone, (phoneCounts.get(phone) || 0) + 1);
  }

  const duplicatePhoneGroups = [...phoneCounts.values()].filter((count) => count > 1).length;
  const recordsInDuplicateGroups = [...phoneCounts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count, 0);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const batchResult = await client.query(
      `INSERT INTO import_batches (source, source_file, source_exported_at, checksum, status, metadata)
       VALUES ('goldie', $1, $2, $3, 'processing', $4::jsonb)
       RETURNING id`,
      [filename, "2026-08-09T00:00:00+02:00", checksum, JSON.stringify({
        record_count: rows.length,
        unique_primary_phone_count: phoneCounts.size,
        duplicate_primary_phone_groups: duplicatePhoneGroups,
        records_in_duplicate_primary_phone_groups: recordsInDuplicateGroups,
      })]
    );
    const batchId = batchResult.rows[0].id;

    for (const row of rows) {
      const externalId = String(row.Id || "").trim();
      if (!externalId) throw new Error("Goldie client row is missing Id");
      const phone = unwrapExcelValue(row["Phone Number"]);
      const secondaryPhone = unwrapExcelValue(row["Secondary Phone"]);
      const sourcePayload = {
        name: row.Name || null,
        email: row.Email || null,
        phone: phone || null,
        secondary_phone: secondaryPhone || null,
        address: row.Address || null,
        notes: row.Notes || null,
        has_photo: boolValue(row["Has Photo"]),
        is_blocked: boolValue(row["Is Blocked"]),
      };

      const externalResult = await client.query(
        `INSERT INTO external_records (
           import_batch_id, source, entity_type, external_id, reconciliation_status, source_payload
         ) VALUES ($1, 'goldie', 'client', $2, 'unmatched', $3::jsonb)
         ON CONFLICT (source, entity_type, external_id) DO UPDATE SET
           import_batch_id = EXCLUDED.import_batch_id,
           source_payload = EXCLUDED.source_payload,
           updated_at = NOW()
         RETURNING id`,
        [batchId, externalId, JSON.stringify(sourcePayload)]
      );
      const externalRecordId = externalResult.rows[0].id;

      await client.query(
        `INSERT INTO external_client_records (
           external_record_id, external_client_id, display_name, email, phone, normalized_phone,
           secondary_phone, normalized_secondary_phone, address, notes, has_photo, is_blocked, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
         ON CONFLICT (external_record_id) DO UPDATE SET
           display_name=EXCLUDED.display_name, email=EXCLUDED.email, phone=EXCLUDED.phone,
           normalized_phone=EXCLUDED.normalized_phone, secondary_phone=EXCLUDED.secondary_phone,
           normalized_secondary_phone=EXCLUDED.normalized_secondary_phone, address=EXCLUDED.address,
           notes=EXCLUDED.notes, has_photo=EXCLUDED.has_photo, is_blocked=EXCLUDED.is_blocked, updated_at=NOW()`,
        [externalRecordId, externalId, row.Name || null, row.Email || null, phone || null, normalizePhone(phone) || null,
          secondaryPhone || null, normalizePhone(secondaryPhone) || null, row.Address || null, row.Notes || null,
          boolValue(row["Has Photo"]), boolValue(row["Is Blocked"])]
      );
    }

    await client.query(
      `WITH source_counts AS (
         SELECT ecr.normalized_phone, COUNT(*) AS source_count
         FROM external_client_records ecr
         JOIN external_records er ON er.id=ecr.external_record_id
         WHERE er.import_batch_id=$1 AND ecr.normalized_phone IS NOT NULL AND ecr.normalized_phone<>''
         GROUP BY ecr.normalized_phone
       ), candidates AS (
         SELECT ecr.external_record_id, ecr.display_name, ecr.normalized_phone,
                COALESCE(sc.source_count,0) AS source_count,
                COUNT(DISTINCT cc.client_id) AS canonical_count,
                MIN(cc.client_id) AS candidate_client_id
         FROM external_client_records ecr
         JOIN external_records er ON er.id=ecr.external_record_id
         LEFT JOIN source_counts sc ON sc.normalized_phone=ecr.normalized_phone
         LEFT JOIN client_contacts cc ON cc.normalized_value=ecr.normalized_phone AND cc.contact_type IN ('whatsapp','mobile')
         WHERE er.import_batch_id=$1
         GROUP BY ecr.external_record_id,ecr.display_name,ecr.normalized_phone,sc.source_count
       ), classified AS (
         SELECT c.*,
                CASE
                  WHEN c.normalized_phone IS NULL OR c.normalized_phone='' THEN 'needs_review'
                  WHEN c.source_count>1 THEN 'needs_review'
                  WHEN c.canonical_count=0 THEN 'create_new'
                  WHEN c.canonical_count>1 THEN 'needs_review'
                  WHEN LOWER(BTRIM(COALESCE(cl.display_name,'')))=LOWER(BTRIM(COALESCE(c.display_name,''))) AND BTRIM(COALESCE(c.display_name,''))<>'' THEN 'matched'
                  ELSE 'needs_review'
                END AS queue_status,
                CASE
                  WHEN c.normalized_phone IS NULL OR c.normalized_phone='' THEN 'missing_primary_phone'
                  WHEN c.source_count>1 THEN 'duplicate_goldie_primary_phone'
                  WHEN c.canonical_count=0 THEN 'no_existing_canonical_phone_match'
                  WHEN c.canonical_count>1 THEN 'multiple_canonical_phone_matches'
                  WHEN LOWER(BTRIM(COALESCE(cl.display_name,'')))=LOWER(BTRIM(COALESCE(c.display_name,''))) AND BTRIM(COALESCE(c.display_name,''))<>'' THEN 'exact_unique_phone_and_name'
                  ELSE 'phone_match_name_requires_review'
                END AS reason,
                CASE
                  WHEN c.source_count=1 AND c.canonical_count=1 AND LOWER(BTRIM(COALESCE(cl.display_name,'')))=LOWER(BTRIM(COALESCE(c.display_name,''))) AND BTRIM(COALESCE(c.display_name,''))<>'' THEN 1.0000
                  WHEN c.canonical_count=1 THEN 0.7000 ELSE NULL END AS score
         FROM candidates c LEFT JOIN clients cl ON cl.id=c.candidate_client_id
       )
       INSERT INTO client_reconciliation_queue (
         external_record_id,candidate_client_id,status,reason,candidate_score,evidence,resolved_client_id,resolved_by,resolved_at
       )
       SELECT external_record_id,candidate_client_id,queue_status,reason,score,
              jsonb_build_object('normalized_phone',normalized_phone,'goldie_phone_occurrences',source_count,'canonical_phone_matches',canonical_count,'source_name',display_name),
              CASE WHEN queue_status='matched' THEN candidate_client_id END,
              CASE WHEN queue_status='matched' THEN 'system:goldie_client_import' END,
              CASE WHEN queue_status='matched' THEN NOW() END
       FROM classified
       ON CONFLICT (external_record_id) DO UPDATE SET
         candidate_client_id=EXCLUDED.candidate_client_id,status=EXCLUDED.status,reason=EXCLUDED.reason,
         candidate_score=EXCLUDED.candidate_score,evidence=EXCLUDED.evidence,resolved_client_id=EXCLUDED.resolved_client_id,
         resolved_by=EXCLUDED.resolved_by,resolved_at=EXCLUDED.resolved_at`,
      [batchId]
    );

    await client.query(
      `UPDATE external_records er SET
         reconciliation_status='matched', shiloh_entity_type='client', shiloh_entity_id=q.resolved_client_id,
         match_method='exact_unique_phone_and_name', match_confidence=q.candidate_score, reconciled_at=NOW(), updated_at=NOW()
       FROM client_reconciliation_queue q
       WHERE er.id=q.external_record_id AND er.import_batch_id=$1 AND q.status='matched' AND q.resolved_client_id IS NOT NULL`,
      [batchId]
    );
    await client.query(
      `UPDATE external_records er SET
         reconciliation_status=CASE WHEN q.status='needs_review' THEN 'ambiguous' ELSE 'unmatched' END, updated_at=NOW()
       FROM client_reconciliation_queue q
       WHERE er.id=q.external_record_id AND er.import_batch_id=$1 AND q.status IN ('needs_review','create_new')`,
      [batchId]
    );
    await client.query(
      `INSERT INTO client_reconciliation_history (external_record_id,client_id,action,method,confidence,evidence,performed_by)
       SELECT q.external_record_id,q.resolved_client_id,
              CASE WHEN q.status='matched' THEN 'matched' WHEN q.status='needs_review' THEN 'ambiguous' ELSE 'unmatched' END,
              q.reason,q.candidate_score,q.evidence,'system:goldie_client_import'
       FROM client_reconciliation_queue q
       JOIN external_records er ON er.id=q.external_record_id
       WHERE er.import_batch_id=$1`,
      [batchId]
    );
    await client.query("UPDATE import_batches SET status='completed', completed_at=NOW() WHERE id=$1", [batchId]);

    const summary = await client.query(
      `SELECT q.status, COUNT(*)::int AS count
       FROM client_reconciliation_queue q
       JOIN external_records er ON er.id=q.external_record_id
       WHERE er.import_batch_id=$1
       GROUP BY q.status ORDER BY q.status`,
      [batchId]
    );
    await client.query("COMMIT");
    return { batchId, checksum, recordCount: rows.length, classification: summary.rows };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { stageGoldieClients, parseCsv, normalizePhone };
