const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calendarOperationalMutationsClientScript,
} = require('../src/presentation/calendarOperationalMutationsUx');

const script = calendarOperationalMutationsClientScript();

test('Calendar availability client script remains syntactically valid', () => {
  assert.doesNotThrow(() => new Function(script));
});

test('practitioner lane actions collapse block and leave into one Availability control', () => {
  assert.match(script, /function enhanceAvailabilityActions\(\)/);
  assert.match(script, /summary\.textContent='\+ Availability'/);
  assert.match(script, /Block time/);
  assert.match(script, /Add leave/);
  assert.match(script, /availability-menu-popover/);
});

test('block and leave create/edit use focused dialog forms instead of prompt collection', () => {
  assert.match(script, /data-calendar-availability-panel/);
  assert.match(script, /data-availability-form=\\"block\\"/);
  assert.match(script, /data-availability-form=\\"leave\\"/);
  assert.match(script, /function addBlock\(button\)\{showAvailabilityForm/);
  assert.match(script, /function addLeave\(button\)\{showAvailabilityForm/);
  assert.match(script, /function manageBlock\(button\).*showAvailabilityForm/);
  assert.match(script, /function manageLeave\(button\).*showAvailabilityForm/);
  assert.doesNotMatch(script, /Block start \(HH:MM\).*window\.prompt/);
  assert.doesNotMatch(script, /Operational leave reason.*window\.prompt/);
});

test('availability forms preserve existing canonical operation endpoints and concurrency guards', () => {
  assert.match(script, /request\('\/blocks','POST'/);
  assert.match(script, /request\('\/blocks\/'\+state\.id,'PATCH'/);
  assert.match(script, /request\('\/blocks\/'\+state\.id,'DELETE'/);
  assert.match(script, /request\('\/leave','POST'/);
  assert.match(script, /request\('\/leave\/'\+state\.id,'PATCH'/);
  assert.match(script, /request\('\/leave\/'\+state\.id,'DELETE'/);
  assert.match(script, /expectedRevision:state\.revision/);
  assert.match(script, /requestId:operationId\(\)/);
  assert.match(script, /x-shiloh-csrf-token/);
});

test('availability presentation distinguishes blocks and leave without changing canonical kinds', () => {
  assert.match(script, /event-card\[data-kind=\\"calendar_block\\"\]/);
  assert.match(script, /border-left-style:dashed/);
  assert.match(script, /event-card\[data-kind=\\"operational_leave\\"\]/);
  assert.match(script, /Leave is currently a canonical whole-day record in Shiloh/);
});
