const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
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

function buildModel(view) {
  const dateKeys = ['2026-08-27','2026-08-28','2026-08-29','2026-08-30','2026-08-31','2026-09-01','2026-09-02'];
  const appointments = [
    {
      id: 7001, kind: 'appointment', canonical: true, source: 'appointments', status: 'scheduled',
      clientName: 'Demo Client', serviceName: 'Bamboo Sports Massage - Area Specific',
      startsAt: '2026-08-27T06:00:00.000Z', endsAt: '2026-08-27T07:00:00.000Z',
      staffIds: [1], staff: [{ staffId: 1, nameSnapshot: 'Christel' }],
    },
    {
      id: 7002, kind: 'appointment', canonical: true, source: 'appointments', status: 'confirmed',
      clientName: 'Sample Client', serviceName: 'Therapeutic Massage',
      startsAt: '2026-08-28T08:00:00.000Z', endsAt: '2026-08-28T09:00:00.000Z',
      staffIds: [2], staff: [{ staffId: 2, nameSnapshot: 'Abigail' }],
    },
  ];
  const blocks = [{
    id: 8001, kind: 'calendar_block', canonical: true, source: 'staff_calendar_blocks',
    blockType: 'admin', title: 'Admin block', startsAt: '2026-08-27T09:00:00.000Z', endsAt: '2026-08-27T09:30:00.000Z', staffIds: [2],
  }];
  return {
    view,
    dateKey: '2026-08-27',
    selectedStaffId: null,
    permittedStaff: [{ id: 1, displayName: 'Christel' }, { id: 2, displayName: 'Abigail' }],
    period: {
      startKey: '2026-08-27', previousAnchor: '2026-08-26', nextAnchor: view === 'day' ? '2026-08-28' : '2026-09-03',
      dateKeys: view === 'day' ? ['2026-08-27'] : dateKeys,
    },
    timeline: {
      staff: [{ id: 1, displayName: 'Christel' }, { id: 2, displayName: 'Abigail' }],
      workingWindows: [
        { staffId: 1, dayOfWeek: 4, startsLocal: '08:00:00', endsLocal: '17:00:00' },
        { staffId: 2, dayOfWeek: 4, startsLocal: '08:00:00', endsLocal: '17:00:00' },
      ],
      scheduleExceptions: [], recurringClosures: [], closures: [], leave: [], externalBusy: [],
      appointments, blocks, events: [...appointments, ...blocks],
    },
  };
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const chrome = chromeExecutable();
if (!chrome) {
  if (process.env.CI) throw new Error('CI must provide Chrome for Calendar cockpit visual proof');
  console.log('Chrome not installed; visual proof generation skipped outside CI.');
  process.exit(0);
}

const outDir = path.join(process.cwd(), 'artifacts', 'calendar-cockpit-visual-proof');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const manifest = [];

for (const view of ['day', 'week', 'agenda']) {
  const html = applyCalendarResponsivePolish(renderCalendarPage(buildModel(view), {
    operationalActions: [{ label: 'Create booking', href: '/calendar/book?date=2026-08-27', tone: 'primary' }],
    timelineReadOnlyMessage: 'Timeline remains read-only. New booking creation uses the guarded Shiloh workflow.',
  }));
  if (/Google-only|Non-canonical|PR #395|Confirm client contact|client-authority/i.test(html)) {
    throw new Error(`${view} visual proof contains prohibited legacy Calendar text`);
  }
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const htmlPath = path.join(outDir, `${view}-${viewport.name}.html`);
    const pngPath = path.join(outDir, `${view}-${viewport.name}.png`);
    fs.writeFileSync(htmlPath, html);
    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-calendar-proof-'));
    const result = spawnSync(chrome, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars',
      '--force-device-scale-factor=1', `--window-size=${viewport.width},${viewport.height}`,
      `--user-data-dir=${profileDir}`, `--screenshot=${pngPath}`, '--virtual-time-budget=1000',
      pathToFileURL(htmlPath).href,
    ], { encoding: 'utf8' });
    fs.rmSync(profileDir, { recursive: true, force: true });
    if (result.status !== 0 || !fs.existsSync(pngPath)) {
      throw new Error(`Chromium screenshot failed for ${view}/${viewport.name}: ${result.stderr || result.stdout || result.status}`);
    }
    const stat = fs.statSync(pngPath);
    manifest.push({ view, viewport, file: path.basename(pngPath), bytes: stat.size, sha256: sha256(pngPath) });
  }
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), screenshots: manifest }, null, 2)}\n`);
console.log(`Calendar cockpit visual proof generated: ${manifest.length} screenshots`);
for (const item of manifest) console.log(`${item.view}/${item.viewport.name}: ${item.bytes} bytes sha256=${item.sha256}`);
