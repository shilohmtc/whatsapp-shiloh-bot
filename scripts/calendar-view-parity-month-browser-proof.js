const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const { periodFor } = require('../src/services/calendarReadOnlyUx');
const { renderCalendarPage } = require('../src/presentation/calendarReadOnlyUx');
const { applyCalendarResponsivePolish } = require('../src/routes/calendarReadOnlyUx');

function chromeExecutable() {
  return [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].find(candidate => candidate && fs.existsSync(candidate)) || null;
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForFile(filePath, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(filePath)) return;
    await sleep(50);
  }
  throw new Error(`Timed out waiting for ${filePath}`);
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (!message.id || !pending.has(message.id)) return;
    const waiter = pending.get(message.id);
    pending.delete(message.id);
    clearTimeout(waiter.timeout);
    if (message.error) waiter.reject(new Error(`${message.error.code}: ${message.error.message}`));
    else waiter.resolve(message.result || {});
  });
  return {
    send(method, params = {}, timeoutMs = 15_000) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }, timeoutMs);
        pending.set(id, { resolve, reject, timeout });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { socket.close(); },
  };
}

async function waitForReady(cdp) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const result = await cdp.send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
    if (result.result?.value === 'complete') return;
    await sleep(40);
  }
  throw new Error('Timed out waiting for Calendar view parity proof page');
}

const STAFF = [
  { id: 51, displayName: 'Amber Room', schedulingType: 'regular' },
  { id: 52, displayName: 'Birch Room', schedulingType: 'regular' },
  { id: 53, displayName: 'Cedar Room', schedulingType: 'regular' },
  { id: 54, displayName: 'Dune Room', schedulingType: 'regular' },
];

function appointment(id, staffIds, day, hour, clientName) {
  const startsAt = `${day}T${String(hour).padStart(2, '0')}:00:00.000Z`;
  return {
    id,
    kind: 'appointment',
    canonical: true,
    revision: `rev-${id}`,
    status: 'scheduled',
    clientName,
    clientMobile: '27821234567',
    serviceName: 'Synthetic treatment',
    serviceContexts: [{ serviceId: 81, categoryName: 'Massage' }],
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString(),
    staffIds,
    staff: staffIds.map(staffId => ({ staffId, nameSnapshot: STAFF.find(person => person.id === staffId).displayName })),
  };
}

function canonicalTimeline() {
  const appointments = [
    appointment(9501, [51], '2026-09-14', 6, 'Monday Client'),
    appointment(9502, [52], '2026-09-15', 7, 'Tuesday Client'),
    appointment(9503, [51, 52], '2026-09-18', 8, 'Shared Client'),
    appointment(9504, [53], '2026-09-18', 9, 'Cedar Client'),
    appointment(9505, [54], '2026-09-19', 10, 'Dune Client'),
    appointment(9506, [51], '2026-09-25', 6, 'Later Client'),
    appointment(9507, [51], '2026-08-11', 8, 'Observed Week Client'),
  ];
  const blocks = [{
    id: 9601,
    kind: 'calendar_block',
    canonical: true,
    startsAt: '2026-09-18T11:00:00.000Z',
    endsAt: '2026-09-18T12:00:00.000Z',
    staffIds: [53],
    blockType: 'admin',
    title: 'Planning block',
  }];
  const closures = [
    { id: 'holiday:2026-08-09', kind: 'clinic_closure', canonical: true, date: '2026-08-09', reason: "National Women's Day", observed: false },
    { id: 'holiday:2026-08-10', kind: 'clinic_closure', canonical: true, date: '2026-08-10', reason: "National Women's Day observed", observed: true },
  ];
  return {
    staff: STAFF,
    workingWindows: STAFF.flatMap(person => [1, 2, 3, 4, 5].map(dayOfWeek => ({
      staffId: person.id, dayOfWeek, startsLocal: '08:00:00', endsLocal: '17:00:00',
    }))),
    scheduleExceptions: [], recurringClosures: [], closures, leave: [], externalBusy: [],
    appointments, blocks, events: [...appointments, ...blocks, ...closures],
  };
}

