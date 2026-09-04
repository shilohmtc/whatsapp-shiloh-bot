from pathlib import Path

SOURCE = Path('src/services/workspaceServices.js')
TEST = Path('tests/workspace-services-visibility-p1.test.js')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    return text.replace(old, new, 1)


text = SOURCE.read_text()
text = replace_once(
    text,
    "const { pool } = require('../db/pool');\n",
    "const { pool } = require('../db/pool');\nconst { serviceVisibilityAllows } = require('./calendarAuthorization');\n",
    'shared visibility import',
)
text = replace_once(
    text,
    "    displayName: String(principal.display_name || 'Staff').trim() || 'Staff',\n    capability,\n",
    "    displayName: String(principal.display_name || 'Staff').trim() || 'Staff',\n    linkedStaffId: positiveId(principal.staff_id),\n    businessRole: String(principal.business_role || '').trim().toLowerCase(),\n    capability,\n",
    'authority role/link projection',
)
text = replace_once(
    text,
    "       SELECT a.id, a.staff_id, a.display_name, a.permissions,\n              a.active AS admin_active, s.status AS staff_status\n",
    "       SELECT a.id, a.staff_id, a.display_name, a.permissions, a.business_role,\n              a.active AS admin_active, s.status AS staff_status\n",
    'principal business role select',
)
text = replace_once(
    text,
    "    const values = [];\n    const where = [];\n    if (serviceStatus) {\n",
    "    const values = [];\n    const where = [];\n    if (authority.businessRole === 'tenant_practitioner' && authority.linkedStaffId) {\n      values.push(authority.linkedStaffId);\n      where.push(`(visibility.owner_staff_id IS NULL OR visibility.owner_staff_id=$${values.length})`);\n    } else if (authority.businessRole !== 'booking_operator') {\n      where.push('visibility.owner_staff_id IS NULL');\n    }\n    if (serviceStatus) {\n",
    'list visibility predicate',
)
text = replace_once(
    text,
    "              svc.variable_price, svc.price, svc.display_price, svc.status,\n              sc.name AS category_name,\n",
    "              svc.variable_price, svc.price, svc.display_price, svc.status,\n              sc.name AS category_name, visibility.owner_staff_id AS private_owner_staff_id,\n",
    'list visibility projection',
)
text = replace_once(
    text,
    "         FROM services svc\n         LEFT JOIN service_categories sc ON sc.id=svc.category_id\n         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}\n",
    "         FROM services svc\n         LEFT JOIN service_categories sc ON sc.id=svc.category_id\n         LEFT JOIN service_visibility_policies visibility ON visibility.service_id=svc.id\n         ${where.length ? `WHERE ${where.join(' AND ')}` : ''}\n",
    'list visibility join',
)
text = replace_once(
    text,
    "    const rows = result.rows.slice(0, SERVICES_LIST_PAGE_SIZE).map(service => ({\n      ...service,\n      total_minutes: totalServiceMinutes(service),\n      booking_eligibility: projectBookingEligibility(service),\n    }));\n",
    "    const visibleRows = result.rows.filter(service => serviceVisibilityAllows(authority, service.private_owner_staff_id));\n    const rows = visibleRows.slice(0, SERVICES_LIST_PAGE_SIZE).map(service => {\n      const { private_owner_staff_id: _privateOwnerStaffId, ...publicService } = service;\n      return {\n        ...publicService,\n        total_minutes: totalServiceMinutes(publicService),\n        booking_eligibility: projectBookingEligibility(publicService),\n      };\n    });\n",
    'list shared-helper enforcement',
)
text = replace_once(
    text,
    "      hasMore: result.rows.length > SERVICES_LIST_PAGE_SIZE,\n",
    "      hasMore: visibleRows.length > SERVICES_LIST_PAGE_SIZE,\n",
    'list visible pagination',
)
text = replace_once(
    text,
    "              svc.customer_description, svc.booking_note,\n              sc.name AS category_name\n         FROM services svc\n         LEFT JOIN service_categories sc ON sc.id=svc.category_id\n",
    "              svc.customer_description, svc.booking_note,\n              sc.name AS category_name, visibility.owner_staff_id AS private_owner_staff_id\n         FROM services svc\n         LEFT JOIN service_categories sc ON sc.id=svc.category_id\n         LEFT JOIN service_visibility_policies visibility ON visibility.service_id=svc.id\n",
    'detail visibility join/projection',
)
text = replace_once(
    text,
    "    const service = serviceResult.rows[0];\n    if (!service) throw new WorkspaceServicesError('WORKSPACE_SERVICE_NOT_FOUND', 'Service was not found.', 404);\n\n    const assignedStaff = await readAssignedStaff(db, id);\n",
    "    const service = serviceResult.rows[0];\n    if (!service || !serviceVisibilityAllows(authority, service.private_owner_staff_id)) {\n      throw new WorkspaceServicesError('WORKSPACE_SERVICE_NOT_FOUND', 'Service was not found.', 404);\n    }\n    delete service.private_owner_staff_id;\n\n    const assignedStaff = await readAssignedStaff(db, id);\n",
    'detail fail-closed visibility',
)
text = replace_once(
    text,
    "  async function lockServiceState(client, serviceId) {\n",
    "  async function lockServiceState(client, serviceId, authority) {\n",
    'mutation lock authority argument',
)
text = replace_once(
    text,
    "       SELECT id, name, duration_minutes, processing_time_minutes, extra_time_minutes,\n              variable_price, price, display_price, status\n         FROM services\n        WHERE id=$1\n        FOR UPDATE`,\n",
    "       SELECT svc.id, svc.name, svc.duration_minutes, svc.processing_time_minutes, svc.extra_time_minutes,\n              svc.variable_price, svc.price, svc.display_price, svc.status,\n              visibility.owner_staff_id AS private_owner_staff_id\n         FROM services svc\n         LEFT JOIN service_visibility_policies visibility ON visibility.service_id=svc.id\n        WHERE svc.id=$1\n        FOR UPDATE OF svc`,\n",
    'mutation visibility join/projection',
)
text = replace_once(
    text,
    "    const service = serviceResult.rows[0];\n    if (!service) throw new WorkspaceServicesError('WORKSPACE_SERVICE_NOT_FOUND', 'Service was not found.', 404);\n    const assignmentResult = await client.query(\n",
    "    const service = serviceResult.rows[0];\n    if (!service || !serviceVisibilityAllows(authority, service.private_owner_staff_id)) {\n      throw new WorkspaceServicesError('WORKSPACE_SERVICE_NOT_FOUND', 'Service was not found.', 404);\n    }\n    delete service.private_owner_staff_id;\n    const assignmentResult = await client.query(\n",
    'mutation fail-closed visibility',
)
text = replace_once(
    text,
    "      const state = await lockServiceState(client, id);\n",
    "      const state = await lockServiceState(client, id, operator);\n",
    'mutation passes authority to lock',
)
SOURCE.write_text(text)

