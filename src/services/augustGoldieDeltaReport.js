const { pool } = require('../db/pool');
const logger = require('../lib/logger');

function norm(value = '') {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF\u2060]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}
function normStaff(value = '') { return norm(value).replace(/\s*\.\s*$/, ''); }
function normService(value = '') { return norm(value).replace(/[.:]+$/, ''); }
function splitList(value = '') { return String(value || '').split(',').map((v) => v.trim()).filter(Boolean); }
function parseGoldieDate(value = '') {
  const m = String(value || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!m) return null;
  return `20${m[3]}-${m[2]}-${m[1]}`;
}
function localInstant(date, time) {
  const isoDate = parseGoldieDate(date);
  if (!isoDate || !/^\d{2}:\d{2}:\d{2}$/.test(String(time || ''))) return null;
  return new Date(`${isoDate}T${time}+02:00`);
}

async function runAugustGoldieDeltaReport() {
  const [staged, canonical, clients, externalClients, services, staff] = await Promise.all([
    pool.query(`SELECT er.id,er.external_id,er.reconciliation_status,er.shiloh_entity_id,er.source_payload FROM external_records er WHERE er.source='goldie' AND er.entity_type='appointment' AND er.import_batch_id='2' ORDER BY er.id`),
    pool.query(`
      SELECT a.id,a.client_id,a.starts_at,a.ends_at,a.status,a.source,a.external_id,a.source_client_name,c.display_name AS client_name,
             COALESCE(string_agg(DISTINCT aps.service_name_snapshot,' + ' ORDER BY aps.service_name_snapshot),'') AS services,
             COALESCE(string_agg(DISTINCT ast.staff_name_snapshot,' + ' ORDER BY ast.staff_name_snapshot),'') AS staff
      FROM appointments a
      LEFT JOIN clients c ON c.id=a.client_id
      LEFT JOIN appointment_services aps ON aps.appointment_id=a.id
      LEFT JOIN appointment_staff ast ON ast.appointment_id=a.id
      WHERE a.starts_at >= '2026-08-01T00:00:00+02:00'::timestamptz AND a.starts_at < '2026-09-01T00:00:00+02:00'::timestamptz
      GROUP BY a.id,c.display_name ORDER BY a.starts_at,a.id
    `),
    pool.query(`SELECT id,display_name,source,status FROM clients ORDER BY id`),
    pool.query(`
      SELECT er.id AS external_record_id,er.external_id,er.reconciliation_status,er.shiloh_entity_id,ecr.display_name,
             q.id AS queue_id,q.status AS queue_status,q.reason AS queue_reason,q.candidate_client_id
      FROM external_records er
      JOIN external_client_records ecr ON ecr.external_record_id=er.id
      LEFT JOIN client_reconciliation_queue q ON q.external_record_id=er.id
      WHERE er.source='goldie' AND er.entity_type='client' AND er.import_batch_id='1'
      ORDER BY er.id
    `),
    pool.query(`SELECT id,name,status,external_source FROM services ORDER BY id`),
    pool.query(`SELECT id,display_name,source_name,status,resource_type FROM staff ORDER BY id`),
  ]);

  const existingExternalIds = new Set(canonical.rows.map((r) => String(r.external_id || '')).filter(Boolean));
  const missing = [];

  for (const row of staged.rows) {
    const p = row.source_payload || {};
    if (norm(p.Type) !== 'appointment') continue;
    const isoDate = parseGoldieDate(p.Date);
    if (!isoDate || !isoDate.startsWith('2026-08-')) continue;
    if (row.shiloh_entity_id || existingExternalIds.has(String(row.external_id || ''))) continue;

    const clientKey = norm(p.Clients);
    const exactCanonicalClients = clients.rows.filter((c) => norm(c.display_name) === clientKey);
    const exactGoldieClients = externalClients.rows.filter((c) => norm(c.display_name) === clientKey);
    const start = localInstant(p.Date, p['Start Time']);
    const end = localInstant(p.Date, p['End Time']);
    const sameSlot = canonical.rows.filter((a) => start && end && new Date(a.starts_at).getTime() === start.getTime() && new Date(a.ends_at).getTime() === end.getTime());

    const serviceEvidence = splitList(p.Services).map((sourceName) => {
      const key = normService(sourceName);
      const matches = services.rows.filter((s) => normService(s.name) === key);
      return { sourceName, matches: matches.map((s) => ({ id: String(s.id), name: s.name, status: s.status, externalSource: s.external_source })) };
    });
    const staffEvidence = splitList(p.Staff).map((sourceName) => {
      const key = normStaff(sourceName);
      const matches = staff.rows.filter((s) => normStaff(s.display_name) === key || normStaff(s.source_name) === key);
      return { sourceName, matches: matches.map((s) => ({ id: String(s.id), displayName: s.display_name, status: s.status, resourceType: s.resource_type })) };
    });

    missing.push({
      externalRecordId: String(row.id), externalId: row.external_id, reconciliationStatus: row.reconciliation_status,
      date: p.Date || null, startTime: p['Start Time'] || null, endTime: p['End Time'] || null, status: p.Status || null,
      client: p.Clients || null, services: p.Services || null, staff: p.Staff || null, price: p.Price || null,
      exactCanonicalClients: exactCanonicalClients.map((c) => ({ id: String(c.id), displayName: c.display_name, source: c.source, status: c.status })),
      exactGoldieClients: exactGoldieClients.map((c) => ({ externalRecordId: String(c.external_record_id), externalId: c.external_id, displayName: c.display_name, reconciliationStatus: c.reconciliation_status, shilohEntityId: c.shiloh_entity_id ? String(c.shiloh_entity_id) : null, queueId: c.queue_id ? String(c.queue_id) : null, queueStatus: c.queue_status, queueReason: c.queue_reason, candidateClientId: c.candidate_client_id ? String(c.candidate_client_id) : null })),
      sameSlotCanonical: sameSlot.map((a) => ({ id: String(a.id), clientId: a.client_id ? String(a.client_id) : null, clientName: a.client_name, sourceClientName: a.source_client_name, services: a.services, staff: a.staff, source: a.source, status: a.status })),
      serviceEvidence, staffEvidence,
    });
  }

  logger.info({ augustGoldieEvidence: { mode:'read_only', stagedAppointmentRows:staged.rowCount, canonicalAugustAppointments:canonical.rowCount, missingAugustGoldieAppointments:missing.length, rows:missing } }, 'August Goldie delta evidence report');
  return { staged:staged.rowCount, canonical:canonical.rowCount, missing:missing.length, rows:missing };
}

module.exports = { runAugustGoldieDeltaReport };
