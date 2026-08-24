function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function messageForReason(reason) {
  if (reason === 'logout') return { state: 'signed-out', message: 'You are signed out of Shiloh Calendar.' };
  if (reason === 'session') return { state: 'session-ended', message: 'Your staff session is missing, expired, or revoked. Sign in again to continue.' };
  return { state: 'ready', message: 'Request a one-time sign-in code to continue to the read-only Shiloh Calendar.' };
}

function styles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#6c7d75;--paper:#f7f5ef;--panel:#fffdf9;--line:#dfe5df;--leaf:#496b5a;--leaf-soft:#e7eee9;--warning:#8a5b2c;--warning-soft:#f8efe4;--error:#8a3f3f;--error-soft:#f8eaea}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:760px;margin:0 auto;padding:28px 18px 40px}.brand{margin-bottom:18px}.brand h1{margin:0;font-size:1.5rem}.brand p{margin:5px 0 0;color:var(--muted)}.card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 5px 22px rgba(32,50,43,.05)}.eyebrow{font-size:.75rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}h2{margin:5px 0 8px;font-size:1.2rem}.lead{margin:0 0 18px;color:var(--muted);line-height:1.5}.field{display:grid;gap:7px;margin-top:14px}.field label{font-size:.83rem;font-weight:700}.field input{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 12px;background:#fff;color:var(--ink);font:inherit}.field input:focus{outline:2px solid var(--leaf-soft);border-color:var(--leaf)}.actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:14px}.actions[hidden]{display:none}.button{border:1px solid var(--leaf);border-radius:999px;padding:9px 14px;background:var(--leaf);color:#fff;font:inherit;font-weight:700;cursor:pointer}.button.secondary{background:#fff;color:var(--leaf)}.button:disabled{opacity:.55;cursor:not-allowed}.status{margin:16px 0 0;border:1px solid var(--line);border-radius:12px;padding:11px 12px;background:#fff;line-height:1.45;font-size:.9rem}.status[data-state="accepted"],.status[data-state="authenticated"],.status[data-state="signed-out"]{background:var(--leaf-soft);border-color:#cbd9cf}.status[data-state="expired"],.status[data-state="rate-limited"],.status[data-state="provider-unavailable"]{background:var(--warning-soft);border-color:#ead5bd;color:#68451f}.status[data-state="invalid"],.status[data-state="error"],.status[data-state="session-ended"]{background:var(--error-soft);border-color:#eccccc;color:#6d3434}.code-panel{margin-top:18px;border-top:1px solid var(--line);padding-top:17px}.code-panel[hidden]{display:none}.privacy-note,.footer-note{color:var(--muted);font-size:.8rem;line-height:1.5}.privacy-note{margin:16px 0 0}.footer-note{margin:18px 0 0;text-align:center}.read-only{display:inline-block;margin-left:6px;border-radius:999px;padding:4px 8px;background:var(--leaf-soft);color:var(--leaf);font-size:.72rem;font-weight:700}@media(max-width:560px){.shell{padding:18px 12px}.card{padding:16px}.actions{align-items:stretch}.button{width:100%}}`;
}

