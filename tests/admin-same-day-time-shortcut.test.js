const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'bootstrap', 'adminBookingNaturalDatePatch.js'), 'utf8');

test('admin booking time shortcut accepts HH:MM after Change date/time', () => {
  assert.ok(source.includes("raw.match(/^manage_change_time_(\\d+)$/i)"));
  assert.match(source, /activeTimeBookingBySender/);
  assert.ok(source.includes("(?:[01]?\\d|2[0-3]):[0-5]\\d"));
  assert.match(source, /SELECT starts_at FROM appointments/);
  assert.match(source, /Africa\/Johannesburg/);
  assert.match(source, /manage_quick_reschedule_slot_/);
});

test('same-day shortcut delegates to the existing guarded reschedule path', () => {
  assert.match(source, /originalImmediate\(sender, `manage_quick_reschedule_slot_/);
  assert.match(source, /if \(result\?\.handled\) activeTimeBookingBySender\.delete\(key\)/);
});
