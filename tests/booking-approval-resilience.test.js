const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('approval resend delivery records accepted message id and attempt state', () => {
  const pending = source('src/services/adminPendingBookingApprovals.js');
  assert.match(pending, /approver_notification_attempts/);
  assert.match(pending, /approver_message_id/);
  assert.match(pending, /last_approver_notification_attempt_at/);
  assert.match(pending, /messages\?\.\[0\]\?\.id/);
});

test('pending approvals are discoverable and explicitly resendable without recreating appointments', () => {
  const pending = source('src/services/adminPendingBookingApprovals.js');
  assert.match(pending, /aba\.status\s*=\s*'pending'/);
  assert.match(pending, /resend_booking_approval_/);
  assert.match(pending, /sendWhatsAppTemplate/);
  assert.doesNotMatch(pending, /INSERT INTO appointments|createBookingEvent|commitClientBooking/);
});

test('appointments admin exposes and routes pending booking approvals', () => {
  const interactive = source('src/services/adminInteractiveMenu.js');
  assert.match(interactive, /Pending approvals/);
  assert.match(interactive, /admin_action_pending_approvals/);
  assert.match(interactive, /processAdminPendingBookingApprovalsMessage/);
  const pendingRoute = interactive.indexOf('processAdminPendingBookingApprovalsMessage(sender, text)');
  const genericRoute = interactive.indexOf('processAdminMobileMenuMessage(sender, text)');
  assert.ok(pendingRoute > genericRoute, 'pending approvals must sit behind the exact-one active Admin gate');
});

test('resend path is pending-only auditable and does not decide approval', () => {
  const pending = source('src/services/adminPendingBookingApprovals.js');
  assert.match(pending, /client\.booking_approval\.notification_attempted/);
  assert.match(pending, /WHERE appointment_id\s*=\s*\$1 AND status\s*=\s*'pending'/);
  assert.doesNotMatch(pending, /SET status\s*=\s*'approved'|SET status\s*=\s*'declined'/);
});

test('approval resend uses exact approved five-parameter template and ordered decision payloads', () => {
  const pending = source('src/services/adminPendingBookingApprovals.js');
  assert.match(pending, /APPROVAL_TEMPLATE_NAME = 'shiloh_booking_approval_request_v1'/);
  assert.match(pending, /\[row\.client_name,\s*row\.service_name,\s*row\.staff_name,\s*fmtDateTime\(row\.starts_at\),\s*String\(appointmentId\)\]/);
  assert.match(pending, /`\$\{APPROVE_PREFIX\}\$\{appointmentId\}`,\s*`\$\{DECLINE_PREFIX\}\$\{appointmentId\}`/);
  assert.match(pending, /approver_template_name\s*=\s*\$3/);
  assert.doesNotMatch(pending, /sendWhatsAppReplyButtons/);
});
