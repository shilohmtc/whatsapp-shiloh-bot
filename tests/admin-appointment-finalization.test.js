const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const finalization = source('src/services/adminAppointmentFinalization.js');
const cancellation = source('src/services/adminAppointmentCancellation.js');
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

test('visibility remains scoped to the approved 1-15 Aug historical window and past non-final appointments', () => {
  assert.match(finalization, /HISTORICAL_WINDOW_START = '2026-08-01T00:00:00\+02:00'/);
  assert.match(finalization, /HISTORICAL_WINDOW_END = '2026-08-16T00:00:00\+02:00'/);
  assert.match(finalization, /a\.ends_at < NOW\(\)/);
  assert.match(finalization, /a\.starts_at >= \$7::timestamptz/);
  assert.match(finalization, /a\.starts_at < \$8::timestamptz/);
  assert.match(finalization, /a\.status NOT IN \('completed','cancelled','no_show'\)/);
  assert.match(finalization, /appointment_staff ast_scope/);
  assert.match(finalization, /staff_services ss_scope/);
  assert.match(finalization, /calendar_scope === 'all_business'/);
  assert.match(finalization, /Visits awaiting finalization — 1–15 Aug 2026/);
});

test('single-appointment reload enforces the same approved historical window', () => {
  assert.match(finalization, /a\.starts_at >= \$4::timestamptz/);
  assert.match(finalization, /a\.starts_at < \$5::timestamptz/);
  assert.match(finalization, /HISTORICAL_WINDOW_START, HISTORICAL_WINDOW_END/);
});

test('finalization pagination reserves WhatsApp rows for More and Back controls', () => {
  assert.match(finalization, /const PAGE_SIZE = 8;/);
  assert.match(finalization, /if \(data\.hasNext\) rows\.push/);
  assert.match(finalization, /Show more visits from 1–15 Aug awaiting final status/);
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
  assert.match(finalization, /FINAL_STATUSES = new Set\(\['completed', 'no_show', 'no_charge'\]\)/);
  assert.match(finalization, /title: 'Completed'/);
  assert.match(finalization, /title: 'No-show'/);
  assert.match(finalization, /title: 'No charge'/);
  assert.match(finalization, /title: 'Service change'/);
  assert.match(finalization, /title: 'Adjust price'/);
  assert.match(finalization, /title: 'Reschedule'/);
  assert.match(finalization, /title: 'Leave unresolved'/);
  assert.match(finalization, /finalize_reschedule_/);
  assert.match(finalization, /processAdminBookingUpdateMessage\(sender, 'Manage booking'\)/);
  assert.match(finalization, /processAdminBookingUpdateMessage\(sender, `manage_booking_select_\$\{appointmentId\}`\)/);
  assert.match(finalization, /processAdminBookingUpdateMessage\(sender, '3'\)/);
  assert.match(finalization, /What actually happened with this visit\?/);
  assert.match(finalization, /explicitAdminDecision: true/);
});

test('historical finalization offers cancelled and reuses canonical reason-confirmation cancellation flow', () => {
  assert.match(finalization, /title: 'Cancelled'/);
  assert.match(finalization, /finalize_cancelled_/);
  assert.match(finalization, /processAdminAppointmentCancellationMessage/);
  assert.match(finalization, /Cancel appointment \$\{appointmentId\}/);
  assert.match(finalization, /startPastVisitCancellation/);
  assert.match(cancellation, /cancelledAppointmentId:\s*appointment\.id/);
  assert.match(cancellation, /hasPendingCancellationIntent/);
});

test('terminal historical outcomes refresh the queue after mutation so finalized rows disappear immediately', () => {
  assert.match(finalization, /async function refreshedQueueInteractive/);
  assert.match(finalization, /pendingPastAppointments\(admin, 1\)/);
  assert.match(finalization, /It has been removed from the finalization queue/);
  assert.match(finalization, /hasPendingCancellationIntent\(sender\)/);
  assert.match(finalization, /cancellation\.cancelledAppointmentId/);
  assert.match(finalization, /refreshedQueueInteractive\(admin, cancellation\.reply\)/);
  assert.match(finalization, /refreshedQueueInteractive\(admin, `✅ Appointment #\$\{appointmentId\} marked/);
});

test('finalization revalidates authority under row lock and writes canonical history plus audit atomically', () => {
  assert.match(finalization, /BEGIN/);
  assert.match(finalization, /FOR UPDATE OF a/);
  assert.match(finalization, /canCertifyAppointment\(admin, appointment\.id, db\)/);
  assert.match(finalization, /UPDATE appointments[\s\S]*SET status=/);
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
