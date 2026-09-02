const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CLIENT_BROWSE_QUERY,
  calendarCreateBookingClientChoiceScript,
} = require('../src/presentation/calendarCreateBookingClientChoiceUx');

test('Calendar booking presents Existing clients first, with Search clients secondary and Add new client explicit', () => {
  const script = calendarCreateBookingClientChoiceScript();

  assert.doesNotThrow(() => new Function(script));
  assert.match(script, /Existing clients/);
  assert.match(script, /Search clients/);
  assert.match(script, /Add new client/);
  assert.doesNotMatch(script, /Find existing client|\+ New client|Client registration/);
  assert.match(script, /data-client-mode-existing/);
  assert.match(script, /data-client-mode-search/);
  assert.match(script, /data-client-mode-new/);
  assert.match(script, /Choose client/);
  assert.match(script, /Search by name or mobile number/);
  assert.doesNotMatch(script, /CRM V2/);
});

test('Existing-client choice loads a bounded browse request through the canonical guarded search control', () => {
  const script = calendarCreateBookingClientChoiceScript();

  assert.equal(CLIENT_BROWSE_QUERY, '__shiloh_calendar_active_clients_v1__');
  assert.match(script, /var BROWSE_QUERY='__shiloh_calendar_active_clients_v1__'/);
  assert.match(script, /function loadExistingClients\(\)\{setStatus\('Loading existing clients…'\);search\.value=BROWSE_QUERY;searchAction\.click\(\);search\.value=''\;\}/);
  assert.match(script, /setMode\('browse'\);\nloadExistingClients\(\);/);
  assert.doesNotMatch(script, /\bfetch\s*\(/);
  assert.doesNotMatch(script, /XMLHttpRequest/);
});

test('New-client choice opens directly with only Name and Mobile without requiring a failed search', () => {
  const script = calendarCreateBookingClientChoiceScript();

  assert.match(script, /newButton\.addEventListener\('click'/);
  assert.match(script, /setMode\('new'\)/);
  assert.match(script, /newPanel\.hidden=!isNew/);
  assert.match(script, /Enter the new client’s name and South African mobile number/);
  assert.doesNotMatch(script, /identity key|CRM V2/);
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

test('Switching picker modes blocks stale selection while selected results preserve explicit booking choice', () => {
  const script = calendarCreateBookingClientChoiceScript();

  assert.match(script, /clearVisibleSelection\(\);if\(review\)review\.disabled=true;setMode\('browse'\);loadExistingClients\(\)/);
  assert.match(script, /clearVisibleSelection\(\);if\(review\)review\.disabled=true;setMode\('search'\)/);
  assert.match(script, /clearVisibleSelection\(\);if\(review\)review\.disabled=true;setMode\('new'\)/);
  assert.match(script, /calendar-client-mode/);
  assert.match(script, /if\(!preserveSelection\)window\.dispatchEvent/);
  assert.match(script, /setMode\('new',true\)/);
  assert.match(script, /setMode\('browse',true\)/);
  assert.match(script, /if\(review\)review\.disabled=false/);
  assert.match(script, /data-client-selection/);
  assert.match(script, /getAttribute\('data-client-selection'\)==='existing'/);
});
