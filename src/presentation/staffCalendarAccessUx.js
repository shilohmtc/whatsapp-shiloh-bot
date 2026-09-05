function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function messageForReason(reason) {
  if (reason === 'logout') return { state: 'signed-out', message: 'You are signed out of Shiloh Workspace.' };
  if (reason === 'session') return { state: 'session-ended', message: 'Your staff session is missing, expired, or revoked. Sign in again to continue.' };
  return { state: 'ready', message: 'Use your authenticator here, or open Workspace from your existing Shiloh WhatsApp conversation.' };
}

function styles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#6c7d75;--paper:#f7f5ef;--panel:#fffdf9;--line:#dfe5df;--leaf:#496b5a;--leaf-soft:#e7eee9;--warning:#8a5b2c;--warning-soft:#f8efe4;--error:#8a3f3f;--error-soft:#f8eaea}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:760px;margin:0 auto;padding:28px 18px 40px}.brand{margin-bottom:18px}.brand h1{margin:0;font-size:1.55rem}.brand p{margin:5px 0 0;color:var(--muted)}.card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 5px 22px rgba(32,50,43,.05)}.eyebrow{font-size:.75rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}h2{margin:5px 0 8px;font-size:1.2rem}.lead{margin:0 0 18px;color:var(--muted);line-height:1.5}.field{display:grid;gap:7px;margin-top:14px}.field label{font-size:.83rem;font-weight:700}.field input{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 12px;background:#fff;color:var(--ink);font:inherit}.field input:focus{outline:2px solid var(--leaf-soft);border-color:var(--leaf)}.actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:14px}.actions[hidden]{display:none}.button{border:1px solid var(--leaf);border-radius:999px;padding:9px 14px;background:var(--leaf);color:#fff;font:inherit;font-weight:700;cursor:pointer}.button.secondary{background:#fff;color:var(--leaf)}.button:disabled{opacity:.55;cursor:not-allowed}.status{margin:16px 0 0;border:1px solid var(--line);border-radius:12px;padding:11px 12px;background:#fff;line-height:1.45;font-size:.9rem}.status[data-state="accepted"],.status[data-state="authenticated"],.status[data-state="signed-out"]{background:var(--leaf-soft);border-color:#cbd9cf}.status[data-state="expired"],.status[data-state="rate-limited"],.status[data-state="provider-unavailable"]{background:var(--warning-soft);border-color:#ead5bd;color:#68451f}.status[data-state="invalid"],.status[data-state="error"],.status[data-state="session-ended"]{background:var(--error-soft);border-color:#eccccc;color:#6d3434}.section{margin-top:18px;border-top:1px solid var(--line);padding-top:17px}.privacy-note,.footer-note{color:var(--muted);font-size:.8rem;line-height:1.5}.privacy-note{margin:16px 0 0}.footer-note{margin:18px 0 0;text-align:center}details{margin-top:14px}summary{cursor:pointer;color:var(--ink)}code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--leaf-soft);border-radius:6px;padding:1px 5px}@media(max-width:560px){.shell{padding:18px 12px}.card{padding:16px}.actions{align-items:stretch}.button{width:100%}}`;
}

