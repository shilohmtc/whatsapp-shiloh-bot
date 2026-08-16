const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const transition = require('../src/services/clientTransitionWelcome');

const webhookSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'controllers', 'webhookController.js'),
  'utf8'
);

const serviceSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'services', 'clientTransitionWelcome.js'),
  'utf8'
);

test('existing-client transition welcome uses the approved client-facing copy', () => {
  const reply = transition.buildTransitionWelcome('Christel Botha');
  assert.match(reply, /you’re in the right place/i);
  assert.match(reply, /Shiloh, our AI assistant/i);
  assert.match(reply, /Choosing the right treatment/i);
  assert.match(reply, /Checking availability/i);
  assert.match(reply, /Making or managing your booking/i);
  assert.match(reply, /Calls & SMS: 066 239 9138/i);
  assert.match(reply, /right here on WhatsApp/i);
  assert.match(reply, /What can I help you with today/i);
  assert.doesNotMatch(reply, /WhatsApp is not available on this number/i);
});

test('transition welcome is only eligible for greeting-only messages', () => {
  assert.equal(transition.isGreetingOnly('Hello'), true);
  assert.equal(transition.isGreetingOnly('Good morning!'), true);
  assert.equal(transition.isGreetingOnly('I need to reschedule'), false);
  assert.equal(transition.isGreetingOnly('Book me for Friday'), false);
});

test('transition welcome only treats fully registered clients as eligible', () => {
  assert.equal(transition.profileComplete({ display_name: 'Jane Doe', date_of_birth: '1990-01-01', gender: 'female' }), true);
  assert.equal(transition.profileComplete({ display_name: 'Jane', date_of_birth: '1990-01-01', gender: 'female' }), false);
  assert.equal(transition.profileComplete({ display_name: 'Jane Doe', date_of_birth: null, gender: 'female' }), false);
  assert.equal(transition.profileComplete({ display_name: 'Jane Doe', date_of_birth: '1990-01-01', gender: null }), false);
});

test('transition welcome has durable once-only state and is routed before normal identity greeting', () => {
  assert.match(serviceSource, /whatsapp_transition_welcome_sent_at/);
  assert.match(serviceSource, /postSend/);
  assert.match(webhookSource, /processClientTransitionWelcome/);

  const transitionIndex = webhookSource.indexOf('const transitionWelcome=await processClientTransitionWelcome');
  const identityIndex = webhookSource.indexOf('const identity=await processClientIdentityMessage');
  assert.ok(transitionIndex >= 0, 'transition welcome route must exist');
  assert.ok(identityIndex > transitionIndex, 'transition welcome must run before the normal identity greeting');
});
