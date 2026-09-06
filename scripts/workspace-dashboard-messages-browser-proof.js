const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const https = require('node:https');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const express = require('express');

const requestContext = require('../src/middleware/requestContext');
const { requireStaffSession, serializeSessionCookie } = require('../src/middleware/staffBrowserSession');
const { createWorkspaceOperationalRouter } = require('../src/routes/workspaceOperational');
const { createWorkspaceMessagesRouter } = require('../src/routes/workspaceMessages');
const { createWorkspaceClientsRouter } = require('../src/routes/workspaceClients');
const { createWorkspaceDashboardService } = require('../src/services/workspaceDashboard');
const { createWorkspaceMessagesService } = require('../src/services/workspaceMessages');
const { createWorkspaceNavigationService } = require('../src/services/workspaceNavigation');
const { renderCalendarPage } = require('../src/presentation/calendarReadOnlyUx');
const { applyCalendarResponsivePolish } = require('../src/routes/calendarReadOnlyUx');
const { periodFor } = require('../src/services/calendarReadOnlyUx');

const OUT_DIR = path.join(process.cwd(), 'artifacts', 'workspace-dashboard-v2-p1');
const DATE_KEY = '2026-09-05';
const OWNER_SESSION_TOKEN = 'synthetic-owner-workspace-session';
const PRACTITIONER_SESSION_TOKEN = 'synthetic-practitioner-workspace-session';
const ENV = {
  NODE_ENV: 'production',
  SHILOH_CALENDAR_READONLY_UX_ENABLED: 'true',
  SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED: 'true',
};

function chromeExecutable() {
  return [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
    .find(candidate => candidate && fs.existsSync(candidate)) || null;
}

function fileSha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function createCertificate(directory) {
  const keyPath = path.join(directory, 'key.pem');
  const certPath = path.join(directory, 'cert.pem');
  const generated = spawnSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyPath, '-out', certPath,
    '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1,DNS:localhost', '-days', '1',
  ], { encoding: 'utf8' });
  if (generated.status !== 0) throw new Error(`OpenSSL proof certificate failed: ${generated.stderr}`);
  return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
}

async function reservePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

async function poll(load, accept, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await load();
      if (accept(value)) return value;
    } catch (error) { lastError = error; }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (lastError) throw lastError;
  throw new Error('Timed out waiting for authenticated Workspace consolidation proof');
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (message.id) {
      const waiter = pending.get(message.id);
      if (!waiter) return;
      pending.delete(message.id);
      clearTimeout(waiter.timeout);
      if (message.error) waiter.reject(new Error(`${message.error.code}: ${message.error.message}`));
      else waiter.resolve(message.result || {});
      return;
    }
    for (const listener of listeners.get(message.method) || []) listener(message.params || {});
  });
  return {
    send(method, params = {}, timeoutMs = 15_000) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`Chrome DevTools command timed out: ${method}`));
        }, timeoutMs);
        pending.set(id, { resolve, reject, timeout });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    on(method, listener) {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(listener);
    },
    close() { socket.close(); },
  };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Browser evaluation failed');
  return result.result?.value;
}

