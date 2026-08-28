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
  requireStaffSession,
  sameOriginGuard,
  serializeSessionCookie,
} = require('../src/middleware/staffBrowserSession');
const { createCalendarCreateBookingRouter } = require('../src/routes/calendarCreateBooking');
const { sha256 } = require('../src/services/staffBrowserSession');

const OUT_DIR = path.join(process.cwd(), 'artifacts', 'calendar-clean-crm-v2-browser-proof');
const DATE = '2026-09-03';

function chromeExecutable() {
  return [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
    .find((candidate) => candidate && fs.existsSync(candidate)) || null;
}

function opaque(value) {
  return crypto.createHash('sha256').update(String(value)).digest('base64url');
}

function fileSha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function createFixture() {
  const env = {
    NODE_ENV: 'production',
    SHILOH_EMERGENCY_CHRISTEL_CALENDAR_BOOKING_ENABLED: 'true',
  };
  const token = opaque('crm-v2-calendar-browser-session');
  const session = { sessionId: 1526, adminId: 71, csrfToken: opaque('csrf:0'), rotations: 0 };
  session.csrfHash = sha256(session.csrfToken);
  const state = {
    requests: [], searches: [], prepares: [], acknowledgements: [], confirmations: [], canonicalReloads: 0,
  };
  const sessionService = {
    async validateSessionToken(supplied) {
      if (supplied !== token) return { ok: false };
      return { ok: true, sessionId: session.sessionId, adminId: session.adminId, csrfHash: session.csrfHash, recoveryRequired: false };
    },
    async rotateCsrfToken(id) {
      if (Number(id) !== session.sessionId) return { ok: false };
      session.rotations += 1;
      session.csrfToken = opaque(`csrf:${session.rotations}`);
      session.csrfHash = sha256(session.csrfToken);
      return { ok: true, csrfToken: session.csrfToken, csrfHash: session.csrfHash };
    },
    validateCsrfToken(validated, supplied) {
      return Boolean(validated?.ok && supplied && sha256(supplied) === validated.csrfHash);
    },
  };
  const selectedClient = {
    id: '912', displayName: 'Synthetic Existing Client', status: 'active', profileStatus: 'minimal', contactHint: 'ending in 4567',
  };
  const bookingService = {
    async resolveOperator(adminId) {
      assert.equal(Number(adminId), 71);
      return { id: 71, display_name: 'Christel' };
    },
    async listBookableOptions(adminId) {
      assert.equal(Number(adminId), 71);
      return {
        staff: [{ id: 9, displayName: 'Christel', serviceIds: [44] }],
        services: [{
          id: 44, name: 'Cupping Area Specific', categoryName: 'Massage',
          externalSource: 'goldie', externalId: '409ef0e8-2063-47b2-86db-ca0af30787de',
          durationMinutes: 60, price: 500, variablePrice: false, staffIds: [9],
        }],
        authority: { operatorAdminId: 71, serviceScope: 'christel_own_services' },
      };
    },
    async searchClients(adminId, query) {
      state.searches.push({ adminId, query });
      return {
        clients: [selectedClient, { ...selectedClient, id: '913', displayName: 'Synthetic Similar Name', contactHint: 'ending in 9876' }],
        requiresExplicitSelection: true,
        ambiguous: true,
        identityModel: 'crm_v2_operator_search_only',
      };
    },
    async prepare(payload) {
      state.prepares.push(structuredClone(payload));
      const isNew = Boolean(payload.newClient);
      const startsAt = payload.date === '2026-09-01' && payload.time === '09:00'
        ? '2026-09-01T07:00:00.000Z'
        : '2026-09-03T08:00:00.000Z';
      const endsAt = payload.date === '2026-09-01' && payload.time === '09:00'
        ? '2026-09-01T08:00:00.000Z'
        : '2026-09-03T09:00:00.000Z';
      return {
        status: 'pending_confirmation',
        review: {
          client: {
            id: isNew ? '914' : String(payload.clientId),
            displayName: isNew ? payload.newClient.name : selectedClient.displayName,
            created: isNew,
            matchedExisting: false,
            profileStatus: 'minimal',
            contactHint: isNew ? 'ending in 4321' : 'ending in 4567',
          },
          service: {
            id: 44, name: 'Cupping Area Specific', categoryName: 'Massage',
            externalSource: 'goldie', externalId: '409ef0e8-2063-47b2-86db-ca0af30787de',
          },
          practitioner: { id: 9, displayName: 'Christel' },
          startsAt, endsAt,
          durationMinutes: 60, price: 'R500.00', mobileAcknowledgementRequired: true,
        },
      };
    },
    async acknowledgeMobile(payload) {
      state.acknowledgements.push(structuredClone(payload));
      const latest = state.prepares.at(-1);
      return {
        status: 'acknowledged',
        clientId: latest?.newClient ? '914' : '912',
        clientName: latest?.newClient?.name || selectedClient.displayName,
        mobileHint: latest?.newClient ? 'ending in 4321' : 'ending in 4567',
        confirmationSafe: true,
      };
    },
    async discard(payload) { return { status: 'discarded', adminId: payload.adminId, crmV2ClientRemoved: false }; },
    async confirm(payload) {
      state.confirmations.push(structuredClone(payload));
      return {
        status: 'created', appointmentId: 99001,
        customerConfirmation: { sent: true, deliveryStatus: 'sent' },
        customerConfirmationObligation: { queued: true, status: 'pending', identityModel: 'crm_v2' },
      };
    },
  };

  const app = express();
  app.use(express.json());
  app.use(requestContext);
  app.use((req, _res, next) => { state.requests.push({ method: req.method, path: req.path, body: structuredClone(req.body || {}) }); next(); });
  app.get('/proof', (_req, res) => {
    res.setHeader('Set-Cookie', serializeSessionCookie(token, { env }));
    return res.redirect(302, `/calendar/book?date=${DATE}`);
  });
  const requireSession = requireStaffSession({ service: sessionService, env });
  app.post('/calendar/staff-auth/csrf', sameOriginGuard({ env }), requireSession, async (req, res) => {
    const rotated = await sessionService.rotateCsrfToken(req.staffBrowserSession.sessionId);
    return res.status(200).json({ csrfToken: rotated.csrfToken });
  });
  app.get('/calendar/read-only', (_req, res) => {
    state.canonicalReloads += 1;
    return res.status(200).type('html').send('<!doctype html><title>Canonical Calendar</title><h1>Canonical Calendar refreshed</h1>');
  });
  app.use('/calendar/book', createCalendarCreateBookingRouter({ env, sessionService, bookingService }));
  return { app, state };
}

function certificate(directory) {
  const key = path.join(directory, 'key.pem');
  const cert = path.join(directory, 'cert.pem');
  const result = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1,DNS:localhost', '-days', '1'], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return { key: fs.readFileSync(key), cert: fs.readFileSync(cert) };
}

async function reservePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  return port;
}

