const fs = require('fs');
const path = require('path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('declined booking outcome offers Book another time button with BOOKING fallback', () => {
  const source = read('src/services/clientBookingApproval.js');
  expect(source).toContain("title: 'Book another time'");
  expect(source).toContain("id: 'BOOKING'");
  expect(source).toContain('sendWhatsAppReplyButtons(phone');
  expect(source).toContain('type *BOOKING*');
});

test('booking policy shows friendly updated date but preserves immutable internal version', () => {
  const source = read('src/services/bookingPolicy.js');
  expect(source).toContain('const POLICY_VERSION = "2026-08-11-v1"');
  expect(source).toContain('Policy updated: 11 August 2026');
  expect(source).not.toContain('`Policy version: ${POLICY_VERSION}`');
  expect(source).toContain('policy_version = $2');
  expect(source).toContain('POLICY_VERSION,');
});
