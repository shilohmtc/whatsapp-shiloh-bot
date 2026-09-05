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
  throw new Error('Timed out waiting for authenticated Calendar-first Phone booking proof');
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

const METRICS = `(() => {
  const visible = node => { if (!node) return false; const style=getComputedStyle(node),rect=node.getBoundingClientRect(); return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0; };
  const weekGrid=document.querySelector('.week-grid');
  const weekScroller=document.querySelector('.week-time-grid');
  const rail=document.querySelector('.time-rail');
  const events=Array.from(document.querySelectorAll('.week-view .positioned-event'));
  const shared=document.querySelector('[data-event-id="appointment-9804"]');
  const oneHour=document.querySelector('[data-event-id="appointment-9801"]')?.closest('.positioned-event');
  const twoHours=shared?.closest('.positioned-event');
  const manage=shared?.querySelector('[data-calendar-operation="manage-appointment"]');
  const nav=document.querySelector('.workspace-nav');
  const frame=document.querySelector('.workspace-frame');
  const navTargets=Array.from(document.querySelectorAll('.workspace-nav a,.workspace-nav button')).filter(visible);
  const weekLanes=Array.from(document.querySelectorAll('[data-week-practitioner-lane]'));
  const visibleWeekLanes=weekLanes.filter(visible);
  const practitionerHeaders=Array.from(document.querySelectorAll('[data-week-practitioner-name]')).filter(visible);
  const calendar=document.querySelector('.week-time-grid,.day-time-grid,.month-grid');
  const menuToggle=document.querySelector('[data-workspace-drawer-toggle]');
  return {
    viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
    rootScrollWidth:document.documentElement.scrollWidth,
    weekScrollerClientWidth:weekScroller?.clientWidth||0,
    weekScrollerScrollWidth:weekScroller?.scrollWidth||0,
    weekScrollerScrollLeft:weekScroller?.scrollLeft||0,
    firstDayWidth:visibleWeekLanes[0]?.getBoundingClientRect().width||0,
    weekColumns:weekGrid?getComputedStyle(weekGrid).gridTemplateColumns.split(' ').filter(Boolean).length:0,
    dayColumns:document.querySelectorAll('.week-day').length,
    visibleDayColumns:visibleWeekLanes.length,
    uniqueWeekDates:Array.from(new Set(weekLanes.map(node=>node.dataset.date))).length,
    weekPractitionerHeaderCount:practitionerHeaders.length,
    weekPractitionerHeaders:practitionerHeaders.map(node=>node.textContent.trim()),
    weekLaneStaffIds:Array.from(new Set(weekLanes.map(node=>node.dataset.staffId))),
    visibleWeekLaneStaffIds:Array.from(new Set(visibleWeekLanes.map(node=>node.dataset.staffId))),
    sundayColumns:Array.from(document.querySelectorAll('.week-day')).filter(node=>new Date(node.dataset.date+'T12:00:00Z').getUTCDay()===0).length,
    timeRailVisible:visible(rail),
    firstEventPosition:events.length?getComputedStyle(events[0]).position:null,
    firstEventTop:events.length?parseFloat(getComputedStyle(events[0]).top):null,
    oneHourHeight:oneHour?.getBoundingClientRect().height||0,
    twoHourHeight:twoHours?.getBoundingClientRect().height||0,
    sharedCopies:document.querySelectorAll('[data-event-id="appointment-9804"]').length,
    peopleContextPresent:Boolean(document.querySelector('[data-view-practitioner-context]')),
    peopleSummary:document.querySelector('[data-people-selection-summary]')?.textContent.trim()||'',
    visibleViewOptions:Array.from(document.querySelectorAll('[data-calendar-view-option]')).filter(visible).map(node=>node.dataset.calendarViewOption),
    viewLinks:Array.from(document.querySelectorAll('[data-calendar-view-option]')).map(node=>node.getAttribute('href')),
    bookingSlots:document.querySelectorAll('[data-calendar-booking-slot]').length,
    practitionerOwnership:shared?.querySelector('.event-practitioners')?.getAttribute('aria-label')||'',
    overlapLayout:weekGrid?.getAttribute('data-week-overlap-layout')||'',
    manageOpacity:manage?parseFloat(getComputedStyle(manage).opacity):null,
    manageWidth:manage?.getBoundingClientRect().width||0,
    manageHeight:manage?.getBoundingClientRect().height||0,
    managementOpen:Boolean(document.querySelector('[data-calendar-management-panel]')?.open),
    peoplePickerOpen:Boolean(document.querySelector('[data-people-picker]')?.open),
    activePractitionerId:document.querySelector('[data-compact-week-active-staff]')?.dataset.compactWeekActiveStaff||'',
    activePractitionerName:document.querySelector('[data-compact-week-active-staff]')?.textContent.trim()||'',
    practitionerPickerVisible:visible(document.querySelector('[data-compact-week-practitioner-picker]')),
    drawerOpen:Boolean(nav?.classList.contains('open')),
    drawerLeft:nav?.getBoundingClientRect().left||0,
    drawerRight:nav?.getBoundingClientRect().right||0,
    menuToggleHeight:menuToggle?.getBoundingClientRect().height||0,
    calendarTop:calendar?.getBoundingClientRect().top||0,
    calendarViewportShare:calendar?Number(((innerHeight-calendar.getBoundingClientRect().top)/innerHeight).toFixed(3)):0,
    framePaddingBottom:frame?parseFloat(getComputedStyle(frame).paddingBottom)||0:0,
    minNavTargetHeight:navTargets.length?Math.min(...navTargets.map(node=>node.getBoundingClientRect().height)):0,
  };
})()`;

