const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RECEPTION_DISPLAY_NAME,
  RECEPTION_PRESET,
  FORBIDDEN_RECEPTION_CAPABILITIES,
  expectedPermissions,
  isExactReceptionPrincipal,
  receptionProjection,
  createWorkspaceReceptionAccessService,
} = require('../src/services/workspaceReceptionAccess');

test('Reception preset is fixed to shared booking-operator authority without prohibited powers', () => {
  assert.equal(RECEPTION_DISPLAY_NAME, 'Shiloh Reception');
  assert.equal(RECEPTION_PRESET.role, 'receptionist');
  assert.equal(RECEPTION_PRESET.businessRole, 'booking_operator');
  assert.equal(RECEPTION_PRESET.calendarScope, 'all_business');
  assert.equal(RECEPTION_PRESET.serviceScope, 'all_services');
  const permissions = expectedPermissions();
  for (const key of RECEPTION_PRESET.capabilities) assert.equal(permissions[key], true);
  for (const key of FORBIDDEN_RECEPTION_CAPABILITIES) {
    assert.equal(Object.prototype.hasOwnProperty.call(permissions, key), false, `${key} must not be granted`);
  }
});

test('exact Reception principal must be active, non-Staff and exact-scope', () => {
  const exact = {
    id: 9,
    staff_id: null,
    display_name: 'Shiloh Reception',
    role: 'receptionist',
    normalized_whatsapp: '27660000000',
    active: true,
    permissions: expectedPermissions(),
    business_role: 'booking_operator',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
  };
  assert.equal(isExactReceptionPrincipal(exact, '27660000000'), true);
  assert.equal(isExactReceptionPrincipal({ ...exact, staff_id: 5 }, '27660000000'), false);
  assert.equal(isExactReceptionPrincipal({ ...exact, business_role: 'business_admin' }, '27660000000'), false);
  assert.equal(isExactReceptionPrincipal({ ...exact, permissions: { ...expectedPermissions(), 'staff_access:manage': true } }, '27660000000'), false);
});

test('Reception projection never exposes private identity material', () => {
  const projected = receptionProjection({ active: true });
  assert.equal(projected.configured, true);
  assert.equal(projected.staffLinked, false);
  assert.equal(projected.businessRole, 'booking_operator');
  assert.equal(Object.prototype.hasOwnProperty.call(projected, 'normalizedWhatsapp'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(projected, 'whatsappNumber'), false);
});

test('Reception creation validates operator attestation and mobile before database mutation', async () => {
  const db = {
    query: async () => ({ rows: [] }),
    connect: async () => { throw new Error('transaction must not start'); },
  };
  const service = createWorkspaceReceptionAccessService({
    db,
    staffAccessService: { requireManageAccess: async () => ({ operatorAdminId: 1 }) },
  });
  await assert.rejects(
    service.createReceptionPrincipal({ adminId: 1, requestId: 'reception-invalid-mobile', whatsappNumber: 'bad', identityConfirmed: true }),
    error => error.code === 'WORKSPACE_RECEPTION_ACCESS_INVALID_WHATSAPP' && error.httpStatus === 400
  );
  await assert.rejects(
    service.createReceptionPrincipal({ adminId: 1, requestId: 'reception-unconfirmed', whatsappNumber: '0821234567', identityConfirmed: false }),
    error => error.code === 'WORKSPACE_RECEPTION_ACCESS_IDENTITY_UNCONFIRMED' && error.httpStatus === 400
  );
});

test('Reception state fails closed when operator lacks Access administration', async () => {
  const service = createWorkspaceReceptionAccessService({
    db: { query: async () => ({ rows: [] }) },
    staffAccessService: {
      requireManageAccess: async () => {
        const error = new Error('forbidden');
        error.code = 'WORKSPACE_STAFF_ACCESS_MANAGE_FORBIDDEN';
        error.httpStatus = 403;
        throw error;
      },
    },
  });
  await assert.rejects(service.getState(44), error => error.httpStatus === 403);
});
