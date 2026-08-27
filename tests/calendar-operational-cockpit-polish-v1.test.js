const test = require('node:test');
const assert = require('node:assert/strict');

const {
  renderCalendarPage,
  renderEventCard,
  renderOperationalActions,
} = require('../src/presentation/calendarReadOnlyUx');
const { bookingOperationalActions } = require('../src/routes/calendarReadOnlyUx');

function model(view = 'day') {
  const appointment = {
    id: 591,
    kind: 'appointment',
    canonical: true,
    source: 'appointments',
    status: 'scheduled',
    startsAt: '2026-08-27T06:00:00.000Z',
    endsAt: '2026-08-27T06:45:00.000Z',
    staffIds: [1],
    staff: [{ staffId: 1, nameSnapshot: 'Abigail' }],
  };
  return {
    view,
    dateKey: '2026-08-27',
    selectedStaffId: null,
    permittedStaff: [{ id: 1, displayName: 'Abigail' }],
    period: {
      startKey: '2026-08-27',
      previousAnchor: '2026-08-26',
      nextAnchor: view === 'day' ? '2026-08-28' : '2026-09-03',
      dateKeys: view === 'day'
        ? ['2026-08-27']
        : ['2026-08-27','2026-08-28','2026-08-29','2026-08-30','2026-08-31','2026-09-01','2026-09-02'],
    },
    timeline: {
      staff: [{ id: 1, displayName: 'Abigail' }],
      workingWindows: [{ staffId: 1, dayOfWeek: 4, startsLocal: '08:00:00', endsLocal: '17:00:00' }],
      scheduleExceptions: [],
      recurringClosures: [],
      closures: [],
      appointments: [appointment],
      blocks: [],
      leave: [],
      externalBusy: [],
      events: [appointment],
    },
  };
}

test('Calendar cockpit renders canonical booking entry and scan metrics without changing timeline truth', () => {
  const html = renderCalendarPage(model(), {
    operationalActions: bookingOperationalActions('2026-08-27'),
  });
  assert.match(html, /aria-label="Calendar actions"/);
  assert.match(html, /class="action-link primary" href="\/calendar\/book\?date=2026-08-27">Create booking/);
  assert.doesNotMatch(html, /Confirm client contact/);
  assert.match(html, /aria-label="Visible period summary"/);
  assert.match(html, /<strong>1<\/strong><span>Appointments<\/span>/);
  assert.match(html, /<strong>0<\/strong><span>Blocks \+ leave<\/span>/);
  assert.match(html, /data-event-id="appointment-591"/);
  assert.match(html, /Shiloh truth/);
  assert.doesNotMatch(html, /client(?:_id| name| mobile)|phone|recipient/i, 'cockpit summary must not introduce client PII');
});

test('Calendar cockpit invents no operational action for read-only viewers', () => {
  const html = renderCalendarPage(model());
  assert.doesNotMatch(html, /aria-label="Calendar actions"/);
  assert.match(html, /Read-only operational view/);
});

test('Google-only busy remains visibly non-canonical without internal implementation language', () => {
  const html = renderEventCard({
    id: 'g1', kind: 'external_busy', canonical: false, source: 'google_calendar',
    summary: 'Busy', startsAt: '2026-08-27T07:00:00.000Z', endsAt: '2026-08-27T07:30:00.000Z', staffIds: [1],
  }, model());
  assert.match(html, /Google busy • non-canonical/);
  assert.doesNotMatch(html, /PR #395/);
  assert.match(html, /data-canonical="false"/);
});

test('operational action renderer escapes labels and hrefs', () => {
  const html = renderOperationalActions([{ label: '<Book>', href: '/calendar/book?a=1&b=2', tone: 'primary' }]);
  assert.match(html, /&lt;Book&gt;/);
  assert.match(html, /a=1&amp;b=2/);
});

test('cockpit action contract exposes only the #505 guarded booking entry', () => {
  assert.deepEqual(bookingOperationalActions('2026-08-27'), [
    { label: 'Create booking', href: '/calendar/book?date=2026-08-27', tone: 'primary' },
  ]);
});

test('main Calendar narrow-screen contract provides touch targets, sticky controls and one-day week scanning', () => {
  const html = renderCalendarPage(model('week'));
  assert.match(html, /@media\(max-width:700px\)/);
  assert.match(html, /\.action-link,.signout-button\{min-height:44px/);
  assert.match(html, /\.nav-button,\.view-tab,\.filter,\.scope-pill\{min-height:44px/);
  assert.match(html, /\.controls\{position:sticky/);
  assert.match(html, /minmax\(82vw,1fr\)/);
  assert.match(html, /scroll-snap-type:x proximity/);
});
