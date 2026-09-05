const test = require('node:test');
const assert = require('node:assert/strict');

const {
  renderCalendarPage,
  renderOperationalActions,
  calendarFirstPhoneStyles,
} = require('../src/presentation/calendarReadOnlyUx');
const { periodFor } = require('../src/services/calendarReadOnlyUx');
const { bookingOperationalActions, applyCalendarResponsivePolish } = require('../src/routes/calendarReadOnlyUx');
const { bookingPrefillFromQuery } = require('../src/routes/calendarCreateBooking');
const {
  renderCalendarCreateBookingPage,
  calendarCreateBookingClientScript,
} = require('../src/presentation/calendarCreateBookingUx');

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
    staff: staffIds.map(staffId => ({ staffId, nameSnapshot: STAFF.find(person => person.id === staffId)?.displayName })),
  };
}

function model(view = 'day', visibleStaffIds = [31], mutationEnabled = true) {
  const visible = new Set(visibleStaffIds);
  const appointments = [
    appointment(9901, [31], '2026-09-07T06:00:00.000Z', 60, 'Long but readable client name'),
    appointment(9902, [31, 32], '2026-09-11T08:00:00.000Z', 90, 'Shared Client'),
  ].filter(item => item.staffIds.some(id => visible.has(id)));
  return {
    view,
    dateKey: '2026-09-07',
    period: periodFor(view, '2026-09-07'),
    selectedStaffId: visibleStaffIds.length === 1 ? visibleStaffIds[0] : null,
    visibleStaffIds,
    visibleStaffSelectionExplicit: true,
    permittedStaff: STAFF,
    timeline: {
      staff: STAFF.filter(person => visible.has(person.id)),
      workingWindows: STAFF.filter(person => visible.has(person.id)).flatMap(person => [1, 2, 3, 4, 5, 6].map(dayOfWeek => ({ staffId: person.id, dayOfWeek, startsLocal: '08:00:00', endsLocal: '17:00:00' }))),
      scheduleExceptions: [], recurringClosures: [], closures: [], leave: [], externalBusy: [], blocks: [],
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

function render(view, staffIds = [31], bookingEnabled = true) {
  return renderCalendarPage(model(view, staffIds), {
    bookingEnabled,
    bookingPath: '/calendar/book',
    operationalActions: bookingOperationalActions('2026-09-07'),
  });
}

test('Day and Week expose touch-safe empty-time links into the existing Create Booking route', () => {
  const day = render('day', [31]);
  assert.equal((day.match(/data-calendar-booking-slot data-date/g) || []).length, 13);
  assert.match(day, /href="\/calendar\/book\?date=2026-09-07&amp;time=08%3A00&amp;staff=31"/);
  assert.match(day, /data-calendar-booking-hint|Tap an empty time to start an appointment/);

  const week = render('week', [31]);
  assert.equal((week.match(/data-calendar-booking-slot data-date/g) || []).length, 78);
  assert.match(week, /href="\/calendar\/book\?date=2026-09-11&amp;time=10%3A00&amp;staff=31"/);
  assert.doesNotMatch(render('month', [31]), /data-calendar-booking-slot/);
  assert.doesNotMatch(render('day', [31], false), /data-calendar-booking-slot/);
});

test('multi-practitioner calendar slots omit practitioner prefill while preserving selected People in view links', () => {
  const html = render('week', [31, 33]);
  assert.match(html, /data-people-selection-summary>2 staff/);
  assert.match(html, /data-calendar-view-option="day"[^>]*staff=31&amp;staff=33/);
  assert.match(html, /data-calendar-view-option="month"[^>]*staff=31&amp;staff=33/);
  const slotHref = html.match(/data-calendar-booking-slot[^>]*href="([^"]+)"/)?.[1] || '';
  assert.match(slotHref, /date=2026-09-07&amp;time=07%3A00/);
  assert.doesNotMatch(slotHref, /staff=/);

  const day = render('day', [31, 33]);
  assert.match(day, /data-staff-id="31"[\s\S]*?data-calendar-booking-slot[^>]*href="\/calendar\/book\?date=2026-09-07&amp;time=07%3A00&amp;staff=31"/);
  assert.match(day, /data-staff-id="33"[\s\S]*?data-calendar-booking-slot[^>]*href="\/calendar\/book\?date=2026-09-07&amp;time=07%3A00&amp;staff=33"/);
});

test('Phone Week uses an intentional calendar scroller and readable day width instead of six crushed columns', () => {
  const css = calendarFirstPhoneStyles();
  assert.match(css, /week-time-grid\{display:grid!important;grid-template-columns:44px max-content!important;overflow-x:auto!important/);
  assert.match(css, /week-grid\{display:grid!important;grid-template-columns:repeat\(6,220px\)!important;min-width:1320px!important/);
  assert.match(css, /week-day\{[^}]*min-width:220px!important;width:220px!important/);
  assert.match(css, /event-card h4[^}]*white-space:nowrap!important[^}]*overflow-wrap:normal!important;word-break:normal!important/);
  assert.doesNotMatch(render('week'), /grid-template-columns:repeat\(6,minmax\(0,1fr\)\)!important/);
});

test('Phone Calendar keeps Day Week Month primary and Month remains overview navigation only', () => {
  const month = render('month', [31, 33]);
  assert.match(month, /data-calendar-view-option="agenda"/);
  assert.match(month, /data-calendar-view-option="month"/);
  assert.match(month, /class="month-day-link"[^>]*view=day[^>]*staff=31&amp;staff=33/);
  const css = calendarFirstPhoneStyles();
  assert.match(css, /data-calendar-view-option="agenda"[^}]*display:none!important/);
  assert.match(css, /data-calendar-view="month"[^}]*\.month-events[^}]*display:none!important/);
  assert.match(css, /data-calendar-view="month"[^}]*\.view-practitioner-context[^}]*display:none!important/);
});

