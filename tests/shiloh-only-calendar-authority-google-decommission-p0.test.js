const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const source = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const google = require('../src/services/googleBookingCalendar');
const practitioner = require('../src/services/practitionerGoogleCalendar');

test('configured Google calendars are operationally disabled without disconnecting configuration', async () => {
  const original = {
    enabled: process.env.GOOGLE_CALENDAR_ENABLED,
    shared: process.env.GOOGLE_BOOKING_CALENDAR_ID,
    abigail: process.env.GOOGLE_ABIGAIL_CALENDAR_ID,
  };
  const previousFetch = global.fetch;
  let providerCalls = 0;
  process.env.GOOGLE_CALENDAR_ENABLED = 'true';
  process.env.GOOGLE_BOOKING_CALENDAR_ID = 'configured-shared-snapshot';
  process.env.GOOGLE_ABIGAIL_CALENDAR_ID = 'configured-abigail-snapshot';
  global.fetch = async () => { providerCalls += 1; throw new Error('provider must not be called'); };
  try {
    assert.equal(google.SHILOH_CALENDAR_SOLE_AUTHORITY, true);
    assert.equal(google.legacyCalendarConfigured(), true);
    assert.equal(google.calendarEnabled(), false);
    assert.deepEqual(await google.checkCalendarAvailability({ startsAt: new Date(), endsAt: new Date() }), { enabled: false, available: true, conflicts: [] });
    assert.equal((await google.checkCalendarAvailabilityOnCalendar('configured', {})).decommissioned, true);
    assert.equal((await google.createBookingEvent({ appointmentId: 991 })).event, null);
    assert.equal((await google.createBookingEventOnCalendar('configured', { appointmentId: 991 })).event, null);
    assert.equal(await google.getBookingEvent('legacy-event'), null);
    assert.equal(await google.getBookingEventOnCalendar('legacy-event', 'configured'), null);
    assert.equal(await google.findBookingEventByAppointmentId(991), null);
    assert.equal(await google.findBookingEventByAppointmentIdOnCalendar(991, 'configured'), null);
    assert.equal((await google.updateBookingEvent({ eventId: 'legacy-event' })).event, null);
    assert.equal((await google.updateBookingEventOnCalendar('configured', { eventId: 'legacy-event' })).event, null);
    assert.equal((await google.cancelBookingEvent('legacy-event')).cancelled, false);
    assert.equal((await google.cancelBookingEventOnCalendar('legacy-event', 'configured')).cancelled, false);
    assert.equal((await practitioner.checkPractitionerCalendarAvailability({ staffName: 'Abigail' })).enabled, false);
    assert.equal((await practitioner.createPractitionerBookingEvent({ appointmentId: 991, staffName: 'Abigail' })).event, null);
    assert.equal((await practitioner.syncPractitionerBookingEvent({ appointmentId: 991, staffName: 'Abigail' })).event, null);
    assert.equal((await practitioner.cancelPractitionerBookingEvent({ appointmentId: 991, staffName: 'Abigail' })).cancelled, false);
    assert.equal(providerCalls, 0);
    assert.equal(process.env.GOOGLE_BOOKING_CALENDAR_ID, 'configured-shared-snapshot');
    assert.equal(process.env.GOOGLE_ABIGAIL_CALENDAR_ID, 'configured-abigail-snapshot');
  } finally {
    global.fetch = previousFetch;
    if (original.enabled === undefined) delete process.env.GOOGLE_CALENDAR_ENABLED; else process.env.GOOGLE_CALENDAR_ENABLED = original.enabled;
    if (original.shared === undefined) delete process.env.GOOGLE_BOOKING_CALENDAR_ID; else process.env.GOOGLE_BOOKING_CALENDAR_ID = original.shared;
    if (original.abigail === undefined) delete process.env.GOOGLE_ABIGAIL_CALENDAR_ID; else process.env.GOOGLE_ABIGAIL_CALENDAR_ID = original.abigail;
  }
});

