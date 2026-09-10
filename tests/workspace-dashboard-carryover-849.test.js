'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  WorkspaceDashboardError,
  createWorkspaceDashboardService,
  previousClinicDateKey,
  operationalDayWindow,
} = require('../src/services/workspaceDashboard');
const {
  renderDashboardPage,
  dashboardClientScript,
} = require('../src/presentation/workspaceDashboardUx');

const NOW = new Date('2026-09-10T10:00:00.000Z');

function ownerPrincipal() {
  const principal = {
    id: 7,
    staff_id: 11,
    display_name: 'Jean-Pierre',
    business_role: 'owner',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: { 'appointment:view': true, 'booking:update': true },
    admin_active: true,
    staff_status: 'active',
  };
  principal.calendarAuthority = {
    capabilities: ['appointment:view'],
    linkedStaffId: 11,
    businessRole: 'owner',
    calendarScope: 'all_business',
    serviceScope: 'all_services',
  };
  return principal;
}

function item(id, startsAt, endsAt, status = 'confirmed', staffIds = [11]) {
  return {
    id,
    kind: 'appointment',
    canonical: true,
    startsAt,
    endsAt,
    status,
    revision: startsAt,
    clientName: `Client ${id}`,
    serviceName: `Treatment ${id}`,
    staffIds,
  };
}

function day(dateKey, appointments) {
  return {
    dateKey,
    timeline: {
      staff: [
        { id: 11, displayName: 'Abigail' },
        { id: 22, displayName: 'Christel' },
      ],
      appointments,
      closures: [],
    },
  };
}

function messagesService() {
  return {
    async resolveAccess() { return null; },
    async buildModel() { throw new Error('not used'); },
  };
}

test('#849 previous clinic day is yesterday and skips permanently closed Sunday', () => {
  assert.equal(previousClinicDateKey('2026-09-10'), '2026-09-09');
  assert.equal(previousClinicDateKey('2026-09-07'), '2026-09-05');
});

test('#849 Dashboard carries only unresolved previous-clinic-day visits and reuses canonical certification authority', async () => {
  const reads = [];
  const certify = [];
  const today = day('2026-09-10', [
    item(501, '2026-09-10T06:00:00.000Z', '2026-09-10T07:00:00.000Z'),
  ]);
  const yesterday = day('2026-09-09', [
    item(601, '2026-09-09T06:00:00.000Z', '2026-09-09T07:00:00.000Z'),
    item(602, '2026-09-09T08:00:00.000Z', '2026-09-09T09:00:00.000Z', 'completed'),
    item(603, '2026-09-09T10:00:00.000Z', '2026-09-09T11:00:00.000Z', 'no_show'),
    item(604, '2026-09-09T12:00:00.000Z', '2026-09-09T13:00:00.000Z', 'cancelled'),
  ]);
  const service = createWorkspaceDashboardService({
    resolvePrincipal: async () => ownerPrincipal(),
    calendarService: {
      async buildModel(input) {
        reads.push(input);
        return input.date === '2026-09-09' ? yesterday : today;
      },
    },
    messagesService: messagesService(),
    bookingRequestService: { async listUnresolvedBookingRequests() { return []; } },
    finalizeAppointmentFn: async () => ({ status: 'updated' }),
    canCertifyAppointmentFn: async (_principal, appointmentId, _pool, options) => {
      certify.push({ appointmentId, options });
      return Number(appointmentId) !== 501;
    },
  });

  const model = await service.buildModel({
    adminId: 7,
    viewer: { calendarScope: 'business_all_staff' },
    now: NOW,
  });

  assert.deepEqual(reads.map(read => read.date).sort(), ['2026-09-09', '2026-09-10']);
  assert.ok(reads.every(read => read.view === 'day' && read.staff === 'all'));
  assert.ok(reads.every(read => read.viewer.calendarScope === 'all_business'));
  assert.equal(model.carryOverDateKey, '2026-09-09');
  assert.deepEqual(model.carryOver.map(row => row.id), [601]);
  assert.equal(model.carryOver[0].operationalDateKey, '2026-09-09');
  assert.equal(model.carryOver[0].canFinalize, true);
  assert.deepEqual(certify.map(entry => entry.appointmentId).sort((a, b) => a - b), [501, 601]);
  assert.ok(certify.every(entry => entry.options.workspace === true && entry.options.allowBusinessBackup === true));
});

