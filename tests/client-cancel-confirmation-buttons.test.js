const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'appointmentChange.js'), 'utf8');

test('destructive cancellation review uses deterministic confirm/keep buttons', () => {
  assert.match(source, /Please confirm the cancellation:/);
  assert.match(source, /latePolicy\(a\.starts_at\)/);
  assert.match(source, /type:\s*['"]button['"]/);
  assert.match(source, /id:\s*['"]yes['"],\s*title:\s*['"]Confirm cancellation['"]/);
  assert.match(source, /id:\s*['"]stop['"],\s*title:\s*['"]Keep appointment['"]/);
});

test('typed YES and STOP remain supported as cancellation fallbacks', () => {
  assert.match(source, /function isConfirmation/);
  assert.match(source, /function isAbort/);
  assert.match(source, /YES/);
  assert.match(source, /STOP/);
});

test('cancellation review does not perform the canonical cancellation before explicit confirmation', () => {
  const review = source.indexOf('Please confirm the cancellation:');
  const cancelWrite = source.indexOf('await cancelCanonical', review);
  assert.ok(review >= 0 && cancelWrite > review);
});
