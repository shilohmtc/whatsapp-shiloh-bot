'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const express = require('express');
const { renderWorkspaceNavigation } = require('../src/presentation/workspaceShell');
const { DESTINATIONS } = require('../src/services/workspaceNavigation');
const { calendarPhoneAllStaffClientScript } = require('../src/presentation/calendarPhoneAllStaffUx');

function chromeExecutable() {
  return [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
    .find(candidate => candidate && fs.existsSync(candidate)) || null;
}

async function reservePort() {
  const server = http.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function poll(load, accept, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { const value = await load(); if (accept(value)) return value; } catch (_error) {}
    await new Promise(resolve => setTimeout(resolve, 40));
  }
  throw new Error('Timed out waiting for Workspace → Calendar entry proof');
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
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    clearTimeout(waiter.timeout);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result || {});
  });
  return {
    send(method, params = {}, timeoutMs = 15000) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
        pending.set(id, { resolve, reject, timeout });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { socket.close(); },
  };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result?.value;
}

function workspacePage() {
  const nav = renderWorkspaceNavigation({
    active: 'dashboard',
    dashboardHref: '/workspace',
    calendarHref: DESTINATIONS.calendar,
    clientsHref: '/clients',
    messagesHref: '/messages',
    staffHref: '/staff',
    servicesHref: '/services',
    reportsHref: '/reports',
  });
  return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><main>${nav}</main>`;
}

function calendarPage() {
  const script = calendarPhoneAllStaffClientScript().replace(/<\/script/gi, '<\\/script');
  const people = [['51','Abigail'],['52','Christel'],['53','Ilince'],['54','Marietjie'],['55','Naomi'],['56','Pieter'],['57','Savanna']];
  const buttons = people.map(([id,name]) => `<button class="phone-week-staff-toggle" data-phone-week-staff-id="${id}" data-phone-week-staff-rendered="true">${name}</button>`).join('');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--line:#ddd;--line-strong:#aaa;--leaf:#487;--leaf-deep:#264;--leaf-soft:#eef5ef;--ink:#223;--muted:#667}*{box-sizing:border-box}body{margin:0}.phone-calendar-v2-controls,.phone-calendar-v2-actions{display:grid}.phone-week-date-strip{display:grid;grid-template-columns:repeat(6,1fr)}.phone-week-staff-strip{display:flex;overflow:auto}.phone-week-staff-toggle{min-height:44px}.week-time-grid{display:grid;grid-template-columns:32px 1fr;height:660px}.time-rail,.time-column{height:660px;position:relative}.calendar-view{width:100%}.phone-plus-menu>summary{min-height:44px}</style></head><body data-phone-calendar-v2="true" data-calendar-view="week" data-phone-active-date="2026-09-11"><main class="workspace-main"><div class="shell"><section class="phone-calendar-v2-controls"><a data-phone-calendar-view="week" class="phone-view-option" href="/calendar/read-only?view=week&date=2026-09-11">Week</a><a data-phone-calendar-view="month" class="phone-view-option" href="/calendar/read-only?view=month&date=2026-09-11">Month</a></section><div class="phone-calendar-v2-actions"><a class="phone-today-action" href="/calendar/read-only?view=week&date=2026-09-11">Today</a><details class="phone-plus-menu"><summary>Appointment</summary></details></div><div class="calendar-view week-view"><section class="phone-week-planner-header"><nav class="phone-week-date-strip"><a data-phone-week-date="2026-09-11" href="/calendar/read-only?view=week&date=2026-09-11">Fri 11</a></nav><div class="phone-week-staff-strip">${buttons}</div></section><div class="week-time-grid"><aside class="time-rail"></aside><div class="week-grid"><section data-week-date-lane data-phone-active-day="true" data-date="2026-09-11"><div class="time-column"></div></section></div></div></div></div></main><script>${script}</script></body></html>`;
}

async function main() {
  const executable = chromeExecutable();
  if (!executable) {
    if (process.env.CI) throw new Error('CI must provide Chrome');
    console.log('Chrome not installed; Workspace Calendar entry proof is CI-only.');
    return;
  }
  const app = express();
  app.get('/workspace', (_req, res) => res.type('html').send(workspacePage()));
  app.get('/calendar/read-only', (_req, res) => res.type('html').send(calendarPage()));
  const server = http.createServer(app);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-workspace-calendar-entry-'));
  let chrome;
  let cdp;
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    const debugPort = await reservePort();
    chrome = spawn(executable, ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(directory,'profile')}`,'about:blank'], { stdio: ['ignore','ignore','pipe'] });
    const targets = await poll(async () => (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json(), items => Array.isArray(items) && items.some(item => item.type === 'page' && item.webSocketDebuggerUrl));
    cdp = await connectCdp(targets.find(item => item.type === 'page').webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 384, height: 832, deviceScaleFactor: 1, mobile: true, screenWidth: 384, screenHeight: 832 });
    await cdp.send('Page.navigate', { url: `${origin}/workspace` });
    await poll(() => evaluate(cdp, 'document.readyState'), value => value === 'complete');
    const href = await evaluate(cdp, `document.querySelector('[data-workspace-destination="calendar"]')?.getAttribute('href')||''`);
    assert.equal(href, '/calendar/read-only?view=week&staff=all');
    await evaluate(cdp, `document.querySelector('[data-workspace-destination="calendar"]').click();true`);
    await poll(() => evaluate(cdp, 'location.pathname'), value => value === '/calendar/read-only');
    const query = await evaluate(cdp, `({view:new URL(location.href).searchParams.get('view'),staff:new URL(location.href).searchParams.get('staff')})`);
    assert.deepEqual(query, { view: 'week', staff: 'all' });
    await poll(() => evaluate(cdp, `document.querySelectorAll('[data-phone-staff-column-id]').length`), value => value === 7);
    const state = await evaluate(cdp, `({headers:Array.from(document.querySelectorAll('[data-phone-staff-column-id]')).map(n=>n.textContent.trim()),allPressed:document.querySelector('[data-phone-week-staff-all]')?.getAttribute('aria-pressed')||''})`);
    assert.deepEqual(state.headers, ['Abigail','Christel','Ilince','Marietjie','Naomi','Pieter','Savanna']);
    assert.equal(state.allPressed, 'true');
    console.log('Workspace → Calendar browser entry proof passed: Week + All staff + seven named columns.');
  } finally {
    try { cdp?.close(); } catch (_error) {}
    try { chrome?.kill('SIGKILL'); } catch (_error) {}
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
