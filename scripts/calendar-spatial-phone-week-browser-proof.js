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
const { createCalendarCreateBookingRouter } = require('../src/routes/calendarCreateBooking');
const { createCalendarReadOnlyUxService } = require('../src/services/calendarReadOnlyUx');
const { staffCalendarAccessClientScript } = require('../src/presentation/staffCalendarAccessUx');
const { calendarOperationalMutationsClientScript } = require('../src/presentation/calendarOperationalMutationsUx');
const { workspaceNavigationClientScript } = require('../src/presentation/workspaceShell');

const OUT_DIR = path.join(process.cwd(), 'artifacts', 'calendar-goldie-density-phone-shell-p1');
const SESSION_TOKEN = 'synthetic-phone-v2-session';
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
  throw new Error('Timed out waiting for authenticated Phone Calendar V2 proof');
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
      return { rows: (params?.[0] || []).map(id => ({ appointment_id: id, client_mobile: '27820000000' })) };
    },
  });
  const mutationCapability = {
    enabled: true,
    operations: [
      'appointment:reschedule', 'appointment:cancel', 'appointment:reassign',
      'calendar_block:manage', 'operational_leave:manage',
    ],
    calendarScope: 'all_business',
    serviceScope: 'all_services',
    allowedServiceIds: null,
  };
  const app = express();
  app.use(express.json());
  app.use(requestContext);
  app.get('/proof', (_req, res) => {
    res.setHeader('Set-Cookie', serializeSessionCookie(SESSION_TOKEN, { env: ENV }));
    return res.redirect(302, `/calendar/read-only?view=week&date=${DATE_KEY}&staff=51&staff=52&staff=53&activeStaff=51`);
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
  app.use('/calendar/book', createCalendarCreateBookingRouter({
    env: ENV,
    sessionService,
    bookingService: {
      async resolveOperator() { return { adminId: 77 }; },
      async listBookableOptions() {
        return {
          staff: STAFF,
          services: [{ id: 81, name: 'Synthetic treatment', durationMinutes: 60, staffIds: STAFF.map(person => person.id) }],
        };
      },
    },
    clientDirectory: { async listActiveClients() { return { clients: [] }; } },
    creationService: { async resolveCreateAccess() { return null; } },
  }));
  return { app, state };
}

async function main() {
  const executable = chromeExecutable();
  if (!executable) {
    if (process.env.CI) throw new Error('CI must provide Chrome for authenticated Phone Calendar V2 proof');
    console.log('Chrome not installed; authenticated Phone Calendar V2 proof is CI-only.');
    return;
  }

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-phone-v2-'));
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

    async function navigate(url, readySelector) {
      await cdp.send('Page.navigate', { url });
      await poll(() => evaluate(cdp, 'document.readyState'), value => value === 'complete');
      if (readySelector) await poll(() => evaluate(cdp, `Boolean(document.querySelector(${JSON.stringify(readySelector)}))`), Boolean);
    }

    async function capture(name) {
      const image = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
      const file = `${name}.png`;
      const target = path.join(OUT_DIR, file);
      fs.writeFileSync(target, Buffer.from(image.data, 'base64'));
      return { name, file, bytes: fs.statSync(target).size, sha256: sha256(target) };
    }

    const screenshots = [];

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false, screenWidth: 1440, screenHeight: 1000 });
    await cdp.send('Page.navigate', { url: `${origin}/proof` });
    await poll(() => evaluate(cdp, 'location.pathname'), value => value === '/calendar/read-only');
    await poll(() => evaluate(cdp, `document.querySelector('.week-grid')?.getAttribute('data-week-overlap-layout')`), value => value === 'desktop');
    const desktopMetrics = await evaluate(cdp, `(() => ({
      viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
      weekColumns:getComputedStyle(document.querySelector('.week-grid')).gridTemplateColumns.split(' ').filter(Boolean).length,
      dayColumns:document.querySelectorAll('.week-day').length,
      uniqueDates:new Set(Array.from(document.querySelectorAll('[data-week-practitioner-lane]')).map(node=>node.dataset.date)).size,
      staffIds:Array.from(new Set(Array.from(document.querySelectorAll('[data-week-practitioner-lane]')).map(node=>node.dataset.staffId))),
      sundayColumns:Array.from(document.querySelectorAll('.week-day')).filter(node=>new Date(node.dataset.date+'T12:00:00Z').getUTCDay()===0).length,
      phoneControlsDisplay:getComputedStyle(document.querySelector('[data-phone-calendar-v2-controls]')).display,
    }))()`);
    assert.deepEqual(desktopMetrics.viewport, { width: 1440, height: 1000, screenWidth: 1440, screenHeight: 1000 });
    assert.equal(desktopMetrics.weekColumns, 18);
    assert.equal(desktopMetrics.dayColumns, 18);
    assert.equal(desktopMetrics.uniqueDates, 6);
    assert.deepEqual(desktopMetrics.staffIds, ['51', '52', '53']);
    assert.equal(desktopMetrics.sundayColumns, 0);
    assert.equal(desktopMetrics.phoneControlsDisplay, 'none');
    screenshots.push({ ...(await capture('desktop-week-authority-preserved')), viewport: desktopMetrics.viewport, metrics: desktopMetrics });

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: 844 });
    await navigate(`${origin}/calendar/read-only?view=day&date=${DATE_KEY}&staff=52&activeStaff=52`, '.day-time-grid');
    await poll(() => evaluate(cdp, `document.body.dataset.phoneActiveStaffId`), value => value === '52');
    const dayMetrics = await evaluate(cdp, `(() => {
      const visible=node=>{if(!node)return false;const style=getComputedStyle(node),rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;};
      const scroller=document.querySelector('.day-time-grid');
      const visibleLanes=Array.from(document.querySelectorAll('.day-view .lane[data-staff-id]')).filter(visible);
      const controls=Array.from(document.querySelectorAll('[data-phone-calendar-v2-controls] summary')).filter(visible);
      const timeColumn=document.querySelector('.day-view .lane[data-phone-active-practitioner="true"] .time-column');
      return {
        viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
        rootScrollWidth:document.documentElement.scrollWidth,
        visibleLaneCount:visibleLanes.length,
        visibleLaneStaffIds:visibleLanes.map(node=>node.dataset.staffId),
        laneWidth:visibleLanes[0]?.getBoundingClientRect().width||0,
        scrollerClientWidth:scroller?.clientWidth||0,
        scrollerScrollWidth:scroller?.scrollWidth||0,
        timeColumnHeight:timeColumn?.getBoundingClientRect().height||0,
        activeStaffId:document.body.dataset.phoneActiveStaffId||'',
        activeStaffName:document.querySelector('[data-phone-active-staff]')?.textContent.trim()||'',
        controlsVisible:visible(document.querySelector('[data-phone-calendar-v2-controls]')),
        minControlHeight:controls.length?Math.min(...controls.map(node=>node.getBoundingClientRect().height)):0,
        legacyControlsVisible:visible(document.querySelector('.controls')),
        legacyAvailabilityVisible:Array.from(document.querySelectorAll('.lane-actions,.availability-menu')).some(visible),
        bookingSlotPointerEvents:getComputedStyle(document.querySelector('[data-calendar-booking-slot]')).pointerEvents,
      };
    })()`);
    assert.deepEqual(dayMetrics.viewport, { width: 390, height: 844, screenWidth: 390, screenHeight: 844 });
    assert.ok(dayMetrics.rootScrollWidth <= 391, 'Phone Day leaked horizontal overflow');
    assert.equal(dayMetrics.visibleLaneCount, 1);
    assert.deepEqual(dayMetrics.visibleLaneStaffIds, ['52']);
    assert.ok(dayMetrics.laneWidth >= 340, `Phone Day active practitioner lane is unexpectedly narrow: ${dayMetrics.laneWidth}px`);
    assert.ok(dayMetrics.scrollerScrollWidth <= dayMetrics.scrollerClientWidth + 2, 'Phone Day still horizontally pans between practitioners');
    assert.ok(dayMetrics.timeColumnHeight >= 778 && dayMetrics.timeColumnHeight <= 782, `Phone Day does not use the 60px/hour compact grid: ${dayMetrics.timeColumnHeight}px`);
    assert.equal(dayMetrics.activeStaffId, '52');
    assert.equal(dayMetrics.activeStaffName, 'Birch Room');
    assert.equal(dayMetrics.controlsVisible, true);
    assert.ok(dayMetrics.minControlHeight >= 44, 'Phone Calendar compact selector is below 44px');
    assert.equal(dayMetrics.legacyControlsVisible, false);
    assert.equal(dayMetrics.legacyAvailabilityVisible, false);
    assert.equal(dayMetrics.bookingSlotPointerEvents, 'none');
    screenshots.push({ ...(await capture('phone-day-one-active-practitioner')), viewport: dayMetrics.viewport, metrics: dayMetrics });

    await evaluate(cdp, `(() => {
      const column=document.querySelector('.day-view .lane[data-phone-active-practitioner="true"] .time-column');
      const rect=column.getBoundingClientRect();
      column.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rect.left+Math.max(4,rect.width/2),clientY:rect.top+1,button:0}));
      return true;
    })()`);
    await poll(() => evaluate(cdp, 'location.pathname'), value => value === '/calendar/book');
    const dayPrefill = await evaluate(cdp, `(() => ({
      date:document.querySelector('#booking-date')?.value||'',
      time:document.querySelector('#booking-time')?.value||'',
      staffId:Number(document.querySelector('#staff-select')?.value||0),
      prefill:JSON.parse(document.querySelector('#calendar-booking-options')?.textContent||'{}').prefill,
    }))()`);
    assert.equal(dayPrefill.date, DATE_KEY);
    assert.equal(dayPrefill.time, '07:00');
    assert.deepEqual(dayPrefill.prefill, { date: DATE_KEY, time: '07:00', staffId: 52 });
    screenshots.push({ ...(await capture('phone-day-empty-time-prefill')), viewport: { width: 390, height: 844 }, metrics: dayPrefill });

    await navigate(`${origin}/calendar/read-only?view=week&date=${DATE_KEY}&staff=51&staff=52&staff=53&activeStaff=51`, '.week-grid');
    await poll(() => evaluate(cdp, `document.querySelector('[data-phone-week-practitioner]')?.dataset.phoneWeekPractitioner`), value => value === '51');
    const weekMetrics = await evaluate(cdp, `(() => {
      const visible=node=>{if(!node)return false;const style=getComputedStyle(node),rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;};
      const scroller=document.querySelector('.week-time-grid');
      const grid=document.querySelector('.week-grid');
      const lanes=Array.from(document.querySelectorAll('[data-week-practitioner-lane]'));
      const visibleLanes=lanes.filter(visible);
      const strip=document.querySelector('[data-phone-week-practitioner]');
      const oneHour=document.querySelector('[data-event-id="appointment-9801"]')?.closest('.positioned-event');
      const twoHours=document.querySelector('[data-event-id="appointment-9804"]')?.closest('.positioned-event');
      const plus=document.querySelector('.phone-plus-menu>summary');
      const today=document.querySelector('.phone-today-fab');
      const menuToggle=document.querySelector('[data-workspace-drawer-toggle]');
      const calendar=document.querySelector('.week-time-grid');
      const frame=document.querySelector('.workspace-frame');
      const activeColumn=document.querySelector('[data-week-practitioner-lane][data-active-practitioner="true"] .time-column');
      return {
        viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
        rootScrollWidth:document.documentElement.scrollWidth,
        weekColumns:getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
        weekScrollerClientWidth:scroller?.clientWidth||0,
        weekScrollerScrollWidth:scroller?.scrollWidth||0,
        firstDayWidth:visibleLanes[0]?.getBoundingClientRect().width||0,
        visibleDayColumns:visibleLanes.length,
        visibleStaffIds:Array.from(new Set(visibleLanes.map(node=>node.dataset.staffId))),
        allStaffIds:Array.from(new Set(lanes.map(node=>node.dataset.staffId))),
        sundayColumns:Array.from(document.querySelectorAll('.week-day')).filter(node=>new Date(node.dataset.date+'T12:00:00Z').getUTCDay()===0).length,
        stripVisible:visible(strip),
        stripStaffId:strip?.dataset.phoneWeekPractitioner||'',
        stripName:strip?.textContent.trim()||'',
        activeStaffName:document.querySelector('[data-phone-active-staff]')?.textContent.trim()||'',
        currentView:document.querySelector('.phone-view-menu>summary strong')?.textContent.trim()||'',
        timeColumnHeight:activeColumn?.getBoundingClientRect().height||0,
        oneHourHeight:oneHour?.getBoundingClientRect().height||0,
        twoHourHeight:twoHours?.getBoundingClientRect().height||0,
        oneHourTop:oneHour?parseFloat(getComputedStyle(oneHour).top):null,
        plusVisible:visible(plus),
        plusWidth:plus?.getBoundingClientRect().width||0,
        plusHeight:plus?.getBoundingClientRect().height||0,
        todayVisible:visible(today),
        todayHeight:today?.getBoundingClientRect().height||0,
        drawerOpen:Boolean(document.querySelector('[data-workspace-navigation-drawer]')?.classList.contains('open')),
        drawerRight:document.querySelector('[data-workspace-navigation-drawer]')?.getBoundingClientRect().right||0,
        menuToggleHeight:menuToggle?.getBoundingClientRect().height||0,
        framePaddingBottom:frame?parseFloat(getComputedStyle(frame).paddingBottom)||0:0,
        calendarViewportShare:calendar?Number(((innerHeight-calendar.getBoundingClientRect().top)/innerHeight).toFixed(3)):0,
      };
    })()`);
    assert.deepEqual(weekMetrics.viewport, { width: 390, height: 844, screenWidth: 390, screenHeight: 844 });
    assert.ok(weekMetrics.rootScrollWidth <= 391, 'Phone Week leaked horizontal overflow');
    assert.equal(weekMetrics.weekColumns, 6);
    assert.ok(weekMetrics.firstDayWidth >= 48, `Phone Week day column collapsed below readable compact width: ${weekMetrics.firstDayWidth}px`);
    assert.ok(weekMetrics.weekScrollerScrollWidth <= weekMetrics.weekScrollerClientWidth + 2, 'Phone Week still requires horizontal day panning');
    assert.equal(weekMetrics.visibleDayColumns, 6);
    assert.deepEqual(weekMetrics.visibleStaffIds, ['51']);
    assert.deepEqual(weekMetrics.allStaffIds, ['51', '52', '53']);
    assert.equal(weekMetrics.sundayColumns, 0);
    assert.equal(weekMetrics.stripVisible, true);
    assert.equal(weekMetrics.stripStaffId, '51');
    assert.match(weekMetrics.stripName, /Amber Room/);
    assert.equal(weekMetrics.activeStaffName, 'Amber Room');
    assert.equal(weekMetrics.currentView, 'Week');
    assert.ok(weekMetrics.timeColumnHeight >= 778 && weekMetrics.timeColumnHeight <= 782, 'Phone Week does not use 30-minute compact cadence');
    assert.ok(weekMetrics.oneHourTop >= 59 && weekMetrics.oneHourTop <= 61, `08:00 event is not anchored to the 60px/hour grid: ${weekMetrics.oneHourTop}px`);
    assert.ok(weekMetrics.oneHourHeight >= 59 && weekMetrics.oneHourHeight <= 61, `One-hour event height is not duration-true: ${weekMetrics.oneHourHeight}px`);
    assert.ok(weekMetrics.twoHourHeight >= 118 && weekMetrics.twoHourHeight <= 122, `Two-hour event height is not duration-true: ${weekMetrics.twoHourHeight}px`);
    assert.equal(weekMetrics.plusVisible, true);
    assert.ok(weekMetrics.plusWidth >= 44 && weekMetrics.plusHeight >= 44, 'Phone + launcher is below 44px');
    assert.equal(weekMetrics.todayVisible, true);
    assert.ok(weekMetrics.todayHeight >= 44, 'Phone Today control is below 44px');
    assert.equal(weekMetrics.drawerOpen, false);
    assert.ok(weekMetrics.drawerRight <= 1, 'Closed Phone drawer remains on-screen');
    assert.ok(weekMetrics.menuToggleHeight >= 44, 'Phone menu toggle is below 44px');
    assert.equal(weekMetrics.framePaddingBottom, 0, 'Phone shell still reserves persistent bottom-navigation space');
    assert.ok(weekMetrics.calendarViewportShare >= 0.82, `Phone Week calendar receives only ${weekMetrics.calendarViewportShare * 100}% of the viewport`);
    screenshots.push({ ...(await capture('phone-week-six-days-one-practitioner')), viewport: weekMetrics.viewport, metrics: weekMetrics });

    await evaluate(cdp, `document.querySelector('.phone-plus-menu>summary').click();true`);
    await poll(() => evaluate(cdp, `document.querySelector('.phone-plus-menu')?.open`), Boolean);
    const plusMetrics = await evaluate(cdp, `(() => {
      const visible=node=>{if(!node)return false;const style=getComputedStyle(node),rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;};
      const targets=Array.from(document.querySelectorAll('.phone-plus-popover>a,.phone-plus-popover button')).filter(visible);
      return {labels:targets.map(node=>node.textContent.trim()),minHeight:Math.min(...targets.map(node=>node.getBoundingClientRect().height))};
    })()`);
    assert.deepEqual(plusMetrics.labels, ['Appointment', 'Block time', 'Time off']);
    assert.ok(plusMetrics.minHeight >= 44, 'Phone + action target is below 44px');
    screenshots.push({ ...(await capture('phone-plus-actions')), viewport: { width: 390, height: 844 }, metrics: plusMetrics });
    await evaluate(cdp, `document.querySelector('.phone-plus-menu>summary').click();true`);

    await evaluate(cdp, `document.querySelector('[data-workspace-drawer-toggle]').click();true`);
    await poll(() => evaluate(cdp, `document.querySelector('[data-workspace-navigation-drawer]').classList.contains('open')`), Boolean);
    const drawerMetrics = await evaluate(cdp, `(() => {
      const visible=node=>{if(!node)return false;const style=getComputedStyle(node),rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0&&rect.right>0;};
      const drawer=document.querySelector('[data-workspace-navigation-drawer]');
      const destinations=Array.from(drawer.querySelectorAll('[data-workspace-destination]')).filter(visible);
      return {
        width:drawer.getBoundingClientRect().width,
        labels:destinations.map(node=>node.textContent.trim()),
        minHeight:Math.min(...destinations.map(node=>node.getBoundingClientRect().height)),
        moreVisible:visible(drawer.querySelector('[data-workspace-more-toggle]')),
        current:drawer.querySelector('[aria-current="page"]')?.textContent.trim()||'',
        rootScrollWidth:document.documentElement.scrollWidth,
      };
    })()`);
    assert.ok(drawerMetrics.width <= 261, `Phone drawer is wider than the compact #725 contract: ${drawerMetrics.width}px`);
    assert.deepEqual(drawerMetrics.labels, ['Dashboard', 'Calendar', 'Clients', 'Messages', 'Staff', 'Services', 'Reports']);
    assert.ok(drawerMetrics.minHeight >= 44, 'Phone drawer destination is below 44px');
    assert.equal(drawerMetrics.moreVisible, false);
    assert.equal(drawerMetrics.current, 'Calendar');
    assert.ok(drawerMetrics.rootScrollWidth <= 391);
    screenshots.push({ ...(await capture('phone-compact-direct-drawer')), viewport: { width: 390, height: 844 }, metrics: drawerMetrics });
    await evaluate(cdp, `document.querySelector('[data-workspace-drawer-close]').click();true`);
    await poll(() => evaluate(cdp, `!document.querySelector('[data-workspace-navigation-drawer]').classList.contains('open')`), Boolean);

    await evaluate(cdp, `document.querySelector('.phone-staff-menu>summary').click();true`);
    await poll(() => evaluate(cdp, `document.querySelector('.phone-staff-menu')?.open`), Boolean);
    screenshots.push({ ...(await capture('phone-practitioner-switcher')), viewport: { width: 390, height: 844 } });
    await evaluate(cdp, `document.querySelector('[data-phone-staff-id="52"]').click();true`);
    await poll(() => evaluate(cdp, `new URL(location.href).searchParams.get('activeStaff')`), value => value === '52');
    await poll(() => evaluate(cdp, `document.querySelector('[data-phone-week-practitioner]')?.dataset.phoneWeekPractitioner`), value => value === '52');
    const switchedMetrics = await evaluate(cdp, `(() => ({
      activeStaff:document.body.dataset.phoneActiveStaffId||'',
      stripName:document.querySelector('[data-phone-week-practitioner]')?.textContent.trim()||'',
      visibleStaffIds:Array.from(new Set(Array.from(document.querySelectorAll('[data-week-practitioner-lane]')).filter(node=>getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0).map(node=>node.dataset.staffId))),
      visibleDays:Array.from(document.querySelectorAll('[data-week-practitioner-lane]')).filter(node=>getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0).length,
    }))()`);
    assert.equal(switchedMetrics.activeStaff, '52');
    assert.match(switchedMetrics.stripName, /Birch Room/);
    assert.deepEqual(switchedMetrics.visibleStaffIds, ['52']);
    assert.equal(switchedMetrics.visibleDays, 6);
    screenshots.push({ ...(await capture('phone-week-switched-practitioner')), viewport: { width: 390, height: 844 }, metrics: switchedMetrics });

    await evaluate(cdp, `(() => {
      const column=document.querySelector('[data-week-practitioner-lane][data-date="2026-09-07"][data-staff-id="52"] .time-column');
      const rect=column.getBoundingClientRect();
      column.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rect.left+Math.max(2,rect.width/2),clientY:rect.top+240,button:0}));
      return true;
    })()`);
    await poll(() => evaluate(cdp, 'location.pathname'), value => value === '/calendar/book');
    const weekPrefill = await evaluate(cdp, `(() => ({
      date:document.querySelector('#booking-date')?.value||'',
      time:document.querySelector('#booking-time')?.value||'',
      prefill:JSON.parse(document.querySelector('#calendar-booking-options')?.textContent||'{}').prefill,
    }))()`);
    assert.equal(weekPrefill.date, '2026-09-07');
    assert.equal(weekPrefill.time, '11:00');
    assert.deepEqual(weekPrefill.prefill, { date: '2026-09-07', time: '11:00', staffId: 52 });
    screenshots.push({ ...(await capture('phone-week-empty-time-prefill')), viewport: { width: 390, height: 844 }, metrics: weekPrefill });

    await navigate(`${origin}/calendar/read-only?view=week&date=${DATE_KEY}&staff=51&staff=52&staff=53&activeStaff=51`, '.week-grid');
    await evaluate(cdp, `document.querySelector('[data-event-id="appointment-9804"] [data-calendar-operation="manage-appointment"]').click();true`);
    await poll(() => evaluate(cdp, `document.querySelector('[data-calendar-management-panel]')?.open`), Boolean);
    screenshots.push({ ...(await capture('phone-appointment-manage-sheet')), viewport: { width: 390, height: 844 } });
    await evaluate(cdp, `document.querySelector('[data-panel-close]').click();true`);

    await navigate(`${origin}/calendar/read-only?view=month&date=${DATE_KEY}&staff=51&activeStaff=51`, '.month-grid');
    await poll(() => evaluate(cdp, `document.querySelectorAll('.phone-month-density').length`), value => value > 0);
    const monthMetrics = await evaluate(cdp, `(() => {
      const visible=node=>{if(!node)return false;const style=getComputedStyle(node),rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;};
      const dayLinks=Array.from(document.querySelectorAll('.month-day-link')).filter(visible);
      return {
        viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
        rootScrollWidth:document.documentElement.scrollWidth,
        activeStaff:document.querySelector('[data-phone-active-staff]')?.textContent.trim()||'',
        currentView:document.querySelector('.phone-view-menu>summary strong')?.textContent.trim()||'',
        densityCount:document.querySelectorAll('.phone-month-density').length,
        visibleAppointmentCards:Array.from(document.querySelectorAll('.month-events .event-card')).filter(visible).length,
        minDateTargetHeight:Math.min(...dayLinks.map(node=>node.getBoundingClientRect().height)),
        sundayCells:Array.from(document.querySelectorAll('.month-day')).filter(node=>new Date(node.dataset.date+'T12:00:00Z').getUTCDay()===0).length,
        links:dayLinks.map(node=>node.getAttribute('href')),
      };
    })()`);
    assert.deepEqual(monthMetrics.viewport, { width: 390, height: 844, screenWidth: 390, screenHeight: 844 });
    assert.ok(monthMetrics.rootScrollWidth <= 391, 'Phone Month leaked horizontal overflow');
    assert.equal(monthMetrics.activeStaff, 'Amber Room');
    assert.equal(monthMetrics.currentView, 'Month');
    assert.ok(monthMetrics.densityCount > 0, 'Phone Month has no density indicators');
    assert.equal(monthMetrics.visibleAppointmentCards, 0);
    assert.ok(monthMetrics.minDateTargetHeight >= 44, 'Phone Month date target is below 44px');
    assert.equal(monthMetrics.sundayCells, 0);
    assert.ok(monthMetrics.links.every(href => href.includes('staff=51') && href.includes('activeStaff=51')), 'Phone Month date navigation did not preserve active practitioner context');
    screenshots.push({ ...(await capture('phone-month-readable-density')), viewport: monthMetrics.viewport, metrics: monthMetrics });

    assert.deepEqual(browserExceptions, []);
    assert.deepEqual(externalRequests, []);
    assert.ok(state.authenticatedCalendarReads >= 4);
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
      authority: 'Existing CalendarReadOnlyUx and canonical booking/manage authority with #725 Phone Calendar V2 presentation only',
      productionReads: 0,
      productionMutations: 0,
      providerNetworkCalls: 0,
      senderCalls: 0,
      realClientSends: 0,
      screenshots,
    };
    fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Authenticated Phone Calendar V2 proof passed: ${screenshots.length} screenshots at ${exactHead}`);
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
