const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminMobileBookingFlow.js'), 'utf8');

test('active admin booking recognizes the full Admin navigation escape surface', () => {
  assert.match(source, /function isGreeting\(v\s*=\s*''\).*good evening.*clean\(v\)/);
  assert.match(source, /function isNavigationEscape\(v\s*=\s*''\).*\['menu',\s*'admin menu',\s*'home',\s*'admin'\].*isGreeting\(v\)/);
});

test('booking session is cleared before global navigation yields to the Admin router', () => {
  assert.match(source, /if \(session && isNavigationEscape\(raw\)\)[\s\S]*?await deleteSession\(k\);[\s\S]*?return \{ handled: false \};/);
});

test('invalid slot input remains fail-safe inside the slot picker', () => {
  assert.match(source, /if \(!slot\) return \{ handled: true, admin, interactive: slotsInteractive\(session, session\.page \|\| 0\) \};/);
});
