const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const {
  createWorkspaceStaffAccessCompletionService,
  isCompatibleLegacyPractitionerAccess,
} = require('../src/services/workspaceStaffAccessCompletion');
const { staffRevision } = require('../src/services/workspaceStaff');
const { renderStaffDetailPage } = require('../src/presentation/workspaceStaffUx');
const {
  decorateStaffDetailAccessHtml,
  workspaceStaffAccessClientScript,
} = require('../src/presentation/workspaceStaffAccessUx');
const { createWorkspaceStaffMutationRouter } = require('../src/routes/workspaceStaffMutations');

const ENABLED_ENV = {
  SHILOH_CALENDAR_READONLY_UX_ENABLED: 'true',
  SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED: 'true',
};

function result(rows = []) { return { rows, rowCount: rows.length }; }

function staff(overrides = {}) {
  return {
    id: 17,
    display_name: 'Synthetic Practitioner',
    resource_type: 'practitioner',
    status: 'active',
    scheduling_type: 'regular',
    client_bookable: true,
    business_role: 'employee_practitioner',
    calendar_scope: 'own_appointments',
    ...overrides,
  };
}

function legacyAccess(overrides = {}) {
  return {
    id: 91,
    staff_id: 17,
    display_name: 'Synthetic Practitioner',
    role: 'manager',
    whatsapp_number: '+27821234567',
    normalized_whatsapp: '27821234567',
    active: true,
    permissions: {},
    business_role: 'employee_practitioner',
    calendar_scope: 'own_appointments',
    service_scope: 'own_services',
    ...overrides,
  };
}

function operator(overrides = {}) {
  return {
    id: 61,
    staff_id: null,
    permissions: { 'staff_access:manage': true },
    admin_active: true,
    staff_status: null,
    ...overrides,
  };
}

function completionDb({ currentStaff = staff(), linked = legacyAccess(), currentOperator = operator(), numberOwners = null } = {}) {
  const state = {
    staff: currentStaff,
    linked: linked ? { ...linked, permissions: { ...(linked.permissions || {}) } } : null,
    operator: currentOperator,
    numberOwners,
    audits: [],
    calls: [],
  };
  const query = async (text, params = []) => {
    const sql = String(text).replace(/\s+/g, ' ').trim();
    state.calls.push({ sql, params });
    if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) return result();
    if (sql.includes('workspaceStaffAccess:principal')) return result(state.operator ? [state.operator] : []);
    if (sql.includes('pg_advisory_xact_lock')) return result([{}]);
    if (sql.includes('workspaceStaffAccessCompletion:target')) return result(state.staff ? [state.staff] : []);
    if (sql.includes('workspaceStaffAccessCompletion:linked')) return result(state.linked ? [state.linked] : []);
    if (sql.includes('workspaceStaffAccessCompletion:number-owner')) {
      if (state.numberOwners) return result(state.numberOwners);
      if (state.linked && state.linked.normalized_whatsapp === params[0]) {
        return result([{ id: state.linked.id, staff_id: state.linked.staff_id, active: state.linked.active }]);
      }
      return result();
    }
    if (sql.startsWith('UPDATE staff_admin_accounts') && sql.includes('appointment:view')) {
      if (!state.linked || Number(state.linked.id) !== Number(params[0]) || state.linked.active !== true) return result();
      state.linked.permissions = { ...state.linked.permissions, 'appointment:view': true };
      return result([{ id: state.linked.id }]);
    }
    if (sql.startsWith('INSERT INTO crm_audit_events')) {
      state.audits.push({ actorAdminId: params[0], staffId: params[1], metadata: JSON.parse(params[2]) });
      return result([{ id: 1 }]);
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  };
  const client = { query, release() { state.calls.push({ sql: 'RELEASE', params: [] }); } };
  return { db: { query, async connect() { return client; } }, state };
}

function completionRequest(overrides = {}) {
  const currentStaff = overrides.staff || staff();
  return {
    adminId: 61,
    staffId: currentStaff.id,
    expectedRevision: staffRevision(currentStaff),
    requestId: 'request_legacy_completion_001',
    whatsappNumber: '082 123 4567',
    identityConfirmed: true,
    ...overrides,
  };
}

