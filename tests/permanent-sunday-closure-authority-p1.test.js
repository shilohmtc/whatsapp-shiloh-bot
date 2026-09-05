const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { pool } = require('../src/db/pool');
const { getClinicWindowForDate } = require('../src/services/clinicHours');
const { processAdminHolidayHoursMessage } = require('../src/services/adminHolidayHours');
const { createSchedulingEngine } = require('../src/services/schedulingEngine');
const {
  dateKeyInBusinessTimezone,
  isOperationalDateKey,
  isSundayDateKey,
} = require('../src/services/operationalCalendar');

const ROOT = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function result(rows = []) { return { rows, rowCount: rows.length }; }

test('operational Calendar date authority recognizes Johannesburg Sundays without named-person policy', () => {
  assert.equal(isSundayDateKey('2026-08-09'), true);
  assert.equal(isOperationalDateKey('2026-08-10'), true);
  assert.equal(isOperationalDateKey('2026-08-09'), false);
  assert.equal(dateKeyInBusinessTimezone('2026-08-08T22:30:00.000Z'), '2026-08-09');
  assert.equal(isSundayDateKey('not-a-date'), false);
  assert.doesNotMatch(source('src/services/operationalCalendar.js'), /Christel|Juvan|Pieter|Savanna/);
});

test('clinic-hours authority rejects Sunday before an open exception can take effect while retaining holiday identity', async () => {
  const window = await getClinicWindowForDate({
    locationId: 1,
    date: '2026-08-09',
    db: {
      query: async () => result([{
        requested_dow: 0,
        is_holiday: true,
        holiday_name: "National Women's Day",
        override_type: 'open',
        override_start: '08:00:00',
        override_end: '12:00:00',
        weekly_start: null,
        weekly_end: null,
      }]),
    },
  });
  assert.deepEqual(window, {
    covered: false,
    reason: 'sunday_closed',
    locationId: 1,
    isHoliday: true,
    holidayName: "National Women's Day",
    configured: true,
    permanent: true,
  });
});

test('observed Monday remains a public-holiday closure and may use existing explicit Monday special hours', async () => {
  const closed = await getClinicWindowForDate({
    locationId: 1,
    date: '2026-08-10',
    db: { query: async () => result([{
      requested_dow: 1, is_holiday: true, holiday_name: "National Women's Day observed",
      override_type: null, weekly_start: '08:00:00', weekly_end: '17:00:00',
    }]) },
  });
  assert.equal(closed.covered, false);
  assert.equal(closed.reason, 'holiday_unconfigured');
  assert.equal(closed.holidayName, "National Women's Day observed");

  const special = await getClinicWindowForDate({
    locationId: 1,
    date: '2026-08-10',
    db: { query: async () => result([{
      requested_dow: 1, is_holiday: true, holiday_name: "National Women's Day observed",
      override_type: 'open', override_start: '09:00:00', override_end: '13:00:00',
    }]) },
  });
  assert.equal(special.covered, true);
  assert.equal(special.startsLocal, '09:00:00');
  assert.equal(special.endsLocal, '13:00:00');
});

test('holiday administration refuses a direct Sunday opening without an exception or audit write', async () => {
  const originalQuery = pool.query;
  const calls = [];
  pool.query = async (sql, params) => {
    calls.push({ sql: String(sql), params });
    if (/FROM staff_admin_accounts/.test(sql)) return result([{ id: 71, display_name: 'Owner', permissions: { 'schedule:manage': true } }]);
    if (/FROM locations/.test(sql)) return result([{ id: 1, name: 'Shiloh' }]);
    if (/FROM public_holidays/.test(sql)) return result([{ holiday_date: '2026-08-09', name: "National Women's Day" }]);
    throw new Error(`Unexpected write/query: ${sql}`);
  };
  try {
    const response = await processAdminHolidayHoursMessage('27820000000', 'set holiday hours 2026-08-09 | 08:00-12:00');
    assert.equal(response.handled, true);
    assert.match(response.reply, /permanently closed on Sundays/i);
    assert.equal(calls.some(call => /INSERT INTO location_hours_exceptions|INSERT INTO crm_audit_events/.test(call.sql)), false);
  } finally {
    pool.query = originalQuery;
  }
});

