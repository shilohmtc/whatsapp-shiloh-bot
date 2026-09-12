'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const express = require('express');
const { calendarAppointmentCompactEditorClientScript } = require('../src/presentation/calendarAppointmentCompactEditorUx');
const {
  chromeExecutable,
  reservePort,
  poll,
  connectCdp,
  evaluate,
} = require('./workspace-staff-access-readonly-browser-proof');

const OUT = path.join(process.cwd(), 'artifacts', 'calendar-appointment-compact-editor');

function fixture() {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--ink:#20322b;--muted:#56685f;--panel:#fffdf9;--line:#dce3dd;--line-strong:#c8d3cb;--leaf-soft:#e7eee9;--leaf-deep:#294c3c}*{box-sizing:border-box}body{margin:0;background:#f4f3ed;color:var(--ink);font-family:Inter,system-ui,sans-serif}.management-panel{border:0;padding:0;background:transparent;max-width:none;max-height:none;width:100%;height:100%;margin:0}.management-card{position:absolute;right:0;top:0;height:100%;width:min(460px,100%);overflow:auto;background:var(--panel);padding:22px;box-shadow:-12px 0 40px rgba(20,45,35,.2)}.panel-head{display:flex;justify-content:space-between;gap:12px;align-items:start;border-bottom:1px solid var(--line);padding-bottom:14px}.panel-head h2{margin:3px 0;font-size:1.25rem}.panel-close{border:1px solid var(--line);background:#fff;border-radius:999px;width:44px;height:44px}.panel-summary{margin:16px 0;padding:12px;border-radius:12px;background:var(--leaf-soft);display:grid;gap:4px}.panel-actions{display:grid;gap:14px}.panel-action{display:none;border-top:1px solid var(--line);padding-top:14px}.panel-action.visible{display:grid;gap:9px}.panel-action label{display:grid;gap:5px;font-size:.76rem;font-weight:750}.panel-action input,.panel-action select,.panel-action textarea{width:100%;min-height:44px;border:1px solid var(--line-strong);border-radius:9px;padding:9px;font:inherit;background:#fff}.panel-action button{min-height:44px;border:0;border-radius:9px;padding:10px 13px;background:var(--leaf-deep);color:#fff;font:inherit;font-weight:800}.panel-action.danger button{background:#843f35}.eyebrow{font-size:.66rem;text-transform:uppercase;letter-spacing:.11em;font-weight:850;color:var(--muted)}h3,p{margin:0}.end-time-state,.treatment-price-current{padding:11px;border-radius:10px;background:var(--leaf-soft);display:grid;gap:4px}@media(max-width:700px){.management-card{top:auto;bottom:0;height:min(92dvh,760px);width:100%;border-radius:18px 18px 0 0;padding:16px}}</style></head><body><dialog open class="management-panel" data-calendar-management-panel><section class="management-card"><header class="panel-head"><div><span class="eyebrow">Appointment</span><h2 data-panel-title>Appointment #667</h2></div><button class="panel-close" type="button">×</button></header><div class="panel-summary"><strong data-panel-client>Rozel Janse van Rensburg</strong><span>+27 82 304 2241</span><span data-panel-service>Sports Massage Full Body</span><span data-panel-practitioners>Abigail</span><span data-panel-time>2026-09-12 at 08:00</span><span>completed</span></div><section class="panel-summary" data-panel-confirmation><span class="eyebrow">Communication</span><strong>Booking confirmation: Read on WhatsApp</strong><span>Last evidence: 10 Sept 2026, 13:56</span></section><form class="panel-action visible appointment-notes-manage" data-appointment-notes-form><span class="eyebrow">Internal notes</span><textarea rows="5" placeholder="Internal context for staff only"></textarea><span class="panel-hint">Internal only — not included in client confirmations or reminders.</span><button type="submit">Save notes</button></form><div class="panel-actions"><form class="panel-action visible appointment-treatment-price" data-treatment-price-form><span class="eyebrow">Treatment &amp; price</span><h3>Correct this appointment</h3><div class="treatment-price-current"><strong>Sports Massage Full Body</strong><span>Charged: R750.00</span></div><label>Treatment<select><option>Sports Massage Full Body</option></select></label><label>Charged price (R)<input value="750.00"></label><button type="submit">Save treatment &amp; price</button></form><form class="panel-action visible appointment-end-time-manage" data-end-time-form><span class="eyebrow">Appointment timing</span><h3>Adjust end time</h3><div class="end-time-state"><strong>Appointment #667</strong><span>Start: 2026-09-12 08:00</span><span>Current end: 2026-09-12 10:00</span></div><label>Effective end time<input type="datetime-local" value="2026-09-12T10:00"></label><p class="end-time-hint">Extensions are rechecked against appointments and clinic hours.</p><button type="submit">Save end time</button></form><form class="panel-action visible" data-panel-action="appointment:reschedule"><label>Date<input type="date" value="2026-09-12"></label><label>Start time<input type="time" value="08:00"></label><button type="submit">Save new time</button></form><form class="panel-action visible" data-panel-action="appointment:reassign"><label>Practitioner<select><option>Abigail</option></select></label><button type="submit">Reassign</button></form><form class="panel-action visible danger" data-panel-action="appointment:cancel"><label><input type="checkbox"> I confirm this exact appointment should be cancelled.</label><button type="submit">Cancel appointment</button></form></div></section></dialog><script>${calendarAppointmentCompactEditorClientScript()}</script><script>document.querySelector('[data-calendar-management-panel]').dispatchEvent(new CustomEvent('shiloh:appointment-panel-open',{bubbles:true}));</script></body></html>`;
}

