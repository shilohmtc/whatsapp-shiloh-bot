const test = require('node:test');
const assert = require('node:assert/strict');

const {
  SERVICE_FAMILY_ACCENTS,
  SERVICE_FAMILY_CARD_PALETTE,
  serviceFamilyAccentCss,
} = require('../src/presentation/calendarServiceFamilyVisuals');
const {
  calendarEventServiceFamily,
  calendarEventVisualAttributes,
  calendarEventToneCss,
} = require('../src/presentation/calendarEventVisuals');
const { renderEventCard } = require('../src/presentation/calendarReadOnlyUx');

const CASES = [
  ['facial_skin', 'Facials'],
  ['foot_pedicure', 'Pedicures & Foot Care'],
  ['targeted_therapeutic', 'Ozone & Far Infrared'],
  ['massage_body', 'Massage'],
  ['permanent_makeup_beauty', 'Permanent Makeup'],
];

function appointment(categoryName, status = 'scheduled') {
  return {
    id: 924, kind: 'appointment', status, clientName: 'Synthetic Client', serviceName: 'Visible treatment name',
    serviceContexts: [{ categoryName }], startsAt: '2026-09-12T07:00:00.000Z', endsAt: '2026-09-12T08:00:00.000Z', staffIds: [1],
  };
}

test('#924 gives every audited family a distinct restrained card palette', () => {
  assert.deepEqual(Object.keys(SERVICE_FAMILY_CARD_PALETTE), Object.keys(SERVICE_FAMILY_ACCENTS));
  assert.equal(new Set(Object.values(SERVICE_FAMILY_CARD_PALETTE).map(({ surface }) => surface)).size, 5);
  assert.equal(new Set(Object.values(SERVICE_FAMILY_CARD_PALETTE).map(({ border }) => border)).size, 5);
  const css = serviceFamilyAccentCss();
  for (const [familyKey] of CASES) {
    assert.match(css, new RegExp(`data-service-family-card="${familyKey}"[^}]+--calendar-family-surface:`));
  }
});

test('#924 uses the exact existing classifier for the card family', () => {
  for (const [familyKey, categoryName] of CASES) {
    const item = appointment(categoryName);
    assert.equal(calendarEventServiceFamily(item), familyKey);
    assert.match(calendarEventVisualAttributes(item), new RegExp(`data-service-family-card="${familyKey}"`));
  }
  assert.equal(calendarEventServiceFamily({
    ...appointment('Massage'),
    serviceContexts: [{ categoryName: 'Massage' }, { categoryName: 'Facials' }],
  }), null);
});

test('#924 rendered production cards expose family tint and independent status semantics', () => {
  const model = { timeline: { staff: [{ id: 1, displayName: 'Abigail' }] } };
  for (const [familyKey, categoryName] of CASES) {
    const html = renderEventCard(appointment(categoryName, 'completed'), model);
    assert.match(html, new RegExp(`data-service-family-card="${familyKey}"`));
    assert.match(html, /data-event-tone="completed"/);
    assert.match(html, />Completed</);
    assert.match(html, /Visible treatment name/);
  }
});

test('#924 family owns appointment surface while status owns badge and right border', () => {
  const css = calendarEventToneCss();
  assert.match(css, /data-service-family-card[^}]+--calendar-event-surface:var\(--calendar-family-surface\)/);
  assert.match(css, /border-right:3px solid var\(--calendar-status-accent/);
  assert.match(css, /kind-pill[^}]+background:var\(--calendar-status-surface/);
  assert.match(css, /data-event-tone="blocked"[^}]+repeating-linear-gradient/);
});
