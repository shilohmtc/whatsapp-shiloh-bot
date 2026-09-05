const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const {
  renderCalendarPage,
  calendarFirstPhoneStyles,
} = require('../src/presentation/calendarReadOnlyUx');
const { periodFor } = require('../src/services/calendarReadOnlyUx');
const { staffCalendarAccessClientScript } = require('../src/presentation/staffCalendarAccessUx');

const STAFF = [
  { id: 31, displayName: 'Amber Room', schedulingType: 'regular' },
  { id: 32, displayName: 'Birch Room', schedulingType: 'regular' },
  { id: 33, displayName: 'Cedar Room', schedulingType: 'regular' },
];

function appointment(id, staffIds, startsAt, durationMinutes, clientName = `Client ${id}`) {
  return {
    id,
    kind: 'appointment',
    canonical: true,
    revision: `rev-${id}`,
    status: 'scheduled',
    clientName,
    clientMobile: '27821234567',
    serviceName: 'Synthetic treatment',
    serviceContexts: [{ serviceId: 81, categoryName: 'Massage' }],
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + durationMinutes * 60 * 1000).toISOString(),
    staffIds,
    staff: staffIds.map(staffId => ({
      staffId,
      nameSnapshot: STAFF.find(person => person.id === staffId)?.displayName,
    })),
  };
}

function model(view = 'week', visibleStaffIds = STAFF.map(person => person.id), {
  permittedStaff = STAFF,
  includeSundayInCraftedPeriod = false,
  mutationEnabled = false,
} = {}) {
  const visible = new Set(visibleStaffIds);
  const appointments = [
    appointment(9701, [31], '2026-09-07T06:00:00.000Z', 60, 'Short Client'),
    appointment(9702, [31, 32], '2026-09-11T07:00:00.000Z', 120, 'Shared Client'),
    appointment(9703, [33], '2026-09-12T09:00:00.000Z', 45, 'Saturday Client'),
    appointment(9799, [31], '2026-09-13T07:00:00.000Z', 60, 'Crafted Sunday Client'),
  ].filter(item => item.staffIds.some(staffId => visible.has(staffId)));
  const period = periodFor(view, '2026-09-11');
  if (view === 'week' && includeSundayInCraftedPeriod) period.dateKeys = [...period.dateKeys, '2026-09-13'];
  return {
    view,
    dateKey: '2026-09-11',
    period,
    selectedStaffId: visibleStaffIds.length === 1 ? visibleStaffIds[0] : null,
    visibleStaffIds,
    visibleStaffSelectionExplicit: true,
    permittedStaff,
    timeline: {
      staff: STAFF.filter(person => visible.has(person.id)),
      workingWindows: [],
      scheduleExceptions: [],
      recurringClosures: [],
      closures: [],
      leave: [],
      externalBusy: [],
      blocks: [],
      appointments,
      events: appointments,
    },
    mutationCapability: mutationEnabled ? {
      enabled: true,
      operations: ['appointment:reschedule', 'appointment:cancel', 'appointment:reassign'],
      calendarScope: 'all_business',
      serviceScope: 'all_services',
      allowedServiceIds: null,
    } : { enabled: false },
  };
}

function peopleSummary(html) {
  return html.match(/data-people-selection-summary>([^<]+)<\/strong>/)?.[1];
}

test('top People selector truthfully summarizes all, one, and multiple permitted selections', () => {
  assert.equal(peopleSummary(renderCalendarPage(model('week', [31, 32, 33]))), 'All staff');
  assert.equal(peopleSummary(renderCalendarPage(model('week', [32]))), 'Birch Room');
  assert.equal(peopleSummary(renderCalendarPage(model('week', [31, 33]))), '2 staff');
});

test('People summary and controls never disclose a crafted unauthorized practitioner', () => {
  const html = renderCalendarPage(model('week', [31, 999], {
    permittedStaff: [STAFF[0], STAFF[1]],
  }));
  assert.equal(peopleSummary(html), 'Amber Room');
  assert.doesNotMatch(html, /Staff 999|Outside Scope|value="999"/);
});

