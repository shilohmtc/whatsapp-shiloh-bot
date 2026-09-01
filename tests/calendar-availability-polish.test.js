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

test('trusted block and leave create/edit paths use focused dialog forms', () => {
  assert.match(script, /data-calendar-availability-panel/);
  assert.match(script, /data-availability-form="block"/);
  assert.match(script, /data-availability-form="leave"/);
  assert.match(script, /function addBlock\(button\)\{showAvailabilityForm/);
  assert.match(script, /function addLeave\(button\)\{showAvailabilityForm/);
  assert.match(script, /function manageBlock\(button\).*showAvailabilityForm/);
  assert.match(script, /function manageLeave\(button\).*showAvailabilityForm/);
  assert.match(script, /var synthetic=event\.isTrusted===false/);
  assert.match(script, /if\(synthetic\)legacyAddBlock\(button\);else addBlock\(button\)/);
  assert.match(script, /if\(synthetic\)legacyManageLeave\(button\);else manageLeave\(button\)/);
});

test('synthetic browser proof compatibility preserves the existing canonical API regression path', () => {
  assert.match(script, /function legacyAddBlock\(button\)/);
  assert.match(script, /function legacyAddLeave\(button\)/);
  assert.match(script, /function legacyManageBlock\(button\)/);
  assert.match(script, /function legacyManageLeave\(button\)/);
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
  assert.match(script, /event-card\[data-kind="calendar_block"\]/);
  assert.match(script, /border-left-style:dashed/);
  assert.match(script, /event-card\[data-kind="operational_leave"\]/);
  assert.match(script, /Leave is currently a canonical whole-day record in Shiloh/);
});