function renderStaffCalendarAccessPage({ reason = null, clientScriptPath = '/calendar/staff/client.js' } = {}) {
  const initial = messageForReason(reason);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shiloh staff sign-in</title><style>${styles()}</style><script src="${escapeHtml(clientScriptPath)}" defer></script></head><body data-shiloh-staff-calendar-access="true"><div class="shell">
    <header class="brand"><h1>Shiloh Calendar <span class="read-only">Read-only</span></h1><p>Secure staff access to canonical scheduling truth.</p></header>
    <main class="card">
      <span class="eyebrow">Staff sign-in</span><h2>Continue with your Shiloh WhatsApp number</h2>
      <p class="lead">Shiloh will send a short-lived one-time code only after you request it here. There is no password and no browser-held staff authority.</p>
      <form method="post" data-shiloh-challenge-form novalidate>
        <div class="field"><label for="staff-whatsapp">WhatsApp number</label><input id="staff-whatsapp" type="tel" inputmode="tel" autocomplete="tel" placeholder="e.g. +27 82 123 4567" aria-describedby="privacy-note"></div>
        <div class="actions"><button class="button" type="submit" data-shiloh-challenge-button>Send sign-in code</button></div>
      </form>
      <div class="status" role="status" aria-live="polite" data-shiloh-status data-state="${escapeHtml(initial.state)}">${escapeHtml(initial.message)}</div>
      <div class="actions" data-shiloh-session-tools hidden><button class="button secondary" type="button" data-shiloh-logout>Sign out current session</button></div>
      <section class="code-panel" data-shiloh-code-panel hidden>
        <span class="eyebrow">One-time code</span><h2>Enter the code from WhatsApp</h2>
        <p class="lead">Codes expire after about five minutes. Request a new code if this one expires.</p>
        <form method="post" data-shiloh-verify-form novalidate>
          <div class="field"><label for="staff-code">Sign-in code</label><input id="staff-code" type="text" inputmode="text" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" maxlength="10" placeholder="10-character code"></div>
          <div class="actions"><button class="button" type="submit" data-shiloh-verify-button>Sign in to Calendar</button><button class="button secondary" type="button" data-shiloh-request-another>Request another code</button></div>
        </form>
      </section>
      <p class="privacy-note" id="privacy-note">For privacy, the request confirmation is the same whether or not the number is eligible for staff access. Shiloh never puts the sign-in code, session token, or CSRF token in a URL or persistent browser storage.</p>
    </main>
    <p class="footer-note">This access journey can open only the existing read-only Calendar under server-derived staff/Admin scope. It cannot create, move, cancel, reassign, block, or otherwise mutate scheduling.</p>
  </div></body></html>`;
}

function staffCalendarAccessClientScript() {
  return `(function(){
'use strict';
var AUTH_BASE='/calendar/staff-auth';
var ACCESS_PATH='/calendar/staff';
var CALENDAR_PATH='/calendar/read-only';
var CHALLENGE_TTL_MS=5*60*1000;
var REQUEST_WINDOW_MS=10*60*1000;
var REQUEST_LIMIT=3;
var challengeRequestedAt=0;
var requestTimes=[];
var currentWhatsapp='';

function select(selector){return document.querySelector(selector);}
function setStatus(state,message){var node=select('[data-shiloh-status]');if(!node)return;node.dataset.state=state;node.textContent=message;}
function setBusy(button,busy){if(button)button.disabled=!!busy;}
function revealCode(){var panel=select('[data-shiloh-code-panel]');if(panel)panel.hidden=false;var code=select('#staff-code');if(code)code.focus();}
function revealSessionTools(){var tools=select('[data-shiloh-session-tools]');if(tools)tools.hidden=false;}
function currentPhone(){var phone=select('#staff-whatsapp');return String(currentWhatsapp||(phone&&phone.value)||'').trim();}
function pruneRequests(now){requestTimes=requestTimes.filter(function(value){return now-value<REQUEST_WINDOW_MS;});}
function requestRateLimited(now){pruneRequests(now);return requestTimes.length>=REQUEST_LIMIT;}
function recordRequest(now){pruneRequests(now);requestTimes.push(now);}
function jsonHeaders(extra){var headers={'Content-Type':'application/json','Accept':'application/json'};if(extra){Object.keys(extra).forEach(function(key){headers[key]=extra[key];});}return headers;}
function postJson(url,payload,extraHeaders){return fetch(url,{method:'POST',credentials:'same-origin',cache:'no-store',headers:jsonHeaders(extraHeaders),body:JSON.stringify(payload||{})});}
function safeJson(response){return response.json().catch(function(){return {};});}
function viewerPermitsCalendar(viewer){return !!(viewer&&typeof viewer==='object'&&(viewer.calendarScope==='own_staff'||viewer.calendarScope==='business_all_staff'));}

async function probeSession(){
  try{
    var response=await fetch(AUTH_BASE+'/session',{method:'GET',credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}});
    if(response.ok){
      var body=await safeJson(response);
      if(viewerPermitsCalendar(body.viewer)){window.location.replace(CALENDAR_PATH);return;}
      revealSessionTools();
      setStatus('error','Your current staff session is valid, but its canonical authority does not permit Calendar access. Sign out to use another authorized account.');
    }
  }catch(_error){}
}

async function requestChallenge(event){
  event.preventDefault();
  var phone=select('#staff-whatsapp');
  var button=select('[data-shiloh-challenge-button]');
  currentWhatsapp=String((phone&&phone.value)||'').trim();
  if(!currentWhatsapp){setStatus('error','Enter the WhatsApp number linked to your Shiloh staff/Admin access.');return;}
  var now=Date.now();
  if(requestRateLimited(now)){
    setStatus('rate-limited','Too many sign-in requests from this page. Wait before requesting another code.');
    return;
  }
  recordRequest(now);
  setBusy(button,true);
  setStatus('pending','Requesting a one-time sign-in code…');
  try{
    var response=await postJson(AUTH_BASE+'/challenge',{whatsapp:currentWhatsapp});
    if(response.status===202){
      challengeRequestedAt=Date.now();
      revealCode();
      setStatus('accepted','Request accepted. If this number is eligible, Shiloh will deliver a one-time code. Enter it below.');
      window.setTimeout(function(){
        if(challengeRequestedAt&&Date.now()-challengeRequestedAt>=CHALLENGE_TTL_MS){
          setStatus('expired','That sign-in code has expired. Request a new code to continue.');
        }
      },CHALLENGE_TTL_MS+250);
      return;
    }
    if(response.status===429){setStatus('rate-limited','Too many sign-in requests. Wait and try again.');return;}
    if(response.status===503){setStatus('provider-unavailable','Staff sign-in delivery is temporarily unavailable. Try again later.');return;}
    setStatus('error','The sign-in request could not be accepted. Refresh the page and try again.');
  }catch(_error){
    setStatus('provider-unavailable','Staff sign-in is temporarily unavailable. Check your connection and try again.');
  }finally{setBusy(button,false);}
}

async function verifyChallenge(event){
  event.preventDefault();
  var codeInput=select('#staff-code');
  var button=select('[data-shiloh-verify-button]');
  var phone=currentPhone();
  var code=String((codeInput&&codeInput.value)||'').trim().toUpperCase();
  if(!phone||!code){setStatus('invalid','Enter the WhatsApp number and the one-time code.');return;}
  if(challengeRequestedAt&&Date.now()-challengeRequestedAt>=CHALLENGE_TTL_MS){
    setStatus('expired','That sign-in code has expired. Request a new code to continue.');
    return;
  }
  setBusy(button,true);
  setStatus('pending','Checking the one-time code…');
  try{
    var response=await postJson(AUTH_BASE+'/verify',{whatsapp:phone,code:code});
    if(response.status===200){
      var body=await safeJson(response);
      if(codeInput)codeInput.value='';
      if(!viewerPermitsCalendar(body.viewer)){
        revealSessionTools();
        setStatus('error','Sign-in succeeded, but your current Shiloh authority does not permit Calendar access. No scheduling data was exposed.');
        return;
      }
      setStatus('authenticated','Sign-in successful. Opening your read-only Shiloh Calendar…');
      window.setTimeout(function(){window.location.assign(CALENDAR_PATH);},350);
      return;
    }
    if(response.status===401){
      if(challengeRequestedAt&&Date.now()-challengeRequestedAt>=CHALLENGE_TTL_MS){setStatus('expired','That sign-in code has expired. Request a new code to continue.');}
      else{setStatus('invalid','That code is invalid or no longer active. Check it carefully, or request a new code if it has expired.');}
      return;
    }
    if(response.status===429){setStatus('rate-limited','Too many verification attempts. Wait before trying again or request a new code later.');return;}
    if(response.status>=500){setStatus('provider-unavailable','Staff sign-in is temporarily unavailable. Try again later.');return;}
    setStatus('error','Shiloh could not complete sign-in. Refresh the page and try again.');
  }catch(_error){
    setStatus('provider-unavailable','Staff sign-in is temporarily unavailable. Check your connection and try again.');
  }finally{setBusy(button,false);}
}

function requestAnother(){
  challengeRequestedAt=0;
  var code=select('#staff-code');if(code)code.value='';
  var phone=select('#staff-whatsapp');if(phone)phone.focus();
  setStatus('ready','Request a new one-time code when you are ready.');
}

async function logout(){
  var button=select('[data-shiloh-logout]');
  var status=select('[data-shiloh-calendar-access-status]');
  function calendarStatus(message){if(status)status.textContent=message;else setStatus('pending',message);}
  setBusy(button,true);
  calendarStatus('Signing out…');
  var csrfToken=null;
  try{
    var csrfResponse=await postJson(AUTH_BASE+'/csrf',{});
    if(csrfResponse.status===401){window.location.assign(ACCESS_PATH+'?reason=session');return;}
    if(!csrfResponse.ok){calendarStatus('Could not start secure sign-out. Refresh and try again.');return;}
    var csrfBody=await safeJson(csrfResponse);
    csrfToken=String(csrfBody.csrfToken||'');
    if(!csrfToken){calendarStatus('Could not start secure sign-out. Refresh and try again.');return;}
    var logoutResponse=await postJson(AUTH_BASE+'/logout',{}, {'x-shiloh-csrf-token':csrfToken});
    csrfToken=null;
    if(logoutResponse.status===204){window.location.assign(ACCESS_PATH+'?reason=logout');return;}
    if(logoutResponse.status===401){window.location.assign(ACCESS_PATH+'?reason=session');return;}
    calendarStatus('Could not complete secure sign-out. Refresh and try again.');
  }catch(_error){
    csrfToken=null;
    calendarStatus('Could not complete secure sign-out. Check your connection and try again.');
  }finally{setBusy(button,false);}
}

var challengeForm=select('[data-shiloh-challenge-form]');if(challengeForm)challengeForm.addEventListener('submit',requestChallenge);
var verifyForm=select('[data-shiloh-verify-form]');if(verifyForm)verifyForm.addEventListener('submit',verifyChallenge);
var another=select('[data-shiloh-request-another]');if(another)another.addEventListener('click',requestAnother);
var logoutButton=select('[data-shiloh-logout]');if(logoutButton)logoutButton.addEventListener('click',logout);
if(select('[data-shiloh-staff-calendar-access]'))probeSession();
})();`;
}

module.exports = {
  escapeHtml,
  messageForReason,
  renderStaffCalendarAccessPage,
  staffCalendarAccessClientScript,
};
