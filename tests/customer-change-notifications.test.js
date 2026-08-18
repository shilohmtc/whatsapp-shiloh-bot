const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const service = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'customerChangeNotification.js'), 'utf8');
const patch = fs.readFileSync(path.join(__dirname, '..', 'src', 'bootstrap', 'adminBookingCustomerNotificationPatch.js'), 'utf8');
const lifecycle = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'clientLifecycleTemplateProvisioning.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

test('booking-update template carries the full latest appointment confirmation', () => {
  assert.match(lifecycle, /booking_update:\s*\{ name: 'shiloh_booking_update_v1'/);
  assert.match(lifecycle, /Service: \{\{2\}\}/);
  assert.match(lifecycle, /With: \{\{3\}\}/);
  assert.match(lifecycle, /Date: \{\{4\}\}/);
  assert.match(lifecycle, /Time: \{\{5\}\}/);
  assert.match(lifecycle, /Booked price: \{\{6\}\}/);
  assert.match(lifecycle, /Booking #\{\{7\}\}/);
  assert.match(lifecycle, /This is your latest confirmation/);
});

test('all material admin booking mutations map to customer notification kinds', () => {
  assert.match(service, /service:\s*'appointment\.service_updated'/);
  assert.match(service, /practitioner:\s*'appointment\.staff_updated'/);
  assert.match(service, /time:\s*'appointment\.time_updated'/);
  assert.match(service, /price:\s*'appointment\.price_updated'/);
  assert.match(service, /cancellation:\s*'admin\.appointment_cancelled'/);
});

test('delivery is audit-event idempotent and retries provider or send failures', () => {
  assert.match(service, /audit_event_id BIGINT PRIMARY KEY/);
  assert.match(service, /status TEXT NOT NULL CHECK \(status IN \('pending','sending','sent','failed'\)\)/);
  assert.match(service, /ON CONFLICT \(audit_event_id\) DO NOTHING/);
  assert.match(service, /template_not_approved/);
  assert.match(service, /queued for retry/);
  assert.match(service, /INTERVAL '5 minutes'/);
});

test('customer messages are sent only through approved utility templates', () => {
  assert.match(service, /item\.provider\.status !== 'APPROVED'/);
  assert.match(service, /sendWhatsAppTemplate/);
  assert.match(service, /cancellation_confirmation/);
  assert.match(service, /booking_update/);
  assert.doesNotMatch(service, /sendWhatsAppMessage\(/);
});

test('booking change patch queues notifications only after successful mutation results', () => {
  assert.match(patch, /✅\\s\*Service changed to/);
  assert.match(patch, /✅\\s\*Practitioner changed to/);
  assert.match(patch, /✅\\s\*Date\\\/time updated/);
  assert.match(patch, /✅\\s\*Booked price updated/);
  assert.match(patch, /cancelledAppointmentId/);
  assert.match(patch, /postSend = async/);
  assert.match(patch, /queueCustomerChangeNotification/);
});

test('customer notification patch is preloaded after the Google provider guard', () => {
  const provider = pkg.scripts.start.indexOf('adminBookingProviderGuardPatch.js');
  const customer = pkg.scripts.start.indexOf('adminBookingCustomerNotificationPatch.js');
  assert.ok(provider >= 0 && customer > provider);
  assert.match(pkg.scripts.dev, /adminBookingCustomerNotificationPatch\.js/);
});
