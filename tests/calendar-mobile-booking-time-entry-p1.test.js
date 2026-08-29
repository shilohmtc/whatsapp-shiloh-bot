const test = require('node:test');
const assert = require('node:assert/strict');

const {
  BOOKING_TIME_INCREMENT_MINUTES,
  createCalendarCreateBookingService,
  localDateTimeFromInputs,
} = require('../src/services/calendarCreateBooking');
const { statusForError } = require('../src/routes/calendarCreateBooking');
const {
  renderCalendarCreateBookingPage,
  calendarCreateBookingClientScript,
} = require('../src/presentation/calendarCreateBookingUx');

const enabledEnv = {
  SHILOH_CALENDAR_PUBLIC_ORIGIN: 'https://shiloh.example.test',
};

function authorityRow() {
  return {
    id: 1,
    staff_id: 9,
    display_name: 'Christel',
    role: 'admin',
    business_role: 'owner',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: { 'appointment:create': true, 'client:lookup': true },
    admin_active: true,
    staff_status: 'active',
    client_bookable: true,
  };
}

function eligibleRow() {
  return {
    staff_id: 9,
    staff_name: 'Christel',
    service_id: 44,
    service_name: 'Cupping Area Specific',
    category_name: 'Massage',
    external_source: 'goldie',
    external_id: '409ef0e8-2063-47b2-86db-ca0af30787de',
    duration_minutes: 60,
    processing_time_minutes: 0,
    extra_time_minutes: 0,
    price: '500.00',
    variable_price: false,
  };
}

function createHarness(prepareBooking) {
  const state = { crmReads: 0, prepareCalls: [] };
  const db = {
    async query(sql) {
      if (String(sql).includes('FROM staff_admin_accounts a')) return { rows: [authorityRow()], rowCount: 1 };
      if (String(sql).includes('JOIN staff_services ss')) return { rows: [eligibleRow()], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    },
  };
  const crmV2Service = {
    async searchClients() { return []; },
    async createClient() { throw new Error('createClient is not used by this fixture'); },
    async getClientById() {
      state.crmReads += 1;
      return {
        id: '123', name: 'Synthetic Client', normalizedMobile: '27821234567',
        profileStatus: 'minimal', status: 'active',
      };
    },
  };
  const service = createCalendarCreateBookingService({
    db,
    env: enabledEnv,
    crmV2Service,
    prepareBooking: async (payload) => {
      state.prepareCalls.push(payload);
      return prepareBooking(payload);
    },
  });
  return { service, state };
}

test('five-minute server contract preserves exact Johannesburg-local values without date rollover', () => {
  assert.equal(BOOKING_TIME_INCREMENT_MINUTES, 5);
  const valid = [
    ['2026-08-31', '08:00', '31/08/2026 08:00'],
    ['2026-08-31', '08:05', '31/08/2026 08:05'],
    ['2026-08-31', '09:00', '31/08/2026 09:00'],
    ['2026-08-31', '09:35', '31/08/2026 09:35'],
    ['2026-09-01', '09:00', '01/09/2026 09:00'],
  ];
  for (const [date, time, expected] of valid) {
    assert.equal(localDateTimeFromInputs(date, time), expected, `${date} ${time}`);
  }
});

test('00:09 now fails with a distinct off-step contract instead of reaching clinic-hours availability', () => {
  assert.throws(
    () => localDateTimeFromInputs('2026-09-01', '00:09'),
    (error) => error?.code === 'CALENDAR_BOOKING_INVALID_TIME_INCREMENT'
      && error.message === 'Choose a start time in 5-minute increments, for example 09:00.'
  );
  try {
    localDateTimeFromInputs('2026-09-01', '00:09');
  } catch (error) {
    assert.equal(statusForError(error), 400);
  }
});

test('crafted direct prepare with 00:09 fails before CRM resolution and canonical availability', async () => {
  const { service, state } = createHarness(async () => {
    throw new Error('canonical availability must not run for an off-step time');
  });
  await assert.rejects(
    service.prepare({ adminId: 1, clientId: '123', staffId: 9, serviceId: 44, date: '2026-09-01', time: '00:09' }),
    (error) => error?.code === 'CALENDAR_BOOKING_INVALID_TIME_INCREMENT'
  );
  assert.equal(state.crmReads, 0);
  assert.equal(state.prepareCalls.length, 0);
});

test('valid outside-hours 00:10 remains literal and clinic-hours authority still owns the denial', async () => {
  const canonicalDenial = {
    status: 'outside_clinic_hours',
    reply: "Not available: the full service window falls outside the clinic's operating hours.",
  };
  const { service, state } = createHarness(async () => canonicalDenial);
  const result = await service.prepare({
    adminId: 1, clientId: '123', staffId: 9, serviceId: 44,
    date: '2026-09-01', time: '00:10',
  });
  assert.strictEqual(result, canonicalDenial);
  assert.equal(state.prepareCalls.length, 1);
  assert.equal(state.prepareCalls[0].localDateTime, '01/09/2026 00:10');
});

test('Create Booking keeps native controls and validates/readbacks local inputs before prepare', () => {
  const html = renderCalendarCreateBookingPage({
    date: '2026-08-31',
    options: {
      staff: [{ id: 9, displayName: 'Christel', serviceIds: [44] }],
      services: [{
        id: 44, name: 'Cupping Area Specific', categoryName: 'Massage',
        externalSource: 'goldie', externalId: '409ef0e8-2063-47b2-86db-ca0af30787de',
        staffIds: [9],
      }],
    },
  });
  const script = calendarCreateBookingClientScript();
  assert.match(html, /<input id="booking-date" type="date"[^>]*required>/);
  assert.match(html, /<input id="booking-time" type="time" step="300" required>/);
  assert.match(html, /<output class="selected-start" data-selected-start for="booking-date booking-time" role="status" aria-live="polite" aria-atomic="true">/);
  assert.match(html, /"serviceFamily":\{"key":"targeted_therapeutic"/);
  assert.match(html, /Choose the client, treatment, practitioner and time\./);

  const localInputStart = script.indexOf('function leapYear');
  const localInputEnd = script.indexOf('function formatDate');
  const localInputSource = script.slice(localInputStart, localInputEnd);
  assert.ok(localInputStart >= 0 && localInputEnd > localInputStart);
  assert.doesNotMatch(localInputSource, /new Date|Date\.UTC|toISOString|Intl\.DateTimeFormat/);
  assert.match(localInputSource, /START_INCREMENT_MINUTES/);
  assert.match(localInputSource, /WEEKDAY_NAMES\[weekdayIndex\(date\)\]\+' '\+date\.day\+' '\+MONTH_NAMES/);

  const prepareStart = script.indexOf('async function prepare()');
  const prepareEnd = script.indexOf('async function acknowledge()');
  const prepareSource = script.slice(prepareStart, prepareEnd);
  assert.ok(prepareStart >= 0 && prepareEnd > prepareStart);
  assert.ok(prepareSource.indexOf('startInputState(true)') < prepareSource.indexOf("post(API+'/prepare'"));
  assert.match(prepareSource, /if\(!start\.ok\)\{setStatus\(start\.message,'error'\);return;}/);
  assert.match(script, /Choose a start time in 5-minute increments, for example 09:00\./);
  assert.match(script, /addEventListener\('input',handleStartInput\)/);
});
