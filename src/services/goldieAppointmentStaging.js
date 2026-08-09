const crypto = require("crypto");
const { pool } = require("../db/pool");
const { parseCsv } = require("./goldieClientImport");

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function stageGoldieAppointments(buffer, filename = "Appointments.csv") {
  const raw = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(raw);
  if (!rows.length) throw new Error("Appointments CSV is empty");

  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
  const headers = Object.keys(rows[0]);
  const seenHashes = new Map();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const batchResult = await client.query(
      `INSERT INTO import_batches (source, source_file, checksum, status, metadata)
       VALUES ('goldie', $1, $2, 'processing', $3::jsonb)
       RETURNING id`,
      [filename, checksum, JSON.stringify({ entity_type: "appointment", record_count: rows.length, headers })]
    );
    const batchId = batchResult.rows[0].id;

    let inserted = 0;
    let updated = 0;
    for (const row of rows) {
      const canonical = stableJson(row);
      const baseHash = crypto.createHash("sha256").update(canonical).digest("hex");
      const occurrence = (seenHashes.get(baseHash) || 0) + 1;
      seenHashes.set(baseHash, occurrence);
      const externalId = `${baseHash}:${occurrence}`;

      const result = await client.query(
        `INSERT INTO external_records (
           import_batch_id, source, entity_type, external_id, reconciliation_status, source_payload
         ) VALUES ($1, 'goldie', 'appointment', $2, 'unmatched', $3::jsonb)
         ON CONFLICT (source, entity_type, external_id) DO UPDATE SET
           import_batch_id=EXCLUDED.import_batch_id,
           source_payload=EXCLUDED.source_payload,
           updated_at=NOW()
         RETURNING (xmax = 0) AS inserted`,
        [batchId, externalId, JSON.stringify(row)]
      );
      if (result.rows[0]?.inserted) inserted += 1;
      else updated += 1;
    }

    await client.query(
      `UPDATE import_batches
       SET status='completed', completed_at=NOW(), metadata=metadata || $2::jsonb
       WHERE id=$1`,
      [batchId, JSON.stringify({ inserted, updated })]
    );
    await client.query("COMMIT");

    return {
      batchId: String(batchId),
      checksum,
      recordCount: rows.length,
      inserted,
      updated,
      headers,
      sample: rows.slice(0, 3),
      safety: {
        mode: "staging_only",
        canonicalAppointmentsCreated: 0,
        clientLinksChanged: 0,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { stageGoldieAppointments };
