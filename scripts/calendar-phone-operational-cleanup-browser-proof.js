const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const express = require('express');
const { calendarPhoneAllStaffClientScript } = require('../src/presentation/calendarPhoneAllStaffUx');

const OUT_DIR = path.join(process.cwd(), 'artifacts', 'calendar-phone-operational-cleanup-v1');
const VIEWPORTS = [
  { name: 'compact', width: 390, height: 844 },
  { name: 'large-phone', width: 440, height: 956 },
];

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
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Timed out waiting for Phone Calendar adaptive proof');
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
  return `:root{--line:#d8dfda;--line-strong:#a9b5ad;--leaf:#43805f;--leaf-deep:#275b45;--leaf-soft:#eef5ef;--panel:#fffdf9;--ink:#20322b;--muted:#69756f}*{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;overflow-x:hidden;font-family:Arial,sans-serif;color:var(--ink)}.workspace-main>.shell{padding:4px}.phone-calendar-v2-controls,.phone-calendar-v2-actions{display:grid}.phone-week-date-strip{display:grid;grid-template-columns:repeat(6,1fr);gap:2px}.phone-week-date{min-height:44px}.phone-week-staff-strip{display:flex;gap:3px;overflow:auto}.phone-week-staff-toggle{min-height:44px;padding:6px 9px}.phone-plus-menu>summary{display:flex;min-height:44px;padding:8px;border:1px solid var(--leaf-deep);border-radius:9px;background:var(--leaf-deep);color:white}.calendar-view{width:100%;background:white}.week-time-grid{display:grid;grid-template-columns:32px minmax(0,1fr);height:900px;overflow:auto}.time-rail{position:relative}.time-rail span{display:block;height:60px;font-size:10px}.week-grid{min-width:0}.time-column{position:relative;height:900px;background:repeating-linear-gradient(to bottom,transparent 0,transparent 59px,var(--line) 59px,var(--line) 60px)}.positioned-event{position:absolute;height:54px;left:2px;width:calc(100% - 4px)}.event-card{height:100%;border:1px solid var(--line);background:#fff;overflow:hidden}.event-practitioners{display:none}.month-grid{display:grid;grid-template-rows:auto 1fr;height:100%;border:1px solid var(--line)}.month-weekdays,.month-days{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))}.month-weekdays span{padding:6px 1px;text-align:center}.month-day{border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.month-day-link{display:grid;place-items:center;width:100%;height:100%}`;
}

function controls(view) {
  return `<section class="phone-calendar-v2-controls"><a class="phone-view-option" data-phone-calendar-view="week" href="/?view=week&date=2026-09-11">Week</a><a class="phone-view-option" data-phone-calendar-view="month" href="/?view=month&date=2026-09-11">Month</a></section><div class="phone-calendar-v2-actions"><a class="phone-today-action" href="/?view=${view}&date=2026-09-11">Today</a><details class="phone-plus-menu"><summary>Appointment</summary></details></div>`;
}

function weekHtml() {
  const script = calendarPhoneAllStaffClientScript().replace(/<\/script/gi, '<\\/script');
  const people = [['51','Abigail'],['52','Christel'],['53','ILince'],['54','Marietjie'],['55','Naomi'],['56','Pieter'],['57','Savanna']];
  const staffButtons = people.map(([id,name],index)=>`<button class="phone-week-staff-toggle${index===0?' active':''}" data-phone-week-staff-id="${id}" data-phone-week-staff-rendered="true">${name}</button>`).join('');
  const tops = [120,120,120,250,340,420,510];
  const events = people.map(([id,name],index)=>`<div class="positioned-event" style="top:${tops[index]}px;height:54px"><article class="event-card" data-event-staff-ids="${id}"><strong>Client ${index+1}</strong><span class="event-practitioners"><span class="event-practitioner-compact">${name}</span></span></article></div>`).join('');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${baseStyles()}</style></head><body data-phone-calendar-v2="true" data-phone-active-date="2026-09-11"><main class="workspace-main"><div class="shell">${controls('week')}<div class="calendar-view week-view"><section class="phone-week-planner-header"><nav class="phone-week-date-strip"><a class="phone-week-date active" data-phone-week-date="2026-09-11" href="/?view=week&date=2026-09-11">Fri 11</a></nav><div class="phone-week-staff-strip">${staffButtons}</div></section><div class="week-time-grid"><aside class="time-rail"><span>07:00</span><span>08:00</span><span>09:00</span><span>10:00</span><span>11:00</span><span>12:00</span><span>13:00</span><span>14:00</span><span>15:00</span><span>16:00</span><span>17:00</span><span>18:00</span><span>19:00</span><span>20:00</span></aside><div class="week-grid"><section data-week-date-lane data-phone-active-day="true"><div class="time-column">${events}</div></section></div></div></div></div></main><script>${script}</script></body></html>`;
}

function monthHtml() {
  const script = calendarPhoneAllStaffClientScript().replace(/<\/script/gi, '<\\/script');
  const weekdays=['Mon','Tue','Wed','Thu','Fri','Sat'].map(day=>`<span>${day}</span>`).join('');
  const days=Array.from({length:30},(_,i)=>`<section class="month-day"><a class="month-day-link" href="/?view=week&date=2026-09-${String(i+1).padStart(2,'0')}">${i+1}</a></section>`).join('');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${baseStyles()}</style></head><body data-phone-calendar-v2="true" data-phone-active-date="2026-09-11"><main class="workspace-main"><div class="shell">${controls('month')}<main class="calendar-view month-view"><div class="month-grid"><div class="month-weekdays">${weekdays}</div><div class="month-days">${days}</div></div></main></div></main><script>${script}</script></body></html>`;
}

