const test = require('node:test');
const assert = require('node:assert/strict');

const { renderCalendarPage } = require('../src/presentation/calendarReadOnlyUx');
const {
  renderMobileStaffOverview,
  applyCalendarResponsivePolish,
} = require('../src/routes/calendarReadOnlyUx');

function allStaffModel() {
  const staff = [
    { id: 1, displayName: 'Christel With A Long Display Name' },
    { id: 2, displayName: 'Abigail' },
    { id: 3, displayName: 'Marietjie' },
    { id: 4, displayName: 'Naomi' },
    { id: 5, displayName: 'Jean-Pierre' },
  ];
  const appointments = [
    {
      id: 7001, kind: 'appointment', canonical: true, status: 'confirmed',
      clientName: 'Naledi Mokoena', serviceName: 'Bamboo Sports Massage',
      startsAt: '2026-09-03T06:00:00.000Z', endsAt: '2026-09-03T07:00:00.000Z',
      staffIds: [1], staff: [{ staffId: 1, nameSnapshot: staff[0].displayName }],
    },
    {
      id: 7002, kind: 'appointment', canonical: true, status: 'confirmed',
      clientName: 'Amina Daniels', serviceName: 'Advanced Facial Consultation',
      startsAt: '2026-09-03T07:30:00.000Z', endsAt: '2026-09-03T08:15:00.000Z',
      staffIds: [2], staff: [{ staffId: 2, nameSnapshot: staff[1].displayName }],
    },
    {
      id: 7003, kind: 'appointment', canonical: true, status: 'scheduled',
      clientName: 'Shared Client', serviceName: 'Couples Treatment',
      startsAt: '2026-09-03T09:00:00.000Z', endsAt: '2026-09-03T10:00:00.000Z',
      staffIds: [3, 4], staff: [{ staffId: 3, nameSnapshot: staff[2].displayName }, { staffId: 4, nameSnapshot: staff[3].displayName }],
    },
  ];
  const block = {
    id: 8001, kind: 'calendar_block', canonical: true, blockType: 'admin', title: 'Admin block',
    startsAt: '2026-09-03T08:00:00.000Z', endsAt: '2026-09-03T08:30:00.000Z', staffIds: [5],
  };
  return {
    view: 'day',
    dateKey: '2026-09-03',
    selectedStaffId: null,
    permittedStaff: staff,
    period: {
      startKey: '2026-09-03', previousAnchor: '2026-09-02', nextAnchor: '2026-09-04', dateKeys: ['2026-09-03'],
    },
    timeline: {
      staff,
      workingWindows: staff.map(person => ({ staffId: person.id, dayOfWeek: 4, startsLocal: '08:00:00', endsLocal: '17:00:00' })),
      scheduleExceptions: [], recurringClosures: [], closures: [], leave: [], externalBusy: [],
      appointments, blocks: [block], events: [...appointments, block],
    },
    mutationCapability: { enabled: false },
  };
}

function selectedStaffModel() {
  const model = allStaffModel();
  const selected = model.permittedStaff[2];
  model.selectedStaffId = selected.id;
  model.timeline.staff = [selected];
  model.timeline.workingWindows = model.timeline.workingWindows.filter(item => item.staffId === selected.id);
  model.timeline.appointments = model.timeline.appointments.filter(item => item.staffIds.includes(selected.id));
  model.timeline.blocks = [];
  model.timeline.events = model.timeline.appointments;
  return model;
}

test('phone all-staff day mode renders a compact overview for every permitted practitioner', () => {
  const model = allStaffModel();
  const raw = renderCalendarPage(model, { clientNavigationAllowed: true });
  const html = applyCalendarResponsivePolish(raw, model, '/calendar/read-only');

  assert.match(html, /data-calendar-mobile-overview="true"/);
  assert.match(html, /data-mobile-staff-overview/);
  assert.equal((html.match(/class="mobile-staff-card"/g) || []).length, 5);
  assert.match(html, /Christel With A Long Display Name/);
  assert.match(html, /08:00–17:00/);
  assert.match(html, /08:00 • Naledi Mokoena/);
  assert.match(html, /Bamboo Sports Massage/);
  assert.match(html, /staff=1/);
  assert.match(html, /staff=5/);
  assert.match(html, /\.mobile-staff-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.day-view\.mobile-all-staff-overview \.day-time-grid\{display:none\}/);
  assert.match(html, /body\[data-calendar-mobile-overview="true"\] \.practitioner-control\{display:none\}/);

  // Desktop detail remains in the document; CSS swaps it only at phone width.
  assert.match(html, /class="time-grid day-time-grid"/);
  assert.match(html, /style="--lane-count:5"/);
});

test('selected practitioner keeps one full-width detailed mobile lane and no overview', () => {
  const model = selectedStaffModel();
  const raw = renderCalendarPage(model, { clientNavigationAllowed: true });
  const html = applyCalendarResponsivePolish(raw, model, '/calendar/read-only');

  assert.doesNotMatch(html, /data-calendar-mobile-overview="true"/);
  assert.doesNotMatch(html, /data-mobile-staff-overview/);
  assert.equal((html.match(/class="lane"/g) || []).length, 1);
  assert.match(html, /Marietjie/);
  assert.match(html, /Shared Client/);
  assert.match(html, /\.day-view:not\(\.mobile-all-staff-overview\) \.day-time-grid \.lanes\{grid-template-columns:minmax\(0,1fr\)!important;min-width:0!important;width:100%\}/);
  assert.match(html, /\.day-view:not\(\.mobile-all-staff-overview\) \.day-time-grid \.lane\{min-width:0!important;width:100%;border-right:0\}/);
});

test('mobile overview escapes staff and event text and reuses existing staff filter URLs', () => {
  const model = allStaffModel();
  model.permittedStaff[0].displayName = '<Owner & Practitioner>';
  model.timeline.staff[0].displayName = '<Owner & Practitioner>';
  model.timeline.appointments[0].clientName = '<Client & Co>';
  model.timeline.appointments[0].serviceName = 'Massage & Care';

  const html = renderMobileStaffOverview(model, '/calendar/read-only');
  assert.match(html, /&lt;Owner &amp; Practitioner&gt;/);
  assert.match(html, /&lt;Client &amp; Co&gt;/);
  assert.match(html, /Massage &amp; Care/);
  assert.match(html, /href="\/calendar\/read-only\?view=day&amp;date=2026-09-03&amp;staff=1"/);
  assert.doesNotMatch(html, /<Owner & Practitioner>|<Client & Co>/);
});