function digest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const executable = chromeExecutable();
  if (!executable) throw new Error('Chrome is required for the compact appointment editor proof.');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shiloh-compact-editor-'));
  const app = express();
  app.get('/', (_req, res) => res.type('html').send(fixture()));
  const server = http.createServer(app);
  const manifest = [];
  let chrome;
  let cdp;
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    const debugPort = await reservePort();
    chrome = spawn(executable, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars',
      '--remote-allow-origins=*', `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${path.join(directory, 'profile')}`, 'about:blank',
    ], { stdio: 'ignore' });
    const targets = await poll(async () => (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json(), items => items.some(item => item.type === 'page'));
    cdp = await connectCdp(targets.find(item => item.type === 'page').webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    for (const state of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 1000 }]) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: state.width, height: state.height, deviceScaleFactor: 1, mobile: state.width === 390, screenWidth: state.width, screenHeight: state.height });
      await cdp.send('Page.navigate', { url: `${origin}/?proof=${state.name}` });
      await poll(() => evaluate(cdp, `!!document.querySelector('[data-appointment-editor-accordion]')`), Boolean);
      const closedMetrics = await evaluate(cdp, `(()=>{const visible=node=>!node.hidden&&getComputedStyle(node).display!=='none';return{sections:Array.from(document.querySelectorAll('[data-appointment-editor-section]')).filter(visible).length,bodies:Array.from(document.querySelectorAll('[data-appointment-editor-body]')).filter(visible).length,toggleHeights:Array.from(document.querySelectorAll('[data-appointment-editor-toggle]')).map(node=>node.getBoundingClientRect().height),overflow:document.documentElement.scrollWidth>innerWidth};})()`);
      assert.equal(closedMetrics.sections, 5);
      assert.equal(closedMetrics.bodies, 0);
      assert.ok(closedMetrics.toggleHeights.every(height => height >= 44));
      assert.equal(closedMetrics.overflow, false);
      const closed = path.join(OUT, `${state.name}-compact-closed.png`);
      let png = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      fs.writeFileSync(closed, Buffer.from(png.data, 'base64'));
      manifest.push({ file: path.basename(closed), width: state.width, height: state.height, state: 'closed', sha256: digest(closed) });

      await evaluate(cdp, `document.querySelector('[data-appointment-editor-toggle="timing"]').click();true`);
      let openMetrics = await evaluate(cdp, `({visibleBodies:Array.from(document.querySelectorAll('[data-appointment-editor-body]')).filter(node=>!node.hidden&&getComputedStyle(node).display!=='none').length,timingForms:document.querySelectorAll('[data-appointment-editor-body="timing"] form').length})`);
      assert.equal(openMetrics.visibleBodies, 1);
      assert.equal(openMetrics.timingForms, 2);
      await evaluate(cdp, `document.querySelector('[data-appointment-editor-toggle="treatment"]').click();true`);
      openMetrics = await evaluate(cdp, `({timingHidden:document.querySelector('[data-appointment-editor-body="timing"]').hidden,treatmentHidden:document.querySelector('[data-appointment-editor-body="treatment"]').hidden})`);
      assert.equal(openMetrics.timingHidden, true);
      assert.equal(openMetrics.treatmentHidden, false);
      const open = path.join(OUT, `${state.name}-treatment-open.png`);
      png = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      fs.writeFileSync(open, Buffer.from(png.data, 'base64'));
      manifest.push({ file: path.basename(open), width: state.width, height: state.height, state: 'one-open', sha256: digest(open) });
    }
    fs.writeFileSync(path.join(OUT, 'manifest.json'), `${JSON.stringify({ syntheticDataOnly: true, productionMutations: 0, oneSectionAtATime: true, screenshots: manifest }, null, 2)}\n`);
    console.log(`Compact appointment editor browser proof passed: ${manifest.length} screenshots.`);
  } finally {
    try { cdp?.close(); } catch (_error) {}
    try { chrome?.kill('SIGKILL'); } catch (_error) {}
    await new Promise(resolve => server.close(() => resolve()));
    try { fs.rmSync(directory, { recursive: true, force: true }); } catch (_error) {}
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