test('#849 carry-over presentation is separate, dated and posts the row date with existing finalization action', () => {
  const model = {
    generatedAt: NOW.toISOString(),
    requestedDateKey: '2026-09-10',
    operationalDateKey: '2026-09-10',
    carryOverDateKey: '2026-09-09',
    displayName: 'Jean-Pierre',
    mode: 'owner_overview',
    calendar: day('2026-09-10', []),
    closures: [],
    appointments: [],
    teamGroups: [],
    awaitingFinalization: [],
    bookingRequests: [],
    recentActivity: [],
    carryOver: [
      { ...item(601, '2026-09-09T06:00:00.000Z', '2026-09-09T07:00:00.000Z'), operationalDateKey: '2026-09-09', canFinalize: true, needsFinalization: true },
    ],
    communications: null,
    communicationsUnavailable: false,
  };
  const html = renderDashboardPage(model);
  assert.match(html, /data-dashboard-carryover-panel/);
  assert.match(html, /Yesterday's to do · 2026-09-09/);
  assert.match(html, /Client 601/);
  assert.match(html, /Treatment 601/);
  assert.match(html, /2026-09-09 · Treatment 601 · Abigail/);
  assert.match(html, /data-operational-date-key="2026-09-09"/);
  assert.match(html, /data-dashboard-finalize="completed"/);
  assert.match(html, /data-dashboard-finalize="no_show"/);
  assert.match(html, /date=2026-09-09/);
  assert.match(dashboardClientScript(), /operationalDateKey:card\.dataset\.operationalDateKey/);
});

test('#849 carry-over row without canonical certification remains visible but has no outcome buttons', () => {
  const model = {
    generatedAt: NOW.toISOString(), requestedDateKey: '2026-09-10', operationalDateKey: '2026-09-10', carryOverDateKey: '2026-09-09',
    displayName: 'Reception', mode: 'business_overview', calendar: day('2026-09-10', []), closures: [], appointments: [], teamGroups: [],
    awaitingFinalization: [], bookingRequests: [], recentActivity: [], communications: null, communicationsUnavailable: false,
    carryOver: [{ ...item(601, '2026-09-09T06:00:00.000Z', '2026-09-09T07:00:00.000Z'), operationalDateKey: '2026-09-09', canFinalize: false, needsFinalization: true }],
  };
  const html = renderDashboardPage(model);
  const match = html.match(/<section class="panel" data-dashboard-carryover-panel>[\s\S]*?<\/section>/);
  assert.ok(match, 'carry-over panel must render');
  const carryPanel = match[0];
  assert.match(carryPanel, /Client 601/);
  assert.doesNotMatch(carryPanel, /data-dashboard-finalize=/);
  assert.match(carryPanel, /Open \/ manage/);
});

test('#849 finalization permits only today or the computed previous clinic day', async () => {
  const calls = [];
  const service = createWorkspaceDashboardService({
    resolvePrincipal: async () => ownerPrincipal(),
    calendarService: { async buildModel() { return day('2026-09-10', []); } },
    messagesService: messagesService(),
    bookingRequestService: { async listUnresolvedBookingRequests() { return []; } },
    canCertifyAppointmentFn: async () => true,
    finalizeAppointmentFn: async (...args) => { calls.push(args); return { status: 'updated' }; },
  });
  const common = {
    adminId: 7,
    viewer: { calendarScope: 'business_all_staff' },
    appointmentId: 601,
    expectedRevision: '2026-09-09T06:00:00.000Z',
    outcome: 'completed',
    now: NOW,
  };
  await service.finalizeVisit({ ...common, operationalDateKey: '2026-09-09' });
  assert.deepEqual(calls[0][3], {
    ...operationalDayWindow('2026-09-09'),
    expectedRevision: '2026-09-09T06:00:00.000Z',
    workspace: true,
    allowBusinessBackup: true,
  });
  await assert.rejects(
    service.finalizeVisit({ ...common, operationalDateKey: '2026-09-08' }),
    error => error instanceof WorkspaceDashboardError && error.httpStatus === 400,
  );
  assert.equal(calls.length, 1);
});
