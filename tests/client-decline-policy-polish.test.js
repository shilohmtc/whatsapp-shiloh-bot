const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
function read(relativePath) { return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8'); }
test('cannot-accommodate outcome uses the retained client template and canonical restart payload', () => { const source = read('src/services/clientBookingApproval.js'); const interactive = read('src/services/clientBookingInteractive.js'); assert.match(source, /shiloh_booking_declined_v1/); assert.match(source, /\['client_booking_start'\]/); assert.match(interactive, /client_booking_start: 'services'/); });
test('booking policy shows friendly updated date but preserves immutable internal version', () => { const source = read('src/services/bookingPolicy.js'); assert.match(source, /const POLICY_VERSION = "2026-08-11-v1"/); assert.match(source, /Policy updated: 11 August 2026/); assert.doesNotMatch(source, /`Policy version: \$\{POLICY_VERSION\}`/); assert.match(source, /policy_version = \$2/); assert.match(source, /POLICY_VERSION/); });
