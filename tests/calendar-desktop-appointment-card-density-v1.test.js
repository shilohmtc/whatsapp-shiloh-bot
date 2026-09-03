const test = require('node:test');
const assert = require('node:assert/strict');

const {
  desktopAppointmentCardDensityCss,
} = require('../src/presentation/calendarServiceFamilyVisuals');
const {
  workspaceShellStyles,
} = require('../src/presentation/workspaceShell');
const {
  renderEventCard,
} = require('../src/presentation/calendarReadOnlyUx');

function appointment(overrides = {}) {
  return {
    id: 7201,
    kind: 'appointment',
    canonical: true,
    revision: 'rev-7201',
    status: 'scheduled',
    clientName: 'Desktop Client',
    clientMobile: '27821234567',
    serviceName: 'Full Body Swedish',
    startsAt: '2026-09-03T08:00:00.000Z',
    endsAt: '2026-09-03T09:30:00.000Z',
    staffIds: [12],
    staff: [{ staffId: 12, nameSnapshot: 'Christel' }],
    serviceContexts: [{ serviceId: 33, categoryName: 'Massage' }],
    ...overrides,
  };
}

function model(item = appointment()) {
  return {
    permittedStaff: [{ id: 12, displayName: 'Christel' }],
    mutationCapability: {
      enabled: true,
      operations: ['appointment:reschedule', 'appointment:cancel', 'appointment:reassign'],
      calendarScope: 'all_business',
      serviceScope: 'all_services',
      allowedServiceIds: null,
    },
    timeline: { events: [item] },
  };
}

test('Desktop appointment density is a desktop-only container contract', () => {
  const css = desktopAppointmentCardDensityCss();

  assert.match(css, /@media\(min-width:701px\)/);
  assert.match(css, /\.workspace-main \.positioned-event\{container-type:size\}/);
  assert.match(css, /@container \(max-width:260px\)/);
  assert.doesNotMatch(css, /@media\(max-width:700px\)/);
});

test('narrow Desktop appointment cards remove redundant chrome and move Manage out of content flow', () => {
  const css = desktopAppointmentCardDensityCss();

  assert.match(css, /\.event-card\[data-kind="appointment"\] \.kind-pill\{display:none!important\}/);
  assert.match(css, /\.event-card\[data-kind="appointment"\] \.event-card-actions\{top:3px!important;right:3px!important;bottom:auto!important;margin:0!important\}/);
  assert.match(css, /\.event-card\[data-kind="appointment"\] \.event-operation\{min-width:44px!important;min-height:32px!important/);
  assert.doesNotMatch(css, /min-height:44px!important/);
});

test('Desktop density collapses lower-priority detail before client identity and canonical mobile', () => {
  const css = desktopAppointmentCardDensityCss();

  assert.match(css, /@container \(max-width:260px\) and \(max-height:60px\)[\s\S]*?\.event-meta\{display:none!important\}/);
  assert.match(css, /@container \(max-width:260px\) and \(min-height:61px\) and \(max-height:82px\)[\s\S]*?\.event-service-context>span:last-child\{-webkit-line-clamp:1\}/);
  assert.match(css, /@container \(max-width:260px\) and \(min-height:61px\) and \(max-height:82px\)[\s\S]*?\.event-detail-separator\+span\{display:none!important\}/);

  const shortRule = css.match(/@container \(max-width:260px\) and \(max-height:60px\)\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.doesNotMatch(shortRule, /event-client-mobile\{display:none/);
  assert.doesNotMatch(shortRule, / h4\{display:none/);
});

test('accepted Phone appointment-card touch contract remains unchanged', () => {
  const phoneCss = workspaceShellStyles();

  assert.match(phoneCss, /@media\(max-width:700px\)/);
  assert.match(phoneCss, /\.workspace-main \.positioned-event\{container-type:size\}/);
  assert.match(phoneCss, /\.workspace-main \.positioned-event \.event-operation\{min-width:44px!important;min-height:44px!important/);
  assert.match(phoneCss, /@container \(max-height:60px\)[\s\S]*?\.event-card\[data-kind="appointment"\] \.event-meta\{display:none!important\}/);
});

test('Desktop density leaves Manage/detail mutation semantics unchanged', () => {
  const item = appointment();
  const html = renderEventCard(item, model(item));

  assert.match(html, /data-appointment-id="7201"/);
  assert.match(html, /data-revision="rev-7201"/);
  assert.match(html, /data-staff-ids="12"/);
  assert.match(html, /data-client-name="Desktop Client"/);
  assert.match(html, /data-service-name="Full Body Swedish"/);
  assert.match(html, /data-allowed-operations="appointment:reschedule,appointment:cancel,appointment:reassign"/);
  assert.match(html, /data-calendar-operation="manage-appointment">Manage<\/button>/);
  assert.match(html, /08:00–09:30/);
  assert.match(html, /Desktop Client/);
  assert.match(html, /\+27 82 123 4567/);
  assert.match(html, /Full Body Swedish/);
});
