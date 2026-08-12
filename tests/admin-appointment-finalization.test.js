const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const finalization = source('src/services/adminAppointmentFinalization.js');
const appointmentsMenu = source('src/services/adminAppointmentsMenu.js');
const interactiveMenu = source('src/services/adminInteractiveMenu.js');

test('past finalization is visible only behind appointment view plus booking update permission', () => {
  assert.match(appointmentsMenu, /has\(admin, 'booking:update'\) && has\(admin, 'appointment:view'\)/);
  assert.match(appointmentsMenu, /finalize past appointments/);
  assert.match(finalization, /!has\(admin, 'appointment:view'\) \|\| !has\(admin, 'booking:update'\)/);
});

test('only past non-final appointments in authorized staff-service scope are eligible', () => {
  assert.match(finalization, /a\.ends_at < NOW\(\)/);
  assert.match(finalization, /a\.status NOT IN \('completed','cancelled','no_show'\)/);
  assert.match(finalization, /appointment_staff ast_scope/);
  assert.match(finalization, /staff_services ss_scope/);
  assert.match(finalization, /calendar_scope === 'all_business'/);
});

test('attendance is explicit and limited to completed or no-show', () => {
  assert.match(finalization, /FINAL_STATUSES = new Set\(\['completed', 'no_show'\]\)/);
  assert.match(finalization, /title: 'Completed'/);
  assert.match(finalization, /title: 'No-show'/);
  assert.match(finalization, /cannot be inferred from elapsed time/);
  assert.doesNotMatch(finalization, /SET status='completed'.*NOW\(\)/s);
});

test('finalization revalidates under row lock and writes canonical history plus audit atomically', () => {
  assert.match(finalization, /BEGIN/);
  assert.match(finalization, /FOR UPDATE OF a/);
  assert.match(finalization, /UPDATE appointments SET status=\$1/);
  assert.match(finalization, /INSERT INTO appointment_status_history/);
  assert.match(finalization, /admin\.appointment_finalized/);
  assert.match(finalization, /COMMIT/);
  assert.match(finalization, /ROLLBACK/);
});

test('linked lifecycle state is synchronized without changing calendar or payment truth', () => {
  assert.match(finalization, /UPDATE appointment_lifecycle/);
  assert.doesNotMatch(finalization, /createBookingEvent|updateBookingEvent|cancelBookingEvent/);
  assert.doesNotMatch(finalization, /payment|ozow|voucher/i);
});

test('interactive router owns finalization before generic mobile menu routing', () => {
  const finalizer = interactiveMenu.indexOf('processAdminAppointmentFinalizationMessage(sender, text)');
  const mobile = interactiveMenu.indexOf('processAdminMobileMenuMessage(sender, text)');
  assert.ok(finalizer >= 0 && mobile >= 0);
  assert.ok(finalizer < mobile);
});
