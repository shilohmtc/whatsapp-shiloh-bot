const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'controllers', 'webhookController.js'), 'utf8');

test('manage-booking interactions are routed before generic admin fallbacks', () => {
  assert.match(source, /processAdminBookingUpdateMessage/);
  const bookingUpdate = source.indexOf('const adminBookingUpdate=await processAdminBookingUpdateMessage(from,text)');
  const interactiveMenu = source.indexOf('const adminMobile=await processAdminInteractiveMenuMessage(from,text)');
  const assistant = source.indexOf('const adminAssistant=await processAdminAssistantMessage(from,text)');
  assert.ok(bookingUpdate >= 0, 'booking-update router must be present');
  assert.ok(interactiveMenu > bookingUpdate, 'booking-update router must run before generic interactive admin menu handling');
  assert.ok(assistant > bookingUpdate, 'booking-update router must run before generic admin assistant fallback');
  assert.match(source, /await sendAdminResult\(from,adminBookingUpdate\)/);
});
