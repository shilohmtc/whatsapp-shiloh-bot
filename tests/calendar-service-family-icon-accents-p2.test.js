const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const {
  SERVICE_FAMILIES,
  SERVICE_FAMILY_ACCENTS,
  renderServiceFamilyIcon,
  serviceFamilyAccentCss,
} = require('../src/presentation/calendarServiceFamilyVisuals');
const { renderCalendarCreateBookingPage } = require('../src/presentation/calendarCreateBookingUx');
const { renderCalendarPage } = require('../src/presentation/calendarReadOnlyUx');

const EXPECTED_ACCENTS = Object.freeze({
  facial_skin: '#8A6518',
  foot_pedicure: '#9A503C',
  targeted_therapeutic: '#3F6653',
  massage_body: '#3F6785',
  permanent_makeup_beauty: '#80506E',
});

const BASE_GEOMETRY_HASHES = Object.freeze({
  facial_skin: '4aaee07922407c2d6e2d1010e3fd1e2b5ec5625732f5855a37b0ff501d2d5b3d',
  foot_pedicure: '49e795135b26d26380bfb82bb5f7623fc04641fc7d5b10484f983998d16c566b',
  targeted_therapeutic: '273e136d70c6043f85a420557242c4709e53436cc346939735b1ab5f7696b38b',
  massage_body: '62ffaef4abefcb695882d7d7c32b16ad04468af48aa4e498524eb918ae1eb81a',
  permanent_makeup_beauty: '1ce334ccce9098aa8f06062386befcef01ce77c427184d7554f0b3ab6a8742e7',
});

const FAMILY_FIXTURES = Object.freeze([
  {
    key: 'targeted_therapeutic', name: 'Bamboo Sports Massage - Area Specific', categoryName: 'Massage',
    externalSource: 'goldie', externalId: '6a0c9c5e-d7e7-4a82-8795-e8281a0bd526',
  },
  { key: 'facial_skin', name: 'Brightening Facial (Pigmentation)', categoryName: 'Facials' },
  { key: 'foot_pedicure', name: 'Medi-Heel Pedicure (No Gel Toes) & Foot Massage', categoryName: 'Pedicures & Foot Care' },
  { key: 'massage_body', name: 'Aromatherapy Massage', categoryName: 'Massage' },
  { key: 'permanent_makeup_beauty', name: 'Ombré Brows', categoryName: 'Permanent Makeup' },
]);

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const values = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  return (0.2126 * channel(values[0])) + (0.7152 * channel(values[1])) + (0.0722 * channel(values[2]));
}

