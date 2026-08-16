const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const finalization = source('src/services/adminAppointmentFinalization.js');
const authority = source('src/services/attendanceFinalizationAuthority.js');
const appointmentsMenu = source('src/services/adminAppointmentsMenu.js');
const interactiveMenu = source('src/services/adminInteractiveMenu.js');

test('past finalization remains discoverable only for authorized finalizers', () => {
  assert.match(appointmentsMenu, /canAccessFinalization\(admin\) && has\(admin, 'booking:update'\) && has\(admin, 'appointment:view'\)/);
  assert.match(appointmentsMenu, /\['christel', 'marietjie'\]\.includes/);
  assert.match(appointmentsMenu, /admin_appointment_finalize/);
  assert.match(appointmentsMenu, /Finalize past visits/);
  assert.match(finalization, /!has\(admin, 'appointment:view'\)/);
});

test('visibility remains scoped to past non-final appointments', () => {
  assert.match(finalization, /a\.ends_at < NOW\(\)/);
  assert.match(finalization, /a\.status NOT IN \('completed','cancelled','no_show'\)/);
  assert.match(finalization, /appointment_staff ast_scope/);
  assert.match(finalization, /staff_services ss_scope/);
  assert.match(finalization, /calendar_scope === 'all_business'/);
});

test('finalization pagination reserves WhatsApp rows for More and Back controls', () => {
  assert.match(finalization, /const PAGE_SIZE = 8;/);
  assert.match(finalization, /if \(data\.hasNext\) rows\.push/);
  assert.match(finalization, /rows\.push\(\{ id: 'appointments'/);
});

test('certification authority is Christel for Christel and Abigail, and Marietjie for herself only', () => {
  assert.match(authority, /name === 'christel'/);
  assert.match(authority, /IN \('christel','abigail'\)/);
  assert.match(authority, /name === 'marietjie'/);
  assert.doesNotMatch(authority, /name === 'abigail' \|\| name === 'marietjie'/);
  assert.match(authority, /Abigail deliberately has no certification authority/);
  assert.match(authority, /return admin\.staff_id \? \[Number\(admin\.staff_id\)\] : \[\]/);
  assert.match(authority, /staffIds\.every\(\(staffId\) => allowed\.includes\(staffId\)\)/);
  assert.match(finalization, /reviewOnlyInteractive/);
  assert.match(finalization, /canCertifyAppointment\(admin, appointment\.id, db\)/);
  assert.match(finalization, /certification_forbidden/);
});

test('attendance remains explicit while unresolved visits can be rescheduled without false attendance', () => {
  assert.match(finalization, /FINAL_STATUSES = new Set\(\['completed', 'no_show'\]\)/);
  assert.match(finalization, /title: 'Completed'/);
  assert.match(finalization, /title: 'No-show'/);
  assert.match(finalization, /title: 'Reschedule'/);
  assert.match(finalization, /title: 'Leave unresolved'/);
  assert.match(finalization, /finalize_reschedule_/);
  assert.match(finalization, /processAdminBookingUpdateMessage\(sender, 'Manage booking'\)/);
  assert.match(finalization, /processAdminBookingUpdateMessage\(sender, '3'\)/);
  assert.match(finalization, /cannot be inferred from elapsed time/);
  assert.doesNotMatch(finalization, /SET status='completed'.*NOW\(\)/s);
});

test('finalization revalidates authority under row lock and writes canonical history plus audit atomically', () => {
  assert.match(finalization, /BEGIN/);
  assert.match(finalization, /FOR UPDATE OF a/);
  assert.match(finalization, /canCertifyAppointment\(admin, appointment\.id, db\)/);
  assert.match(finalization, /UPDATE appointments SET status=\$1/);
  assert.match(finalization, /INSERT INTO appointment_status_history/);
  assert.match(finalization, /admin\.appointment_finalized/);
  assert.match(finalization, /COMMIT/);
  assert.match(finalization, /ROLLBACK/);
});

test('attendance finalization itself synchronizes lifecycle without directly mutating calendar or payment truth', () => {
  assert.match(finalization, /UPDATE appointment_lifecycle/);
  assert.doesNotMatch(finalization, /createBookingEvent|cancelBookingEvent/);
  assert.doesNotMatch(finalization, /payment|ozow|voucher/i);
});

test('interactive router owns finalization before generic mobile menu routing', () => {
  const finalizer = interactiveMenu.indexOf('processAdminAppointmentFinalizationMessage(sender, text)');
  const mobile = interactiveMenu.indexOf('processAdminMobileMenuMessage(sender, text)');
  assert.ok(finalizer >= 0 && mobile >= 0);
  assert.ok(finalizer < mobile);
});
