const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('approval delivery records accepted message id and attempt state', () => {
  const approval = source('src/services/clientBookingApproval.js');
  assert.match(approval, /approver_notification_attempts/);
  assert.match(approval, /approver_message_id/);
  assert.match(approval, /last_approver_notification_attempt_at/);
  assert.match(approval, /messages\?\.\[0\]\?\.id/);
});

test('pending approvals are discoverable and explicitly resendable without recreating appointments', () => {
  const pending = source('src/services/adminPendingBookingApprovals.js');
  assert.match(pending, /status = 'pending'/);
  assert.match(pending, /resend_booking_approval_/);
  assert.match(pending, /requestPractitionerApproval/);
  assert.doesNotMatch(pending, /INSERT INTO appointments|createBookingEvent|commitClientBooking/);
});

test('appointments admin exposes pending booking approvals', () => {
  const menu = source('src/services/adminAppointmentsMenu.js');
  const interactive = source('src/services/adminInteractiveMenu.js');
  assert.match(menu, /Pending approvals/);
  assert.match(interactive, /pending_approvals/);
});

test('resend path is pending-only and auditable', () => {
  const approval = source('src/services/clientBookingApproval.js');
  assert.match(approval, /forceResend/);
  assert.match(approval, /client\.booking_approval\.notification_attempted/);
  assert.match(approval, /status = 'pending'/);
});