function calendarModel({ practitionerOnly = false } = {}) {
  const staff = [
    { id: 31, displayName: 'Cedar Practitioner', schedulingType: 'regular' },
    { id: 32, displayName: 'Willow Practitioner', schedulingType: 'regular' },
  ];
  const appointment = (id, hour, staffIds, clientName) => ({
    id, kind: 'appointment', canonical: true, revision: `2026-09-05T06:${String(id % 60).padStart(2, '0')}:00.000Z`, status: 'scheduled',
    clientName, clientMobile: '27820000000', serviceName: 'Synthetic treatment',
    serviceContexts: [{ serviceId: 71, categoryName: 'Massage' }],
    startsAt: `${DATE_KEY}T${String(hour).padStart(2, '0')}:00:00.000Z`,
    endsAt: `${DATE_KEY}T${String(hour + 1).padStart(2, '0')}:00:00.000Z`,
    staffIds,
    staff: staffIds.map(staffId => ({ staffId, nameSnapshot: staff.find(person => person.id === staffId).displayName })),
  });
  const appointments = [
    appointment(8101, 7, [31], 'Aloe Client'),
    appointment(8102, 9, [31, 32], 'Shared Client'),
    appointment(8103, 11, [32], 'Protea Client'),
  ];
  const visibleStaff = practitionerOnly ? staff.slice(0, 1) : staff;
  const visibleAppointments = practitionerOnly ? appointments.filter(item => item.staffIds.includes(31)) : appointments;
  return {
    view: 'day', dateKey: DATE_KEY, period: periodFor('day', DATE_KEY),
    selectedStaffId: null, visibleStaffIds: staff.map(person => person.id), visibleStaffSelectionExplicit: true,
    permittedStaff: visibleStaff, mutationCapability: { enabled: false },
    timeline: {
      staff: visibleStaff,
      workingWindows: visibleStaff.flatMap(person => [{ staffId: person.id, dayOfWeek: 6, startsLocal: '08:00:00', endsLocal: '15:00:00' }]),
      scheduleExceptions: [], recurringClosures: [], closures: [], leave: [], externalBusy: [], blocks: [],
      appointments: visibleAppointments, events: visibleAppointments,
    },
  };
}

function communicationActivity() {
  return [
    { clientId: 201, clientName: 'Aloe Client', mobileLast4: '1001', appointmentId: 8101, label: 'Booking confirmation', status: 'unknown', statusLabel: 'Unknown', occurredAt: '2026-09-05T08:10:00.000Z' },
    { clientId: 202, clientName: 'Protea Client', mobileLast4: '1002', appointmentId: 8103, label: 'Booking confirmation', status: 'delivered', statusLabel: 'Delivered', occurredAt: '2026-09-05T07:40:00.000Z' },
    { clientId: 203, clientName: 'Shared Client', mobileLast4: '1003', appointmentId: 8102, label: 'Reschedule request', status: 'pending', statusLabel: 'Pending', occurredAt: '2026-09-05T07:05:00.000Z' },
    { clientId: 204, clientName: 'Fynbos Client', mobileLast4: '1004', label: 'Customer care message', status: 'failed', statusLabel: 'Failed', occurredAt: '2026-09-05T06:20:00.000Z' },
  ];
}

function attentionExceptions() {
  return [{
    client: { id: 201, name: 'Aloe Client', mobileLast4: '1001' },
    appointment: { id: 8101, serviceName: 'Synthetic treatment', startsAt: '2026-09-05T07:00:00.000Z' },
    confirmation: { status: 'uncertain', statusLabel: 'Delivery uncertain' },
    canRecover: true, actionLabel: 'Retry confirmation safely', reasonMessage: null,
  }];
}

