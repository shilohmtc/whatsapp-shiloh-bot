const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const commitPath = path.join(root, 'src', 'services', 'clientBookingCommit.js');
const approvalPath = path.join(root, 'src', 'services', 'clientBookingApproval.js');
const availabilityPath = path.join(root, 'src', 'services', 'availabilityService.js');
const confirmationPath = path.join(root, 'src', 'services', 'customerBookingConfirmation.js');
const webhookPath = path.join(root, 'src', 'controllers', 'webhookController.js');

const commit = fs.readFileSync(commitPath, 'utf8');
const availability = fs.readFileSync(availabilityPath, 'utf8');
const confirmation = fs.readFileSync(confirmationPath, 'utf8');
const webhook = fs.readFileSync(webhookPath, 'utf8');

test('client booking commit creates a durable approval hold rather than final confirmation', () => {
  assert.equal(fs.existsSync(approvalPath), true, 'clientBookingApproval service must exist');
  assert.match(commit, /createPendingBookingApproval|requestPractitionerApproval/);
  assert.match(commit, /awaiting practitioner approval|pending approval|held for approval/i);
  assert.doesNotMatch(commit, /Your appointment is now confirmed in Shiloh’s canonical CRM/);
});

test('pending approval has no automatic expiry and remains an availability conflict', () => {
  assert.match(availability, /a\.status <> 'cancelled'/);
  const approval = fs.existsSync(approvalPath) ? fs.readFileSync(approvalPath, 'utf8') : '';
  assert.doesNotMatch(approval, /expires_at|expiry|expirePending|setTimeout|TTL/i);
  assert.match(approval, /status[^\n]*(pending|approved|declined)/i);
});

test('assigned practitioner is the sole required approver and Abigail has Christel as observer only', () => {
  const approval = fs.existsSync(approvalPath) ? fs.readFileSync(approvalPath, 'utf8') : '';
  assert.match(approval, /required_approver_staff_id|approver_staff_id/);
  assert.match(approval, /observer_staff_id/);
  assert.match(approval, /Abigail/i);
  assert.match(approval, /Christel/i);
  assert.match(approval, /observer/i);
});

test('approval unlocks final customer confirmation while decline releases the held slot', () => {
  const approval = fs.existsSync(approvalPath) ? fs.readFileSync(approvalPath, 'utf8') : '';
  assert.match(approval, /sendCustomerBookingConfirmationForAppointment/);
  assert.match(approval, /approved/);
  assert.match(approval, /declined/);
  assert.match(approval, /status\s*=\s*'cancelled'|SET status = 'cancelled'/);
  assert.match(confirmation, /Booking confirmed/);
});

test('approval decisions are authorized through the WhatsApp admin identity and routed before generic admin handling', () => {
  const approval = fs.existsSync(approvalPath) ? fs.readFileSync(approvalPath, 'utf8') : '';
  assert.match(approval, /staff_admin_accounts/);
  assert.match(approval, /normalized_whatsapp/);
  assert.match(webhook, /processClientBookingApprovalMessage/);
});
