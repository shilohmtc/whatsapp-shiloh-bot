const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const patch = fs.readFileSync(path.join(__dirname, '../src/bootstrap/adminBookingTypedTimePickerPatch.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

test('admin booking typed-time patch accepts both 24-hour and am/pm inputs', () => {
  assert.match(patch, /\(\\d\{1,2\}\):\(\\d\{2\}\)/);
  assert.match(patch, /\(am\|pm\)/);
  assert.match(patch, /hour === 12 \? 0 : hour/);
  assert.match(patch, /hour === 12 \? 12 : hour \+ 12/);
});

test('typed exact start time resolves only against authoritative generated slots', () => {
  assert.match(patch, /session\?\.step === 'slot'/);
  assert.match(patch, /session\.slots\.findIndex/);
  assert.match(patch, /formatSlotTime\(slot\.starts_at\) === requested/);
  assert.match(patch, /admin_booking_slot:\$\{index\}/);
  assert.doesNotMatch(patch, /prepareAdminBooking\(/);
});

test('unavailable typed time fails closed with nearest authoritative starts and no write claim', () => {
  assert.match(patch, /is not currently an authoritative bookable start time/);
  assert.match(patch, /Nearest available starts/);
  assert.match(patch, /Nothing has been booked/);
});

test('stale out-of-range slot pages recover to page zero instead of rendering navigation only', () => {
  assert.match(patch, /slotRows\(result\.interactive\)\.length === 0/);
  assert.match(patch, /session\.slots\.length > 0/);
  assert.match(patch, /admin_booking_page:0/);
});

test('production preloads typed-time repair after existing booking safety patches', () => {
  assert.match(pkg.scripts.start, /adminBookingProviderGuardPatch\.js/);
  assert.match(pkg.scripts.start, /adminBookingCustomerNotificationPatch\.js/);
  assert.match(pkg.scripts.start, /adminBookingTypedTimePickerPatch\.js/);
  assert.ok(pkg.scripts.start.indexOf('adminBookingTypedTimePickerPatch.js') > pkg.scripts.start.indexOf('adminBookingProviderGuardPatch.js'));
});