test('Week retains practitioner context and lane headers while Agenda and Month retain attribution context', () => {
  const week = renderCalendarPage(model('week'));
  assert.match(week, /data-view-practitioner-context|People in view/);
  assert.equal((week.match(/data-week-practitioner-name/g) || []).length, 18);
  assert.match(week, /class="event-practitioners"/);
  for (const view of ['agenda', 'month']) {
    assert.match(renderCalendarPage(model(view)), /data-view-practitioner-context/);
  }
});

test('Week stays Monday-Saturday even when handed a crafted Sunday display key', () => {
  const html = renderCalendarPage(model('week', [31, 32, 33], { includeSundayInCraftedPeriod: true }));
  assert.equal((html.match(/data-week-practitioner-lane/g) || []).length, 18);
  assert.equal(new Set(Array.from(html.matchAll(/data-week-practitioner-lane data-date="([^"]+)"/g), match => match[1])).size, 6);
  assert.match(html, /data-date="2026-09-07"/);
  assert.match(html, /data-date="2026-09-12"/);
  assert.doesNotMatch(html, /data-date="2026-09-13"|Crafted Sunday Client/);
});

test('Week event position and visual height continue to derive from canonical start and duration', () => {
  const html = renderCalendarPage(model('week'));
  assert.match(html, /--event-top:72px;--event-height:69px[\s\S]*?data-event-id="appointment-9701"/);
  assert.match(html, /--event-top:144px;--event-height:141px[\s\S]*?data-event-id="appointment-9702"/);
});

test('shared Week appointments remain one canonical event with compact practitioner attribution', () => {
  const html = renderCalendarPage(model('week'));
  assert.equal((html.match(/data-event-id="appointment-9702"/g) || []).length, 1);
  assert.match(html, /aria-label="Practitioners: Amber Room \+ Birch Room"/);
  assert.match(html, /class="event-practitioner-compact" aria-hidden="true">AR\+BR<\/span>/);
});

test('Day keeps the established practitioner lane model unchanged', () => {
  const html = renderCalendarPage(model('day', [31, 32]));
  assert.match(html, /class="time-grid day-time-grid" data-visible-lane-count="2"/);
  assert.equal((html.match(/class="lane" style="overflow:visible"/g) || []).length, 2);
  assert.doesNotMatch(html, /data-spatial-week/);
});

test('spatial Phone Week reuses the canonical management button as a whole-event target', () => {
  const html = renderCalendarPage(model('week', [31, 32], { mutationEnabled: true }));
  const css = calendarFirstPhoneStyles();
  assert.match(html, /data-calendar-operation="manage-appointment">Manage<\/button>/);
  assert.match(html, /data-calendar-management-panel/);
  assert.match(css, /\.event-operation\{position:absolute!important;inset:0!important/);
  assert.match(css, /min-width:44px!important;min-height:44px!important/);
  assert.match(css, /opacity:0!important;cursor:pointer!important/);
});

test('Week overlap allocation remains one implementation with Phone-specific presentation variables', () => {
  const script = staffCalendarAccessClientScript();
  assert.doesNotThrow(() => new vm.Script(script));
  assert.match(script, /--week-event-left/);
  assert.match(script, /--week-event-width/);
  assert.match(script, /data-week-overlap-layout','phone/);
  assert.match(script, /data-week-overlap-layout','desktop/);
});

test('authenticated browser proof mounts canonical Calendar and Create Booking router factories', () => {
  const source = fs.readFileSync(require.resolve('../scripts/calendar-spatial-phone-week-browser-proof'), 'utf8');
  assert.match(source, /createCalendarReadOnlyRouter\(\{/);
  assert.match(source, /createCalendarCreateBookingRouter\(\{/);
  assert.match(source, /phone-empty-slot-create-booking-prefill/);
  assert.match(source, /phone-week-practitioner-slot-booking-prefill/);
  assert.match(source, /data-week-practitioner-lane/);
  assert.match(source, /phone-month-overview-navigation/);
  assert.doesNotMatch(source, /calendarReadOnlyRoutes\(\{/);
});
