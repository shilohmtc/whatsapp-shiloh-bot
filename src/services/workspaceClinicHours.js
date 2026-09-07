const { createHash } = require('crypto');
const { pool } = require('../db/pool');
const { getDefaultActiveLocation } = require('./clinicHours');

const SCHEDULE_MANAGE_CAPABILITY = 'schedule:manage';
const WRITABLE_DAYS = Object.freeze([1, 2, 3, 4, 5, 6]);
const DAY_NAMES = Object.freeze({
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
});
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const REVISION_PATTERN = /^[a-f0-9]{64}$/i;

class WorkspaceClinicHoursError extends Error {
  constructor(code, message, httpStatus, details = null) {
    super(message);
    this.name = 'WorkspaceClinicHoursError';
    this.code = code;
    this.httpStatus = httpStatus;
    if (details) this.details = details;
  }
}

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function permissionSet(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function timeValue(value) {
  return String(value || '').slice(0, 5);
}

function evaluateAuthority(rows = []) {
  if (!Array.isArray(rows) || rows.length !== 1) return null;
  const row = rows[0];
  const adminId = positiveId(row.id);
  if (!adminId || row.admin_active !== true) return null;
  if (row.staff_id != null && row.staff_status !== 'active') return null;
  if (permissionSet(row.permissions)[SCHEDULE_MANAGE_CAPABILITY] !== true) return null;
  return {
    key: 'workspace_clinic_hours_manage_v1',
    operatorAdminId: adminId,
    displayName: String(row.display_name || 'Staff').trim() || 'Staff',
    capability: SCHEDULE_MANAGE_CAPABILITY,
  };
}

function normalizeDayPayload(days) {
  if (!Array.isArray(days) || days.length !== WRITABLE_DAYS.length) {
    throw new WorkspaceClinicHoursError(
      'WORKSPACE_CLINIC_HOURS_INVALID_DAYS',
      'Clinic hours must include Monday through Saturday exactly once.',
      400
    );
  }
  const normalized = [];
  const seen = new Set();
  for (const raw of days) {
    const dayOfWeek = Number(raw?.dayOfWeek);
    if (!WRITABLE_DAYS.includes(dayOfWeek) || seen.has(dayOfWeek)) {
      throw new WorkspaceClinicHoursError(
        'WORKSPACE_CLINIC_HOURS_INVALID_DAYS',
        'Clinic hours must include Monday through Saturday exactly once.',
        400
      );
    }
    seen.add(dayOfWeek);
    const open = raw?.open === true;
    if (!open) {
      normalized.push({ dayOfWeek, open: false, startsLocal: null, endsLocal: null });
      continue;
    }
    const startsLocal = String(raw?.startsLocal || '').trim();
    const endsLocal = String(raw?.endsLocal || '').trim();
    if (!TIME_PATTERN.test(startsLocal) || !TIME_PATTERN.test(endsLocal)) {
      throw new WorkspaceClinicHoursError(
        'WORKSPACE_CLINIC_HOURS_INVALID_TIME',
        `${DAY_NAMES[dayOfWeek]} opening and closing times must use HH:MM.`,
        400
      );
    }
    if (endsLocal <= startsLocal) {
      throw new WorkspaceClinicHoursError(
        'WORKSPACE_CLINIC_HOURS_INVALID_WINDOW',
        `${DAY_NAMES[dayOfWeek]} closing time must be later than opening time.`,
        400
      );
    }
    normalized.push({ dayOfWeek, open: true, startsLocal, endsLocal });
  }
  normalized.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  return normalized;
}

function canonicalDays(rows = []) {
  const grouped = new Map();
  for (const row of rows) {
    const dayOfWeek = Number(row.day_of_week);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) continue;
    const list = grouped.get(dayOfWeek) || [];
    list.push(row);
    grouped.set(dayOfWeek, list);
  }
  for (const dayOfWeek of WRITABLE_DAYS) {
    if ((grouped.get(dayOfWeek) || []).length > 1) {
      throw new WorkspaceClinicHoursError(
        'WORKSPACE_CLINIC_HOURS_AMBIGUOUS_DAY',
        `${DAY_NAMES[dayOfWeek]} has more than one active clinic-hours window. The editor failed closed.`,
        409,
        { dayOfWeek }
      );
    }
  }
  return [1, 2, 3, 4, 5, 6].map(dayOfWeek => {
    const row = (grouped.get(dayOfWeek) || [])[0];
    return row
      ? { dayOfWeek, name: DAY_NAMES[dayOfWeek], open: true, startsLocal: timeValue(row.starts_local), endsLocal: timeValue(row.ends_local), permanent: false }
      : { dayOfWeek, name: DAY_NAMES[dayOfWeek], open: false, startsLocal: null, endsLocal: null, permanent: false };
  }).concat({
    dayOfWeek: 0,
    name: DAY_NAMES[0],
    open: false,
    startsLocal: null,
    endsLocal: null,
    permanent: true,
  });
}

