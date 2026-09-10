const test = require('node:test');
const assert = require('node:assert/strict');
const { dashboardAuthority } = require('../src/services/workspaceDashboard');
const { CALENDAR_CAPABILITIES } = require('../src/services/calendarAuthorization');

function receptionPrincipal(overrides = {}) {
  return {
    permissions: {
      'appointment:view': true,
      'booking:update': true,
    },
    calendarAuthority: {
      businessRole: 'booking_operator',
      calendarScope: 'all_business',
      linkedStaffId: null,
      capabilities: [CALENDAR_CAPABILITIES.VIEW],
    },
    ...overrides,
  };
}

test('Reception keeps business overview for booking-request coordination without gaining owner finalization authority', () => {
  const authority = dashboardAuthority(receptionPrincipal());
  assert.ok(authority);
  assert.equal(authority.mode, 'business_overview');
  assert.equal(authority.canFinalize, false);
  assert.deepEqual(authority.timelineViewer, { calendarScope: 'all_business' });
});

test('Reception business overview still requires canonical appointment:view capability and permission', () => {
  const withoutCapability = receptionPrincipal();
  withoutCapability.calendarAuthority.capabilities = [];
  assert.equal(dashboardAuthority(withoutCapability), null);

  const withoutPermission = receptionPrincipal({
    permissions: { 'appointment:view': false, 'booking:update': true },
  });
  assert.equal(dashboardAuthority(withoutPermission), null);
});