function model(view, visibleStaffIds, selectedDate = '2026-09-18') {
  const timeline = canonicalTimeline();
  const visible = new Set(visibleStaffIds);
  const appointments = timeline.appointments.filter(item => item.staffIds.some(staffId => visible.has(staffId)));
  const blocks = timeline.blocks.filter(item => item.staffIds.some(staffId => visible.has(staffId)));
  const closures = timeline.closures.filter(item => new Date(`${item.date}T12:00:00Z`).getUTCDay() !== 0);
  return {
    view,
    dateKey: selectedDate,
    period: periodFor(view, selectedDate),
    selectedStaffId: visibleStaffIds.length === 1 ? visibleStaffIds[0] : null,
    visibleStaffIds,
    visibleStaffSelectionExplicit: true,
    permittedStaff: STAFF,
    timeline: {
      ...timeline,
      staff: STAFF.filter(person => visible.has(person.id)),
      workingWindows: timeline.workingWindows.filter(item => visible.has(item.staffId)),
      appointments,
      blocks,
      closures,
      events: [...appointments, ...blocks, ...closures],
    },
    mutationCapability: { enabled: false },
  };
}

function stripExternalScripts(html) {
  return String(html).replace(/<script\b[^>]*\bsrc="[^"]+"[^>]*><\/script>/gi, '');
}

function pageFor(proof) {
  const raw = renderCalendarPage(proof.model, {
    operationalActions: [{ label: 'Create booking', href: '/calendar/book?date=2026-09-18', tone: 'primary' }],
    timelineReadOnlyMessage: 'Synthetic browser proof. No provider or production write occurs.',
  });
  return stripExternalScripts(applyCalendarResponsivePolish(raw, proof.model));
}

const METRICS_EXPRESSION = `(() => {
  const visible = node => {
    if (!node) return false;
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const visibleAll = selector => Array.from(document.querySelectorAll(selector)).filter(visible);
  const view = document.querySelector('.calendar-view');
  const context = document.querySelector('[data-view-practitioner-context]');
  const monthGrid = document.querySelector('.month-days');
  const monthLinks = visibleAll('.month-day-link');
  const touchTargets = visibleAll('a,button,summary');
  const weekGrid = document.querySelector('.week-grid');
  const firstWeekEvent = document.querySelector('.week-view .positioned-event');
  return {
    viewport: { width: innerWidth, height: innerHeight, screenWidth: screen.width, screenHeight: screen.height },
    rootScrollWidth: document.documentElement.scrollWidth,
    view: view && view.dataset.view,
    viewVisible: visible(view),
    contextVisible: visible(context),
    practitionerCount: visibleAll('.view-practitioner').length,
    ownerLabelCount: visibleAll('.event-practitioners').length,
    sharedCopies: document.querySelectorAll('[data-event-id="appointment-9503"]').length,
    weekColumnCount: weekGrid ? getComputedStyle(weekGrid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    weekEventPosition: firstWeekEvent ? getComputedStyle(firstWeekEvent).position : null,
    agendaCardCount: visibleAll('.agenda-view .event-card').length,
    monthCellCount: document.querySelectorAll('.month-day').length,
    monthColumnCount: monthGrid ? getComputedStyle(monthGrid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    sundayCellCount: Array.from(document.querySelectorAll('.month-day')).filter(node => new Date(node.dataset.date + 'T12:00:00Z').getUTCDay() === 0).length,
    outsideMonthCount: document.querySelectorAll('.month-day.outside-month').length,
    visibleMonthEvents: visibleAll('.month-event').length,
    visibleMonthOwners: visibleAll('.month-day-owners').length,
    observedHolidayVisible: document.body.textContent.includes("National Women's Day observed"),
    minMonthLinkHeight: monthLinks.length ? Math.min(...monthLinks.map(node => node.getBoundingClientRect().height)) : 0,
    minTouchHeight: touchTargets.length ? Math.min(...touchTargets.map(node => node.getBoundingClientRect().height)) : 0,
  };
})()`;

