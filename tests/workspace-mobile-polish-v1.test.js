const test = require('node:test');
const assert = require('node:assert/strict');

const {
  workspaceShellStyles,
  renderWorkspaceNavigation,
} = require('../src/presentation/workspaceShell');
const { renderClientListPage } = require('../src/presentation/workspaceClientsUx');
const { renderStaffListPage } = require('../src/presentation/workspaceStaffUx');
const { renderServicesListPage } = require('../src/presentation/workspaceServicesUx');
const { renderCalendarPage } = require('../src/presentation/calendarReadOnlyUx');
const { applyCalendarResponsivePolish } = require('../src/routes/calendarReadOnlyUx');

function calendarModel() {
  return {
    view: 'day',
    dateKey: '2026-09-03',
    selectedStaffId: null,
    permittedStaff: [{ id: 1, displayName: 'Christel' }, { id: 2, displayName: 'Abigail' }],
    period: {
      startKey: '2026-09-03',
      previousAnchor: '2026-09-02',
      nextAnchor: '2026-09-04',
      dateKeys: ['2026-09-03'],
    },
    timeline: {
      staff: [{ id: 1, displayName: 'Christel' }, { id: 2, displayName: 'Abigail' }],
      workingWindows: [], scheduleExceptions: [], recurringClosures: [], closures: [], leave: [],
      appointments: [], blocks: [], events: [],
    },
    mutationCapability: { enabled: false },
  };
}

test('shared Workspace shell has an intentional phone navigation and safe-area layout', () => {
  const css = workspaceShellStyles();
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /\.workspace-nav\{position:fixed;inset:auto 0 0 0/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(css, /\.workspace-link\{min-width:0;min-height:48px/);
  assert.match(css, /\.workspace-secondary-links\{display:none;position:fixed/);
  assert.match(css, /\.workspace-secondary-links\.open\{display:grid/);
  assert.match(css, /body\{overflow-x:hidden\}/);
});

test('mobile polish preserves capability-driven navigation rather than widening access', () => {
  const html = renderWorkspaceNavigation({
    active: 'clients',
    clientsHref: '/calendar/clients',
    calendarHref: null,
    staffHref: null,
    servicesHref: null,
  });
  assert.match(html, /aria-current="page">Clients<\/span>/);
  assert.match(html, /aria-disabled="true" data-workspace-destination="calendar">Calendar<\/span>/);
  assert.match(html, /aria-disabled="true" data-workspace-destination="staff">Staff<\/span>/);
  assert.match(html, /aria-disabled="true" data-workspace-destination="services">Services<\/span>/);
  assert.match(html, /data-workspace-more-toggle>More<\/button>/);
  assert.doesNotMatch(html, /href="\/calendar\/read-only"/);
  assert.doesNotMatch(html, /href="\/calendar\/team"/);
  assert.doesNotMatch(html, /href="\/calendar\/services"/);
});

test('primary Workspace surfaces all inherit the same phone polish without backend changes', () => {
  const pages = [
    renderClientListPage({ clients: [], hasMore: false, offset: 0, pageSize: 24, query: '', status: 'active' }, { calendarNavigationAllowed: true }),
    renderStaffListPage({ staff: [], hasMore: false, offset: 0, pageSize: 30, query: '', status: 'active', manageAllowed: true }, {
      calendarNavigationAllowed: true, clientsNavigationAllowed: true, staffAccessScriptPath: '/calendar/staff/client.js',
    }),
    renderServicesListPage({ services: [], hasMore: false, offset: 0, pageSize: 30, query: '', status: 'active' }, {
      calendarNavigationAllowed: true, clientsNavigationAllowed: true, staffNavigationAllowed: true,
      staffAccessScriptPath: '/calendar/staff/client.js', manageAllowed: true,
    }),
    applyCalendarResponsivePolish(renderCalendarPage(calendarModel(), { clientNavigationAllowed: true })),
  ];

  for (const html of pages) {
    assert.match(html, /<meta name="viewport" content="width=device-width,initial-scale=1">/);
    assert.match(html, /\.workspace-nav\{position:fixed;inset:auto 0 0 0/);
    assert.match(html, /\.workspace-main \.shell\{padding:14px 12px 24px!important\}/);
  }
});

test('Calendar and management controls intentionally collapse for phone use', () => {
  const css = workspaceShellStyles();
  assert.match(css, /\.workspace-main \.controls\{position:static!important;grid-template-columns:1fr!important/);
  assert.match(css, /\.workspace-main \.summary-metrics\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important;min-width:0!important/);
  assert.match(css, /\.workspace-main \.management-card\{top:auto!important;bottom:0!important;height:min\(88vh,760px\)!important;width:100%!important;border-radius:20px 20px 0 0/);
  assert.match(css, /\.workspace-main input,\.workspace-main select,\.workspace-main textarea\{font-size:16px!important\}/);
});

test('Staff list management is moved after the operational list on phones', () => {
  const css = workspaceShellStyles();
  assert.match(css, /main\[data-staff-list-view\]\{display:flex;flex-direction:column\}/);
  assert.match(css, /main\[data-staff-list-view\]>\.filter-panel\{order:1\}/);
  assert.match(css, /main\[data-staff-list-view\]>\.staff-list\{order:3\}/);
  assert.match(css, /main\[data-staff-list-view\]>\.create-panel\{order:5/);
});
