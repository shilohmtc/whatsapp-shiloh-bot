const {
  escapeHtml,
  workspaceShellStyles,
  renderWorkspaceNavigation,
} = require('./workspaceShell');

function styles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#66776f;--paper:#f4f3ed;--panel:#fffdf9;--line:#dce3dd;--leaf:#3f6653;--leaf-deep:#294c3c;--leaf-soft:#e7eee9;--warn:#8a623d;--warn-soft:#f5eee5;--danger:#8b453f;--danger-soft:#f7e9e6}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:1320px;margin:0 auto;padding:20px}.topbar{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:14px}.topbar-side{display:grid;justify-items:end;gap:7px}.brand h1{margin:0;font-size:clamp(1.45rem,2vw,1.85rem);letter-spacing:-.025em}.brand p,.truth-note{margin:5px 0 0;color:var(--muted);font-size:.78rem;line-height:1.45}.signout-button,.button,.action-button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:#fff;color:var(--ink);font:inherit;font-size:.74rem;font-weight:800;cursor:pointer;text-decoration:none}.layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.65fr);gap:12px}.stack{display:grid;gap:12px;align-content:start}.panel{min-width:0;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:15px}.hero-panel{box-shadow:0 8px 28px rgba(32,50,43,.055)}.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:11px}.eyebrow{font-size:.64rem;text-transform:uppercase;letter-spacing:.11em;font-weight:850;color:var(--muted)}.panel h2,.team-head h3{margin:3px 0 0;font-size:1.08rem}.day-summary{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.summary-pill,.status-pill{display:inline-flex;border-radius:999px;padding:5px 8px;background:var(--leaf-soft);color:var(--leaf-deep);font-size:.65rem;font-weight:850}.summary-pill.attention,.status-pill.pending{background:var(--warn-soft);color:var(--warn)}.status-pill.no-show{background:var(--danger-soft);color:var(--danger)}.schedule{display:grid;gap:8px}.team-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.team-group{min-width:0;border:1px solid var(--line);border-radius:13px;padding:10px;background:#fafbf8}.team-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.team-head h3{font-size:.86rem}.appointment{min-width:0;border:1px solid var(--line);border-radius:11px;padding:10px;background:#fff}.appointment+.appointment{margin-top:7px}.appointment-main{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:9px;align-items:start}.appointment-time{font-size:.72rem;font-weight:900;color:var(--leaf-deep);padding-top:2px}.appointment-copy{min-width:0}.appointment-copy strong,.appointment-copy span{display:block;overflow-wrap:anywhere}.appointment-copy span{margin-top:3px;color:var(--muted);font-size:.69rem;line-height:1.35}.appointment-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;margin-top:8px}.action-button{min-height:36px;border-radius:8px;padding:6px 10px}.action-button.complete{border-color:var(--leaf);color:var(--leaf-deep);background:var(--leaf-soft)}.action-button.no-show{color:var(--danger)}.action-button:disabled{opacity:.5;cursor:wait}.attention-summary{padding:12px;border-radius:11px;background:var(--warn-soft);color:var(--warn);font-size:.75rem;line-height:1.45}.activity-list,.communication-list{display:grid;gap:7px}.activity-item,.communication-item{display:flex;justify-content:space-between;gap:10px;align-items:center;border-top:1px solid var(--line);padding-top:8px;font-size:.72rem}.activity-item:first-child,.communication-item:first-child{border-top:0;padding-top:0}.activity-item strong,.communication-item strong{display:block}.activity-item span,.communication-item span{color:var(--muted);font-size:.67rem}.empty{padding:22px 13px;border:1px dashed var(--line);border-radius:11px;color:var(--muted);font-size:.76rem;line-height:1.5;text-align:center}.closure{padding:10px 11px;margin-bottom:9px;border-radius:11px;background:var(--warn-soft);color:var(--warn);font-size:.74rem;font-weight:800}.operation-status{min-height:18px;margin:8px 0 0;color:var(--muted);font-size:.7rem}.operation-status[data-tone="error"]{color:var(--danger)}@media(max-width:850px){.layout,.team-groups{grid-template-columns:1fr}.shell{padding:13px 11px 28px}.topbar{align-items:start;flex-direction:column;padding-left:52px;min-height:44px}.topbar-side{justify-items:start}.panel{padding:13px;border-radius:14px}.hero-panel{order:-1}.button,.signout-button,.action-button{min-height:44px}.appointment-main{grid-template-columns:58px minmax(0,1fr)}.appointment-main>.status-pill{grid-column:2;justify-self:start}.appointment-actions{display:grid;grid-template-columns:1fr 1fr}.appointment-actions .button{grid-column:1/-1}.team-group{padding:9px}.brand p{max-width:34rem}}`;
}

function timeOnly(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unknown';
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

function practitionerNames(appointment, calendar) {
  const names = new Map((calendar.timeline?.staff || []).map(person => [Number(person.id), person.displayName]));
  return (appointment.staffIds || []).map(id => names.get(Number(id))).filter(Boolean).join(' + ') || 'Shiloh practitioner';
}

function statusPresentation(status) {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'completed') return { label: 'Completed', className: '' };
  if (value === 'no_show') return { label: 'No-show', className: ' no-show' };
  if (value === 'cancelled') return { label: 'Cancelled', className: ' no-show' };
  return { label: value ? value.replace(/_/g, ' ') : 'Scheduled', className: ' pending' };
}