function createFixture() {
  const state = { providerNetworkCalls: 0, senderCalls: 0, productionReads: 0, productionMutations: 0 };
  const sessionService = {
    async validateSessionToken(token) {
      if (token === OWNER_SESSION_TOKEN) return { ok: true, sessionId: 88, adminId: 77, csrfHash: 'synthetic-owner', recoveryRequired: false, viewer: { calendarScope: 'business_all_staff', operatorAdminId: 77 } };
      if (token === PRACTITIONER_SESSION_TOKEN) return { ok: true, sessionId: 89, adminId: 78, csrfHash: 'synthetic-practitioner', recoveryRequired: false, viewer: { calendarScope: 'own_staff', staffId: 31, operatorAdminId: 78 } };
      return { ok: false };
    },
    validateCsrfToken() { return false; },
  };
  const access = { async resolveAccess() { return { canonical: true }; } };
  const messageService = createWorkspaceMessagesService({
    clientAccessService: { ...access, async requireAccess() { return { capability: 'client:lookup' }; } },
    notificationService: {
      ...access,
      async listBookingConfirmationExceptions() { return { exceptions: attentionExceptions() }; },
    },
    communicationService: { async listRecent({ limit }) { return communicationActivity().slice(0, limit); } },
  });
  const dashboardService = createWorkspaceDashboardService({
    calendarService: { async buildModel(input) { return calendarModel({ practitionerOnly: input.viewer.calendarScope === 'own_appointments' }); } },
    messagesService: messageService,
    resolvePrincipal: async adminId => {
      const practitioner = Number(adminId) === 78;
      const calendarScope = practitioner ? 'own_appointments' : 'all_business';
      const businessRole = practitioner ? 'employee_practitioner' : 'business_admin';
      return {
        id: Number(adminId), staff_id: practitioner ? 31 : null,
        display_name: practitioner ? 'Cedar Practitioner' : 'Clinic Owner',
        business_role: businessRole, calendar_scope: calendarScope,
        service_scope: practitioner ? 'own_services' : 'all_services',
        permissions: { 'appointment:view': true, 'booking:update': true },
        admin_active: true, staff_status: practitioner ? 'active' : null,
        calendarAuthority: {
          capabilities: ['appointment:view'], linkedStaffId: practitioner ? 31 : null,
          businessRole, calendarScope, serviceScope: practitioner ? 'own_services' : 'all_services',
        },
      };
    },
    canCertifyAppointmentFn: async (principal, appointmentId) => !(Number(principal.id) === 78 && Number(appointmentId) === 8102),
    finalizeAppointmentFn: async () => { state.productionMutations += 1; return { status: 'updated' }; },
  });
  const navigationService = createWorkspaceNavigationService({
    clientAccessService: access, staffAccessService: access, servicesAccessService: access, reportsAccessService: access,
  });
  const clientService = {
    async listClients() {
      return {
        query: '', status: 'active', offset: 0, pageSize: 24, hasMore: false,
        clients: Array.from({ length: 8 }, (_, index) => ({
          id: 201 + index, name: `${['Aloe', 'Protea', 'Fynbos', 'Willow', 'Cedar', 'Amber', 'Sage', 'Olive'][index]} Client`,
          normalized_mobile: `27820001${String(index).padStart(3, '0')}`, status: 'active', last_appointment_at: '2026-09-05T08:00:00.000Z',
        })),
      };
    },
    async getClientDetail() { throw new Error('Detail is outside this browser proof'); },
  };
  const app = express();
  app.use(express.json());
  app.use(requestContext);
  app.get('/proof', (_req, res) => {
    res.setHeader('Set-Cookie', serializeSessionCookie(OWNER_SESSION_TOKEN, { env: ENV }));
    return res.redirect(302, '/calendar/workspace');
  });
  app.get('/proof-practitioner', (_req, res) => {
    res.setHeader('Set-Cookie', serializeSessionCookie(PRACTITIONER_SESSION_TOKEN, { env: ENV }));
    return res.redirect(302, '/calendar/workspace');
  });
  app.get('/calendar/staff/client.js', (_req, res) => res.type('application/javascript').send("'use strict';"));
  app.get('/calendar/operations/client.js', (_req, res) => res.type('application/javascript').send("'use strict';"));
  app.use('/calendar/workspace', createWorkspaceOperationalRouter({ env: ENV, sessionService, dashboardService, navigationService }));
  app.use('/calendar/messages', createWorkspaceMessagesRouter({ env: ENV, sessionService, service: messageService }));
  app.use('/calendar/clients', createWorkspaceClientsRouter({
    env: ENV, sessionService, service: clientService, notificationService: { async resolveAccess() { return null; } },
  }));
  app.get('/calendar/read-only', requireStaffSession({ service: sessionService, env: ENV }), (_req, res) => {
    const html = renderCalendarPage(calendarModel(), {
      clientNavigationAllowed: true,
      timelineReadOnlyMessage: 'Authenticated synthetic proof. No provider or production write occurs.',
    });
    return res.status(200).type('html').send(applyCalendarResponsivePolish(html, calendarModel()));
  });
  return { app, state };
}