async function main() {
  const executable = chromeExecutable();
  if (!executable) {
    if (process.env.CI) throw new Error('CI must provide Chrome for authenticated Calendar-first Phone booking proof');
    console.log('Chrome not installed; authenticated Calendar-first Phone booking proof is CI-only.');
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

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false, screenWidth: 1440, screenHeight: 1000 });
    await cdp.send('Page.navigate', { url: `${origin}/proof` });
    await poll(() => evaluate(cdp, 'location.pathname'), value => value === '/calendar/read-only');
    await poll(() => evaluate(cdp, `document.querySelector('.week-grid')?.getAttribute('data-week-overlap-layout')`), value => value === 'desktop');
    const desktopMetrics = await evaluate(cdp, METRICS);
    assert.equal(desktopMetrics.weekColumns, 18);
    assert.equal(desktopMetrics.dayColumns, 18);
    assert.equal(desktopMetrics.uniqueWeekDates, 6);
    assert.equal(desktopMetrics.weekPractitionerHeaderCount, 18);
    assert.deepEqual(desktopMetrics.weekLaneStaffIds, ['51', '52', '53']);
    assert.equal(desktopMetrics.sundayColumns, 0);
    assert.equal(desktopMetrics.peopleContextPresent, true);
    assert.equal(desktopMetrics.peopleSummary, 'All staff');
    assert.equal(desktopMetrics.sharedCopies, 1);
    assert.match(desktopMetrics.practitionerOwnership, /Amber Room \+ Birch Room/);
    assert.equal(desktopMetrics.firstEventPosition, 'absolute');
    assert.equal(desktopMetrics.bookingSlots, 234);
    const screenshots = [{ ...(await capture('desktop-week-multiple-practitioners')), viewport: { width: 1440, height: 1000 }, metrics: desktopMetrics }];

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: 844 });
    await navigate(`${origin}/calendar/read-only?view=day&date=${DATE_KEY}&staff=51&staff=52`, '.day-time-grid');
    const dayMetrics = await evaluate(cdp, `(() => {
      const scroller=document.querySelector('.day-time-grid');
      const lanes=Array.from(document.querySelectorAll('.day-view .lane'));
      const links=Array.from(document.querySelectorAll('[data-calendar-view-option]')).map(node=>node.getAttribute('href'));
      return {
        viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
        rootScrollWidth:document.documentElement.scrollWidth,
        laneCount:lanes.length,
        minLaneWidth:lanes.length?Math.min(...lanes.map(node=>node.getBoundingClientRect().width)):0,
        scrollerClientWidth:scroller?.clientWidth||0,
        scrollerScrollWidth:scroller?.scrollWidth||0,
        peopleSummary:document.querySelector('[data-people-selection-summary]')?.textContent.trim()||'',
        viewLinks:links,
        bookingSlots:document.querySelectorAll('[data-calendar-booking-slot]').length,
        minBookingSlotHeight:Math.min(...Array.from(document.querySelectorAll('[data-calendar-booking-slot]')).map(node=>node.getBoundingClientRect().height)),
        operationStatusText:document.querySelector('[data-calendar-operation-status]')?.textContent.trim()||'',
        operationStatusDisplay:document.querySelector('[data-calendar-operation-status]')?getComputedStyle(document.querySelector('[data-calendar-operation-status]')).display:'',
        panelHintPresent:Boolean(document.querySelector('.panel-hint')),
      };
    })()`);
    assert.deepEqual(dayMetrics.viewport, { width: 390, height: 844, screenWidth: 390, screenHeight: 844 });
    assert.ok(dayMetrics.rootScrollWidth <= 391, 'Phone Day leaked horizontal overflow to the page');
    assert.equal(dayMetrics.laneCount, 2);
    assert.ok(dayMetrics.minLaneWidth >= 200 && dayMetrics.minLaneWidth <= 220, 'Phone Day practitioner lane did not use compact density');
    assert.ok(dayMetrics.scrollerScrollWidth > dayMetrics.scrollerClientWidth, 'Phone Day multi-practitioner lanes do not pan');
    assert.ok(dayMetrics.scrollerScrollWidth <= 470, 'Phone Day still requires excessive horizontal travel between two practitioner lanes');
    assert.equal(dayMetrics.operationStatusText, '');
    assert.equal(dayMetrics.operationStatusDisplay, 'none');
    assert.equal(dayMetrics.panelHintPresent, false);
    assert.equal(dayMetrics.peopleSummary, '2 staff');
    assert.ok(dayMetrics.viewLinks.every(href => href.includes('staff=51') && href.includes('staff=52')), 'People state was not preserved across Day/Week/Agenda/Month links');
    assert.equal(dayMetrics.bookingSlots, 26);
    assert.ok(dayMetrics.minBookingSlotHeight >= 44, 'Phone empty-time target is below 44px');
    screenshots.push({ ...(await capture('phone-day-calendar-first-two-people')), viewport: { width: 390, height: 844 }, metrics: dayMetrics });

    await evaluate(cdp, `document.querySelector('.day-view .lane[data-staff-id="52"] [data-calendar-booking-slot][data-time="07:00"]').click();true`);
    await poll(() => evaluate(cdp, 'location.pathname'), value => value === '/calendar/book');
    await poll(() => evaluate(cdp, 'document.readyState'), value => value === 'complete');
    const bookingPrefillMetrics = await evaluate(cdp, `(() => ({
      viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
      date:document.querySelector('#booking-date')?.value||'',
      time:document.querySelector('#booking-time')?.value||'',
      prefill:JSON.parse(document.querySelector('#calendar-booking-options')?.textContent||'{}').prefill,
      backHref:document.querySelector('[data-back-calendar]')?.getAttribute('href')||'',
    }))()`);
    assert.equal(bookingPrefillMetrics.date, DATE_KEY);
    assert.equal(bookingPrefillMetrics.time, '07:00');
    assert.deepEqual(bookingPrefillMetrics.prefill, { date: DATE_KEY, time: '07:00', staffId: 52 });
    assert.match(bookingPrefillMetrics.backHref, /staff=52/);
    screenshots.push({ ...(await capture('phone-empty-slot-create-booking-prefill')), viewport: { width: 390, height: 844 }, metrics: bookingPrefillMetrics });

    await navigate(`${origin}/calendar/read-only?view=week&date=${DATE_KEY}&staff=51&staff=52&staff=53`, '.week-grid');
    await poll(() => evaluate(cdp, `document.querySelector('.week-grid')?.getAttribute('data-week-overlap-layout')`), Boolean);
    const phoneMetrics = await evaluate(cdp, METRICS);
    assert.deepEqual(phoneMetrics.viewport, { width: 390, height: 844, screenWidth: 390, screenHeight: 844 });
    assert.ok(phoneMetrics.rootScrollWidth <= 391, 'Phone Week leaked horizontal overflow to the page');
    assert.equal(phoneMetrics.weekColumns, 6);
    assert.ok(phoneMetrics.firstDayWidth >= 170, 'Phone Week day column is not readable');
    assert.ok(phoneMetrics.weekScrollerScrollWidth > phoneMetrics.weekScrollerClientWidth * 2, 'Phone Week is not an intentional horizontal calendar scroller');
    assert.equal(phoneMetrics.dayColumns, 18);
    assert.equal(phoneMetrics.visibleDayColumns, 6);
    assert.equal(phoneMetrics.uniqueWeekDates, 6);
    assert.equal(phoneMetrics.weekPractitionerHeaderCount, 0);
    assert.deepEqual(phoneMetrics.weekLaneStaffIds, ['51', '52', '53']);
    assert.deepEqual(phoneMetrics.visibleWeekLaneStaffIds, ['51']);
    assert.equal(phoneMetrics.activePractitionerId, '51');
    assert.equal(phoneMetrics.activePractitionerName, 'Amber Room');
    assert.equal(phoneMetrics.practitionerPickerVisible, true);
    assert.equal(phoneMetrics.sundayColumns, 0);
    assert.equal(phoneMetrics.timeRailVisible, true);
    assert.equal(phoneMetrics.firstEventPosition, 'absolute');
    assert.equal(phoneMetrics.firstEventTop, 72);
    assert.ok(phoneMetrics.twoHourHeight > phoneMetrics.oneHourHeight * 1.7, 'Phone event height did not preserve canonical duration');
    assert.equal(phoneMetrics.peopleContextPresent, true);
    assert.equal(phoneMetrics.peopleSummary, 'All staff');
    assert.equal(phoneMetrics.sharedCopies, 1);
    assert.match(phoneMetrics.practitionerOwnership, /Amber Room \+ Birch Room/);
    assert.equal(phoneMetrics.overlapLayout, 'phone');
    assert.deepEqual(phoneMetrics.visibleViewOptions, ['day', 'week', 'month']);
    assert.ok(phoneMetrics.viewLinks.every(href => href.includes('staff=51') && href.includes('staff=52') && href.includes('staff=53')), 'People state was not preserved from Week to other views');
    assert.equal(phoneMetrics.bookingSlots, 234);
    assert.equal(phoneMetrics.manageOpacity, 0);
    assert.ok(phoneMetrics.manageWidth >= 44 && phoneMetrics.manageHeight >= 44, 'Phone event management target is below 44px');
    assert.equal(phoneMetrics.drawerOpen, false);
    assert.ok(phoneMetrics.drawerRight <= 1, 'Closed Phone navigation drawer remains on-screen');
    assert.ok(phoneMetrics.menuToggleHeight >= 44, 'Phone menu target is below 44px');
    assert.equal(phoneMetrics.framePaddingBottom, 0, 'Persistent Phone bottom navigation still reserves space');
    assert.ok(phoneMetrics.calendarViewportShare >= 0.70, `Phone Week calendar receives only ${phoneMetrics.calendarViewportShare * 100}% of the viewport`);
    screenshots.push({ ...(await capture('phone-week-active-practitioner-mon-sat')), viewport: { width: 390, height: 844 }, metrics: phoneMetrics });

    await evaluate(cdp, `document.querySelector('[data-workspace-drawer-toggle]').click();true`);
    await poll(() => evaluate(cdp, `document.querySelector('[data-workspace-navigation-drawer]').classList.contains('open')`), Boolean);
    await poll(() => evaluate(cdp, `document.querySelector('[data-workspace-navigation-drawer]').getBoundingClientRect().left`), value => value >= -1);
    const drawerMetrics = await evaluate(cdp, `(() => {
      const visible=node=>{if(!node)return false;const style=getComputedStyle(node),rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0&&rect.right>0;};
      return {
        open:document.querySelector('[data-workspace-navigation-drawer]')?.classList.contains('open')||false,
        topLevel:Array.from(document.querySelectorAll('.workspace-primary-links>[data-workspace-destination],.workspace-links>[data-workspace-more-toggle]')).filter(visible).map(node=>node.textContent.trim()),
        current:document.querySelector('.workspace-primary-links [aria-current="page"]')?.textContent.trim()||'',
        minTargetHeight:Math.min(...Array.from(document.querySelectorAll('.workspace-primary-links>[data-workspace-destination],.workspace-links>[data-workspace-more-toggle]')).filter(visible).map(node=>node.getBoundingClientRect().height)),
        rootScrollWidth:document.documentElement.scrollWidth,
      };
    })()`);
    assert.equal(drawerMetrics.open, true);
    assert.deepEqual(drawerMetrics.topLevel, ['Dashboard', 'Calendar', 'Clients', 'Messages', 'More']);
    assert.equal(drawerMetrics.current, 'Calendar');
    assert.ok(drawerMetrics.minTargetHeight >= 44);
    assert.ok(drawerMetrics.rootScrollWidth <= 391);
    screenshots.push({ ...(await capture('phone-hidden-left-navigation-drawer')), viewport: { width: 390, height: 844 }, metrics: drawerMetrics });
    await evaluate(cdp, `document.querySelector('[data-workspace-drawer-close]').click();true`);
    await poll(() => evaluate(cdp, `!document.querySelector('[data-workspace-navigation-drawer]').classList.contains('open')`), Boolean);
    await poll(() => evaluate(cdp, `document.querySelector('[data-workspace-navigation-drawer]').getBoundingClientRect().right`), value => value <= 1);

    await evaluate(cdp, `document.querySelector('.week-time-grid').scrollLeft=484;true`);
    await poll(() => evaluate(cdp, `document.querySelector('.week-time-grid').scrollLeft`), value => value >= 400);
    const pannedWeekMetrics = await evaluate(cdp, METRICS);
    assert.ok(pannedWeekMetrics.weekScrollerScrollLeft >= 400);
    screenshots.push({ ...(await capture('phone-week-panned-later-days')), viewport: { width: 390, height: 844 }, metrics: pannedWeekMetrics });

    await evaluate(cdp, `document.querySelector('[data-people-picker] summary').click();true`);
    await poll(() => evaluate(cdp, `document.querySelector('[data-people-picker]').open`), Boolean);
    const peopleOpenMetrics = await evaluate(cdp, METRICS);
    assert.equal(peopleOpenMetrics.peoplePickerOpen, true);
    screenshots.push({ ...(await capture('phone-people-selector-open')), viewport: { width: 390, height: 844 }, metrics: peopleOpenMetrics });
    await evaluate(cdp, `document.querySelector('[data-people-picker] summary').click();true`);

    await evaluate(cdp, `document.querySelector('[data-compact-week-practitioner-picker] summary').click();true`);
    await poll(() => evaluate(cdp, `document.querySelector('[data-compact-week-practitioner-picker]').open`), Boolean);
    screenshots.push({ ...(await capture('phone-active-practitioner-switcher')), viewport: { width: 390, height: 844 } });
    await evaluate(cdp, `document.querySelector('[data-compact-week-practitioner-option="52"]').click();true`);
    await poll(() => evaluate(cdp, `new URL(location.href).searchParams.get('activeStaff')`), value => value === '52');
    await poll(() => evaluate(cdp, `document.querySelector('.week-grid')?.getAttribute('data-week-overlap-layout')`), Boolean);
    const switchedMetrics = await evaluate(cdp, METRICS);
    assert.equal(switchedMetrics.activePractitionerId, '52');
    assert.equal(switchedMetrics.activePractitionerName, 'Birch Room');
    assert.deepEqual(switchedMetrics.visibleWeekLaneStaffIds, ['52']);
    assert.equal(switchedMetrics.visibleDayColumns, 6);
    assert.equal(switchedMetrics.sharedCopies, 1);
    screenshots.push({ ...(await capture('phone-week-switched-practitioner')), viewport: { width: 390, height: 844 }, metrics: switchedMetrics });

    await evaluate(cdp, `document.querySelector('.week-time-grid').scrollLeft=0;true`);
    await evaluate(cdp, `document.querySelector('[data-week-practitioner-lane][data-date="2026-09-07"][data-staff-id="52"] [data-calendar-booking-slot][data-time="11:00"]').click();true`);
    await poll(() => evaluate(cdp, 'location.pathname'), value => value === '/calendar/book');
    await poll(() => evaluate(cdp, 'document.readyState'), value => value === 'complete');
    const weekBookingPrefillMetrics = await evaluate(cdp, `(() => ({
      viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
      date:document.querySelector('#booking-date')?.value||'',
      time:document.querySelector('#booking-time')?.value||'',
      prefill:JSON.parse(document.querySelector('#calendar-booking-options')?.textContent||'{}').prefill,
      backHref:document.querySelector('[data-back-calendar]')?.getAttribute('href')||'',
    }))()`);
    assert.equal(weekBookingPrefillMetrics.date, '2026-09-07');
    assert.equal(weekBookingPrefillMetrics.time, '11:00');
    assert.deepEqual(weekBookingPrefillMetrics.prefill, { date: '2026-09-07', time: '11:00', staffId: 52 });
    assert.match(weekBookingPrefillMetrics.backHref, /staff=52/);
    screenshots.push({ ...(await capture('phone-week-practitioner-slot-booking-prefill')), viewport: { width: 390, height: 844 }, metrics: weekBookingPrefillMetrics });

    await evaluate(cdp, `(() => { const service=document.querySelector('#service-select'); service.value='81'; service.dispatchEvent(new Event('change',{bubbles:true})); return true; })()`);
    await poll(() => evaluate(cdp, `document.querySelector('#staff-select')?.value`), value => value === '52');
    const weekPractitionerPrefillMetrics = await evaluate(cdp, `(() => {
      const staff=document.querySelector('#staff-select');
      staff.scrollIntoView({block:'center'});
      return {
        viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
        date:document.querySelector('#booking-date')?.value||'',
        time:document.querySelector('#booking-time')?.value||'',
        staffId:Number(staff?.value||0),
        staffName:staff?.selectedOptions?.[0]?.textContent.trim()||'',
        serviceId:Number(document.querySelector('#service-select')?.value||0),
      };
    })()`);
    assert.deepEqual(weekPractitionerPrefillMetrics, {
      viewport: { width: 390, height: 844, screenWidth: 390, screenHeight: 844 },
      date: '2026-09-07', time: '11:00', staffId: 52, staffName: 'Birch Room', serviceId: 81,
    });
    screenshots.push({ ...(await capture('phone-week-practitioner-prefill-selected')), viewport: { width: 390, height: 844 }, metrics: weekPractitionerPrefillMetrics });

    await navigate(`${origin}/calendar/read-only?view=week&date=${DATE_KEY}&staff=51&staff=52&staff=53`, '.week-grid');
    await poll(() => evaluate(cdp, `document.querySelector('.week-grid')?.getAttribute('data-week-overlap-layout')`), Boolean);
    await evaluate(cdp, `document.querySelector('.week-time-grid').scrollLeft=0;true`);
    await evaluate(cdp, `document.querySelector('[data-event-id="appointment-9804"] [data-calendar-operation="manage-appointment"]').click();true`);
    await poll(() => evaluate(cdp, `document.querySelector('[data-calendar-management-panel]').open`), Boolean);
    const managementMetrics = await evaluate(cdp, METRICS);
    assert.equal(managementMetrics.managementOpen, true);
    screenshots.push({ ...(await capture('phone-appointment-tap-manage-sheet')), viewport: { width: 390, height: 844 }, metrics: managementMetrics });
    await evaluate(cdp, `document.querySelector('[data-panel-close]').click();true`);

    await navigate(`${origin}/calendar/read-only?view=month&date=${DATE_KEY}&staff=51&staff=52&staff=53`, '.month-grid');
    const monthMetrics = await evaluate(cdp, `(() => {
      const visible=node=>{if(!node)return false;const style=getComputedStyle(node),rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;};
      return {
        viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
        rootScrollWidth:document.documentElement.scrollWidth,
        peopleSummary:document.querySelector('[data-people-selection-summary]')?.textContent.trim()||'',
        visibleViewOptions:Array.from(document.querySelectorAll('[data-calendar-view-option]')).filter(visible).map(node=>node.dataset.calendarViewOption),
        bookingSlots:document.querySelectorAll('[data-calendar-booking-slot]').length,
        visibleAppointmentCards:Array.from(document.querySelectorAll('.month-events .event-card')).filter(visible).length,
        minDateTargetHeight:Math.min(...Array.from(document.querySelectorAll('.month-day-link')).filter(visible).map(node=>node.getBoundingClientRect().height)),
        sundayCells:Array.from(document.querySelectorAll('.month-day')).filter(node=>new Date(node.dataset.date+'T12:00:00Z').getUTCDay()===0).length,
        dayLinks:Array.from(document.querySelectorAll('.month-day-link')).map(node=>node.getAttribute('href')),
      };
    })()`);
    assert.deepEqual(monthMetrics.viewport, { width: 390, height: 844, screenWidth: 390, screenHeight: 844 });
    assert.ok(monthMetrics.rootScrollWidth <= 391, 'Phone Month leaked horizontal overflow');
    assert.equal(monthMetrics.peopleSummary, 'All staff');
    assert.deepEqual(monthMetrics.visibleViewOptions, ['day', 'week', 'month']);
    assert.equal(monthMetrics.bookingSlots, 0);
    assert.equal(monthMetrics.visibleAppointmentCards, 0);
    assert.ok(monthMetrics.minDateTargetHeight >= 44, 'Phone Month date target is below 44px');
    assert.equal(monthMetrics.sundayCells, 0);
    assert.ok(monthMetrics.dayLinks.every(href => href.includes('staff=51') && href.includes('staff=52') && href.includes('staff=53')), 'People state was not preserved from Month date navigation');
    screenshots.push({ ...(await capture('phone-month-overview-navigation')), viewport: { width: 390, height: 844 }, metrics: monthMetrics });

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
      authority: 'Existing CalendarReadOnlyUx over server-permitted SchedulingTimeline staff with canonical Create Booking and appointment management action wiring',
      productionReads: 0,
      productionMutations: 0,
      providerNetworkCalls: 0,
      senderCalls: 0,
      realClientSends: 0,
      screenshots,
    };
    fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Authenticated Goldie-density Phone Calendar shell proof passed: ${screenshots.length} screenshots at ${exactHead}`);
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