async function screenshot(cdp, filename) {
  const image = await cdp.send('Page.captureScreenshot', { format:'png', captureBeyondViewport:false, fromSurface:true });
  fs.writeFileSync(path.join(OUT_DIR, filename), Buffer.from(image.data, 'base64'));
}

async function proveViewport(cdp, origin, viewport) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width:viewport.width, height:viewport.height, deviceScaleFactor:1, mobile:true, screenWidth:viewport.width, screenHeight:viewport.height });
  await cdp.send('Page.navigate', { url:`${origin}/?view=week&date=2026-09-11` });
  await poll(()=>evaluate(cdp,'document.readyState'),value=>value==='complete');
  await poll(()=>evaluate(cdp,'document.body.dataset.phoneAllStaff'),value=>value==='true');
  await poll(()=>evaluate(cdp,'document.body.dataset.phoneCalendarSurfaceFitted'),value=>value==='true');
  const week = await evaluate(cdp, `(() => {const grid=document.querySelector('.week-time-grid');const view=document.querySelector('.calendar-view');const events=[...document.querySelectorAll('.positioned-event')];const visible=n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return s.display!=='none'&&r.width>0&&r.height>0};return {viewport:[innerWidth,innerHeight],allPressed:document.querySelector('[data-phone-week-staff-all]')?.getAttribute('aria-pressed'),columnHeaders:document.querySelectorAll('[data-phone-all-staff-column-header]').length,dayContext:document.querySelectorAll('[data-phone-calendar-day-context]').length,gridClientWidth:grid.clientWidth,gridScrollWidth:grid.scrollWidth,rootScrollWidth:document.documentElement.scrollWidth,overlapLanes:events.slice(0,3).map(n=>n.dataset.phoneOverlapLanes),practitionerVisible:events.every(n=>visible(n.querySelector('.event-practitioners'))),viewBottomGap:Math.round(innerHeight-view.getBoundingClientRect().bottom),late:Array.from(document.querySelectorAll('.time-rail span')).filter(n=>['19:00','20:00'].includes(n.textContent.trim())&&visible(n)).length};})()`);
  assert.deepEqual(week.viewport,[viewport.width,viewport.height]);
  assert.equal(week.allPressed,'true');
  assert.equal(week.columnHeaders,0);
  assert.equal(week.dayContext,0);
  assert.ok(week.gridScrollWidth<=week.gridClientWidth+1,`horizontal timetable overflow at ${viewport.name}: ${JSON.stringify(week)}`);
  assert.equal(week.rootScrollWidth,viewport.width);
  assert.deepEqual(week.overlapLanes,['3','3','3']);
  assert.equal(week.practitionerVisible,true);
  assert.ok(Math.abs(week.viewBottomGap)<=5,`Week did not fill viewport at ${viewport.name}: ${JSON.stringify(week)}`);
  assert.equal(week.late,0);
  await screenshot(cdp,`phone-calendar-week-${viewport.name}.png`);

  await cdp.send('Page.navigate',{url:`${origin}/?view=month&date=2026-09-11`});
  await poll(()=>evaluate(cdp,'document.body.dataset.phoneCalendarSurfaceFitted'),value=>value==='true');
  const month=await evaluate(cdp,`(()=>{const view=document.querySelector('.calendar-view');const rows=[...document.querySelectorAll('.month-day')];return{rootScrollWidth:document.documentElement.scrollWidth,bottomGap:Math.round(innerHeight-view.getBoundingClientRect().bottom),minCell:Math.min(...rows.map(n=>n.getBoundingClientRect().height)),maxCell:Math.max(...rows.map(n=>n.getBoundingClientRect().height))};})()`);
  assert.equal(month.rootScrollWidth,viewport.width);
  assert.ok(Math.abs(month.bottomGap)<=5,`Month did not fill viewport at ${viewport.name}: ${JSON.stringify(month)}`);
  assert.ok(month.minCell>40,`Month cells too short at ${viewport.name}: ${JSON.stringify(month)}`);
  await screenshot(cdp,`phone-calendar-month-${viewport.name}.png`);
}

async function main() {
  const executable=chromeExecutable();
  if(!executable){if(process.env.CI)throw new Error('CI must provide Chrome');console.log('Chrome not installed; proof is CI-only.');return;}
  fs.rmSync(OUT_DIR,{recursive:true,force:true});fs.mkdirSync(OUT_DIR,{recursive:true});
  const app=express();app.get('/',(req,res)=>res.type('html').send(req.query.view==='month'?monthHtml():weekHtml()));
  const server=http.createServer(app);const directory=fs.mkdtempSync(path.join(os.tmpdir(),'shiloh-phone-adaptive-'));let chrome,cdp;
  try{server.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${server.address().port}`;const debugPort=await reservePort();chrome=spawn(executable,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(directory,'profile')}`,'about:blank'],{stdio:['ignore','ignore','pipe']});const targets=await poll(async()=>(await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json(),items=>Array.isArray(items)&&items.some(item=>item.type==='page'&&item.webSocketDebuggerUrl));cdp=await connectCdp(targets.find(item=>item.type==='page').webSocketDebuggerUrl);await cdp.send('Page.enable');await cdp.send('Runtime.enable');for(const viewport of VIEWPORTS)await proveViewport(cdp,origin,viewport);console.log('Phone Calendar adaptive schedule proof passed for compact and large-phone viewports.');}finally{try{cdp?.close();}catch(_error){}try{chrome?.kill('SIGKILL');}catch(_error){}await new Promise(resolve=>server.close(()=>resolve()));fs.rmSync(directory,{recursive:true,force:true});}
}

main().catch(error=>{console.error(error);process.exitCode=1;});
