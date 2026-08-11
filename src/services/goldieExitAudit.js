const crypto = require('crypto');
const zlib = require('zlib');
const { pool } = require('../db/pool');
const { runGoldieFutureImport } = require('./goldieFutureImport');
const { reconcileFutureAppointmentsToGoogleCalendar } = require('./googleCalendarReconciliation');

function norm(v = '') {
  return String(v || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}
function splitCsv(v = '') {
  return String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
}
function rowKey(row) {
  return crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex');
}
function decodePayload() {
  const encoded = process.env.GOLDIE_FUTURE_IMPORT_PAYLOAD_B64;
  if (!encoded) return null;
  const bytes = Buffer.from(encoded, 'base64');
  const raw = bytes[0] === 0x1f && bytes[1] === 0x8b ? zlib.gunzipSync(bytes) : bytes;
  return JSON.parse(raw.toString('utf8'));
}
function parseLocal(date, time) {
  const m = String(date).match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!m) throw new Error(`Invalid Goldie date ${date}`);
  return new Date(`20${m[3]}-${m[2]}-${m[1]}T${time}+02:00`);
}
function classify(row) {
  return !row.Services || norm(row.Services) === 'personal' ? 'calendar_block' : 'appointment';
}

async function candidateCountForHeldRow(db, row) {
  let startsAt = parseLocal(row.Date, row['Start Time']);
  let endsAt = parseLocal(row.Date, row['End Time']);
  if (endsAt <= startsAt) endsAt = new Date(endsAt.getTime() + 24 * 3600 * 1000);
  const services = splitCsv(row.Services).map(norm);
  const result = await db.query(`
    SELECT a.id,
           COALESCE(c.display_name, a.source_client_name, '') AS client_name,
           array_remove(array_agg(DISTINCT LOWER(TRIM(s.name))), NULL) AS services
      FROM appointments a
      LEFT JOIN clients c ON c.id = a.client_id
      LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
      LEFT JOIN services s ON s.id = aps.service_id
     WHERE a.starts_at = $1 AND a.ends_at = $2 AND a.status <> 'cancelled'
     GROUP BY a.id, c.display_name
  `, [startsAt, endsAt]);
  return result.rows.filter((candidate) => {
    if (norm(candidate.client_name) !== norm(row.Clients)) return false;
    const candidateServices = (candidate.services || []).map(norm);
    return services.every((service) => candidateServices.includes(service));
  }).length;
}

async function findExcessSameSlotGroups(db, payloadRows) {
  const result = await db.query(`
    SELECT a.starts_at, a.ends_at,
           LOWER(TRIM(COALESCE(ast.staff_name_snapshot, ''))) AS staff_name,
           LOWER(TRIM(COALESCE(s.name, aps.service_name_snapshot, ''))) AS service_name,
           COUNT(DISTINCT a.id)::int AS crm_count
      FROM appointments a
      JOIN appointment_staff ast ON ast.appointment_id = a.id
      JOIN appointment_services aps ON aps.appointment_id = a.id
      LEFT JOIN services s ON s.id = aps.service_id
     WHERE a.starts_at >= NOW() AND a.status <> 'cancelled'
       AND a.source IN ('goldie', 'goldie_import')
     GROUP BY a.starts_at, a.ends_at,
              LOWER(TRIM(COALESCE(ast.staff_name_snapshot, ''))),
              LOWER(TRIM(COALESCE(s.name, aps.service_name_snapshot, '')))
    HAVING COUNT(DISTINCT a.id) > 1
     ORDER BY a.starts_at
  `);
  const payloadAppointments = payloadRows.filter((row) => classify(row) === 'appointment');
  return result.rows.map((group) => {
    const baselineCount = payloadAppointments.filter((row) => {
      let start = parseLocal(row.Date, row['Start Time']);
      let end = parseLocal(row.Date, row['End Time']);
      if (end <= start) end = new Date(end.getTime() + 24 * 3600 * 1000);
      const staff = splitCsv(row.Staff).map(norm);
      const services = splitCsv(row.Services).map(norm);
      return start.getTime() === new Date(group.starts_at).getTime()
        && end.getTime() === new Date(group.ends_at).getTime()
        && staff.includes(norm(group.staff_name))
        && services.includes(norm(group.service_name));
    }).length;
    return {
      startsAt: group.starts_at,
      endsAt: group.ends_at,
      staff: group.staff_name,
      service: group.service_name,
      crmCount: Number(group.crm_count),
      baselineCount,
      excessCount: Math.max(0, Number(group.crm_count) - baselineCount),
    };
  }).filter((group) => group.excessCount > 0);
}

async function getGoldieExitAudit() {
  const payload = decodePayload();
  if (!payload) {
    return { mode: 'read_only', writesPerformed: false, overallPass: false, reason: 'baseline_payload_not_configured' };
  }
  const dryRun = await runGoldieFutureImport({ mode: 'dry-run' });
  const issueByKey = new Map((dryRun.issues || []).map((issue) => [issue.externalKey, issue.type]));
  const heldRows = (payload.rows || []).filter((row) => classify(row) === 'appointment' && issueByKey.has(rowKey(row)));
  const db = await pool.connect();
  try {
    const held = [];
    for (const row of heldRows) {
      const exactCandidateCount = await candidateCountForHeldRow(db, row);
      held.push({
        date: row.Date,
        startTime: row['Start Time'],
        endTime: row['End Time'],
        services: splitCsv(row.Services),
        sourceStaff: splitCsv(row.Staff),
        issueType: issueByKey.get(rowKey(row)),
        exactCandidateCount,
        representedInCrm: exactCandidateCount === 1,
      });
    }
    const excessSameSlotGroups = await findExcessSameSlotGroups(db, payload.rows || []);
    const sourceCounts = await db.query(`
      SELECT source, COUNT(*)::int AS count
        FROM appointments
       WHERE starts_at >= NOW() AND status <> 'cancelled'
         AND source IN ('goldie', 'goldie_import')
       GROUP BY source ORDER BY source
    `);
    const calendar = await reconcileFutureAppointmentsToGoogleCalendar({ mode: 'dry-run' });
    const calendarIssueTypes = (calendar.issues || []).reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
    const unresolvedBookings = held.filter((row) => !row.representedInCrm).length;
    const calendarHealthy = Number(calendar.summary?.missingStaff || 0) === 0 && Number(calendar.summary?.errors || 0) === 0;
    return {
      mode: 'read_only',
      writesPerformed: false,
      baseline: {
        sourceFile: payload.sourceFile || null,
        exportedAt: payload.exportedAt || null,
        rows: Number(dryRun.summary?.rows || 0),
        appointments: Number(dryRun.summary?.appointments || 0),
        blocks: Number(dryRun.summary?.blocks || 0),
      },
      initialDryRunUnresolved: Number(dryRun.summary?.unresolved || 0),
      heldAppointments: held,
      unresolvedBookings,
      excessSameSlotGroups,
      futureSourceCounts: sourceCounts.rows,
      calendar: {
        summary: calendar.summary,
        issueCount: (calendar.issues || []).length,
        issueTypes: calendarIssueTypes,
      },
      checks: {
        baselineConfigured: true,
        everyHeldAppointmentRepresentedExactlyOnceInCrm: unresolvedBookings === 0,
        noExcessSameSlotGoldieAppointments: excessSameSlotGroups.length === 0,
        calendarReconciliationHasNoStaffOrRuntimeErrors: calendarHealthy,
      },
      overallPass: unresolvedBookings === 0 && excessSameSlotGroups.length === 0 && calendarHealthy,
    };
  } finally {
    db.release();
  }
}

module.exports = { getGoldieExitAudit };