test('slot SQL and SchedulingTimeline suppress Sunday clinic windows even if stale configuration exists', async () => {
  const availability = source('src/services/availabilityService.js');
  assert.match(availability, /FROM clinic_override co, requested r[\s\S]{0,100}WHERE r\.dow <> 0[\s\S]{0,100}co\.exception_type='open'/);
  assert.match(availability, /FROM location_working_hours lwh, requested r[\s\S]{0,120}r\.dow <> 0[\s\S]{0,100}lwh\.day_of_week = r\.dow/);

  const data = {
    staff: [{ id: 1, display_name: 'Practitioner', scheduling_type: 'regular' }],
    appointments: [], calendar_blocks: [], staff_schedule_exceptions: [],
    staff_recurring_day_closures: [], location_hours_exceptions: [], public_holidays: [],
    staff_working_hours: [],
    location_working_hours: [
      { location_id: 1, day_of_week: 0, starts_local: '08:00:00', ends_local: '12:00:00', active: true },
      { location_id: 1, day_of_week: 1, starts_local: '08:00:00', ends_local: '17:00:00', active: true },
    ],
  };
  const engine = createSchedulingEngine({
    query: async sql => result(data[String(sql).match(/SchedulingTimeline:([a-z_]+)/)?.[1]] || []),
    checkAvailability: async () => ({ status: 'available' }),
  });
  const timeline = await engine.listTimeline({
    from: '2026-08-09T00:00:00.000Z', to: '2026-08-11T00:00:00.000Z',
    viewer: { calendarScope: 'all_business' }, staffIds: [1],
  });
  assert.deepEqual(timeline.workingWindows.map(item => item.dayOfWeek), [1]);
});

test('migration fails closed on conflicting state and protects future Sunday scheduling without changing holiday data', () => {
  const migration = source('migrations/100_permanent_sunday_closure.sql');
  const publicHolidays = source('migrations/022_sa_public_holidays_and_location_exceptions.sql');
  assert.match(migration, /active Sunday location working hours require reconciliation/);
  assert.match(migration, /open Sunday location exceptions require reconciliation/);
  assert.match(migration, /future Sunday appointments require reconciliation/);
  assert.match(migration, /location_working_hours_sunday_closed_check/);
  assert.match(migration, /location_hours_exceptions_sunday_closed_check/);
  assert.match(migration, /appointments_permanent_sunday_closure/);
  assert.match(migration, /AT TIME ZONE 'Africa\/Johannesburg'/);
  assert.doesNotMatch(migration, /DELETE FROM|UPDATE public_holidays|INSERT INTO public_holidays/);
  assert.match(publicHolidays, /'2026-08-09','National Women''s Day',FALSE,'gov\.za'/);
  assert.match(publicHolidays, /'2026-08-10','National Women''s Day observed',TRUE,'gov\.za'/);
});

test('all active canonical booking and mutation paths retain final clinic-hours revalidation', () => {
  for (const file of [
    'src/services/adminBooking.js',
    'src/services/adminHistoricalBooking.js',
    'src/services/calendarDirectBookingConfirmation.js',
    'src/services/clientBookingCommit.js',
    'src/services/clientCouplesMassageBooking.js',
    'src/services/clientRescheduleApproval.js',
    'src/services/calendarOperationalMutations.js',
    'src/services/adminBookingUpdate.js',
    'src/services/adminBookingUpdateStateless.js',
    'src/services/appointmentChange.js',
  ]) {
    assert.match(source(file), /checkClinicHours/, `${file} must retain permanent Sunday closure authority`);
  }
});
