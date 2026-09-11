const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  canonicalExceptions,
} = require('../src/services/workspaceClinicHours');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('Workspace Clinic hours uses the canonical location_hours_exceptions schema', () => {
  const migration = read('migrations/022_sa_public_holidays_and_location_exceptions.sql');
  const service = read('src/services/workspaceClinicHours.js');

  assert.match(migration, /exception_type\s+TEXT\s+NOT NULL/);
  assert.match(migration, /starts_local\s+TIME/);
  assert.match(migration, /ends_local\s+TIME/);

  assert.match(service, /e\.exception_type/);
  assert.match(service, /e\.starts_local/);
  assert.match(service, /e\.ends_local/);
  assert.match(service, /\(location_id, exception_date, exception_type, starts_local, ends_local, actor_admin_id\)/);
  assert.doesNotMatch(service, /e\.mode|e\.open_time|e\.close_time/);
});

test('canonical exception projection accepts the production schema row shape', () => {
  const [open] = canonicalExceptions([{
    id: 12,
    exception_date: '2026-12-25',
    exception_type: 'open',
    starts_local: '09:00:00',
    ends_local: '13:00:00',
    holiday_name: 'Christmas Day',
    actor_admin_id: 41,
    updated_at: '2026-09-11T12:00:00.000Z',
  }]);

  assert.deepEqual(open, {
    id: 12,
    exceptionDate: '2026-12-25',
    exceptionType: 'open',
    startsLocal: '09:00',
    endsLocal: '13:00',
    holidayName: 'Christmas Day',
    actorAdminId: 41,
    updatedAt: '2026-09-11T12:00:00.000Z',
  });
});