test('all active booking, availability and lifecycle paths are Shiloh-only', () => {
  const activePaths = [
    'src/services/adminBooking.js',
    'src/services/adminHistoricalBooking.js',
    'src/services/adminBookingUpdate.js',
    'src/services/adminBookingUpdateStateless.js',
    'src/services/adminBookingNextAvailable.js',
    'src/services/adminAppointmentCancellation.js',
    'src/services/clientBookingCommit.js',
    'src/services/clientCouplesMassageBooking.js',
    'src/services/clientBookingApproval.js',
    'src/services/clientRescheduleAvailability.js',
    'src/services/clientRescheduleApproval.js',
    'src/services/appointmentChange.js',
    'src/services/adminAvailability.js',
    'src/services/availabilityService.js',
    'src/services/schedulingEngine.js',
    'src/bootstrap/adminBookingChangeConfirmationPatch.js',
    'src/bootstrap/clientMultiStaffAppointmentChangePatch.js',
  ];
  for (const relativePath of activePaths) {
    const text = source(relativePath);
    assert.doesNotMatch(text, /require\(['"]\.\/(?:googleBookingCalendar|practitionerGoogleCalendar)['"]\)/, relativePath);
    assert.doesNotMatch(text, /\b(?:create|update|cancel|sync|find|check)(?:Practitioner)?BookingEvent\b|\bcheckCalendarAvailability\b/, relativePath);
    assert.doesNotMatch(text, /appointment_calendar_events/, relativePath);
    assert.doesNotMatch(text, /Google Calendar/, relativePath);
  }
});

test('canonical final conflict and P0 delivery/security authority remain in the commit path', () => {
  const staffCommit = source('src/services/adminBooking.js');
  const clientCommit = source('src/services/clientBookingCommit.js');
  for (const text of [staffCommit, clientCommit]) {
    const lock = text.indexOf('pg_advisory_xact_lock');
    const conflict = text.indexOf('getConflicts', lock);
    const insert = text.indexOf('INSERT INTO appointments', conflict);
    assert.ok(lock >= 0 && conflict > lock && insert > conflict, 'canonical conflict must be rechecked under lock before appointment insert');
    assert.match(text, /staff_services/);
    assert.match(text, /checkClinicHours/);
    assert.match(text, /checkAuthoritativeSchedule/);
  }
  assert.match(staffCommit, /queueCustomerBookingConfirmation[\s\S]*sendCustomerBookingConfirmationForAppointment/);
  assert.match(staffCommit, /schedulingAuthority: "shiloh_canonical"/);
  assert.match(source('src/services/calendarCreateBooking.js'), /serviceIds|serviceScope|staff_services/);
  assert.match(source('src/routes/calendarReadOnlyUx.js'), /CALENDAR_VIEWER_CONTEXT|server_staff_session/);
});

test('cockpit renders complete canonical cards and suppresses external debug cards without contact PII', () => {
  const presentation = source('src/presentation/calendarReadOnlyUx.js');
  const engine = source('src/services/schedulingEngine.js');
  assert.match(engine, /clientName: row\.client_name/);
  assert.match(engine, /serviceName: row\.service_name/);
  assert.match(presentation, /formatRange\(item\)/);
  assert.match(presentation, /item\.clientName/);
  assert.match(presentation, /item\.serviceName/);
  assert.match(presentation, /staffNamesFor/);
  assert.match(presentation, /item\.status/);
  assert.match(presentation, /Appointment #\$\{escapeHtml\(item\.id\)\}/);
  assert.match(presentation, /item\.canonical !== false/);
  assert.doesNotMatch(presentation, /Google-only|Non-canonical|PR #395|clientMobile|normalized_value|contact/i);
});

test('the change contains no appointment-specific mutation or configuration disconnect', () => {
  const changedSources = [
    'src/services/googleBookingCalendar.js',
    'src/services/schedulingEngine.js',
    'src/services/availabilityService.js',
  ].map(source).join('\n');
  assert.doesNotMatch(changedSources, /appointment\s*#?592|appointment_id\s*=\s*592|process\.env\.GOOGLE_[A-Z_]+\s*=/i);
  assert.doesNotMatch(source('package.json'), /googleapis/);
});
