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

test('universal welcome uses the approved client-facing copy', () => {
  const reply = transition.buildUniversalWelcome();
  assert.match(reply, /you’re in the right place/i);
  assert.match(reply, /Shiloh, our AI Assistant/i);
  assert.match(reply, /Choosing the right treatment/i);
  assert.match(reply, /Checking availability/i);
  assert.match(reply, /Making or managing your appointment/i);
  assert.match(reply, /Calls & SMS: 066 239 9138/i);
  assert.match(reply, /right here on WhatsApp/i);
  assert.doesNotMatch(reply, /WhatsApp is not available on this number/i);
});

test('registered clients receive a clear already-registered branch and guided actions', () => {
  const reply = transition.buildTransitionWelcome();
  const interactive = transition.registeredClientInteractive();
  assert.match(reply, /already registered with Shiloh/i);
  assert.match(reply, /no need to register again/i);
  assert.match(reply, /How would you like to proceed/i);
  assert.equal(interactive.type, 'list');
  assert.deepEqual(
    interactive.rows.map((row) => row.id),
    ['client_book_now', 'client_browse_services', 'client_practitioners', 'main menu']
  );
});

test('new clients receive the same universal welcome before registration', () => {
  const reply = `${transition.buildUniversalWelcome()}\n\n${transition.buildNewClientPrompt()}`;
  assert.match(reply, /Welcome to Shiloh/i);
  assert.match(reply, /looks like you’re new to Shiloh/i);
  assert.match(reply, /quick registration/i);
  assert.match(reply, /first name, surname, date of birth and gender/i);
});

test('universal welcome remains greeting-only so direct operational intent is not intercepted', () => {
  assert.equal(transition.isGreetingOnly('Hello'), true);
  assert.equal(transition.isGreetingOnly('Good morning!'), true);
  assert.equal(transition.isGreetingOnly('I need to reschedule'), false);
  assert.equal(transition.isGreetingOnly('Book me for Friday'), false);
});

test('registered branch only treats fully registered clients as eligible', () => {
  assert.equal(transition.profileComplete({ display_name: 'Jane Doe', date_of_birth: '1990-01-01', gender: 'female' }), true);
  assert.equal(transition.profileComplete({ display_name: 'Jane', date_of_birth: '1990-01-01', gender: 'female' }), false);
  assert.equal(transition.profileComplete({ display_name: 'Jane Doe', date_of_birth: null, gender: 'female' }), false);
  assert.equal(transition.profileComplete({ display_name: 'Jane Doe', date_of_birth: '1990-01-01', gender: null }), false);
});

test('v2 welcome uses durable phone-level delivery state and post-send marking', () => {
  assert.equal(transition.UNIVERSAL_WELCOME_VERSION, 'v2');
  assert.match(serviceSource, /client_whatsapp_welcome_deliveries/);
  assert.match(serviceSource, /whatsapp_universal_welcome_v2_sent_at/);
  assert.match(serviceSource, /postSend/);
  assert.match(serviceSource, /pendingOnboardingSession/);
  assert.match(webhookSource, /processClientTransitionWelcome/);

  const transitionIndex = webhookSource.indexOf('const transitionWelcome=await processClientTransitionWelcome');
  const identityIndex = webhookSource.indexOf('const identity=await processClientIdentityMessage');
  assert.ok(transitionIndex >= 0, 'universal welcome route must exist');
  assert.ok(identityIndex > transitionIndex, 'universal welcome must run before the normal identity greeting');
});
