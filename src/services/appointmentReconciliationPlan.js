const { pool } = require('../db/pool');

function norm(v) {
  return String(v || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}
function splitList(v) {
  return String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
}
function parseGoldieDateTime(dateText, timeText) {
  const m = String(dateText || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  const t = String(timeText || '').trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m || !t) return null;
  let year = Number(m[3]); if (year < 100) year += 2000;
  const month = Number(m[2]), day = Number(m[1]), hour = Number(t[1]), minute = Number(t[2]), second = Number(t[3] || 0);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  const iso = `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:${String(second).padStart(2,'0')}+02:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

const SERVICE_ALIASES = new Map([
  [norm('90 Min Full Body Swedish'), norm('Full Body Swedish')],
]);
function serviceKey(name) { const k = norm(name); return SERVICE_ALIASES.get(k) || k; }

async function buildAppointmentReconciliationPlan({ appointmentBatchId = '2', clientBatchId = '1' } = {}) {
  const [appointments, clientLinks, services, staff] = await Promise.all([
    pool.query(`SELECT id, external_id, source_payload FROM external_records WHERE import_batch_id=$1 AND source='goldie' AND entity_type='appointment' AND reconciliation_status='unmatched' ORDER BY id`, [appointmentBatchId]),
    pool.query(`SELECT ecr.display_name, er.shiloh_entity_id AS client_id FROM external_records er JOIN external_client_records ecr ON ecr.external_record_id=er.id WHERE er.import_batch_id=$1 AND er.source='goldie' AND er.entity_type='client' AND er.reconciliation_status='matched' AND er.shiloh_entity_id IS NOT NULL`, [clientBatchId]),
    pool.query(`SELECT id,name FROM services WHERE status='active'`),
    pool.query(`SELECT id,display_name,source_name,status FROM staff`),
  ]);

  const clientMap = new Map();
  for (const r of clientLinks.rows) {
    const k = norm(r.display_name); if (!k) continue;
    if (!clientMap.has(k)) clientMap.set(k, new Set());
    clientMap.get(k).add(String(r.client_id));
  }
  const serviceMap = new Map(services.rows.map((r) => [norm(r.name), String(r.id)]));
  const staffMap = new Map();
  for (const r of staff.rows) {
    staffMap.set(norm(r.display_name), String(r.id));
    if (r.source_name) staffMap.set(norm(r.source_name), String(r.id));
  }

  const summary = {
    total: appointments.rowCount, appointmentRows: 0, nonAppointmentRows: 0, validTimes: 0, invalidTimes: 0,
    client: { uniqueCanonical: 0, multipleNamedClients: 0, ambiguousName: 0, unresolvedName: 0, blank: 0 },
    services: { allExact: 0, partial: 0, none: 0, blank: 0 },
    staff: { allExact: 0, partial: 0, none: 0, blank: 0 },
    promotion: { safeSingleClientAppointments: 0, blocked: 0 },
  };
  const blockers = new Map();
  const samples = [];

  for (const rec of appointments.rows) {
    const p = rec.source_payload || {};
    const isAppointment = norm(p.Type) === 'appointment';
    if (isAppointment) summary.appointmentRows++; else summary.nonAppointmentRows++;
    const start = parseGoldieDateTime(p.Date, p['Start Time']);
    const end = parseGoldieDateTime(p.Date, p['End Time']);
    const validTimes = Boolean(start && end && end > start);
    validTimes ? summary.validTimes++ : summary.invalidTimes++;

    const clientNames = splitList(p.Clients);
    let clientState = 'blank';
    if (clientNames.length > 1) clientState = 'multipleNamedClients';
    else if (clientNames.length === 1) {
      const ids = clientMap.get(norm(clientNames[0]));
      if (!ids || ids.size === 0) clientState = 'unresolvedName';
      else if (ids.size > 1) clientState = 'ambiguousName';
      else clientState = 'uniqueCanonical';
    }
    summary.client[clientState]++;

    const serviceNames = splitList(p.Services);
    const serviceMatches = serviceNames.map((name) => ({ name, id: serviceMap.get(serviceKey(name)) || null }));
    let serviceState = 'blank';
    if (serviceNames.length) {
      const matched = serviceMatches.filter((x) => x.id).length;
      serviceState = matched === serviceNames.length ? 'allExact' : matched === 0 ? 'none' : 'partial';
    }
    summary.services[serviceState]++;

    const staffNames = splitList(p.Staff);
    const staffMatches = staffNames.map((name) => ({ name, id: staffMap.get(norm(name)) || staffMap.get(norm(name.replace(/\s+\.$/, ''))) || null }));
    let staffState = 'blank';
    if (staffNames.length) {
      const matched = staffMatches.filter((x) => x.id).length;
      staffState = matched === staffNames.length ? 'allExact' : matched === 0 ? 'none' : 'partial';
    }
    summary.staff[staffState]++;

    const rowBlockers = [];
    if (!isAppointment) rowBlockers.push('not_appointment_type');
    if (!validTimes) rowBlockers.push('invalid_time_range');
    if (clientState !== 'uniqueCanonical') rowBlockers.push(`client_${clientState}`);
    if (serviceState !== 'allExact') rowBlockers.push(`services_${serviceState}`);
    if (staffState !== 'allExact') rowBlockers.push(`staff_${staffState}`);
    if (rowBlockers.length === 0) summary.promotion.safeSingleClientAppointments++;
    else {
      summary.promotion.blocked++;
      for (const b of rowBlockers) blockers.set(b, (blockers.get(b) || 0) + 1);
    }
    if (samples.length < 25 && rowBlockers.length) samples.push({ externalId: rec.external_id, date: p.Date, startTime: p['Start Time'], client: p.Clients || null, services: p.Services || null, staff: p.Staff || null, blockers: rowBlockers });
  }

  return {
    mode: 'dry_run', writesPerformed: false, appointmentBatchId: String(appointmentBatchId), clientBatchId: String(clientBatchId),
    summary,
    blockerCounts: [...blockers.entries()].sort((a,b) => b[1]-a[1]).map(([reason,count]) => ({ reason, count })),
    blockedSamples: samples,
    policy: {
      promoteOnlyTypeAppointment: true,
      requireValidTimeRange: true,
      requireExactlyOneUniquelyCanonicalClient: true,
      requireAllServicesExactOrApprovedAlias: true,
      approvedServiceAliases: Object.fromEntries(SERVICE_ALIASES),
      allowHistoricalInactiveStaffByGoldieSourceName: true,
      requireAllStaffExact: true,
      timezone: 'Africa/Johannesburg (+02:00)',
      writesEnabled: false,
    },
  };
}

module.exports = { buildAppointmentReconciliationPlan, parseGoldieDateTime, SERVICE_ALIASES, serviceKey };
