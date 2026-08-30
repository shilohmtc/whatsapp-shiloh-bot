const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const booking = fs.readFileSync(path.join(root, 'src/services/adminMobileBookingFlow.js'), 'utf8');
const entitlement = fs.readFileSync(path.join(root, 'src/services/adminBookingEntitlement.js'), 'utf8');
const whatsapp = fs.readFileSync(path.join(root, 'src/services/whatsapp.js'), 'utf8');
const webhook = fs.readFileSync(path.join(root, 'src/controllers/webhookController.js'), 'utf8');
const buttons = fs.readFileSync(path.join(root, 'src/services/adminEarningsButtons.js'), 'utf8');

test('staff booking catalogue remains fail-closed to the approved practitioner scope', () => {
  assert.match(entitlement, /name === 'marietjie'.*staffNames: \['marietjie'\]/);
  assert.match(entitlement, /name === 'christel' \|\| name === 'abigail' \|\| isJeanPierreBookingException\(admin\).*staffNames: \['christel', 'abigail'\]/s);
  assert.match(entitlement, /key: 'own_practitioner'.*staffIds: \[Number\(admin\.staff_id\)\]/s);
  assert.match(entitlement, /key: 'no_practitioner_scope'.*staffNames: \[\], staffIds: \[\]/s);
  assert.match(booking, /st\.client_bookable=TRUE/);
});

test('service-first booking uses genuine WhatsApp list payloads with bounded pagination', () => {
  assert.match(booking, /ux: 'whatsapp_interactive_list_grouped'/);
  assert.match(booking, /function categoryInteractive/);
  assert.match(booking, /function serviceInteractive/);
  assert.match(booking, /admin_booking_service:/);
  assert.match(booking, /PAGE_SIZE = 7/);
  assert.match(booking, /admin_booking_page:/);
});

test('WhatsApp transport supports Meta interactive list messages and enforces row bounds', () => {
  assert.match(whatsapp, /async function sendWhatsAppList/);
  assert.match(whatsapp, /type: "list"/);
  assert.match(whatsapp, /rows\.length < 1 \|\| rows\.length > 10/);
  assert.match(whatsapp, /title\.length > 24/);
  assert.match(whatsapp, /description\.length > 72/);
});

test('incoming list replies are parsed but ordinary admin booking flow is no longer dispatched', () => {
  assert.match(webhook, /message\.interactive\?\.type==="list_reply"/);
  assert.match(webhook, /message\.interactive\.list_reply\?\.id/);
  assert.match(webhook, /sendWhatsAppList/);
  assert.doesNotMatch(webhook, /activeMobileBooking|processAdminMobileBookingFlowMessage/);
  assert.match(webhook, /processAdminRetiredAuthorityMessage\(from,text\)/);
});

test('stale final booking buttons can only enter Calendar retirement', () => {
  assert.match(booking, /admin_booking_confirm/);
  assert.match(booking, /admin_booking_cancel/);
  assert.match(buttons, /admin_booking_confirm: 'admin_retired_calendar_action'/);
  assert.match(buttons, /admin_booking_cancel: 'admin_retired_calendar_action'/);
  assert.match(booking, /buttonInteractive/);
});

test('interactive choices never bypass final authoritative booking validation', () => {
  assert.match(booking, /prepareAdminBooking/);
  assert.match(booking, /confirmAdminBooking/);
  assert.match(booking, /staffRowsForService\(service\.id, admin\)/);
  assert.match(booking, /listAvailableSlots/);
});
