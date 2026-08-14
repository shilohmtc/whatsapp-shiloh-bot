const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const confirmation = fs.readFileSync(path.join(root, 'src', 'services', 'customerBookingConfirmation.js'), 'utf8');
const whatsapp = fs.readFileSync(path.join(root, 'src', 'services', 'whatsapp.js'), 'utf8');

test('booking confirmation hides raw calendar URLs behind WhatsApp calendar buttons', () => {
  assert.match(confirmation, /sendWhatsAppCtaUrl/);
  assert.match(confirmation, /Google Calendar/);
  assert.match(confirmation, /Apple \/ Outlook/);
  assert.doesNotMatch(confirmation, /Google Calendar: \$\{google\}/);
  assert.doesNotMatch(confirmation, /phone calendar: \$\{ics\}/);
  assert.match(whatsapp, /async function sendWhatsAppCtaUrl/);
  assert.match(whatsapp, /type:\s*["']cta_url["']/);
});

test('calendar CTA cards use symmetric concise action copy', () => {
  assert.match(confirmation, /Add to Google Calendar/);
  assert.match(confirmation, /Add to Apple \/ Outlook/);
  assert.doesNotMatch(confirmation, /Add this appointment to your phone or desktop calendar\./);
});

test('booking confirmation exposes deterministic Reschedule and Cancel booking reply buttons while keeping typed fallbacks', () => {
  assert.match(confirmation, /sendWhatsAppReplyButtons/);
  assert.match(confirmation, /client_reschedule_booking/);
  assert.match(confirmation, /client_cancel_booking/);
  assert.match(confirmation, /Reschedule/);
  assert.match(confirmation, /Cancel booking/);
  assert.match(confirmation, /RESCHEDULE/);
  assert.match(confirmation, /CANCEL/);
  assert.match(confirmation, /We look forward to seeing you\. 🌿/);
});
