const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const { createCalendarReadOnlyUxService } = require('../src/services/calendarReadOnlyUx');
const {
  renderCalendarPage,
  desktopSpatialLaneStyles,
} = require('../src/presentation/calendarReadOnlyUx');
const { applyCalendarResponsivePolish } = require('../src/routes/calendarReadOnlyUx');
const { staffCalendarAccessClientScript } = require('../src/presentation/staffCalendarAccessUx');

const STAFF = [
  { id: 11, displayName: 'North Room', schedulingType: 'regular' },
  { id: 12, displayName: 'Garden Room', schedulingType: 'regular' },
  { id: 13, displayName: 'Studio Room', schedulingType: 'regular' },
  { id: 14, displayName: 'Courtyard Room', schedulingType: 'regular' },
];

function appointment(id, staffIds, clientName, startsAt = '2026-09-07T07:00:00.000Z') {
  return {
    id, kind: 'appointment', canonical: true, revision: `rev-${id}`, status: 'scheduled',
    clientName, clientMobile: '27821234567', serviceName: 'Synthetic treatment',
    startsAt, endsAt: new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString(),
    staffIds,
    staff: staffIds.map(staffId => ({ staffId, nameSnapshot: STAFF.find(person => person.id === staffId)?.displayName })),
    serviceContexts: [{ serviceId: 91, categoryName: 'Massage' }],
  };
}

function timelineFixture() {
  const appointments = [
    appointment(8101, [11], 'Lane Eleven Client', '2026-09-07T06:00:00.000Z'),
    appointment(8102, [12], 'Lane Twelve Client', '2026-09-07T07:00:00.000Z'),
    appointment(8103, [12, 13], 'Shared Canonical Client', '2026-09-07T08:00:00.000Z'),
    appointment(8104, [14], 'Lane Fourteen Client', '2026-09-07T09:00:00.000Z'),
  ];
  return {
    staff: STAFF,
    workingWindows: STAFF.map(person => ({ staffId: person.id, dayOfWeek: 1, startsLocal: '08:00:00', endsLocal: '17:00:00' })),
    scheduleExceptions: [], recurringClosures: [], closures: [], blocks: [], leave: [], externalBusy: [],
    appointments, events: appointments,
  };
}

function modelFor(timeline, visibleStaffIds, extra = {}) {
  const visible = new Set(visibleStaffIds);
  const appointments = timeline.appointments.filter(item => item.staffIds.some(id => visible.has(id)));
  return {
    view: 'day', dateKey: '2026-09-07', visibleStaffIds,
    selectedStaffId: visibleStaffIds.length === 1 ? visibleStaffIds[0] : null,
    visibleStaffSelectionExplicit: true,
    permittedStaff: STAFF,
    period: { startKey: '2026-09-07', previousAnchor: '2026-09-06', nextAnchor: '2026-09-08', dateKeys: ['2026-09-07'] },
    timeline: {
      ...timeline,
      staff: STAFF.filter(person => visible.has(person.id)),
      workingWindows: timeline.workingWindows.filter(item => visible.has(item.staffId)),
      appointments,
      events: appointments,
    },
    mutationCapability: { enabled: false },
    ...extra,
  };
}

async function build(staff) {
  const service = createCalendarReadOnlyUxService({
    listTimeline: async () => timelineFixture(),
    query: async () => ({ rows: [] }),
  });
  return service.buildModel({
    view: 'day', date: '2026-09-07', staff,
    viewer: { staffId: 99, calendarScope: 'all_business' },
  });
}

test('implicit Desktop state focuses the first server-permitted lane while retaining the permitted Phone overview source', async () => {
  const model = await build(undefined);

  assert.deepEqual(model.visibleStaffIds, [11]);
  assert.equal(model.visibleStaffSelectionExplicit, false);
  assert.deepEqual(model.timeline.staff.map(person => person.id), [11]);
  assert.deepEqual(model.timeline.appointments.map(item => item.id), [8101]);
  assert.deepEqual(model.authorizedTimeline.staff.map(person => person.id), [11, 12, 13, 14]);
});

test('multi-lane selection is intersected with SchedulingTimeline permission and filters every comparison collection', async () => {
  const model = await build(['12', '14']);

  assert.deepEqual(model.visibleStaffIds, [12, 14]);
  assert.deepEqual(model.timeline.staff.map(person => person.id), [12, 14]);
  assert.deepEqual(model.timeline.workingWindows.map(item => item.staffId), [12, 14]);
  assert.deepEqual(model.timeline.appointments.map(item => item.id), [8102, 8103, 8104]);
  assert.equal(model.timeline.appointments.find(item => item.id === 8103).staffIds.length, 2, 'display filtering must not rewrite canonical assignment');

  await assert.rejects(build(['12', '999']), error => error.code === 'CALENDAR_UX_STAFF_FILTER_FORBIDDEN');
  await assert.rejects(build(['12', 'all']), error => error.code === 'CALENDAR_UX_INVALID_STAFF_FILTER');
});

