const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isGreetingNavigation,
  isBookAnotherNavigation,
  discoveryCommandForNavigation,
  installClientNavigationPriority,
} = require('../src/services/clientNavigationPriority');

test('generic greetings route to main menu navigation', () => {
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

test('installed priority bypasses identity and rewrites only explicit navigation', async () => {
  const identityCalls = [];
  const discoveryCalls = [];
  const identityService = {
    async processClientIdentityMessage(sender, text) {
      identityCalls.push([sender, text]);
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
    handled: false,
    navigationPriority: true,
  });
  assert.equal(identityCalls.length, 0);
  assert.deepEqual(await discoveryService.processClientDiscoveryMessage('2782', 'Hello'), {
    handled: true,
    command: 'main menu',
  });

  assert.deepEqual(await identityService.processClientIdentityMessage('2782', 'Book another treatment'), {
    handled: false,
    navigationPriority: true,
  });
  assert.deepEqual(await discoveryService.processClientDiscoveryMessage('2782', 'Book another treatment'), {
    handled: true,
    command: 'client_book_now',
  });

  assert.deepEqual(await identityService.processClientIdentityMessage('2782', 'Afternoon'), {
    handled: true,
    reply: 'identity:Afternoon',
  });
  assert.deepEqual(await discoveryService.processClientDiscoveryMessage('2782', 'Afternoon'), {
    handled: true,
    command: 'Afternoon',
  });

  assert.deepEqual(identityCalls, [['2782', 'Afternoon']]);
  assert.deepEqual(discoveryCalls, [
    ['2782', 'main menu'],
    ['2782', 'client_book_now'],
    ['2782', 'Afternoon'],
  ]);
});
