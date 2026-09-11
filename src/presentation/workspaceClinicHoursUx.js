const {
  escapeHtml,
  workspaceShellStyles,
  renderWorkspaceNavigation,
} = require('./workspaceShell');

function clinicHoursStyles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#66776f;--paper:#f4f3ed;--panel:#fffdf9;--line:#dce3dd;--line-strong:#c9d4cc;--leaf:#3f6653;--leaf-deep:#294c3c;--leaf-soft:#e7eee9;--sand:#f1ede2;--danger:#8a4138;--shadow:0 8px 28px rgba(32,50,43,.07)}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:980px;margin:0 auto;padding:22px}.topbar{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:16px}.brand h1{margin:0;font-size:1.55rem}.brand p{margin:5px 0 0;color:var(--muted);font-size:.9rem;line-height:1.45}.notice,.hours-card,.exception-card{background:var(--panel);border:1px solid var(--line);box-shadow:var(--shadow)}.notice{border-radius:15px;padding:14px 16px;margin-bottom:12px;color:var(--muted);font-size:.8rem;line-height:1.55}.notice strong{color:var(--ink)}.hours-card,.exception-card{border-radius:18px;padding:16px}.exception-card{margin-top:16px}.hours-head{display:flex;justify-content:space-between;align-items:start;gap:14px;padding-bottom:13px;border-bottom:1px solid var(--line)}.hours-head h2{margin:0;font-size:1.05rem}.hours-head p{margin:5px 0 0;color:var(--muted);font-size:.75rem;line-height:1.5}.location-pill{display:inline-flex;border-radius:999px;padding:7px 10px;background:var(--leaf-soft);color:var(--leaf-deep);font-size:.72rem;font-weight:780;text-align:right}.hours-list{display:grid}.day-row{display:grid;grid-template-columns:minmax(118px,.7fr) minmax(120px,.65fr) minmax(0,1.2fr);gap:14px;align-items:center;padding:15px 4px;border-bottom:1px solid var(--line)}.day-row:last-child{border-bottom:0}.day-name{font-weight:800}.day-note,.field-note{display:block;margin-top:3px;color:var(--muted);font-size:.68rem;line-height:1.4}.state-select,.time-input,.date-input{width:100%;min-height:44px;border:1px solid var(--line-strong);border-radius:10px;background:#fff;color:var(--ink);padding:9px 11px;font:inherit}.time-pair{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center}.time-separator{color:var(--muted);font-size:.75rem}.time-input:disabled{background:var(--sand);color:#7d8782}.permanent-state{display:inline-flex;align-items:center;min-height:42px;border-radius:10px;padding:9px 11px;background:var(--sand);color:var(--muted);font-size:.78rem;font-weight:750}.form-actions{display:flex;align-items:center;justify-content:space-between;gap:14px;padding-top:15px;border-top:1px solid var(--line)}.hours-card>.form-actions{margin:0 0 3px;padding:12px 0;border-top:0;border-bottom:1px solid var(--line)}.save-status{min-height:20px;color:var(--muted);font-size:.76rem;line-height:1.4}.save-status.error{color:var(--danger)}.save-status.success{color:var(--leaf-deep);font-weight:750}.button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border:1px solid var(--line-strong);border-radius:999px;padding:8px 14px;background:#fff;color:var(--ink);font:inherit;font-size:.82rem;font-weight:780;text-decoration:none;cursor:pointer}.button.primary{background:var(--leaf-deep);border-color:var(--leaf-deep);color:#fff}.button.small{min-height:36px;padding:6px 11px;font-size:.74rem}.button[disabled]{opacity:.56;cursor:not-allowed}.exception-grid{display:grid;grid-template-columns:minmax(150px,.75fr) minmax(150px,.75fr) minmax(0,1fr);gap:12px;margin:15px 0}.exception-time{display:grid;grid-template-columns:1fr 1fr;gap:10px}.exception-time[data-hidden="true"]{display:none}.exception-list{display:grid;gap:8px;margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}.exception-row{display:grid;grid-template-columns:minmax(120px,.65fr) minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:#fff}.exception-date{font-weight:800}.exception-summary{font-size:.78rem;line-height:1.45}.exception-meta{display:block;color:var(--muted);font-size:.68rem;margin-top:2px}.empty-state{color:var(--muted);font-size:.78rem;padding:10px 0}.footer-note{margin:14px 0 0;color:var(--muted);font-size:.72rem;line-height:1.55}@media(max-width:700px){.shell{padding:14px 12px 24px}.topbar{align-items:start;flex-direction:column}.hours-card,.exception-card{padding:13px}.hours-head{display:grid}.location-pill{justify-self:start;text-align:left}.day-row{grid-template-columns:minmax(0,1fr) minmax(112px,.7fr);gap:9px 10px;padding:14px 2px}.time-pair{grid-column:1/-1}.state-select,.time-input,.date-input,.button{min-height:46px;font-size:16px}.form-actions{align-items:stretch;flex-direction:column}.button.primary{width:100%}.exception-grid{grid-template-columns:1fr}.exception-time{grid-column:1/-1}.exception-row{grid-template-columns:1fr auto}.exception-summary{grid-column:1/-1;grid-row:2}.exception-row .button{grid-column:2;grid-row:1}.hours-card>.form-actions{position:sticky;top:max(8px,env(safe-area-inset-top));z-index:4;margin:0 -5px 3px;padding:10px;border:1px solid var(--line);border-radius:13px;background:rgba(255,253,249,.97);box-shadow:0 8px 24px rgba(32,50,43,.12)}.exception-card .form-actions{position:sticky;bottom:max(8px,env(safe-area-inset-bottom));z-index:4;margin:0 -5px -5px;padding:10px;border:1px solid var(--line);border-radius:13px;background:rgba(255,253,249,.97);box-shadow:0 -8px 24px rgba(32,50,43,.12)}}`;
}

