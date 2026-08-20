const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const service = fs.readFileSync(path.join(root, 'src', 'services', 'clientRescheduleApproval.js'), 'utf8');
const patch = fs.readFileSync(path.join(root, 'src', 'bootstrap', 'clientRescheduleApprovalPatch.js'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'migrations', '064_client_reschedule_practitioner_approval.sql'), 'utf8');
const pkg = fs.readFileSync(path.join(root, 'package.json'), 'utf8');

test('practitioner-approved client reschedule is dark by default', () => {
  assert.match(service, /WHATSAPP_RESCHEDULE_APPROVAL_ENABLED === 'true'/);
  assert.match(patch, /if \(!featureEnabled\(\)\) return originalProcessAppointmentChangeMessage/);
  assert.match(pkg, /clientRescheduleApprovalPatch\.js/);
});

test('pending request preserves original appointment and holds only the proposed slot', () => {
  assert.match(migration, /appointment_reschedule_requests/);
  assert.match(migration, /original_starts_at TIMESTAMPTZ NOT NULL/);
  assert.match(migration, /proposed_starts_at TIMESTAMPTZ NOT NULL/);
  assert.match(migration, /WHERE status = 'pending'/);
  assert.match(service, /pendingRescheduleConflicts/);
  assert.match(service, /'reschedule_hold'::text/);
  assert.match(patch, /getConflictsWithRescheduleHolds/);
  assert.match(patch, /checkAvailabilityWithRescheduleHolds/);
  const create = service.match(/async function createPendingRescheduleRequest[\s\S]*?async function resolveAdminByWhatsApp/);
  assert.ok(create);
  assert.doesNotMatch(create[0], /UPDATE appointments SET starts_at=/);
  assert.match(create[0], /Your current appointment remains confirmed and unchanged until the requested change is approved/);
});

test('only one pending reschedule request may exist per appointment and it has no automatic expiry', () => {
  assert.match(migration, /UNIQUE INDEX[\s\S]*appointment_id[\s\S]*WHERE status = 'pending'/);
  assert.doesNotMatch(migration, /expires_at|TTL|interval '.*hour/i);
  assert.doesNotMatch(service, /setTimeout|expirePending/i);
});

test('request path revalidates canonical and connected-calendar availability under practitioner lock', () => {
  const create = service.match(/async function createPendingRescheduleRequest[\s\S]*?async function resolveAdminByWhatsApp/);
  assert.ok(create);
  assert.match(create[0], /pg_advisory_xact_lock/);
  assert.match(create[0], /validateCandidate/);
  assert.match(create[0], /validateExternalCalendars/);
  assert.match(service, /checkClinicHours/);
  assert.match(service, /checkAuthoritativeSchedule/);
  assert.match(service, /canonicalConflicts/);
  assert.match(service, /checkCalendarAvailability/);
  assert.match(service, /checkPractitionerCalendarAvailability/);
});

test('same-practitioner single-service boundary fails closed for complex appointments', () => {
  assert.match(service, /staff_count/);
  assert.match(service, /service_count/);
  assert.match(service, /complex_practitioner_setup/);
  assert.match(service, /complex_service_setup/);
  assert.match(service, /Number\(locked\.staff_id\) !== Number\(appointment\.staff_id\)/);
  assert.match(service, /Number\(locked\.service_id \|\| 0\) !== Number\(appointment\.service_id \|\| 0\)/);
});

test('approval transport contract is frozen and uses deterministic decision payloads', () => {
  assert.match(service, /shiloh_reschedule_approval_request_v1/);
  assert.match(service, /shiloh_reschedule_declined_v1/);
  assert.match(service, /reschedule_approval_approve_/);
  assert.match(service, /reschedule_approval_decline_/);
  assert.match(service, /WHATSAPP_RESCHEDULE_APPROVAL_REQUEST_TEMPLATE/);
  assert.match(service, /WHATSAPP_RESCHEDULE_DECLINED_TEMPLATE/);
  assert.doesNotMatch(service, /submit.*Template|graph\.facebook\.com/i);
});

test('practitioner decision is authorized through exactly one active staff admin WhatsApp identity', () => {
  assert.match(service, /staff_admin_accounts/);
  assert.match(service, /result\.rowCount !== 1/);
  assert.match(service, /Number\(admin\.staff_id\) !== Number\(context\.approver_staff_id\)/);
  assert.match(service, /You are not authorized to decide this reschedule request/);
  assert.match(patch, /processRescheduleApprovalDecision/);
  assert.match(patch, /originalProcessBookingApprovalMessage/);
});

test('approve revalidates before canonical mutation and decline never mutates appointment time', () => {
  const approve = service.match(/async function approveRequest[\s\S]*?async function declineRequest/);
  const decline = service.match(/async function declineRequest[\s\S]*?async function processRescheduleApprovalDecision/);
  assert.ok(approve && decline);
  const lock = approve[0].indexOf('pg_advisory_xact_lock');
  const candidate = approve[0].indexOf('validateCandidate', lock);
  const external = approve[0].indexOf('validateExternalCalendars', candidate);
  const mutate = approve[0].indexOf('UPDATE appointments SET starts_at=', external);
  assert.ok(lock >= 0 && candidate > lock && external > candidate && mutate > external);
  assert.doesNotMatch(decline[0], /UPDATE appointments SET starts_at=/);
  assert.match(decline[0], /status='declined'/);
});

test('approved reschedule synchronizes both calendar mirrors and compensates on failure', () => {
  assert.match(service, /updateBookingEvent/);
  assert.match(service, /syncPractitionerBookingEvent/);
  assert.match(service, /client_reschedule_approval_compensation/);
  assert.match(service, /original_starts_at/);
  assert.match(service, /original_ends_at/);
});

test('approved reschedule queues durable customer update and decline preserves original appointment', () => {
  assert.match(service, /appointment\.time_updated/);
  assert.match(service, /queueCustomerChangeNotification\(locked\.appointment_id, 'time'\)/);
  assert.match(service, /The client's original appointment is unchanged/);
});
