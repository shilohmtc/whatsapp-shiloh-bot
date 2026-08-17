const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminBookingUpdateStateless.js'), 'utf8');

test('manage-booking exposes package session only through a paid active client entitlement', () => {
  assert.match(source, /client_package_entitlements/);
  assert.match(source, /e\.status='active'/);
  assert.match(source, /e\.payment_status='paid'/);
  assert.match(source, /NOW\(\) >= e\.starts_at AND NOW\(\) < e\.expires_at/);
  assert.match(source, /credits_remaining/);
  assert.match(source, /Package credit/);
});

test('package conversion reserves a credit and makes the prepaid appointment zero due', () => {
  assert.match(source, /INSERT INTO package_session_redemptions/);
  assert.match(source, /price_snapshot=0/);
  assert.match(source, /total_price=0/);
  assert.match(source, /packageCreditReserved: true/);
});

test('package conversion retains schedule and calendar conflict checks', () => {
  assert.match(source, /checkClinicHours/);
  assert.match(source, /checkAuthoritativeSchedule/);
  assert.match(source, /checkCalendarAvailability/);
  assert.match(source, /updateBookingEvent/);
});