const METRICS_EXPRESSION = `(() => {
  const visible = node => { if (!node) return false; const s=getComputedStyle(node),r=node.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight; };
  const text = selector => Array.from(document.querySelectorAll(selector)).filter(visible).map(node=>node.textContent.trim());
  const targets = Array.from(document.querySelectorAll('.workspace-nav a,.workspace-nav button')).filter(visible);
  const nav = document.querySelector('.workspace-nav');
  const frame = document.querySelector('.workspace-frame');
  const active = document.querySelector('.workspace-link.active');
  const menuToggle = document.querySelector('[data-workspace-drawer-toggle]');
  return {
    viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
    rootScrollWidth:document.documentElement.scrollWidth,
    primary:text('.workspace-primary-links .workspace-link'),
    secondary:text('.workspace-secondary-links .workspace-link'),
    moreVisible:visible(document.querySelector('[data-workspace-more-toggle]')),
    moreOpen:Boolean(document.querySelector('[data-workspace-more-menu].open')),
    active:active?.textContent.trim()||'',
    minNavTargetHeight:targets.length?Math.min(...targets.map(node=>node.getBoundingClientRect().height)):0,
    navHeight:nav?.getBoundingClientRect().height||0,
    navRight:nav?.getBoundingClientRect().right||0,
    drawerOpen:Boolean(nav?.classList.contains('open')),
    menuHeight:menuToggle?.getBoundingClientRect().height||0,
    framePaddingBottom:frame?parseFloat(getComputedStyle(frame).paddingBottom)||0:0,
    signoutHeight:document.querySelector('[data-shiloh-logout]')?.getBoundingClientRect().height||0,
    signoutText:document.querySelector('[data-shiloh-logout]')?.textContent.trim()||'',
    signoutToTabsGap:(()=>{const button=document.querySelector('[data-shiloh-logout]'),tabs=document.querySelector('.tabs');return button&&tabs?tabs.getBoundingClientRect().top-button.getBoundingClientRect().bottom:null;})(),
    attentionVisible:visible(document.querySelector('[data-messages-attention]')),
    unknownVisible:Array.from(document.querySelectorAll('[data-message-status="unknown"]')).some(visible),
    dashboardMode:document.body.dataset.dashboardMode||'',
    dashboardGreeting:document.querySelector('.brand h1')?.textContent.trim()||'',
    dashboardAppointments:document.querySelectorAll('[data-dashboard-appointment]').length,
    dashboardTeamGroups:document.querySelectorAll('[data-dashboard-team-group]').length,
    dashboardActions:document.querySelectorAll('[data-dashboard-finalize]').length,
    minDashboardActionHeight:(()=>{const nodes=Array.from(document.querySelectorAll('[data-dashboard-finalize]')).filter(visible);return nodes.length?Math.min(...nodes.map(node=>node.getBoundingClientRect().height)):0;})(),
    dashboardCommunicationText:document.querySelector('[data-dashboard-communications-panel]')?.textContent.trim()||'',
  };
})()`;

