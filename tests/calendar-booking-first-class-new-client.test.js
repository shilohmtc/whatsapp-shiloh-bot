const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calendarCreateBookingClientChoiceScript,
} = require('../src/presentation/calendarCreateBookingClientChoiceUx');

test('Calendar booking exposes existing-client and new-client as first-class choices', () => {
  const script = calendarCreateBookingClientChoiceScript();

  assert.doesNotThrow(() => new Function(script));
  assert.match(script, /Find existing client/);
  assert.match(script, /\+ New client/);
  assert.match(script, /data-client-mode-existing/);
  assert.match(script, /data-client-mode-new/);
  assert.match(script, /Choose client type/);
  assert.match(script, /Search CRM/);
});

test('New-client choice opens directly without requiring a failed CRM search', () => {
  const script = calendarCreateBookingClientChoiceScript();

  assert.match(script, /newButton\.addEventListener\('click'/);
  assert.match(script, /setMode\('new'\)/);
  assert.match(script, /newPanel\.hidden=!isNew/);
  assert.match(script, /Enter the new client’s name and South African mobile number/);
  assert.match(script, /if\(newName\)newName\.focus\(\)/);
});

test('Client-choice enhancement cannot write CRM or bypass guarded booking authority', () => {
  const script = calendarCreateBookingClientChoiceScript();

  assert.doesNotMatch(script, /\bfetch\s*\(/);
  assert.doesNotMatch(script, /XMLHttpRequest/);
  assert.doesNotMatch(script, /\/prepare/);
  assert.doesNotMatch(script, /\/confirm/);
  assert.doesNotMatch(script, /\/client-search/);
  assert.doesNotMatch(script, /clientId\s*:/);
  assert.doesNotMatch(script, /newClient\s*:/);
});

test('Switching modes blocks stale client selection until the visible choice is selected', () => {
  const script = calendarCreateBookingClientChoiceScript();

  assert.match(script, /clearVisibleSelection\(\);if\(review\)review\.disabled=true;setMode\('existing'\)/);
  assert.match(script, /clearVisibleSelection\(\);if\(review\)review\.disabled=true;setMode\('new'\)/);
  assert.match(script, /New client draft/);
  assert.match(script, /if\(review\)review\.disabled=false/);
  assert.match(script, /CRM #/);
});
