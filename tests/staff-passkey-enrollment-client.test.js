const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ux = fs.readFileSync(path.join(__dirname, '../src/presentation/staffPasskeyUx.js'), 'utf8');
const middleware = fs.readFileSync(path.join(__dirname, '../src/middleware/staffBrowserSession.js'), 'utf8');

test('#794 passkey enrollment sends the canonical Shiloh CSRF header', () => {
  assert.match(middleware, /x-shiloh-csrf-token/);
  assert.match(ux, /'x-shiloh-csrf-token':csrf/);
  assert.doesNotMatch(ux, /'X-CSRF-Token':csrf/);
});

test('#794 passkey enrollment click gives visible progress and device failure feedback', () => {
  assert.match(ux, /Preparing secure passkey setup/);
  assert.match(ux, /Approve passkey creation on this device/);
  assert.match(ux, /SecurityError/);
});
