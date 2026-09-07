const {
  escapeHtml,
  workspaceShellStyles,
  renderWorkspaceNavigation,
} = require('./workspaceShell');

function clinicHoursStyles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#66776f;--paper:#f4f3ed;--panel:#fffdf9;--line:#dce3dd;--line-strong:#c9d4cc;--leaf:#3f6653;--leaf-deep:#294c3c;--leaf-soft:#e7eee9;--sand:#f1ede2;--danger:#8a4138;--shadow:0 8px 28px rgba(32,50,43,.07)}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:980px;margin:0 auto;padding:22px}.topbar{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:16px}.brand h1{margin:0;font-size:1.55rem}.brand p{margin:5px 0 0;color:var(--muted);font-size:.9rem;line-height:1.45}.topbar-side{display:grid;justify-items:end;gap:7px}.truth-note,.access-status{font-size:.74rem;color:var(--muted)}.signout-button,.button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border:1px solid var(--line-strong);border-radius:999px;padding:8px 14px;background:#fff;color:var(--ink);font:inherit;font-size:.82rem;font-weight:780;text-decoration:none;cursor:pointer}.button.primary{background:var(--leaf-deep);border-color:var(--leaf-deep);color:#fff}.button[disabled]{opacity:.56;cursor:not-allowed}.notice,.hours-card{background:var(--panel);border:1px solid var(--line);box-shadow:var(--shadow)}.notice{border-radius:15px;padding:14px 16px;margin-bottom:12px;color:var(--muted);font-size:.8rem;line-height:1.55}.notice strong{color:var(--ink)}.hours-card{border-radius:18px;padding:16px}.hours-head{display:flex;justify-content:space-between;align-items:start;gap:14px;padding-bottom:13px;border-bottom:1px solid var(--line)}.hours-head h2{margin:0;font-size:1.05rem}.hours-head p{margin:5px 0 0;color:var(--muted);font-size:.75rem}.location-pill{display:inline-flex;border-radius:999px;padding:7px 10px;background:var(--leaf-soft);color:var(--leaf-deep);font-size:.72rem;font-weight:780;text-align:right}.hours-list{display:grid}.day-row{display:grid;grid-template-columns:minmax(118px,.7fr) minmax(120px,.65fr) minmax(0,1.2fr);gap:14px;align-items:center;padding:15px 4px;border-bottom:1px solid var(--line)}.day-row:last-child{border-bottom:0}.day-name{font-weight:800}.day-note{display:block;margin-top:3px;color:var(--muted);font-size:.68rem}.state-select,.time-input{width:100%;min-height:44px;border:1px solid var(--line-strong);border-radius:10px;background:#fff;color:var(--ink);padding:9px 11px;font:inherit}.time-pair{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center}.time-separator{color:var(--muted);font-size:.75rem}.time-input:disabled{background:var(--sand);color:#7d8782}.permanent-state{display:inline-flex;align-items:center;min-height:42px;border-radius:10px;padding:9px 11px;background:var(--sand);color:var(--muted);font-size:.78rem;font-weight:750}.form-actions{display:flex;align-items:center;justify-content:space-between;gap:14px;padding-top:15px;border-top:1px solid var(--line)}.save-status{min-height:20px;color:var(--muted);font-size:.76rem;line-height:1.4}.save-status.error{color:var(--danger)}.save-status.success{color:var(--leaf-deep);font-weight:750}.footer-note{margin:14px 0 0;color:var(--muted);font-size:.72rem;line-height:1.55}@media(max-width:700px){.shell{padding:14px 12px 24px}.topbar{align-items:start;flex-direction:column}.topbar-side{justify-items:start;width:100%}.hours-card{padding:13px}.hours-head{display:grid}.location-pill{justify-self:start;text-align:left}.day-row{grid-template-columns:minmax(0,1fr) minmax(112px,.7fr);gap:9px 10px;padding:14px 2px}.time-pair{grid-column:1/-1}.state-select,.time-input,.button,.signout-button{min-height:46px;font-size:16px}.form-actions{align-items:stretch;flex-direction:column}.button.primary{width:100%}}`;
}

function renderDay(day) {
  const dayOfWeek = Number(day.dayOfWeek);
  if (day.permanent === true || dayOfWeek === 0) {
    return `<div class="day-row" data-clinic-day="0"><div><span class="day-name">Sunday</span><span class="day-note">Permanent clinic closure</span></div><div class="permanent-state">Closed</div><div class="permanent-state">Sunday cannot be opened here.</div></div>`;
  }
  const open = day.open === true;
  const defaultStart = day.startsLocal || (dayOfWeek === 6 ? '08:00' : '08:00');
  const defaultEnd = day.endsLocal || (dayOfWeek === 6 ? '14:00' : '17:00');
  return `<div class="day-row" data-clinic-day="${dayOfWeek}">
    <div><span class="day-name">${escapeHtml(day.name)}</span><span class="day-note">Recurring weekly hours</span></div>
    <label><span class="day-note">Status</span><select class="state-select" data-clinic-open aria-label="${escapeHtml(day.name)} status"><option value="open"${open ? ' selected' : ''}>Open</option><option value="closed"${open ? '' : ' selected'}>Closed</option></select></label>
    <div class="time-pair"><label><span class="day-note">Opens</span><input class="time-input" data-clinic-start type="time" step="300" value="${escapeHtml(defaultStart)}"${open ? '' : ' disabled'}></label><span class="time-separator">to</span><label><span class="day-note">Closes</span><input class="time-input" data-clinic-end type="time" step="300" value="${escapeHtml(defaultEnd)}"${open ? '' : ' disabled'}></label></div>
  </div>`;
}