function revisionFor(locationId, days) {
  const canonical = {
    locationId: positiveId(locationId),
    days: days.map(day => ({
      dayOfWeek: day.dayOfWeek,
      open: day.open === true,
      startsLocal: day.startsLocal || null,
      endsLocal: day.endsLocal || null,
      permanent: day.permanent === true,
    })),
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

function requireExpectedRevision(value) {
  const revision = String(value || '').trim().toLowerCase();
  if (!REVISION_PATTERN.test(revision)) {
    throw new WorkspaceClinicHoursError(
      'WORKSPACE_CLINIC_HOURS_INVALID_REVISION',
      'A valid current clinic-hours revision is required.',
      400
    );
  }
  return revision;
}

function auditProjection(days) {
  return days.map(day => ({
    dayOfWeek: day.dayOfWeek,
    open: day.open === true,
    startsLocal: day.startsLocal || null,
    endsLocal: day.endsLocal || null,
    permanent: day.permanent === true,
  }));
}

function createWorkspaceClinicHoursService({ db = pool, locationResolver = getDefaultActiveLocation } = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Workspace Clinic hours database is required');

  async function principalRows(adminId, queryable = db) {
    const id = positiveId(adminId);
    if (!id) return [];
    const result = await queryable.query(
      `/* workspaceClinicHours:principal */
       SELECT a.id, a.staff_id, a.display_name, a.permissions,
              a.active AS admin_active, s.status AS staff_status
         FROM staff_admin_accounts a
         LEFT JOIN staff s ON s.id=a.staff_id
        WHERE a.id=$1
          AND a.active=TRUE
        LIMIT 2`,
      [id]
    );
    return result.rows;
  }

  async function resolveAccess(adminId, queryable = db) {
    return evaluateAuthority(await principalRows(adminId, queryable));
  }

  async function requireAccess(adminId, queryable = db) {
    const authority = await resolveAccess(adminId, queryable);
    if (!authority) {
      throw new WorkspaceClinicHoursError(
        'WORKSPACE_CLINIC_HOURS_FORBIDDEN',
        'Your authenticated Shiloh access does not permit clinic-hours management.',
        403
      );
    }
    return authority;
  }

  async function requireLocation(queryable = db) {
    const location = await locationResolver(queryable);
    if (!location || !positiveId(location.id)) {
      throw new WorkspaceClinicHoursError(
        'WORKSPACE_CLINIC_HOURS_LOCATION_UNRESOLVED',
        'Clinic hours cannot be managed because Shiloh does not resolve to exactly one active clinic location.',
        409
      );
    }
    return location;
  }

  async function activeRows(locationId, queryable = db, { lock = false } = {}) {
    const result = await queryable.query(
      `/* workspaceClinicHours:activeRows */
       SELECT id, day_of_week, starts_local, ends_local
         FROM location_working_hours
        WHERE location_id=$1
          AND active=TRUE
        ORDER BY day_of_week, starts_local, id${lock ? '\n        FOR UPDATE' : ''}`,
      [locationId]
    );
    return result.rows;
  }

  async function buildModel({ adminId } = {}) {
    const authority = await requireAccess(adminId);
    const location = await requireLocation();
    const days = canonicalDays(await activeRows(location.id));
    return {
      authority,
      location: { id: positiveId(location.id), name: String(location.name || 'Shiloh'), timezone: String(location.timezone || 'Africa/Johannesburg') },
      days,
      revision: revisionFor(location.id, days),
    };
  }

  async function updateHours({ adminId, expectedRevision, days } = {}) {
    const expected = requireExpectedRevision(expectedRevision);
    const desired = normalizeDayPayload(days);
    if (typeof db.connect !== 'function') throw new Error('Workspace Clinic hours database transaction support is required');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const authority = await requireAccess(adminId, client);
      const location = await requireLocation(client);
      const beforeDays = canonicalDays(await activeRows(location.id, client, { lock: true }));
      const currentRevision = revisionFor(location.id, beforeDays);
      if (currentRevision !== expected) {
        throw new WorkspaceClinicHoursError(
          'WORKSPACE_CLINIC_HOURS_STALE_REVISION',
          'Clinic hours changed since this page was loaded. Reload the current hours and try again.',
          409
        );
      }

      await client.query(
        `/* workspaceClinicHours:deactivateWritable */
         UPDATE location_working_hours
            SET active=FALSE,
                updated_at=NOW()
          WHERE location_id=$1
            AND day_of_week BETWEEN 1 AND 6
            AND active=TRUE`,
        [location.id]
      );

      for (const day of desired) {
        if (!day.open) continue;
        await client.query(
          `/* workspaceClinicHours:upsertWritable */
           INSERT INTO location_working_hours
             (location_id, day_of_week, starts_local, ends_local, active)
           VALUES ($1, $2, $3::time, $4::time, TRUE)
           ON CONFLICT (location_id, day_of_week, starts_local, ends_local)
           DO UPDATE SET active=TRUE, updated_at=NOW()`,
          [location.id, day.dayOfWeek, day.startsLocal, day.endsLocal]
        );
      }

      const afterDays = canonicalDays(await activeRows(location.id, client, { lock: true }));
      await client.query(
        `/* workspaceClinicHours:audit */
         INSERT INTO crm_audit_events
           (actor_admin_id, action, entity_type, entity_id, metadata)
         VALUES ($1, 'workspace.clinic_hours_updated', 'location', $2, $3::jsonb)`,
        [authority.operatorAdminId, location.id, JSON.stringify({ before: auditProjection(beforeDays), after: auditProjection(afterDays) })]
      );
      await client.query('COMMIT');
      return {
        status: 'updated',
        location: { id: positiveId(location.id), name: String(location.name || 'Shiloh') },
        days: afterDays,
        revision: revisionFor(location.id, afterDays),
      };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      client.release();
    }
  }

  return { resolveAccess, buildModel, updateHours };
}

const service = createWorkspaceClinicHoursService();

module.exports = {
  SCHEDULE_MANAGE_CAPABILITY,
  WRITABLE_DAYS,
  DAY_NAMES,
  WorkspaceClinicHoursError,
  evaluateAuthority,
  normalizeDayPayload,
  canonicalDays,
  revisionFor,
  createWorkspaceClinicHoursService,
  ...service,
};
