const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const express = require('express');
const { calendarPhoneAllStaffClientScript } = require('../src/presentation/calendarPhoneAllStaffUx');

const OUT_DIR = path.join(process.cwd(), 'artifacts', 'calendar-phone-operational-cleanup-v1');

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
    try {
      const value = await load();
      if (accept(value)) return value;
    } catch (_error) {}
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Timed out waiting for Phone Calendar cleanup proof');
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
        const timeout = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), timeoutMs);
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

function baseStyles() {
  return `:root{--line:#d8dfda;--line-strong:#a9b5ad;--leaf:#43805f;--leaf-deep:#275b45;--leaf-soft:#eef5ef;--panel:#fffdf9;--ink:#20322b;--muted:#69756f}*{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;overflow-x:hidden;font-family:Arial,sans-serif;color:var(--ink)}.workspace-main>.shell{padding:4px}.phone-calendar-v2-controls{display:grid}.phone-calendar-v2-actions{display:grid}.phone-week-date-strip{display:grid;grid-template-columns:repeat(6,1fr);gap:2px}.phone-week-date{min-height:44px}.phone-week-staff-strip{display:flex;gap:3px;overflow:auto}.phone-week-staff-toggle{min-height:44px;padding:6px 9px}.phone-plus-menu>summary{display:flex;min-height:44px;padding:8px;border:1px solid var(--leaf-deep);border-radius:9px;background:var(--leaf-deep);color:white}.phone-plus-popover{position:absolute;background:white;border:1px solid var(--line)}.calendar-view{width:100%;background:white}.week-time-grid{display:grid;grid-template-columns:32px minmax(0,1fr);height:900px;overflow:auto}.time-rail{position:relative}.time-rail span{display:block;height:60px;font-size:10px}.week-grid{min-width:0}.time-column{position:relative;height:900px;background:repeating-linear-gradient(to bottom,transparent 0,transparent 59px,var(--line) 59px,var(--line) 60px)}.positioned-event{position:absolute;height:50px;left:2px;width:calc(100% - 4px)}.event-card{height:100%;border:1px solid var(--line);background:#fff}.phone-view-option,.phone-staff-option,.phone-today-action{display:block}.month-grid{display:grid;grid-template-rows:auto 1fr;height:100%;border:1px solid var(--line)}.month-weekdays,.month-days{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))}.month-weekdays span{padding:6px 1px;text-align:center}.month-days{min-height:0}.month-day{border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.month-day-link{display:grid;place-items:center;width:100%;height:100%}`;
}

function controls(view) {
  return `<section class="phone-calendar-v2-controls"><details class="phone-date-menu"><summary>Date</summary></details><details class="phone-view-menu"><summary>${view === 'month' ? 'Month' : 'Week'}</summary><nav><a class="phone-view-option${view === 'week' ? ' active' : ''}" data-phone-calendar-view="week" href="/?view=week&date=2026-09-11">Week</a><a class="phone-view-option${view === 'month' ? ' active' : ''}" data-phone-calendar-view="month" href="/?view=month&date=2026-09-11">Month</a></nav></details><details class="phone-staff-menu"><summary>Abigail</summary><nav><a class="phone-staff-option" data-phone-staff-id="51" href="#">Abigail</a></nav></details></section>
<div class="phone-calendar-v2-actions"><a class="phone-today-action" href="/?view=${view}&date=2026-09-11">Today</a><details class="phone-plus-menu"><summary>Appointment</summary><div class="phone-plus-popover"><a data-phone-appointment-action href="/calendar/book?date=2026-09-11&staff=51">New appointment</a></div></details></div>`;
}