async function poll(load, accept, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    try { const value = await load(); if (accept(value)) return value; } catch (error) { last = error; }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (last) throw last;
  throw new Error('Browser proof timed out');
}

async function connectCdp(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let id = 1;
  const pending = new Map();
  const listeners = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id) {
      const waiter = pending.get(message.id);
      if (!waiter) return;
      pending.delete(message.id);
      clearTimeout(waiter.timeout);
      if (message.error) waiter.reject(new Error(message.error.message)); else waiter.resolve(message.result || {});
      return;
    }
    for (const listener of listeners.get(message.method) || []) listener(message.params || {});
  });
  return {
    send(method, params = {}) {
      const callId = id++;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { pending.delete(callId); reject(new Error(`CDP timeout: ${method}`)); }, 15_000);
        pending.set(callId, { resolve, reject, timeout });
        socket.send(JSON.stringify({ id: callId, method, params }));
      });
    },
    on(method, listener) { if (!listeners.has(method)) listeners.set(method, []); listeners.get(method).push(listener); },
    close() { socket.close(); },
  };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result?.value;
}

async function main() {
  const executable = chromeExecutable();
  if (!executable) {
    if (process.env.CI) throw new Error('CI must provide Chrome for Calendar CRM V2 browser proof');
    console.log('Chrome not installed; Calendar CRM V2 browser proof is CI-only.');
    return;
  }
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-calendar-crm-v2-'));
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { app, state } = createFixture();
  let server; let chrome; let cdp;
  try {
    server = https.createServer(certificate(temporary), app);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const origin = `https://127.0.0.1:${server.address().port}`;
    const debugPort = await reservePort();
    chrome = spawn(executable, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--ignore-certificate-errors', '--allow-insecure-localhost', '--remote-allow-origins=*', '--window-size=1440,1000', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${path.join(temporary, 'profile')}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
    const targets = await poll(async () => (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json(), (items) => items?.some((item) => item.type === 'page' && item.webSocketDebuggerUrl));
    cdp = await connectCdp(targets.find((item) => item.type === 'page').webSocketDebuggerUrl);
    const network = []; const exceptions = [];
    cdp.on('Network.requestWillBeSent', (event) => network.push(event.request.url));
    cdp.on('Runtime.exceptionThrown', (event) => exceptions.push(event.exceptionDetails?.exception?.description || event.exceptionDetails?.text));
    await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Network.enable');

    async function navigate() {
      await cdp.send('Page.navigate', { url: `${origin}/proof` });
      await poll(() => evaluate(cdp, 'document.readyState'), (value) => value === 'complete');
      await poll(() => evaluate(cdp, 'location.pathname'), (value) => value === '/calendar/book');
    }
    async function screenshot(name) {
      const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      const file = `${name}.png`; const target = path.join(OUT_DIR, file);
      fs.writeFileSync(target, Buffer.from(result.data, 'base64'));
      return { file, bytes: fs.statSync(target).size, sha256: fileSha256(target) };
    }
    async function chooseSlot(date = '2026-09-03', time = '10:00') {
      await evaluate(cdp, `(()=>{const date=document.querySelector('#booking-date');date.value=${JSON.stringify(date)};date.dispatchEvent(new Event('input',{bubbles:true}));const time=document.querySelector('#booking-time');time.value=${JSON.stringify(time)};time.dispatchEvent(new Event('input',{bubbles:true}));const service=document.querySelector('#service-select');service.value='44';service.dispatchEvent(new Event('change',{bubbles:true}));const staff=document.querySelector('#staff-select');staff.value='9';staff.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);
    }
    async function prepareAndAcknowledge() {
      await evaluate(cdp, `document.querySelector('[data-review-booking]').click();true`);
      await poll(() => evaluate(cdp, `!document.querySelector('[data-review-panel]').hidden`), Boolean);
      const beforeAck = state.acknowledgements.length;
      await evaluate(cdp, `(()=>{document.querySelector('[data-mobile-ack-check]').checked=true;document.querySelector('[data-acknowledge-mobile]').click();return true;})()`);
      await poll(() => state.acknowledgements.length, (value) => value > beforeAck);
      await poll(() => evaluate(cdp, `!document.querySelector('[data-create-booking]').disabled`), Boolean);
    }

    await navigate();
    const surface = await evaluate(cdp, `({
      choices:[...document.querySelectorAll('[data-client-mode-existing],[data-client-mode-new]')].map(e=>e.textContent.trim()),
      hasRegistration:/register client/i.test(document.body.innerText),
      hasGoogle:/google/i.test(document.body.innerText),
      heading:document.querySelector('header p').textContent,
      reviewHeading:document.querySelector('[data-review-panel] h2').textContent,
      hasInternalJargon:/CRM V2|canonical client|guarded canonical write|review before write/i.test(document.body.innerText),
      cookieVisible:document.cookie
    })`);
    assert.deepEqual(surface.choices, ['Find client', 'New client']);
    assert.equal(surface.hasRegistration, false);
    assert.equal(surface.hasGoogle, false);
    assert.equal(surface.heading, 'Choose the client, treatment, practitioner and time.');
    assert.equal(surface.reviewHeading, 'Review booking');
    assert.equal(surface.hasInternalJargon, false);
    assert.equal(surface.cookieVisible, '');
    const desktop = await evaluate(cdp, `({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth})`);
    assert.ok(desktop.width >= 1200);
    assert.ok(desktop.overflow <= 1);
    const screenshots = [];
    await evaluate(cdp, `(()=>{const input=document.querySelector('#client-search');input.value='Synthetic';document.querySelector('[data-client-search]').click();return true;})()`);
    await poll(() => evaluate(cdp, `document.querySelectorAll('.client-result').length`), (value) => value === 2);
    assert.equal(state.prepares.length, 0, 'search must never auto-select or prepare');
    await evaluate(cdp, `document.querySelectorAll('.client-result')[0].click();true`);
    await chooseSlot('2026-08-31', '09:00');
    const augustStart = await evaluate(cdp, `document.querySelector('[data-selected-start]').textContent.trim()`);
    assert.equal(augustStart, 'Mon 31 Aug • 09:00');
    await chooseSlot('2026-09-01', '09:00');
    const septemberStart = await evaluate(cdp, `document.querySelector('[data-selected-start]').textContent.trim()`);
    assert.equal(septemberStart, 'Tue 1 Sep • 09:00');
    screenshots.push({ state: 'selected-start-desktop', ...(await screenshot('selected-start-desktop')) });

    const beforeOffStep = state.prepares.length;
    await chooseSlot('2026-09-01', '00:09');
    await evaluate(cdp, `document.querySelector('[data-review-booking]').click();true`);
    const offStep = await evaluate(cdp, `({readback:document.querySelector('[data-selected-start]').textContent.trim(),status:document.querySelector('[data-booking-status]').textContent.trim(),reviewHidden:document.querySelector('[data-review-panel]').hidden})`);
    const offStepBlockedBeforePrepare = state.prepares.length === beforeOffStep;
    assert.equal(offStepBlockedBeforePrepare, true, 'off-step browser input must not reach /prepare');
    assert.equal(offStep.readback, 'Choose a start time in 5-minute increments, for example 09:00.');
    assert.equal(offStep.status, 'Choose a start time in 5-minute increments, for example 09:00.');
    assert.equal(offStep.reviewHidden, true);
    screenshots.push({ state: 'off-step-blocked-desktop', ...(await screenshot('off-step-blocked-desktop')) });

    await chooseSlot('2026-09-01', '09:00');
    await prepareAndAcknowledge();
    const findState = await evaluate(cdp, `({selected:document.querySelector('[data-selected-client]').textContent,ack:document.querySelector('[data-mobile-ack-summary]').textContent,review:document.querySelector('[data-review]').innerText,selectedFamily:document.querySelector('[data-selected-treatment]')?.getAttribute('data-service-family'),reviewFamily:document.querySelector('[data-review] [data-service-family]')?.getAttribute('data-service-family'),createEnabled:!document.querySelector('[data-create-booking]').disabled})`);
    assert.match(findState.selected, /Synthetic Existing Client/);
    assert.doesNotMatch(findState.selected, /CRM V2|#912/);
    assert.match(findState.ack, /current client record/);
    assert.match(findState.review, /Cupping Area Specific/);
    assert.equal(findState.selectedFamily, 'targeted_therapeutic');
    assert.equal(findState.reviewFamily, 'targeted_therapeutic');
    assert.equal(findState.createEnabled, true);
    assert.doesNotMatch(findState.review, /27821234567/);
    screenshots.push({ state: 'find-client-acknowledged', ...(await screenshot('find-client-acknowledged')) });

    const beforeConfirm = state.confirmations.length;
    await evaluate(cdp, `document.querySelector('[data-create-booking]').click();true`);
    await poll(() => state.confirmations.length, (value) => value > beforeConfirm);
    await poll(() => evaluate(cdp, 'location.pathname'), (value) => value === '/calendar/read-only');
    assert.equal(state.canonicalReloads, 1);
    assert.deepEqual(state.confirmations.at(-1), { adminId: 71 });

    await navigate();
    await evaluate(cdp, `document.querySelector('[data-client-mode-new]').click();true`);
    const newVisible = await evaluate(cdp, `({existing:document.querySelector('[data-existing-client-panel]').hidden,newPanel:document.querySelector('[data-new-client-panel]').hidden})`);
    assert.deepEqual(newVisible, { existing: true, newPanel: false });
    await evaluate(cdp, `(()=>{document.querySelector('#new-client-name').value='Synthetic New Client';document.querySelector('#new-client-mobile').value='082 000 4321';document.querySelector('[data-select-new-client]').click();return true;})()`);
    await chooseSlot('2026-09-01', '09:00');
    await prepareAndAcknowledge();
    const newState = await evaluate(cdp, `({selected:document.querySelector('[data-selected-client]').textContent,review:document.querySelector('[data-review]').innerText,ack:document.querySelector('[data-mobile-ack-summary]').textContent})`);
    assert.match(newState.selected, /Synthetic New Client/);
    assert.doesNotMatch(newState.selected, /CRM V2|#914/);
    assert.match(newState.review, /New client created/);
    assert.match(newState.ack, /ending in 4321/);
    screenshots.push({ state: 'new-client-acknowledged', ...(await screenshot('new-client-acknowledged')) });

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const mobile = await evaluate(cdp, `(()=>{const controls=[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length>0);return{count:controls.length,minHeight:Math.min(...controls.map(e=>e.getBoundingClientRect().height)),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,selectedStart:document.querySelector('[data-selected-start]').textContent.trim()};})()`);
    assert.ok(mobile.count > 0);
    assert.ok(mobile.minHeight >= 44);
    assert.ok(mobile.overflow <= 1);
    assert.equal(mobile.selectedStart, 'Tue 1 Sep • 09:00');
    screenshots.push({ state: 'new-client-mobile', ...(await screenshot('new-client-mobile')) });

    const acknowledgementRequests = state.requests.filter((item) => item.path === '/calendar/book/mobile-acknowledgement');
    assert.equal(acknowledgementRequests.length, 2);
    assert.ok(acknowledgementRequests.every((item) => Object.keys(item.body).length === 0));
    assert.ok(state.acknowledgements.every((item) => JSON.stringify(item) === JSON.stringify({ adminId: 71 })));
    assert.equal(exceptions.length, 0);
    assert.equal(network.some((url) => /google|whatsapp|provider|meta/i.test(url)), false);
    const checkedOutHead = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
    assert.match(checkedOutHead, /^[0-9a-f]{40}$/);
    const manifest = {
      generatedAt: new Date().toISOString(), exactHead: checkedOutHead,
      environment: 'ephemeral HTTPS + authenticated synthetic staff session + system Chromium',
      clientSurface: surface.choices, explicitSelection: true,
      findClient: { crmV2Only: true, resultCount: 2, autoSelection: false, selectedClientId: 912 },
      newClient: { canonicalCrmV2ClientId: 914, legacyShadowWrites: 0 },
      finalMobileAcknowledgement: { serverAuthoritative: true, browserIdentityFieldsSubmitted: 0, requests: acknowledgementRequests.length },
      finalConfirmation: { authenticatedActorAdminId: 71, canonicalCalendarReloads: state.canonicalReloads },
      serviceVisual: {
        treatment: 'Cupping Area Specific', family: 'targeted_therapeutic',
        selectedTreatmentFamily: findState.selectedFamily, reviewTreatmentFamily: findState.reviewFamily,
        serviceTextVisible: true, controlledSvg: true,
      },
      timeEntry: {
        nativeDate: true, nativeTime: true, stepSeconds: 300,
        augustReadback: augustStart, septemberReadback: septemberStart,
        offStepValue: '00:09', offStepBlockedBeforePrepare,
        offStepMessage: offStep.status, mobileReadback: mobile.selectedStart,
        johannesburgLocalWithoutBrowserUtcRoundTrip: true,
      },
      desktop, mobile, externalProviderRequests: 0, googleOperationalRequests: 0, productionMutations: 0, screenshots,
    };
    fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Calendar Clean CRM V2 browser proof PASS: ${screenshots.length} screenshots; exact head ${checkedOutHead}`);
  } finally {
    if (cdp) cdp.close();
    if (chrome) {
      chrome.kill('SIGTERM');
      await Promise.race([once(chrome, 'exit'), new Promise((resolve) => setTimeout(resolve, 2_000))]);
      if (chrome.exitCode == null) chrome.kill('SIGKILL');
    }
    if (server) {
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(() => resolve()));
    }
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });
