const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const source = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

test('admin guided booking routes past dates into historical manual entry instead of slot search', () => {
  const flow = source('src/services/adminMobileBookingFlow.js');
  assert.match(flow, /date<johannesburgToday\(\)/);
  assert.match(flow, /step:'historical-time'/);
  assert.match(flow, /Enter the actual start time/);
  assert.match(flow, /prepareHistoricalAdminBooking/);
  assert.match(flow, /confirmHistoricalAdminBooking/);
  assert.match(flow, /futureBias:false/);
});

test('historical booking writes CRM only and does not create past calendar events or client messages', () => {
  const historical = source('src/services/adminHistoricalBooking.js');
  assert.match(historical, /shiloh_admin_historical_manual/);
  assert.match(historical, /admin\.historical_booking_created/);
  assert.match(historical, /customerMessageSent: false/);
  assert.match(historical, /sharedGoogleCalendarChecked: false/);
  assert.match(historical, /practitionerGoogleCalendarChecked: false/);
  assert.doesNotMatch(historical, /createBookingEvent/);
  assert.doesNotMatch(historical, /createPractitionerBookingEvent/);
  assert.doesNotMatch(historical, /sendWhatsAppMessage/);
});

test('historical manual booking remains guarded by clinic schedule eligibility and CRM conflict checks', () => {
  const historical = source('src/services/adminHistoricalBooking.js');
  assert.match(historical, /staff_services/);
  assert.match(historical, /checkClinicHours/);
  assert.match(historical, /checkAuthoritativeSchedule/);
  assert.match(historical, /getConflicts/);
  assert.match(historical, /pg_advisory_xact_lock/);
  assert.match(historical, /Nothing was written/);
});