test('compact People control exposes only permitted choices and preserves multi-lane state in navigation', () => {
  const html = renderCalendarPage(modelFor(timelineFixture(), [11, 13]));

  assert.match(html, /data-people-picker/);
  assert.match(html, /<summary><span>People<\/span><strong data-people-selection-summary>2 staff<\/strong><\/summary>/);
  assert.equal((html.match(/input type="checkbox" name="staff"/g) || []).length, 4);
  assert.equal((html.match(/input type="checkbox" name="staff" value="(?:11|13)" checked/g) || []).length, 2);
  assert.match(html, /staff=11&amp;staff=13/);
  assert.match(html, /2 of 4 visible/);
  assert.doesNotMatch(html, /value="999"|Unauthorized Practitioner/);
});

test('two visible practitioners share one aligned time axis and a shared booking is rendered once in its first assigned visible lane', () => {
  const html = renderCalendarPage(modelFor(timelineFixture(), [11, 12]));

  assert.match(html, /data-visible-lane-count="2"/);
  assert.equal((html.match(/class="time-rail"/g) || []).length, 1);
  assert.equal((html.match(/class="lane"/g) || []).length, 2);
  assert.equal((html.match(/data-event-id="appointment-8103"/g) || []).length, 1);
  const laneEleven = html.match(/<section class="lane"[^>]*data-staff-id="11"[\s\S]*?<\/section>/)?.[0] || '';
  const laneTwelve = html.match(/<section class="lane"[^>]*data-staff-id="12"[\s\S]*?<\/section>/)?.[0] || '';
  assert.doesNotMatch(laneEleven, /appointment-8103/);
  assert.match(laneTwelve, /appointment-8103/);
});

test('3+ Desktop lanes keep readable minimum widths, scroll within the canvas and retain sticky headers', () => {
  const css = desktopSpatialLaneStyles();
  const html = renderCalendarPage(modelFor(timelineFixture(), [11, 12, 13, 14]));

  assert.match(html, /data-visible-lane-count="4"/);
  assert.match(css, /@media\(min-width:701px\)/);
  assert.match(css, /\.day-time-grid\{max-height:max\(520px,calc\(100vh - 330px\)\);overscroll-behavior:contain;scrollbar-gutter:stable\}/);
  assert.match(css, /grid-template-columns:repeat\(var\(--lane-count\),minmax\(300px,1fr\)\);min-width:max-content;width:100%/);
  assert.match(css, /\.day-time-grid \.lane\{min-width:300px\}/);
  assert.match(css, /\.day-time-grid \.lane>header\{position:sticky;top:0;z-index:4/);
});

test('right-side management sheet preserves lane markup and canonical mutation attributes', () => {
  const timeline = timelineFixture();
  const model = modelFor(timeline, [11, 12], {
    mutationCapability: {
      enabled: true,
      operations: ['appointment:reschedule', 'appointment:cancel', 'appointment:reassign'],
      calendarScope: 'all_business', serviceScope: 'all_services', allowedServiceIds: null,
    },
  });
  const html = renderCalendarPage(model);

  assert.match(html, /data-visible-lane-count="2"/);
  assert.match(html, /<dialog class="management-panel" data-calendar-management-panel/);
  assert.match(html, /\.management-card\{position:absolute;right:0;top:0/);
  assert.match(html, /data-appointment-id="8101"/);
  assert.match(html, /data-revision="rev-8101"/);
  assert.match(html, /data-calendar-operation="manage-appointment"/);
});

test('Phone default remains the all-permitted card overview instead of compressed Desktop lanes', async () => {
  const model = await build(undefined);
  const html = applyCalendarResponsivePolish(renderCalendarPage(model), model);

  assert.match(html, /data-calendar-mobile-overview="true"/);
  assert.equal((html.match(/class="mobile-staff-card"/g) || []).length, 4);
  assert.match(html, /style="--lane-count:1"/);
  assert.match(html, /\.day-view\.mobile-all-staff-overview \.day-time-grid\{position:absolute!important/);
});

test('People control client enhancement is parseable and prevents an empty canvas submission', () => {
  const script = staffCalendarAccessClientScript();
  assert.doesNotThrow(() => new vm.Script(script));
  assert.match(script, /data-practitioner-visibility-form/);
  assert.match(script, /Keep at least one practitioner visible\./);
  assert.match(script, /installPractitionerVisibility\(\)/);
});