test('appointment cards remain canonical and the Phone Day and Week card is the Manage target', () => {
  const week = render('week', [31, 32]);
  assert.equal((week.match(/data-event-id="appointment-9902"/g) || []).length, 1);
  assert.match(week, /data-calendar-operation="manage-appointment">Manage<\/button>/);
  const css = calendarFirstPhoneStyles();
  assert.match(css, /data-calendar-view="day"[^}]*\.event-operation[^}]*position:absolute!important;inset:0!important/);
  assert.match(css, /data-calendar-view="week"[^}]*\.event-operation[^}]*min-width:44px!important;min-height:44px!important/);
});

test('canonical Create Booking prefill accepts only operational date, five-minute time and permitted staff', () => {
  const options = { staff: STAFF.slice(0, 2) };
  assert.deepEqual(bookingPrefillFromQuery({ date: '2026-09-07', time: '10:05', staff: '32' }, options), {
    date: '2026-09-07', time: '10:05', staffId: 32,
  });
  assert.deepEqual(bookingPrefillFromQuery({ date: '2026-09-13', time: '10:05', staff: '999' }, options), {
    date: '', time: '', staffId: null,
  });
  assert.deepEqual(bookingPrefillFromQuery({ date: '2026-02-31', time: '10:05', staff: '31' }, options), {
    date: '', time: '', staffId: 31,
  });
  assert.deepEqual(bookingPrefillFromQuery({ date: '2026-09-07', time: '10:03', staff: '999' }, options), {
    date: '2026-09-07', time: '', staffId: null,
  });
});

test('Create Booking renders calendar prefill and selects practitioner only when treatment eligibility permits it', () => {
  const options = {
    staff: STAFF.slice(0, 2),
    services: [{ id: 81, name: 'Synthetic treatment', staffIds: [31] }],
  };
  const page = renderCalendarCreateBookingPage({
    options,
    prefill: { date: '2026-09-07', time: '10:00', staffId: 31 },
  });
  assert.match(page, /id="booking-date"[^>]*value="2026-09-07"/);
  assert.match(page, /id="booking-time"[^>]*value="10:00"/);
  assert.match(page, /data-back-calendar href="\/calendar\/read-only\?view=day&amp;date=2026-09-07&amp;staff=31"/);
  assert.match(page, /"prefill":\{"date":"2026-09-07","time":"10:00","staffId":31\}/);
  const script = calendarCreateBookingClientScript();
  assert.match(script, /permitted\.has\(prefillStaffId\)/);
  assert.match(script, /options\.staff[^;]*returnStaffId/);
});

test('one compact fallback launcher reuses canonical booking authority and mobile overview is retired from runtime', () => {
  const actions = bookingOperationalActions('2026-09-07');
  assert.deepEqual(actions, [{ label: '+ Appointment', ariaLabel: 'Create booking', href: '/calendar/book?date=2026-09-07', tone: 'primary' }]);
  const actionsHtml = renderOperationalActions(actions);
  assert.equal((actionsHtml.match(/class="action-link primary"/g) || []).length, 1);
  assert.match(actionsHtml, /aria-label="Create booking">\+ Appointment/);
  const polished = applyCalendarResponsivePolish(render('day', [31, 32]));
  assert.doesNotMatch(polished, /data-calendar-mobile-overview|mobile-all-staff-overview/);
  assert.match(polished, /class="time-grid day-time-grid"/);
});
