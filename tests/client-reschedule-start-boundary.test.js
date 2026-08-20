const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const guard = fs.readFileSync(path.join(root, 'src', 'bootstrap', 'clientRescheduleStartBoundaryPatch.js'), 'utf8');
const holds = fs.readFileSync(path.join(root, 'src', 'services', 'clientRescheduleHoldReconciliation.js'), 'utf8');
const pkg = fs.readFileSync(path.join(root, 'package.json'), 'utf8');

test('client reschedule start-boundary guard loads before practitioner-approval patch', () => {
  const startGuard = pkg.indexOf('clientRescheduleStartBoundaryPatch.js');
  const approval = pkg.indexOf('clientRescheduleApprovalPatch.js');
  assert.ok(startGuard >= 0, 'start-boundary preload must be configured');
  assert.ok(approval > startGuard, 'approval preload must capture the guarded reschedule exports');
});

test('reschedule ownership is revalidated before the start boundary is enforced', () => {
  assert.match(guard, /cc\.normalized_value=\$1/);
  assert.match(guard, /a\.id=\$2/);
  assert.match(guard, /LOWER\(cc\.contact_type\) IN \('whatsapp','mobile','phone','telephone'\)/);
  assert.match(guard, /a\.starts_at <= NOW\(\)/);
  assert.match(guard, /NOW\(\) \+ INTERVAL '1 minute'/);
  assert.match(guard, /appointment has already started/);
  assert.match(guard, /appointment is starting now/);
});

test('legacy client reschedule is blocked before and after appointment selection once start boundary is reached', () => {
  assert.match(guard, /const priorIntent = await appointmentChange\.getIntent\(phone\)/);
  assert.match(guard, /const priorBlocked = await blockStartedIntent/);
  assert.match(guard, /const result = await originalProcessAppointmentChangeMessage/);
  assert.match(guard, /const nextIntent = await appointmentChange\.getIntent\(phone\)/);
  assert.match(guard, /const nextBlocked = await blockStartedIntent/);
  assert.match(guard, /await appointmentChange\.clearIntent\(phone\)/);
  assert.match(guard, /intent\?\.action !== 'reschedule'/);
});

test('dark practitioner-approved request creation cannot bypass the same start boundary', () => {
  assert.match(guard, /originalCreatePendingRescheduleRequest/);
  assert.match(guard, /clientRescheduleApproval\.createPendingRescheduleRequest = async function/);
  assert.match(guard, /status: 'appointment_started'/);
});

test('pending practitioner-approval hold stops blocking availability when original appointment starts', () => {
  assert.match(holds, /appointment\.starts_at > NOW\(\)/);
  assert.match(holds, /status='superseded'/);
  assert.match(holds, /reached its start boundary/);
});

test('start-boundary patch is non-mutating for canonical appointment and calendar state', () => {
  assert.doesNotMatch(guard, /UPDATE appointments/i);
  assert.doesNotMatch(guard, /UPDATE appointment_lifecycle/i);
  assert.doesNotMatch(guard, /updateBookingEvent|syncPractitionerBookingEvent|cancelBookingEvent/);
  assert.doesNotMatch(guard, /WHATSAPP_RESCHEDULE_APPROVAL_ENABLED\s*=/);
});
