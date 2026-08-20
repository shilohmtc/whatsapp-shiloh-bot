const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const liveConfirmation = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'customerBookingConfirmation.js'), 'utf8');

test('booking confirmation v2 provisioning is explicit one-shot only', () => {
  assert.match(appSource, /META_BOOKING_CONFIRMATION_V2_PROVISION_ON_START/);
  assert.match(appSource, /toLowerCase\(\) !== 'true'/);
  assert.match(appSource, /submitBookingConfirmationV2Template/);
});

test('booking confirmation v1 remains the live production fallback during v2 submission', () => {
  assert.match(liveConfirmation, /WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE/);
  assert.match(liveConfirmation, /sendWhatsAppTemplate\(phone,template,\[clientName\|\|'there',serviceName,staffName,date,time,google,ics\|\|google\]/);
  assert.doesNotMatch(liveConfirmation, /shiloh_booking_confirmation_v2/);
  assert.doesNotMatch(liveConfirmation, /bookingConfirmationV2QuickReplyPayloads/);
});
