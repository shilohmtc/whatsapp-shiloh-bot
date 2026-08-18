const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sessionSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminMobileBookingSession.js'), 'utf8');
const bookingSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminMobileBookingFlow.js'), 'utf8');

test('guided admin booking state is backed by a bounded durable session ledger', () => {
  assert.match(sessionSource, /CREATE TABLE IF NOT EXISTS admin_mobile_booking_flow_sessions/);
  assert.match(sessionSource, /state JSONB NOT NULL/);
  assert.match(sessionSource, /expires_at TIMESTAMPTZ NOT NULL/);
  assert.match(sessionSource, /SESSION_TTL_MS = 30 \* 60 \* 1000/);
  assert.match(sessionSource, /ON CONFLICT \(phone\) DO UPDATE SET/);
  assert.match(sessionSource, /DELETE FROM admin_mobile_booking_flow_sessions WHERE phone = \$1/);
});

test('booking flow restores durable state before deciding a bare date is not its command', () => {
  assert.match(bookingSource, /const session = await getSession\(k\);\s*const direct =/);
  assert.match(bookingSource, /loadAdminMobileBookingSession\(k\)/);
  assert.match(bookingSource, /if \(!session && !direct\) return \{ handled: false \}/);
  assert.match(bookingSource, /await setSession\(k, \{ step: 'date', staff, service: session\.service \}\)/);
  assert.match(bookingSource, /Historical manual booking/);
});

test('guided booking clears durable state on completion, cancellation, and global Admin navigation escape', () => {
  assert.match(bookingSource, /async function deleteSession\(k\).*clearAdminMobileBookingSession\(k\)/s);
  assert.match(bookingSource, /if \(session && isNavigationEscape\(raw\)\).*await deleteSession\(k\).*return \{ handled: false \}/s);
  assert.match(bookingSource, /mobile_booking\.historical_confirmed.*appointmentId.*return/s);
  assert.match(bookingSource, /await deleteSession\(k\);\s*await audit\(admin\.id, 'mobile_booking\.historical_confirmed'/);
});
