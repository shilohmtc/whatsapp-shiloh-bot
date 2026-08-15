const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const interactivePath = path.join(__dirname, '..', 'src', 'services', 'adminInteractiveMenu.js');
const mobilePath = path.join(__dirname, '..', 'src', 'services', 'adminMobileMenu.js');
const interactiveSource = fs.readFileSync(interactivePath, 'utf8');
const mobileSource = fs.readFileSync(mobilePath, 'utf8');
const { actionForLabel } = require(interactivePath);

test('Finalize past visits is a canonical action in the current Appointments section', () => {
  const action = actionForLabel('Finalize past visits');
  assert.ok(action, 'Finalize past visits is missing from stable admin actions');
  assert.equal(action.key, 'finalize');
  assert.equal(action.command, 'Finalize past appointments');
});

test('Admin home/menu/greeting escape runs before stale guided booking flows', () => {
  const escapeIndex = mobileSource.indexOf("if(['menu','admin menu','home'].includes(v)||isGreeting(raw))");
  const staleFlowIndex = mobileSource.indexOf('const bookingUpdateFlow=await processAdminBookingUpdateMessage');
  assert.ok(escapeIndex >= 0, 'admin escape handler is missing');
  assert.ok(staleFlowIndex >= 0, 'booking update flow hook is missing');
  assert.ok(escapeIndex < staleFlowIndex, 'stale guided flow can intercept Admin/Menu/Hi before the home escape');
});

test('section refresh fails closed when role-scoped menu has no interactive body', () => {
  assert.match(
    interactiveSource,
    /if \(!menuResult\?\.handled \|\| !menuResult\?\.interactive\?\.body\)/,
    'section rendering still dereferences menuResult.interactive.body without a fail-closed guard'
  );
});
