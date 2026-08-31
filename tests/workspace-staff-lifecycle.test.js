const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const {
  STAFF_MANAGE_CAPABILITY,
  WorkspaceStaffError,
  evaluateStaffManageAuthority,
  staffRevision,
  createWorkspaceStaffService,
} = require('../src/services/workspaceStaff');
const { createWorkspaceStaffMutationRouter } = require('../src/routes/workspaceStaffMutations');
const {
  renderStaffListPage,
  renderStaffDetailPage,
  workspaceStaffManageClientScript,
} = require('../src/presentation/workspaceStaffUx');

function principal(overrides = {}) {
  return {
    id: 51,
    staff_id: null,
    display_name: 'Synthetic Admin',
    permissions: { 'staff:view': true, 'staff:manage': true },
    admin_active: true,
    staff_status: null,
    ...overrides,
  };
}

function canonicalStaff(overrides = {}) {
  return {
    id: 9,
    display_name: 'Synthetic Practitioner',
    resource_type: 'practitioner',
    status: 'active',
    scheduling_type: 'regular',
    client_bookable: true,
    business_role: 'employee_practitioner',
    calendar_scope: 'own_appointments',
    active_admin_count: 0,
    ...overrides,
  };
}

function result(rows = []) { return { rows, rowCount: rows.length }; }

