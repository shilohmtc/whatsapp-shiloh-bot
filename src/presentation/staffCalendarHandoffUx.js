function renderStaffCalendarHandoffPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening Shiloh Calendar</title><style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f7f5ef;color:#20322b;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{min-height:100vh;display:grid;place-items:center;padding:24px}.card{width:min(560px,100%);background:#fffdf9;border:1px solid #dfe5df;border-radius:18px;padding:24px;box-shadow:0 5px 22px rgba(32,50,43,.05)}h1{margin:0 0 8px;font-size:1.35rem}.status{margin:0;color:#496b5a;line-height:1.5}.status[data-state="invalid"]{color:#8a3f3f}.status[data-state="provider-unavailable"]{color:#8a5b2c}</style><script src="/calendar/staff/handoff.js" defer></script></head><body><main class="shell"><section class="card"><h1>Shiloh Calendar</h1><p class="status" role="status" aria-live="polite" data-shiloh-status data-state="pending">Opening your secure Shiloh Calendar…</p></section></main></body></html>`;
}

function staffCalendarHandoffClientScript() {
  return `(function(){
'use strict';
var AUTH_BASE='/calendar/staff-auth';
var CALENDAR_PATH='/calendar/read-only';
var fragment=String(window.location.hash||'');
var match=fragment.match(/^#handoff=([A-Za-z0-9_-]{43})$/);
function select(selector){return document.querySelector(selector);}
function setStatus(state,message){var node=select('[data-shiloh-status]');if(!node)return;node.dataset.state=state;node.textContent=message;}
if(fragment){window.history.replaceState(null,'',window.location.pathname+window.location.search);}
if(!match){setStatus('invalid','That Calendar link is missing or invalid. Send Open Calendar in Shiloh to get a new link.');return;}
var token=match[1];
function postJson(url,payload){return fetch(url,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload||{})});}
setStatus('pending','Opening your secure Shiloh Calendar…');
postJson(AUTH_BASE+'/calendar-handoff/exchange',{token:token}).then(function(response){
  token='';
  if(response.status===200){
    setStatus('authenticated','Secure handoff accepted. Opening Shiloh Calendar…');
    window.location.replace(CALENDAR_PATH);
    return;
  }
  if(response.status===401||response.status===403){setStatus('invalid','That Calendar link is invalid, expired, already used, or no longer authorized. Send Open Calendar in Shiloh to get a new link.');return;}
  setStatus('provider-unavailable','Secure Calendar access is temporarily unavailable. Send Open Calendar in Shiloh and try again.');
}).catch(function(){
  token='';
  setStatus('provider-unavailable','Secure Calendar access is temporarily unavailable. Check your connection and try again.');
});
})();`;
}

module.exports = {
  renderStaffCalendarHandoffPage,
  staffCalendarHandoffClientScript,
};
