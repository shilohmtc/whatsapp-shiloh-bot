function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJson(value) {
  return JSON.stringify(value || {}).replace(/</g, '\\u003c');
}

function styles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#6c7d75;--paper:#f7f5ef;--panel:#fffdf9;--line:#dfe5df;--leaf:#496b5a;--leaf-soft:#e7eee9;--danger:#8a3f3f;--danger-soft:#f8eaea}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:980px;margin:0 auto;padding:22px 16px 40px}.topbar{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:16px}.topbar h1{font-size:1.45rem;margin:0}.topbar p{margin:4px 0 0;color:var(--muted)}a{color:var(--leaf);font-weight:700;text-decoration:none}.panel{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:0 4px 18px rgba(32,50,43,.04);margin-bottom:14px}.steps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.field{display:grid;gap:6px}.field.wide{grid-column:1/-1}.field label{font-size:.82rem;font-weight:750}.field input,.field select{width:100%;border:1px solid var(--line);border-radius:11px;padding:10px 11px;background:#fff;color:var(--ink);font:inherit}.actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:14px}.button{border:1px solid var(--leaf);border-radius:999px;padding:9px 14px;background:var(--leaf);color:#fff;font:inherit;font-weight:750;cursor:pointer}.button.secondary{background:#fff;color:var(--leaf)}.button:disabled{opacity:.5;cursor:not-allowed}.status{margin-top:12px;border:1px solid var(--line);border-radius:11px;padding:10px 12px;color:var(--muted);background:#fff}.status.error{background:var(--danger-soft);color:var(--danger)}.client-results{display:grid;gap:7px;margin-top:10px}.client-result{display:flex;justify-content:space-between;gap:10px;align-items:center;text-align:left;border:1px solid var(--line);border-radius:11px;padding:10px;background:#fff;color:var(--ink);font:inherit;cursor:pointer}.client-result:hover{border-color:var(--leaf)}.client-result small{display:block;color:var(--muted);margin-top:2px}.selected{padding:10px 12px;border-radius:11px;background:var(--leaf-soft);margin-top:10px}.review{display:grid;gap:7px;margin-top:10px}.review-row{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid var(--line);padding:7px 0}.review-row:last-child{border-bottom:0}.review-row span:first-child{color:var(--muted)}.guard-note{font-size:.8rem;color:var(--muted);line-height:1.5;margin:12px 0 0}@media(max-width:650px){.steps{grid-template-columns:1fr}.field.wide{grid-column:auto}.topbar{align-items:flex-start;flex-direction:column}}`;
}

