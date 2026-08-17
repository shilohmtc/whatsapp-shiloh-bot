const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'services', 'adminMobileBookingFlow.js'),
  'utf8'
);

test('active admin booking recognizes the full Admin navigation escape surface', () => {
  assert.match(source, /function isGreeting\(v=''\).*hi\|hello\|hey\|howzit\|hiya\|good morning\|good afternoon\|good evening/s);
  assert.match(source, /function isNavigationEscape\(v=''\).*\['menu','admin menu','home','admin'\]\.includes\(n\)\|\|isGreeting\(v\)/s);
});

test('booking session is cleared before global navigation yields to the Admin router', () => {
  assert.match(
    source,
    /if\(session&&isNavigationEscape\(raw\)\)\{if\(\['confirm','historical-confirm'\]\.includes\(session\.step\)\)await cancelPendingBooking\(admin\.id\);await deleteSession\(k\);return\{handled:false\};\}/
  );
});

test('invalid slot input remains fail-safe inside the slot picker', () => {
  assert.match(
    source,
    /if\(session\.step==='slot'\).*if\(!slot\)return\{handled:true,admin,interactive:slotsInteractive\(session,session\.page\|\|0\)\}/s
  );
});
