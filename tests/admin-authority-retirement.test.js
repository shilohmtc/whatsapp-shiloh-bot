const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const webhook = read('src/controllers/webhookController.js');
const help = read('src/services/adminHelp.js');
const assistant = read('src/services/adminAssistant.js');
const {
  classifyRetiredAdminAction,
  processRetiredAdminAuthorityMessage,
} = require('../src/services/adminAuthorityRetirement');
const { commandForAdminButton } = require('../src/services/adminEarningsButtons');
const { getMenuOptions } = require('../src/services/adminMobileMenu');
const { topLevelInteractive } = require('../src/services/adminInteractiveMenu');

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

test('ordinary staff menu contains only retained primary and transitional actions', () => {
  assert.deepEqual(getMenuOptions(owner).map((option) => option.key), [
    'open_calendar',
    'today',
    'tomorrow',
    'reports',
    'earnings',
    'help',
    'client',
    'walkin',
    'staff_services',
    'pricing',
  ]);
  const menu = topLevelInteractive(owner);
  assert.equal(menu.type, 'list');
  assert.deepEqual(menu.rows.map((row) => row.id), getMenuOptions(owner).map((option) => `admin_action_${option.key}`));
  assert.doesNotMatch(JSON.stringify(menu), /appointments menu|availability|make a booking|manage booking|schedule|demo|integrity|finaliz|reset/i);
});

test('free text and stale IDs classify into Calendar, generic Earnings, or internal-only retirement', () => {
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
});

test('retained staff and client controls are not captured by retirement classification', () => {
  for (const input of [
    'Today',
    'Tomorrow',
    'Reports',
    'Earnings',
    'Help',
    'Find client Juvan',
    'Add walk-in',
    'Staff services',
    'Services & pricing',
    'Redeem loyalty 1 | 2',
    'approve_booking_123',
    'decline_booking_123',
    'client_book_now',
  ]) assert.equal(classifyRetiredAdminAction(input), null, input);
  assert.equal(commandForAdminButton('client_book_now'), 'services');
});

test('retired button IDs cannot reconstruct legacy handlers', () => {
  assert.equal(commandForAdminButton('admin_appointment_booking'), 'admin_retired_calendar_action');
  assert.equal(commandForAdminButton('admin_booking_confirm'), 'admin_retired_calendar_action');
  assert.equal(commandForAdminButton('admin_appointment_finalize'), 'admin_retired_internal_action');
  assert.equal(commandForAdminButton('admin_demo_client_start'), 'admin_retired_internal_action');
  assert.equal(commandForAdminButton('admin_christel_earnings_today'), 'admin_retired_named_earnings');
  assert.equal(commandForAdminButton('admin_appointment_today'), 'Today');
  assert.equal(commandForAdminButton('admin_appointment_tomorrow'), 'Tomorrow');
});

test('ordinary webhook exposes no retired mutation handler bypass', () => {
  assert.match(webhook, /processClientBookingApprovalMessage\(from,text\)/);
  assert.match(webhook, /processAdminRetiredAuthorityMessage\(from,text\)/);
  assert.match(webhook, /processAdminInteractiveMenuMessage\(from,text\)/);
  for (const handler of [
    'processAdminMobileBookingFlowMessage',
    'processStatelessAdminBookingUpdateMessage',
    'processAdminBookingUpdateMessage',
    'processAdminAvailableSlotsMessage',
    'processAdminClientDemoMessage',
    'processAdminAppointmentFinalizationMessage',
    'processAdminScheduleUxMessage',
    'processAdminRosterAuditMessage',
    'processAdminNailServicesAuditMessage',
    'processAdminLegacyOrphanAuditMessage',
    'processAdminAssistantMessage',
  ]) assert.doesNotMatch(webhook, new RegExp(handler), handler);
  assert.ok(webhook.indexOf('processClientBookingApprovalMessage(from,text)') < webhook.indexOf('processAdminRetiredAuthorityMessage(from,text)'));
});

test('non-admin client sender is not intercepted and ambiguous staff authority fails closed', async () => {
  const noAdmin = { query: async () => ({ rows: [], rowCount: 0 }) };
  assert.deepEqual(await processRetiredAdminAuthorityMessage('27720000000', 'Make a booking', noAdmin), { handled: false });

  const ambiguous = { query: async () => ({ rows: [{ id: 1 }, { id: 2 }], rowCount: 2 }) };
  const blocked = await processRetiredAdminAuthorityMessage('27720000000', 'Make a booking', ambiguous);
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
  const result = await processRetiredAdminAuthorityMessage('27720000000', 'Demo Client', db);
  assert.equal(result.handled, true);
  assert.equal(result.disposition.kind, 'internal_only');
  assert.match(result.reply, /No action was taken/);
  assert.equal(queries.length, 2);
  assert.match(queries[1].sql, /admin\.whatsapp_authority_retired/);
  assert.deepEqual(JSON.parse(queries[1].params[1]), {
    contract: 'whatsapp_admin_authority_retirement_v1',
    disposition: 'internal_only',
    reason: 'internal_control_plane',
    mutationAttempted: false,
  });
});

test('Help and legacy Assistant cannot advertise or execute retired authority', () => {
  assert.doesNotMatch(help, /Send: Staff schedule|Find an available time|Make a booking/);
  assert.match(help, /managed in Shiloh Calendar/);
  assert.match(help, /WhatsApp does not perform those diary mutations/);
  assert.doesNotMatch(assistant, /INSERT|UPDATE|DELETE|prepareAdminBooking|confirmAdminBooking|archiveClientForAdmin/);
  assert.match(assistant, /handled: false, retired: true/);
});
