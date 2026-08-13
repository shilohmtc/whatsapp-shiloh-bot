const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const gatePath = path.join(__dirname, '..', 'src', 'services', 'clientBookingIdentityGate.js');
const webhookPath = path.join(__dirname, '..', 'src', 'controllers', 'webhookController.js');
const identityPath = path.join(__dirname, '..', 'src', 'services', 'clientIdentityOnboarding.js');
const gate = fs.readFileSync(gatePath, 'utf8');
const webhook = fs.readFileSync(webhookPath, 'utf8');
const identity = fs.readFileSync(identityPath, 'utf8');
const { isSummaryConfirmation } = require(gatePath);

test('booking identity gate recognizes only deliberate summary confirmations', () => {
  for (const value of ['yes', 'confirm', 'correct', 'continue', 'okay']) assert.equal(isSummaryConfirmation(value), true);
  for (const value of ['book', 'today', 'change', 'cancel', 'I agree']) assert.equal(isSummaryConfirmation(value), false);
});

test('complete canonical client identity is required before policy confirmation', () => {
  assert.match(gate, /resolveClientByWhatsApp\(phone\)/);
  assert.match(gate, /identity\.status === 'unique' && profileComplete\(identity\.client\)/);
  assert.match(gate, /intent\.status !== 'awaiting_confirmation'/);
  assert.match(gate, /processClientIdentityMessage\(phone, 'booking'\)/);
});

test('identity gate never rewrites the staged booking intent', () => {
  assert.doesNotMatch(gate, /clearIntent|DELETE FROM booking_intents|UPDATE booking_intents|INSERT INTO booking_intents/);
  assert.match(gate, /const intent = await getIntent\(phone\)/);
});

test('slot selection checks identity before sending confirmation UI', () => {
  const availability = webhook.indexOf('processClientAvailabilityMessage(from,text)');
  const ensure = webhook.indexOf('ensureBookingIdentity(from)');
  const availabilitySend = webhook.indexOf('await sendAdminResult(from,clientAvailability)');
  assert.ok(availability >= 0 && ensure >= 0 && availabilitySend >= 0);
  assert.ok(availability < ensure && ensure < availabilitySend);
  assert.match(webhook, /clientAvailability\.intent\?\.status==="awaiting_confirmation"/);
});

test('policy confirmation remains identity-gated before booking policy', () => {
  const identityGate = webhook.indexOf('guardBookingConfirmationIdentity(from,text)');
  const policy = webhook.indexOf('processBookingPolicyMessage(from,text)');
  assert.ok(identityGate >= 0 && policy >= 0 && identityGate < policy);
});

test('registration completion resumes booking discovery', () => {
  assert.match(webhook, /identity\.onboardingComplete&&identity\.resumeBooking/);
  assert.match(webhook, /decorateClientBookingResult\(await processBookingMessage\(from,"booking"\)\)/);
  assert.match(webhook, /booking\.handled&&booking\.interactive/);
});

test('registration state preserves continuation without storing the original booking message', () => {
  assert.match(identity, /booking_requested/);
  assert.match(identity, /resumeBooking: true/);
  assert.doesNotMatch(identity, /booking_request_text|booking_payload|booking_json/);
});

test('ambiguous client identity remains fail closed', () => {
  assert.match(identity, /identity\.status\s*===\s*"ambiguous"/);
  assert.match(identity, /verify the correct profile|identity conflict/i);
  assert.match(gate, /I can’t verify a complete Shiloh client profile/);
});
