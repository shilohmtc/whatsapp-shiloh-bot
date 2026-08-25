function emergencyCalendarBootstrapClientScript() {
  return `(function(){
'use strict';
var AUTH_BASE='/calendar/staff-auth';
var CALENDAR_PATH='/calendar/read-only';
var fragment=String(window.location.hash||'');
var match=fragment.match(/^#bootstrap=([A-Za-z0-9_-]{43})$/);
if(!fragment)return;
window.history.replaceState(null,'',window.location.pathname+window.location.search);
if(!match){return;}
var token=match[1];
function select(selector){return document.querySelector(selector);}
function setStatus(state,message){var node=select('[data-shiloh-status]');if(!node)return;node.dataset.state=state;node.textContent=message;}
function postJson(url,payload){return fetch(url,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload||{})});}
setStatus('pending','Opening your secure Shiloh Calendar…');
postJson(AUTH_BASE+'/emergency-bootstrap/exchange',{token:token}).then(function(response){
  token='';
  if(response.status===200){
    setStatus('authenticated','Secure handoff accepted. Opening Shiloh Calendar…');
    window.location.replace(CALENDAR_PATH);
    return;
  }
  if(response.status===401||response.status===403){setStatus('invalid','That secure Calendar handoff is invalid, expired, already used, or no longer authorized. Send Open Calendar in Shiloh Admin to get a new link.');return;}
  if(response.status===404){setStatus('error','Secure Calendar booking access is not active yet.');return;}
  setStatus('provider-unavailable','Secure Calendar access is temporarily unavailable. Send Open Calendar in Shiloh Admin and try again.');
}).catch(function(){
  token='';
  setStatus('provider-unavailable','Secure Calendar access is temporarily unavailable. Check your connection and try again.');
});
})();`;
}

module.exports = { emergencyCalendarBootstrapClientScript };
