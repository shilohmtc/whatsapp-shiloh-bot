const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bootstrapPath = path.join(__dirname, '..', 'src', 'services', 'emergencyCalendarBootstrap.js');
const interactivePath = path.join(__dirname, '..', 'src', 'services', 'adminInteractiveMenu.js');
const sessionPath = path.join(__dirname, '..', 'src', 'services', 'staffBrowserSession.js');
const bootstrapSource = fs.readFileSync(bootstrapPath, 'utf8');
const interactiveSource = fs.readFileSync(interactivePath, 'utf8');
const {
  isCalendarHandoffAuthority,
  isEmergencyChristelAuthority,
} = require(bootstrapPath);
const { deriveCalendarViewer } = require(sessionPath);
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

function jpAdmin(overrides = {}) {
  return {
    id: 20,
    staff_id: null,
    display_name: 'Jean-Pierre',
    role: 'admin',
    business_role: 'business_admin',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: {},
    admin_active: true,
    staff_status: null,
    ...overrides,
  };
}

function christelAdmin(overrides = {}) {
  return {
    id: 2,
    staff_id: 100,
    display_name: 'Christel',
    role: 'owner',
    business_role: 'owner',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: { 'appointment:create': true, 'client:lookup': true },
    admin_active: true,
    staff_status: 'active',
    ...overrides,
  };
}

function abigailAdmin(overrides = {}) {
  return {
    id: 11,
    staff_id: 101,
    display_name: 'Abigail',
    role: 'practitioner',
    business_role: 'employee_practitioner',
    calendar_scope: 'own_appointments',
    service_scope: 'own_services',
    permissions: {},
    admin_active: true,
    staff_status: 'active',
    ...overrides,
  };
}

function marietjieAdmin(overrides = {}) {
  return {
    id: 12,
    staff_id: 102,
    display_name: 'Marietjie',
    role: 'manager',
    business_role: 'tenant_practitioner',
    calendar_scope: 'own_services',
    service_scope: 'own_services',
    permissions: {},
    admin_active: true,
    staff_status: 'active',
    ...overrides,
  };
}

test('production-shaped JP is a business-wide Calendar viewer without practitioner linkage', () => {
  const admin = jpAdmin();
  assert.equal(admin.staff_id, null);
  assert.deepEqual(deriveCalendarViewer(admin), { calendarScope: 'business_all_staff' });
  assert.equal(isCalendarHandoffAuthority(admin, noPilot), true);
  assert.equal(isEmergencyChristelAuthority(admin, noPilot), false);
});

test('production-shaped Christel retains strict legacy compatibility and business-wide viewing', () => {
  const admin = christelAdmin();
  assert.deepEqual(deriveCalendarViewer(admin), { calendarScope: 'business_all_staff' });
  assert.equal(isCalendarHandoffAuthority(admin, noPilot), true);
  assert.equal(isEmergencyChristelAuthority(admin, noPilot), true);
});

test('production-shaped Abigail and Marietjie receive whole-Calendar read viewers without changing their service scopes', () => {
  const abigail = abigailAdmin();
  const marietjie = marietjieAdmin();
  assert.equal(abigail.service_scope, 'own_services');
  assert.equal(marietjie.service_scope, 'own_services');
  assert.deepEqual(deriveCalendarViewer(abigail), { calendarScope: 'business_all_staff' });
  assert.deepEqual(deriveCalendarViewer(marietjie), { calendarScope: 'business_all_staff' });
  assert.equal(isCalendarHandoffAuthority(abigail, noPilot), true);
  assert.equal(isCalendarHandoffAuthority(marietjie, noPilot), true);
});

test('legacy literal own scope remains an own-staff viewer for compatibility', () => {
  const admin = abigailAdmin({ calendar_scope: 'own' });
  assert.deepEqual(deriveCalendarViewer(admin), { calendarScope: 'own_staff', staffId: 101 });
});

test('pilot gate is enforced by exact Admin id and fails closed for malformed or excluded pilot configuration', () => {
  assert.equal(isCalendarHandoffAuthority(jpAdmin(), pilotFor(20)), true);
  assert.equal(isCalendarHandoffAuthority(jpAdmin(), pilotFor(11, 12)), false);
  assert.equal(isCalendarHandoffAuthority(abigailAdmin(), pilotFor(11, 20)), true);
  assert.equal(isCalendarHandoffAuthority(abigailAdmin(), pilotFor(20)), false);
  assert.equal(isCalendarHandoffAuthority(abigailAdmin(), {
    SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED: 'true',
    SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS: '11,not-an-id',
  }), false);
});

test('staff-scoped Calendar handoff fails closed for inactive or unlinked practitioners while business-wide JP may remain unlinked', () => {
  assert.equal(isCalendarHandoffAuthority(abigailAdmin({ admin_active: false }), noPilot), false);
  assert.equal(isCalendarHandoffAuthority(abigailAdmin({ staff_status: 'inactive' }), noPilot), false);
  assert.equal(isCalendarHandoffAuthority(abigailAdmin({ staff_id: null }), noPilot), false);
  assert.equal(isCalendarHandoffAuthority(abigailAdmin({ calendar_scope: 'none' }), noPilot), false);
  assert.equal(isCalendarHandoffAuthority(jpAdmin({ staff_id: null, staff_status: null }), noPilot), true);
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