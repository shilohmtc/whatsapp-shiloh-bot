const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

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

const STAFF = [
  { id: 41, displayName: 'North Studio', schedulingType: 'regular' },
  { id: 42, displayName: 'Garden Studio', schedulingType: 'regular' },
  { id: 43, displayName: 'Willow Studio', schedulingType: 'regular' },
  { id: 44, displayName: 'Courtyard Studio', schedulingType: 'regular' },
  { id: 45, displayName: 'Quiet Studio', schedulingType: 'regular' },
];

function appointment(id, staffIds, clientName, hour) {
  const startsAt = `2026-09-07T${String(hour).padStart(2, '0')}:00:00.000Z`;
  return {
    id, kind: 'appointment', canonical: true, revision: `rev-${id}`, status: 'scheduled',
    clientName, clientMobile: '27821234567', serviceName: 'Synthetic treatment',
    serviceContexts: [{ serviceId: 81, categoryName: 'Massage' }],
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString(),
    staffIds,
    staff: staffIds.map(staffId => ({ staffId, nameSnapshot: STAFF.find(person => person.id === staffId)?.displayName })),
  };
}

function authorizedTimeline() {
  const appointments = [
    appointment(9101, [41], 'North Client', 6),
    appointment(9102, [42], 'Garden Client', 7),
    appointment(9103, [42, 43], 'Shared Client', 8),
    appointment(9104, [44], 'Courtyard Client', 9),
    appointment(9105, [45], 'Quiet Client', 10),
  ];
  return {
    staff: STAFF,
    workingWindows: STAFF.map(person => ({ staffId: person.id, dayOfWeek: 1, startsLocal: '08:00:00', endsLocal: '17:00:00' })),
    scheduleExceptions: [], recurringClosures: [], closures: [], blocks: [], leave: [], externalBusy: [],
    appointments, events: appointments,
  };
}

function model(visibleStaffIds, { implicit = false, mutable = false } = {}) {
  const authorized = authorizedTimeline();
  const visible = new Set(visibleStaffIds);
  const appointments = authorized.appointments.filter(item => item.staffIds.some(staffId => visible.has(staffId)));
  return {
    view: 'day', dateKey: '2026-09-07', permittedStaff: STAFF, visibleStaffIds,
    visibleStaffSelectionExplicit: !implicit,
    selectedStaffId: visibleStaffIds.length === 1 ? visibleStaffIds[0] : null,
    authorizedTimeline: authorized,
    period: { startKey: '2026-09-07', previousAnchor: '2026-09-06', nextAnchor: '2026-09-08', dateKeys: ['2026-09-07'] },
    timeline: {
      ...authorized,
      staff: STAFF.filter(person => visible.has(person.id)),
      workingWindows: authorized.workingWindows.filter(item => visible.has(item.staffId)),
      appointments,
      events: appointments,
    },
    mutationCapability: mutable ? {
      enabled: true,
      operations: ['appointment:reschedule', 'appointment:cancel', 'appointment:reassign'],
      calendarScope: 'all_business', serviceScope: 'all_services', allowedServiceIds: null,
    } : { enabled: false },
  };
}

function stripExternalScripts(html) {
  return String(html).replace(/<script\b[^>]*\bsrc="[^"]+"[^>]*><\/script>/gi, '');
}

