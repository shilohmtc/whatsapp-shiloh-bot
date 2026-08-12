const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const interactivePath = path.join(__dirname, '..', 'src', 'services', 'adminInteractiveMenu.js');
const mobilePath = path.join(__dirname, '..', 'src', 'services', 'adminMobileMenu.js');
const webhookPath = path.join(__dirname, '..', 'src', 'controllers', 'webhookController.js');
const rolloutPath = path.join(__dirname, '..', 'migrations', '037_p2_staff_rollout_permissions.sql');
const demoAccessPath = path.join(__dirname, '..', 'migrations', '043_demo_client_staff_access.sql');

const mobile = fs.readFileSync(mobilePath, 'utf8');
const webhook = fs.readFileSync(webhookPath, 'utf8');
const rollout = fs.readFileSync(rolloutPath, 'utf8');
const demoAccess = fs.readFileSync(demoAccessPath, 'utf8');
const { actionForId } = require(interactivePath);

const ROLE_ACTIONS = {
  Christel: [
    'today', 'tomorrow', 'availability', 'demo_client', 'today_report',
    'christel_earnings', 'abigail_earnings', 'booking', 'manage_booking',
    'client', 'walkin', 'staff_services', 'pricing', 'schedule',
    'calendar_integrity', 'help',
  ],
  Abigail: [
    'today', 'tomorrow', 'availability', 'demo_client', 'today_report',
    'booking', 'manage_booking', 'client', 'staff_services', 'help',
  ],
  Marietjie: [
    'today', 'tomorrow', 'availability', 'demo_client', 'today_report',
    'booking', 'manage_booking', 'client', 'walkin', 'staff_services',
    'pricing', 'schedule', 'help',
  ],
};

const DIRECT_ROUTE_EVIDENCE = {
  availability: /selected\.key==='availability'.*processAdminMobileBookingFlowMessage\(sender,'Find an available time'\)/s,
  demo_client: /selected\.key==='demo_client'.*processAdminClientDemoMessage\(sender,'Demo Client'\)/s,
  today_report: /selected\.key==='today_report'.*processAdminReportsMessage/s,
  christel_earnings: /selected\.key==='christel_earnings'.*christelEarningsButtons\(\)/s,
  abigail_earnings: /selected\.key==='abigail_earnings'.*abigailEarningsButtons\(\)/s,
  booking: /selected\.key==='booking'.*processAdminMobileBookingFlowMessage\(sender,'Make a booking'\)/s,
  manage_booking: /selected\.key==='manage_booking'.*processAdminBookingUpdateMessage\(sender,'Manage booking'\)/s,
  client: /selected\.key==='client'.*client_lookup/s,
  staff_services: /selected\.key==='staff_services'.*processAdminStaffServicesMessage\(sender,'Staff services'\)/s,
  pricing: /selected\.key==='pricing'.*processAdminServicePricingMessage\(sender,'Manage services & pricing'\)/s,
  schedule: /selected\.key==='schedule'.*scheduleMenu\(admin\)/s,
  calendar_integrity: /selected\.key==='calendar_integrity'.*calendarIntegrityButtons\(\)/s,
};

const DELEGATED_HANDLER = {
  today: 'processAdminAppointmentsByDateMessage(from,text)',
  tomorrow: 'processAdminAppointmentsByDateMessage(from,text)',
  walkin: 'processAdminWalkinMessage(from,text)',
  help: 'processAdminHelpMessage(from,text)',
};

function assertBeforeGenericAssistant(handler) {
  const adapter = webhook.indexOf('processAdminInteractiveMenuMessage(from,text)');
  const target = webhook.indexOf(handler);
  const generic = webhook.indexOf('processAdminAssistantMessage(from,text)');
  assert.ok(adapter >= 0, 'interactive adapter missing from webhook');
  assert.ok(target >= 0, `guarded handler missing from webhook: ${handler}`);
  assert.ok(generic >= 0, 'generic admin assistant missing from webhook');
  assert.ok(adapter < target, `${handler} must run after the interactive adapter`);
  assert.ok(target < generic, `${handler} must run before generic admin assistant fallthrough`);
}

function rolloutBlock(name) {
  return rollout
    .split(/(?=UPDATE staff_admin_accounts)/)
    .find((block) => block.includes(`WHERE LOWER(display_name)='${name}';`)) || '';
}

test('checked-in production role contracts match Christel, Abigail and Marietjie scope', () => {
  const christel = rolloutBlock('christel');
  const abigail = rolloutBlock('abigail');
  const marietjie = rolloutBlock('marietjie');
  assert.match(christel, /business_role='owner'/);
  assert.match(christel, /calendar_scope='all_business'/);
  assert.match(marietjie, /business_role='tenant_practitioner'/);
  assert.match(marietjie, /calendar_scope='own_services'/);
  assert.match(abigail, /business_role='employee_practitioner'/);
  assert.match(abigail, /calendar_scope='own_appointments'/);
  assert.match(demoAccess, /LOWER\(display_name\) = 'christel'/);
  assert.match(demoAccess, /LOWER\(display_name\) = 'abigail'/);
  assert.match(demoAccess, /LOWER\(display_name\) = 'marietjie'/);
  assert.match(demoAccess, /permissions = COALESCE\(permissions, '\{\}'::jsonb\) - 'demo:client'/);
});

test('every advertised Christel, Abigail and Marietjie stable action ID resolves explicitly', () => {
  for (const [name, keys] of Object.entries(ROLE_ACTIONS)) {
    for (const key of keys) {
      const action = actionForId(`admin_action_${key}`);
      assert.ok(action, `${name}: missing stable action mapping for ${key}`);
      assert.ok(action.command, `${name}: missing guarded command for ${key}`);
    }
  }
  assert.equal(actionForId('admin_action_savanna'), null);
  assert.equal(actionForId('admin_action_pieter'), null);
});

test('every directly handled advertised action has an explicit guarded route', () => {
  const advertised = new Set(Object.values(ROLE_ACTIONS).flat());
  for (const [key, pattern] of Object.entries(DIRECT_ROUTE_EVIDENCE)) {
    assert.ok(advertised.has(key), `route contract contains non-advertised action ${key}`);
    assert.match(mobile, pattern, `missing guarded mobile-menu route for ${key}`);
  }
});

test('delegated advertised actions cannot fall through to the generic admin assistant', () => {
  assert.match(mobile, /selected\.key==='today'\|\|selected\.key==='tomorrow'\)return \{handled:false\}/);
  assert.match(mobile, /selected\.key==='walkin'\)return \{handled:false\}/);
  assert.match(mobile, /selected\.key==='help'\)return \{handled:false\}/);
  for (const handler of new Set(Object.values(DELEGATED_HANDLER))) assertBeforeGenericAssistant(handler);
});

test('named-role advertised action set has complete route coverage and no freelancer actions', () => {
  const routeCovered = new Set([...Object.keys(DIRECT_ROUTE_EVIDENCE), ...Object.keys(DELEGATED_HANDLER)]);
  for (const [name, keys] of Object.entries(ROLE_ACTIONS)) {
    for (const key of keys) assert.ok(routeCovered.has(key), `${name}: advertised action lacks route coverage: ${key}`);
  }
  const allKeys = Object.values(ROLE_ACTIONS).flat();
  assert.ok(!allKeys.includes('savanna'));
  assert.ok(!allKeys.includes('pieter'));
});
