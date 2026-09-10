'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const {
  WorkspaceDashboardError,
  createWorkspaceDashboardService,
} = require('../src/services/workspaceDashboard');
const { createWorkspaceOperationalRouter } = require('../src/routes/workspaceOperational');
const { createWorkspaceMessagesRouter } = require('../src/routes/workspaceMessages');

const ENABLED_ENV = {
  NODE_ENV: 'test',
  SHILOH_CALENDAR_READONLY_UX_ENABLED: 'true',
  SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED: 'true',
};

function calendarFixture() {
  return {
    dateKey: '2026-09-05',
    timeline: {
      staff: [{ id: 11, displayName: 'Synthetic Practitioner' }],
      appointments: [{
        id: 501,
        kind: 'appointment',
        canonical: true,
        startsAt: '2026-09-05T07:00:00.000Z',
        endsAt: '2026-09-05T08:00:00.000Z',
        status: 'confirmed',
        revision: '2026-09-05T06:30:00.000Z',
        clientName: 'Synthetic Client',
        serviceName: 'Synthetic Treatment',
        staffIds: [11],
      }],
      closures: [],
    },
  };
}

function ownerPrincipal() {
  return {
    id: 7,
    staff_id: 11,
    display_name: 'Synthetic Owner',
    business_role: 'owner',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: { 'appointment:view': true, 'booking:update': true },
    admin_active: true,
    staff_status: 'active',
    calendarAuthority: {
      capabilities: ['appointment:view'],
      linkedStaffId: 11,
      businessRole: 'owner',
      calendarScope: 'all_business',
      serviceScope: 'all_services',
    },
  };
}

async function withServer(app, work) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  try { return await work(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('Dashboard composes canonical all-permitted current/carry-over Calendar days and bounded Messages projections', async () => {
  const calls = [];
  const service = createWorkspaceDashboardService({
    resolvePrincipal: async () => ownerPrincipal(),
    calendarService: {
      async buildModel(input) {
        calls.push({ calendar: input });
        if (input.date === '2026-09-04') return { ...calendarFixture(), dateKey: '2026-09-04', timeline: { ...calendarFixture().timeline, appointments: [] } };
        return calendarFixture();
      },
    },
    messagesService: {
      async resolveAccess() { return { capability: 'client:lookup' }; },
      async buildModel(input) { calls.push({ messages: input }); return { attention: [], activity: [], attentionUnavailable: false, activityUnavailable: false }; },
    },
  });
  const viewer = { calendarScope: 'business_all_staff' };
  const model = await service.buildModel({ adminId: 7, viewer, now: new Date('2026-09-05T08:00:00Z') });
  const calendarCalls = calls.filter(call => call.calendar).map(call => call.calendar);
  const messageCall = calls.find(call => call.messages)?.messages;
  assert.deepEqual(calendarCalls.map(call => call.date).sort(), ['2026-09-04', '2026-09-05']);
  assert.ok(calendarCalls.every(call => call.view === 'day' && call.staff === 'all'));
  assert.ok(calendarCalls.every(call => call.viewer.calendarScope === 'all_business'));
  assert.equal(model.appointments.length, 1);
  assert.equal(model.carryOver.length, 0);
  assert.equal(messageCall.activityLimit, 4);
  await assert.rejects(service.buildModel({ adminId: 7, viewer: null }), error => error instanceof WorkspaceDashboardError && error.httpStatus === 403);
});

test('Dashboard and Messages GET routes require authenticated sessions and cannot invoke a provider sender', async () => {
  const state = { dashboardGets: 0, messageGets: 0, senderCalls: 0 };
  const sessionService = { async validateSessionToken(token) { return token === 'valid' ? { ok: true, adminId: 7, viewer: { calendarScope: 'business_all_staff' } } : { ok: false }; } };
  const app = express();
  app.use('/calendar/workspace', createWorkspaceOperationalRouter({
    env: ENABLED_ENV,
    sessionService,
    dashboardService: { async buildModel() { state.dashboardGets += 1; return { ...calendarFixture(), requestedDateKey: '2026-09-05', operationalDateKey: '2026-09-05', carryOverDateKey: '2026-09-04', carryOver: [], calendar: calendarFixture(), appointments: calendarFixture().timeline.appointments, teamGroups: [], awaitingFinalization: [], bookingRequests: [], recentActivity: [], closures: [], communications: null }; } },
    navigationService: { async resolve() { return {}; } },
  }));
  app.use('/calendar/messages', createWorkspaceMessagesRouter({
    env: ENABLED_ENV,
    sessionService,
    service: { async buildModel() { state.messageGets += 1; return { selectedView: 'all', attention: [], activity: [], notificationAuthority: null }; } },
  }));
  await withServer(app, async base => {
    assert.equal((await fetch(`${base}/calendar/workspace`)).status, 401);
    assert.equal((await fetch(`${base}/calendar/messages`)).status, 401);
    assert.equal((await fetch(`${base}/calendar/workspace`, { headers: { cookie: 'shiloh_staff_session=valid' } })).status, 200);
    assert.equal((await fetch(`${base}/calendar/messages`, { headers: { cookie: 'shiloh_staff_session=valid' } })).status, 200);
  });
  assert.equal(state.dashboardGets, 1);
  assert.equal(state.messageGets, 1);
  assert.equal(state.senderCalls, 0);
});