function assertMetrics(proof, metrics) {
  if (metrics.viewport.width !== proof.width || metrics.viewport.screenWidth !== proof.width) {
    throw new Error(`${proof.name} width is not the requested true viewport: ${JSON.stringify(metrics.viewport)}`);
  }
  if (metrics.viewport.height !== proof.height || metrics.viewport.screenHeight !== proof.height) {
    throw new Error(`${proof.name} height is not the requested true viewport: ${JSON.stringify(metrics.viewport)}`);
  }
  if (metrics.rootScrollWidth > proof.width + 1) throw new Error(`${proof.name} leaked horizontal overflow to the page`);
  if (!metrics.viewVisible || metrics.view !== proof.view) throw new Error(`${proof.name} did not render the requested view`);
  if (!metrics.contextVisible || metrics.practitionerCount !== proof.staffCount) {
    throw new Error(`${proof.name} lost selected practitioner context: ${JSON.stringify(metrics)}`);
  }
  if (metrics.ownerLabelCount < 1 && !(proof.view === 'month' && proof.phone && metrics.visibleMonthOwners > 0)) {
    throw new Error(`${proof.name} has no visible practitioner ownership labels`);
  }
  if (proof.expectShared && metrics.sharedCopies !== 1) throw new Error(`${proof.name} did not retain one shared canonical booking`);
  if (proof.view === 'week') {
    if (proof.phone && (metrics.weekColumnCount !== 1 || metrics.weekEventPosition !== 'static')) {
      throw new Error(`${proof.name} did not retain the Phone vertical Week treatment`);
    }
    if (!proof.phone && metrics.weekColumnCount !== 6) throw new Error(`${proof.name} did not retain the Desktop Monday-Saturday Week model`);
  }
  if (proof.view === 'agenda' && metrics.agendaCardCount < 2) throw new Error(`${proof.name} Agenda is missing canonical items`);
  if (proof.view === 'month') {
    if (metrics.monthCellCount !== (proof.monthCellCount || 30) || metrics.monthColumnCount !== 6 || metrics.sundayCellCount !== 0 || metrics.outsideMonthCount < 1) {
      throw new Error(`${proof.name} Month grid is not Monday-Saturday and Monday-aligned: ${JSON.stringify(metrics)}`);
    }
    if (proof.phone) {
      if (metrics.visibleMonthEvents !== 0 || metrics.visibleMonthOwners < 1 || metrics.minMonthLinkHeight < 53) {
        throw new Error(`${proof.name} Phone Month is not compact, attributable, and touch-safe: ${JSON.stringify(metrics)}`);
      }
    } else if (metrics.visibleMonthEvents < (proof.minMonthEvents || 4)) {
      throw new Error(`${proof.name} Desktop Month did not retain visible canonical items`);
    }
    if (proof.expectObservedHoliday && !metrics.observedHolidayVisible) {
      throw new Error(`${proof.name} did not show the observed Monday public holiday`);
    }
  }
  if (proof.phone && metrics.minTouchHeight < 43) throw new Error(`${proof.name} has a touch target below 43px`);
}