function renderCalendarCreateBookingPage({ options = { staff: [], services: [] }, date = '', clientScriptPath = '/calendar/book/client.js' } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Create Shiloh booking</title><style>${styles()}</style><script src="${escapeHtml(clientScriptPath)}" defer></script></head><body data-calendar-create-booking="true"><div class="shell">
    <header class="topbar"><div><h1>Create booking</h1><p>Christel emergency Calendar booking • guarded canonical write</p></div><a href="/calendar/read-only${date ? `?view=day&date=${escapeHtml(date)}` : ''}">← Back to Calendar</a></header>
    <main>
      <section class="panel"><div class="steps">
        <div class="field"><label for="booking-date">Date</label><input id="booking-date" type="date" value="${escapeHtml(date)}" required></div>
        <div class="field"><label for="booking-time">Start time</label><input id="booking-time" type="time" step="300" required></div>
        <div class="field wide"><label for="client-search">Find canonical CRM client</label><div class="actions"><input id="client-search" type="search" autocomplete="off" placeholder="Name or mobile number"><button class="button secondary" type="button" data-client-search>Find client</button></div><div class="client-results" data-client-results></div><div class="selected" data-selected-client hidden></div></div>
        <div class="field"><label for="service-select">Treatment</label><select id="service-select"><option value="">Choose treatment</option></select></div>
        <div class="field"><label for="staff-select">Eligible practitioner</label><select id="staff-select" disabled><option value="">Choose treatment first</option></select></div>
      </div>
      <div class="actions"><button class="button" type="button" data-review-booking>Review booking</button></div>
      <div class="status" role="status" aria-live="polite" data-booking-status>Choose the date/time, one canonical client, treatment and eligible practitioner.</div>
      <p class="guard-note">Availability is not calculated in this browser. Review delegates to Shiloh's authoritative booking/availability owner, and final creation rechecks the slot immediately before commit.</p>
      </section>
      <section class="panel" data-review-panel hidden><h2>Review before write</h2><div class="review" data-review></div><div class="actions"><button class="button" type="button" data-create-booking disabled>Create booking</button></div><p class="guard-note">Create booking is the only scheduling mutation available on this emergency surface. Reschedule, cancellation, drag/drop, reassignment, schedule, block and leave writes are not available.</p></section>
    </main>
    <script type="application/json" id="calendar-booking-options">${safeJson(options)}</script>
  </div></body></html>`;
}

function calendarCreateBookingClientScript() {
  return `(function(){
'use strict';
var API='/calendar/book';
var AUTH='/calendar/staff-auth';
var options={staff:[],services:[]};
try{options=JSON.parse((document.getElementById('calendar-booking-options')||{}).textContent||'{}');}catch(_error){}
var selectedClient=null;
var prepared=false;
function el(selector){return document.querySelector(selector);}
function setStatus(message,error){var node=el('[data-booking-status]');if(!node)return;node.textContent=message;node.classList.toggle('error',!!error);}
function json(response){return response.json().catch(function(){return {};});}
function post(url,payload,csrf){var headers={'Content-Type':'application/json','Accept':'application/json'};if(csrf)headers['x-shiloh-csrf-token']=csrf;return fetch(url,{method:'POST',credentials:'same-origin',cache:'no-store',headers:headers,body:JSON.stringify(payload||{})});}
async function csrf(){var response=await post(AUTH+'/csrf',{});if(!response.ok)throw new Error('SESSION');var body=await json(response);if(!body.csrfToken)throw new Error('SESSION');return body.csrfToken;}
function resetReview(){prepared=false;var panel=el('[data-review-panel]');if(panel)panel.hidden=true;var button=el('[data-create-booking]');if(button)button.disabled=true;}
function formatDate(value){if(!value)return'';var date=new Date(value);if(Number.isNaN(date.getTime()))return String(value);return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(date);}
function populateServices(){var select=el('#service-select');(options.services||[]).forEach(function(service){var option=document.createElement('option');option.value=String(service.id);option.textContent=service.name;select.appendChild(option);});}
function populateStaff(){var serviceId=Number(el('#service-select').value);var select=el('#staff-select');select.textContent='';var first=document.createElement('option');first.value='';first.textContent=serviceId?'Choose practitioner':'Choose treatment first';select.appendChild(first);var service=(options.services||[]).find(function(item){return Number(item.id)===serviceId;});if(!service){select.disabled=true;return;}var permitted=new Set((service.staffIds||[]).map(Number));(options.staff||[]).filter(function(item){return permitted.has(Number(item.id));}).forEach(function(person){var option=document.createElement('option');option.value=String(person.id);option.textContent=person.displayName;select.appendChild(option);});select.disabled=false;resetReview();}
function selectClient(client){selectedClient=client;var node=el('[data-selected-client]');node.hidden=false;node.textContent=client.displayName+' — CRM #'+client.id+(client.contactHint?' — '+client.contactHint:'');resetReview();}
async function searchClients(){var query=String(el('#client-search').value||'').trim();if(query.length<2){setStatus('Enter at least two characters of a client name or number.',true);return;}setStatus('Searching canonical CRM…');var response=await post(API+'/client-search',{query:query});var body=await json(response);var results=el('[data-client-results]');results.textContent='';if(!response.ok){setStatus(body.error||'Client search is unavailable.',true);return;}if(!body.clients||!body.clients.length){setStatus('No canonical CRM clients matched. No client was created.',true);return;}body.clients.forEach(function(client){var button=document.createElement('button');button.type='button';button.className='client-result';var main=document.createElement('span');main.textContent=client.displayName+' — CRM #'+client.id;var small=document.createElement('small');small.textContent=[client.status,client.contactHint].filter(Boolean).join(' • ');main.appendChild(small);var choose=document.createElement('strong');choose.textContent='Select';button.appendChild(main);button.appendChild(choose);button.addEventListener('click',function(){selectClient(client);});results.appendChild(button);});setStatus(body.ambiguous?'Multiple canonical clients matched. Select exactly one; Shiloh will not choose automatically.':'Select the canonical client to continue.');}
function reviewRows(review){return [['Client',review.client.displayName+' — CRM #'+review.client.id],['Treatment',review.service.name],['Practitioner',review.practitioner.displayName],['Date / start',formatDate(review.startsAt)],['Duration',review.durationMinutes+' minutes'],['Price',review.price]];}
async function prepare(){resetReview();if(!selectedClient){setStatus('Select exactly one canonical CRM client first.',true);return;}var date=el('#booking-date').value;var time=el('#booking-time').value;var serviceId=Number(el('#service-select').value);var staffId=Number(el('#staff-select').value);if(!date||!time||!serviceId||!staffId){setStatus('Choose date, start time, treatment and eligible practitioner.',true);return;}setStatus('Rechecking authoritative availability…');try{var token=await csrf();var response=await post(API+'/prepare',{clientId:selectedClient.id,serviceId:serviceId,staffId:staffId,date:date,time:time},token);token='';var body=await json(response);if(!response.ok||body.status!=='pending_confirmation'){setStatus(body.error||body.reply||'That booking cannot be prepared. Choose another eligible slot.',true);return;}var review=el('[data-review]');review.textContent='';reviewRows(body.review).forEach(function(row){var line=document.createElement('div');line.className='review-row';var label=document.createElement('span');label.textContent=row[0];var value=document.createElement('strong');value.textContent=row[1];line.appendChild(label);line.appendChild(value);review.appendChild(line);});el('[data-review-panel]').hidden=false;el('[data-create-booking]').disabled=false;prepared=true;setStatus('Review the booking below. No appointment has been created yet.');}catch(_error){setStatus('Your secure session could not prepare this booking. Reopen Calendar from Shiloh Admin if needed.',true);}}
async function confirm(){if(!prepared)return;var button=el('[data-create-booking]');button.disabled=true;setStatus('Final recheck and canonical booking commit in progress…');try{var token=await csrf();var response=await post(API+'/confirm',{},token);token='';var body=await json(response);if(!response.ok||body.status!=='created'){prepared=false;setStatus(body.error||body.reply||'The slot changed before commit. Nothing was created; review availability again.',true);return;}var date=el('#booking-date').value;setStatus('Booking created. Refreshing the canonical Calendar…');window.location.assign('/calendar/read-only?view=day&date='+encodeURIComponent(date));}catch(_error){prepared=false;setStatus('Shiloh could not complete the guarded booking commit. Refresh Calendar before retrying.',true);}}
populateServices();
el('#service-select').addEventListener('change',populateStaff);
el('#staff-select').addEventListener('change',resetReview);
el('#booking-date').addEventListener('change',resetReview);
el('#booking-time').addEventListener('change',resetReview);
el('[data-client-search]').addEventListener('click',searchClients);
el('#client-search').addEventListener('keydown',function(event){if(event.key==='Enter'){event.preventDefault();searchClients();}});
el('[data-review-booking]').addEventListener('click',prepare);
el('[data-create-booking]').addEventListener('click',confirm);
})();`;
}

module.exports = {
  escapeHtml,
  renderCalendarCreateBookingPage,
  calendarCreateBookingClientScript,
};
