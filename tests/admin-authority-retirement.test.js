const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const webhook = read('src/controllers/webhookController.js');
const assistant = read('src/services/adminAssistant.js');
const interactive = read('src/services/adminInteractiveMenu.js');
const mobile = read('src/services/adminMobileMenu.js');
const {
  classifyRetiredAdminAction,
  processRetiredAdminAuthorityMessage,
} = require('../src/services/adminAuthorityRetirement');
const { commandForAdminButton } = require('../src/services/adminEarningsButtons');
const { getMenuOptions } = require('../src/services/adminMobileMenu');
const { topLevelInteractive, workspaceLauncherInteractive } = require('../src/services/adminInteractiveMenu');

const owner = {
  id: 1,
  staff_id: 10,
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

test('ordinary Admin menu is reduced to four quick views while Calendar stays on Workspace', () => {
  assert.deepEqual(getMenuOptions(owner).map((option) => option.key), [
    'today',
    'tomorrow',
    'reports',
    'earnings',
  ]);
  const menu = topLevelInteractive(owner);
  assert.equal(menu.type, 'list');
  assert.deepEqual(menu.rows.map((row) => row.id), [
    'admin_action_today',
    'admin_action_tomorrow',
    'admin_action_reports',
    'admin_action_earnings',
  ]);
  assert.deepEqual(workspaceLauncherInteractive(owner, false).buttons.map((button) => button.id), [
    'admin_open_calendar',
    'admin_open_menu',
  ]);
  assert.doesNotMatch(JSON.stringify(menu), /calendar|help|client|walk-in|staff services|pricing/i);
});

test('free text and stale IDs classify into Calendar, generic Earnings, internal-only, or retired staff surface', () => {
  for (const input of [
    'Appointments',
    'Find availability',
    'Make a booking',
    'Manage booking',
    'Reschedule appointment',
    'Reassign appointment',
    'Cancel appointment',
    'Block time',
    'Working hours',
    'Leave / special availability',
    'Freelancer availability',
    'Public holiday hours',
    'admin_menu_appointments',
    'admin_booking_confirm',
    'manage_booking_select_123',
    'manage_cancel_booking_123',
    'admin_block_confirm',
    'schedule_leave_submit',
  ]) assert.equal(classifyRetiredAdminAction(input)?.kind, 'calendar', input);

  for (const input of ['Demo Client', 'Reset Juvan', 'Calendar integrity scan', 'Finalize past appointments', 'finalize_completed_123', 'Delete client 123', 'roster audit']) {
    assert.equal(classifyRetiredAdminAction(input)?.kind, 'internal_only', input);
  }

  for (const input of ['Christel earnings today', 'admin_abigail_earnings_week', 'admin_retired_named_earnings']) {
    assert.equal(classifyRetiredAdminAction(input)?.kind, 'generic_earnings', input);
  }

  for (const input of [
    'Help',
    'Find client Juvan',
    'Client details',
    'Add walk-in',
    'Staff services',
    'Services & pricing',
    'admin_action_help',
    'admin_action_client',
    'admin_action_walkin',
    'admin_action_staff_services',
    'admin_action_pricing',
    'pricing_service_42',
    'pricing_confirm',
  ]) assert.equal(classifyRetiredAdminAction(input)?.kind, 'retired', input);
});

test('retained operational and client controls are not captured by retirement classification', () => {
  for (const input of [
    'Today',
    'Tomorrow',
    'Reports',
    'Earnings',
    'Redeem loyalty 1 | 2',
    'approve_booking_123',
    'decline_booking_123',
    'client_book_now',
    'Open Calendar',
  ]) assert.equal(classifyRetiredAdminAction(input), null, input);
  assert.equal(commandForAdminButton('client_book_now'), 'services');
});

test('stale removed menu buttons cannot reconstruct retired ordinary staff handlers', () => {
  assert.equal(commandForAdminButton('admin_action_help'), 'admin_retired_staff_action');
  assert.equal(commandForAdminButton('admin_action_client'), 'admin_retired_staff_action');
  assert.equal(commandForAdminButton('admin_action_walkin'), 'admin_retired_staff_action');
  assert.equal(commandForAdminButton('admin_action_staff_services'), 'admin_retired_staff_action');
  assert.equal(commandForAdminButton('admin_action_pricing'), 'admin_retired_staff_action');
  assert.equal(commandForAdminButton('admin_action_open_calendar'), 'admin_open_calendar');
  assert.equal(commandForAdminButton('admin_appointment_booking'), 'admin_retired_calendar_action');
  assert.equal(commandForAdminButton('admin_appointment_finalize'), 'admin_retired_internal_action');
  assert.equal(commandForAdminButton('admin_christel_earnings_today'), 'admin_retired_named_earnings');
  assert.equal(commandForAdminButton('admin_appointment_today'), 'Today');
  assert.equal(commandForAdminButton('admin_appointment_tomorrow'), 'Tomorrow');
});

test('ordinary staff router no longer imports or invokes retired transitional handlers', () => {
  for (const handler of [
    'processAdminHelpMessage',
    'processAdminWalkinMessage',
    'processAdminStaffServicesMessage',
    'processAdminServicePricingMessage',
  ]) {
    assert.doesNotMatch(interactive, new RegExp(handler), handler);
    assert.doesNotMatch(mobile, new RegExp(handler), handler);
  }
  assert.match(webhook, /processClientBookingApprovalMessage\(from,text\)/);
  assert.match(webhook, /processAdminRetiredAuthorityMessage\(from,text\)/);
  assert.match(webhook, /processAdminInteractiveMenuMessage\(from,text\)/);
  assert.ok(webhook.indexOf('processClientBookingApprovalMessage(from,text)') < webhook.indexOf('processAdminRetiredAuthorityMessage(from,text)'));
});

test('non-admin client sender is not intercepted and ambiguous staff authority fails closed', async () => {
  const noAdmin = { query: async () => ({ rows: [], rowCount: 0 }) };
  assert.deepEqual(await processRetiredAdminAuthorityMessage('27720000000', 'Services & pricing', noAdmin), { handled: false });

  const ambiguous = { query: async () => ({ rows: [{ id: 1 }, { id: 2 }], rowCount: 2 }) };
  const blocked = await processRetiredAdminAuthorityMessage('27720000000', 'Help', ambiguous);
  assert.equal(blocked.handled, true);
  assert.match(blocked.reply, /could not be authorized/);
  assert.match(blocked.reply, /No action was taken/);
});

test('authenticated retirement writes provenance without invoking a domain mutation', async () => {
  const queries = [];
  const db = {
    async query(sql, params = []) {
      queries.push({ sql: String(sql), params });
      if (queries.length === 1) return { rows: [owner], rowCount: 1 };
      if (String(sql).includes('INSERT INTO crm_audit_events')) return { rows: [], rowCount: 1 };
      throw new Error(`unexpected query: ${sql}`);
    },
  };
  const result = await processRetiredAdminAuthorityMessage('27720000000', 'Services & pricing', db);
  assert.equal(result.handled, true);
  assert.equal(result.disposition.kind, 'retired');
  assert.match(result.reply, /has been retired/);
  assert.match(result.reply, /No action was taken/);
  assert.equal(queries.length, 2);
  assert.match(queries[1].sql, /admin\.whatsapp_authority_retired/);
  assert.deepEqual(JSON.parse(queries[1].params[1]), {
    contract: 'whatsapp_admin_authority_retirement_v1',
    disposition: 'retired',
    reason: 'ordinary_staff_surface_removed',
    mutationAttempted: false,
  });
});

test('legacy Assistant remains inert', () => {
  assert.doesNotMatch(assistant, /INSERT|UPDATE|DELETE|prepareAdminBooking|confirmAdminBooking|archiveClientForAdmin/);
  assert.match(assistant, /handled: false, retired: true/);
});
