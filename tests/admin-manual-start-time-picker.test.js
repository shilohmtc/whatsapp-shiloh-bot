const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const patchSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'bootstrap', 'adminManualStartTimePickerPatch.js'), 'utf8');
const flowSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminMobileBookingFlow.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

test('admin manual booking retains authoritative 15-minute candidate generation', () => {
  assert.match(flowSource, /intervalMinutes:\s*15/);
  assert.match(flowSource, /listAvailableSlots/);
});

test('admin manual booking presents start time as the primary choice', () => {
  const sample = {
    handled: true,
    interactive: {
      type: 'list',
      body: '*Wed, 19 Aug 2026 — Choose a time*',
      buttonText: 'Choose time',
      sectionTitle: 'Available times',
      rows: [
        { id: 'admin_booking_slot:2', title: '08:30–10:15', description: 'Available slot' },
        { id: 'admin_booking_page:1', title: 'Next →', description: 'Show more choices' },
      ],
    },
  };
  const { polishManualStartTimeInteractive } = require('../src/bootstrap/adminManualStartTimePickerPatch');
  const result = polishManualStartTimeInteractive(sample);
  assert.equal(result.interactive.rows[0].title, '08:30');
  assert.equal(result.interactive.rows[0].description, 'Ends 10:15 · available start');
  assert.equal(result.interactive.rows[0].id, 'admin_booking_slot:2');
  assert.equal(result.interactive.rows[1].title, 'Next →');
  assert.match(result.interactive.body, /available 15-minute start time/i);
});

test('manual start-time presentation does not create override or mutation logic', () => {
  assert.doesNotMatch(patchSource, /UPDATE\s+appointments/i);
  assert.doesNotMatch(patchSource, /INSERT\s+INTO\s+appointments/i);
  assert.doesNotMatch(patchSource, /override|double[- ]book/i);
});

test('production preloads the admin manual start-time presentation after booking guards', () => {
  assert.match(pkg.scripts.start, /adminManualStartTimePickerPatch\.js/);
  assert.ok(pkg.scripts.start.indexOf('adminBookingChangeConfirmationCommitPatch.js') < pkg.scripts.start.indexOf('adminManualStartTimePickerPatch.js'));
});
