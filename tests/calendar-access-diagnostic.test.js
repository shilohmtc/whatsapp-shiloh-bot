const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const diagnosticPath = path.join(__dirname, '..', 'src', 'services', 'calendarAccessDiagnostic.js');
const appPath = path.join(__dirname, '..', 'app.js');
const diagnosticSource = fs.readFileSync(diagnosticPath, 'utf8');
const appSource = fs.readFileSync(appPath, 'utf8');
const { runCalendarAccessDiagnostic } = require(diagnosticPath);

function productionRows() {
  return [
    {
      id: 2,
      staff_id: 100,
      display_name: 'Christel',
      business_role: 'owner',
      calendar_scope: 'all_business',
      service_scope: 'all_services',
      admin_active: true,
      staff_status: 'active',
      whatsapp_number: '+27000000001',
      normalized_whatsapp: '27000000001',
      permissions: { secret: true },
      token_hash: 'do-not-log-token-hash',
    },
    {
      id: 20,
      staff_id: null,
      display_name: 'Jean-Pierre',
      business_role: 'business_admin',
      calendar_scope: 'all_business',
      service_scope: 'all_services',
      admin_active: true,
      staff_status: null,
      whatsapp_number: '+27000000002',
      normalized_whatsapp: '27000000002',
      permissions: { secret: true },
    },
    {
      id: 11,
      staff_id: 101,
      display_name: 'Abigail',
      business_role: 'employee_practitioner',
      calendar_scope: 'own_appointments',
      service_scope: 'own_services',
      admin_active: true,
      staff_status: 'active',
      whatsapp_number: '+27000000003',
      normalized_whatsapp: '27000000003',
    },
    {
      id: 12,
      staff_id: 102,
      display_name: 'Marietjie',
      business_role: 'tenant_practitioner',
      calendar_scope: 'own_services',
      service_scope: 'own_services',
      admin_active: true,
      staff_status: 'active',
      whatsapp_number: '+27000000004',
      normalized_whatsapp: '27000000004',
    },
  ];
}

function enabledEnv(pilotIds = '2,20,11,12') {
  return {
    SHILOH_CALENDAR_READONLY_UX_ENABLED: 'true',
    SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED: 'true',
    SHILOH_EMERGENCY_CHRISTEL_CALENDAR_BOOKING_ENABLED: 'true',
    SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED: 'true',
    SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS: pilotIds,
  };
}

function fakeDb(rows = productionRows()) {
  const statements = [];
  return {
    statements,
    async query(sql) {
      statements.push(sql);
      return { rows };
    },
  };
}

test('Calendar access diagnostic is read-only, sanitized, and reports production-shaped viewer authority', async () => {
  const db = fakeDb();
  const report = await runCalendarAccessDiagnostic({ db, env: enabledEnv() });

  assert.equal(db.statements.length, 1);
  assert.match(db.statements[0], /^\s*SELECT\b/i);
  assert.doesNotMatch(db.statements[0], /\b(?:INSERT|UPDATE|DELETE|UPSERT|MERGE)\b/i);

  assert.equal(report.calendarReadOnlyUxEnabled, true);
  assert.equal(report.staffBrowserCalendarBridgeEnabled, true);
  assert.equal(report.calendarHandoffEnabled, true);
  assert.equal(report.pilotModeEnabled, true);
  assert.equal(report.pilotConfigValid, true);
  assert.equal(report.expectedPrincipalCount, 4);
  assert.equal(report.matchedPrincipalCount, 4);
  assert.deepEqual(report.authorities.map((item) => item.principal), ['Christel', 'Jean-Pierre', 'Abigail', 'Marietjie']);

  const byName = Object.fromEntries(report.authorities.map((item) => [item.principal, item]));
  assert.equal(byName['Jean-Pierre'].staffLinked, false);
  assert.equal(byName['Jean-Pierre'].staffActive, null);
  assert.equal(byName['Jean-Pierre'].viewerScope, 'business_all_staff');
  assert.equal(byName.Abigail.calendarScope, 'own_appointments');
  assert.equal(byName.Abigail.serviceScope, 'own_services');
  assert.equal(byName.Abigail.viewerScope, 'business_all_staff');
  assert.equal(byName.Marietjie.calendarScope, 'own_services');
  assert.equal(byName.Marietjie.serviceScope, 'own_services');
  assert.equal(byName.Marietjie.viewerScope, 'business_all_staff');
  assert.equal(report.authorities.every((item) => item.pilotAllowed === true), true);

  const serialized = JSON.stringify(report);
  for (const forbidden of [
    '+27000000001', '27000000001', '+27000000002', '27000000002',
    '+27000000003', '27000000003', '+27000000004', '27000000004',
    'do-not-log-token-hash', 'permissions', 'normalized_whatsapp', 'whatsapp_number',
    'token_hash', 'adminId',
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test('Calendar access diagnostic exposes malformed pilot policy only as fail-closed booleans', async () => {
  const db = fakeDb();
  const report = await runCalendarAccessDiagnostic({ db, env: enabledEnv('2,20,bad') });
  assert.equal(report.pilotModeEnabled, true);
  assert.equal(report.pilotConfigValid, false);
  assert.equal(report.authorities.every((item) => item.pilotAllowed === false), true);
});

test('diagnostic source and startup integration contain no mutation or secret logging contract', () => {
  assert.doesNotMatch(diagnosticSource, /\b(?:INSERT|UPDATE|DELETE|UPSERT|MERGE)\b/i);
  assert.doesNotMatch(diagnosticSource, /whatsapp_number|normalized_whatsapp|permissions|token_hash|challenge_hash/);
  assert.match(appSource, /runCalendarAccessDiagnostic/);
  assert.match(appSource, /Sanitized Calendar staff access diagnostic/);
});