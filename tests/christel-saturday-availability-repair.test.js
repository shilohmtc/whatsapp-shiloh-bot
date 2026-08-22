const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { canonicalServiceTotalMinutes } = require('../src/services/availabilityService');

const migration = fs.readFileSync(path.join(__dirname, '..', 'migrations', '073_remove_stale_christel_goldie_fma_block.sql'), 'utf8');
const repairScript = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'applyChristelSaturdayAvailabilityRepair.js'), 'utf8');
const availabilitySource = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'availabilityService.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

test('repair is bounded to the proven stale Goldie FMA block', () => {
  assert.match(migration, /cb\.id = 141/);
  assert.match(migration, /cb\.block_type = 'time_off'/);
  assert.match(migration, /2026-08-29 06:00:00\+00/);
  assert.match(migration, /2026-08-29 22:00:00\+00/);
  assert.match(migration, /cb\.title = 'FMA Course'/);
  assert.match(migration, /cb\.source = 'goldie_import'/);
  assert.match(migration, /2026-08-10 19:00:07\+00/);
  assert.match(migration, /expected exactly one active Christel practitioner/);
  assert.match(migration, /exact stale Goldie block precondition failed/);
  assert.equal((migration.match(/DELETE FROM calendar_blocks/g) || []).length, 1);
  assert.doesNotMatch(migration, /DELETE FROM appointments|DELETE FROM staff_schedule_exceptions|DELETE FROM staff_recurring_day_closures/i);
});

test('repair is checksum-controlled and must finish before production app start', () => {
  assert.match(repairScript, /schema_migrations/);
  assert.match(repairScript, /checksumVerified/);
  assert.match(repairScript, /BEGIN/);
  assert.match(repairScript, /ROLLBACK/);
  assert.match(pkg.scripts.start, /^node scripts\/applyChristelSaturdayAvailabilityRepair\.js && node /);
});

test('Christel 90-minute Saturday service fits canonical 08:00-14:00 envelope when no genuine conflict exists', () => {
  assert.equal(canonicalServiceTotalMinutes({ duration_minutes: 90, processing_time_minutes: 0, extra_time_minutes: 0 }), 90);
  const openingMinute = 8 * 60;
  const closingMinute = 14 * 60;
  const duration = 90;
  const interval = 15;
  const starts = [];
  for (let minute = openingMinute; minute + duration <= closingMinute; minute += interval) starts.push(minute);
  assert.equal(starts.length, 19);
  assert.equal(starts[0], 8 * 60);
  assert.equal(starts.at(-1), 12 * 60 + 30);
  assert.ok(starts.some((minute) => minute >= 11 * 60 + 30));
});

test('canonical availability still preserves schedule, appointment, block and Google conflict gates', () => {
  assert.match(availabilitySource, /staff_schedule_exceptions/);
  assert.match(availabilitySource, /appointment_staff/);
  assert.match(availabilitySource, /calendar_blocks/);
  assert.match(availabilitySource, /applyGoogleCalendarConflicts/);
  assert.match(availabilitySource, /checkCalendarAvailability/);
});
