const { pool } = require('../db/pool');
const adminAvailability = require('./adminAvailability');
const googleBookingCalendar = require('./googleBookingCalendar');

const MAX_TIMELINE_DAYS = 31;
const ALL_BUSINESS_SCOPE = 'all_business';
const OWN_SCOPES = new Set(['own_services', 'own_appointments']);
const KNOWN_SCOPES = new Set([ALL_BUSINESS_SCOPE, ...OWN_SCOPES, 'none']);
const BUSINESS_TIMEZONE = 'Africa/Johannesburg';

function timelineError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function parseRange(from, to) {
  const start = new Date(from);
  const end = new Date(to);
  if (!from || !to || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw timelineError('SCHEDULING_TIMELINE_INVALID_RANGE', 'from and to must be valid date-time values.');
  }
  if (start >= end) {
    throw timelineError('SCHEDULING_TIMELINE_INVALID_RANGE', 'from must be earlier than to.');
  }
  if (end.getTime() - start.getTime() > MAX_TIMELINE_DAYS * 24 * 60 * 60 * 1000) {
    throw timelineError('SCHEDULING_TIMELINE_RANGE_TOO_LARGE', `Timeline windows are limited to ${MAX_TIMELINE_DAYS} days.`);
  }
  return { from: start.toISOString(), to: end.toISOString(), start, end };
}

function normalizeIds(values) {
  if (values == null) return null;
  if (!Array.isArray(values)) {
    throw timelineError('SCHEDULING_TIMELINE_INVALID_STAFF_FILTER', 'staffIds must be an array when supplied.');
  }
  const ids = [...new Set(values.map(Number).filter(value => Number.isSafeInteger(value) && value > 0))];
  if (ids.length !== values.length && values.length) {
    throw timelineError('SCHEDULING_TIMELINE_INVALID_STAFF_FILTER', 'staffIds must contain positive integer staff identifiers only.');
  }
  return ids;
}

function resolveViewerFilter(viewer, requestedStaffIds) {
  if (!viewer || typeof viewer !== 'object') {
    throw timelineError('SCHEDULING_TIMELINE_FORBIDDEN', 'An authenticated Calendar viewer is required.');
  }
  const scope = String(viewer.calendarScope || viewer.calendar_scope || '').trim().toLowerCase();
  if (!KNOWN_SCOPES.has(scope)) {
    throw timelineError('SCHEDULING_TIMELINE_FORBIDDEN', 'The Calendar viewer does not have a recognized calendar scope.');
  }
  if (scope === 'none') return { scope, staffIds: [] };
  if (scope === ALL_BUSINESS_SCOPE) return { scope, staffIds: requestedStaffIds };

  const ownStaffId = Number(viewer.staffId || viewer.staff_id);
  if (!Number.isSafeInteger(ownStaffId) || ownStaffId <= 0) {
    throw timelineError('SCHEDULING_TIMELINE_FORBIDDEN', 'Own-scope Calendar viewers must resolve to a canonical staff record.');
  }
  if (requestedStaffIds && !requestedStaffIds.includes(ownStaffId)) return { scope, staffIds: [] };
  return { scope, staffIds: [ownStaffId] };
}

function localDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function canonical(kind, source, fields = {}) {
  return {
    ...fields,
    kind,
    canonical: true,
    source,
    provenance: { authority: source, canonical: true },
  };
}

function nonCanonical(kind, source, fields = {}, authority = source) {
  return {
    ...fields,
    kind,
    canonical: false,
    source,
    provenance: { authority, canonical: false },
  };
}

function aggregateAppointments(rows, permittedStaffIds) {
  const allowed = new Set(permittedStaffIds);
  const appointments = new Map();
  for (const row of rows) {
    let item = appointments.get(String(row.appointment_id));
    if (!item) {
      item = canonical('appointment', 'appointments', {
        id: row.appointment_id,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        status: row.status,
        recordSource: row.record_source || null,
        staff: [],
        staffIds: [],
      });
      appointments.set(String(row.appointment_id), item);
    }
    const assignedId = Number(row.assigned_staff_id);
    if (Number.isSafeInteger(assignedId) && allowed.has(assignedId) && !item.staffIds.includes(assignedId)) {
      item.staffIds.push(assignedId);
      item.staff.push({
        staffId: assignedId,
        nameSnapshot: row.staff_name_snapshot || null,
        source: 'appointment_staff',
      });
    }
  }
  return [...appointments.values()];
}

