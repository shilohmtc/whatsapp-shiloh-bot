const test = require('node:test');
const assert = require('node:assert/strict');

const {
  OPERATOR_ROLES,
  operatorRoleForAdmin,
} = require('../src/services/operatorContactAuthority');

test('operator authority matches governed JP and Christel production role shapes', () => {
  assert.equal(
    operatorRoleForAdmin({ role: 'admin', business_role: 'business_admin' }),
    OPERATOR_ROLES.SUPER_ADMIN
  );
  assert.equal(
    operatorRoleForAdmin({ role: 'owner', business_role: 'owner' }),
    OPERATOR_ROLES.OPERATIONS_ADMIN
  );
});

test('legacy owner compatibility remains bounded by business_role=owner', () => {
  assert.equal(
    operatorRoleForAdmin({ role: 'manager', business_role: 'owner' }),
    OPERATOR_ROLES.OPERATIONS_ADMIN
  );
  assert.equal(
    operatorRoleForAdmin({ role: 'admin', business_role: 'owner' }),
    OPERATOR_ROLES.OPERATIONS_ADMIN
  );
  assert.equal(operatorRoleForAdmin({ role: 'owner', business_role: 'employee_practitioner' }), null);
  assert.equal(operatorRoleForAdmin({ role: 'owner', business_role: 'business_admin' }), null);
});

test('native capability roles remain unchanged and non-operators remain denied', () => {
  assert.equal(
    operatorRoleForAdmin({ role: 'super_admin', business_role: 'business_admin' }),
    OPERATOR_ROLES.SUPER_ADMIN
  );
  assert.equal(
    operatorRoleForAdmin({ role: 'operations_admin', business_role: 'owner' }),
    OPERATOR_ROLES.OPERATIONS_ADMIN
  );
  assert.equal(operatorRoleForAdmin({ role: 'practitioner', business_role: 'employee_practitioner' }), null);
  assert.equal(operatorRoleForAdmin({ role: 'read_only', business_role: 'employee_practitioner' }), null);
  assert.equal(operatorRoleForAdmin({ role: 'manager', business_role: 'tenant_practitioner' }), null);
});
