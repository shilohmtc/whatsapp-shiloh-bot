const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const transition = require('../src/services/clientTransitionWelcome');
const { commandForAdminButton } = require('../src/services/adminEarningsButtons');

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
  assert.match(reply, /browse our treatments, descriptions and prices here/i);
  assert.match(reply, /https:\/\/shiloh-whatsapp-bot\.onrender\.com\/book/i);
  assert.match(reply, /start your booking directly from the treatment page/i);
  assert.match(reply, /come back here and chat with me/i);
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
  assert.match(interactive.body, /already registered with Shiloh/i);
  assert.match(interactive.body, /no need to register again/i);
  assert.deepEqual(
    interactive.rows.map((row) => row.id),
    ['services', 'client_browse_services', 'client_practitioners', 'main menu']
  );
});

test('Book appointment enters deterministic service discovery instead of stale booking intent handling', () => {
  const interactive = transition.registeredClientInteractive();
  const book = interactive.rows.find((row) => row.title === 'Book appointment');
  assert.ok(book, 'Book appointment action must exist');
  assert.equal(book.id, 'services');
  assert.notEqual(book.id, 'client_book_now');
});

test('already-delivered legacy Book appointment payload remains compatible', () => {
  assert.equal(commandForAdminButton('client_book_now'), 'services');
  assert.match(webhookSource, /commandForAdminButton\(id\)\|\|id\|\|null/);
});

test('registered-client interactive body stays within Meta limit and excludes long welcome copy', () => {
  const universal = transition.buildUniversalWelcome();
  const interactive = transition.registeredClientInteractive();

  assert.equal(transition.WHATSAPP_INTERACTIVE_BODY_MAX, 1024);
  assert.ok(
    interactive.body.length <= transition.WHATSAPP_INTERACTIVE_BODY_MAX,
    `interactive body must be <= ${transition.WHATSAPP_INTERACTIVE_BODY_MAX} characters`
  );
  assert.equal(interactive.body, transition.buildRegisteredClientPrompt());
  assert.notEqual(interactive.body, transition.buildTransitionWelcome());
  assert.doesNotMatch(interactive.body, /Welcome to Shiloh/i);
  assert.ok(
    universal.length > transition.WHATSAPP_INTERACTIVE_BODY_MAX,
    'approved universal welcome should remain plain text rather than be embedded in an interactive body'
  );
});

test('registered-client delivery sends compact list before marking the welcome delivered', () => {
  const postSendIndex = serviceSource.indexOf('function registeredClientPostSend');
  const listIndex = serviceSource.indexOf('await sendWhatsAppList(', postSendIndex);
  const markIndex = serviceSource.indexOf('await markUniversalWelcomeSent(phone, clientId);', postSendIndex);
  const registeredBranchIndex = serviceSource.indexOf("if (clientState.status === 'unique')");
  const plainReplyIndex = serviceSource.indexOf('reply: buildUniversalWelcome()', registeredBranchIndex);

  assert.ok(postSendIndex >= 0, 'registered post-send sequencer must exist');
  assert.ok(listIndex > postSendIndex, 'compact interactive list must be sent in post-send sequencing');
  assert.ok(markIndex > listIndex, 'delivery ledger must be marked only after the interactive list succeeds');
  assert.ok(plainReplyIndex > registeredBranchIndex, 'registered clients must receive the long universal welcome as plain text first');
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
