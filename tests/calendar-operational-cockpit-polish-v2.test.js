const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  renderCalendarPage,
  renderEventCard,
  renderOperationalActions,
  eventsForDate,
} = require('../src/presentation/calendarReadOnlyUx');
const { bookingOperationalActions } = require('../src/routes/calendarReadOnlyUx');

function model(view = 'day') {
  const appointment = {
    id: 7001,
    kind: 'appointment',
    canonical: true,
    source: 'appointments',
    status: 'scheduled',
    clientName: 'Demo Client',
    serviceName: 'Bamboo Sports Massage - Area Specific',
    startsAt: '2026-08-27T06:00:00.000Z',
    endsAt: '2026-08-27T07:00:00.000Z',
    staffIds: [1],
    staff: [{ staffId: 1, nameSnapshot: 'Christel' }],
  };
  const block = {
    id: 8001,
    kind: 'calendar_block',
    canonical: true,
    source: 'staff_calendar_blocks',
    blockType: 'admin',
    title: 'Admin block',
    startsAt: '2026-08-27T09:00:00.000Z',
    endsAt: '2026-08-27T09:30:00.000Z',
    staffIds: [2],
  };
  const external = {
    id: 'legacy-google',
    kind: 'external_busy',
    canonical: false,
    source: 'google_calendar',
    summary: 'Legacy external event',
    startsAt: '2026-08-27T10:00:00.000Z',
    endsAt: '2026-08-27T10:30:00.000Z',
    staffIds: [1],
  };
  const dateKeys = ['2026-08-27','2026-08-28','2026-08-29','2026-08-30','2026-08-31','2026-09-01','2026-09-02'];
  return {
    view,
    dateKey: '2026-08-27',
    selectedStaffId: null,
    permittedStaff: [{ id: 1, displayName: 'Christel' }, { id: 2, displayName: 'Abigail' }],
    period: {
      startKey: '2026-08-27',
      previousAnchor: '2026-08-26',
      nextAnchor: view === 'day' ? '2026-08-28' : '2026-09-03',
      dateKeys: view === 'day' ? ['2026-08-27'] : dateKeys,
    },
    timeline: {
      staff: [{ id: 1, displayName: 'Christel' }, { id: 2, displayName: 'Abigail' }],
      workingWindows: [
        { staffId: 1, dayOfWeek: 4, startsLocal: '08:00:00', endsLocal: '17:00:00' },
        { staffId: 2, dayOfWeek: 4, startsLocal: '08:00:00', endsLocal: '17:00:00' },
      ],
      scheduleExceptions: [],
      recurringClosures: [],
      closures: [],
      appointments: [appointment],
      blocks: [block],
      leave: [],
      externalBusy: [],
      events: [appointment, block, external],
    },
  };
}

test('Shiloh-only cockpit renders enriched canonical appointment cards', () => {
  const html = renderCalendarPage(model(), {
    operationalActions: bookingOperationalActions('2026-08-27'),
  });
  assert.match(html, /Demo Client/);
  assert.match(html, /Bamboo Sports Massage - Area Specific/);
  assert.match(html, /08:00–09:00/);
  assert.match(html, /Christel/);
  assert.match(html, /scheduled/);
  assert.match(html, /Appointment #7001/);
  assert.match(html, /class="kind-pill">Appointment/);
  assert.match(html, /Shiloh appointment/);
  assert.doesNotMatch(html, /Legacy external event|Google-only|Non-canonical|PR #395/);
  assert.doesNotMatch(html, /clientMobile|normalized_value|wa\.me|phone/i);
});

test('cockpit exposes labelled controls, scan summary and lane state', () => {
  const html = renderCalendarPage(model());
  assert.match(html, /class="control-label">Date/);
  assert.match(html, /class="control-label">View/);
  assert.match(html, /class="control-label">Practitioner/);
  assert.match(html, /aria-label="Visible period summary"/);
  assert.match(html, /<strong>1<\/strong><span>Appointments<\/span>/);
  assert.match(html, /<strong>1<\/strong><span>Blocks \+ leave<\/span>/);
  assert.match(html, /Shiloh scheduling truth/);
  assert.match(html, /class="lane-count">1 item/);
  assert.match(html, /aria-current="page"/);
});

test('legacy non-canonical events are excluded from day/week/agenda data projection', () => {
  for (const view of ['day', 'week', 'agenda']) {
    const m = model(view);
    const events = eventsForDate(m, '2026-08-27');
    assert.equal(events.some(item => item.canonical === false || item.kind === 'external_busy'), false);
    const html = renderCalendarPage(m);
    assert.doesNotMatch(html, /Legacy external event|google_calendar|external_busy/);
  }
});

test('operational action contract exposes only guarded Create booking', () => {
  assert.deepEqual(bookingOperationalActions('2026-08-27'), [
    { label: 'Create booking', href: '/calendar/book?date=2026-08-27', tone: 'primary' },
  ]);
  const html = renderOperationalActions(bookingOperationalActions('2026-08-27'));
  assert.match(html, /Create booking/);
  assert.doesNotMatch(html, /Confirm client contact|client-authority/);
  const routeSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'calendarReadOnlyUx.js'), 'utf8');
  assert.doesNotMatch(routeSource, /Confirm client contact|\/calendar\/client-authority/);
});

test('narrow-screen contract keeps 44px targets, sticky controls and one-day week scanning', () => {
  const html = renderCalendarPage(model('week'));
  assert.match(html, /@media\(max-width:700px\)/);
  assert.match(html, /\.action-link,.signout-button\{min-height:44px/);
  assert.match(html, /\.nav-button,\.view-tab,\.filter,\.scope-pill\{min-height:44px/);
  assert.match(html, /\.controls\{position:sticky/);
  assert.match(html, /minmax\(82vw,1fr\)/);
  assert.match(html, /scroll-snap-type:x proximity/);
});

test('event card renderer escapes operational fields', () => {
  const html = renderEventCard({
    id: 7002,
    kind: 'appointment',
    canonical: true,
    clientName: '<Client>',
    serviceName: 'Massage & Care',
    status: 'scheduled',
    startsAt: '2026-08-27T06:00:00.000Z',
    endsAt: '2026-08-27T07:00:00.000Z',
    staffIds: [1],
  }, model());
  assert.match(html, /&lt;Client&gt;/);
  assert.match(html, /Massage &amp; Care/);
  assert.doesNotMatch(html, /<Client>/);
});
