const test = require('node:test');
const assert = require('node:assert/strict');

const {
  attachCanonicalClientMobiles,
} = require('../src/services/calendarReadOnlyUx');
const {
  formatClientMobile,
  renderCalendarPage,
  renderEventCard,
} = require('../src/presentation/calendarReadOnlyUx');

function baseAppointment(overrides = {}) {
  return {
    id: 7001,
    kind: 'appointment',
    canonical: true,
    source: 'appointments',
    status: 'scheduled',
    clientName: 'Demo Client',
    clientMobile: '27821234567',
    serviceName: 'Bamboo Sports Massage - Area Specific',
    startsAt: '2026-08-27T06:00:00.000Z',
    endsAt: '2026-08-27T07:00:00.000Z',
    staffIds: [1],
    staff: [{ staffId: 1, nameSnapshot: 'Christel' }],
    ...overrides,
  };
}

function baseModel(appointment = baseAppointment()) {
  return {
    view: 'day',
    dateKey: '2026-08-27',
    selectedStaffId: null,
    permittedStaff: [{ id: 1, displayName: 'Christel' }],
    period: {
      startKey: '2026-08-27',
      previousAnchor: '2026-08-26',
      nextAnchor: '2026-08-28',
      dateKeys: ['2026-08-27'],
    },
    timeline: {
      staff: [{ id: 1, displayName: 'Christel' }],
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

test('Calendar read model projects canonical CRM V2 and legacy mobile authority in one bounded query', async () => {
  const appointments = [baseAppointment({ id: 7001 }), baseAppointment({ id: 7002 }), baseAppointment({ id: 7003 })];
  const timeline = { appointments, events: [...appointments] };
  let calls = 0;

  const enriched = await attachCanonicalClientMobiles(timeline, async (sql, params) => {
    calls += 1;
    assert.match(sql, /a\.crm_v2_client_id IS NOT NULL THEN v2\.normalized_mobile/);
    assert.match(sql, /LEFT JOIN crm_v2_clients v2 ON v2\.id=a\.crm_v2_client_id/);
    assert.match(sql, /FROM client_contacts cc/);
    assert.match(sql, /cc\.client_id=a\.client_id/);
    assert.match(sql, /cc\.contact_type IN \('mobile','whatsapp'\)/);
    assert.match(sql, /ORDER BY cc\.is_primary DESC/);
    assert.match(sql, /cc\.normalized_value AS mobile/);
    assert.doesNotMatch(sql, /snapshot/i);
    assert.deepEqual(params, [['7001', '7002', '7003']]);
    return {
      rows: [
        { appointment_id: '7001', client_mobile: '27821234567' },
        { appointment_id: '7002', client_mobile: '27837654321' },
        { appointment_id: '7003', client_mobile: null },
      ],
    };
  });

  assert.equal(calls, 1);
  assert.deepEqual(enriched.appointments.map(item => item.clientMobile), [
    '27821234567',
    '27837654321',
    null,
  ]);
  assert.deepEqual(enriched.events.map(item => item.clientMobile), [
    '27821234567',
    '27837654321',
    null,
  ]);
});

test('Calendar appointment card hierarchy is time, client, canonical mobile, then treatment', () => {
  const html = renderEventCard(baseAppointment(), baseModel());
  const positions = [
    html.indexOf('08:00–09:00'),
    html.indexOf('Demo Client'),
    html.indexOf('+27 82 123 4567'),
    html.indexOf('Bamboo Sports Massage - Area Specific'),
  ];

  assert.ok(positions.every(position => position >= 0), 'all hierarchy fields should render');
  assert.ok(positions[0] < positions[1]);
  assert.ok(positions[1] < positions[2]);
  assert.ok(positions[2] < positions[3]);
});

test('Calendar appointment card uses the Workspace no-mobile convention', () => {
  assert.equal(formatClientMobile('27821234567'), '+27 82 123 4567');
  assert.equal(formatClientMobile(null), 'Contact unavailable');
  assert.equal(formatClientMobile('not-a-canonical-mobile'), 'Contact unavailable');

  const html = renderEventCard(baseAppointment({ clientMobile: null }), baseModel());
  assert.match(html, /class="event-client-mobile">Contact unavailable<\/p>/);
});

test('Manage appointment contract remains unchanged while mobile stays presentation-only', () => {
  const appointment = baseAppointment();
  const model = baseModel(appointment);
  model.mutationCapability = {
    enabled: true,
    operations: ['appointment:reschedule'],
    calendarScope: 'all_business',
    serviceScope: 'all_services',
    allowedServiceIds: null,
  };

  const html = renderEventCard(appointment, model);
  assert.match(html, /data-client-name="Demo Client"/);
  assert.match(html, /data-service-name="Bamboo Sports Massage - Area Specific"/);
  assert.match(html, /data-allowed-operations="appointment:reschedule"/);
  assert.match(html, /data-calendar-operation="manage-appointment">Manage<\/button>/);
  assert.doesNotMatch(html, /data-(?:client-)?mobile=/);
});

test('mobile hierarchy remains present inside existing narrow-screen Calendar contract', () => {
  const html = renderCalendarPage(baseModel());
  assert.match(html, /class="event-client-mobile">\+27 82 123 4567<\/p>/);
  assert.match(html, /@media\(max-width:700px\)/);
  assert.match(html, /\.event-card\{padding:10px;min-height:44px\}/);
  assert.match(html, /\.positioned-event \.event-card p\{font-size:\.68rem;padding-right:48px\}/);
});