function renderDay(day) {
  const dayOfWeek = Number(day.dayOfWeek);
  if (day.permanent === true || dayOfWeek === 0) {
    return `<div class="day-row" data-clinic-day="0" data-open="false"><div><span class="day-name">Sunday</span><span class="day-note">Permanent clinic closure</span></div><div class="permanent-state">Closed</div><div class="permanent-state">Sunday cannot be opened here.</div></div>`;
  }
  const open = day.open === true;
  const defaultStart = day.startsLocal || '08:00';
  const defaultEnd = day.endsLocal || (dayOfWeek === 6 ? '14:00' : '17:00');
  return `<div class="day-row" data-clinic-day="${dayOfWeek}" data-open="${open ? 'true' : 'false'}">
    <div><span class="day-name">${escapeHtml(day.name)}</span><span class="day-note">Recurring weekly hours</span></div>
    <label><span class="day-note">Status</span><select class="state-select" data-clinic-open aria-label="${escapeHtml(day.name)} status"><option value="open"${open ? ' selected' : ''}>Open</option><option value="closed"${open ? '' : ' selected'}>Closed</option></select></label>
    <div class="time-pair"><label><span class="day-note">Opens</span><input class="time-input" data-clinic-start type="time" step="300" value="${escapeHtml(defaultStart)}"${open ? '' : ' disabled'}></label><span class="time-separator">to</span><label><span class="day-note">Closes</span><input class="time-input" data-clinic-end type="time" step="300" value="${escapeHtml(defaultEnd)}"${open ? '' : ' disabled'}></label></div>
  </div>`;
}

function renderException(exception) {
  const open = exception.exceptionType === 'open';
  const title = exception.holidayName || 'Clinic-wide exception';
  const summary = open
    ? `Open ${escapeHtml(exception.startsLocal || '')}–${escapeHtml(exception.endsLocal || '')}`
    : 'Closed all day';
  return `<div class="exception-row" data-clinic-exception data-date="${escapeHtml(exception.exceptionDate)}" data-type="${open ? 'open' : 'closed'}" data-start="${escapeHtml(exception.startsLocal || '')}" data-end="${escapeHtml(exception.endsLocal || '')}">
    <div><span class="exception-date">${escapeHtml(exception.exceptionDate)}</span><span class="exception-meta">${escapeHtml(title)}</span></div>
    <div class="exception-summary">${summary}</div>
    <button class="button small" type="button" data-edit-exception>Edit</button>
  </div>`;
}

