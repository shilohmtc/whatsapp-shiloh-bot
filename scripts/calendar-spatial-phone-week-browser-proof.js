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
const {
  createOptionalCalendarSessionMiddleware,
  serializeSessionCookie,
} = require('../src/middleware/staffBrowserSession');
const { createCalendarReadOnlyRouter } = require('../src/routes/calendarReadOnlyUx');
const { createCalendarReadOnlyUxService } = require('../src/services/calendarReadOnlyUx');
const { staffCalendarAccessClientScript } = require('../src/presentation/staffCalendarAccessUx');
const { calendarOperationalMutationsClientScript } = require('../src/presentation/calendarOperationalMutationsUx');
const { workspaceNavigationClientScript } = require('../src/presentation/workspaceShell');

const OUT_DIR = path.join(process.cwd(), 'artifacts', 'calendar-spatial-phone-week-p1');
const SESSION_TOKEN = 'synthetic-spatial-week-session';
const DATE_KEY = '2026-09-11';
const ENV = {
  NODE_ENV: 'production',
  SHILOH_CALENDAR_READONLY_UX_ENABLED: 'true',
  SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED: 'true',
};

function chromeExecutable() {
  return [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
    .find(candidate => candidate && fs.existsSync(candidate)) || null;
}

function sha256(filePath) {
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
  throw new Error('Timed out waiting for authenticated spatial Phone Week proof');
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

const STAFF = [
  { id: 51, displayName: 'Amber Room', schedulingType: 'regular' },
  { id: 52, displayName: 'Birch Room', schedulingType: 'regular' },
  { id: 53, displayName: 'Cedar Room', schedulingType: 'regular' },
];

function appointment(id, staffIds, day, localHour, durationMinutes, clientName) {
  const utcHour = localHour - 2;
  const startsAt = `${day}T${String(utcHour).padStart(2, '0')}:00:00.000Z`;
  return {
    id,
    kind: 'appointment',
    canonical: true,
    revision: `rev-${id}`,
    status: 'scheduled',
    clientName,
    clientMobile: '27820000000',
    serviceName: durationMinutes > 60 ? 'Extended synthetic treatment' : 'Synthetic treatment',
    serviceContexts: [{ serviceId: 81, categoryName: 'Massage' }],
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + durationMinutes * 60 * 1000).toISOString(),
    staffIds,
    staff: staffIds.map(staffId => ({ staffId, nameSnapshot: STAFF.find(person => person.id === staffId).displayName })),
  };
}

function canonicalTimeline() {
  const appointments = [
    appointment(9801, [51], '2026-09-07', 8, 60, 'Monday Client'),
    appointment(9802, [52], '2026-09-08', 9, 45, 'Tuesday Client'),
    appointment(9803, [53], '2026-09-10', 11, 90, 'Thursday Client'),
    appointment(9804, [51, 52], '2026-09-11', 10, 120, 'Shared Client'),
    appointment(9805, [53], '2026-09-11', 12, 60, 'Later Client'),
    appointment(9806, [51], '2026-09-12', 13, 45, 'Saturday Client'),
  ];
  return {
    staff: STAFF,
    workingWindows: STAFF.flatMap(person => [1, 2, 3, 4, 5, 6].map(dayOfWeek => ({
      staffId: person.id,
      dayOfWeek,
      startsLocal: '08:00:00',
      endsLocal: dayOfWeek === 6 ? '15:00:00' : '17:00:00',
    }))),
    scheduleExceptions: [],
    recurringClosures: [],
    closures: [],
    appointments,
    blocks: [],
    leave: [],
    externalBusy: [],
    events: appointments,
  };
}

function createFixture() {
  const state = {
    authenticatedCalendarReads: 0,
    productionReads: 0,
    productionMutations: 0,
    providerNetworkCalls: 0,
    senderCalls: 0,
    realClientSends: 0,
  };
  const sessionService = {
    async validateSessionToken(token) {
      if (token !== SESSION_TOKEN) return { ok: false };
      return {
        ok: true,
        sessionId: 88,
        adminId: 77,
        csrfHash: 'synthetic',
        recoveryRequired: false,
        viewer: { calendarScope: 'business_all_staff', operatorAdminId: 77 },
      };
    },
  };
  const calendarService = createCalendarReadOnlyUxService({
    async listTimeline() {
      state.authenticatedCalendarReads += 1;
      return canonicalTimeline();
    },
    async query(_text, params) {
      return {
        rows: (params?.[0] || []).map(id => ({ appointment_id: id, client_mobile: '27820000000' })),
      };
    },
  });
  const mutationCapability = {
    enabled: true,
    operations: ['appointment:reschedule', 'appointment:cancel', 'appointment:reassign'],
    calendarScope: 'all_business',
    serviceScope: 'all_services',
    allowedServiceIds: null,
  };
  const app = express();
  app.use(express.json());
  app.use(requestContext);
  app.get('/proof', (_req, res) => {
    res.setHeader('Set-Cookie', serializeSessionCookie(SESSION_TOKEN, { env: ENV }));
    return res.redirect(302, `/calendar/read-only?view=week&date=${DATE_KEY}&staff=51&staff=52&staff=53`);
  });
  app.get('/calendar/staff/client.js', (_req, res) => res.type('application/javascript').send(staffCalendarAccessClientScript()));
  app.get('/calendar/operations/client.js', (_req, res) => res.type('application/javascript').send(calendarOperationalMutationsClientScript()));
  app.get('/calendar/workspace/nav.js', (_req, res) => res.type('application/javascript').send(workspaceNavigationClientScript()));
  app.get('/calendar/workspace/navigation', (_req, res) => res.json({
    dashboard: { allowed: true, href: '/calendar/workspace' },
    calendar: { allowed: true, href: '/calendar/read-only' },
    clients: { allowed: true, href: '/calendar/clients' },
    messages: { allowed: true, href: '/calendar/messages' },
    staff: { allowed: true, href: '/calendar/team' },
    services: { allowed: true, href: '/calendar/services' },
    reports: { allowed: true, href: '/calendar/reports' },
  }));
  app.get('/calendar/operations/appointments/:appointmentId/booking-confirmation', (_req, res) => res.json({
    confirmation: { status: 'delivered', statusLabel: 'Delivered', lastEvidenceAt: '2026-09-05T08:00:00.000Z' },
    canRecover: false,
  }));
  app.use('/calendar/read-only', createOptionalCalendarSessionMiddleware({ service: sessionService, env: ENV }), createCalendarReadOnlyRouter({
    env: ENV,
    buildModel: input => calendarService.buildModel(input),
    bookingService: { async resolveOperator() { return { adminId: 77 }; } },
    mutationService: { async resolveOperator() { return { mutationCapability }; } },
    clientAccessService: { async resolveAccess() { return { capability: 'client:lookup' }; } },
  }));
  return { app, state };
}

const METRICS = `(() => {
  const visible = node => { if (!node) return false; const style=getComputedStyle(node),rect=node.getBoundingClientRect(); return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0; };
  const weekGrid=document.querySelector('.week-grid');
  const rail=document.querySelector('.time-rail');
  const events=Array.from(document.querySelectorAll('.week-view .positioned-event'));
  const shared=document.querySelector('[data-event-id="appointment-9804"]');
  const oneHour=document.querySelector('[data-event-id="appointment-9801"]')?.closest('.positioned-event');
  const twoHours=shared?.closest('.positioned-event');
  const manage=shared?.querySelector('[data-calendar-operation="manage-appointment"]');
  const nav=document.querySelector('.workspace-nav');
  const frame=document.querySelector('.workspace-frame');
  const navTargets=Array.from(document.querySelectorAll('.workspace-nav a,.workspace-nav button')).filter(visible);
  return {
    viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
    rootScrollWidth:document.documentElement.scrollWidth,
    weekColumns:weekGrid?getComputedStyle(weekGrid).gridTemplateColumns.split(' ').filter(Boolean).length:0,
    dayColumns:document.querySelectorAll('.week-day').length,
    sundayColumns:Array.from(document.querySelectorAll('.week-day')).filter(node=>new Date(node.dataset.date+'T12:00:00Z').getUTCDay()===0).length,
    timeRailVisible:visible(rail),
    firstEventPosition:events.length?getComputedStyle(events[0]).position:null,
    firstEventTop:events.length?parseFloat(getComputedStyle(events[0]).top):null,
    oneHourHeight:oneHour?.getBoundingClientRect().height||0,
    twoHourHeight:twoHours?.getBoundingClientRect().height||0,
    sharedCopies:document.querySelectorAll('[data-event-id="appointment-9804"]').length,
    peopleContextPresent:Boolean(document.querySelector('[data-view-practitioner-context]')),
    peopleSummary:document.querySelector('[data-people-selection-summary]')?.textContent.trim()||'',
    practitionerOwnership:shared?.querySelector('.event-practitioners')?.getAttribute('aria-label')||'',
    overlapLayout:weekGrid?.getAttribute('data-week-overlap-layout')||'',
    manageOpacity:manage?parseFloat(getComputedStyle(manage).opacity):null,
    manageWidth:manage?.getBoundingClientRect().width||0,
    manageHeight:manage?.getBoundingClientRect().height||0,
    managementOpen:Boolean(document.querySelector('[data-calendar-management-panel]')?.open),
    peoplePickerOpen:Boolean(document.querySelector('[data-people-picker]')?.open),
    bottomNavHeight:nav?.getBoundingClientRect().height||0,
    framePaddingBottom:frame?parseFloat(getComputedStyle(frame).paddingBottom)||0:0,
    minNavTargetHeight:navTargets.length?Math.min(...navTargets.map(node=>node.getBoundingClientRect().height)):0,
  };
})()`;

async function main() {
  const executable = chromeExecutable();
  if (!executable) {
    if (process.env.CI) throw new Error('CI must provide Chrome for authenticated spatial Phone Week proof');
    console.log('Chrome not installed; authenticated spatial Phone Week proof is CI-only.');
    return;
  }
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-spatial-week-'));
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
      try {
        const url = new URL(event.request.url);
        if (url.origin !== origin && !event.request.url.startsWith('data:') && !event.request.url.startsWith('about:')) externalRequests.push(event.request.url);
      } catch (_error) { externalRequests.push(event.request.url); }
    });
    cdp.on('Runtime.exceptionThrown', event => browserExceptions.push(event.exceptionDetails?.exception?.description || event.exceptionDetails?.text));
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    async function navigate(url) {
      await cdp.send('Page.navigate', { url });
      await poll(() => evaluate(cdp, 'document.readyState'), value => value === 'complete');
      await poll(() => evaluate(cdp, `document.querySelector('.week-grid')?.getAttribute('data-week-overlap-layout')`), Boolean);
    }
    async function capture(name) {
      const image = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
      const file = `${name}.png`;
      const target = path.join(OUT_DIR, file);
      fs.writeFileSync(target, Buffer.from(image.data, 'base64'));
      return { name, file, bytes: fs.statSync(target).size, sha256: sha256(target) };
    }

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false, screenWidth: 1440, screenHeight: 1000 });
    await cdp.send('Page.navigate', { url: `${origin}/proof` });
    await poll(() => evaluate(cdp, 'location.pathname'), value => value === '/calendar/read-only');
    await poll(() => evaluate(cdp, `document.querySelector('.week-grid')?.getAttribute('data-week-overlap-layout')`), value => value === 'desktop');
    const desktopMetrics = await evaluate(cdp, METRICS);
    assert.equal(desktopMetrics.weekColumns, 6);
    assert.equal(desktopMetrics.dayColumns, 6);
    assert.equal(desktopMetrics.sundayColumns, 0);
    assert.equal(desktopMetrics.peopleContextPresent, false);
    assert.equal(desktopMetrics.peopleSummary, 'All staff');
    assert.equal(desktopMetrics.sharedCopies, 1);
    assert.match(desktopMetrics.practitionerOwnership, /Amber Room \+ Birch Room/);
    assert.equal(desktopMetrics.firstEventPosition, 'absolute');
    const screenshots = [{ ...(await capture('desktop-week-multiple-practitioners')), viewport: { width: 1440, height: 1000 }, metrics: desktopMetrics }];

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: 844 });
    await navigate(`${origin}/calendar/read-only?view=week&date=${DATE_KEY}&staff=51&staff=52&staff=53`);
    const phoneMetrics = await evaluate(cdp, METRICS);
    assert.deepEqual(phoneMetrics.viewport, { width: 390, height: 844, screenWidth: 390, screenHeight: 844 });
    assert.ok(phoneMetrics.rootScrollWidth <= 391, 'Phone Week leaked horizontal overflow to the page');
    assert.equal(phoneMetrics.weekColumns, 6);
    assert.equal(phoneMetrics.dayColumns, 6);
    assert.equal(phoneMetrics.sundayColumns, 0);
    assert.equal(phoneMetrics.timeRailVisible, true);
    assert.equal(phoneMetrics.firstEventPosition, 'absolute');
    assert.equal(phoneMetrics.firstEventTop, 72);
    assert.ok(phoneMetrics.twoHourHeight > phoneMetrics.oneHourHeight * 1.7, 'Phone event height did not preserve canonical duration');
    assert.equal(phoneMetrics.peopleContextPresent, false);
    assert.equal(phoneMetrics.peopleSummary, 'All staff');
    assert.equal(phoneMetrics.sharedCopies, 1);
    assert.match(phoneMetrics.practitionerOwnership, /Amber Room \+ Birch Room/);
    assert.equal(phoneMetrics.overlapLayout, 'phone');
    assert.equal(phoneMetrics.manageOpacity, 0);
    assert.ok(phoneMetrics.manageWidth >= 44 && phoneMetrics.manageHeight >= 44, 'Phone event management target is below 44px');
    assert.ok(phoneMetrics.minNavTargetHeight >= 44, 'Phone bottom navigation has a target below 44px');
    assert.ok(phoneMetrics.framePaddingBottom >= phoneMetrics.bottomNavHeight - 2, 'Phone schedule is not protected from bottom navigation');
    screenshots.push({ ...(await capture('phone-week-spatial-grid')), viewport: { width: 390, height: 844 }, metrics: phoneMetrics });

    await evaluate(cdp, `document.querySelector('[data-people-picker] summary').click();true`);
    await poll(() => evaluate(cdp, `document.querySelector('[data-people-picker]').open`), Boolean);
    const peopleOpenMetrics = await evaluate(cdp, METRICS);
    assert.equal(peopleOpenMetrics.peoplePickerOpen, true);
    screenshots.push({ ...(await capture('phone-week-people-selector-open')), viewport: { width: 390, height: 844 }, metrics: peopleOpenMetrics });
    await evaluate(cdp, `document.querySelector('[data-people-picker] summary').click();true`);

    await evaluate(cdp, `document.querySelector('[data-event-id="appointment-9804"] [data-calendar-operation="manage-appointment"]').click();true`);
    await poll(() => evaluate(cdp, `document.querySelector('[data-calendar-management-panel]').open`), Boolean);
    const managementMetrics = await evaluate(cdp, METRICS);
    assert.equal(managementMetrics.managementOpen, true);
    screenshots.push({ ...(await capture('phone-week-management-sheet-open')), viewport: { width: 390, height: 844 }, metrics: managementMetrics });

    assert.deepEqual(browserExceptions, []);
    assert.deepEqual(externalRequests, []);
    assert.ok(state.authenticatedCalendarReads >= 2);
    assert.deepEqual({ ...state, authenticatedCalendarReads: 0 }, {
      authenticatedCalendarReads: 0,
      productionReads: 0,
      productionMutations: 0,
      providerNetworkCalls: 0,
      senderCalls: 0,
      realClientSends: 0,
    });
    const exactHead = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
    assert.match(exactHead, /^[0-9a-f]{40}$/);
    const manifest = {
      generatedAt: new Date().toISOString(),
      exactHead,
      authenticatedSession: true,
      syntheticDataOnly: true,
      authority: 'Existing CalendarReadOnlyUx over server-permitted SchedulingTimeline staff with canonical appointment management action wiring',
      productionReads: 0,
      productionMutations: 0,
      providerNetworkCalls: 0,
      senderCalls: 0,
      realClientSends: 0,
      screenshots,
    };
    fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Authenticated spatial Phone Week proof passed: ${screenshots.length} screenshots at ${exactHead}`);
  } finally {
    if (cdp) cdp.close();
    if (chrome && !chrome.killed) chrome.kill('SIGTERM');
    if (server) await new Promise(resolve => server.close(() => resolve()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
