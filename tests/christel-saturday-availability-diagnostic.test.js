const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const diagnosticPath = path.join(__dirname, '..', 'src', 'services', 'christelSaturdayAvailabilityDiagnostic.js');
const bootstrapPath = path.join(__dirname, '..', 'src', 'bootstrap', 'christelSaturdayAvailabilityDiagnosticBootstrap.js');
const packagePath = path.join(__dirname, '..', 'package.json');
const source = fs.readFileSync(diagnosticPath, 'utf8');
const bootstrap = fs.readFileSync(bootstrapPath, 'utf8');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

test('diagnostic is fixed to the authorized Christel Saturday case', () => {
  assert.match(source, /TARGET_DATE = '2026-08-29'/);
  assert.match(source, /TARGET_STAFF = 'Christel'/);
  assert.match(source, /TARGET_SERVICE = 'Full Body Swedish'/);
});

test('diagnostic identifies the pre-Google gate transition without operational mutation', () => {
  for (const label of [
    'clinic_window_count',
    'base_window_count',
    'recurring_closure_count',
    'schedule_exception_count',
    'raw_candidate_count',
    'after_exception_count',
    'after_appointment_count',
    'after_block_count',
  ]) assert.match(source, new RegExp(label));

  assert.doesNotMatch(source, /\bINSERT\b/i);
  assert.doesNotMatch(source, /\bUPDATE\b/i);
  assert.doesNotMatch(source, /\bDELETE\b/i);
  assert.doesNotMatch(source, /createBookingEvent|createPractitionerBookingEvent|updateBookingEvent|cancelBookingEvent/);
});

test('diagnostic reuses canonical availability after pre-Google counts', () => {
  assert.match(source, /listAvailableSlots\(\{/);
  assert.match(source, /calendarConflictCount/);
  assert.match(source, /slotCount/);
});

test('temporary diagnostic runs only on production start command', () => {
  assert.match(pkg.scripts.start, /christelSaturdayAvailabilityDiagnosticBootstrap/);
  assert.doesNotMatch(pkg.scripts.dev, /christelSaturdayAvailabilityDiagnosticBootstrap/);
  assert.match(bootstrap, /runChristelSaturdayAvailabilityDiagnostic/);
  assert.match(bootstrap, /\.catch/);
});
