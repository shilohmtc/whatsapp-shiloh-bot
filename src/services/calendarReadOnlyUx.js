const { pool } = require('../db/pool');
const schedulingEngine = require('./schedulingEngine');

const BUSINESS_TIMEZONE = 'Africa/Johannesburg';
const BUSINESS_UTC_OFFSET = '+02:00';
const ALLOWED_VIEWS = new Set(['day', 'week', 'agenda']);
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const TIMELINE_SCOPES = new Set(['all_business', 'own_services', 'own_appointments', 'none']);

function uxError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeViewerForTimeline(viewer) {
  if (!viewer || typeof viewer !== 'object') {
    throw uxError('CALENDAR_UX_AUTH_REQUIRED', 'An authenticated server-side Calendar viewer is required.');
  }

  const sourceScope = String(viewer.calendarScope || viewer.calendar_scope || '').trim().toLowerCase();
  if (sourceScope === 'business_all_staff') {
    return { ...viewer, calendarScope: 'all_business' };
  }

  if (sourceScope === 'own_staff') {
    const staffId = Number(viewer.staffId || viewer.staff_id);
    if (!Number.isSafeInteger(staffId) || staffId <= 0) {
      throw uxError('SCHEDULING_TIMELINE_FORBIDDEN', 'Own-staff browser Calendar authority must resolve to a canonical staff record.');
    }
    return { ...viewer, calendarScope: 'own_appointments', staffId };
  }

  if (TIMELINE_SCOPES.has(sourceScope)) {
    return { ...viewer, calendarScope: sourceScope };
  }

  throw uxError('SCHEDULING_TIMELINE_FORBIDDEN', 'The authenticated browser Calendar viewer does not have a recognized SchedulingTimeline scope.');
}

function dateKeyFromDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function parseDateKey(value, fallbackDate = new Date()) {
  if (value == null || String(value).trim() === '') return dateKeyFromDate(fallbackDate);
  const key = String(value).trim();
  if (!DATE_KEY.test(key)) throw uxError('CALENDAR_UX_INVALID_DATE', 'Calendar date must use YYYY-MM-DD.');
  const parsed = new Date(`${key}T12:00:00${BUSINESS_UTC_OFFSET}`);
  if (Number.isNaN(parsed.getTime()) || dateKeyFromDate(parsed) !== key) {
    throw uxError('CALENDAR_UX_INVALID_DATE', 'Calendar date is invalid.');
  }
  return key;
}

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00${BUSINESS_UTC_OFFSET}`);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKeyFromDate(date);
}

function mondayFor(dateKey) {
  const noon = new Date(`${dateKey}T12:00:00${BUSINESS_UTC_OFFSET}`);
  const weekday = noon.getUTCDay();
  const delta = weekday === 0 ? -6 : 1 - weekday;
  return addDays(dateKey, delta);
}

function normalizeView(value) {
  const view = String(value || 'day').trim().toLowerCase();
  if (!ALLOWED_VIEWS.has(view)) throw uxError('CALENDAR_UX_INVALID_VIEW', 'Calendar view must be day, week or agenda.');
  return view;
}

function normalizeStaffFilter(value) {
  if (value == null || String(value).trim() === '' || String(value).trim().toLowerCase() === 'all') return null;
  if (!/^\d+$/.test(String(value).trim())) throw uxError('CALENDAR_UX_INVALID_STAFF_FILTER', 'Calendar practitioner filter is invalid.');
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw uxError('CALENDAR_UX_INVALID_STAFF_FILTER', 'Calendar practitioner filter is invalid.');
  return id;
}

function normalizeVisibleStaffSelection(value) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return { explicit: false, all: false, requestedIds: [] };
  }

  const tokens = (Array.isArray(value) ? value : [value])
    .flatMap(item => String(item).split(','))
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return { explicit: false, all: false, requestedIds: [] };
  if (tokens.includes('all')) {
    if (tokens.length !== 1) {
      throw uxError('CALENDAR_UX_INVALID_STAFF_FILTER', 'Calendar practitioner selection is invalid.');
    }
    return { explicit: true, all: true, requestedIds: [] };
  }

  const requestedIds = [];
  for (const token of tokens) {
    if (!/^\d+$/.test(token)) {
      throw uxError('CALENDAR_UX_INVALID_STAFF_FILTER', 'Calendar practitioner selection is invalid.');
    }
    const id = Number(token);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw uxError('CALENDAR_UX_INVALID_STAFF_FILTER', 'Calendar practitioner selection is invalid.');
    }
    if (!requestedIds.includes(id)) requestedIds.push(id);
  }
  return { explicit: true, all: false, requestedIds };
}

function periodFor(view, dateKey) {
  const startKey = view === 'week' ? mondayFor(dateKey) : dateKey;
  const lengthDays = view === 'day' ? 1 : 7;
  const endKey = addDays(startKey, lengthDays);
  const stepDays = lengthDays;
  const dateKeys = Array.from({ length: lengthDays }, (_, index) => addDays(startKey, index));
  return {
    startKey,
    endKey,
    dateKeys,
    from: new Date(`${startKey}T00:00:00${BUSINESS_UTC_OFFSET}`).toISOString(),
    to: new Date(`${endKey}T00:00:00${BUSINESS_UTC_OFFSET}`).toISOString(),
    previousAnchor: addDays(dateKey, -stepDays),
    nextAnchor: addDays(dateKey, stepDays),
  };
}

function eventStaffIds(item) {
  if (Array.isArray(item?.staffIds)) return item.staffIds.map(Number).filter(Number.isSafeInteger);
  if (Number.isSafeInteger(Number(item?.staffId))) return [Number(item.staffId)];
  return [];
}

function filterTimelineForDisplay(timeline, requestedStaffId) {
  const filtered = filterTimelineForVisibleStaff(timeline, requestedStaffId == null
    ? { explicit: true, all: true, requestedIds: [] }
    : { explicit: true, all: false, requestedIds: [requestedStaffId] });
  return requestedStaffId == null ? { ...filtered, selectedStaffId: null } : filtered;
}

function filterTimelineForVisibleStaff(timeline, selection) {
  const permittedStaff = Array.isArray(timeline?.staff) ? timeline.staff : [];
  const permittedIds = permittedStaff.map(item => Number(item.id)).filter(Number.isSafeInteger);
  const permitted = new Set(permittedIds);
  const requested = selection || { explicit: false, all: false, requestedIds: [] };

  for (const id of requested.requestedIds || []) {
    if (!permitted.has(id)) {
      throw uxError('CALENDAR_UX_STAFF_FILTER_FORBIDDEN', 'The requested practitioner is outside the authenticated Calendar viewer scope.');
    }
  }

  const visibleStaffIds = requested.all
    ? permittedIds
    : requested.explicit
      ? permittedIds.filter(id => requested.requestedIds.includes(id))
      : permittedIds.slice(0, 1);
  if (!visibleStaffIds.length && permittedIds.length) visibleStaffIds.push(permittedIds[0]);
  const visible = new Set(visibleStaffIds);
  const includesVisibleStaff = item => eventStaffIds(item).some(id => visible.has(id));
  const appointments = (timeline.appointments || []).filter(includesVisibleStaff);
  const blocks = (timeline.blocks || []).filter(includesVisibleStaff);
  const leave = (timeline.leave || []).filter(includesVisibleStaff);
  const externalBusy = (timeline.externalBusy || []).filter(includesVisibleStaff);
  const closures = timeline.closures || [];

  return {
    selectedStaffId: visibleStaffIds.length === 1 ? visibleStaffIds[0] : null,
    visibleStaffIds,
    visibleStaffSelectionExplicit: requested.explicit,
    permittedStaff,
    authorizedTimeline: timeline,
    timeline: {
      ...timeline,
      staff: permittedStaff.filter(item => visible.has(Number(item.id))),
      workingWindows: (timeline.workingWindows || []).filter(item => visible.has(Number(item.staffId))),
      scheduleExceptions: (timeline.scheduleExceptions || []).filter(item => visible.has(Number(item.staffId))),
      recurringClosures: (timeline.recurringClosures || []).filter(item => visible.has(Number(item.staffId))),
      appointments,
      blocks,
      leave,
      externalBusy,
      closures,
      events: [...appointments, ...blocks, ...leave, ...closures, ...externalBusy],
    },
  };
}

async function attachCanonicalClientMobiles(timeline, query) {
  const appointments = Array.isArray(timeline?.appointments) ? timeline.appointments : [];
  const appointmentIds = [...new Set(appointments
    .map(item => String(item?.id || '').trim())
    .filter(id => /^\d+$/.test(id)))];
  if (!appointmentIds.length) return timeline;

  const result = await query(`/* CalendarReadOnlyUx:canonical_client_mobile */
    SELECT a.id AS appointment_id,
           CASE
             WHEN a.crm_v2_client_id IS NOT NULL THEN v2.normalized_mobile
             ELSE legacy.mobile
           END AS client_mobile
      FROM appointments a
      LEFT JOIN crm_v2_clients v2 ON v2.id=a.crm_v2_client_id
      LEFT JOIN LATERAL (
        SELECT cc.normalized_value AS mobile
          FROM client_contacts cc
         WHERE cc.client_id=a.client_id
           AND cc.contact_type IN ('mobile','whatsapp')
         ORDER BY cc.is_primary DESC,
                  CASE cc.contact_type WHEN 'mobile' THEN 0 ELSE 1 END,
                  cc.id
         LIMIT 1
      ) legacy ON TRUE
     WHERE a.id = ANY($1::bigint[])`, [appointmentIds]);

  const mobileByAppointment = new Map((result.rows || []).map(row => [
    String(row.appointment_id),
    String(row.client_mobile || '').trim() || null,
  ]));
  const enrichedAppointments = appointments.map(item => ({
    ...item,
    clientMobile: mobileByAppointment.get(String(item.id)) || null,
  }));
  const enrichedById = new Map(enrichedAppointments.map(item => [String(item.id), item]));
  const events = Array.isArray(timeline?.events)
    ? timeline.events.map(item => item?.kind === 'appointment' ? (enrichedById.get(String(item.id)) || item) : item)
    : timeline?.events;

  return {
    ...timeline,
    appointments: enrichedAppointments,
    events,
  };
}

function createCalendarReadOnlyUxService({
  listTimeline = schedulingEngine.listTimeline,
  query = (text, params) => pool.query(text, params),
} = {}) {
  async function buildModel({ view: rawView, date: rawDate, staff: rawStaff, viewer, now = new Date() } = {}) {
    const timelineViewer = normalizeViewerForTimeline(viewer);
    const view = normalizeView(rawView);
    const dateKey = parseDateKey(rawDate, now);
    const visibleStaffSelection = normalizeVisibleStaffSelection(rawStaff);
    const period = periodFor(view, dateKey);

    const timeline = await listTimeline({
      from: period.from,
      to: period.to,
      viewer: timelineViewer,
    });
    const timelineWithMobiles = await attachCanonicalClientMobiles(timeline, query);

    const filtered = filterTimelineForVisibleStaff(timelineWithMobiles, visibleStaffSelection);
    return {
      view,
      dateKey,
      period,
      selectedStaffId: filtered.selectedStaffId,
      visibleStaffIds: filtered.visibleStaffIds,
      visibleStaffSelectionExplicit: filtered.visibleStaffSelectionExplicit,
      permittedStaff: filtered.permittedStaff,
      authorizedTimeline: filtered.authorizedTimeline,
      timeline: filtered.timeline,
      readOnly: true,
      timezone: BUSINESS_TIMEZONE,
    };
  }

  return { buildModel };
}

const service = createCalendarReadOnlyUxService();

module.exports = {
  ALLOWED_VIEWS,
  BUSINESS_TIMEZONE,
  TIMELINE_SCOPES,
  createCalendarReadOnlyUxService,
  buildModel: service.buildModel,
  normalizeViewerForTimeline,
  normalizeView,
  parseDateKey,
  normalizeStaffFilter,
  normalizeVisibleStaffSelection,
  periodFor,
  filterTimelineForDisplay,
  filterTimelineForVisibleStaff,
  attachCanonicalClientMobiles,
  uxError,
};
