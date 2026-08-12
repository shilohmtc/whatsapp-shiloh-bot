const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const google = fs.readFileSync(path.join(root, 'src/services/googleBookingCalendar.js'), 'utf8');
const practitioner = fs.readFileSync(path.join(root, 'src/services/practitionerGoogleCalendar.js'), 'utf8');
const booking = fs.readFileSync(path.join(root, 'src/services/adminBooking.js'), 'utf8');
const flow = fs.readFileSync(path.join(root, 'src/services/adminMobileBookingFlow.js'), 'utf8');

test('verified practitioner calendars are explicit environment-backed mappings', () => {
  assert.match(google, /GOOGLE_CHRISTEL_CALENDAR_ID/);
  assert.match(google, /GOOGLE_ABIGAIL_CALENDAR_ID/);
  assert.match(google, /GOOGLE_MARIETJIE_CALENDAR_ID/);
  assert.match(practitioner, /GOOGLE_CHRISTEL_CALENDAR_ID/);
  assert.match(practitioner, /GOOGLE_ABIGAIL_CALENDAR_ID/);
  assert.match(practitioner, /GOOGLE_MARIETJIE_CALENDAR_ID/);
});

test('guided client booking cannot expose internal freelancers as practitioner choices', () => {
  assert.match(flow, /st\.client_bookable=TRUE/);
  assert.match(flow, /no eligible practitioner in your booking scope is currently mapped/);
});

test('booking confirmation checks and creates both shared and practitioner calendar events', () => {
  assert.match(booking, /checkPractitionerCalendarAvailability/);
  assert.match(booking, /createPractitionerBookingEvent/);
  assert.match(booking, /practitionerGoogleCalendarChecked/);
  assert.match(booking, /Shiloh — Bookings: synced/);
  assert.match(booking, /Google Calendar: synced/);
});

test('practitioner mirror uses the same deterministic CRM appointment event id', () => {
  assert.match(practitioner, /deterministicEventId\(`shiloh-appointment:\$\{appointmentId\}`\)/);
  assert.match(practitioner, /getBookingEventOnCalendar\(eventId, calendarId\)/);
});

test('canonical availability check includes direct events on practitioner calendar', () => {
  assert.match(google, /practitionerCalendarIdForStaff\(staffName\)/);
  assert.match(google, /staffName:null,ignoreEventId/);
  assert.match(google, /available:shared\.available&&practitioner\.available/);
});

test('canonical event updates move or upsert the practitioner mirror', () => {
  assert.match(google, /oldCalendarId&&oldCalendarId!==newCalendarId/);
  assert.match(google, /cancelBookingEventOnCalendar\(data\.eventId,oldCalendarId\)/);
  assert.match(google, /upsertBookingEventOnCalendar\(newCalendarId/);
});

test('canonical cancellation removes practitioner mirror before shared event', () => {
  const fn = google.match(/async function cancelBookingEvent\(eventId\)\{[\s\S]*?\nmodule\.exports/);
  assert.ok(fn, 'cancelBookingEvent wrapper must exist');
  const text = fn[0];
  assert.ok(text.indexOf('cancelBookingEventOnCalendar(eventId,practitionerCalendarId)') < text.indexOf('cancelBookingEventOnCalendar(eventId,sharedCalendarId)'), 'practitioner mirror should be removed before shared event');
});

test('rollback compensation is proof-bound to the created appointment id', () => {
  assert.match(booking, /practitionerEventAppointmentId = appointment\.id/);
  assert.match(booking, /cancelPractitionerBookingEvent\(\{ appointmentId: practitionerEventAppointmentId, staffName: practitionerEventStaffName \}\)/);
  assert.doesNotMatch(booking, /cancelPractitionerBookingEvent\(\{ appointmentId: null/);
});
