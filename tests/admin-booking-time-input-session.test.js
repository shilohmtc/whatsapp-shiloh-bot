const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminBookingTimeInputSession.js'), 'utf8');

test('admin typed reschedule session is bounded and restart-safe', () => {
  assert.match(source, /CREATE TABLE IF NOT EXISTS admin_booking_time_input_sessions/);
  assert.match(source, /phone VARCHAR\(32\) PRIMARY KEY/);
  assert.match(source, /appointment_id BIGINT NOT NULL/);
  assert.match(source, /expires_at TIMESTAMPTZ NOT NULL/);
  assert.match(source, /SESSION_TTL_MS = 30 \* 60 \* 1000/);
  assert.match(source, /DELETE FROM admin_booking_time_input_sessions WHERE phone=\$1 AND expires_at<=NOW\(\)/);
});