function buildWorkingWindows(staff, staffHours, recurringClosures, locationHours) {
  const explicitByStaffDay = new Map();
  for (const row of staffHours) {
    const key = `${row.staff_id}:${row.day_of_week}`;
    if (!explicitByStaffDay.has(key)) explicitByStaffDay.set(key, []);
    explicitByStaffDay.get(key).push(row);
  }
  const closed = new Set(recurringClosures.map(row => `${row.staff_id}:${row.day_of_week}`));
  const activeLocationHours = locationHours.filter(row => row.active !== false);
  const windows = [];

  for (const person of staff) {
    for (let day = 0; day <= 6; day += 1) {
      const key = `${person.id}:${day}`;
      const explicit = explicitByStaffDay.get(key) || [];
      if (explicit.length) {
        for (const row of explicit) {
          windows.push(canonical('working_window', 'staff_working_hours', {
            staffId: person.id,
            dayOfWeek: day,
            startsLocal: row.starts_local,
            endsLocal: row.ends_local,
            locationId: row.location_id || null,
            effectiveRule: 'explicit_staff_hours',
          }));
        }
        continue;
      }
      if (person.scheduling_type !== 'regular' || closed.has(key)) continue;
      for (const row of activeLocationHours) {
        if (Number(row.day_of_week) !== day) continue;
        windows.push(canonical('working_window', 'location_working_hours', {
          staffId: person.id,
          dayOfWeek: day,
          startsLocal: row.starts_local,
          endsLocal: row.ends_local,
          locationId: row.location_id,
          effectiveRule: 'regular_staff_inherits_clinic_hours',
        }));
      }
    }
  }
  return windows;
}

function buildClosures(locationExceptions, publicHolidays) {
  const overrides = new Map(locationExceptions.map(row => [`${row.location_id}:${row.exception_date}`, row]));
  const closures = [];
  for (const row of locationExceptions) {
    if (row.exception_type !== 'closed') continue;
    closures.push(canonical('clinic_closure', 'location_hours_exceptions', {
      id: `location:${row.location_id}:${row.exception_date}`,
      locationId: row.location_id,
      date: row.exception_date,
      reason: row.reason || null,
      closureType: 'location_exception',
    }));
  }
  for (const row of publicHolidays) {
    const locationIds = [...new Set(locationExceptions.map(item => Number(item.location_id)).filter(Boolean))];
    if (!locationIds.length) {
      closures.push(canonical('clinic_closure', 'public_holidays', {
        id: `holiday:${row.holiday_date}`,
        locationId: null,
        date: row.holiday_date,
        reason: row.name,
        observed: row.observed === true,
        closureType: 'public_holiday',
      }));
      continue;
    }
    for (const locationId of locationIds) {
      const override = overrides.get(`${locationId}:${row.holiday_date}`);
      if (override?.exception_type === 'open') continue;
      if (override?.exception_type === 'closed') continue;
      closures.push(canonical('clinic_closure', 'public_holidays', {
        id: `holiday:${locationId}:${row.holiday_date}`,
        locationId,
        date: row.holiday_date,
        reason: row.name,
        observed: row.observed === true,
        closureType: 'public_holiday',
      }));
    }
  }
  return closures;
}

function eventTimes(event) {
  return {
    startsAt: event?.start?.dateTime || event?.start?.date || null,
    endsAt: event?.end?.dateTime || event?.end?.date || null,
  };
}

async function projectGoogleBusy(staff, from, to, checkCalendarAvailability) {
  const projected = new Map();
  for (const person of staff) {
    const result = await checkCalendarAvailability({ startsAt: from, endsAt: to, staffName: person.display_name });
    if (!result || result.enabled !== true) {
      throw timelineError('SCHEDULING_GOOGLE_CALENDAR_REQUIRED', 'Google Calendar must remain enabled for SchedulingTimeline projection.');
    }
    for (const event of result.conflicts || []) {
      const times = eventTimes(event);
      const key = event.id || `${times.startsAt || ''}:${times.endsAt || ''}:${event.summary || ''}`;
      let item = projected.get(key);
      if (!item) {
        item = nonCanonical('external_busy', 'google_calendar', {
          id: event.id || key,
          startsAt: times.startsAt,
          endsAt: times.endsAt,
          summary: event.summary || null,
          allDay: Boolean(event?.start?.date && !event?.start?.dateTime),
          staffIds: [],
        }, 'PR #395 Google conflict classification');
        projected.set(key, item);
      }
      if (!item.staffIds.includes(Number(person.id))) item.staffIds.push(Number(person.id));
    }
  }
  return [...projected.values()];
}

