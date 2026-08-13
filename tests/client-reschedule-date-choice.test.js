const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'appointmentChange.js'), 'utf8');

test('reschedule date prompt offers quick choices without removing typed-date support', () => {
  assert.match(source, /Today/);
  assert.match(source, /Tomorrow/);
  assert.match(source, /Choose another date/);
  assert.match(source, /type another date/i);
  assert.match(source, /extractDate\(text\)/);
});

test('choose another date asks for free text rather than mutating appointment state', () => {
  assert.match(source, /reschedule_date_other/);
  assert.match(source, /Please type another date/i);
});