async function withServer(app, work) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  try {
    return await work(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('legacy completion eligibility is exact on identity scopes and zero enabled capabilities', () => {
  assert.equal(isCompatibleLegacyPractitionerAccess(legacyAccess(), '27821234567'), true);
  assert.equal(isCompatibleLegacyPractitionerAccess(legacyAccess({ permissions: { 'appointment:view': false } }), '27821234567'), true);
  assert.equal(isCompatibleLegacyPractitionerAccess(legacyAccess({ permissions: { 'appointment:create': true } }), '27821234567'), false);
  assert.equal(isCompatibleLegacyPractitionerAccess(legacyAccess({ calendar_scope: 'all_business' }), '27821234567'), false);
  assert.equal(isCompatibleLegacyPractitionerAccess(legacyAccess(), '27820000000'), false);
  assert.equal(isCompatibleLegacyPractitionerAccess(legacyAccess({ active: false }), '27821234567'), false);
});

test('compatible legacy principal gains appointment:view only and preserves identity role and scopes', async () => {
  const fake = completionDb();
  const before = { ...fake.state.linked, permissions: { ...fake.state.linked.permissions } };
  const response = await createWorkspaceStaffAccessCompletionService({ db: fake.db }).completeWorkspaceAccess(completionRequest());
  assert.equal(response.status, 'enabled');
  assert.deepEqual(fake.state.linked.permissions, { 'appointment:view': true });
  assert.equal(fake.state.linked.id, before.id);
  assert.equal(fake.state.linked.normalized_whatsapp, before.normalized_whatsapp);
  assert.equal(fake.state.linked.role, before.role);
  assert.equal(fake.state.linked.business_role, before.business_role);
  assert.equal(fake.state.linked.calendar_scope, before.calendar_scope);
  assert.equal(fake.state.linked.service_scope, before.service_scope);
  assert.equal(fake.state.audits.length, 1);
  assert.equal(fake.state.audits[0].metadata.completedCompatibleLegacyPrincipal, true);
  assert.equal(fake.state.audits[0].metadata.identityRoleScopesPreserved, true);
  assert.deepEqual(fake.state.audits[0].metadata.capabilitiesAdded, ['appointment:view']);
  assert.equal(fake.state.audits[0].metadata.credentialMaterialChanged, false);
  assert.equal(JSON.stringify(fake.state.audits[0]).includes('27821234567'), false);
  assert.equal(fake.state.calls.some(call => /totp|recovery|secret|staff_browser_sessions/i.test(call.sql)), false);
});

test('legacy completion remains idempotent after appointment:view is present', async () => {
  const fake = completionDb({ linked: legacyAccess({ permissions: { 'appointment:view': true } }) });
  const response = await createWorkspaceStaffAccessCompletionService({ db: fake.db }).completeWorkspaceAccess(completionRequest());
  assert.equal(response.status, 'unchanged');
  assert.equal(fake.state.audits.length, 0);
  assert.equal(fake.state.calls.some(call => call.sql.startsWith('UPDATE staff_admin_accounts')), false);
});

test('wrong WhatsApp or broader/different legacy authority fails closed without mutation', async () => {
  const wrongNumber = completionDb();
  await assert.rejects(
    createWorkspaceStaffAccessCompletionService({ db: wrongNumber.db }).completeWorkspaceAccess(completionRequest({ whatsappNumber: '082 999 9999' })),
    error => error.code === 'WORKSPACE_STAFF_ACCESS_WHATSAPP_CONFLICT' && error.httpStatus === 409
  );
  assert.deepEqual(wrongNumber.state.linked.permissions, {});
  assert.equal(wrongNumber.state.audits.length, 0);

  const broader = completionDb({ linked: legacyAccess({ permissions: { 'appointment:create': true } }) });
  await assert.rejects(
    createWorkspaceStaffAccessCompletionService({ db: broader.db }).completeWorkspaceAccess(completionRequest()),
    error => error.code === 'WORKSPACE_STAFF_ACCESS_EXISTING_AUTHORITY' && error.httpStatus === 409
  );
  assert.deepEqual(broader.state.linked.permissions, { 'appointment:create': true });
  assert.equal(broader.state.audits.length, 0);
});

test('presentation offers completion only for the compatible zero-capability access projection', () => {
  const currentStaff = { ...staff(), revision: staffRevision(staff()) };
  const baseOptions = { calendarNavigationAllowed: true, clientsNavigationAllowed: true, staffAccessScriptPath: '/calendar/staff/client.js' };
  const legacyProjection = {
    businessRole: 'employee_practitioner',
    calendarScope: 'own_appointments',
    serviceScope: 'own_services',
    capabilities: [],
  };
  const base = renderStaffDetailPage({ staff: currentStaff, services: [], access: legacyProjection, manageAllowed: false }, baseOptions);
  const html = decorateStaffDetailAccessHtml(base, { staff: currentStaff, access: legacyProjection, accessManageAllowed: true });
  assert.match(html, /Complete Workspace access/);
  assert.match(html, /data-access-mode="complete"/);
  assert.match(html, /name="identityConfirmed"/);
  assert.match(html, /adds <strong>appointment:view<\/strong> only/);
  assert.match(html, /\/calendar\/team\/access-manage\.js/);

  const broaderProjection = { ...legacyProjection, capabilities: ['appointment:create'] };
  const broaderHtml = decorateStaffDetailAccessHtml(
    renderStaffDetailPage({ staff: currentStaff, services: [], access: broaderProjection, manageAllowed: false }, baseOptions),
    { staff: currentStaff, access: broaderProjection, accessManageAllowed: true }
  );
  assert.doesNotMatch(broaderHtml, /Complete Workspace access|data-staff-access-enable-form/);
  assert.match(broaderHtml, /Existing access is preserved/);
});

test('Access client retains enable endpoint and adds fixed completion endpoint without authority payloads', () => {
  const script = workspaceStaffAccessClientScript();
  assert.doesNotThrow(() => new Function(script));
  assert.match(script, /\/access\/enable/);
  assert.match(script, /\/access\/complete/);
  assert.match(script, /identityConfirmed/);
  assert.match(script, /whatsappNumber/);
  assert.doesNotMatch(script, /businessRole|calendarScope|serviceScope|permissions|appointment:create|schedule:manage/);
});

test('legacy completion HTTP boundary reuses same-origin session and CSRF enforcement', async () => {
  let executions = 0;
  const sessionService = {
    async validateSessionToken(token) {
      return token === 'session-ok' ? { ok: true, adminId: 61, sessionId: 71 } : { ok: false };
    },
    validateCsrfToken(_session, token) { return token === 'csrf-ok'; },
  };
  const accessCompletionService = {
    async completeWorkspaceAccess(input) {
      executions += 1;
      assert.equal(input.adminId, 61);
      assert.equal(input.staffId, '17');
      assert.equal(input.identityConfirmed, true);
      return { status: 'enabled', staffId: 17 };
    },
  };
  const app = express();
  app.use(express.json());
  app.use('/calendar/team', createWorkspaceStaffMutationRouter({
    env: ENABLED_ENV,
    sessionService,
    service: {},
    accessService: {},
    accessCompletionService,
  }));

  await withServer(app, async base => {
    const path = `${base}/calendar/team/17/access/complete`;
    const noSession = await fetch(path, { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: '{}' });
    assert.equal(noSession.status, 401);
    const crossOrigin = await fetch(path, { method: 'POST', headers: { origin: 'https://example.invalid', 'content-type': 'application/json', cookie: 'shiloh_staff_session=session-ok', 'x-shiloh-csrf-token': 'csrf-ok' }, body: '{}' });
    assert.equal(crossOrigin.status, 403);
    const noCsrf = await fetch(path, { method: 'POST', headers: { origin: base, 'content-type': 'application/json', cookie: 'shiloh_staff_session=session-ok' }, body: '{}' });
    assert.equal(noCsrf.status, 403);
    const allowed = await fetch(path, {
      method: 'POST',
      headers: { origin: base, 'content-type': 'application/json', cookie: 'shiloh_staff_session=session-ok', 'x-shiloh-csrf-token': 'csrf-ok' },
      body: JSON.stringify({ requestId: 'request_route_complete', expectedRevision: 'a'.repeat(64), whatsappNumber: '0821234567', identityConfirmed: true }),
    });
    assert.equal(allowed.status, 200);
    assert.equal(executions, 1);
  });
});