function renderClinicHoursPage(model, {
  staffAccessScriptPath = '/calendar/staff/client.js',
  clientScriptPath = '/calendar/clinic-hours/client.js',
} = {}) {
  const rows = (model.days || []).map(renderDay).join('');
  const exceptions = (model.exceptions || []).map(renderException).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Clinic hours — Shiloh Workspace</title><style>${workspaceShellStyles()}${clinicHoursStyles()}</style><script src="${escapeHtml(staffAccessScriptPath)}" defer></script><script src="${escapeHtml(clientScriptPath)}" defer></script></head><body data-workspace-clinic-hours="true"><div class="workspace-frame">${renderWorkspaceNavigation({
    active: 'clinicHours',
    displayName: model.authority?.displayName,
    dashboardHref: '/calendar/workspace',
    calendarHref: '/calendar/read-only',
    clientsHref: '/calendar/clients',
    messagesHref: '/calendar/messages',
    staffHref: '/calendar/team',
    servicesHref: '/calendar/services',
    reportsHref: '/calendar/reports',
    clinicHoursHref: '/calendar/clinic-hours',
  })}<div class="workspace-main"><div class="shell">
    <header class="topbar"><div class="brand"><h1>Clinic hours</h1><p>Clinic-wide recurring hours, closures and holiday hours.</p></div></header>
    <section class="notice"><strong>Clinic-wide authority:</strong> these settings shape Calendar, booking and reschedule availability. Public holidays and one-off clinic closures remain separate from recurring clinic hours. They do not create, remove or alter practitioner leave or practitioner blocks.</section>
    <style data-clinic-hours-mobile-cohesion>@media(max-width:700px){.day-row[data-open="false"]{opacity:.76}}</style>
    <form class="hours-card" data-clinic-hours-form data-revision="${escapeHtml(model.revision)}" novalidate>
      <div class="hours-head"><div><h2>Weekly operating hours</h2><p>Set one recurring clinic-wide window per day, or mark the day closed.</p></div><span class="location-pill">${escapeHtml(model.location?.name || 'Shiloh')}</span></div>
      <div class="form-actions"><div class="save-status" data-clinic-hours-status role="status" aria-live="polite"></div><button class="button primary" type="submit" data-clinic-hours-save>Save weekly hours</button></div>
      <div class="hours-list">${rows}</div>
    </form>
    <section class="exception-card" aria-labelledby="clinic-exceptions-title">
      <div class="hours-head"><div><h2 id="clinic-exceptions-title">Closures & holiday hours</h2><p>Create or edit one clinic-wide exception for a specific date. Saving the same date updates the existing canonical exception; changing Closed to Open safely reopens that date for the special hours entered.</p></div><span class="location-pill">${escapeHtml(model.location?.name || 'Shiloh')}</span></div>
      <form data-clinic-exception-form novalidate>
        <div class="exception-grid">
          <label><span class="field-note">Date</span><input class="date-input" data-exception-date type="date" required></label>
          <label><span class="field-note">Clinic status</span><select class="state-select" data-exception-type><option value="closed">Closed</option><option value="open">Open with special hours</option></select></label>
          <div class="exception-time" data-exception-time data-hidden="true"><label><span class="field-note">Opens</span><input class="time-input" data-exception-start type="time" step="300" value="08:00" disabled></label><label><span class="field-note">Closes</span><input class="time-input" data-exception-end type="time" step="300" value="17:00" disabled></label></div>
        </div>
        <div class="form-actions"><div class="save-status" data-clinic-exception-status role="status" aria-live="polite"></div><button class="button primary" type="submit" data-clinic-exception-save>Save date exception</button></div>
      </form>
      <div class="exception-list" data-clinic-exception-list>${exceptions || '<div class="empty-state">No clinic-wide date exceptions are currently recorded.</div>'}</div>
    </section>
    <p class="footer-note">Clinic-wide closures and holiday hours are separate from practitioner leave and practitioner-specific blocks. Existing appointments are not moved or cancelled by this editor.</p>
  </div></div></div></body></html>`;
}

function clinicHoursClientScript() {
  return `(()=>{'use strict';
const hoursForm=document.querySelector('[data-clinic-hours-form]');
const exceptionForm=document.querySelector('[data-clinic-exception-form]');
function setStatus(node,message,kind=''){if(!node)return;node.textContent=message||'';node.className='save-status'+(kind?' '+kind:'');}
async function csrfToken(){const response=await fetch('/calendar/staff-auth/csrf',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json','accept':'application/json'},body:'{}'});const data=await response.json().catch(()=>({}));if(!response.ok||!data.csrfToken)throw new Error(data.error||'Could not prepare the secure save request.');return data.csrfToken;}
if(hoursForm){const status=document.querySelector('[data-clinic-hours-status]');const save=document.querySelector('[data-clinic-hours-save]');function syncRow(row){const open=row.querySelector('[data-clinic-open]')?.value==='open';row.dataset.open=String(open);for(const input of row.querySelectorAll('[data-clinic-start],[data-clinic-end]'))input.disabled=!open;}for(const row of hoursForm.querySelectorAll('[data-clinic-day]:not([data-clinic-day="0"])')){syncRow(row);row.querySelector('[data-clinic-open]')?.addEventListener('change',()=>syncRow(row));}function payload(){const days=[];for(const row of hoursForm.querySelectorAll('[data-clinic-day]:not([data-clinic-day="0"])')){const dayOfWeek=Number(row.dataset.clinicDay);const open=row.querySelector('[data-clinic-open]')?.value==='open';days.push({dayOfWeek,open,startsLocal:open?row.querySelector('[data-clinic-start]')?.value:null,endsLocal:open?row.querySelector('[data-clinic-end]')?.value:null});}return {expectedRevision:hoursForm.dataset.revision,days};}hoursForm.addEventListener('submit',async event=>{event.preventDefault();if(save)save.disabled=true;setStatus(status,'Saving…');try{const csrf=await csrfToken();const response=await fetch('/calendar/clinic-hours',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json','accept':'application/json','x-shiloh-csrf-token':csrf},body:JSON.stringify(payload())});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Clinic hours could not be saved.');hoursForm.dataset.revision=data.revision||hoursForm.dataset.revision;setStatus(status,'Weekly clinic hours saved.','success');setTimeout(()=>location.reload(),450);}catch(error){setStatus(status,error.message||'Clinic hours could not be saved.','error');if(save)save.disabled=false;}});}
if(exceptionForm){const date=exceptionForm.querySelector('[data-exception-date]');const type=exceptionForm.querySelector('[data-exception-type]');const start=exceptionForm.querySelector('[data-exception-start]');const end=exceptionForm.querySelector('[data-exception-end]');const time=exceptionForm.querySelector('[data-exception-time]');const status=document.querySelector('[data-clinic-exception-status]');const save=document.querySelector('[data-clinic-exception-save]');function syncException(){const open=type.value==='open';time.dataset.hidden=String(!open);start.disabled=!open;end.disabled=!open;}type.addEventListener('change',syncException);syncException();for(const edit of document.querySelectorAll('[data-edit-exception]'))edit.addEventListener('click',()=>{const row=edit.closest('[data-clinic-exception]');if(!row)return;date.value=row.dataset.date||'';type.value=row.dataset.type||'closed';start.value=row.dataset.start||'08:00';end.value=row.dataset.end||'17:00';syncException();exceptionForm.scrollIntoView({behavior:'smooth',block:'center'});date.focus();setStatus(status,'Editing the existing '+date.value+' clinic-wide exception.');});exceptionForm.addEventListener('submit',async event=>{event.preventDefault();if(save)save.disabled=true;setStatus(status,'Saving…');try{const csrf=await csrfToken();const payload={exceptionDate:date.value,exceptionType:type.value,startsLocal:type.value==='open'?start.value:null,endsLocal:type.value==='open'?end.value:null};const response=await fetch('/calendar/clinic-hours/exceptions',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json','accept':'application/json','x-shiloh-csrf-token':csrf},body:JSON.stringify(payload)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Clinic date exception could not be saved.');setStatus(status,type.value==='open'?'Clinic date reopened with special hours.':'Clinic closure saved.','success');setTimeout(()=>location.reload(),450);}catch(error){setStatus(status,error.message||'Clinic date exception could not be saved.','error');if(save)save.disabled=false;}});}
})();`;
}

module.exports = {
  clinicHoursStyles,
  renderDay,
  renderException,
  renderClinicHoursPage,
  clinicHoursClientScript,
};