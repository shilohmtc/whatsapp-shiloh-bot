const test = require('node:test');
const assert = require('node:assert/strict');
const { dashboardAuthority, viewerMatchesPrincipal } = require('../src/services/workspaceDashboard');

function principal(overrides = {}) {
  return {
    permissions: { 'booking:update': true },
    calendarAuthority: {
      linkedStaffId: null,
      businessRole: 'booking_operator',
      calendarScope: 'all_business',
      capabilities: ['appointment:view', 'appointment:create', 'client:lookup'],
      ...overrides,
    },
  };
}

test('Reception booking operator with canonical all-business authority receives Dashboard overview without practitioner linkage', () => {
  const authority = dashboardAuthority(principal());
  assert.equal(authority.mode, 'owner_overview');
  assert.equal(authority.linkedStaffId, null);
  assert.equal(authority.canFinalize, false);
  assert.deepEqual(authority.timelineViewer, { calendarScope: 'all_business' });
  assert.equal(viewerMatchesPrincipal({ calendarScope: 'business_all_staff' }, principal()), true);
});

test('Reception Dashboard access still requires appointment:view capability', () => {
  assert.equal(dashboardAuthority(principal({ capabilities: ['appointment:create', 'client:lookup'] })), null);
});

test('owner/business-admin finalization semantics are not changed by Reception coordination', () => {
  const authority = dashboardAuthority(principal({ businessRole: 'business_admin' }));
  assert.equal(authority.mode, 'owner_overview');
  assert.equal(authority.canFinalize, true);
});
