const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'bootstrap', 'adminBookingChangeConfirmationCommitPatch.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

test('confirmed reschedule clears preview context before replaying guarded commit', () => {
  assert.match(source, /manage_quick_reschedule_confirm_/);
  assert.match(source, /clearAdminBookingTimeInputSession/);
  assert.match(source, /return original\(sender, text/);
});

test('commit bridge is preloaded after confirmation and authorization layers', () => {
  const start = pkg.scripts.start;
  const confirm = start.indexOf('adminBookingChangeConfirmationPatch.js');
  const auth = start.indexOf('adminBookingChangeConfirmationAuthPatch.js');
  const commit = start.indexOf('adminBookingChangeConfirmationCommitPatch.js');
  assert.ok(confirm >= 0 && auth > confirm && commit > auth);
});

test('commit bridge itself has no direct appointment mutation capability', () => {
  assert.doesNotMatch(source, /UPDATE\s+appointments/i);
  assert.doesNotMatch(source, /UPDATE\s+appointment_services/i);
});
