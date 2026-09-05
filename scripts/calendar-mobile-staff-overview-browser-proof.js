const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const { renderCalendarPage } = require('../src/presentation/calendarReadOnlyUx');
const { applyCalendarResponsivePolish } = require('../src/routes/calendarReadOnlyUx');

function chromeExecutable() {
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  return candidates.find(candidate => candidate && fs.existsSync(candidate)) || null;
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
    if (!message.id) return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
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
  throw new Error('Timed out waiting for Calendar mobile staff proof page');
}

function stripExternalScripts(html) {
  return String(html).replace(/<script\b[^>]*\bsrc="[^"]+"[^>]*><\/script>/gi, '');
}

const STAFF = [
  { id: 1, displayName: 'Christel With A Long Display Name' },
  { id: 2, displayName: 'Abigail' },
  { id: 3, displayName: 'Marietjie' },
  { id: 4, displayName: 'Naomi' },
  { id: 5, displayName: 'Jean-Pierre' },
];

function allStaffModel() {
  const appointments = [
    { id: 7001, kind: 'appointment', canonical: true, status: 'confirmed', clientName: 'Naledi Mokoena', serviceName: 'Bamboo Sports Massage', startsAt: '2026-09-03T06:00:00.000Z', endsAt: '2026-09-03T07:00:00.000Z', staffIds: [1], staff: [{ staffId: 1, nameSnapshot: STAFF[0].displayName }] },
    { id: 7002, kind: 'appointment', canonical: true, status: 'confirmed', clientName: 'Amina Daniels', serviceName: 'Advanced Facial Consultation', startsAt: '2026-09-03T07:30:00.000Z', endsAt: '2026-09-03T08:15:00.000Z', staffIds: [2], staff: [{ staffId: 2, nameSnapshot: STAFF[1].displayName }] },
    { id: 7003, kind: 'appointment', canonical: true, status: 'scheduled', clientName: 'Shared Client', serviceName: 'Couples Treatment', startsAt: '2026-09-03T09:00:00.000Z', endsAt: '2026-09-03T10:00:00.000Z', staffIds: [3, 4], staff: [{ staffId: 3, nameSnapshot: STAFF[2].displayName }, { staffId: 4, nameSnapshot: STAFF[3].displayName }] },
  ];
  const block = { id: 8001, kind: 'calendar_block', canonical: true, blockType: 'admin', title: 'Admin block', startsAt: '2026-09-03T08:00:00.000Z', endsAt: '2026-09-03T08:30:00.000Z', staffIds: [5] };
  return {
    view: 'day', dateKey: '2026-09-03', selectedStaffId: null, permittedStaff: STAFF,
    period: { startKey: '2026-09-03', previousAnchor: '2026-09-02', nextAnchor: '2026-09-04', dateKeys: ['2026-09-03'] },
    timeline: {
      staff: STAFF,
      workingWindows: STAFF.map(person => ({ staffId: person.id, dayOfWeek: 4, startsLocal: '08:00:00', endsLocal: '17:00:00' })),
      scheduleExceptions: [], recurringClosures: [], closures: [], leave: [], externalBusy: [],
      appointments, blocks: [block], events: [...appointments, block],
    },
    mutationCapability: { enabled: false },
  };
}

function selectedStaffModel() {
  const model = allStaffModel();
  const selectedId = 3;
  model.selectedStaffId = selectedId;
  model.timeline.staff = STAFF.filter(person => person.id === selectedId);
  model.timeline.workingWindows = model.timeline.workingWindows.filter(item => item.staffId === selectedId);
  model.timeline.appointments = model.timeline.appointments.filter(item => item.staffIds.includes(selectedId));
  model.timeline.blocks = [];
  model.timeline.events = model.timeline.appointments;
  return model;
}

function pageHtml(model) {
  const raw = renderCalendarPage(model, {
    clientNavigationAllowed: true,
    operationalActions: [{ label: 'Create booking', href: '/calendar/book?date=2026-09-03', tone: 'primary' }],
    timelineReadOnlyMessage: 'Synthetic proof only.',
  });
  return stripExternalScripts(applyCalendarResponsivePolish(raw, model, '/calendar/read-only'));
}