function weekFixtureHtml() {
  const script = calendarPhoneAllStaffClientScript().replace(/<\/script/gi, '<\\/script');
  const people = [
    ['51', 'Abigail'], ['52', 'Christel'], ['53', 'ILince'], ['54', 'Marietjie'], ['55', 'Naomi'], ['56', 'Pieter'], ['57', 'Savanna'],
  ];
  const staffButtons = people.map(([id, name], index) => `<button class="phone-week-staff-toggle${index === 0 ? ' active' : ''}" data-phone-week-staff-id="${id}" data-phone-week-staff-rendered="true">${name}</button>`).join('');
  const events = people.map(([id], index) => `<div class="positioned-event" style="top:${90 + index * 65}px"><article class="event-card" data-event-staff-ids="${id}">Client ${index + 1}</article></div>`).join('');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyles()}</style></head><body data-phone-calendar-v2="true" data-phone-active-date="2026-09-11"><main class="workspace-main"><div class="shell">${controls('week')}<div class="calendar-view week-view"><section class="phone-week-planner-header"><nav class="phone-week-date-strip"><a class="phone-week-date active" data-phone-week-date="2026-09-11" href="/?view=week&date=2026-09-11&staff=51&activeStaff=51">Fri 11</a></nav><div class="phone-week-staff-strip">${staffButtons}</div></section><div class="week-time-grid"><aside class="time-rail"><span>07:00</span><span>08:00</span><span>09:00</span><span>10:00</span><span>11:00</span><span>12:00</span><span>13:00</span><span>14:00</span><span>15:00</span><span>16:00</span><span>17:00</span><span>18:00</span><span>19:00</span><span>20:00</span></aside><div class="week-grid"><section class="week-day week-date-lane" data-week-date-lane data-phone-active-day="true" data-date="2026-09-11"><div class="time-column">${events}</div></section></div></div></div></div></main><script>${script}</script></body></html>`;
}

function monthFixtureHtml() {
  const script = calendarPhoneAllStaffClientScript().replace(/<\/script/gi, '<\\/script');
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<span>${day}</span>`).join('');
  const days = Array.from({ length: 30 }, (_, index) => `<section class="month-day"><a class="month-day-link" href="/?view=week&date=2026-09-${String(index + 1).padStart(2, '0')}">${index + 1}</a></section>`).join('');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyles()}</style></head><body data-phone-calendar-v2="true" data-phone-active-date="2026-09-11"><main class="workspace-main"><div class="shell">${controls('month')}<main class="calendar-view month-view"><div class="month-grid"><div class="month-weekdays">${weekdays}</div><div class="month-days">${days}</div></div></main></div></main><script>${script}</script></body></html>`;
}

async function screenshot(cdp, filename) {
  const image = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
  fs.writeFileSync(path.join(OUT_DIR, filename), Buffer.from(image.data, 'base64'));
}

async function main() {
  const executable = chromeExecutable();
  if (!executable) {
    if (process.env.CI) throw new Error('CI must provide Chrome');
    console.log('Chrome not installed; proof is CI-only.');
    return;
  }
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const app = express();
  app.get('/', (req, res) => res.type('html').send(req.query.view === 'month' ? monthFixtureHtml() : weekFixtureHtml()));
  const server = http.createServer(app);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-phone-cleanup-'));
  let chrome;
  let cdp;
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    const debugPort = await reservePort();
    chrome = spawn(executable, ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(directory,'profile')}`,'about:blank'], { stdio: ['ignore','ignore','pipe'] });
    const targets = await poll(async () => (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json(), items => Array.isArray(items) && items.some(item => item.type === 'page' && item.webSocketDebuggerUrl));
    cdp = await connectCdp(targets.find(item => item.type === 'page').webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width:390, height:844, deviceScaleFactor:1, mobile:true, screenWidth:390, screenHeight:844 });

    await cdp.send('Page.navigate', { url: `${origin}/?view=week&date=2026-09-11&phoneStaff=all` });
    await poll(() => evaluate(cdp, 'document.readyState'), value => value === 'complete');
    await poll(() => evaluate(cdp, `document.body.dataset.phoneAllStaff`), value => value === 'true');
    await poll(() => evaluate(cdp, `document.body.dataset.phoneCalendarSurfaceFitted`), value => value === 'true');
    const weekMetrics = await evaluate(cdp, `(() => {
      const visible=node=>{if(!node)return false;const style=getComputedStyle(node),rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;};
      const view=document.querySelector('.calendar-view');
      const grid=document.querySelector('.week-time-grid');
      const header=document.querySelector('[data-phone-all-staff-column-header]');
      const timeRail=document.querySelector('.time-rail');
      grid.scrollLeft=220;grid.dispatchEvent(new Event('scroll'));
      return {
        viewport:[innerWidth,innerHeight],
        utilityVisible:visible(document.querySelector('[data-phone-calendar-utility-bar]')),
        directViews:Array.from(document.querySelectorAll('[data-phone-calendar-direct-view]')).map(node=>node.textContent.trim()),
        todayVisible:visible(document.querySelector('[data-phone-calendar-today]')),
        todayHref:document.querySelector('[data-phone-calendar-today]')?.getAttribute('href')||'',
        todayDisabled:document.querySelector('[data-phone-calendar-today]')?.getAttribute('aria-disabled')||'',
        appointmentVisible:visible(document.querySelector('.phone-calendar-primary-action>summary')),
        oldControlsVisible:visible(document.querySelector('.phone-calendar-v2-controls')),
        oldActionsVisible:visible(document.querySelector('.phone-calendar-v2-actions')),
        dayContext:document.querySelector('[data-phone-calendar-day-context]')?.textContent.trim()||'',
        peopleLabel:getComputedStyle(document.querySelector('.phone-week-staff-strip'),'::before').content,
        headers:Array.from(document.querySelectorAll('[data-phone-all-staff-staff-id]')).map(node=>({label:node.textContent.trim(),width:Math.round(node.getBoundingClientRect().width)})),
        gridClientWidth:grid.clientWidth,
        gridScrollWidth:grid.scrollWidth,
        gridClientHeight:grid.clientHeight,
        gridScrollHeight:grid.scrollHeight,
        timeRailPosition:getComputedStyle(timeRail).position,
        headerTransform:header.style.transform,
        viewBottomGap:Math.round(innerHeight-view.getBoundingClientRect().bottom),
        viewHeight:Math.round(view.getBoundingClientRect().height),
        visibleLateLabels:Array.from(document.querySelectorAll('.time-rail span')).filter(node=>['19:00','20:00'].includes(node.textContent.trim())&&visible(node)).map(node=>node.textContent.trim()),
        eighteenVisible:Array.from(document.querySelectorAll('.time-rail span')).some(node=>node.textContent.trim()==='18:00'&&visible(node)),
        rootScrollWidth:document.documentElement.scrollWidth,
      };
    })()`);
    assert.deepEqual(weekMetrics.viewport, [390,844]);
    assert.equal(weekMetrics.utilityVisible, true);
    assert.deepEqual(weekMetrics.directViews, ['Week','Month']);
    assert.equal(weekMetrics.todayVisible, true);
    assert.match(weekMetrics.todayHref, /view=week/);
    assert.match(weekMetrics.todayHref, /date=2026-09-11/);
    assert.equal(weekMetrics.todayDisabled, 'true');
    assert.equal(weekMetrics.appointmentVisible, true);
    assert.equal(weekMetrics.oldControlsVisible, false);
    assert.equal(weekMetrics.oldActionsVisible, false);
    assert.match(weekMetrics.dayContext, /Friday.*11 September 2026/);
    assert.match(weekMetrics.peopleLabel, /People/);
    assert.equal(weekMetrics.headers.length, 7);
    assert.ok(weekMetrics.headers.every(header => header.width >= 115), `Unreadable practitioner widths: ${JSON.stringify(weekMetrics.headers)}`);
    assert.ok(weekMetrics.gridScrollWidth > weekMetrics.gridClientWidth + 300, `All staff grid is not horizontally scrollable: ${JSON.stringify(weekMetrics)}`);
    assert.ok(weekMetrics.gridClientHeight >= 380, `Week did not use remaining vertical viewport: ${JSON.stringify(weekMetrics)}`);
    assert.equal(weekMetrics.timeRailPosition, 'sticky');
    assert.match(weekMetrics.headerTransform, /-220px/);
    assert.ok(Math.abs(weekMetrics.viewBottomGap) <= 5, `Week does not fill viewport: ${JSON.stringify(weekMetrics)}`);
    assert.deepEqual(weekMetrics.visibleLateLabels, []);
    assert.equal(weekMetrics.eighteenVisible, true);
    assert.ok(weekMetrics.rootScrollWidth <= 391);
    await screenshot(cdp, 'phone-calendar-week-full-height.png');

    await cdp.send('Page.navigate', { url: `${origin}/?view=month&date=2026-09-11` });
    await poll(() => evaluate(cdp, 'document.readyState'), value => value === 'complete');
    await poll(() => evaluate(cdp, `document.body.dataset.phoneCalendarSurfaceFitted`), value => value === 'true');
    const monthMetrics = await evaluate(cdp, `(() => {
      const view=document.querySelector('.month-view');
      const grid=document.querySelector('.month-grid');
      const days=document.querySelector('.month-days');
      const cells=Array.from(document.querySelectorAll('.month-day'));
      const today=document.querySelector('[data-phone-calendar-today]');
      return {
        viewBottomGap:Math.round(innerHeight-view.getBoundingClientRect().bottom),
        viewHeight:Math.round(view.getBoundingClientRect().height),
        gridHeight:Math.round(grid.getBoundingClientRect().height),
        daysHeight:Math.round(days.getBoundingClientRect().height),
        cellHeights:cells.slice(0,6).map(node=>Math.round(node.getBoundingClientRect().height)),
        todayHref:today?.getAttribute('href')||'',
        todayDisabled:today?.getAttribute('aria-disabled')||'',
        rootScrollWidth:document.documentElement.scrollWidth,
      };
    })()`);
    assert.ok(Math.abs(monthMetrics.viewBottomGap) <= 5, `Month does not fill viewport: ${JSON.stringify(monthMetrics)}`);
    assert.ok(monthMetrics.viewHeight >= 730, `Month surface is too short: ${JSON.stringify(monthMetrics)}`);
    assert.ok(monthMetrics.gridHeight >= 720, `Month grid did not fill available surface: ${JSON.stringify(monthMetrics)}`);
    assert.ok(monthMetrics.daysHeight >= 680, `Month days did not expand: ${JSON.stringify(monthMetrics)}`);
    assert.ok(monthMetrics.cellHeights.every(height => height >= 125), `Month cells are not using vertical space: ${JSON.stringify(monthMetrics)}`);
    assert.match(monthMetrics.todayHref, /view=week/);
    assert.equal(monthMetrics.todayDisabled, '');
    assert.ok(monthMetrics.rootScrollWidth <= 391);
    await screenshot(cdp, 'phone-calendar-month-full-height.png');

    const exactHead = spawnSync('git', ['rev-parse','HEAD'], { encoding:'utf8' }).stdout.trim();
    fs.writeFileSync(path.join(OUT_DIR,'manifest.json'), `${JSON.stringify({ exactHead, viewport:{ width:390, height:844 }, weekMetrics, monthMetrics }, null, 2)}\n`);
    console.log(`Phone Calendar full-height proof PASS at ${exactHead}`);
  } finally {
    if (cdp) cdp.close();
    if (chrome && !chrome.killed) chrome.kill('SIGTERM');
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive:true, force:true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
