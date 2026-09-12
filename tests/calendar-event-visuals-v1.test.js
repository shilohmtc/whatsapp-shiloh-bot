const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CALENDAR_EVENT_TONES,
  calendarEventTone,
  calendarEventStatusLabel,
  calendarEventToneCss,
} = require('../src/presentation/calendarEventVisuals');
const { renderEventCard, renderCalendarPage } = require('../src/presentation/calendarReadOnlyUx');

test('#920 maps only existing canonical event/request states to semantic tones', () => {
  assert.equal(calendarEventTone({ kind: 'appointment', status: 'confirmed' }), 'scheduled');
  assert.equal(calendarEventTone({ kind: 'appointment', status: 'scheduled', bookingRequestState: 'pending' }), 'attention');
  assert.equal(calendarEventTone({ kind: 'appointment', status: 'scheduled', bookingRequestState: 'awaiting_client_confirmation' }), 'attention');
  assert.equal(calendarEventTone({ kind: 'appointment', status: 'completed' }), 'completed');
  assert.equal(calendarEventTone({ kind: 'appointment', status: 'no_charge' }), 'completed');
  assert.equal(calendarEventTone({ kind: 'appointment', status: 'no_show' }), 'no_show');
  assert.equal(calendarEventTone({ kind: 'calendar_block' }), 'blocked');
  assert.equal(calendarEventTone({ kind: 'operational_leave' }), 'leave');
  assert.equal(calendarEventTone({ kind: 'approved_leave' }), 'leave');
});

test('#920 reserves problem red for no-show/closure and gives leave its own violet tone', () => {
  assert.equal(CALENDAR_EVENT_TONES.no_show.accent, '#A33F3F');
  assert.equal(CALENDAR_EVENT_TONES.closure.accent, '#A33F3F');
  assert.equal(CALENDAR_EVENT_TONES.leave.accent, '#6E568F');
  assert.notEqual(CALENDAR_EVENT_TONES.leave.accent, CALENDAR_EVENT_TONES.no_show.accent);
});

test('#920 keeps exceptional appointment state readable without relying on colour', () => {
  const cases = [
    [{ kind: 'appointment', bookingRequestState: 'pending' }, 'Needs attention', 'Needs staff resolution'],
    [{ kind: 'appointment', bookingRequestState: 'awaiting_client_confirmation' }, 'Awaiting client', 'Awaiting client confirmation'],
    [{ kind: 'appointment', status: 'completed' }, 'Completed', 'Completed'],
    [{ kind: 'appointment', status: 'no_show' }, 'No-show', 'No-show'],
  ];
  for (const [item, label, visibleLabel] of cases) {
    assert.equal(calendarEventStatusLabel(item), label);
    const html = renderEventCard({
      id: 1, clientName: 'Synthetic Client', serviceName: 'Full Body Swedish',
      startsAt: '2026-09-12T07:00:00.000Z', endsAt: '2026-09-12T08:00:00.000Z', staffIds: [1],
      ...item,
    }, { timeline: { staff: [{ id: 1, displayName: 'Abigail' }] } });
    assert.match(html, new RegExp(`data-event-status-label="${label}"`));
    assert.match(html, new RegExp(visibleLabel));
  }
});

test('#920 blocked time has a pattern cue and all event tones use centralized variables', () => {
  const css = calendarEventToneCss();
  for (const tone of Object.keys(CALENDAR_EVENT_TONES)) {
    assert.match(css, new RegExp(`data-event-tone="${tone}"`));
  }
  assert.match(css, /data-event-tone="blocked"[^}]+repeating-linear-gradient/);
  assert.match(css, /prefers-contrast:more/);
});

test('#920 production Calendar includes the semantic tone layer without changing its model', () => {
  const appointment = {
    id: 920, kind: 'appointment', status: 'no_show', clientName: 'Synthetic Client', serviceName: 'Full Body Swedish',
    serviceContexts: [{ categoryName: 'Massage' }], startsAt: '2026-09-12T07:00:00.000Z', endsAt: '2026-09-12T08:00:00.000Z', staffIds: [1],
  };
  const html = renderCalendarPage({
    view: 'day', dateKey: '2026-09-12', permittedStaff: [{ id: 1, displayName: 'Abigail' }],
    period: { startKey: '2026-09-12', previousAnchor: '2026-09-11', nextAnchor: '2026-09-13', dateKeys: ['2026-09-12'] },
    timeline: {
      staff: [{ id: 1, displayName: 'Abigail' }], workingWindows: [], scheduleExceptions: [], recurringClosures: [], closures: [], leave: [], blocks: [], appointments: [appointment], events: [appointment],
    },
  });
  assert.match(html, /data-event-tone="no_show"/);
  assert.match(html, /data-service-family="massage_body"/);
  assert.match(html, /Full Body Swedish/);
  assert.doesNotMatch(html, /checked_in/);
});