function renderClinicHoursPage(model, {
  staffAccessScriptPath = '/calendar/staff/client.js',
  clientScriptPath = '/calendar/clinic-hours/client.js',
} = {}) {
  const rows = (model.days || []).map(renderDay).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Clinic hours — Shiloh Workspace</title><style>${workspaceShellStyles()}${clinicHoursStyles()}</style><script src="${escapeHtml(staffAccessScriptPath)}" defer></script><script src="${escapeHtml(clientScriptPath)}" defer></script></head><body data-workspace-clinic-hours="true"><div class="workspace-frame">${renderWorkspaceNavigation({
    active: 'clinicHours',
    dashboardHref: '/calendar/workspace',
    calendarHref: '/calendar/read-only',
    clientsHref: '/calendar/clients',
    messagesHref: '/calendar/messages',
    staffHref: '/calendar/team',
    servicesHref: '/calendar/services',
    reportsHref: '/calendar/reports',
  })}<div class="workspace-main"><div class="shell">
    <header class="topbar"><div class="brand"><h1>Clinic hours</h1><p>Normal recurring operating hours for the whole clinic.</p></div><div class="topbar-side"><span class="truth-note">${escapeHtml(model.location?.timezone || 'Africa/Johannesburg')} • Canonical booking envelope</span><button class="signout-button" type="button" data-shiloh-logout>Sign out</button><span class="access-status" role="status" aria-live="polite" data-shiloh-calendar-access-status></span></div></header>
    <section class="notice"><strong>What this changes:</strong> recurring booking availability going forward. Existing appointments are not moved or cancelled. Public holidays and one-off clinic closures remain separate and are not changed here.</section>
    <form class="hours-card" data-clinic-hours-form data-revision="${escapeHtml(model.revision)}" novalidate>
      <div class="hours-head"><div><h2>Weekly operating hours</h2><p>Set one clinic-wide window per day, or mark the day closed.</p></div><span class="location-pill">${escapeHtml(model.location?.name || 'Shiloh')}</span></div>
      <div class="hours-list">${rows}</div>
      <div class="form-actions"><div class="save-status" data-clinic-hours-status role="status" aria-live="polite"></div><button class="button primary" type="submit" data-clinic-hours-save>Save clinic hours</button></div>
    </form>
    <p class="footer-note">Sunday remains permanently closed. Practitioner-specific availability still sits inside this clinic-wide envelope.</p>
  </div></div></div></body></html>`;
}

function clinicHoursClientScript() {
  return `(()=>{'use strict';
const form=document.querySelector('[data-clinic-hours-form]');if(!form)return;
const status=document.querySelector('[data-clinic-hours-status]');const save=document.querySelector('[data-clinic-hours-save]');
function setStatus(message,kind=''){if(!status)return;status.textContent=message||'';status.className='save-status'+(kind?' '+kind:'');}
function syncRow(row){const open=row.querySelector('[data-clinic-open]')?.value==='open';for(const input of row.querySelectorAll('[data-clinic-start],[data-clinic-end]'))input.disabled=!open;}
for(const row of form.querySelectorAll('[data-clinic-day]:not([data-clinic-day="0"])')){syncRow(row);row.querySelector('[data-clinic-open]')?.addEventListener('change',()=>syncRow(row));}
async function csrfToken(){const response=await fetch('/calendar/staff-auth/csrf',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json','accept':'application/json'},body:'{}'});const data=await response.json().catch(()=>({}));if(!response.ok||!data.csrfToken)throw new Error(data.error||'Could not prepare the secure save request.');return data.csrfToken;}
function payload(){const days=[];for(const row of form.querySelectorAll('[data-clinic-day]:not([data-clinic-day="0"])')){const dayOfWeek=Number(row.dataset.clinicDay);const open=row.querySelector('[data-clinic-open]')?.value==='open';days.push({dayOfWeek,open,startsLocal:open?row.querySelector('[data-clinic-start]')?.value:null,endsLocal:open?row.querySelector('[data-clinic-end]')?.value:null});}return {expectedRevision:form.dataset.revision,days};}
form.addEventListener('submit',async event=>{event.preventDefault();if(save)save.disabled=true;setStatus('Saving…');try{const csrf=await csrfToken();const response=await fetch('/calendar/clinic-hours',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json','accept':'application/json','x-shiloh-csrf-token':csrf},body:JSON.stringify(payload())});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Clinic hours could not be saved.');form.dataset.revision=data.revision||form.dataset.revision;setStatus('Clinic hours saved.','success');setTimeout(()=>location.reload(),450);}catch(error){setStatus(error.message||'Clinic hours could not be saved.','error');if(save)save.disabled=false;}});
})();`;
}

function clinicHoursNavigationClientScript() {
  return `(()=>{'use strict';
fetch('/calendar/workspace/navigation',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}}).then(async response=>{if(!response.ok)return;const item=(await response.json())?.clinicHours;if(!item||item.allowed!==true||!item.href)return;const menu=document.querySelector('[data-workspace-more-menu]');if(!menu||menu.querySelector('[data-workspace-destination="clinicHours"]'))return;const link=document.createElement('a');link.className='workspace-link';link.href=item.href;link.dataset.workspaceDestination='clinicHours';link.textContent='Clinic hours';if(location.pathname===item.href){link.classList.add('active');link.setAttribute('aria-current','page');document.querySelector('[data-workspace-more-toggle]')?.classList.add('active');}const empty=menu.querySelector('.workspace-more-empty');menu.insertBefore(link,empty||null);if(empty)empty.hidden=true;}).catch(()=>{});
})();`;
}

module.exports = {
  clinicHoursStyles,
  renderDay,
  renderClinicHoursPage,
  clinicHoursClientScript,
  clinicHoursNavigationClientScript,
};
