const { pool } = require('../db/pool');
const { parseGoldieDateTime, serviceKey } = require('./appointmentReconciliationPlan');

function norm(v) {
  return String(v || '').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function splitList(v) { return String(v || '').split(',').map((x) => x.trim()).filter(Boolean); }
function minutesBetween(start, end) { return Math.round((end.getTime() - start.getTime()) / 60000); }

async function getServiceOnlyAppointmentEvidence({ appointmentBatchId = '2', clientBatchId = '1' } = {}) {
  const [staged, clientLinks, services, staff] = await Promise.all([
    pool.query(`SELECT id,external_id,source_payload FROM external_records WHERE import_batch_id=$1 AND source='goldie' AND entity_type='appointment' AND reconciliation_status='unmatched' ORDER BY id`, [appointmentBatchId]),
    pool.query(`SELECT ecr.display_name,er.shiloh_entity_id AS client_id FROM external_records er JOIN external_client_records ecr ON ecr.external_record_id=er.id WHERE er.import_batch_id=$1 AND er.source='goldie' AND er.entity_type='client' AND er.reconciliation_status='matched' AND er.shiloh_entity_id IS NOT NULL`, [clientBatchId]),
    pool.query(`SELECT id,name,status,external_source,duration_minutes,price FROM services WHERE status='active' OR external_source='goldie_historical'`),
    pool.query(`SELECT id,display_name,source_name FROM staff`),
  ]);

  const clientMap = new Map();
  for (const r of clientLinks.rows) {
    const k = norm(r.display_name); if (!k) continue;
    if (!clientMap.has(k)) clientMap.set(k, new Set());
    clientMap.get(k).add(String(r.client_id));
  }
  const serviceMap = new Map(services.rows.map((r) => [norm(r.name), r]));
  const staffMap = new Map();
  for (const r of staff.rows) { staffMap.set(norm(r.display_name), r); if (r.source_name) staffMap.set(norm(r.source_name), r); }

  const grouped = new Map();
  let qualifyingRows = 0;
  for (const rec of staged.rows) {
    const p = rec.source_payload || {};
    if (norm(p.Type) !== 'appointment') continue;
    const start = parseGoldieDateTime(p.Date, p['Start Time']);
    const end = parseGoldieDateTime(p.Date, p['End Time']);
    if (!(start && end && end > start)) continue;

    const clients = splitList(p.Clients);
    if (clients.length !== 1) continue;
    const clientIds = clientMap.get(norm(clients[0]));
    if (!clientIds || clientIds.size !== 1) continue;

    const staffNames = splitList(p.Staff);
    if (!staffNames.length || staffNames.some((n) => !staffMap.get(norm(n)) && !staffMap.get(norm(n.replace(/\s+\.$/, ''))))) continue;

    const serviceNames = splitList(p.Services);
    if (!serviceNames.length) continue;
    const unresolved = serviceNames.filter((n) => !serviceMap.get(serviceKey(n)));
    if (!unresolved.length) continue;

    qualifyingRows++;
    for (const sourceName of unresolved) {
      const k = norm(sourceName);
      if (!grouped.has(k)) grouped.set(k, { sourceName, count: 0, rows: [] });
      const g = grouped.get(k); g.count++;
      if (g.rows.length < 20) g.rows.push({
        externalId: rec.external_id,
        date: p.Date,
        startTime: p['Start Time'],
        endTime: p['End Time'],
        durationMinutes: minutesBetween(start, end),
        client: p.Clients || null,
        services: p.Services || null,
        staff: p.Staff || null,
        price: p.Price == null || p.Price === '' ? null : Number(String(p.Price).replace(/[^0-9.-]/g, '')),
      });
    }
  }

  const items = [...grouped.values()].sort((a,b) => b.count-a.count || a.sourceName.localeCompare(b.sourceName));
  return {
    appointmentBatchId: String(appointmentBatchId), clientBatchId: String(clientBatchId),
    qualifyingRows,
    distinctUnresolvedServiceNames: items.length,
    items,
    policy: { readOnly: true, identityMustAlreadyBeUniqueCanonical: true, staffMustResolveExactly: true, validTimeRequired: true, noServiceMappingsWritten: true },
  };
}

module.exports = { getServiceOnlyAppointmentEvidence };
