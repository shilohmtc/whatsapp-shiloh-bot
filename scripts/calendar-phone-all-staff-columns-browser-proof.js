const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const express = require('express');
const { calendarPhoneAllStaffClientScript } = require('../src/presentation/calendarPhoneAllStaffUx');

const OUT_DIR = path.join(process.cwd(), 'artifacts', 'calendar-phone-all-staff-columns-v1');

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
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await load();
      if (accept(value)) return value;
    } catch (error) { lastError = error; }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (lastError) throw lastError;
  throw new Error('Timed out waiting for Phone All staff columns proof');
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
    if (message.error) waiter.reject(new Error(`${message.error.code}: ${message.error.message}`));
    else waiter.resolve(message.result || {});
  });
  return {
    send(method, params = {}, timeoutMs = 15000) {
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
    close() { socket.close(); },
  };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Browser evaluation failed');
  return result.result?.value;
}

function fixtureHtml() {
  const appScript = calendarPhoneAllStaffClientScript().replace(/<\/script/gi, '<\\/script');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{--line:#d9dfda;--line-strong:#a9b4ad;--leaf-deep:#275b45;--leaf:#43805f;--leaf-soft:#edf5ef;--ink:#20322b;--muted:#66736d}
*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:var(--ink)}.workspace-main{width:100%}.phone-week-planner-header{display:grid;background:#fafbf8}.phone-week-date-strip{display:grid;grid-template-columns:repeat(6,1fr);gap:2px;padding:2px}.phone-week-date{min-height:44px;display:grid;place-items:center}.phone-week-staff-strip{display:flex;gap:3px;padding:2px 3px 3px;overflow-x:auto}.phone-week-staff-toggle{min-height:44px;padding:6px 9px;border:1px solid var(--line);border-radius:9px;background:white}.phone-week-staff-toggle.active{background:var(--leaf-soft)}.week-time-grid{display:grid;grid-template-columns:32px minmax(0,1fr);width:100%;height:660px;overflow:hidden}.time-rail{border-right:1px solid var(--line)}.week-grid{display:block}.week-day{display:block}.time-column{position:relative;height:660px;background:repeating-linear-gradient(to bottom,transparent 0,transparent 29px,var(--line) 29px,var(--line) 30px)}.positioned-event{position:absolute;top:180px;height:88px;left:2px;width:calc(100% - 4px)}.positioned-event.second{top:290px}.positioned-event.third{top:390px}.event-card{height:100%;padding:4px;border:1px solid #aab7af;border-left:3px solid var(--leaf);background:white;border-radius:4px;overflow:hidden}.event-card strong{display:block;font-size:11px}.event-card span{font-size:10px}.phone-staff-option,.phone-view-option,.phone-date-cell,.phone-today-action{display:none}
</style></head><body data-phone-calendar-v2="true"><main class="workspace-main"><section class="phone-week-planner-header"><nav class="phone-week-date-strip"><a class="phone-week-date" data-phone-week-date="2026-09-11" href="/?view=week&date=2026-09-11&staff=51&staff=52&staff=53&activeStaff=51">Fri 11</a></nav><div class="phone-week-staff-strip"><button class="phone-week-staff-toggle active" data-phone-week-staff-id="51" data-phone-week-staff-rendered="true">Abigail</button><button class="phone-week-staff-toggle" data-phone-week-staff-id="52" data-phone-week-staff-rendered="true">Christel</button><button class="phone-week-staff-toggle" data-phone-week-staff-id="53" data-phone-week-staff-rendered="true">Naomi</button></div></section><div class="week-view"><div class="week-time-grid"><aside class="time-rail"></aside><div class="week-grid"><section class="week-day week-date-lane" data-week-date-lane data-phone-active-day="true" data-date="2026-09-11"><div class="time-column"><div class="positioned-event" data-phone-staff-visible="true"><article class="event-card" data-event-staff-ids="51"><strong>Client A</strong><span>Abigail</span></article></div><div class="positioned-event second" data-phone-staff-visible="false"><article class="event-card" data-event-staff-ids="52"><strong>Client B</strong><span>Christel</span></article></div><div class="positioned-event third" data-phone-staff-visible="false"><article class="event-card" data-event-staff-ids="53"><strong>Client C</strong><span>Naomi</span></article></div></div></section></div></div></div></main><script>${appScript}</script></body></html>`;
}

async function main() {
  const executable = chromeExecutable();
  if (!executable) {
    if (process.env.CI) throw new Error('CI must provide Chrome for Phone All staff columns proof');
    console.log('Chrome not installed; Phone All staff columns proof is CI-only.');
    return;
  }
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const app = express();
  app.get('/', (_req, res) => res.type('html').send(fixtureHtml()));
  const server = http.createServer(app);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-phone-columns-'));
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
    await cdp.send('Page.navigate', { url: origin });
    await poll(() => evaluate(cdp, 'document.readyState'), value => value === 'complete');
    await poll(() => evaluate(cdp, `Boolean(document.querySelector('[data-phone-week-staff-all]'))`), Boolean);
    await evaluate(cdp, `document.querySelector('[data-phone-week-staff-all]').click();true`);
    await poll(() => evaluate(cdp, `document.body.dataset.phoneAllStaff`), value => value === 'true');
    const metrics = await evaluate(cdp, `(() => {
      const headers=Array.from(document.querySelectorAll('[data-phone-all-staff-staff-id]'));
      const events=Array.from(document.querySelectorAll('.positioned-event'));
      const rects=events.map(node=>node.getBoundingClientRect());
      const timeColumn=document.querySelector('.time-column');
      return {
        headerLabels:headers.map(node=>node.textContent.trim()),
        headerWidths:headers.map(node=>Math.round(node.getBoundingClientRect().width)),
        eventLefts:rects.map(rect=>Math.round(rect.left-timeColumn.getBoundingClientRect().left)),
        eventWidths:rects.map(rect=>Math.round(rect.width)),
        allVisible:events.every(node=>getComputedStyle(node).display!=='none'),
        columnBackground:getComputedStyle(timeColumn).getPropertyValue('--phone-all-staff-columns').trim(),
        rootScrollWidth:document.documentElement.scrollWidth,
        viewportWidth:innerWidth,
      };
    })()`);
    assert.deepEqual(metrics.headerLabels, ['Abigail','Christel','Naomi']);
    assert.equal(metrics.headerWidths.length, 3);
    assert.ok(metrics.headerWidths.every(width => width >= 110 && width <= 125), `Unexpected Phone column header widths: ${metrics.headerWidths}`);
    assert.equal(metrics.allVisible, true);
    assert.ok(metrics.eventLefts[0] < metrics.eventLefts[1] && metrics.eventLefts[1] < metrics.eventLefts[2], `Appointments are not in practitioner columns: ${metrics.eventLefts}`);
    assert.ok(metrics.eventWidths.every(width => width >= 110 && width <= 125), `Unexpected Phone event widths: ${metrics.eventWidths}`);
    assert.match(metrics.columnBackground, /linear-gradient/);
    assert.ok(metrics.rootScrollWidth <= metrics.viewportWidth + 1, `Phone All staff columns leaked horizontal overflow: ${metrics.rootScrollWidth}px`);
    const image = await cdp.send('Page.captureScreenshot', { format:'png', captureBeyondViewport:false, fromSurface:true });
    fs.writeFileSync(path.join(OUT_DIR,'phone-all-staff-columns.png'), Buffer.from(image.data,'base64'));
    const exactHead = spawnSync('git', ['rev-parse','HEAD'], { encoding:'utf8' }).stdout.trim();
    fs.writeFileSync(path.join(OUT_DIR,'manifest.json'), `${JSON.stringify({ exactHead, viewport:{width:390,height:844}, metrics }, null, 2)}\n`);
    console.log(`Phone All staff columns browser proof PASS at ${exactHead}`);
  } finally {
    if (cdp) cdp.close();
    if (chrome && !chrome.killed) chrome.kill('SIGTERM');
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive:true, force:true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
