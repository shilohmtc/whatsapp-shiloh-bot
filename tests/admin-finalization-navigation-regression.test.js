const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const interactivePath = path.join(__dirname, '..', 'src', 'services', 'adminInteractiveMenu.js');
const bookingUpdatePath = path.join(__dirname, '..', 'src', 'services', 'adminBookingUpdate.js');
const interactiveSource = fs.readFileSync(interactivePath, 'utf8');
const bookingUpdateSource = fs.readFileSync(bookingUpdatePath, 'utf8');
const { actionForLabel } = require(interactivePath);

test('Finalize past visits is a canonical action in the current Appointments section', () => {
  const action = actionForLabel('Finalize past visits');
  assert.ok(action, 'Finalize past visits is missing from stable admin actions');
  assert.equal(action.key, 'finalize');
  assert.equal(action.command, 'Finalize past appointments');
});

test('Admin/Menu/Hi escape clears a stale Manage booking session before numeric prompting', () => {
  const escapeIndex = bookingUpdateSource.indexOf("if(['menu','admin menu','home','admin'].includes(n)");
  const numericPromptIndex = bookingUpdateSource.indexOf("Please send the numeric Shiloh appointment number.");
  assert.ok(escapeIndex >= 0, 'stale Manage booking escape is missing');
  assert.ok(numericPromptIndex >= 0, 'numeric appointment prompt is missing');
  assert.ok(escapeIndex < numericPromptIndex, 'stale Manage booking can still intercept Admin/Menu/Hi before escape');
});

test('section refresh fails closed when role-scoped menu has no interactive body', () => {
  assert.match(
    interactiveSource,
    /if \(!menuResult\?\.handled \|\| !menuResult\?\.interactive\?\.body\)/,
    'section rendering still dereferences menuResult.interactive.body without a fail-closed guard'
  );
});
