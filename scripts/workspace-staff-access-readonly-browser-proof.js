// Permanent synthetic authenticated regression proof for the bounded Staff Access editor.
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
const { createWorkspaceStaffRouter } = require('../src/routes/workspaceStaff');
const { createWorkspaceStaffMutationRouter } = require('../src/routes/workspaceStaffMutations');
const OUT_DIR = path.join(process.cwd(), 'artifacts', 'workspace-staff-access-readonly-v1');
const ENV = { SHILOH_CALENDAR_READONLY_UX_ENABLED: 'true', SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED: 'true' };
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

async function main() {
  const executable = chromeExecutable();
  if (!executable) throw new Error('Chrome is required for authenticated Staff Access proof');
  let incompatible = false;
  let mutationCalls = 0;
  const sessionService = {
    validateSessionToken: async token => token === 'synthetic-access-session' ? { ok: true, adminId: 61, viewer: { calendarScope: 'business_all_staff' } } : { ok: false },
    validateCsrfToken: () => false,
  };
  const accessService = { resolveManageAccess: async id => id === 61 ? { operatorAdminId: 61 } : null, enableWorkspaceAccess: async () => { mutationCalls++; throw new Error('Proof must not enable access'); } };
  const staffService = {
    getStaffDetail: async ({ adminId }) => {
      assert.equal(adminId, 61);
      return {
        staff: { id: 17, display_name: 'Synthetic Practitioner', status: 'active', resource_type: 'practitioner', business_role: 'employee_practitioner', scheduling_type: 'regular', client_bookable: true },
        services: [{ name: 'Synthetic treatment', duration_minutes: 60, status: 'active' }], manageAllowed: false,
        access: incompatible
          ? { businessRole: 'business_admin', calendarScope: 'all_business', serviceScope: 'all_services', capabilities: ['appointment:view', 'staff:manage'] }
          : { businessRole: 'employee_practitioner', calendarScope: 'own_appointments', serviceScope: 'own_services', capabilities: ['appointment:view'] },
      };
    },
  };
  const app = express(); app.use(express.json());
  app.get('/calendar/staff/client.js', (_req, res) => res.type('js').send(''));
  app.use('/calendar/team', createWorkspaceStaffMutationRouter({ env: ENV, sessionService, accessService }));
  app.use('/calendar/team', createWorkspaceStaffRouter({ env: ENV, sessionService, service: staffService, accessService, clientAccessService: { resolveAccess: async () => null } }));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-access-proof-'));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let server, chrome, cdp;
  try {
    server = https.createServer(createCertificate(directory), app);
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const origin = `https://127.0.0.1:${server.address().port}`;
    const port = await reservePort();
    chrome = spawn(executable, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars', '--ignore-certificate-errors', '--remote-allow-origins=*', `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(directory, 'profile')}`, 'about:blank'], { stdio: 'ignore' });
    const targets = await poll(async () => (await fetch(`http://127.0.0.1:${port}/json/list`)).json(), v => v.some(t => t.type === 'page'));
    cdp = await connectCdp(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Network.enable');
    let dialogs = 0;
    cdp.on('Page.javascriptDialogOpening', () => { dialogs++; });
    await cdp.send('Page.navigate', { url: `${origin}/calendar/team/17` });
    await poll(() => evaluate(cdp, 'document.body.innerText'), value => value.includes('Unauthorized'));
    await cdp.send('Network.setCookie', { name: 'shiloh_staff_session', value: 'synthetic-access-session', url: origin, secure: true, httpOnly: true, sameSite: 'Strict' });
    const screenshots = [];
    for (const broader of [false, true]) {
      incompatible = broader;
      for (const [name, width, height] of [['desktop', 1440, 960], ['phone', 390, 844]]) {
        await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width === 390 });
        await cdp.send('Page.navigate', { url: `${origin}/calendar/team/17?proof=${name}-${broader}` });
        await poll(() => evaluate(cdp, `document.readyState==='complete' && !!document.querySelector('[data-staff-access-readonly]')`), Boolean);
        await evaluate(cdp, `document.querySelector('[data-staff-access-readonly]').closest('section').scrollIntoView({block:'start'}); true`);
        await new Promise(r => setTimeout(r, 200));
        const geometry = await evaluate(cdp, `({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth, editor:!!document.querySelector('[data-staff-access-policy-form]'), controls:document.querySelector('[data-staff-access-readonly]').closest('section').querySelectorAll('button,input,select,textarea').length,text:document.body.innerText,targets:Array.from(document.querySelectorAll('a.button,button')).filter(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0;}).map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height}))})`);
        assert.equal(geometry.width, width); assert.equal(geometry.overflow, false);
        assert.equal(geometry.editor, false); assert.equal(geometry.controls, 0);
        assert.doesNotMatch(geometry.text, /Save access|synthetic-access-session|password|TOTP/);
        if (!broader) { assert.match(geometry.text, /Own appointments/); assert.match(geometry.text, /Own services/); }
        if (width === 390) assert.ok(geometry.targets.every(t => t.height >= 44 && t.width >= 44));
        const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        const file = `${name}-${broader ? 'incompatible' : 'practitioner'}-access.png`;
        fs.writeFileSync(path.join(OUT_DIR, file), Buffer.from(result.data, 'base64'));
        screenshots.push({ file, width, height, sha256: fileSha256(path.join(OUT_DIR, file)), noOverflow: true, accessControls: 0, touchTargets: geometry.targets });
      }
    }
    const rejected = await evaluate(cdp, `fetch('/calendar/team/17/access/policy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({capabilities:['booking:update']})}).then(r=>r.status)`);
    assert.equal(rejected, 404); assert.equal(mutationCalls, 0); assert.equal(dialogs, 0);
    const exactHead = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
    fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify({ exactHead, syntheticDataOnly: true, authenticated: true, productionReads: 0, productionMutations: 0, providerWrites: 0, policyWrites: mutationCalls, removedEndpointStatus: rejected, nativeDialogs: dialogs, screenshots }, null, 2));
    console.log(`Authenticated Staff Access proof passed: ${screenshots.length} screenshots; no policy writes or native dialogs.`);
  } finally {
    cdp?.close(); chrome?.kill('SIGTERM');
    if (server) await new Promise(r => server.close(r));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
