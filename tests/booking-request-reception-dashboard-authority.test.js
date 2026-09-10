const test = require('node:test');
const assert = require('node:assert/strict');
const { dashboardAuthority, viewerMatchesPrincipal } = require('../src/services/workspaceDashboard');

function principal(overrides = {}) {
  return {
    permissions: { 'appointment:view': true, 'booking:update': true },
    calendarAuthority: {
      linkedStaffId: null,
      businessRole: 'booking_operator',
      calendarScope: 'all_business',
      capabilities: ['appointment:view', 'appointment:create', 'client:lookup'],
      ...overrides,
    },
  };
}

test('Reception booking operator with canonical all-business authority receives business Dashboard overview without practitioner linkage', () => {
  const authority = dashboardAuthority(principal());
  assert.equal(authority.mode, 'business_overview');
  assert.equal(authority.linkedStaffId, null);
  assert.equal(authority.canFinalize, true);
  assert.equal(authority.canFinalizeAllBusiness, true);
  assert.deepEqual(authority.timelineViewer, { calendarScope: 'all_business' });
  assert.equal(viewerMatchesPrincipal({ calendarScope: 'business_all_staff' }, principal()), true);
});

test('Reception Dashboard access still requires appointment:view capability', () => {
  assert.equal(dashboardAuthority(principal({ capabilities: ['appointment:create', 'client:lookup'] })), null);
});

test('Reception Dashboard access still requires canonical appointment:view permission', () => {
  const p = principal();
  p.permissions['appointment:view'] = false;
  assert.equal(dashboardAuthority(p), null);
});

test('owner/business-admin finalization semantics remain available', () => {
  const authority = dashboardAuthority(principal({ businessRole: 'business_admin' }));
  assert.equal(authority.mode, 'owner_overview');
  assert.equal(authority.canFinalize, true);
});