async function main() {
  const chrome = chromeExecutable();
  if (!chrome) {
    if (process.env.CI) throw new Error('CI must provide Chrome for Calendar view parity and Month proof');
    console.log('Chrome not installed; Calendar view parity and Month proof skipped outside CI.');
    return;
  }

  const outDir = path.resolve(process.env.CALENDAR_VIEW_PARITY_PROOF_DIR || path.join(process.cwd(), 'artifacts', 'calendar-view-parity-month-v1'));
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const proofs = [
    { name: 'desktop-week-one-person', view: 'week', width: 1440, height: 1000, staffCount: 1, model: model('week', [51]) },
    { name: 'desktop-week-two-people', view: 'week', width: 1440, height: 1000, staffCount: 2, expectShared: true, model: model('week', [51, 52]) },
    { name: 'desktop-week-four-people', view: 'week', width: 1440, height: 1000, staffCount: 4, expectShared: true, model: model('week', [51, 52, 53, 54]) },
    { name: 'desktop-agenda-multiple-people', view: 'agenda', width: 1200, height: 1000, staffCount: 4, expectShared: true, model: model('agenda', [51, 52, 53, 54]) },
    { name: 'desktop-month-multiple-people', view: 'month', width: 1440, height: 1200, staffCount: 4, expectShared: true, model: model('month', [51, 52, 53, 54]) },
    { name: 'desktop-month-ownership', view: 'month', width: 1180, height: 1000, staffCount: 2, expectShared: true, model: model('month', [51, 52]) },
    { name: 'desktop-month-observed-public-holiday', view: 'month', width: 1440, height: 1200, staffCount: 4, monthCellCount: 36, minMonthEvents: 2, expectObservedHoliday: true, model: model('month', [51, 52, 53, 54], '2026-08-10') },
    { name: 'phone-week', view: 'week', width: 390, height: 844, phone: true, staffCount: 4, expectShared: true, model: model('week', [51, 52, 53, 54]) },
    { name: 'phone-agenda', view: 'agenda', width: 390, height: 844, phone: true, staffCount: 4, expectShared: true, model: model('agenda', [51, 52, 53, 54]) },
    { name: 'phone-month', view: 'month', width: 390, height: 844, phone: true, staffCount: 4, expectShared: true, model: model('month', [51, 52, 53, 54]) },
  ];
  for (const proof of proofs) fs.writeFileSync(path.join(outDir, `${proof.name}.html`), pageFor(proof));

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-calendar-view-parity-'));
  const browser = spawn(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars',
    '--remote-debugging-port=0', `--user-data-dir=${profileDir}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'] });
  let cdp;
  const screenshots = [];
  try {
    const activePortPath = path.join(profileDir, 'DevToolsActivePort');
    await waitForFile(activePortPath);
    const [port] = fs.readFileSync(activePortPath, 'utf8').split(/\r?\n/);
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
    const page = targets.find(target => target.type === 'page');
    if (!page?.webSocketDebuggerUrl) throw new Error('Chrome did not expose a page target');
    cdp = await connectCdp(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    for (const proof of proofs) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: proof.width, height: proof.height, deviceScaleFactor: 1, mobile: Boolean(proof.phone),
        screenWidth: proof.width, screenHeight: proof.height,
      });
      await cdp.send('Page.navigate', { url: pathToFileURL(path.join(outDir, `${proof.name}.html`)).href });
      await waitForReady(cdp);
      await sleep(80);
      if (proof.phone) {
        await cdp.send('Runtime.evaluate', { expression: `document.querySelector('.calendar-view')?.scrollIntoView({block:'start'})` });
        await sleep(40);
      }
      const evaluated = await cdp.send('Runtime.evaluate', { expression: METRICS_EXPRESSION, returnByValue: true });
      const metrics = evaluated.result?.value;
      if (!metrics) throw new Error(`${proof.name} returned no browser metrics`);
      assertMetrics(proof, metrics);
      const capture = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
      const pngPath = path.join(outDir, `${proof.name}.png`);
      fs.writeFileSync(pngPath, Buffer.from(capture.data, 'base64'));
      screenshots.push({
        name: proof.name, view: proof.view, phone: Boolean(proof.phone), viewport: { width: proof.width, height: proof.height },
        metrics, file: path.basename(pngPath), bytes: fs.statSync(pngPath).size, sha256: sha256(pngPath),
      });
    }
  } finally {
    if (cdp) cdp.close();
    browser.kill('SIGTERM');
    await sleep(100);
    fs.rmSync(profileDir, { recursive: true, force: true });
  }

  const exactHead = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  if (!/^[0-9a-f]{40}$/.test(exactHead)) throw new Error('Calendar view parity proof could not resolve exact checked-out head');
  fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify({
    generatedAt: new Date().toISOString(), exactHead, productionMutations: 0,
    authority: 'CalendarReadOnlyUx over server-permitted SchedulingTimeline staff', screenshots,
  }, null, 2)}\n`);
  console.log(`Calendar view parity and Month proof generated: ${screenshots.length} screenshots`);
  for (const item of screenshots) console.log(`${item.name}: ${item.viewport.width}x${item.viewport.height} sha256=${item.sha256}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