function renderStaffCalendarAccessPage({ reason = null, clientScriptPath = '/calendar/staff/client.js', providerIndependentAuthEnabled = false } = {}) {
  const initial = messageForReason(reason);
  const providerIndependentPanel = providerIndependentAuthEnabled ? `
      <section data-shiloh-provider-independent-auth>
        <span class="eyebrow">Direct browser sign-in</span><h2>Use your authenticator</h2>
        <p class="lead">Enter the six-digit code from your enrolled authenticator app. This path does not contact WhatsApp or Meta.</p>
        <form method="post" data-shiloh-totp-form novalidate>
          <div class="field"><label for="staff-totp-whatsapp">Staff account number</label><input id="staff-totp-whatsapp" type="tel" inputmode="tel" autocomplete="username" placeholder="e.g. 082 123 4567"></div>
          <div class="field"><label for="staff-totp-code">Authenticator code</label><input id="staff-totp-code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="6 digits"></div>
          <div class="actions"><button class="button" type="submit" data-shiloh-totp-button>Sign in with authenticator</button></div>
        </form>
        <details><summary>Use a recovery code</summary>
          <p class="lead">A recovery code works once. After sign-in, Shiloh requires authenticator replacement before Workspace access.</p>
          <form method="post" data-shiloh-recovery-form novalidate>
            <div class="field"><label for="staff-recovery-whatsapp">Staff account number</label><input id="staff-recovery-whatsapp" type="tel" inputmode="tel" autocomplete="username" placeholder="e.g. 082 123 4567"></div>
            <div class="field"><label for="staff-recovery-code">Recovery code</label><input id="staff-recovery-code" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="39" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"></div>
            <div class="actions"><button class="button secondary" type="submit" data-shiloh-recovery-button>Use recovery code</button></div>
          </form>
        </details>
      </section>` : '';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shiloh Workspace sign-in</title><style>${styles()}</style><script src="${escapeHtml(clientScriptPath)}" defer></script></head><body data-shiloh-staff-calendar-access="true" data-shiloh-totp-enabled="${providerIndependentAuthEnabled ? 'true' : 'false'}"><div class="shell">
    <header class="brand"><h1>Shiloh Workspace</h1><p>Secure staff access to Shiloh's operating workspace.</p></header>
    <main class="card">
      ${providerIndependentPanel}
      <section class="section" data-shiloh-whatsapp-handoff-guidance>
        <span class="eyebrow">Easiest access</span><h2>Open from Shiloh WhatsApp</h2>
        <p class="lead">In your existing Shiloh WhatsApp conversation, send <code>calendar</code> and tap the secure Workspace link. That one-tap handoff uses the authenticated conversation; Shiloh no longer sends a separate browser sign-in code through WhatsApp.</p>
      </section>
      <div class="status" role="status" aria-live="polite" data-shiloh-status data-state="${escapeHtml(initial.state)}">${escapeHtml(initial.message)}</div>
      <div class="actions" data-shiloh-session-tools hidden><button class="button secondary" type="button" data-shiloh-logout>Sign out current session</button></div>
      <p class="privacy-note">Authenticator and recovery credentials stay outside WhatsApp. Shiloh does not put the browser session token or CSRF token in a URL or persistent browser storage.</p>
    </main>
    <p class="footer-note">Workspace access and actions remain governed by canonical server-derived staff/Admin permissions and scope.</p>
  </div></body></html>`;
}

function allocateWeekOverlapLanes(rectangles = []) {
  const ordered = rectangles
    .map((entry, order) => ({
      ...entry,
      order,
      top: Number(entry?.top),
      height: Number(entry?.height),
    }))
    .filter(entry => Number.isFinite(entry.top) && Number.isFinite(entry.height) && entry.height > 0)
    .map(entry => ({ ...entry, bottom: entry.top + entry.height }))
    .sort((a, b) => a.top - b.top || a.bottom - b.bottom || a.order - b.order);

  const laneEnds = [];
  for (const entry of ordered) {
    let laneIndex = laneEnds.findIndex(end => end <= entry.top + 0.5);
    if (laneIndex === -1) laneIndex = laneEnds.length;
    laneEnds[laneIndex] = entry.bottom;
    entry.laneIndex = laneIndex;
  }

  return {
    laneCount: Math.max(1, laneEnds.length),
    entries: ordered,
  };
}

function staffCalendarAccessClientScript() {
  return `(function(){
'use strict';
var AUTH_BASE='/calendar/staff-auth';
var ACCESS_PATH='/calendar/staff';
var WORKSPACE_PATH='/calendar/workspace';
var TOTP_ENABLED=document.body&&document.body.getAttribute('data-shiloh-totp-enabled')==='true';
var allocateWeekOverlapLanes=${allocateWeekOverlapLanes.toString()};

function select(selector){return document.querySelector(selector);}
function setStatus(state,message){var node=select('[data-shiloh-status]');if(!node)return;node.dataset.state=state;node.textContent=message;}
function setBusy(button,busy){if(button)button.disabled=!!busy;}
function revealSessionTools(){var tools=select('[data-shiloh-session-tools]');if(tools)tools.hidden=false;}
function jsonHeaders(extra){var headers={'Content-Type':'application/json','Accept':'application/json'};if(extra){Object.keys(extra).forEach(function(key){headers[key]=extra[key];});}return headers;}
function postJson(url,payload,extraHeaders){return fetch(url,{method:'POST',credentials:'same-origin',cache:'no-store',headers:jsonHeaders(extraHeaders),body:JSON.stringify(payload||{})});}
function safeJson(response){return response.json().catch(function(){return {};});}
function viewerPermitsWorkspace(viewer){return !!(viewer&&typeof viewer==='object'&&(viewer.calendarScope==='own_staff'||viewer.calendarScope==='business_all_staff'));}
function normalizeStaffAccountNumber(value){var raw=String(value||'').trim();var digits=raw.replace(/\\D/g,'');if(/^0\\d{9}$/.test(digits))return '27'+digits.slice(1);return raw;}

function installPractitionerVisibility(){
  var form=select('[data-practitioner-visibility-form]');if(!form)return;
  var checkboxes=Array.prototype.slice.call(form.querySelectorAll('input[name="staff"]'));
  var status=select('[data-people-selection-status]');
  function checked(){return checkboxes.filter(function(input){return input.checked;});}
  function update(){var count=checked().length;if(status)status.textContent=count+' of '+checkboxes.length+' visible';}
  form.addEventListener('change',update);
  form.addEventListener('submit',function(event){if(checked().length)return;event.preventDefault();if(status)status.textContent='Keep at least one practitioner visible.';var first=checkboxes[0];if(first){first.checked=true;first.focus();}});
  document.addEventListener('click',function(event){var picker=select('[data-people-picker]');if(picker&&picker.open&&!picker.contains(event.target))picker.open=false;});
  update();
}

function resetWeekOverlapLayout(){
  var grid=select('.week-view .week-grid');
  if(!grid)return;
  grid.style.removeProperty('grid-template-columns');
  grid.style.removeProperty('min-width');
  grid.removeAttribute('data-week-overlap-layout');
  Array.prototype.forEach.call(grid.querySelectorAll('.week-day'),function(day){
    day.removeAttribute('data-week-lane-count');
    Array.prototype.forEach.call(day.querySelectorAll('.time-column > .positioned-event'),function(node){
      node.style.removeProperty('left');
      node.style.removeProperty('right');
      node.style.removeProperty('width');
      node.style.removeProperty('--week-event-left');
      node.style.removeProperty('--week-event-width');
      node.removeAttribute('data-week-lane-index');
      node.removeAttribute('data-week-lane-count');
    });
  });
}

function applyWeekOverlapLayout(){
  var grid=select('.week-view .week-grid');
  if(!grid)return;
  resetWeekOverlapLayout();
  var desktop=!window.matchMedia||window.matchMedia('(min-width: 701px)').matches;

  var days=Array.prototype.slice.call(grid.querySelectorAll('.week-day'));
  if(!days.length)return;
  var laneCounts=days.map(function(day){
    var nodes=Array.prototype.slice.call(day.querySelectorAll('.time-column > .positioned-event'));
    var rectangles=nodes.map(function(node){
      return {
        node:node,
        top:parseFloat(node.style.getPropertyValue('--event-top')),
        height:parseFloat(node.style.getPropertyValue('--event-height'))
      };
    });
    var layout=allocateWeekOverlapLanes(rectangles);
    layout.entries.forEach(function(entry){
      var laneCount=layout.laneCount;
      var laneWidth=100/laneCount;
      if(desktop){
        entry.node.style.left='calc('+(entry.laneIndex*laneWidth)+'% + 4px)';
        entry.node.style.right='auto';
        entry.node.style.width='calc('+laneWidth+'% - 8px)';
      }else{
        entry.node.style.setProperty('--week-event-left','calc('+(entry.laneIndex*laneWidth)+'% + 1px)');
        entry.node.style.setProperty('--week-event-width','calc('+laneWidth+'% - 2px)');
      }
      entry.node.setAttribute('data-week-lane-index',String(entry.laneIndex));
      entry.node.setAttribute('data-week-lane-count',String(laneCount));
    });
    day.setAttribute('data-week-lane-count',String(layout.laneCount));
    return layout.laneCount;
  });

  if(!desktop){
    grid.setAttribute('data-week-overlap-layout','phone');
    return;
  }

  var baseLaneWidth=154;
  grid.style.gridTemplateColumns=laneCounts.map(function(count){
    return 'minmax('+(baseLaneWidth*count)+'px,'+count+'fr)';
  }).join(' ');
  grid.style.minWidth=(laneCounts.reduce(function(total,count){return total+count;},0)*baseLaneWidth)+'px';
  grid.setAttribute('data-week-overlap-layout','desktop');
}

async function probeSession(){
  try{
    var response=await fetch(AUTH_BASE+'/session',{method:'GET',credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}});
    if(response.ok){
      var body=await safeJson(response);
      if(body.providerIndependentAuth&&body.providerIndependentAuth.available&&(body.recoveryRequired||!body.providerIndependentAuth.enrolled)){
        window.location.replace(AUTH_BASE+'/totp/manage');return;
      }
      if(viewerPermitsWorkspace(body.viewer)){window.location.replace(WORKSPACE_PATH);return;}
      revealSessionTools();
      setStatus('error','Your current staff session is valid, but its canonical authority does not permit Workspace access. Sign out to use another authorized account.');
    }
  }catch(_error){}
}

async function verifyTotp(event){
  event.preventDefault();
  var identifier=normalizeStaffAccountNumber((select('#staff-totp-whatsapp')||{}).value||'');
  var code=String((select('#staff-totp-code')||{}).value||'').trim();
  var button=select('[data-shiloh-totp-button]');
  if(!identifier||!/^[0-9]{6}$/.test(code)){setStatus('invalid','Enter your staff account number and six-digit authenticator code.');return;}
  setBusy(button,true);setStatus('pending','Checking the authenticator code…');
  try{
    var response=await postJson(AUTH_BASE+'/totp/verify',{identifier:identifier,code:code});
    if(response.status===200){
      var body=await safeJson(response);
      if(viewerPermitsWorkspace(body.viewer)){setStatus('authenticated','Sign-in successful. Opening Shiloh Workspace…');window.setTimeout(function(){window.location.assign(WORKSPACE_PATH);},350);return;}
      revealSessionTools();
      setStatus('error','Sign-in succeeded, but your current Shiloh authority does not permit Workspace access.');
      return;
    }
    if(response.status===429){setStatus('rate-limited','Too many attempts. Wait before trying again.');return;}
    if(response.status===404){setStatus('error','Authenticator sign-in is not enabled for this account.');return;}
    if(response.status>=500){setStatus('provider-unavailable','Authenticator sign-in is temporarily unavailable.');return;}
    setStatus('invalid','The sign-in details are invalid or no longer active.');
  }catch(_error){setStatus('provider-unavailable','Authenticator sign-in is temporarily unavailable. Check your connection and try again.');}
  finally{setBusy(button,false);}
}

async function verifyRecovery(event){
  event.preventDefault();
  var identifier=normalizeStaffAccountNumber((select('#staff-recovery-whatsapp')||{}).value||'');
  var recoveryCode=String((select('#staff-recovery-code')||{}).value||'').trim();
  var button=select('[data-shiloh-recovery-button]');
  if(!identifier||!recoveryCode){setStatus('invalid','Enter your staff account number and recovery code.');return;}
  setBusy(button,true);setStatus('pending','Checking the one-time recovery code…');
  try{
    var response=await postJson(AUTH_BASE+'/totp/recovery/verify',{identifier:identifier,recoveryCode:recoveryCode});
    if(response.status===200){var input=select('#staff-recovery-code');if(input)input.value='';setStatus('authenticated','Recovery code accepted. Replace your authenticator to continue.');window.setTimeout(function(){window.location.assign(AUTH_BASE+'/totp/manage');},350);return;}
    if(response.status===429){setStatus('rate-limited','Too many attempts. Wait before trying again.');return;}
    if(response.status>=500){setStatus('provider-unavailable','Recovery sign-in is temporarily unavailable.');return;}
    setStatus('invalid','The sign-in details are invalid or no longer active.');
  }catch(_error){setStatus('provider-unavailable','Recovery sign-in is temporarily unavailable. Check your connection and try again.');}
  finally{setBusy(button,false);}
}

async function exchangeStaffRecoveryFragment(){
  if(!TOTP_ENABLED||!/^#staff-recovery=/.test(window.location.hash))return;
  var token='';try{token=decodeURIComponent(window.location.hash.slice('#staff-recovery='.length));}catch(_error){}
  history.replaceState(null,'',window.location.pathname+window.location.search);
  if(!/^[A-Za-z0-9_-]{43}$/.test(token)){setStatus('invalid','The controlled recovery handoff is invalid or expired.');return;}
  setStatus('pending','Exchanging the controlled recovery handoff…');
  try{
    var response=await postJson(AUTH_BASE+'/totp/break-glass/exchange',{token:token});token='';
    if(response.status===200){window.location.replace(AUTH_BASE+'/totp/manage');return;}
    setStatus('invalid','The controlled recovery handoff is invalid or expired.');
  }catch(_error){token='';setStatus('provider-unavailable','Controlled recovery is temporarily unavailable.');}
}

async function logout(){
  var button=select('[data-shiloh-logout]');
  var status=select('[data-shiloh-calendar-access-status]');
  function workspaceStatus(message){if(status)status.textContent=message;else setStatus('pending',message);}
  setBusy(button,true);
  workspaceStatus('Signing out…');
  var csrfToken=null;
  try{
    var csrfResponse=await postJson(AUTH_BASE+'/csrf',{});
    if(csrfResponse.status===401){window.location.assign(ACCESS_PATH+'?reason=session');return;}
    if(!csrfResponse.ok){workspaceStatus('Could not start secure sign-out. Refresh and try again.');return;}
    var csrfBody=await safeJson(csrfResponse);
    csrfToken=String(csrfBody.csrfToken||'');
    if(!csrfToken){workspaceStatus('Could not start secure sign-out. Refresh and try again.');return;}
    var logoutResponse=await postJson(AUTH_BASE+'/logout',{}, {'x-shiloh-csrf-token':csrfToken});
    csrfToken=null;
    if(logoutResponse.status===204){window.location.assign(ACCESS_PATH+'?reason=logout');return;}
    if(logoutResponse.status===401){window.location.assign(ACCESS_PATH+'?reason=session');return;}
    workspaceStatus('Could not complete secure sign-out. Refresh and try again.');
  }catch(_error){
    csrfToken=null;
    workspaceStatus('Could not complete secure sign-out. Check your connection and try again.');
  }finally{setBusy(button,false);}
}

var totpForm=select('[data-shiloh-totp-form]');if(totpForm)totpForm.addEventListener('submit',verifyTotp);
var recoveryForm=select('[data-shiloh-recovery-form]');if(recoveryForm)recoveryForm.addEventListener('submit',verifyRecovery);
var logoutButton=select('[data-shiloh-logout]');if(logoutButton)logoutButton.addEventListener('click',logout);
if(select('[data-shiloh-staff-calendar-access]'))exchangeStaffRecoveryFragment();
if(select('[data-shiloh-staff-calendar-access]'))probeSession();
applyWeekOverlapLayout();
installPractitionerVisibility();
if(window.matchMedia){var weekDesktopMedia=window.matchMedia('(min-width: 701px)');if(weekDesktopMedia.addEventListener)weekDesktopMedia.addEventListener('change',applyWeekOverlapLayout);else if(weekDesktopMedia.addListener)weekDesktopMedia.addListener(applyWeekOverlapLayout);}
})();`;
}

module.exports = {
  escapeHtml,
  messageForReason,
  renderStaffCalendarAccessPage,
  allocateWeekOverlapLanes,
  staffCalendarAccessClientScript,
};