function instrument(html, mode) {
  const setup = mode === 'overflow'
    ? `var proofCanvas=document.querySelector('.day-time-grid');if(proofCanvas){proofCanvas.scrollTop=180;var proofTop=proofCanvas.getBoundingClientRect().top;document.body.dataset.proofSticky=String(Array.from(proofCanvas.querySelectorAll('.lane>header')).every(function(header){return Math.abs(header.getBoundingClientRect().top-proofTop)<=2;}));}`
    : mode === 'people'
    ? `var picker=document.querySelector('[data-people-picker]');if(picker)picker.open=true;`
    : mode === 'sheet'
      ? `var panel=document.querySelector('[data-calendar-management-panel]');if(panel){document.querySelector('[data-panel-title]').textContent='Appointment #9101';document.querySelector('[data-panel-client]').textContent='North Client';document.querySelector('[data-panel-service]').textContent='Synthetic treatment';document.querySelector('[data-panel-time]').textContent='7 September at 08:00';var action=document.querySelector('[data-panel-action="appointment:reschedule"]');if(action){action.hidden=false;action.classList.add('visible');}panel.showModal();}`
      : '';
  const script = `<pre id="proof-metrics" hidden></pre><script>(function(){${setup}var visible=function(node){if(!node)return false;var style=getComputedStyle(node),rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;};var canvas=document.querySelector('.day-time-grid');var lanes=Array.from(document.querySelectorAll('.day-time-grid .lane')).filter(visible);var metrics={mode:${JSON.stringify(mode)},viewportWidth:innerWidth,rootScrollWidth:document.documentElement.scrollWidth,canvasClientWidth:canvas?canvas.clientWidth:0,canvasScrollWidth:canvas?canvas.scrollWidth:0,laneWidths:lanes.map(function(lane){return lane.getBoundingClientRect().width;}),laneLefts:lanes.map(function(lane){return lane.getBoundingClientRect().left;}),headerTops:lanes.map(function(lane){return lane.querySelector('header').getBoundingClientRect().top;}),columnTops:lanes.map(function(lane){return lane.querySelector('.time-column').getBoundingClientRect().top;}),timeRailCount:document.querySelectorAll('.day-time-grid>.time-rail').length,visibleLaneCount:lanes.length,sharedBookingCopies:document.querySelectorAll('[data-event-id="appointment-9103"]').length,peopleOpen:!!document.querySelector('[data-people-picker][open]'),checkedPeople:document.querySelectorAll('[data-practitioner-visibility-form] input[name="staff"]:checked').length,managementOpen:!!document.querySelector('[data-calendar-management-panel][open]'),managementWidth:(document.querySelector('.management-card')||{getBoundingClientRect:function(){return{width:0};}}).getBoundingClientRect().width,mobileOverviewVisible:visible(document.querySelector('[data-mobile-staff-overview]')),mobileCardCount:Array.from(document.querySelectorAll('.mobile-staff-card')).filter(visible).length,dayGridVisible:visible(canvas)};document.getElementById('proof-metrics').textContent=JSON.stringify(metrics);document.body.dataset.proofReady='true';})();</script>`;
  return String(html).replace('</body>', `${script}</body>`);
}

function pageFor(proof) {
  const raw = renderCalendarPage(proof.model, {
    operationalActions: [{ label: 'Create booking', href: '/calendar/book?date=2026-09-07', tone: 'primary' }],
    timelineReadOnlyMessage: 'Synthetic browser proof. No provider or production write occurs.',
  });
  return instrument(stripExternalScripts(applyCalendarResponsivePolish(raw, proof.model)), proof.mode);
}

function parseMetrics(dom, name) {
  const match = String(dom).match(/<pre id="proof-metrics"[^>]*>([^<]+)<\/pre>/);
  if (!match) throw new Error(`${name} did not emit browser geometry metrics`);
  const metrics = JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  metrics.stickyHeaders = /data-proof-sticky="true"/.test(String(dom));
  return metrics;
}

function closeEnough(values, tolerance = 1) {
  return values.length < 2 || Math.max(...values) - Math.min(...values) <= tolerance;
}

function assertMetrics(proof, metrics) {
  if (metrics.viewportWidth !== proof.width) throw new Error(`${proof.name} viewport mismatch: ${metrics.viewportWidth}`);
  if (proof.mode !== 'phone' && metrics.rootScrollWidth > proof.width + 1) throw new Error(`${proof.name} leaked horizontal overflow to the page`);
  if (metrics.timeRailCount !== 1) throw new Error(`${proof.name} must have exactly one shared time axis`);
  if (proof.mode === 'single') {
    if (metrics.visibleLaneCount !== 1) throw new Error(`${proof.name} expected one lane`);
    if (metrics.canvasScrollWidth > metrics.canvasClientWidth + 1) throw new Error(`${proof.name} focused lane unexpectedly scrolls`);
  }
  if (proof.mode === 'two' || proof.mode === 'sheet') {
    if (metrics.visibleLaneCount !== 2) throw new Error(`${proof.name} expected two adjacent lanes`);
    if (!closeEnough(metrics.headerTops) || !closeEnough(metrics.columnTops)) throw new Error(`${proof.name} lanes do not share aligned coordinates`);
    if (!(metrics.laneLefts[1] > metrics.laneLefts[0] + metrics.laneWidths[0] - 2)) throw new Error(`${proof.name} lanes are not side by side`);
    if (metrics.sharedBookingCopies !== 1) throw new Error(`${proof.name} duplicated the shared canonical booking`);
  }
  if (proof.mode === 'overflow') {
    if (metrics.visibleLaneCount !== 5) throw new Error(`${proof.name} expected five lanes`);
    if (Math.min(...metrics.laneWidths) < 299) throw new Error(`${proof.name} compressed a lane below 300px`);
    if (metrics.canvasScrollWidth <= metrics.canvasClientWidth + 1) throw new Error(`${proof.name} did not retain canvas-local horizontal overflow`);
    if (!metrics.stickyHeaders) throw new Error(`${proof.name} practitioner headers did not remain sticky while the canvas scrolled`);
  }
  if (proof.mode === 'people') {
    if (!metrics.peopleOpen || metrics.checkedPeople !== 2 || metrics.visibleLaneCount !== 2) throw new Error(`${proof.name} People control state is inconsistent`);
  }
  if (proof.mode === 'sheet') {
    if (!metrics.managementOpen || metrics.managementWidth < 400 || !metrics.dayGridVisible) throw new Error(`${proof.name} did not preserve canvas context behind the right sheet`);
  }
  if (proof.mode === 'phone') {
    if (!metrics.mobileOverviewVisible || metrics.mobileCardCount !== 5) throw new Error(`${proof.name} did not preserve the Phone overview`);
    if (metrics.dayGridVisible) throw new Error(`${proof.name} exposed compressed Desktop lanes on Phone`);
    if (metrics.rootScrollWidth > proof.width + 1) throw new Error(`${proof.name} has Phone page overflow`);
  }
}

