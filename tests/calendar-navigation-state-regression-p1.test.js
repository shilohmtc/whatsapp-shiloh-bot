const test = require('node:test');
const assert = require('node:assert/strict');

const {
  renderWorkspaceNavigation,
} = require('../src/presentation/workspaceShell');
const {
  desktopApprovedStyles,
  calendarDesktopApprovedClientScript,
} = require('../src/presentation/calendarDesktopApprovedUx');
const {
  renderCalendarCreateBookingPage,
  calendarCreateBookingClientScript,
} = require('../src/presentation/calendarCreateBookingUx');

test('#858 ordinary Workspace Calendar navigation uses canonical no-date Workspace entry', () => {
  const html = renderWorkspaceNavigation({
    active: 'dashboard',
    dashboardHref: '/calendar/dashboard',
    clientsHref: '/calendar/clients',
  });
  assert.match(html, /data-workspace-destination="calendar" href="\/calendar\/workspace"/);
  assert.doesNotMatch(html, /data-workspace-destination="calendar"[^>]*href="[^"]*date=/);

  const explicit = renderWorkspaceNavigation({
    active: 'dashboard',
    calendarHref: '/calendar/workspace?view=day&date=2026-09-09',
  });
  assert.match(explicit, /href="\/calendar\/workspace\?view=day&amp;date=2026-09-09"/);
});

test('#858 Desktop Day lanes fill available middle workspace while preserving the 300px readability floor', () => {
  const css = desktopApprovedStyles();
  assert.match(css, /\.day-time-grid \.lanes\{grid-template-columns:repeat\(var\(--lane-count\),minmax\(300px,1fr\)\)!important;min-width:max-content!important;width:100%!important\}/);
  assert.match(css, /\.day-time-grid \.lane\{min-width:300px!important;width:auto!important\}/);
});

test('#858 Desktop create launcher is an Appointment menu rather than a duplicate New appointment button', () => {
  const script = calendarDesktopApprovedClientScript();
  assert.match(script, /<summary>.*<span>Appointment<\/span><\/summary>/);
  assert.match(script, /Record past appointment/);
  assert.match(script, /New appointment/);
  assert.doesNotMatch(script, /<summary>.*<span>New appointment<\/span><\/summary>/);
});

test('#858 booking Back to Calendar has canonical fallback and preserves exact prior Calendar state through safe same-origin history', () => {
  const html = renderCalendarCreateBookingPage({
    options: { staff: [], services: [] },
    prefill: { date: '2026-09-11', staffId: 42 },
  });
  assert.match(html, /data-back-calendar href="\/calendar\/workspace"/);
  assert.doesNotMatch(html, /data-back-calendar href="\/calendar\/read-only/);

  const script = calendarCreateBookingClientScript();
  assert.match(script, /calendarHistoryReturnAvailable/);
  assert.match(script, /ref\.pathname==='\/calendar\/workspace'/);
  assert.match(script, /ref\.pathname==='\/calendar\/read-only'/);
  assert.match(script, /history\.back\(\)/);
  assert.match(script, /window\.location\.assign\('\/calendar\/workspace\?'/);
});
