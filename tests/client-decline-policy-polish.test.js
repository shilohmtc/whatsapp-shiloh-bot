const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
function read(relativePath) { return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8'); }
test('declined booking outcome offers Book another time button with BOOKING fallback', () => { const source = read('src/services/clientBookingApproval.js'); assert.match(source, /title: 'Book another time'/); assert.match(source, /id: 'BOOKING'/); assert.match(source, /sendWhatsAppReplyButtons\(phone/); assert.match(source, /type \*BOOKING\*/); });
test('booking policy shows friendly updated date but preserves immutable internal version', () => { const source = read('src/services/bookingPolicy.js'); assert.match(source, /const POLICY_VERSION = "2026-08-11-v1"/); assert.match(source, /Policy updated: 11 August 2026/); assert.doesNotMatch(source, /`Policy version: \$\{POLICY_VERSION\}`/); assert.match(source, /policy_version = \$2/); assert.match(source, /POLICY_VERSION/); });