function createSchedulingEngine({
  query = (text, params) => pool.query(text, params),
  checkAvailability = adminAvailability.checkAvailability,
  checkCalendarAvailability = googleBookingCalendar.checkCalendarAvailability,
} = {}) {
  async function listAvailability(input) {
    return checkAvailability(input);
  }

  async function listTimeline({ from, to, viewer, staffIds = null } = {}) {
    const range = parseRange(from, to);
    const requestedStaffIds = normalizeIds(staffIds);
    const viewerFilter = resolveViewerFilter(viewer, requestedStaffIds);
    if (viewerFilter.staffIds && viewerFilter.staffIds.length === 0) {
      return {
        meta: {
          from: range.from,
          to: range.to,
          viewerScope: viewerFilter.scope,
          canonicalSources: [],
          nonCanonicalSources: [],
          googleCalendarRequired: true,
        },
        staff: [], workingWindows: [], scheduleExceptions: [], leave: [], closures: [], appointments: [], blocks: [], externalBusy: [], events: [],
      };
    }

    const staffResult = await query(`/* SchedulingTimeline:staff */
      SELECT id, display_name, scheduling_type, calendar_scope, business_role
        FROM staff
       WHERE status='active'
         AND ($1::bigint[] IS NULL OR id = ANY($1::bigint[]))
       ORDER BY display_name, id`, [viewerFilter.staffIds]);
    const staff = staffResult.rows || [];
    const permittedStaffIds = staff.map(row => Number(row.id)).filter(Number.isSafeInteger);
    if (!permittedStaffIds.length) {
      return {
        meta: {
          from: range.from,
          to: range.to,
          viewerScope: viewerFilter.scope,
          canonicalSources: ['staff'],
          nonCanonicalSources: [],
          googleCalendarRequired: true,
        },
        staff: [], workingWindows: [], scheduleExceptions: [], leave: [], closures: [], appointments: [], blocks: [], externalBusy: [], events: [],
      };
    }

    const appointmentResult = await query(`/* SchedulingTimeline:appointments */
      SELECT a.id AS appointment_id,
             a.starts_at, a.ends_at, a.status, a.source AS record_source,
             ast.staff_id AS assigned_staff_id, ast.staff_name_snapshot
        FROM appointments a
        JOIN appointment_staff ast
          ON ast.appointment_id=a.id AND ast.staff_id = ANY($3::bigint[])
       WHERE a.status <> 'cancelled'
         AND a.starts_at < $2::timestamptz
         AND a.ends_at > $1::timestamptz
       ORDER BY a.starts_at, a.id, ast.staff_id`, [range.from, range.to, permittedStaffIds]);

    const blockResult = await query(`/* SchedulingTimeline:calendar_blocks */
      SELECT id, staff_id, starts_at, ends_at, block_type, title, source AS record_source
        FROM calendar_blocks
       WHERE staff_id = ANY($3::bigint[])
         AND starts_at < $2::timestamptz
         AND ends_at > $1::timestamptz
       ORDER BY starts_at, id`, [range.from, range.to, permittedStaffIds]);

    const staffHoursResult = await query(`/* SchedulingTimeline:staff_working_hours */
      SELECT staff_id, day_of_week, starts_local, ends_local, location_id, active
        FROM staff_working_hours
       WHERE staff_id = ANY($1::bigint[]) AND active=TRUE
       ORDER BY staff_id, day_of_week, starts_local`, [permittedStaffIds]);

    const recurringClosureResult = await query(`/* SchedulingTimeline:staff_recurring_day_closures */
      SELECT staff_id, day_of_week, location_id
        FROM staff_recurring_day_closures
       WHERE staff_id = ANY($1::bigint[])
       ORDER BY staff_id, day_of_week`, [permittedStaffIds]);

    const localFrom = localDateKey(range.start);
    const localTo = localDateKey(new Date(range.end.getTime() - 1));
    const staffExceptionResult = await query(`/* SchedulingTimeline:staff_schedule_exceptions */
      SELECT staff_id, exception_date, location_id, exception_type, starts_local, ends_local
        FROM staff_schedule_exceptions
       WHERE staff_id = ANY($1::bigint[])
         AND exception_date BETWEEN $2::date AND $3::date
       ORDER BY exception_date, staff_id, starts_local NULLS FIRST`, [permittedStaffIds, localFrom, localTo]);

    const leaveResult = await query(`/* SchedulingTimeline:staff_leave_requests */
      SELECT id, staff_id, starts_at, ends_at, reason, status, source AS record_source
        FROM staff_leave_requests
       WHERE staff_id = ANY($3::bigint[])
         AND status='approved'
         AND starts_at < $2::timestamptz
         AND ends_at > $1::timestamptz
       ORDER BY starts_at, id`, [range.from, range.to, permittedStaffIds]);

    const locationHoursResult = await query(`/* SchedulingTimeline:location_working_hours */
      SELECT lwh.location_id, lwh.day_of_week, lwh.starts_local, lwh.ends_local, lwh.active
        FROM location_working_hours lwh
        JOIN locations l ON l.id=lwh.location_id
       WHERE l.status='active' AND lwh.active=TRUE
       ORDER BY lwh.location_id, lwh.day_of_week, lwh.starts_local`, []);

    const locationExceptionResult = await query(`/* SchedulingTimeline:location_hours_exceptions */
      SELECT lhe.location_id, lhe.exception_date, lhe.exception_type, lhe.starts_local, lhe.ends_local, lhe.reason
        FROM location_hours_exceptions lhe
        JOIN locations l ON l.id=lhe.location_id
       WHERE l.status='active'
         AND lhe.exception_date BETWEEN $1::date AND $2::date
       ORDER BY lhe.exception_date, lhe.location_id`, [localFrom, localTo]);

    const holidayResult = await query(`/* SchedulingTimeline:public_holidays */
      SELECT holiday_date, name, observed
        FROM public_holidays
       WHERE country_code='ZA'
         AND holiday_date BETWEEN $1::date AND $2::date
       ORDER BY holiday_date`, [localFrom, localTo]);

    const appointments = aggregateAppointments(appointmentResult.rows || [], permittedStaffIds);
    const blocks = (blockResult.rows || []).map(row => canonical('calendar_block', 'calendar_blocks', {
      id: row.id,
      staffIds: [Number(row.staff_id)],
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      allDay: false,
      blockType: row.block_type,
      title: row.title || null,
      recordSource: row.record_source || null,
    }));
    const scheduleExceptions = (staffExceptionResult.rows || []).map(row => canonical('schedule_exception', 'staff_schedule_exceptions', {
      staffId: Number(row.staff_id),
      locationId: row.location_id ? Number(row.location_id) : null,
      date: row.exception_date,
      exceptionType: row.exception_type,
      startsLocal: row.starts_local,
      endsLocal: row.ends_local,
    }));
    const leave = (leaveResult.rows || []).map(row => canonical('approved_leave', 'staff_leave_requests', {
      id: row.id,
      staffIds: [Number(row.staff_id)],
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      reason: row.reason || null,
      recordSource: row.record_source || null,
    }));
    const workingWindows = buildWorkingWindows(staff, staffHoursResult.rows || [], recurringClosureResult.rows || [], locationHoursResult.rows || []);
    const closures = buildClosures(locationExceptionResult.rows || [], holidayResult.rows || []);
    const externalBusy = await projectGoogleBusy(staff, range.from, range.to, checkCalendarAvailability);
    const events = [...appointments, ...blocks, ...leave, ...closures, ...externalBusy];

    return {
      meta: {
        from: range.from,
        to: range.to,
        viewerScope: viewerFilter.scope,
        canonicalSources: [
          'appointments', 'appointment_staff', 'calendar_blocks', 'staff_working_hours',
          'staff_recurring_day_closures', 'staff_schedule_exceptions', 'staff_leave_requests',
          'location_working_hours', 'location_hours_exceptions', 'public_holidays',
        ],
        nonCanonicalSources: ['google_calendar'],
        googleCalendarRequired: true,
      },
      staff: staff.map(row => ({
        id: Number(row.id),
        displayName: row.display_name,
        schedulingType: row.scheduling_type,
        calendarScope: row.calendar_scope,
        businessRole: row.business_role,
      })),
      workingWindows,
      scheduleExceptions,
      recurringClosures: (recurringClosureResult.rows || []).map(row => canonical('recurring_day_closure', 'staff_recurring_day_closures', {
        staffId: Number(row.staff_id), dayOfWeek: Number(row.day_of_week), locationId: row.location_id ? Number(row.location_id) : null,
      })),
      leave,
      closures,
      appointments,
      blocks,
      externalBusy,
      events,
    };
  }

  return { listAvailability, listTimeline };
}

const schedulingEngine = createSchedulingEngine();

module.exports = {
  MAX_TIMELINE_DAYS,
  createSchedulingEngine,
  listAvailability: schedulingEngine.listAvailability,
  listTimeline: schedulingEngine.listTimeline,
  resolveViewerFilter,
};
