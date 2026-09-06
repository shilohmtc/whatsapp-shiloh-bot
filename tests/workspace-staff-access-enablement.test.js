const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const {
  STAFF_ACCESS_MANAGE_CAPABILITY,
  PRACTITIONER_ACCESS_PRESET,
  evaluateStaffAccessManageAuthority,
  createWorkspaceStaffAccessService,
} = require('../src/services/workspaceStaffAccess');
const {
  WorkspaceStaffError,
  staffRevision,
} = require('../src/services/workspaceStaff');
const {
  renderStaffDetailPage,
} = require('../src/presentation/workspaceStaffUx');
const {
  decorateStaffDetailAccessHtml,
  workspaceStaffAccessClientScript,
} = require('../src/presentation/workspaceStaffAccessUx');
const { createWorkspaceStaffMutationRouter } = require('../src/routes/workspaceStaffMutations');

const ENABLED_ENV = {
  SHILOH_CALENDAR_READONLY_UX_ENABLED: 'true',
  SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED: 'true',
};

function principal(overrides = {}) {
  return {
    id: 61,
    staff_id: null,
    permissions: { [STAFF_ACCESS_MANAGE_CAPABILITY]: true },
    admin_active: true,
    staff_status: null,
    ...overrides,
  };
}

function canonicalStaff(overrides = {}) {
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

function accessPrincipal(overrides = {}) {
  return {
    id: 91,
    staff_id: 17,
    display_name: 'Synthetic Practitioner',
    role: 'practitioner',
    whatsapp_number: '+27821234567',
    normalized_whatsapp: '27821234567',
    active: true,
    permissions: { 'appointment:view': true },
    business_role: 'employee_practitioner',
    calendar_scope: 'own_appointments',
    service_scope: 'own_services',
    ...overrides,
  };
}

function result(rows = []) { return { rows, rowCount: rows.length }; }

function accessDb({
  admin = principal(),
  staff = canonicalStaff(),
  linked = [],
  numberOwners = null,
  failInsert = false,
} = {}) {
  const state = {
    admin,
    staff,
    linked: linked.map(row => ({ ...row, permissions: { ...(row.permissions || {}) } })),
    numberOwners: numberOwners ? numberOwners.map(row => ({ ...row })) : null,
    audits: [],
    calls: [],
    nextAdminId: 200,
  };
  const query = async (text, params = []) => {
    const sql = String(text).replace(/\s+/g, ' ').trim();
    state.calls.push({ sql, params });
    if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) return result();
    if (sql.includes('workspaceStaffAccess:principal')) return result(state.admin ? [state.admin] : []);
    if (sql.includes('pg_advisory_xact_lock')) return result([{}]);
    if (sql.includes('workspaceStaffAccess:target')) return result(state.staff ? [state.staff] : []);
    if (sql.includes('workspaceStaffAccess:linked')) return result(state.linked);
    if (sql.includes('workspaceStaffAccess:number-owner')) {
      const rows = state.numberOwners || state.linked
        .filter(row => row.normalized_whatsapp === params[0])
        .map(row => ({ id: row.id, staff_id: row.staff_id, active: row.active }));
      return result(rows);
    }
    if (sql.startsWith('INSERT INTO staff_admin_accounts')) {
      if (failInsert) throw new Error('synthetic insert failure');
      const row = {
        id: state.nextAdminId++,
        staff_id: params[0],
        display_name: params[1],
        role: params[2],
        whatsapp_number: params[3],
        normalized_whatsapp: params[4],
        active: true,
        permissions: JSON.parse(params[5]),
        business_role: params[6],
        calendar_scope: params[7],
        service_scope: params[8],
      };
      state.linked.push(row);
      return result([row]);
    }
    if (sql.startsWith('UPDATE staff_admin_accounts') && sql.includes('SET active=TRUE')) {
      const row = state.linked.find(candidate => Number(candidate.id) === Number(params[0]));
      if (!row) return result();
      row.active = true;
      row.display_name = params[1];
      return result([row]);
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

async function withServer(app, work) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  try {
    const address = server.address();
    return await work(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

function request(overrides = {}) {
  const staff = overrides.staff || canonicalStaff();
  return {
    adminId: 61,
    staffId: staff.id,
    expectedRevision: staffRevision(staff),
    requestId: 'request_access_001',
    whatsappNumber: '082 123 4567',
    ...overrides,
  };
}

test('staff_access:manage is explicit and adjacent Staff capabilities do not grant security mutation', () => {
  assert.equal(evaluateStaffAccessManageAuthority([principal()]).capability, STAFF_ACCESS_MANAGE_CAPABILITY);
  assert.equal(evaluateStaffAccessManageAuthority([principal({ permissions: { 'staff:view': true, 'staff:manage': true } })]), null);
  assert.equal(evaluateStaffAccessManageAuthority([principal({ admin_active: false })]), null);
  assert.equal(evaluateStaffAccessManageAuthority([principal({ staff_id: 4, staff_status: 'inactive' })]), null);
  assert.equal(evaluateStaffAccessManageAuthority([principal(), principal({ id: 62 })]), null);
});

test('least-privilege practitioner preset contains only Workspace view authority', () => {
  assert.deepEqual(PRACTITIONER_ACCESS_PRESET, {
    role: 'practitioner',
    businessRole: 'employee_practitioner',
    calendarScope: 'own_appointments',
    serviceScope: 'own_services',
    capabilities: ['appointment:view'],
  });
});

test('unauthorized operator fails closed before target or access records are touched', async () => {
  const fake = accessDb({ admin: principal({ permissions: { 'staff:view': true, 'staff:manage': true } }) });
  const service = createWorkspaceStaffAccessService({ db: fake.db });
  await assert.rejects(
    service.enableWorkspaceAccess(request()),
    error => error instanceof WorkspaceStaffError && error.code === 'WORKSPACE_STAFF_ACCESS_MANAGE_FORBIDDEN' && error.httpStatus === 403
  );
  assert.equal(fake.state.calls.some(call => call.sql.includes('workspaceStaffAccess:target')), false);
  assert.equal(fake.state.calls.some(call => /INSERT INTO staff_admin_accounts/.test(call.sql)), false);
  assert.equal(fake.state.audits.length, 0);
  assert.equal(fake.state.calls.some(call => call.sql === 'ROLLBACK'), true);
});

test('invalid WhatsApp fails before a transaction or authority mutation', async () => {
  const fake = accessDb();
  const service = createWorkspaceStaffAccessService({ db: fake.db });
  await assert.rejects(
    service.enableWorkspaceAccess(request({ whatsappNumber: 'not a mobile' })),
    error => error.code === 'WORKSPACE_STAFF_ACCESS_INVALID_WHATSAPP' && error.httpStatus === 400
  );
  assert.equal(fake.state.calls.length, 0);
});

test('inactive or non-employee-practitioner Staff cannot receive the bounded preset', async () => {
  const inactive = canonicalStaff({ status: 'inactive' });
  const inactiveDb = accessDb({ staff: inactive });
  await assert.rejects(
    createWorkspaceStaffAccessService({ db: inactiveDb.db }).enableWorkspaceAccess(request({ staff: inactive, expectedRevision: staffRevision(inactive) })),
    error => error.code === 'WORKSPACE_STAFF_ACCESS_INACTIVE' && error.httpStatus === 409
  );
  assert.equal(inactiveDb.state.calls.some(call => /INSERT INTO staff_admin_accounts/.test(call.sql)), false);

  const tenant = canonicalStaff({ business_role: 'tenant_practitioner', calendar_scope: 'own_services' });
  const tenantDb = accessDb({ staff: tenant });
  await assert.rejects(
    createWorkspaceStaffAccessService({ db: tenantDb.db }).enableWorkspaceAccess(request({ staff: tenant, expectedRevision: staffRevision(tenant) })),
    error => error.code === 'WORKSPACE_STAFF_ACCESS_ROLE_UNSUPPORTED' && error.httpStatus === 409
  );
  assert.equal(tenantDb.state.calls.some(call => /INSERT INTO staff_admin_accounts/.test(call.sql)), false);
});

test('ambiguous linked authority or WhatsApp ownership fails closed', async () => {
  const duplicateLinked = accessDb({ linked: [accessPrincipal(), accessPrincipal({ id: 92, normalized_whatsapp: '27821234568', whatsapp_number: '+27821234568' })] });
  await assert.rejects(
    createWorkspaceStaffAccessService({ db: duplicateLinked.db }).enableWorkspaceAccess(request()),
    error => error.code === 'WORKSPACE_STAFF_ACCESS_AMBIGUOUS' && error.httpStatus === 409
  );

  const numberConflict = accessDb({
    linked: [],
    numberOwners: [{ id: 300, staff_id: 44, active: true }],
  });
  await assert.rejects(
    createWorkspaceStaffAccessService({ db: numberConflict.db }).enableWorkspaceAccess(request()),
    error => error.code === 'WORKSPACE_STAFF_ACCESS_WHATSAPP_CONFLICT' && error.httpStatus === 409
  );
  assert.equal(numberConflict.state.calls.some(call => /INSERT INTO staff_admin_accounts/.test(call.sql)), false);
});

test('new access creates exactly one view-only canonical principal and non-PII audit evidence', async () => {
  const fake = accessDb();
  const response = await createWorkspaceStaffAccessService({ db: fake.db }).enableWorkspaceAccess(request());
  assert.equal(response.status, 'enabled');
  assert.deepEqual(response.access, {
    businessRole: 'employee_practitioner',
    calendarScope: 'own_appointments',
    serviceScope: 'own_services',
    capabilities: ['appointment:view'],
  });
  assert.equal(fake.state.linked.length, 1);
  assert.deepEqual(fake.state.linked[0], {
    id: 200,
    staff_id: 17,
    display_name: 'Synthetic Practitioner',
    role: 'practitioner',
    whatsapp_number: '+27821234567',
    normalized_whatsapp: '27821234567',
    active: true,
    permissions: { 'appointment:view': true },
    business_role: 'employee_practitioner',
    calendar_scope: 'own_appointments',
    service_scope: 'own_services',
  });
  assert.equal(fake.state.audits.length, 1);
  assert.equal(fake.state.audits[0].metadata.createdPrincipal, true);
  assert.equal(fake.state.audits[0].metadata.credentialMaterialCreated, false);
  assert.deepEqual(fake.state.audits[0].metadata.capabilities, ['appointment:view']);
  assert.equal(JSON.stringify(fake.state.audits[0]).includes('27821234567'), false);
  assert.equal(fake.state.calls.some(call => /staff_browser_sessions|totp|recovery|secret/i.test(call.sql)), false);
});

test('exact active preset is idempotent and does not emit a second audit or rewrite authority', async () => {
  const fake = accessDb({ linked: [accessPrincipal()] });
  const response = await createWorkspaceStaffAccessService({ db: fake.db }).enableWorkspaceAccess(request());
  assert.equal(response.status, 'unchanged');
  assert.equal(fake.state.audits.length, 0);
  assert.equal(fake.state.calls.some(call => call.sql.startsWith('UPDATE staff_admin_accounts')), false);
  assert.equal(fake.state.calls.some(call => call.sql.startsWith('INSERT INTO staff_admin_accounts')), false);
});

test('exact inactive preset may be reactivated without changing identity, scopes or credentials', async () => {
  const fake = accessDb({ linked: [accessPrincipal({ active: false })] });
  const response = await createWorkspaceStaffAccessService({ db: fake.db }).enableWorkspaceAccess(request());
  assert.equal(response.status, 'enabled');
  assert.equal(fake.state.linked[0].active, true);
  assert.deepEqual(fake.state.linked[0].permissions, { 'appointment:view': true });
  assert.equal(fake.state.audits[0].metadata.reactivatedExistingPrincipal, true);
  assert.equal(fake.state.audits[0].metadata.credentialMaterialChanged, false);
});

test('existing broader or different authority is preserved and never silently overwritten', async () => {
  const broader = accessPrincipal({ permissions: { 'appointment:view': true, 'appointment:create': true } });
  const fake = accessDb({ linked: [broader] });
  await assert.rejects(
    createWorkspaceStaffAccessService({ db: fake.db }).enableWorkspaceAccess(request()),
    error => error.code === 'WORKSPACE_STAFF_ACCESS_EXISTING_AUTHORITY' && error.httpStatus === 409
  );
  assert.deepEqual(fake.state.linked[0].permissions, { 'appointment:view': true, 'appointment:create': true });
  assert.equal(fake.state.calls.some(call => call.sql.startsWith('UPDATE staff_admin_accounts')), false);
  assert.equal(fake.state.audits.length, 0);
});

test('transaction failure rolls back and does not claim access enabled', async () => {
  const fake = accessDb({ failInsert: true });
  await assert.rejects(
    createWorkspaceStaffAccessService({ db: fake.db }).enableWorkspaceAccess(request()),
    /synthetic insert failure/
  );
  assert.equal(fake.state.calls.some(call => call.sql === 'ROLLBACK'), true);
  assert.equal(fake.state.audits.length, 0);
});

test('Access presentation exposes only the bounded enable action for eligible targets', () => {
  const staff = { ...canonicalStaff(), revision: staffRevision(canonicalStaff()) };
  const base = renderStaffDetailPage({
    staff,
    services: [],
    access: null,
    manageAllowed: false,
  }, { calendarNavigationAllowed: true, clientsNavigationAllowed: true, staffAccessScriptPath: '/calendar/staff/client.js' });
  const html = decorateStaffDetailAccessHtml(base, { staff, access: null, accessManageAllowed: true });
  assert.match(html, /Enable Workspace access/);
  assert.match(html, /placeholder="e\.g\. 082 123 4567"/);
  assert.match(html, /appointment:view/);
  assert.match(html, /own appointments and own services only/);
  assert.match(html, /\/calendar\/team\/access-manage\.js/);
  assert.doesNotMatch(html, /name="role"|name="businessRole"|name="calendarScope"|name="serviceScope"|name="permissions"/);
  assert.doesNotMatch(html, /password|totp|recovery code/i);

  const inactive = { ...staff, status: 'inactive' };
  const inactiveHtml = decorateStaffDetailAccessHtml(
    renderStaffDetailPage({ staff: inactive, services: [], access: null, manageAllowed: false }, { calendarNavigationAllowed: true, clientsNavigationAllowed: true, staffAccessScriptPath: '/calendar/staff/client.js' }),
    { staff: inactive, access: null, accessManageAllowed: true }
  );
  assert.doesNotMatch(inactiveHtml, /data-staff-access-enable-form/);
  assert.match(inactiveHtml, /Reactivate the Staff profile first/);

  const existing = { businessRole: 'employee_practitioner', calendarScope: 'own_appointments', serviceScope: 'own_services', capabilities: ['appointment:view'] };
  const existingHtml = decorateStaffDetailAccessHtml(
    renderStaffDetailPage({ staff, services: [], access: existing, manageAllowed: false }, { calendarNavigationAllowed: true, clientsNavigationAllowed: true, staffAccessScriptPath: '/calendar/staff/client.js' }),
    { staff, access: existing, accessManageAllowed: true }
  );
  assert.doesNotMatch(existingHtml, /data-staff-access-enable-form/);
  assert.match(existingHtml, /Existing access is preserved/);
});

test('Access client uses existing CSRF boundary and fixed enable endpoint without arbitrary authority payloads', () => {
  const script = workspaceStaffAccessClientScript();
  assert.doesNotThrow(() => new Function(script));
  assert.match(script, /\/calendar\/staff-auth\/csrf/);
  assert.match(script, /\/access\/enable/);
  assert.match(script, /x-shiloh-csrf-token/);
  assert.match(script, /expectedRevision/);
  assert.match(script, /whatsappNumber/);
  assert.doesNotMatch(script, /businessRole|calendarScope|serviceScope|permissions|appointment:create|schedule:manage/);
});

test('Access mutation HTTP boundary requires staff session, same-origin JSON and CSRF before execution', async () => {
  let executions = 0;
  const sessionService = {
    async validateSessionToken(token) { return token === 'session-ok' ? { ok: true, adminId: 61, sessionId: 71 } : { ok: false }; },
    validateCsrfToken(_session, token) { return token === 'csrf-ok'; },
  };
  const accessService = {
    async enableWorkspaceAccess(input) {
      executions += 1;
      assert.equal(input.adminId, 61);
      assert.equal(input.staffId, '17');
      return { status: 'enabled', staffId: 17 };
    },
  };
  const app = express();
  app.use(express.json());
  app.use('/calendar/team', createWorkspaceStaffMutationRouter({
    env: ENABLED_ENV,
    sessionService,
    service: {},
    accessService,
  }));
  await withServer(app, async base => {
    const path = `${base}/calendar/team/17/access/enable`;
    const noSession = await fetch(path, { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: '{}' });
    assert.equal(noSession.status, 401);
    const crossOrigin = await fetch(path, { method: 'POST', headers: { origin: 'https://example.invalid', 'content-type': 'application/json', cookie: 'shiloh_staff_session=session-ok', 'x-shiloh-csrf-token': 'csrf-ok' }, body: '{}' });
    assert.equal(crossOrigin.status, 403);
    const noCsrf = await fetch(path, { method: 'POST', headers: { origin: base, 'content-type': 'application/json', cookie: 'shiloh_staff_session=session-ok' }, body: '{}' });
    assert.equal(noCsrf.status, 403);
    const allowed = await fetch(path, { method: 'POST', headers: { origin: base, 'content-type': 'application/json', cookie: 'shiloh_staff_session=session-ok', 'x-shiloh-csrf-token': 'csrf-ok' }, body: JSON.stringify({ requestId: 'request_route', expectedRevision: 'a'.repeat(64), whatsappNumber: '0821234567' }) });
    assert.equal(allowed.status, 200);
    assert.equal(executions, 1);
  });
});