function calendarHref(model) {
  return `/calendar/read-only?view=day&amp;date=${escapeHtml(model.operationalDateKey)}${model.mode === 'owner_overview' ? '&amp;staff=all' : ''}`;
}

function appointmentItem(item, model) {
  const status = statusPresentation(item.status);
  const actions = item.canFinalize ? `<div class="appointment-actions" data-dashboard-finalization-actions><button type="button" class="action-button complete" data-dashboard-finalize="completed">Completed</button><button type="button" class="action-button no-show" data-dashboard-finalize="no_show">No-show</button><a class="button" href="${calendarHref(model)}">Open / manage</a></div>` : `<div class="appointment-actions"><a class="button" href="${calendarHref(model)}">Open / manage</a></div>`;
  return `<article class="appointment" id="dashboard-appointment-${escapeHtml(item.id)}" data-dashboard-appointment="${escapeHtml(item.id)}" data-revision="${escapeHtml(item.revision || '')}"><div class="appointment-main"><span class="appointment-time">${escapeHtml(timeOnly(item.startsAt))}</span><div class="appointment-copy"><strong>${escapeHtml(item.clientName || 'Client')}</strong><span>${escapeHtml(item.serviceName || 'Shiloh appointment')} · ${escapeHtml(practitionerNames(item, model.calendar))}</span></div><span class="status-pill${status.className}">${escapeHtml(status.label)}</span></div>${actions}</article>`;
}

function activityItem(item, model) {
  const status = statusPresentation(item.status);
  return `<div class="activity-item" data-dashboard-activity><div><strong>${escapeHtml(item.clientName || 'Client')}</strong><span>${escapeHtml(timeOnly(item.endsAt))} · ${escapeHtml(practitionerNames(item, model.calendar))}</span></div><span class="status-pill${status.className}">${escapeHtml(status.label)}</span></div>`;
}

function communicationItem(item) {
  return `<div class="communication-item" data-dashboard-communication-attention><div><strong>${escapeHtml(item.client?.name || 'Client')}</strong><span>Client notification needs attention · appointment #${escapeHtml(item.appointment?.id || '')}</span></div><a class="button" href="/calendar/messages?view=attention">Review</a></div>`;
}

function scheduleBody(model) {
  if (model.mode !== 'owner_overview') {
    return `<div class="schedule">${model.appointments.map(item => appointmentItem(item, model)).join('') || '<div class="empty">You have no canonical appointments scheduled for this operational day.</div>'}</div>`;
  }
  return `<div class="team-groups">${model.teamGroups.map(group => `<section class="team-group" data-dashboard-team-group="${escapeHtml(group.key)}"><header class="team-head"><h3>${escapeHtml(group.label)}</h3><span class="summary-pill">${group.appointments.length}</span></header>${group.appointments.map(item => appointmentItem(item, model)).join('')}</section>`).join('') || '<div class="empty">No canonical appointments are scheduled across the team for this operational day.</div>'}</div>`;
}

function dashboardClientScript() {
  return `(function(){'use strict';var AUTH='/calendar/staff-auth';var API='/calendar/workspace';function one(s,r){return(r||document).querySelector(s);}function all(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}async function json(r){try{return await r.json();}catch(_e){return{};}}function status(message,tone){var target=one('[data-dashboard-operation-status]');if(!target)return;target.textContent=String(message||'');target.dataset.tone=tone||'ready';}async function csrf(){var r=await fetch(AUTH+'/csrf',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json'},body:'{}'});var b=await json(r);if(!r.ok||!b.csrfToken)throw new Error('Your secure Shiloh session has expired.');return b.csrfToken;}document.addEventListener('click',async function(event){var button=event.target.closest('[data-dashboard-finalize]');if(!button)return;var card=button.closest('[data-dashboard-appointment]');if(!card)return;var outcome=button.dataset.dashboardFinalize;var label=outcome==='no_show'?'No-show':'Completed';if(!window.confirm('Record this visit as '+label+'? This writes the canonical appointment outcome.'))return;all('button',card).forEach(function(item){item.disabled=true;});status('Revalidating current authority and appointment state…','working');try{var token=await csrf();var response=await fetch(API+'/appointments/'+encodeURIComponent(card.dataset.dashboardAppointment)+'/finalize',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json','x-shiloh-csrf-token':token},body:JSON.stringify({expectedRevision:card.dataset.revision,outcome:outcome})});token='';var body=await json(response);if(!response.ok)throw new Error(body.error||'The visit outcome was not recorded.');status('Visit outcome recorded. Refreshing today’s canonical view…','ready');window.setTimeout(function(){window.location.reload();},500);}catch(error){status(error.message||'Nothing was changed. Refresh and retry.','error');all('button',card).forEach(function(item){item.disabled=false;});}});})();`;
}