function contrast(a, b) {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function model(view) {
  const dateKeys = ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'];
  const appointments = FAMILY_FIXTURES.map((fixture, index) => ({
    id: 8100 + index,
    kind: 'appointment',
    canonical: true,
    source: 'appointments',
    status: index % 2 ? 'confirmed' : 'scheduled',
    clientName: `Synthetic Client ${index + 1}`,
    serviceName: fixture.name,
    serviceContexts: [fixture],
    startsAt: `2026-08-31T${String(6 + index).padStart(2, '0')}:00:00.000Z`,
    endsAt: `2026-08-31T${String(7 + index).padStart(2, '0')}:00:00.000Z`,
    staffIds: [1],
    staff: [{ staffId: 1, nameSnapshot: 'Christel' }],
  }));
  return {
    view,
    dateKey: dateKeys[0],
    selectedStaffId: null,
    permittedStaff: [{ id: 1, displayName: 'Christel' }],
    period: {
      startKey: dateKeys[0], previousAnchor: '2026-08-24', nextAnchor: '2026-09-07',
      dateKeys: view === 'day' ? [dateKeys[0]] : dateKeys,
    },
    timeline: {
      staff: [{ id: 1, displayName: 'Christel' }],
      workingWindows: [{ staffId: 1, dayOfWeek: 1, startsLocal: '08:00:00', endsLocal: '17:00:00' }],
      scheduleExceptions: [], recurringClosures: [], closures: [], leave: [], blocks: [],
      appointments, events: appointments,
    },
  };
}

test('the exact five restrained accents are centralized and scoped to SVG icon color only', () => {
  assert.deepEqual(Object.keys(SERVICE_FAMILIES), Object.keys(EXPECTED_ACCENTS));
  assert.deepEqual(SERVICE_FAMILY_ACCENTS, EXPECTED_ACCENTS);
  const css = serviceFamilyAccentCss();
  assert.equal((css.match(/\.service-family-icon\[data-service-family=/g) || []).length, 5);
  for (const [familyKey, color] of Object.entries(EXPECTED_ACCENTS)) {
    assert.match(css, new RegExp(`\\.service-family-icon\\[data-service-family="${familyKey}"\\]\\{color:${color}\\}`));
  }
  assert.doesNotMatch(css, /background|border|fill|stroke|font|text-shadow/i);
});

test('all five icon accents exceed non-text contrast requirements on every current Calendar surface', () => {
  const surfaces = ['#FFFFFF', '#FFFDF9', '#F4F3ED', '#E7EEE9', '#FAFBF8'];
  for (const [familyKey, color] of Object.entries(EXPECTED_ACCENTS)) {
    for (const surface of surfaces) {
      assert.ok(contrast(color, surface) >= 3, `${familyKey} ${color} against ${surface}`);
    }
  }
});

test('the five existing decorative SVG geometries and currentColor contract are byte-stable', () => {
  for (const familyKey of Object.keys(EXPECTED_ACCENTS)) {
    const markup = renderServiceFamilyIcon(familyKey);
    const hash = crypto.createHash('sha256').update(markup).digest('hex');
    assert.equal(hash, BASE_GEOMETRY_HASHES[familyKey], familyKey);
    assert.match(markup, /aria-hidden="true" focusable="false" fill="none" stroke="currentColor"/);
    assert.doesNotMatch(markup, /style=|#[0-9A-Fa-f]{6}/);
  }
});

test('Create Booking keeps native treatment and #546 time controls while selected treatment and Review share the icon accent', () => {
  const treatment = FAMILY_FIXTURES[0];
  const html = renderCalendarCreateBookingPage({
    date: '2026-08-31',
    options: {
      staff: [{ id: 1, displayName: 'Christel', serviceIds: [33] }],
      services: [{ id: 33, ...treatment, staffIds: [1] }],
    },
  });
  assert.match(html, /<select id="service-select">/);
  assert.doesNotMatch(html, /role="combobox"|listbox/);
  assert.match(html, /<input id="booking-time" type="time" step="300" required>/);
  assert.match(html, /data-selected-start[^>]+aria-live="polite"/);
  assert.match(html, /\.service-family-icon\[data-service-family="targeted_therapeutic"\]\{color:#3F6653\}/);
  assert.match(html, /"serviceFamily":\{"key":"targeted_therapeutic"/);
  assert.match(html, /<h2>Review booking<\/h2>/);
  assert.match(html, /Choose the client, treatment, practitioner and time\./);
});

test('Day, Week and Agenda retain visible service text while all five families use icon-only accents', () => {
  for (const view of ['day', 'week', 'agenda']) {
    const html = renderCalendarPage(model(view));
    for (const fixture of FAMILY_FIXTURES) {
      assert.match(html, new RegExp(`data-service-family="${fixture.key}"`));
      const escapedName = fixture.name.replace(/&/g, '&amp;');
      assert.match(html, new RegExp(escapedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(html, /\.event-card\{border:1px solid var\(--line\);border-left:4px solid var\(--leaf\)/);
    assert.match(html, /\.event-card\.event-shared\{border-left-color:var\(--clay\)\}/);
    assert.match(html, /\.status-dot\.off\{background:#b79886\}/);
  }
});