const chrome = chromeExecutable();
if (!chrome) {
  if (process.env.CI) throw new Error('CI must provide Chrome for Desktop spatial lane browser proof');
  console.log('Chrome not installed; Desktop spatial lane browser proof skipped outside CI.');
  process.exit(0);
}

const outDir = path.resolve(process.env.CALENDAR_SPATIAL_LANES_PROOF_DIR || path.join(process.cwd(), 'artifacts', 'calendar-desktop-spatial-lanes-v1'));
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const proofs = [
  { name: 'desktop-single-lane', mode: 'single', width: 1440, height: 1000, model: model([41]) },
  { name: 'desktop-two-lanes', mode: 'two', width: 1440, height: 1000, model: model([41, 42]) },
  { name: 'desktop-five-lane-overflow', mode: 'overflow', width: 1180, height: 900, model: model([41, 42, 43, 44, 45]) },
  { name: 'desktop-people-control', mode: 'people', width: 1440, height: 1000, model: model([41, 43]) },
  { name: 'desktop-detail-sheet', mode: 'sheet', width: 1440, height: 1000, model: model([41, 42], { mutable: true }) },
  { name: 'phone-overview', mode: 'phone', width: 390, height: 844, model: model([41], { implicit: true }) },
];

const manifest = [];
for (const proof of proofs) {
  const htmlPath = path.join(outDir, `${proof.name}.html`);
  const pngPath = path.join(outDir, `${proof.name}.png`);
  fs.writeFileSync(htmlPath, pageFor(proof));
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-spatial-lanes-proof-'));
  const commonArgs = [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--force-device-scale-factor=1', `--window-size=${proof.width},${proof.height}`,
    `--user-data-dir=${profileDir}`, '--virtual-time-budget=1200', pathToFileURL(htmlPath).href,
  ];
  const domResult = spawnSync(chrome, [...commonArgs.slice(0, -1), '--dump-dom', commonArgs.at(-1)], { encoding: 'utf8' });
  if (domResult.status !== 0) throw new Error(`${proof.name} DOM proof failed: ${domResult.stderr || domResult.status}`);
  const metrics = parseMetrics(domResult.stdout, proof.name);
  assertMetrics(proof, metrics);
  const screenshotResult = spawnSync(chrome, [...commonArgs.slice(0, -1), `--screenshot=${pngPath}`, commonArgs.at(-1)], { encoding: 'utf8' });
  fs.rmSync(profileDir, { recursive: true, force: true });
  if (screenshotResult.status !== 0 || !fs.existsSync(pngPath)) throw new Error(`${proof.name} screenshot failed: ${screenshotResult.stderr || screenshotResult.status}`);
  manifest.push({ name: proof.name, viewport: { width: proof.width, height: proof.height }, metrics, file: path.basename(pngPath), bytes: fs.statSync(pngPath).size, sha256: sha256(pngPath) });
}

const exactHead = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
if (!/^[0-9a-f]{40}$/.test(exactHead)) throw new Error('Spatial lane proof could not resolve the exact checked-out head');
fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify({
  generatedAt: new Date().toISOString(), exactHead, productionMutations: 0,
  authority: 'server-permitted SchedulingTimeline staff only', screenshots: manifest,
}, null, 2)}\n`);
console.log(`Calendar Desktop spatial lane browser proof generated: ${manifest.length} screenshots`);
for (const item of manifest) console.log(`${item.name}: ${item.bytes} bytes sha256=${item.sha256}`);
