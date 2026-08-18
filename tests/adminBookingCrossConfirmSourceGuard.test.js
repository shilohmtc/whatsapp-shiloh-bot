const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('cross-confirm patch retains fail-closed ambiguity and dual-identity audit markers', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/bootstrap/adminBookingCrossConfirmPatch.js'), 'utf8');
  assert.match(source, /sessions\.length > 1/);
  assert.match(source, /admin\.booking_cross_confirmation_claimed/);
  assert.match(source, /preparedByAdminId/);
  assert.match(source, /confirmedByAdminId/);
  assert.match(source, /appointment:create/);
});
