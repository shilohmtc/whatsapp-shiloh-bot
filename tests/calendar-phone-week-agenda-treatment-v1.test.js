const test = require('node:test');
const assert = require('node:assert/strict');

const { workspaceShellStyles } = require('../src/presentation/workspaceShell');
const { renderCalendarPage, renderEventCard } = require('../src/presentation/calendarReadOnlyUx');
const { desktopAppointmentCardDensityCss } = require('../src/presentation/calendarServiceFamilyVisuals');
const { staffCalendarAccessClientScript } = require('../src/presentation/staffCalendarAccessUx');

function appointment({ id, clientName, staffId, staffName, startsAt, endsAt, serviceName = 'Full Body Swedish' }) {
  return {
    id,
    kind: 'appointment',
    canonical: true,
    revision: `rev-${id}`,
    status: 'scheduled',
    clientName,
    clientMobile: '27821234567',
    serviceName,
    startsAt,
    endsAt,
    staffIds: [staffId],
    staff: [{ staffId, nameSnapshot: staffName }],
    serviceContexts: [{ serviceId: 33, categoryName: 'Massage' }],
  };
}

function weekModel({ selectedStaffId = null } = {}) {
  const staff = [
    { id: 1, displayName: 'Abigail' },
    { id: 2, displayName: 'ILince' },
  ];
  const appointments = [
    appointment({
      id: 7901,
      clientName: 'Helen',
      staffId: 1,
      staffName: 'Abigail',
      startsAt: '2026-09-11T07:00:00.000Z',
      endsAt: '2026-09-11T08:30:00.000Z',
    }),
    appointment({
      id: 7902,
      clientName: 'Melindi',
      staffId: 2,
      staffName: 'ILince',
      startsAt: '2026-09-11T07:00:00.000Z',
      endsAt: '2026-09-11T08:30:00.000Z',
    }),
    appointment({
      id: 7903,
      clientName: 'Elani Greyling F',
      staffId: 1,
      staffName: 'Abigail',
      startsAt: '2026-09-11T09:00:00.000Z',
      endsAt: '2026-09-11T10:30:00.000Z',
      serviceName: 'Lymphatic Drainage Reset Package',
    }),
  ];
  const visibleAppointments = selectedStaffId == null
    ? appointments
    : appointments.filter(item => item.staffIds.includes(selectedStaffId));
  const visibleStaff = selectedStaffId == null
    ? staff
    : staff.filter(person => person.id === selectedStaffId);

  return {
    view: 'week',
    dateKey: '2026-09-11',
    selectedStaffId,
    permittedStaff: staff,
    period: {
      startKey: '2026-09-07',
      previousAnchor: '2026-08-31',
      nextAnchor: '2026-09-14',
      dateKeys: [
        '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10',
        '2026-09-11', '2026-09-12', '2026-09-13',
      ],
    },
    timeline: {
      staff: visibleStaff,
      workingWindows: [],
      scheduleExceptions: [],
      recurringClosures: [],
      closures: [],
      leave: [],
      externalBusy: [],
      appointments: visibleAppointments,
      blocks: [],
      events: visibleAppointments,
    },
    mutationCapability: { enabled: false },
  };
}

test('Phone Week transforms the existing authorized Week DOM into a vertical day-grouped agenda', () => {
  const css = workspaceShellStyles();

  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /\.workspace-main \.week-view \.time-rail\{display:none!important\}/);
  assert.match(css, /\.workspace-main \.week-view \.week-grid\{display:grid!important;grid-template-columns:minmax\(0,1fr\)!important;min-width:0!important;width:100%!important/);
  assert.match(css, /\.workspace-main \.week-view \.week-day:not\(:has\(\.positioned-event\)\):not\(:has\(\.closure-strip\)\):not\(:has\(\.all-day-row\)\)\{display:none!important\}/);
  assert.match(css, /\.workspace-main \.week-view \.time-column\{position:static!important;height:auto!important;min-height:0!important;background:none!important;padding:8px!important;display:grid!important;gap:7px!important\}/);
  assert.match(css, /\.workspace-main \.week-view \.positioned-event\{position:static!important;top:auto!important;left:auto!important;right:auto!important;width:auto!important;height:auto!important;min-height:0!important;overflow:visible!important;container-type:normal!important\}/);
});

test('Phone Week preserves all permitted appointments from the canonical filtered Week model', () => {
  const html = renderCalendarPage(weekModel(), { clientNavigationAllowed: true });

  assert.match(html, /data-view="week"/);
  assert.match(html, /Helen/);
  assert.match(html, /Melindi/);
  assert.match(html, /Elani Greyling F/);
});

test('selected-practitioner Week scope remains constrained before Phone presentation', () => {
  const html = renderCalendarPage(weekModel({ selectedStaffId: 2 }), { clientNavigationAllowed: true });

  assert.match(html, /Melindi/);
  assert.doesNotMatch(html, /Helen/);
  assert.doesNotMatch(html, /Elani Greyling F/);
});

test('Phone Week appointment cards become auto-height scan cards with a 44px Manage contract', () => {
  const css = workspaceShellStyles();

  assert.match(css, /\.workspace-main \.week-view \.positioned-event \.event-card\{height:auto!important;min-height:0!important;padding:9px 10px!important\}/);
  assert.match(css, /\.workspace-main \.week-view \.positioned-event \.event-meta\{display:flex!important;flex-wrap:wrap!important/);
  assert.match(css, /\.workspace-main \.week-view \.positioned-event \.event-card-actions\{position:static!important;margin-top:7px!important;display:flex!important;align-items:center!important;justify-content:flex-end!important\}/);
  assert.match(css, /\.workspace-main \.week-view \.positioned-event \.event-operation\{min-width:44px!important;min-height:44px!important\}/);
});

test('very short Phone cards keep one treatment line and collapse practitioner/status first', () => {
  const css = workspaceShellStyles();
  const shortRule = css.match(/@container \(max-height:60px\)\{([\s\S]*?)\}@container \(min-height:61px\)/)?.[1] || '';

  assert.match(shortRule, /\.event-meta\{display:block!important/);
  assert.match(shortRule, /\.event-meta>span:not\(\.event-service-context\)\{display:none!important\}/);
  assert.match(shortRule, /\.event-service-context>span:last-child\{display:block!important;min-width:0;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important/);
  assert.doesNotMatch(shortRule, /\.event-meta\{display:none!important\}/);
});

test('Manage/detail data contract remains unchanged for Phone cards', () => {
  const item = appointment({
    id: 7999,
    clientName: 'Julalie',
    staffId: 2,
    staffName: 'ILince',
    startsAt: '2026-09-11T14:00:00.000Z',
    endsAt: '2026-09-11T14:45:00.000Z',
    serviceName: 'Bamboo Sports Massage',
  });
  const model = {
    permittedStaff: [{ id: 2, displayName: 'ILince' }],
    mutationCapability: {
      enabled: true,
      operations: ['appointment:reschedule', 'appointment:cancel', 'appointment:reassign'],
      calendarScope: 'all_business',
      serviceScope: 'all_services',
      allowedServiceIds: null,
    },
    timeline: { events: [item] },
  };
  const html = renderEventCard(item, model);

  assert.match(html, /data-appointment-id="7999"/);
  assert.match(html, /data-revision="rev-7999"/);
  assert.match(html, /data-staff-ids="2"/);
  assert.match(html, /data-client-name="Julalie"/);
  assert.match(html, /data-service-name="Bamboo Sports Massage"/);
  assert.match(html, /data-calendar-operation="manage-appointment">Manage<\/button>/);
  assert.match(html, /Bamboo Sports Massage/);
});

test('Desktop Week overlap and Desktop density remain explicitly desktop-gated', () => {
  const desktopCss = desktopAppointmentCardDensityCss();
  const clientScript = staffCalendarAccessClientScript();

  assert.match(desktopCss, /@media\(min-width:701px\)/);
  assert.match(clientScript, /matchMedia\('\(min-width: 701px\)'\)/);
  assert.match(clientScript, /data-week-overlap-layout/);
});