async function main() {
  const executable = chromeExecutable();
  if (!executable) {
    if (process.env.CI) throw new Error('CI must provide Chrome for authenticated Workspace Dashboard and Messages proof');
    console.log('Chrome not installed; authenticated Workspace Dashboard and Messages proof is CI-only.');
    return;
  }
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-workspace-consolidation-'));
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { app, state } = createFixture();
  let server;
  let chrome;
  let cdp;
  try {
    server = https.createServer(createCertificate(directory), app);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const origin = `https://127.0.0.1:${server.address().port}`;
    const debugPort = await reservePort();
    chrome = spawn(executable, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars',
      '--ignore-certificate-errors', '--allow-insecure-localhost', '--remote-allow-origins=*',
      `--remote-debugging-port=${debugPort}`, `--user-data-dir=${path.join(directory, 'profile')}`, 'about:blank',
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    let browserErrors = '';
    chrome.stderr.on('data', chunk => { browserErrors = `${browserErrors}${String(chunk)}`.slice(-8_000); });
    const targets = await poll(
      async () => (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json(),
      items => Array.isArray(items) && items.some(item => item.type === 'page' && item.webSocketDebuggerUrl),
    ).catch(error => { throw new Error(`${error.message}\n${browserErrors}`); });
    cdp = await connectCdp(targets.find(item => item.type === 'page').webSocketDebuggerUrl);
    const externalRequests = [];
    const browserExceptions = [];
    cdp.on('Network.requestWillBeSent', event => {
      try { if (new URL(event.request.url).origin !== origin && !event.request.url.startsWith('data:')) externalRequests.push(event.request.url); }
      catch (_error) { externalRequests.push(event.request.url); }
    });
    cdp.on('Runtime.exceptionThrown', event => browserExceptions.push(event.exceptionDetails?.exception?.description || event.exceptionDetails?.text));
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    async function navigate(url) {
      await cdp.send('Page.navigate', { url });
      await poll(() => evaluate(cdp, 'document.readyState'), value => value === 'complete');
      await poll(() => evaluate(cdp, `Array.from(document.querySelectorAll('.workspace-link')).filter(n=>n.tagName==='A'||n.classList.contains('active')).length`), value => value === 7);
    }
    async function screenshot(name) {
      const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
      const file = `${name}.png`;
      const target = path.join(OUT_DIR, file);
      fs.writeFileSync(target, Buffer.from(result.data, 'base64'));
      return { file, bytes: fs.statSync(target).size, sha256: fileSha256(target) };
    }
    async function proof({ name, path: urlPath, width, height, phone, openDrawer = false }) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width, height, deviceScaleFactor: 1, mobile: phone, screenWidth: width, screenHeight: height,
      });
      await navigate(`${origin}${urlPath}`);
      if (openDrawer) {
        await evaluate(cdp, `document.querySelector('[data-workspace-drawer-toggle]').click();true`);
        await poll(() => evaluate(cdp, `document.querySelector('[data-workspace-navigation-drawer]').classList.contains('open')`), Boolean);
        await poll(() => evaluate(cdp, `document.querySelector('[data-workspace-navigation-drawer]').getBoundingClientRect().left`), value => value >= -1);
      }
      const metrics = await evaluate(cdp, METRICS_EXPRESSION);
      assert.deepEqual(metrics.viewport, { width, height, screenWidth: width, screenHeight: height });
      assert.ok(metrics.rootScrollWidth <= width + 1, `${name} leaked horizontal page overflow`);
      assert.ok(metrics.active, `${name} has no active destination`);
      if (phone) {
        assert.ok(metrics.menuHeight >= 44, `${name} has a menu touch target below 44px`);
        if (!urlPath.startsWith('/calendar/read-only')) {
          assert.ok(metrics.signoutHeight >= 44, `${name} has a collapsed sign-out control`);
          assert.equal(metrics.signoutText, 'Sign out');
          if (metrics.signoutToTabsGap != null) assert.ok(metrics.signoutToTabsGap >= 8, `${name} overlays its sign-out control with Messages tabs`);
        }
        assert.equal(metrics.framePaddingBottom, 0, `${name} still reserves bottom-navigation space`);
        if (openDrawer) {
          assert.equal(metrics.drawerOpen, true);
          assert.deepEqual(metrics.primary, ['Dashboard', 'Calendar', 'Clients', 'Messages']);
          assert.deepEqual(metrics.secondary, ['Staff', 'Services', 'Reports']);
          assert.equal(metrics.moreVisible, false);
          assert.equal(metrics.moreOpen, false);
          assert.ok(metrics.minNavTargetHeight >= 44, `${name} has a drawer target below 44px`);
        } else {
          assert.equal(metrics.drawerOpen, false);
          assert.ok(metrics.navRight <= 1, `${name} leaves the closed drawer on-screen`);
          assert.deepEqual(metrics.primary, []);
          assert.equal(metrics.moreVisible, false);
          assert.deepEqual(metrics.secondary, []);
        }
      } else {
        assert.deepEqual([...metrics.primary, ...metrics.secondary], ['Dashboard', 'Calendar', 'Clients', 'Messages', 'Staff', 'Services', 'Reports']);
        assert.equal(metrics.moreVisible, false);
      }
      if (urlPath.startsWith('/calendar/messages')) {
        assert.equal(metrics.attentionVisible, true);
        assert.equal(metrics.unknownVisible, true);
      }
      if (metrics.dashboardMode) {
        assert.ok(metrics.dashboardAppointments > 0, `${name} has no operational appointments`);
        assert.ok(metrics.dashboardGreeting.startsWith('Welcome, '), `${name} has no canonical greeting`);
        assert.match(metrics.dashboardCommunicationText, /Client notification needs attention/);
        if (metrics.dashboardActions) assert.ok(metrics.minDashboardActionHeight >= (phone ? 44 : 36), `${name} has undersized outcome actions`);
      }
      return { name, phone, viewport: { width, height }, active: metrics.active, metrics, ...(await screenshot(name)) };
    }

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false, screenWidth: 1440, screenHeight: 1000 });
    await cdp.send('Page.navigate', { url: `${origin}/proof` });
    await poll(() => evaluate(cdp, 'location.pathname'), value => value === '/calendar/workspace');
    const screenshots = [];
    const destinations = [
      ['dashboard', '/calendar/workspace'], ['calendar', '/calendar/read-only'], ['clients', '/calendar/clients'], ['messages', '/calendar/messages?view=all'],
    ];
    for (const [name, urlPath] of destinations) screenshots.push(await proof({ name: `desktop-${name}`, path: urlPath, width: 1440, height: 1000, phone: false }));
    const ownerDashboard = screenshots.find(item => item.name === 'desktop-dashboard').metrics;
    assert.equal(ownerDashboard.dashboardMode, 'owner_overview');
    assert.equal(ownerDashboard.dashboardGreeting, 'Welcome, Clinic Owner');
    assert.equal(ownerDashboard.dashboardAppointments, 3);
    assert.equal(ownerDashboard.dashboardTeamGroups, 3);
    for (const [name, urlPath] of destinations) screenshots.push(await proof({ name: `phone-${name}`, path: urlPath, width: 390, height: 844, phone: true }));
    screenshots.push(await proof({ name: 'phone-practitioner-my-day', path: '/proof-practitioner', width: 390, height: 844, phone: true }));
    const practitionerMetrics = screenshots.at(-1).metrics;
    assert.equal(practitionerMetrics.dashboardMode, 'my_day');
    assert.equal(practitionerMetrics.dashboardGreeting, 'Welcome, Cedar Practitioner');
    assert.equal(practitionerMetrics.dashboardTeamGroups, 0);
    assert.equal(practitionerMetrics.dashboardAppointments, 2);
    assert.equal(practitionerMetrics.dashboardActions, 2);
    await cdp.send('Page.navigate', { url: `${origin}/proof` });
    await poll(() => evaluate(cdp, 'location.pathname'), value => value === '/calendar/workspace');
    screenshots.push(await proof({ name: 'phone-drawer-open', path: '/calendar/workspace', width: 390, height: 844, phone: true, openDrawer: true }));

    assert.deepEqual(browserExceptions, []);
    assert.deepEqual(externalRequests, []);
    assert.deepEqual(state, { providerNetworkCalls: 0, senderCalls: 0, productionReads: 0, productionMutations: 0 });
    const exactHead = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
    assert.match(exactHead, /^[0-9a-f]{40}$/);
    const manifest = {
      generatedAt: new Date().toISOString(), exactHead, authenticatedSession: true, syntheticDataOnly: true,
      authority: 'Existing CalendarReadOnlyUx, Calendar principal/capability scope, canonical appointment finalization, client:lookup, client:notify and workspaceCommunicationEvidence composition',
      productionReads: 0, productionMutations: 0, providerNetworkCalls: 0, senderCalls: 0, realClientSends: 0,
      screenshots,
    };
    fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Authenticated Workspace Dashboard and Messages proof passed: ${screenshots.length} screenshots at ${exactHead}`);
  } finally {
    if (cdp) cdp.close();
    if (chrome && !chrome.killed) {
      chrome.kill('SIGTERM');
      await Promise.race([once(chrome, 'exit'), new Promise(resolve => setTimeout(resolve, 2_000))]);
      if (chrome.exitCode == null) chrome.kill('SIGKILL');
    }
    if (server) await new Promise(resolve => server.close(() => resolve()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
