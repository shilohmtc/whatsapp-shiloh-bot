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
const resetPath = path.join(root, 'src', 'services', 'adminTestClientReset.js');
const jpMigrationPath = path.join(root, 'migrations', '012_add_jean_pierre_admin.sql');

const approval = fs.readFileSync(approvalPath, 'utf8');
const schema = fs.readFileSync(schemaPath, 'utf8');
const policy = fs.readFileSync(policyPath, 'utf8');
const availability = fs.readFileSync(availabilityPath, 'utf8');
const confirmation = fs.readFileSync(confirmationPath, 'utf8');
const webhook = fs.readFileSync(webhookPath, 'utf8');
const reset = fs.readFileSync(resetPath, 'utf8');
const jpMigration = fs.readFileSync(jpMigrationPath, 'utf8');

test('client booking completion is converted to a durable pending-approval hold before client delivery', () => {
  assert.match(policy, /ensureBookingApprovalInfrastructure/);
  assert.match(policy, /createPendingBookingApproval/);
  assert.match(policy, /requestPractitionerApproval/);
  assert.match(policy, /status: ["']pending_approval["']/);
  assert.match(policy, /not yet confirmed/);
  assert.doesNotMatch(policy, /Booking created successfully\s*[—-]\s*appointment/);
});

test('pending-approval client copy names the actual authorized approver rather than blindly naming the assigned practitioner', () => {
  assert.match(policy, /notification\?*\.approver/);
  assert.match(policy, /authorized approver/i);
  assert.doesNotMatch(policy, /while \$\{staff\.staff_name_snapshot\} reviews the request/);
  assert.doesNotMatch(policy, /until the practitioner explicitly approves or declines/i);
});

test('approval hold is inserted atomically with client appointment staff and has no automatic expiry', () => {
  assert.match(schema, /CREATE TRIGGER trg_client_booking_approval_hold/);
  assert.match(schema, /AFTER INSERT ON appointment_staff/);
  assert.match(schema, /shiloh_client_whatsapp/);
  assert.match(schema, /appointment_booking_approvals/);
  assert.match(schema, /'pending'/);
  assert.doesNotMatch(schema, /expires_at|expiry|expirePending|setTimeout|TTL/i);
  assert.doesNotMatch(approval, /expires_at|expiry|expirePending|setTimeout|TTL/i);
});

test('pending approval remains an availability conflict until an explicit decision', () => {
  assert.match(availability, /a\.status <> 'cancelled'/);
  assert.match(approval, /status[^\n]*(pending|approved|declined)/i);
});

test('CRM Dummy Test uses the existing guarded identity contract and requires JP as sole approver', () => {
  assert.match(reset, /dummy_test:\s*'Dummy Test'/);
  assert.match(reset, /lower\(trim\(display_name\)\)/i);
  assert.match(reset, /rowCount !== 1/);
  assert.match(approval, /Dummy Test/i);
  assert.match(approval, /Jean-Pierre/i);
  assert.match(approval, /dummy_test|dummy test/i);
  assert.match(approval, /business_admin/i);
  assert.match(approval, /all_business/i);
  assert.match(approval, /all_services/i);
  assert.match(schema, /lower\(trim\(c\.display_name\)\).*dummy test/is);
  assert.match(schema, /COUNT\(\*\).*clients.*dummy test/is);
  assert.match(schema, /Jean-Pierre/i);
  assert.match(schema, /business_admin/i);
  assert.match(schema, /RAISE EXCEPTION/i);
});

test('Dummy Test approval targets Jean-Pierre admin identity without requiring a clinic staff record', () => {
  assert.match(jpMigration, /staff_id may remain NULL/i);
  assert.match(jpMigration, /VALUES\s*\(\s*NULL,\s*'Jean-Pierre'/is);
  assert.match(schema, /approver_admin_id/i);
  assert.match(schema, /REFERENCES staff_admin_accounts\(id\)/i);
  assert.match(schema, /approver_staff_id BIGINT REFERENCES staff\(id\)/i);
  assert.doesNotMatch(schema, /approver_staff_id BIGINT NOT NULL REFERENCES staff\(id\)/i);
  assert.match(schema, /required_approver_admin_id/i);
  assert.match(schema, /MIN\(saa\.id\)/i);
  assert.doesNotMatch(schema, /JOIN staff st ON st\.id = saa\.staff_id[\s\S]*Jean-Pierre/i);
  assert.match(approval, /approverAdminId|approver_admin_id/);
  assert.match(approval, /Number\(context\.approver_admin_id\) === Number\(admin\.id\)/);
});

test('normal Abigail bookings still allow either Abigail or Christel to make the first authoritative decision', () => {
  assert.match(approval, /approver_staff_id/);
  assert.match(approval, /observer_staff_id/);
  assert.match(approval, /Abigail/i);
  assert.match(approval, /Christel/i);
  assert.match(approval, /isAuthorizedDecisionMaker|authorizedDecisionMaker/i);
  assert.match(approval, /observer_staff_id[^\n]*admin\.staff_id|admin\.staff_id[^\n]*observer_staff_id/);
  assert.match(approval, /sendWhatsAppReplyButtons\([^\n]*observer/i);
  assert.doesNotMatch(approval, /no approval is required from you/i);
});

test('normal Marietjie and Christel bookings remain self-approval only', () => {
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