function transactionalDb(handler, { admin = principal(), staff = canonicalStaff() } = {}) {
  const calls = [];
  const query = async (text, params = []) => {
    const sql = String(text).replace(/\s+/g, ' ').trim();
    calls.push({ sql, params });
    if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return result();
    if (sql.includes('workspaceStaff:principal')) return result(admin ? [admin] : []);
    if (sql.includes('pg_advisory_xact_lock')) return result([{}]);
    if (sql.includes('workspaceStaff:mutation-staff')) return result(staff ? [staff] : []);
    if (sql.includes('workspaceStaff:unique-name')) return result();
    if (sql.startsWith('INSERT INTO crm_audit_events')) return result([{ id: 901 }]);
    return handler(sql, params, calls);
  };
  const client = { query, release() { calls.push({ sql: 'RELEASE', params: [] }); } };
  return { db: { query, async connect() { return client; } }, calls };
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

test('staff:manage is explicit canonical mutation authority and adjacent scopes do not grant it', () => {
  assert.equal(evaluateStaffManageAuthority([principal()]).capability, STAFF_MANAGE_CAPABILITY);
  assert.equal(evaluateStaffManageAuthority([principal({ permissions: { 'staff:view': true, 'services:manage': true, 'schedule:manage': true } })]), null);
  assert.equal(evaluateStaffManageAuthority([principal({ admin_active: false })]), null);
  assert.equal(evaluateStaffManageAuthority([principal({ staff_id: 7, staff_status: 'inactive' })]), null);
  assert.equal(evaluateStaffManageAuthority([principal(), principal({ id: 52 })]), null);
});

test('view-only principal fails closed before canonical Staff mutation', async () => {
  const current = canonicalStaff();
  const fake = transactionalDb(async sql => { throw new Error(`Unexpected mutation SQL: ${sql}`); }, {
    admin: principal({ permissions: { 'staff:view': true } }),
    staff: current,
  });
  const service = createWorkspaceStaffService({ db: fake.db });
  await assert.rejects(service.updateStaff({
    adminId: 51,
    staffId: 9,
    expectedRevision: staffRevision(current),
    requestId: 'request_001',
    displayName: 'Changed',
    schedulingType: 'regular',
    clientBookable: true,
  }), error => error instanceof WorkspaceStaffError && error.code === 'WORKSPACE_STAFF_MANAGE_FORBIDDEN' && error.httpStatus === 403);
  assert.equal(fake.calls.some(call => call.sql.startsWith('UPDATE staff')), false);
  assert.equal(fake.calls.some(call => call.sql.startsWith('INSERT INTO crm_audit_events')), false);
});

test('staff creation writes one canonical profile with safe baselines and no access or credential material', async () => {
  const created = canonicalStaff({ id: 12, display_name: 'New Practitioner', client_bookable: false });
  const fake = transactionalDb(async (sql, params) => {
    if (sql.startsWith('INSERT INTO staff(')) {
      assert.deepEqual(params, ['New Practitioner', 'practitioner', 'regular', false, 'employee_practitioner', 'own_appointments']);
      return result([created]);
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  }, { staff: null });
  const response = await createWorkspaceStaffService({ db: fake.db }).createStaff({
    adminId: 51,
    requestId: 'request_002',
    displayName: ' New   Practitioner ',
    resourceType: 'practitioner',
    schedulingType: 'regular',
    clientBookable: false,
  });
  assert.equal(response.status, 'created');
  assert.equal(response.staffId, 12);
  assert.equal(fake.calls.some(call => /INSERT INTO staff_admin_accounts|staff_browser_sessions|totp|recovery/i.test(call.sql)), false);
  assert.equal(fake.calls.some(call => /INSERT INTO staff_services/i.test(call.sql)), false);
  const audit = fake.calls.find(call => call.sql.startsWith('INSERT INTO crm_audit_events'));
  assert.equal(audit.params[1], 'workspace.staff_created');
  const metadata = JSON.parse(audit.params[3]);
  assert.equal(metadata.adminAccountCreated, false);
  assert.equal(metadata.credentialMaterialCreated, false);
});

test('business resource creation is system-only and never client-bookable', async () => {
  const fake = transactionalDb(async (sql, params) => {
    if (sql.startsWith('INSERT INTO staff(')) {
      assert.deepEqual(params, ['Treatment Room', 'business_resource', 'system', false, 'business_resource', 'none']);
      return result([canonicalStaff({ id: 13, display_name: 'Treatment Room', resource_type: 'business_resource', scheduling_type: 'system', client_bookable: false, business_role: 'business_resource', calendar_scope: 'none' })]);
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  }, { staff: null });
  await createWorkspaceStaffService({ db: fake.db }).createStaff({
    adminId: 51, requestId: 'request_003', displayName: 'Treatment Room', resourceType: 'business_resource', schedulingType: 'system', clientBookable: false,
  });
  await assert.rejects(
    createWorkspaceStaffService({ db: fake.db }).createStaff({ adminId: 51, requestId: 'request_004', displayName: 'Bad Room', resourceType: 'business_resource', schedulingType: 'system', clientBookable: true }),
    error => error.code === 'WORKSPACE_STAFF_INVALID_BOOKING_POLICY' && error.httpStatus === 400
  );
});

test('profile edit changes only bounded canonical fields and keeps resource/access/service authority untouched', async () => {
  const current = canonicalStaff();
  const fake = transactionalDb(async (sql, params) => {
    if (sql.startsWith('UPDATE staff') && sql.includes('SET display_name=')) {
      assert.deepEqual(params, [9, 'Synthetic Practitioner Plus', 'freelance', false]);
      assert.match(sql, /SET display_name=\$2, scheduling_type=\$3, client_bookable=\$4, updated_at=NOW\(\)/);
      assert.doesNotMatch(sql, /SET[^]*resource_type=|SET[^]*business_role=|SET[^]*calendar_scope=|SET[^]*status=/i);
      return result([canonicalStaff({ display_name: 'Synthetic Practitioner Plus', scheduling_type: 'freelance', client_bookable: false })]);
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  }, { staff: current });
  const response = await createWorkspaceStaffService({ db: fake.db }).updateStaff({
    adminId: 51, staffId: 9, expectedRevision: staffRevision(current), requestId: 'request_005',
    displayName: ' Synthetic  Practitioner Plus ', schedulingType: 'freelance', clientBookable: false,
  });
  assert.equal(response.status, 'updated');
  assert.equal(fake.calls.some(call => /UPDATE staff_admin_accounts|INSERT INTO staff_services|DELETE FROM staff_services/i.test(call.sql)), false);
});

test('stale Staff revision fails closed atomically', async () => {
  const fake = transactionalDb(async sql => { throw new Error(`Unexpected SQL after stale revision: ${sql}`); });
  const service = createWorkspaceStaffService({ db: fake.db });
  await assert.rejects(service.setStaffStatus({
    adminId: 51, staffId: 9, expectedRevision: '0'.repeat(64), requestId: 'request_006', status: 'inactive',
  }), error => error.code === 'WORKSPACE_STAFF_STALE_REVISION' && error.httpStatus === 409);
  assert.equal(fake.calls.some(call => call.sql.startsWith('UPDATE staff')), false);
  assert.equal(fake.calls.some(call => call.sql.startsWith('INSERT INTO crm_audit_events')), false);
  assert.equal(fake.calls.some(call => call.sql === 'ROLLBACK'), true);
});

test('deactivation is status-only, preserves history/mappings/access records and blocks self-deactivation', async () => {
  const current = canonicalStaff();
  const fake = transactionalDb(async (sql, params) => {
    if (sql.startsWith('UPDATE staff') && sql.includes('SET status=')) {
      assert.deepEqual(params, [9, 'inactive']);
      return result([canonicalStaff({ status: 'inactive' })]);
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  }, { staff: current });
  await createWorkspaceStaffService({ db: fake.db }).setStaffStatus({
    adminId: 51, staffId: 9, expectedRevision: staffRevision(current), requestId: 'request_007', status: 'inactive',
  });
  assert.equal(fake.calls.some(call => /DELETE FROM staff_services|UPDATE staff_admin_accounts|DELETE FROM staff_admin_accounts|appointments|appointment_services|appointment_staff/i.test(call.sql)), false);
  const audit = fake.calls.find(call => call.sql.startsWith('INSERT INTO crm_audit_events'));
  const metadata = JSON.parse(audit.params[3]);
  assert.equal(metadata.statusOnly, true);
  assert.equal(metadata.serviceMappingsPreserved, true);
  assert.equal(metadata.appointmentHistoryPreserved, true);
  assert.equal(metadata.linkedAccessRecordsPreserved, true);

  const self = transactionalDb(async sql => { throw new Error(`Unexpected self-deactivation SQL: ${sql}`); }, {
    admin: principal({ staff_id: 9, staff_status: 'active' }), staff: current,
  });
  await assert.rejects(createWorkspaceStaffService({ db: self.db }).setStaffStatus({
    adminId: 51, staffId: 9, expectedRevision: staffRevision(current), requestId: 'request_008', status: 'inactive',
  }), error => error.code === 'WORKSPACE_STAFF_SELF_DEACTIVATION_BLOCKED' && error.httpStatus === 409);
  assert.equal(self.calls.some(call => call.sql.startsWith('UPDATE staff')), false);
});

test('mutation HTTP boundary requires staff session, same-origin JSON and CSRF before service execution', async () => {
  let executions = 0;
  const sessionService = {
    async validateSessionToken(token) { return token === 'session-ok' ? { ok: true, adminId: 51, sessionId: 71 } : { ok: false }; },
    validateCsrfToken(_session, token) { return token === 'csrf-ok'; },
  };
  const mutationService = { async updateStaff() { executions += 1; return { status: 'updated', staffId: 9, revision: 'a'.repeat(64) }; } };
  const app = express();
  app.use(express.json());
  app.use('/calendar/team', createWorkspaceStaffMutationRouter({
    env: { SHILOH_CALENDAR_READONLY_UX_ENABLED: 'true', SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED: 'true' },
    sessionService,
    service: mutationService,
  }));
  await withServer(app, async base => {
    const noSession = await fetch(`${base}/calendar/team/9/update`, { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: '{}' });
    assert.equal(noSession.status, 401);
    const crossOrigin = await fetch(`${base}/calendar/team/9/update`, { method: 'POST', headers: { origin: 'https://example.invalid', 'content-type': 'application/json', cookie: 'shiloh_staff_session=session-ok', 'x-shiloh-csrf-token': 'csrf-ok' }, body: '{}' });
    assert.equal(crossOrigin.status, 403);
    const noCsrf = await fetch(`${base}/calendar/team/9/update`, { method: 'POST', headers: { origin: base, 'content-type': 'application/json', cookie: 'shiloh_staff_session=session-ok' }, body: '{}' });
    assert.equal(noCsrf.status, 403);
    const allowed = await fetch(`${base}/calendar/team/9/update`, { method: 'POST', headers: { origin: base, 'content-type': 'application/json', cookie: 'shiloh_staff_session=session-ok', 'x-shiloh-csrf-token': 'csrf-ok' }, body: '{}' });
    assert.equal(allowed.status, 200);
    assert.equal(executions, 1);
  });
});

test('Workspace Staff UX exposes only bounded lifecycle controls and secure JSON client', () => {
  const options = { calendarNavigationAllowed: true, clientsNavigationAllowed: true, staffAccessScriptPath: '/calendar/staff/client.js' };
  const list = renderStaffListPage({ staff: [], hasMore: false, offset: 0, pageSize: 30, query: '', status: 'active', manageAllowed: true }, options);
  assert.match(list, /data-staff-create-form/);
  assert.match(list, /\/calendar\/team\/manage\.js/);
  assert.match(list, /name="resourceType"/);
  assert.doesNotMatch(list, /password|totp|recovery|whatsapp_number/i);

  const managed = renderStaffDetailPage({
    staff: { ...canonicalStaff(), revision: 'b'.repeat(64) },
    services: [{ name: 'Swedish Massage', status: 'active' }],
    access: { businessRole: 'employee_practitioner', calendarScope: 'own_appointments', serviceScope: 'own_services', capabilities: ['appointment:view'] },
    manageAllowed: true,
  }, options);
  assert.match(managed, /data-staff-edit-form/);
  assert.match(managed, /data-staff-status-form/);
  assert.match(managed, /name="displayName"/);
  assert.match(managed, /name="schedulingType"/);
  assert.match(managed, /name="clientBookable"/);
  assert.match(managed, /Service assignment is intentionally read-only here/);
  assert.match(managed, /Role, capability and scope changes remain separately governed/);
  assert.doesNotMatch(managed, /name="business_role"|name="calendar_scope"|name="permissions"|Delete staff/i);

  const viewOnly = renderStaffDetailPage({
    staff: { ...canonicalStaff(), revision: 'c'.repeat(64) }, services: [], access: null, manageAllowed: false,
  }, options);
  assert.doesNotMatch(viewOnly, /data-staff-edit-form|data-staff-status-form|\/calendar\/team\/manage\.js/);

  const client = workspaceStaffManageClientScript();
  assert.match(client, /AUTH='\/calendar\/staff-auth'/);
  assert.match(client, /AUTH\+'\/csrf'/);
  assert.match(client, /x-shiloh-csrf-token/);
  assert.match(client, /Content-Type':'application\/json/);
  assert.match(client, /window\.location\.reload/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|staff:view/);
});
