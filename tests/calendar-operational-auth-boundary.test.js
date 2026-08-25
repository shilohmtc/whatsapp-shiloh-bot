const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { deriveCalendarCapabilities } = require('../src/services/calendarAccess');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const calendarRouteSource = read('src/routes/calendar.js');
const readOnlyRouteSource = read('src/routes/calendarReadOnlyUx.js');
const migrationSource = read('migrations/081_calendar_operational_assurance_cutover.sql');

function account(overrides = {}) {
  return {
    calendar_role: 'read_only',
    admin_active: true,
    staff_id: 7,
    staff_status: 'active',
    permissions: { 'calendar:read': true },
    ...overrides,
  };
}

test('operational Calendar authentication is no longer constrained by the former pilot allow-list', () => {
  assert.doesNotMatch(calendarRouteSource, /createPilotGuardedStaffBrowserSessionService|staffBrowserPilotGate/);
  assert.match(calendarRouteSource, /const staffBrowserSessionService = createStaffBrowserSessionService\(/);
  assert.match(calendarRouteSource, /role\/capability model/);
});

test('authorized active staff receive whole-Calendar read-only authority while lifecycle mutation remains denied', () => {
  const capabilities = deriveCalendarCapabilities(account());
  assert.equal(capabilities.read, true);
  assert.equal(capabilities.create, false);
  assert.equal(capabilities.edit, false);
  assert.equal(capabilities.reschedule, false);
  assert.equal(capabilities.cancel, false);
  assert.equal(capabilities.syncRetry, false);
  assert.match(migrationSource, /calendar_scope = CASE WHEN active = TRUE THEN 'all_business'/);
  assert.match(migrationSource, /'\{"calendar:read":true,"calendar:create":false,"calendar:edit":false,"calendar:reschedule":false,"calendar:cancel":false,"calendar:sync_retry":false\}'::jsonb/);
});

test('inactive accounts have no Calendar capability', () => {
  const capabilities = deriveCalendarCapabilities(account({ admin_active: false }));
  assert.deepEqual(capabilities, { role: 'read_only', read: false, create: false, edit: false, reschedule: false, cancel: false, syncRetry: false });
});

test('timeline authorization is re-resolved before any SchedulingTimeline model read', () => {
  const authIndex = readOnlyRouteSource.indexOf("resolveOperator(adminId, 'calendar:read'");
  const modelIndex = readOnlyRouteSource.indexOf('const model = await buildModel');
  assert.ok(authIndex >= 0, 'calendar:read capability check must exist');
  assert.ok(modelIndex > authIndex, 'server capability must be resolved before SchedulingTimeline is read');
  assert.match(readOnlyRouteSource, /error\.code = 'CALENDAR_ACCESS_FORBIDDEN'/);
  assert.match(readOnlyRouteSource, /statusForError[\s\S]*CALENDAR_ACCESS_FORBIDDEN[\s\S]*403/);
});