const METRICS_EXPRESSION = `(() => {
  function visible(el) {
    if (!el) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }
  function hasStaffFilter(card) {
    try {
      const url = new URL(card.getAttribute('href') || '', 'https://shiloh-proof.local');
      return /^\\d+$/.test(url.searchParams.get('staff') || '');
    } catch {
      return false;
    }
  }
  const root = document.documentElement;
  const overview = document.querySelector('[data-mobile-staff-overview]');
  const cards = Array.from(document.querySelectorAll('.mobile-staff-card')).filter(visible);
  const dayGrid = document.querySelector('.day-time-grid');
  const lanes = document.querySelector('.day-time-grid .lanes');
  const laneEls = Array.from(document.querySelectorAll('.day-time-grid .lane')).filter(visible);
  const practitioner = document.querySelector('.practitioner-control');
  const mobileGrid = document.querySelector('.mobile-staff-grid');
  const dayGridStyle = dayGrid ? getComputedStyle(dayGrid) : null;
  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    rootScrollWidth: root.scrollWidth,
    noPageOverflow: root.scrollWidth <= window.innerWidth + 1,
    overviewVisible: visible(overview),
    cardCount: cards.length,
    minCardWidth: cards.length ? Math.min(...cards.map(card => card.getBoundingClientRect().width)) : 0,
    cardsInsideViewport: cards.every(card => {
      const r = card.getBoundingClientRect();
      return r.left >= -1 && r.right <= window.innerWidth + 1;
    }),
    allCardsUseStaffFilter: cards.every(hasStaffFilter),
    mobileGridColumns: mobileGrid ? getComputedStyle(mobileGrid).gridTemplateColumns : null,
    dayGridDisplay: dayGridStyle ? dayGridStyle.display : null,
    dayGridVisibility: dayGridStyle ? dayGridStyle.visibility : null,
    dayGridPosition: dayGridStyle ? dayGridStyle.position : null,
    dayGridWidth: dayGrid ? dayGrid.getBoundingClientRect().width : 0,
    dayGridScrollWidth: dayGrid ? dayGrid.scrollWidth : 0,
    dayGridClientWidth: dayGrid ? dayGrid.clientWidth : 0,
    laneCount: laneEls.length,
    minLaneWidth: laneEls.length ? Math.min(...laneEls.map(lane => lane.getBoundingClientRect().width)) : 0,
    lanesScrollWidth: lanes ? lanes.scrollWidth : 0,
    lanesClientWidth: lanes ? lanes.clientWidth : 0,
    practitionerDisplay: practitioner ? getComputedStyle(practitioner).display : null,
  };
})()`;

function assertCase(proof, metrics) {
  if (metrics.innerWidth !== proof.width || metrics.screenWidth !== proof.width) {
    throw new Error(`${proof.name} viewport width ${metrics.innerWidth}/${metrics.screenWidth}, expected ${proof.width}`);
  }
  if (metrics.innerHeight !== proof.height || metrics.screenHeight !== proof.height) {
    throw new Error(`${proof.name} viewport height ${metrics.innerHeight}/${metrics.screenHeight}, expected ${proof.height}`);
  }
  if (!metrics.noPageOverflow) throw new Error(`${proof.name} has root page overflow: ${metrics.rootScrollWidth}px`);

  if (proof.mode === 'lanes') {
    if (metrics.overviewVisible || metrics.cardCount !== 0) throw new Error(`${proof.name} retained the retired overview-card replacement`);
    if (metrics.dayGridDisplay === 'none' || metrics.dayGridVisibility === 'hidden') throw new Error(`${proof.name} canonical all-staff Day canvas is hidden`);
    if (metrics.laneCount !== 5) throw new Error(`${proof.name} expected five permitted practitioner lanes, got ${metrics.laneCount}`);
    if (metrics.minLaneWidth < 270) throw new Error(`${proof.name} practitioner lanes are cramped (${metrics.minLaneWidth}px)`);
    if (metrics.dayGridScrollWidth <= metrics.dayGridClientWidth) throw new Error(`${proof.name} multi-staff Day canvas does not pan inside its calendar scroller`);
    if (metrics.practitionerDisplay === 'none') throw new Error(`${proof.name} lost the canonical People selector`);
  } else {
    if (metrics.overviewVisible) throw new Error(`${proof.name} overview should not be visible after selecting one practitioner`);
    if (metrics.dayGridDisplay === 'none' || metrics.dayGridVisibility === 'hidden') throw new Error(`${proof.name} selected staff timeline is hidden`);
    if (metrics.laneCount !== 1) throw new Error(`${proof.name} expected one visible staff lane, got ${metrics.laneCount}`);
    if (metrics.dayGridScrollWidth > metrics.dayGridClientWidth + 1) {
      throw new Error(`${proof.name} selected staff lane still scrolls horizontally (${metrics.dayGridScrollWidth} > ${metrics.dayGridClientWidth})`);
    }
  }
}

