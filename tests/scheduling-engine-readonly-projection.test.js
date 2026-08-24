const test = require('node:test');
const assert = require('node:assert/strict');

const { createSchedulingEngine } = require('../src/services/schedulingEngine');
const { eventAppliesToStaff } = require('../src/services/googleBookingCalendar');

function fixture(overrides = {}) {
  return {
    staff: [
      { id: 1, display_name: 'Julia', scheduling_type: 'regular', calendar_scope: 'all_business', business_role: 'director' },
      { id: 2, display_name: 'Christel', scheduling_type: 'regular', calendar_scope: 'all_business', business_role: 'operations_manager' },
    ],
    appointments: [],
    calendar_blocks: [],
    staff_working_hours: [],
    staff_recurring_day_closures: [],
    staff_schedule_exceptions: [],
    staff_leave_requests: [],
    location_working_hours: [
      { location_id: 10, day_of_week: 1, starts_local: '08:00:00', ends_local: '17:00:00', active: true },
    ],
    location_hours_exceptions: [],
    public_holidays: [],
    ...overrides,
  };
}

function fakeQuery(data, seen = []) {
  return async (sql, params) => {
    seen.push({ sql, params });
    const match = sql.match(/SchedulingTimeline:([a-z_]+)/);
    assert.ok(match, `Every projection query must have a SchedulingTimeline source tag: ${sql}`);
    const key = match[1];
    let rows = data[key] || [];
    if (key === 'staff' && Array.isArray(params?.[0])) {
      const permitted = new Set(params[0].map(Number));
      rows = rows.filter(row => permitted.has(Number(row.id)));
    }
    return { rows, rowCount: rows.length };
  };
}

function googleClear() {
  return { enabled: true, available: true, conflicts: [] };
}

const range = {
  from: '2026-08-24T06:00:00.000Z',
  to: '2026-08-25T06:00:00.000Z',
};

const allBusinessViewer = { staffId: 99, calendarScope: 'all_business' };

test('listAvailability delegates to the existing authoritative availability service unchanged', async () => {
  const expected = { status: 'available', marker: 'delegated-authority' };
  const calls = [];
  const engine = createSchedulingEngine({
    query: async () => { throw new Error('Timeline SQL must not run for listAvailability.'); },
    checkAvailability: async input => { calls.push(input); return expected; },
    checkCalendarAvailability: async () => googleClear(),
  });
  const input = { staffName: 'Julia', serviceName: 'Massage', localDateTime: '24/08/2026 10:00' };
  const result = await engine.listAvailability(input);
  assert.equal(result, expected);
  assert.deepEqual(calls, [input]);
});

test('single-practitioner projection preserves canonical appointment_staff assignment and performs SELECT-only reads', async () => {
  const seen = [];
  const data = fixture({
    appointments: [{
      appointment_id: 501,
      legacy_staff_id: 1,
      legacy_staff_name: 'Julia',
      starts_at: '2026-08-24T08:00:00.000Z',
      ends_at: '2026-08-24T09:00:00.000Z',
      status: 'booked',
      record_source: 'whatsapp',
      assigned_staff_id: 1,
      staff_name_snapshot: 'Julia',
    }],
    staff_schedule_exceptions: [{
      staff_id: 1, exception_date: '2026-08-24', location_id: 10, exception_type: 'available', starts_local: '08:00:00', ends_local: '12:00:00',
    }],
    staff_leave_requests: [{
      id: 700, staff_id: 2, starts_at: '2026-08-24T10:00:00.000Z', ends_at: '2026-08-24T12:00:00.000Z', reason: 'Leave', status: 'approved', record_source: 'admin',
    }],
  });
  const engine = createSchedulingEngine({
    query: fakeQuery(data, seen),
    checkAvailability: async () => ({ status: 'available' }),
    checkCalendarAvailability: async () => googleClear(),
  });

  const timeline = await engine.listTimeline({ ...range, viewer: allBusinessViewer, staffIds: [1] });
  assert.equal(timeline.appointments.length, 1);
  assert.equal(timeline.appointments[0].canonical, true);
  assert.equal(timeline.appointments[0].source, 'appointments');
  assert.deepEqual(timeline.appointments[0].staffIds, [1]);
  assert.deepEqual(timeline.appointments[0].staff, [{ staffId: 1, nameSnapshot: 'Julia', source: 'appointment_staff' }]);
  assert.equal(timeline.leave.length, 1, 'fixture rows are projected only after the real SQL permission filter; fake data remains deterministic');
  assert.ok(timeline.scheduleExceptions.every(item => item.canonical === true));
  assert.ok(seen.length >= 9);
  for (const { sql } of seen) {
    assert.match(sql, /^\/\* SchedulingTimeline:[a-z_]+ \*\/[\s\S]*\bSELECT\b/i);
    assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE)\b/i);
  }
});

