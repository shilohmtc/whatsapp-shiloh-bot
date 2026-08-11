const { pool } = require('../db/pool');
const logger = require('../lib/logger');

function norm(value = '') {
  return String(value || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseGoldieDate(value = '') {
  const m = String(value || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!m) return null;
  return `20${m[3]}-${m[2]}-${m[1]}`;
}

async function runAugustGoldieDeltaReport() {
  const staged = await pool.query(`
    SELECT er.id, er.external_id, er.reconciliation_status, er.shiloh_entity_id, er.source_payload
    FROM external_records er
    WHERE er.source = 'goldie'
      AND er.entity_type = 'appointment'
      AND er.import_batch_id = '2'
    ORDER BY er.id
  `);

  const canonical = await pool.query(`
    SELECT a.id, a.client_id, a.starts_at, a.ends_at, a.status, a.source, a.external_id,
           a.source_client_name,
           c.display_name AS client_name,
           COALESCE(string_agg(DISTINCT aps.service_name_snapshot, ' + ' ORDER BY aps.service_name_snapshot), '') AS services,
           COALESCE(string_agg(DISTINCT ast.staff_name_snapshot, ' + ' ORDER BY ast.staff_name_snapshot), '') AS staff
    FROM appointments a
    LEFT JOIN clients c ON c.id = a.client_id
    LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
    LEFT JOIN appointment_staff ast ON ast.appointment_id = a.id
    WHERE a.starts_at >= '2026-08-01T00:00:00+02:00'::timestamptz
      AND a.starts_at < '2026-09-01T00:00:00+02:00'::timestamptz
    GROUP BY a.id, c.display_name
    ORDER BY a.starts_at, a.id
  `);

  const existingExternalIds = new Set(canonical.rows.map((r) => String(r.external_id || '')).filter(Boolean));
  const augustRows = [];

  for (const row of staged.rows) {
    const p = row.source_payload || {};
    if (norm(p.Type) !== 'appointment') continue;
    const isoDate = parseGoldieDate(p.Date);
    if (!isoDate || !isoDate.startsWith('2026-08-')) continue;

    const linked = Boolean(row.shiloh_entity_id) || existingExternalIds.has(String(row.external_id || ''));
    if (linked) continue;

    augustRows.push({
      externalRecordId: String(row.id),
      externalId: row.external_id,
      reconciliationStatus: row.reconciliation_status,
      date: p.Date || null,
      startTime: p['Start Time'] || null,
      endTime: p['End Time'] || null,
      status: p.Status || null,
      client: p.Clients || null,
      services: p.Services || null,
      staff: p.Staff || null,
      price: p.Price || null,
      title: p.Title || null,
      notesPresent: Boolean(String(p.Notes || '').trim()),
    });
  }

  logger.info({
    augustGoldieDelta: {
      mode: 'read_only',
      stagedAppointmentRows: staged.rowCount,
      canonicalAugustAppointments: canonical.rowCount,
      missingAugustGoldieAppointments: augustRows.length,
      rows: augustRows,
    },
  }, 'August Goldie appointment delta report');

  return { staged: staged.rowCount, canonical: canonical.rowCount, missing: augustRows.length, rows: augustRows };
}

module.exports = { runAugustGoldieDeltaReport };
