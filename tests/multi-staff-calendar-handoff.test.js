const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bootstrapPath = path.join(__dirname, '..', 'src', 'services', 'emergencyCalendarBootstrap.js');
const interactivePath = path.join(__dirname, '..', 'src', 'services', 'adminInteractiveMenu.js');
const bootstrapSource = fs.readFileSync(bootstrapPath, 'utf8');
const interactiveSource = fs.readFileSync(interactivePath, 'utf8');
const {
  isCalendarHandoffAuthority,
  isEmergencyChristelAuthority,
} = require(bootstrapPath);
const {
  isWorkspaceLauncherTerm,
  sectionInteractive,
  workspaceLauncherInteractive,
} = require(interactivePath);

const noPilot = {};
const pilotFor = (...ids) => ({
  SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED: 'true',
  SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS: ids.join(','),
});

function ownStaffAdmin(overrides = {}) {
  return {
    id: 11,
    staff_id: 101,
    display_name: 'Abigail',
    role: 'operations_admin',
    business_role: 'staff',
    calendar_scope: 'own',
    service_scope: 'own_services',
    permissions: {},
    admin_active: true,
    staff_status: 'active',
    ...overrides,
  };
}

test('Calendar handoff authority accepts an active canonical own-scope staff viewer without broadening them to business-wide authority', () => {
  const admin = ownStaffAdmin();
  assert.equal(isCalendarHandoffAuthority(admin, noPilot), true);
  assert.equal(isEmergencyChristelAuthority(admin, noPilot), false);
});

test('Calendar handoff authority accepts business-wide JP/Christel-style viewers while preserving the legacy Christel compatibility predicate', () => {
  const jp = ownStaffAdmin({
    id: 20,
    display_name: 'Jean-Pierre',
    business_role: 'business_admin',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
  });
  const christel = ownStaffAdmin({
    id: 2,
    display_name: 'Christel',
    business_role: 'business_admin',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: { 'appointment:create': true, 'client:lookup': true },
  });
  assert.equal(isCalendarHandoffAuthority(jp, noPilot), true);
  assert.equal(isEmergencyChristelAuthority(jp, noPilot), false);
  assert.equal(isCalendarHandoffAuthority(christel, noPilot), true);
  assert.equal(isEmergencyChristelAuthority(christel, noPilot), true);
});

test('pilot gate is enforced by exact Admin id and fails closed for malformed or excluded pilot configuration', () => {
  const admin = ownStaffAdmin({ id: 11 });
  assert.equal(isCalendarHandoffAuthority(admin, pilotFor(11, 20)), true);
  assert.equal(isCalendarHandoffAuthority(admin, pilotFor(20)), false);
  assert.equal(isCalendarHandoffAuthority(admin, {
    SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED: 'true',
    SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS: '11,not-an-id',
  }), false);
});

test('Calendar handoff authority fails closed without an active linked staff viewer', () => {
  assert.equal(isCalendarHandoffAuthority(ownStaffAdmin({ admin_active: false }), noPilot), false);
  assert.equal(isCalendarHandoffAuthority(ownStaffAdmin({ staff_status: 'inactive' }), noPilot), false);
  assert.equal(isCalendarHandoffAuthority(ownStaffAdmin({ staff_id: null }), noPilot), false);
  assert.equal(isCalendarHandoffAuthority(ownStaffAdmin({ calendar_scope: 'none' }), noPilot), false);
});

test('Shiloh Workspace launcher puts Open Calendar before Admin and does not nest Calendar inside an Admin section', () => {
  const launcher = workspaceLauncherInteractive({ display_name: 'JP' });
  assert.equal(launcher.type, 'button');
  assert.deepEqual(launcher.buttons.map((button) => [button.id, button.title]), [
    ['admin_open_calendar', 'Open Calendar'],
    ['admin_open_menu', 'Admin'],
  ]);
  assert.match(launcher.body, /^\*Shiloh Workspace 🌿\*/);
  assert.doesNotMatch(interactiveSource, /admin_action_open_calendar/);
  const adminSection = sectionInteractive('Reports', '*Shiloh Admin 🌿*\n\n*Reports*\n1️⃣ Today\'s report');
  assert.ok(adminSection);
  assert.equal(adminSection.rows.some((row) => row.id === 'admin_open_calendar'), false);
  assert.equal(adminSection.rows.some((row) => row.title === 'Open Calendar'), false);
});

test('Admin section back navigation returns to Admin root, not to the Workspace launcher', () => {
  const body = '*Shiloh Admin 🌿*\n\n*Reports*\n1️⃣ Today\'s report';
  const section = sectionInteractive('Reports', body);
  assert.ok(section);
  assert.equal(section.rows.at(-1).id, 'admin_open_menu');
  assert.equal(section.rows.at(-1).title, '← Back to Admin');
});

test('workspace terms open the Workspace launcher while literal Admin remains a distinct Admin entry', () => {
  for (const term of ['Menu', 'home', 'start', 'hello', 'Good morning!']) {
    assert.equal(isWorkspaceLauncherTerm(term), true, term);
  }
  assert.equal(isWorkspaceLauncherTerm('Admin'), false);
  assert.equal(isWorkspaceLauncherTerm('Open Calendar'), false);
});

test('handoff source binds issuance to actual inbound WhatsApp, stores only token hash, and revalidates exact stored Admin at exchange', () => {
  assert.match(bootstrapSource, /resolveAuthority\(client, \{ whatsapp: normalized, forUpdate: true \}\)/);
  assert.match(bootstrapSource, /VALUES \(\$1, \$2, \$3, \$4, 'whatsapp_admin'\)/);
  assert.match(bootstrapSource, /\[adminId, tokenHash, current, expiresAt\]/);
  assert.match(bootstrapSource, /const adminId = Number\(bootstrap\?\.admin_id\)/);
  assert.match(bootstrapSource, /resolveAuthority\(client, \{ adminId, forUpdate: true \}\)/);
  assert.match(bootstrapSource, /Number\(admin\.id\) !== adminId/);
  assert.doesNotMatch(bootstrapSource, /INSERT INTO staff_browser_emergency_bootstraps[\s\S]*\[EMERGENCY_ADMIN_ID,/);
});

test('handoff remains one-time, expiry-aware, and delegates browser-session minting to canonical staff session machinery', () => {
  assert.match(bootstrapSource, /consumed_at IS NULL/);
  assert.match(bootstrapSource, /revoked_at IS NULL/);
  assert.match(bootstrapSource, /new Date\(bootstrap\.expires_at\)\.getTime\(\) <= current\.getTime\(\)/);
  assert.match(bootstrapSource, /SET consumed_at = \$2/);
  assert.match(bootstrapSource, /issueStaffBrowserSession\(\{/);
  assert.match(bootstrapSource, /requestFingerprintHash/);
});

test('launcher handoff does not accept browser-provided Admin authority and does not write appointments directly', () => {
  assert.match(interactiveSource, /issueForWhatsapp\(\{ whatsapp: sender \}\)/);
  assert.doesNotMatch(interactiveSource, /issueForWhatsapp\(\{[^}]*adminId/);
  assert.doesNotMatch(interactiveSource, /INSERT INTO appointments/i);
  assert.doesNotMatch(bootstrapSource, /INSERT INTO appointments/i);
});