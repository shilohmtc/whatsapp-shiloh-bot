'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const express = require('express');

const requestContext = require('../src/middleware/requestContext');
const { createWorkspaceOperationalRouter } = require('../src/routes/workspaceOperational');

const OUT_DIR = path.join(process.cwd(), 'artifacts', 'workspace-dashboard-carryover-849');
const SESSION = 'synthetic-carryover-session';
const ENV = {
  NODE_ENV: 'test',
  SHILOH_CALENDAR_READONLY_UX_ENABLED: 'true',
  SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED: 'true',
};

function chromeExecutable() {
  return [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
    .find(candidate => candidate && fs.existsSync(candidate)) || null;
}

function pngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), bytes: buffer.length };
}

function dashboardModel() {
  const staff = [
    { id: 31, displayName: 'Abigail' },
    { id: 32, displayName: 'Christel' },
  ];
  const current = {
    id: 9101, kind: 'appointment', canonical: true,
    startsAt: '2026-09-11T07:00:00.000Z', endsAt: '2026-09-11T08:00:00.000Z',
    status: 'scheduled', revision: '2026-09-11T06:30:00.000Z',
    clientName: 'Today Client', serviceName: 'Today Treatment', staffIds: [31],
    operationalDateKey: '2026-09-11', needsFinalization: true, canFinalize: true,
  };
  const wednesday = {
    id: 9001, kind: 'appointment', canonical: true,
    startsAt: '2026-09-09T13:30:00.000Z', endsAt: '2026-09-09T14:30:00.000Z',
    status: 'scheduled', revision: '2026-09-09T13:00:00.000Z',
    clientName: 'Wednesday Client', serviceName: 'Older Carry-over Treatment', staffIds: [32],
    operationalDateKey: '2026-09-09', needsFinalization: true, canFinalize: true,
  };
  const thursday = {
    id: 9002, kind: 'appointment', canonical: true,
    startsAt: '2026-09-10T13:30:00.000Z', endsAt: '2026-09-10T14:30:00.000Z',
    status: 'scheduled', revision: '2026-09-10T13:00:00.000Z',
    clientName: 'Thursday Client', serviceName: 'Recent Carry-over Treatment', staffIds: [31],
    operationalDateKey: '2026-09-10', needsFinalization: true, canFinalize: true,
  };
  return {
    generatedAt: '2026-09-11T14:00:00.000Z',
    requestedDateKey: '2026-09-11', operationalDateKey: '2026-09-11', carryOverDateKey: '2026-09-10',
    displayName: 'Clinic Owner', mode: 'owner_overview', linkedStaffId: null,
    calendar: { dateKey: '2026-09-11', timeline: { staff, appointments: [current], closures: [] } },
    appointments: [current], carryOver: [wednesday, thursday],
    teamGroups: [{ key: 'staff:31', label: 'Abigail', appointments: [current] }],
    awaitingFinalization: [current], bookingRequests: [], recentActivity: [], closures: [],
    communications: null, communicationsUnavailable: false,
  };
}

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(requestContext);
  const sessionService = {
    async validateSessionToken(token) {
      if (token !== SESSION) return { ok: false };
      return { ok: true, sessionId: 849, adminId: 77, recoveryRequired: false, viewer: { calendarScope: 'business_all_staff', operatorAdminId: 77 } };
    },
    validateCsrfToken() { return false; },
  };
  const dashboardService = {
    async buildModel() { return dashboardModel(); },
    async finalizeVisit() { throw new Error('browser proof must not mutate'); },
    async resolveBookingRequest() { throw new Error('browser proof must not mutate'); },
  };
  app.get('/proof', (_req, res) => {
    res.setHeader('Set-Cookie', `shiloh_staff_session=${SESSION}; Path=/; HttpOnly; SameSite=Strict`);
    return res.redirect(302, '/calendar/workspace');
  });
  app.get('/calendar/staff/client.js', (_req, res) => res.type('application/javascript').send("'use strict';"));
  app.use('/calendar/workspace', createWorkspaceOperationalRouter({
    env: ENV,
    sessionService,
    dashboardService,
    navigationService: { async resolve() { return {}; } },
  }));
  return app;
}

async function capture(executable, origin, name, width, height, directory) {
  const screenshot = path.join(OUT_DIR, `${name}.png`);
  const profile = path.join(directory, `${name}-profile`);
  const child = spawn(executable, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars',
    `--window-size=${width},${height}`, '--force-device-scale-factor=1', '--virtual-time-budget=1000',
    `--user-data-dir=${profile}`, `--screenshot=${screenshot}`, `${origin}/proof`,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr = `${stderr}${String(chunk)}`.slice(-6000); });
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error(`Chrome carry-over proof failed (${name}): ${stderr}`);
  const dimensions = pngDimensions(screenshot);
  assert.equal(dimensions.width, width);
  assert.equal(dimensions.height, height);
  assert.ok(dimensions.bytes > 20_000, `${name} screenshot is unexpectedly small`);
  return { file: path.basename(screenshot), ...dimensions };
}

async function main() {
  const executable = chromeExecutable();
  if (!executable) {
    if (process.env.CI) throw new Error('CI must provide Chrome for #852 carry-over browser proof');
    console.log('Chrome not installed; #852 carry-over browser proof is CI-only.');
    return;
  }
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-dashboard-carryover-'));
  const app = createApp();
  const server = http.createServer(app);
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;

    const direct = await fetch(`${origin}/calendar/workspace`, { redirect: 'manual' });
    assert.equal(direct.status, 401, 'unauthenticated machine-style request must remain a 401');
    const proofResponse = await fetch(`${origin}/proof`, { redirect: 'manual' });
    assert.equal(proofResponse.status, 302);
    assert.match(String(proofResponse.headers.get('set-cookie') || ''), /shiloh_staff_session=/);

    const html = require('../src/presentation/workspaceDashboardUx').renderDashboardPage(dashboardModel());
    assert.match(html, /data-dashboard-carryover-panel/);
    assert.match(html, /Unfinished visits/);
    assert.match(html, /data-dashboard-carryover-day="2026-09-09"/);
    assert.match(html, /data-dashboard-carryover-day="2026-09-10"/);
    assert.match(html, /Wednesday Client/);
    assert.match(html, /Thursday Client/);
    assert.match(html, /Older Carry-over Treatment/);
    assert.match(html, /data-operational-date-key="2026-09-09"/);
    assert.match(html, /data-dashboard-finalize="completed"/);
    assert.match(html, /data-dashboard-finalize="no_show"/);

    const screenshots = [
      await capture(executable, origin, 'desktop-dashboard-carryover', 1440, 960, directory),
      await capture(executable, origin, 'phone-dashboard-carryover', 390, 844, directory),
    ];
    const exactHead = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
    assert.match(exactHead, /^[0-9a-f]{40}$/);
    fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify({
      generatedAt: new Date().toISOString(), exactHead, authenticatedRoute: true, syntheticDataOnly: true,
      productionReads: 0, productionMutations: 0, providerNetworkCalls: 0, realClientSends: 0,
      carryOverDateKeys: ['2026-09-09', '2026-09-10'], carryOverRows: 2, desktopAndPhone: true, screenshots,
    }, null, 2)}\n`);
    console.log(`#852 authenticated Dashboard unresolved-backlog proof passed at ${exactHead}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
