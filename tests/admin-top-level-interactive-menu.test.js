const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { actionForId, topLevelInteractive, workspaceLauncherInteractive } = require('../src/services/adminInteractiveMenu');

const owner = {
  display_name: 'Christel',
  business_role: 'owner',
  calendar_scope: 'all_business',
  permissions: {
    'appointment:view': true,
    'client:lookup': true,
    'walkin:create': true,
    'staff:services:view': true,
    'service:pricing': true,
  },
};
const practitioner = {
  display_name: 'Abigail',
  staff_id: 2,
  business_role: 'employee_practitioner',
  calendar_scope: 'own_appointments',
  permissions: { 'appointment:view': true, 'client:lookup': true },
};

test('workspace keeps Calendar first and adds Pending approvals only when applicable', () => {
  assert.deepEqual(workspaceLauncherInteractive(owner, false).buttons.map((button) => button.id), [
    'admin_open_calendar',
    'admin_open_menu',
  ]);
  assert.deepEqual(workspaceLauncherInteractive(owner, true).buttons.map((button) => button.id), [
    'admin_open_calendar',
    'admin_open_menu',
    'admin_action_pending_approvals',
  ]);
});

test('owner Admin menu is one lightweight retained list', () => {
  const menu = topLevelInteractive(owner);
  assert.equal(menu.type, 'list');
  assert.deepEqual(menu.rows.map((row) => row.id), [
    'admin_action_open_calendar',
    'admin_action_today',
    'admin_action_tomorrow',
    'admin_action_reports',
    'admin_action_earnings',
    'admin_action_help',
    'admin_action_client',
    'admin_action_walkin',
    'admin_action_staff_services',
    'admin_action_pricing',
  ]);
  assert.ok(menu.rows.length <= 10);
});

test('practitioner menu remains capability scoped', () => {
  const ids = topLevelInteractive(practitioner).rows.map((row) => row.id);
  assert.deepEqual(ids, [
    'admin_action_open_calendar',
    'admin_action_today',
    'admin_action_tomorrow',
    'admin_action_reports',
    'admin_action_earnings',
    'admin_action_help',
    'admin_action_client',
    'admin_action_staff_services',
  ]);
  assert.equal(ids.includes('admin_action_pricing'), false);
  assert.equal(ids.includes('admin_action_walkin'), false);
});

test('every advertised stable action ID maps explicitly', () => {
  for (const row of topLevelInteractive(owner).rows) assert.ok(actionForId(row.id), row.id);
  assert.equal(actionForId('admin_action_unknown'), null);
  for (const retired of ['booking', 'manage_booking', 'schedule', 'finalize', 'demo_client']) {
    assert.equal(actionForId(`admin_action_${retired}`), null);
  }
});

test('webhook has one retained staff adapter and no admin fallthrough authority', () => {
  const webhook = fs.readFileSync(path.join(__dirname, '..', 'src/controllers/webhookController.js'), 'utf8');
  assert.match(webhook, /processAdminRetiredAuthorityMessage\(from,text\)/);
  assert.match(webhook, /processAdminInteractiveMenuMessage\(from,text\)/);
  assert.doesNotMatch(webhook, /processAdminAppointmentsByDateMessage\(from,text\)|processAdminAssistantMessage\(from,text\)/);
});