function renderDashboardPage(model, {
  staffAccessScriptPath = '/calendar/staff/client.js',
  dashboardScriptPath = '/calendar/workspace/client.js',
  navigation = {},
} = {}) {
  const nextOperationalDay = model.requestedDateKey !== model.operationalDateKey;
  const isOwner = model.mode === 'owner_overview';
  const heading = isOwner ? 'Today across the team' : 'My day';
  const closures = (model.closures || []).map(item => `<div class="closure">Closed · ${escapeHtml(item.reason || 'Clinic closure')}</div>`).join('');
  const attentionCount = (model.awaitingFinalization || []).length;
  const actionableCount = (model.awaitingFinalization || []).filter(item => item.canFinalize).length;
  const attention = attentionCount
    ? `<div class="attention-summary"><strong>${attentionCount} ${attentionCount === 1 ? 'visit is' : 'visits are'} awaiting practitioner finalization.</strong><br>${isOwner ? 'Assigned practitioners can finalize their visits; authorized owner backup actions are available on the relevant cards.' : actionableCount === attentionCount ? 'Record Completed or No-show on the relevant visit card.' : `${actionableCount} can be finalized here; shared visits remain with their canonical certification authority.`}</div>`
    : '<div class="empty">No past visit currently needs an attendance outcome.</div>';
  const activity = (model.recentActivity || []).map(item => activityItem(item, model)).join('') || '<div class="empty">No completed or no-show visits are recorded today yet.</div>';
  let communications = '<div class="empty">No client-notification issue is currently available in this access.</div>';
  if (model.communicationsUnavailable || model.communications?.attentionUnavailable) communications = '<div class="empty">Client-notification evidence is temporarily unavailable. No delivery claim is being made.</div>';
  else if (model.communications) communications = (model.communications.attention || []).slice(0, 3).map(communicationItem).join('') || '<div class="empty">No client notification currently needs attention.</div>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard — Shiloh Workspace</title><style>${workspaceShellStyles()}${styles()}</style><script src="${escapeHtml(staffAccessScriptPath)}" defer></script><script src="${escapeHtml(dashboardScriptPath)}" defer></script></head><body data-workspace-dashboard="true" data-dashboard-mode="${escapeHtml(model.mode)}"><div class="workspace-frame">${renderWorkspaceNavigation({ active: 'dashboard', dashboardHref: '/calendar/workspace', calendarHref: '/calendar/read-only', ...navigation })}<div class="workspace-main"><main class="shell"><header class="topbar"><div class="brand"><h1>Welcome, ${escapeHtml(model.displayName)}</h1><p>${isOwner ? 'A current, clinic-wide operational view of today.' : 'Your clients and operational actions for today.'}</p></div><div class="topbar-side"><span class="truth-note">Africa/Johannesburg · canonical Calendar authority</span><button type="button" class="signout-button" data-shiloh-logout>Sign out</button></div></header><div class="layout"><section class="panel hero-panel" data-dashboard-today><header class="panel-head"><div><span class="eyebrow">${nextOperationalDay ? 'Next operational day' : 'Today'}</span><h2>${heading} · ${escapeHtml(model.operationalDateKey)}</h2><div class="day-summary"><span class="summary-pill">${model.appointments.length} ${model.appointments.length === 1 ? 'client' : 'clients'}</span>${attentionCount ? `<span class="summary-pill attention">${attentionCount} awaiting outcome</span>` : ''}</div></div><a class="button" href="${calendarHref(model)}">Open Calendar</a></header>${closures}${scheduleBody(model)}<p class="operation-status" data-dashboard-operation-status aria-live="polite"></p></section><div class="stack"><section class="panel" data-dashboard-attention-panel><header class="panel-head"><div><span class="eyebrow">Operational action</span><h2>Needs attention</h2></div></header>${attention}</section><section class="panel" data-dashboard-activity-panel><header class="panel-head"><div><span class="eyebrow">Appointment outcomes</span><h2>Recent activity</h2></div></header><div class="activity-list">${activity}</div></section><section class="panel" data-dashboard-communications-panel><header class="panel-head"><div><span class="eyebrow">Communication</span><h2>Client notifications</h2></div>${model.communications ? '<a class="button" href="/calendar/messages?view=attention">Messages</a>' : ''}</header><div class="communication-list">${communications}</div></section></div></div></main></div></div></body></html>`;
}

function renderDashboardUnavailablePage({ message = 'Dashboard is unavailable.' } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard unavailable — Shiloh Workspace</title><style>${workspaceShellStyles()}${styles()}</style></head><body><div class="workspace-frame">${renderWorkspaceNavigation({ active: 'dashboard' })}<div class="workspace-main"><main class="shell"><section class="panel"><span class="eyebrow">Fail closed</span><h2>Dashboard unavailable</h2><p>${escapeHtml(message)}</p></section></main></div></div></body></html>`;
}

module.exports = {
  timeOnly,
  practitionerNames,
  statusPresentation,
  dashboardClientScript,
  renderDashboardPage,
  renderDashboardUnavailablePage,
};
