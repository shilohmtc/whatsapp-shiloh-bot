const test = require('node:test');
const assert = require('node:assert/strict');

const calendarReadOnlyUx = require('../src/services/calendarReadOnlyUx');
const {
  calendarVisibilityHref,
  renderDesktopPractitionerChips,
  calendarDesktopUsabilityStyles,
  applyCalendarResponsivePolish,
} = require('../src/routes/calendarReadOnlyUx');

function model(overrides = {}) {
  return {
    view: 'week',
    dateKey: '2026-09-11',
    activeStaffId: 2,
    visibleStaffIds: [1, 2, 3],
    selectedStaffId: null,
    permittedStaff: [
      { id: 1, displayName: 'Abigail' },
      { id: 2, displayName: 'Christel' },
      { id: 3, displayName: 'ILince' },
    ],
    timeline: { staff: [
      { id: 1, displayName: 'Abigail' },
      { id: 2, displayName: 'Christel' },
      { id: 3, displayName: 'ILince' },
    ] },
    ...overrides,
  };
}

test('#856 missing Calendar date resolves through canonical Johannesburg today authority while explicit date remains explicit', async () => {
  const calls = [];
  const service = calendarReadOnlyUx.createCalendarReadOnlyUxService({
    listTimeline: async (args) => {
      calls.push(args);
      return {
        staff: [{ id: 1, displayName: 'Abigail' }],
        appointments: [], blocks: [], leave: [], externalBusy: [], closures: [],
        workingWindows: [], scheduleExceptions: [], recurringClosures: [], events: [],
      };
    },
    query: async () => ({ rows: [] }),
    listPublicHolidays: async () => [],
  });
  const viewer = { calendarScope: 'all_business' };
  const now = new Date('2026-09-10T22:30:00.000Z'); // 2026-09-11 00:30 Africa/Johannesburg
  const today = await service.buildModel({ view: 'day', viewer, now });
  assert.equal(today.dateKey, '2026-09-11');
  const explicit = await service.buildModel({ view: 'day', date: '2026-09-09', viewer, now });
  assert.equal(explicit.dateKey, '2026-09-09');
  assert.equal(calls.length, 2);
});

test('#856 All staff uses the canonical all token so future permitted staff join naturally', () => {
  const href = calendarVisibilityHref('/calendar/workspace', model(), 'all');
  const url = new URL(href, 'https://shiloh.example');
  assert.equal(url.pathname, '/calendar/workspace');
  assert.equal(url.searchParams.get('staff'), 'all');
  assert.equal(url.searchParams.get('date'), '2026-09-11');
  assert.equal(url.searchParams.get('view'), 'week');
  assert.equal(url.searchParams.get('activeStaff'), '2');
});

test('#856 Desktop practitioner chips come only from permitted roster and preserve deliberate subset semantics', () => {
  const allHtml = renderDesktopPractitionerChips(model(), '/calendar/workspace');
  assert.match(allHtml, /data-calendar-staff-chip="all"[^>]*aria-current="true"/);
  assert.match(allHtml, />Abigail<.*>Christel<.*>ILince</s);
  assert.doesNotMatch(allHtml, /Naomi/);
  assert.match(allHtml, /staff=all/);

  const subsetHtml = renderDesktopPractitionerChips(model({ visibleStaffIds: [1, 3], timeline: { staff: [{ id: 1 }, { id: 3 }] } }), '/calendar/workspace');
  assert.match(subsetHtml, /data-calendar-staff-chip="1"[^>]*aria-current="true"/);
  assert.match(subsetHtml, /data-calendar-staff-chip="3"[^>]*aria-current="true"/);
  assert.doesNotMatch(subsetHtml, /data-calendar-staff-chip="2"[^>]*aria-current="true"/);
  assert.doesNotMatch(subsetHtml, /data-calendar-staff-chip="all"[^>]*aria-current="true"/);
});

test('#856 Desktop visual simplification constrains wide layouts and prioritizes populated lanes without leaking into Phone', () => {
  const css = calendarDesktopUsabilityStyles();
  assert.match(css, /@media\(min-width:701px\)/);
  assert.match(css, /\.shell\{max-width:1480px!important\}/);
  assert.match(css, /\.day-time-grid \.lanes\{grid-template-columns:repeat\(var\(--lane-count\),minmax\(300px,360px\)\)!important\}/);
  assert.match(css, /\.day-time-grid \.lane:has\(\.positioned-event\)/);
  assert.match(css, /\.week-day:has\(\.positioned-event\)/);
  assert.match(css, /\.time-rail span\{color:#78877f!important/);
  assert.match(css, /\.positioned-event \.event-time\{font-size:\.68rem!important;font-weight:850!important/);
  assert.match(css, /\.positioned-event \.event-card h4\{margin-top:2px!important;font-size:\.8rem!important;font-weight:850!important/);
  assert.match(css, /@media\(max-width:700px\)\{\.desktop-practitioner-chips\{display:none!important\}\}/);
  assert.doesNotMatch(css.slice(css.indexOf('@media(max-width:700px)')), /minmax\(300px,360px\)|max-width:1480px|\.positioned-event \.event-card h4/);
});

test('#856 responsive polish makes active Workspace Calendar a canonical no-date link and keeps Phone picker markup', () => {
  const source = '<html><head><style>.controls{position:sticky;top:0;z-index:5;grid-template-columns:1fr 1fr;</style></head><body><span class="workspace-link active" data-workspace-destination="calendar" aria-current="page">Calendar</span><section class="controls"><div class="control-group practitioner-control"><details class="people-picker"><summary>People</summary></details></div></section></body></html>';
  const html = applyCalendarResponsivePolish(source, model(), '/calendar/workspace');
  assert.match(html, /data-workspace-destination="calendar" aria-current="page" href="\/calendar\/workspace">Calendar<\/a>/);
  assert.doesNotMatch(html, /href="\/calendar\/workspace\?[^\"]*date=/);
  assert.match(html, /data-desktop-practitioner-chips/);
  assert.match(html, /class="control-group practitioner-control"/);
  assert.match(html, /class="people-picker"/);
  assert.match(html, /@media\(max-width:700px\)\{\.desktop-practitioner-chips\{display:none!important\}\}/);
});
