const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bridge = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminBookingUpdateStateless.js'), 'utf8');
const webhook = fs.readFileSync(path.join(__dirname, '..', 'src', 'controllers', 'webhookController.js'), 'utf8');

test('manage-booking service actions carry appointment identity across restarts', () => {
  assert.match(bridge, /manage_change_service_\$\{appointmentId\}/);
  assert.match(bridge, /manage_service_pick_\$\{appointmentId\}_\$\{servicePick\[1\]\}/);
  assert.match(bridge, /manage_service_page_\$\{appointmentId\}_\$\{servicePage\[1\]\}/);
  assert.match(bridge, /manage_booking_menu_\$\{appointmentId\}/);
});

test('restart-safe bridge reconstructs the authorized booking before replaying service action', () => {
  assert.match(bridge, /processAdminBookingUpdateMessage\(sender, 'Manage a booking'\)/);
  assert.match(bridge, /processAdminBookingUpdateMessage\(sender, `manage_booking_select_\$\{appointmentId\}`\)/);
  assert.match(bridge, /processAdminBookingUpdateMessage\(sender, 'manage_change_service'\)/);
  assert.match(bridge, /processAdminBookingUpdateMessage\(sender, `manage_service_pick_\$\{serviceId\}`\)/);
});

test('webhook scopes outbound manage-booking cards and handles scoped actions before volatile session fallback', () => {
  assert.match(webhook, /result=scopeAdminBookingInteractive\(result\)/);
  const stateless = webhook.indexOf('processStatelessAdminBookingUpdateMessage(from,text)');
  const volatile = webhook.indexOf('processAdminBookingUpdateMessage(from,text)');
  assert.ok(stateless >= 0 && volatile >= 0 && stateless < volatile);
  assert.match(webhook, /Handled restart-safe admin booking-update interaction/);
});
