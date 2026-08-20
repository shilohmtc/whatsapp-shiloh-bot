const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bridge = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminBookingUpdateStateless.js'), 'utf8');
const cancellation = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminAppointmentCancellation.js'), 'utf8');
const assistant = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminAssistant.js'), 'utf8');

test('Manage booking exposes a guarded Cancel booking row before Back', () => {
  assert.match(bridge, /id: 'manage_cancel_booking', title: 'Cancel booking', description: 'Cancel this appointment safely'/);
  assert.match(bridge, /findIndex\(\(row\) => row\?\.id === 'manage_booking_back'\)/);
  assert.match(bridge, /next\.splice\(backIndex, 0, cancelRow\)/);
});

test('Cancel booking action is appointment-scoped and delegates to canonical cancellation flow', () => {
  assert.match(bridge, /manage_cancel_booking_\$\{appointmentId\}/);
  assert.match(bridge, /\^manage_cancel_booking_\(\\d\+\)\$/);
  assert.match(bridge, /processAdminAppointmentCancellationMessage\(sender, `cancel appointment #\$\{Number\(match\[1\]\)\}`\)/);
  assert.doesNotMatch(bridge, /UPDATE appointments SET status='cancelled'/);
});

test('Pending cancellation reason and confirmation stay ahead of volatile booking-update routing', () => {
  const pending = bridge.indexOf('hasPendingCancellationIntent(sender)');
  const service = bridge.indexOf("raw.match(/^manage_change_service_");
  assert.ok(pending >= 0 && service > pending, 'pending cancellation must be handled before ordinary manage-booking actions');
  assert.match(bridge, /processAdminAppointmentCancellationMessage\(sender, raw\)/);
});

test('Canonical cancellation remains confirm-gated and the unrelated plain-text cancel booking command is unchanged', () => {
  assert.match(cancellation, /status==="collecting_reason"/);
  assert.match(cancellation, /status==="awaiting_confirmation"/);
  assert.match(cancellation, /if\(!isConfirmation\(value\)\)/);
  assert.match(cancellation, /cancel_confirm/);
  assert.match(cancellation, /cancel_back/);
  assert.match(assistant, /value === "cancel booking"/);
  assert.match(assistant, /cancelPendingBooking\(admin\.id\)/);
});