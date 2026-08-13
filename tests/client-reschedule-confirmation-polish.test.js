const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const availabilitySource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'clientRescheduleAvailability.js'), 'utf8');
const whatsappSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'whatsapp.js'), 'utf8');

test('reschedule confirmation uses clear interactive choices and hides internal identifiers', () => {
  assert.match(availabilitySource, /Confirm reschedule/);
  assert.match(availabilitySource, /Keep appointment/);
  assert.match(availabilitySource, /id:'yes'/);
  assert.match(availabilitySource, /id:'stop'/);
  assert.doesNotMatch(availabilitySource, /Booking #\$\{a\.id\}/);
  assert.match(availabilitySource, /Nothing has changed yet\./);
});

test('client-facing send layer removes reschedule CRM and calendar synchronization diagnostics', () => {
  assert.match(whatsappSource, /sanitizeClientFacingMessage/);
  assert.match(whatsappSource, /We look forward to seeing you\. 🌿/);
  assert.match(whatsappSource, /Your Shiloh CRM booking and Google Calendar event are synchronized/);
});
