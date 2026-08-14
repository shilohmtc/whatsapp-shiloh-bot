const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const approvalPath = path.join(root, 'src', 'services', 'clientBookingApproval.js');
const schemaPath = path.join(root, 'src', 'services', 'clientBookingApprovalSchema.js');
const policyPath = path.join(root, 'src', 'services', 'bookingPolicy.js');
const availabilityPath = path.join(root, 'src', 'services', 'availabilityService.js');
const confirmationPath = path.join(root, 'src', 'services', 'customerBookingConfirmation.js');
const webhookPath = path.join(root, 'src', 'controllers', 'webhookController.js');

const approval = fs.readFileSync(approvalPath, 'utf8');
const schema = fs.readFileSync(schemaPath, 'utf8');
const policy = fs.readFileSync(policyPath, 'utf8');
const availability = fs.readFileSync(availabilityPath, 'utf8');
const confirmation = fs.readFileSync(confirmationPath, 'utf8');
const webhook = fs.readFileSync(webhookPath, 'utf8');

test('client booking completion is converted to a durable pending-approval hold before client delivery', () => {
  assert.match(policy, /ensureBookingApprovalInfrastructure/);
  assert.match(policy, /createPendingBookingApproval/);
  assert.match(policy, /requestPractitionerApproval/);
  assert.match(policy, /status: ["']pending_approval["']/);
  assert.match(policy, /not yet confirmed/);
  assert.doesNotMatch(policy, /Booking created successfully\s*[—-]\s*appointment/);
});

test('approval hold is inserted atomically with client appointment staff and has no automatic expiry', () => {
  assert.match(schema, /CREATE TRIGGER trg_client_booking_approval_hold/);
  assert.match(schema, /AFTER INSERT ON appointment_staff/);
  assert.match(schema, /shiloh_client_whatsapp/);
  assert.match(schema, /VALUES \(NEW\.appointment_id, NEW\.staff_id, observer_id, 'pending'\)/);
  assert.doesNotMatch(schema, /expires_at|expiry|expirePending|setTimeout|TTL/i);
  assert.doesNotMatch(approval, /expires_at|expiry|expirePending|setTimeout|TTL/i);
});

test('pending approval remains an availability conflict until an explicit decision', () => {
  assert.match(availability, /a\.status <> 'cancelled'/);
  assert.match(approval, /status[^\n]*(pending|approved|declined)/i);
});

test('Abigail bookings allow either Abigail or Christel to make the first authoritative decision', () => {
  assert.match(approval, /approver_staff_id/);
  assert.match(approval, /observer_staff_id/);
  assert.match(approval, /Abigail/i);
  assert.match(approval, /Christel/i);
  assert.match(approval, /isAuthorizedDecisionMaker|authorizedDecisionMaker/i);
  assert.match(approval, /observer_staff_id[^\n]*admin\.staff_id|admin\.staff_id[^\n]*observer_staff_id/);
  assert.match(approval, /sendWhatsAppReplyButtons\([^\n]*observer/i);
  assert.doesNotMatch(approval, /no approval is required from you/i);
  assert.match(schema, /LOWER\(COALESCE\(NEW\.staff_name_snapshot/);
  assert.match(schema, /= 'abigail'/);
  assert.match(schema, /LOWER\(display_name\) = 'christel'/);
});

test('Marietjie and Christel bookings remain self-approval only', () => {
  assert.match(approval, /Number\(context\.approver_staff_id\) === Number\(admin\.staff_id\)/);
  assert.match(approval, /context\.observer_staff_id/);
});

test('approval unlocks final customer confirmation while decline releases the held slot', () => {
  assert.match(approval, /sendCustomerBookingConfirmationForAppointment/);
  assert.match(approval, /status = 'approved'/);
  assert.match(approval, /status = 'declined'/);
  assert.match(approval, /SET status = 'cancelled'/);
  assert.match(approval, /cancelBookingEvent/);
  assert.match(approval, /cancelPractitionerBookingEvent/);
  assert.match(confirmation, /Booking confirmed/);
});

test('approval decisions are authorized through WhatsApp admin identity and routed before generic admin handling', () => {
  assert.match(approval, /staff_admin_accounts/);
  assert.match(approval, /normalized_whatsapp/);
  assert.match(webhook, /processClientBookingApprovalMessage/);
  const approvalRoute = webhook.indexOf('processClientBookingApprovalMessage(from,text)');
  const genericAdminRoute = webhook.indexOf('processAdminInteractiveMenuMessage(from,text)');
  assert.ok(approvalRoute >= 0 && genericAdminRoute >= 0 && approvalRoute < genericAdminRoute);
});