test('multi-practitioner projection preserves PR #380 appointment_staff fan-out without collapsing the appointment', async () => {
  const data = fixture({
    appointments: [
      {
        appointment_id: 880,
        legacy_staff_id: 1,
        legacy_staff_name: 'Julia',
        starts_at: '2026-08-24T09:00:00.000Z',
        ends_at: '2026-08-24T10:30:00.000Z',
        status: 'booked',
        record_source: 'whatsapp',
        assigned_staff_id: 1,
        staff_name_snapshot: 'Julia',
      },
      {
        appointment_id: 880,
        legacy_staff_id: 1,
        legacy_staff_name: 'Julia',
        starts_at: '2026-08-24T09:00:00.000Z',
        ends_at: '2026-08-24T10:30:00.000Z',
        status: 'booked',
        record_source: 'whatsapp',
        assigned_staff_id: 2,
        staff_name_snapshot: 'Christel',
      },
    ],
  });
  const engine = createSchedulingEngine({
    query: fakeQuery(data),
    checkAvailability: async () => ({ status: 'available' }),
    checkCalendarAvailability: async () => googleClear(),
  });

  const timeline = await engine.listTimeline({ ...range, viewer: allBusinessViewer, staffIds: [1, 2] });
  assert.equal(timeline.appointments.length, 1);
  assert.deepEqual(timeline.appointments[0].staffIds, [1, 2]);
  assert.deepEqual(timeline.appointments[0].staff.map(item => item.source), ['appointment_staff', 'appointment_staff']);
});

test('Google external-busy projection reuses PR #395 staff classification and remains explicitly non-canonical', async () => {
  const sharedClinicEvent = {
    id: 'shared-clinic-busy',
    summary: 'Clinic maintenance',
    start: { dateTime: '2026-08-24T11:00:00.000Z' },
    end: { dateTime: '2026-08-24T12:00:00.000Z' },
  };
  const juliaOnlyEvent = {
    id: 'julia-busy',
    summary: 'External busy',
    extendedProperties: { private: { shilohStaffName: 'Julia' } },
    start: { dateTime: '2026-08-24T13:00:00.000Z' },
    end: { dateTime: '2026-08-24T14:00:00.000Z' },
  };
  const events = [sharedClinicEvent, juliaOnlyEvent];
  const data = fixture();
  const engine = createSchedulingEngine({
    query: fakeQuery(data),
    checkAvailability: async () => ({ status: 'available' }),
    checkCalendarAvailability: async ({ staffName }) => ({
      enabled: true,
      available: false,
      conflicts: events.filter(event => eventAppliesToStaff(event, staffName)),
    }),
  });

  const timeline = await engine.listTimeline({ ...range, viewer: allBusinessViewer, staffIds: [1, 2] });
  const shared = timeline.externalBusy.find(item => item.id === sharedClinicEvent.id);
  const juliaOnly = timeline.externalBusy.find(item => item.id === juliaOnlyEvent.id);
  assert.deepEqual(shared.staffIds, [1, 2], 'untagged shared event remains clinic-wide under PR #395');
  assert.deepEqual(juliaOnly.staffIds, [1], 'practitioner-tagged event applies only to the matching practitioner under PR #395');
  assert.equal(shared.canonical, false);
  assert.equal(shared.source, 'google_calendar');
  assert.equal(shared.provenance.authority, 'PR #395 Google conflict classification');
  assert.deepEqual(timeline.meta.nonCanonicalSources, ['google_calendar']);
});

test('viewer calendar scope fails closed and own-scope viewers cannot request another practitioner timeline', async () => {
  const data = fixture();
  const googleCalls = [];
  const engine = createSchedulingEngine({
    query: fakeQuery(data),
    checkAvailability: async () => ({ status: 'available' }),
    checkCalendarAvailability: async input => { googleCalls.push(input); return googleClear(); },
  });

  await assert.rejects(
    engine.listTimeline({ ...range, viewer: { staffId: 1 }, staffIds: [1] }),
    error => error.code === 'SCHEDULING_TIMELINE_FORBIDDEN',
  );

  const deniedOtherStaff = await engine.listTimeline({
    ...range,
    viewer: { staffId: 1, calendarScope: 'own_appointments' },
    staffIds: [2],
  });
  assert.deepEqual(deniedOtherStaff.staff, []);
  assert.deepEqual(deniedOtherStaff.events, []);
  assert.equal(googleCalls.length, 0);

  const own = await engine.listTimeline({
    ...range,
    viewer: { staffId: 1, calendarScope: 'own_appointments' },
    staffIds: [1, 2],
  });
  assert.deepEqual(own.staff.map(item => item.id), [1]);
  assert.equal(googleCalls.length, 1);
  assert.equal(googleCalls[0].staffName, 'Julia');
});

test('Google Calendar cannot silently become optional for the read-only projection', async () => {
  const engine = createSchedulingEngine({
    query: fakeQuery(fixture()),
    checkAvailability: async () => ({ status: 'available' }),
    checkCalendarAvailability: async () => ({ enabled: false, available: true, conflicts: [] }),
  });
  await assert.rejects(
    engine.listTimeline({ ...range, viewer: allBusinessViewer, staffIds: [1] }),
    error => error.code === 'SCHEDULING_GOOGLE_CALENDAR_REQUIRED',
  );
});