async function main() {
  const chrome = chromeExecutable();
  if (!chrome) {
    if (process.env.CI) throw new Error('CI must provide Chrome for Calendar mobile staff overview proof');
    console.log('Chrome not installed; Calendar mobile staff overview proof skipped outside CI.');
    return;
  }

  const outDir = path.resolve(process.env.CALENDAR_MOBILE_STAFF_PROOF_DIR || path.join(process.cwd(), 'artifacts', 'calendar-mobile-staff-overview-v1'));
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const cases = [
    { name: 'all-staff-lanes-390', mode: 'lanes', width: 390, height: 844, model: allStaffModel() },
    { name: 'all-staff-lanes-360', mode: 'lanes', width: 360, height: 800, model: allStaffModel() },
    { name: 'selected-staff-390', mode: 'selected', width: 390, height: 844, model: selectedStaffModel() },
  ];
  for (const proof of cases) fs.writeFileSync(path.join(outDir, `${proof.name}.html`), pageHtml(proof.model));

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-calendar-mobile-staff-'));
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
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => {
      if (!response.ok) throw new Error(`Chrome target discovery failed: ${response.status}`);
      return response.json();
    });
    const page = targets.find(target => target.type === 'page');
    if (!page?.webSocketDebuggerUrl) throw new Error('Chrome did not expose a page target');
    cdp = await connectCdp(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    for (const proof of cases) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: proof.width, height: proof.height, deviceScaleFactor: 1, mobile: true,
        screenWidth: proof.width, screenHeight: proof.height,
      });
      await cdp.send('Page.navigate', { url: pathToFileURL(path.join(outDir, `${proof.name}.html`)).href });
      await waitForReady(cdp);
      await sleep(80);

      const evaluated = await cdp.send('Runtime.evaluate', { expression: METRICS_EXPRESSION, returnByValue: true });
      const metrics = evaluated.result?.value;
      if (!metrics) throw new Error(`${proof.name} did not return browser metrics`);
      assertCase(proof, metrics);

      const capture = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
      const pngPath = path.join(outDir, `${proof.name}.png`);
      fs.writeFileSync(pngPath, Buffer.from(capture.data, 'base64'));
      const stat = fs.statSync(pngPath);
      screenshots.push({ view: proof.name, mode: proof.mode, width: proof.width, height: proof.height, file: path.basename(pngPath), bytes: stat.size, sha256: sha256(pngPath), metrics });
      console.log(`${proof.name}: ${proof.width}x${proof.height} sha256=${sha256(pngPath)}`);
    }
  } finally {
    if (cdp) cdp.close();
    browser.kill('SIGTERM');
    await sleep(100);
    fs.rmSync(profileDir, { recursive: true, force: true });
  }

  const exactHead = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  if (!/^[0-9a-f]{40}$/.test(exactHead)) throw new Error('Calendar mobile staff proof could not resolve exact checked-out head');
  fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify({
    generatedAt: new Date().toISOString(), exactHead, syntheticDataOnly: true,
    productionReads: 0, productionMutations: 0, permissionMutations: 0, providerNetworkCalls: 0,
    assertions: {
      trueCssViewports: true,
      allStaffOverviewNoHorizontalLaneScroll: true,
      fiveStaffVisible: true,
      twoColumnOverview: true,
      selectedStaffSingleFullWidthLane: true,
      existingStaffFilterUrls: true,
      noRootPageOverflow: true,
    },
    screenshots,
  }, null, 2)}\n`);
  console.log(`Calendar mobile staff overview proof generated: ${screenshots.length} screenshots`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
