'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  dateGroupLabel,
  renderDashboardPage,
} = require('../src/presentation/workspaceDashboardUx');

function model() {
  return {
    requestedDateKey: '2026-09-11',
    operationalDateKey: '2026-09-11',
    displayName: 'Jean-Pierre',
    mode: 'owner_overview',
    canFinalizeAllBusiness: true,
    calendar: {
      timeline: {
        staff: [{ id: 11, displayName: 'Abigail' }],
        appointments: [],
        closures: [],
      },
    },
    closures: [],
    appointments: [],
    teamGroups: [],
    awaitingFinalization: [],
    bookingRequests: [],
    recentActivity: [],
    communications: null,
    communicationsUnavailable: false,
    carryOver: [
      {
        id: 601,
        startsAt: '2026-09-09T06:00:00.000Z',
        endsAt: '2026-09-09T07:00:00.000Z',
        status: 'confirmed',
        revision: '2026-09-09T05:00:00.000Z',
        clientName: 'Wednesday Client',
        serviceName: 'Lymphatic Drainage',
        staffIds: [11],
        staff: [{ staffId: 11, nameSnapshot: 'Abigail' }],
        operationalDateKey: '2026-09-09',
        canFinalize: true,
      },
      {
        id: 602,
        startsAt: '2026-09-10T08:00:00.000Z',
        endsAt: '2026-09-10T09:00:00.000Z',
        status: 'confirmed',
        revision: '2026-09-10T07:00:00.000Z',
        clientName: 'Thursday Client',
        serviceName: 'Full Body Swedish',
        staffIds: [11],
        staff: [{ staffId: 11, nameSnapshot: 'Abigail' }],
        operationalDateKey: '2026-09-10',
        canFinalize: true,
      },
    ],
  };
}

test('#854 formats backlog date groups for human scanning', () => {
  assert.equal(dateGroupLabel('2026-09-09'), 'Wed, 09 Sep');
  assert.equal(dateGroupLabel('2026-09-10'), 'Thu, 10 Sep');
});

test('#854 renders bounded Desktop backlog and balanced secondary layout without changing finalization controls', () => {
  const html = renderDashboardPage(model());

  assert.match(html, /class="panel carryover-panel" data-dashboard-carryover-panel/);
  assert.match(html, /data-dashboard-carryover-scroll/);
  assert.match(html, /class="secondary-grid" data-dashboard-secondary-grid/);
  assert.match(html, /<h3>Wed, 09 Sep<\/h3>/);
  assert.match(html, /<h3>Thu, 10 Sep<\/h3>/);
  assert.match(html, /class="appointment carryover-card"/);
  assert.match(html, /data-dashboard-finalize="completed"/);
  assert.match(html, /data-dashboard-finalize="no_show"/);
  assert.match(html, /data-operational-date-key="2026-09-09"/);
  assert.match(html, /date=2026-09-09/);

  assert.match(html, /\.carryover-panel\{position:sticky;top:16px;max-height:calc\(100vh - 32px\)/);
  assert.match(html, /@media\(max-width:850px\)[\s\S]*\.carryover-panel\{position:static;max-height:none;overflow:visible\}/);
  assert.match(html, /\.carryover-group \.appointment-actions \.action-button,\.carryover-group \.appointment-actions \.button\{min-height:44px\}/);
});
