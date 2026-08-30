const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const interactivePath = path.join(__dirname, '..', 'src', 'services', 'adminInteractiveMenu.js');
const bookingUpdatePath = path.join(__dirname, '..', 'src', 'services', 'adminBookingUpdate.js');
const interactiveSource = fs.readFileSync(interactivePath, 'utf8');
const bookingUpdateSource = fs.readFileSync(bookingUpdatePath, 'utf8');
const { classifyRetiredAdminAction } = require('../src/services/adminAuthorityRetirement');

test('Finalize past visits is internal-only in ordinary staff WhatsApp', () => {
  assert.equal(classifyRetiredAdminAction('Finalize past visits').kind, 'internal_only');
  assert.doesNotMatch(interactiveSource, /processAdminAppointmentFinalizationMessage/);
});

test('Admin/Menu/Hi escape clears a stale Manage booking session before numeric prompting', () => {
  const escapeMatch = bookingUpdateSource.match(/if\s*\(\s*\['menu',\s*'admin menu',\s*'home',\s*'admin'\]\.includes\(n\)/);
  const numericPromptIndex = bookingUpdateSource.indexOf('Please send the numeric Shiloh appointment number.');
  assert.ok(escapeMatch && Number.isInteger(escapeMatch.index), 'stale Manage booking escape is missing');
  assert.ok(numericPromptIndex >= 0, 'numeric appointment prompt is missing');
  assert.ok(escapeMatch.index < numericPromptIndex, 'stale Manage booking can still intercept Admin/Menu/Hi before escape');
});

test('unknown authenticated staff payloads fail closed after retained routing', () => {
  assert.match(interactiveSource, /That staff WhatsApp action is unavailable\. No action was taken/);
});
