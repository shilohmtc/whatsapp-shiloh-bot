const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isGreetingNavigation,
  isBookAnotherNavigation,
  discoveryCommandForNavigation,
  installClientNavigationPriority,
} = require('../src/services/clientNavigationPriority');

test('generic greetings remain canonical main-menu navigation commands', () => {
  for (const text of ['Hello', 'hi', 'START', 'Good morning!']) {
    assert.equal(isGreetingNavigation(text), true, text);
    assert.equal(discoveryCommandForNavigation(text), 'main menu', text);
  }
});

test('book-another natural language routes to canonical book-now command', () => {
  for (const text of [
    'Book another treatment',
    'book another appointment',
    'another appointment',
    'I want to make another booking',
    'I want another appointment',
  ]) {
    assert.equal(isBookAnotherNavigation(text), true, text);
    assert.equal(discoveryCommandForNavigation(text), 'client_book_now', text);
  }
});

test('ordinary booking answers remain untouched', () => {
  for (const text of ['Afternoon', '14:00', 'Deep Tissue Massage', 'next Friday']) {
    assert.equal(discoveryCommandForNavigation(text), null, text);
  }
});

test('greeting priority preserves first-contact identity branches and only bypasses matched-complete clients', async () => {
  const identityCalls = [];
  const discoveryCalls = [];
  const identityService = {
    async processClientIdentityMessage(sender, text) {
      identityCalls.push([sender, text]);
      if (text === 'Hello') return { handled: true, identityStatus: 'unknown', reply: 'registration' };
      if (text === 'Hi') return { handled: true, identityStatus: 'matched_incomplete', reply: 'missing detail', client: { id: 12 } };
      if (text === 'Hey') return { handled: true, identityStatus: 'ambiguous', reply: 'verification required' };
      if (text === 'Good morning') return { handled: true, identityStatus: 'matched_complete', reply: 'welcome back', client: { id: 44 } };
      return { handled: true, reply: `identity:${text}` };
    },
  };
  const discoveryService = {
    async processClientDiscoveryMessage(sender, text) {
      discoveryCalls.push([sender, text]);
      return { handled: true, command: text };
    },
  };

  installClientNavigationPriority({ identityService, discoveryService });

  assert.deepEqual(await identityService.processClientIdentityMessage('2782', 'Hello'), {
    handled: true,
    identityStatus: 'unknown',
    reply: 'registration',
  });
  assert.deepEqual(await identityService.processClientIdentityMessage('2782', 'Hi'), {
    handled: true,
    identityStatus: 'matched_incomplete',
    reply: 'missing detail',
    client: { id: 12 },
  });
  assert.deepEqual(await identityService.processClientIdentityMessage('2782', 'Hey'), {
    handled: true,
    identityStatus: 'ambiguous',
    reply: 'verification required',
  });
  assert.deepEqual(await identityService.processClientIdentityMessage('2782', 'Good morning'), {
    handled: false,
    navigationPriority: true,
    identityStatus: 'matched_complete',
    client: { id: 44 },
  });

  const identityCallCountBeforeBookAnother = identityCalls.length;
  assert.deepEqual(await identityService.processClientIdentityMessage('2782', 'Book another treatment'), {
    handled: false,
    navigationPriority: true,
  });
  assert.equal(identityCalls.length, identityCallCountBeforeBookAnother, 'book-another navigation must still bypass identity');

  assert.deepEqual(await identityService.processClientIdentityMessage('2782', 'Afternoon'), {
    handled: true,
    reply: 'identity:Afternoon',
  });

  assert.deepEqual(await discoveryService.processClientDiscoveryMessage('2782', 'Good morning'), {
    handled: true,
    command: 'main menu',
  });
  assert.deepEqual(await discoveryService.processClientDiscoveryMessage('2782', 'Book another treatment'), {
    handled: true,
    command: 'client_book_now',
  });
  assert.deepEqual(await discoveryService.processClientDiscoveryMessage('2782', 'Afternoon'), {
    handled: true,
    command: 'Afternoon',
  });

  assert.deepEqual(identityCalls, [
    ['2782', 'Hello'],
    ['2782', 'Hi'],
    ['2782', 'Hey'],
    ['2782', 'Good morning'],
    ['2782', 'Afternoon'],
  ]);
  assert.deepEqual(discoveryCalls, [
    ['2782', 'main menu'],
    ['2782', 'client_book_now'],
    ['2782', 'Afternoon'],
  ]);
});

test('first-contact transition composition can prepend the universal welcome through the installed wrapper', async () => {
  const identityService = {
    async processClientIdentityMessage() {
      return { handled: true, identityStatus: 'unknown', reply: 'registration prompt' };
    },
  };
  const discoveryService = {
    async processClientDiscoveryMessage() {
      throw new Error('discovery should not run for an undelivered first-contact welcome');
    },
  };
  installClientNavigationPriority({ identityService, discoveryService });

  const identity = await identityService.processClientIdentityMessage('2782', 'Hi');
  const transitionResult = identity.handled
    ? { handled: true, reply: `UNIVERSAL WELCOME\n\n${identity.reply}` }
    : identity;

  assert.equal(transitionResult.handled, true);
  assert.match(transitionResult.reply, /^UNIVERSAL WELCOME/);
  assert.match(transitionResult.reply, /registration prompt$/);
});
