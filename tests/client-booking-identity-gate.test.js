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
  for (const value of ['yes', 'confirm', 'correct', 'continue', 'okay']) {
    assert.equal(isSummaryConfirmation(value), true);
  }
  for (const value of ['book', 'today', 'change', 'cancel', 'I agree']) {
    assert.equal(isSummaryConfirmation(value), false);
  }
});

test('complete canonical client identity is required before policy confirmation', () => {
  assert.match(gate, /resolveClientByWhatsApp\(phone\)/);
  assert.match(gate, /identity\.status === 'unique' && profileComplete\(identity\.client\)/);
  assert.match(gate, /intent\.status !== 'awaiting_confirmation'/);
  assert.match(gate, /processClientIdentityMessage\(phone, 'booking'\)/);
});

test('identity gate never clears or rewrites the staged booking intent', () => {
  assert.doesNotMatch(gate, /clearIntent|DELETE FROM booking_intents|UPDATE booking_intents|INSERT INTO booking_intents/);
  assert.match(gate, /const intent = await getIntent\(phone\)/);
});

test('slot selection onboards incomplete clients before sending the first confirmation UI', () => {
  const availability = webhook.indexOf('processClientAvailabilityMessage(from,text)');
  const ensure = webhook.indexOf('ensureBookingIdentity(from)');
  const availabilitySend = webhook.indexOf('await sendAdminResult(from,clientAvailability)');
  assert.ok(availability >= 0 && ensure >= 0 && availabilitySend >= 0);
  assert.ok(availability < ensure);
  assert.ok(ensure < availabilitySend);
  assert.match(webhook, /clientAvailability\.intent\?\.status==="awaiting_confirmation"/);
  assert.match(webhook, /if\(!availabilityIdentity\.ready\).*sendWhatsAppMessage\(from,availabilityIdentity\.reply\)/s);
});

test('policy confirmation is gated after appointment-change handling and before booking policy', () => {
  const appointmentChange = webhook.indexOf('processAppointmentChangeMessage(from,text)');
  const identityGate = webhook.indexOf('guardBookingConfirmationIdentity(from,text)');
  const policy = webhook.indexOf('processBookingPolicyMessage(from,text)');
  assert.ok(appointmentChange >= 0 && identityGate >= 0 && policy >= 0);
  assert.ok(appointmentChange < identityGate);
  assert.ok(identityGate < policy);
});

test('onboarding completion resumes the existing booking and re-renders interactive confirmation', () => {
  assert.match(webhook, /identity\.onboardingComplete&&identity\.resumeBooking/);
  assert.match(webhook, /decorateClientBookingResult\(await processBookingMessage\(from,"I want to book an appointment"\)\)/);
  assert.match(webhook, /booking\.handled&&booking\.interactive/);
  assert.match(webhook, /await sendAdminResult\(from,booking\)/);
});

test('onboarding session already tracks that booking must resume without storing sensitive booking payload copies', () => {
  assert.match(identity, /booking_requested/);
  assert.match(identity, /resumeBooking:Boolean\(session\.booking_requested\)/);
  assert.doesNotMatch(identity, /booking_request_text|booking_payload|booking_json/);
});

test('identity gate does not weaken ambiguous-contact fail closed behavior', () => {
  assert.match(identity, /identity\.status==="ambiguous"/);
  assert.match(identity, /I won't merge or select a profile automatically/);
  assert.match(gate, /I can’t verify a complete Shiloh client profile/);
});
