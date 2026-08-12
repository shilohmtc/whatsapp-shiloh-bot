const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const servicePath = path.join(__dirname, '..', 'src', 'services', 'adminClientTestMode.js');
const controllerPath = path.join(__dirname, '..', 'src', 'controllers', 'clientTestWebhookController.js');
const routePath = path.join(__dirname, '..', 'src', 'routes', 'webhook.js');
const menuPath = path.join(__dirname, '..', 'src', 'services', 'adminInteractiveMenu.js');
const controlPath = path.join(__dirname, '..', 'src', 'services', 'jeanPierreAdminControlPlane.js');
const appPath = path.join(__dirname, '..', 'app.js');
const migrationPath = path.join(__dirname, '..', 'migrations', '046_jean_pierre_client_test_mode.sql');

const service = fs.readFileSync(servicePath, 'utf8');
const controller = fs.readFileSync(controllerPath, 'utf8');
const route = fs.readFileSync(routePath, 'utf8');
const menu = fs.readFileSync(menuPath, 'utf8');
const control = fs.readFileSync(controlPath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');
const migration = fs.readFileSync(migrationPath, 'utf8');

test('Jean-Pierre clones Christel operational permissions but remains business_admin, never owner', () => {
  for (const source of [service, migration]) {
    assert.match(source, /LOWER\(jp\.display_name\) = 'jean-pierre'/);
    assert.match(source, /LOWER\(c\.display_name\) = 'christel'/);
    assert.match(source, /business_role = 'business_admin'/);
    assert.match(source, /calendar_scope = 'all_business'/);
    assert.match(source, /service_scope = 'all_services'/);
    assert.doesNotMatch(source, /business_role = 'owner'/);
    assert.doesNotMatch(source, /jp\.staff_id\s*=/);
  }
});

test('Jean-Pierre does not inherit controlled Demo Client and gets only explicit Client Test Mode', () => {
  assert.match(service, /COALESCE\(c\.permissions, '\{\}'::jsonb\) - 'demo:client'/);
  assert.match(service, /"client:test_mode":true/);
  assert.match(migration, /- 'demo:client'/);
  assert.match(migration, /"client:test_mode":true/);
});

test('Client Test Mode preserves admin authorization instead of disabling the admin account', () => {
  assert.match(service, /adminAuthorizationPreserved: true/);
  assert.match(service, /active = TRUE/);
  assert.doesNotMatch(service, /UPDATE staff_admin_accounts[\s\S]*active\s*=\s*FALSE/i);
  assert.doesNotMatch(service, /DELETE FROM staff_admin_accounts/i);
  assert.match(service, /Admin authorization was never removed/);
});

test('first-time acceptance test fails closed when the real WhatsApp number is already a CRM client', () => {
  assert.match(service, /COUNT\(DISTINCT c\.id\)::int AS client_count/);
  assert.match(service, /c\.status = 'active'/);
  assert.match(service, /cc\.normalized_value = \$1/);
  assert.match(service, /activeClients > 0/);
  assert.match(service, /already linked to an active Shiloh CRM client/);
});

test('Client Test Mode refuses to overlap a controlled Demo Client session', () => {
  assert.match(service, /FROM admin_client_demo_sessions/);
  assert.match(service, /active = TRUE/);
  assert.match(service, /Demo Client session is still active/);
});

test('exiting Client Test Mode preserves canonical CRM and calendar evidence for verification', () => {
  assert.match(service, /recordsPreservedForVerification: true/);
  assert.match(service, /CRM client\/appointment and Google Calendar entries created during the test remain untouched/);
  assert.doesNotMatch(service, /DELETE FROM appointments/i);
  assert.doesNotMatch(service, /DELETE FROM clients/i);
  assert.doesNotMatch(service, /cancelBookingEvent|deleteBookingEvent|delete.*calendar/i);
});

test('active Client Test Mode is pre-routed before the mature production webhook', () => {
  assert.match(route, /router\.post\("\/webhook", clientTestModeWebhook, receiveWebhook\)/);
  assert.match(controller, /processAdminClientTestModeControl\(from, text\)/);
  assert.match(controller, /if \(!mode\.active\) return next\(\)/);
  assert.doesNotMatch(controller, /processAdminMobile|processAdminAssistant|processAdminReports|processAdminWalkin/);
});

test('Client Test Mode reuses the real client booking stack and real WhatsApp identity', () => {
  const required = [
    'processClientIdentityMessage(from, text)',
    'processClientDiscoveryMessage(from, text)',
    'processClientAvailabilityMessage(from, text)',
    'ensureBookingIdentity(from)',
    'processBookingPolicyMessage(from, text)',
    'processBookingMessage(from, text)',
    'processAppointmentChangeMessage(from, text)',
  ];
  for (const call of required) assert.ok(controller.includes(call), `missing client-stack call: ${call}`);
  assert.doesNotMatch(controller, /virtualPhone|whatsapp_demo/);
});

test('Jean-Pierre admin UI exposes Christel earnings, calendar integrity and Client Test Mode explicitly', () => {
  assert.match(menu, /isJeanPierreBusinessAdmin/);
  assert.match(menu, /💰 Christel earnings/);
  assert.match(menu, /🛡️ Calendar integrity/);
  assert.match(menu, /🧪 Client Test Mode/);
  assert.match(menu, /processJeanPierreControlPlaneMessage/);
  assert.match(menu, /processAdminClientTestModeControl/);
});

test('privileged visibility is explicitly Jean-Pierre business_admin and does not broaden to arbitrary admins', () => {
  assert.match(control, /normalize\(admin\.display_name\) === 'jean-pierre'/);
  assert.match(control, /admin\.business_role === 'business_admin'/);
  assert.match(control, /admin\.calendar_scope === 'all_business'/);
  assert.match(control, /admin\.service_scope === 'all_services'/);
  assert.match(control, /christelEarningsData/);
  assert.match(control, /scanBookingIntegrity/);
});

test('startup fail-closes if the Jean-Pierre capability clone cannot be initialized', () => {
  assert.match(app, /ensureJeanPierreAdminCapabilities/);
  assert.match(app, /if \(!jeanPierreAccess\) throw new Error/);
  assert.match(app, /Jean-Pierre business admin\/client test access verified/);
});