TEST.write_text(r'''const test = require('node:test');
const assert = require('node:assert/strict');

const {
  WorkspaceServicesError,
  evaluateServicesReadAuthority,
  evaluateServicesManageAuthority,
  serviceRevision,
  createWorkspaceServicesService,
} = require('../src/services/workspaceServices');

function result(rows = []) { return { rows, rowCount: rows.length }; }

function principal({ role = 'owner', staffId = null, permissions = { 'services:view': true, 'services:manage': true } } = {}) {
  return {
    id: 71,
    staff_id: staffId,
    display_name: 'Visibility Operator',
    business_role: role,
    permissions,
    admin_active: true,
    staff_status: staffId ? 'active' : null,
  };
}

function serviceRow(id, privateOwnerStaffId = null) {
  return {
    id,
    name: `Service ${id}`,
    duration_minutes: 45,
    processing_time_minutes: 0,
    extra_time_minutes: 0,
    variable_price: false,
    price: '450.00',
    display_price: 'R450',
    status: 'active',
    category_name: 'Massage',
    assigned_staff_count: 1,
    client_bookable_staff_count: 1,
    private_owner_staff_id: privateOwnerStaffId,
  };
}

function readDb({ admin, listRows = [], detailRow = null } = {}) {
  const calls = [];
  const db = {
    async query(text, params = []) {
      const sql = String(text).replace(/\s+/g, ' ').trim();
      calls.push({ sql, params });
      if (sql.includes('workspaceServices:principal')) return result(admin ? [admin] : []);
      if (sql.includes('workspaceServices:list')) return result(listRows);
      if (sql.includes('workspaceServices:detail')) return result(detailRow ? [detailRow] : []);
      if (sql.includes('workspaceServices:staff')) return result([]);
      if (sql.includes('workspaceServices:practitioners')) return result([]);
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  return { db, calls };
}

function mutationDb({ admin, target } = {}) {
  const calls = [];
  const query = async (text, params = []) => {
    const sql = String(text).replace(/\s+/g, ' ').trim();
    calls.push({ sql, params });
    if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return result();
    if (sql.includes('workspaceServices:principal')) return result(admin ? [admin] : []);
    if (sql.includes('pg_advisory_xact_lock')) return result([{}]);
    if (sql.includes('workspaceServices:mutation-service')) return result(target ? [target] : []);
    if (sql.includes('workspaceServices:mutation-assignments')) return result([{ staff_id: 11 }]);
    if (sql.startsWith('UPDATE services')) throw new Error('Target mutation must not execute in visibility-denial test');
    if (sql.startsWith('INSERT INTO crm_audit_events')) throw new Error('Audit must not execute in visibility-denial test');
    throw new Error(`Unexpected SQL: ${sql}`);
  };
  const client = { query, release() {} };
  return { db: { query, async connect() { return client; } }, calls };
}

test('Workspace Services authority carries canonical business role and linked staff context', () => {
  const tenant = principal({ role: 'tenant_practitioner', staffId: 11 });
  const read = evaluateServicesReadAuthority([tenant]);
  const manage = evaluateServicesManageAuthority([tenant]);
  assert.equal(read.businessRole, 'tenant_practitioner');
  assert.equal(read.linkedStaffId, 11);
  assert.equal(manage.businessRole, 'tenant_practitioner');
  assert.equal(manage.linkedStaffId, 11);
});

test('Workspace Services list preserves global visibility and applies canonical tenant-private matrix', async () => {
  const rows = [serviceRow(1, null), serviceRow(2, 11), serviceRow(3, 12)];

  const owner = readDb({ admin: principal({ role: 'owner' }), listRows: rows });
  const ownerList = await createWorkspaceServicesService({ db: owner.db }).listServices({ adminId: 71, status: 'all' });
  assert.deepEqual(ownerList.services.map(row => row.id), [1]);
  assert.match(owner.calls.find(call => call.sql.includes('workspaceServices:list')).sql, /visibility\.owner_staff_id IS NULL/);

  const booking = readDb({ admin: principal({ role: 'booking_operator' }), listRows: rows });
  const bookingList = await createWorkspaceServicesService({ db: booking.db }).listServices({ adminId: 71, status: 'all' });
  assert.deepEqual(bookingList.services.map(row => row.id), [1, 2, 3]);

  const tenant = readDb({ admin: principal({ role: 'tenant_practitioner', staffId: 11 }), listRows: rows });
  const tenantList = await createWorkspaceServicesService({ db: tenant.db }).listServices({ adminId: 71, status: 'all' });
  assert.deepEqual(tenantList.services.map(row => row.id), [1, 2]);
  const tenantSql = tenant.calls.find(call => call.sql.includes('workspaceServices:list'));
  assert.match(tenantSql.sql, /visibility\.owner_staff_id=\$1/);
  assert.equal(tenantSql.params[0], 11);

  for (const model of [ownerList, bookingList, tenantList]) {
    assert.equal(model.services.some(row => Object.prototype.hasOwnProperty.call(row, 'private_owner_staff_id')), false);
  }
});

test('tenant-private detail is hidden from unrelated principals and missing linked staff fails closed before subordinate reads', async () => {
  for (const admin of [principal({ role: 'business_admin' }), principal({ role: 'tenant_practitioner' })]) {
    const fake = readDb({ admin, detailRow: serviceRow(2, 11) });
    await assert.rejects(
      createWorkspaceServicesService({ db: fake.db }).getServiceDetail({ adminId: 71, serviceId: 2 }),
      error => error instanceof WorkspaceServicesError && error.code === 'WORKSPACE_SERVICE_NOT_FOUND' && error.httpStatus === 404
    );
    assert.equal(fake.calls.some(call => call.sql.includes('workspaceServices:staff')), false);
    assert.equal(fake.calls.some(call => call.sql.includes('workspaceServices:practitioners')), false);
  }

  const own = readDb({ admin: principal({ role: 'tenant_practitioner', staffId: 11 }), detailRow: serviceRow(2, 11) });
  const detail = await createWorkspaceServicesService({ db: own.db }).getServiceDetail({ adminId: 71, serviceId: 2 });
  assert.equal(detail.service.id, 2);
  assert.equal(Object.prototype.hasOwnProperty.call(detail.service, 'private_owner_staff_id'), false);
});

test('crafted mutation against invisible tenant-private service fails before revision, assignment read, mutation or audit', async () => {
  const target = serviceRow(9, 11);
  const fake = mutationDb({ admin: principal({ role: 'owner' }), target });
  const service = createWorkspaceServicesService({ db: fake.db });
  await assert.rejects(
    service.setServiceStatus({
      adminId: 71,
      serviceId: 9,
      expectedRevision: serviceRevision(target, [11]),
      requestId: 'visibility_001',
      status: 'inactive',
    }),
    error => error.code === 'WORKSPACE_SERVICE_NOT_FOUND' && error.httpStatus === 404
  );
  assert.equal(fake.calls.some(call => call.sql.includes('workspaceServices:mutation-assignments')), false);
  assert.equal(fake.calls.some(call => call.sql.startsWith('UPDATE services')), false);
  assert.equal(fake.calls.some(call => call.sql.startsWith('INSERT INTO crm_audit_events')), false);
  assert.equal(fake.calls.some(call => call.sql === 'ROLLBACK'), true);
});

test('visibility never grants mutation authority: visible booking operator without services:manage is denied before target read', async () => {
  const fake = mutationDb({
    admin: principal({ role: 'booking_operator', permissions: { 'services:view': true } }),
    target: serviceRow(9, 11),
  });
  await assert.rejects(
    createWorkspaceServicesService({ db: fake.db }).setServiceStatus({
      adminId: 71,
      serviceId: 9,
      expectedRevision: '0'.repeat(64),
      requestId: 'visibility_002',
      status: 'inactive',
    }),
    error => error.code === 'WORKSPACE_SERVICES_MANAGE_FORBIDDEN' && error.httpStatus === 403
  );
  assert.equal(fake.calls.some(call => call.sql.includes('workspaceServices:mutation-service')), false);
});
''')

print('Applied #695 Workspace Services visibility patch')
