const { escapeHtml, workspaceShellStyles, renderWorkspaceNavigation } = require('./workspaceShell');

function styles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#66776f;--paper:#f4f3ed;--panel:#fffdf9;--line:#dce3dd;--leaf:#3f6653;--leaf-deep:#294c3c;--leaf-soft:#e7eee9;--warn:#8a623d;--warn-soft:#f5eee5;--danger:#8b453f;--danger-soft:#f7e9e6}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:1320px;margin:0 auto;padding:20px}.topbar{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:14px}.topbar-side{display:grid;justify-items:end;gap:7px}.brand h1{margin:0;font-size:clamp(1.45rem,2vw,1.85rem);letter-spacing:-.025em}.brand p,.truth-note{margin:5px 0 0;color:var(--muted);font-size:.78rem;line-height:1.45}.signout-button,.button,.action-button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:#fff;color:var(--ink);font:inherit;font-size:.74rem;font-weight:800;cursor:pointer;text-decoration:none}.layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.65fr);gap:12px}.stack{display:grid;gap:12px;align-content:start}.panel{min-width:0;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:15px}.hero-panel{box-shadow:0 8px 28px rgba(32,50,43,.055)}.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:11px}.eyebrow{font-size:.64rem;text-transform:uppercase;letter-spacing:.11em;font-weight:850;color:var(--muted)}.panel h2,.team-head h3{margin:3px 0 0;font-size:1.08rem}.day-summary{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.summary-pill,.status-pill{display:inline-flex;border-radius:999px;padding:5px 8px;background:var(--leaf-soft);color:var(--leaf-deep);font-size:.65rem;font-weight:850}.summary-pill.attention,.status-pill.pending{background:var(--warn-soft);color:var(--warn)}.status-pill.no-show{background:var(--danger-soft);color:var(--danger)}.schedule{display:grid;gap:8px}.team-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.team-group{min-width:0;border:1px solid var(--line);border-radius:13px;padding:10px;background:#fafbf8}.team-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.team-head h3{font-size:.86rem}.appointment,.booking-request{min-width:0;border:1px solid var(--line);border-radius:11px;padding:10px;background:#fff}.appointment+.appointment,.booking-request+.booking-request{margin-top:7px}.appointment-main{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:9px;align-items:start}.appointment-time{font-size:.72rem;font-weight:900;color:var(--leaf-deep);padding-top:2px}.appointment-copy{min-width:0}.appointment-copy strong,.appointment-copy span{display:block;overflow-wrap:anywhere}.appointment-copy span{margin-top:3px;color:var(--muted);font-size:.69rem;line-height:1.35}.appointment-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;margin-top:8px}.request-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px}.action-button{min-height:36px;border-radius:8px;padding:6px 10px}.action-button.complete{border-color:var(--leaf);color:var(--leaf-deep);background:var(--leaf-soft)}.action-button.no-show,.action-button.cannot{color:var(--danger)}.action-button:disabled{opacity:.5;cursor:wait}.proposal-fields{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:6px;margin-top:8px}.proposal-fields input,.proposal-fields select{min-width:0;min-height:40px;border:1px solid var(--line);border-radius:8px;padding:6px;background:#fff;color:var(--ink)}.request-note{margin:7px 0 0;color:var(--muted);font-size:.69rem;line-height:1.4}.attention-summary{padding:12px;border-radius:11px;background:var(--warn-soft);color:var(--warn);font-size:.75rem;line-height:1.45}.activity-list,.communication-list{display:grid;gap:7px}.activity-item,.communication-item{display:flex;justify-content:space-between;gap:10px;align-items:center;border-top:1px solid var(--line);padding-top:8px;font-size:.72rem}.activity-item:first-child,.communication-item:first-child{border-top:0;padding-top:0}.activity-item strong,.communication-item strong{display:block}.activity-item span,.communication-item span{color:var(--muted);font-size:.67rem}.empty{padding:22px 13px;border:1px dashed var(--line);border-radius:11px;color:var(--muted);font-size:.76rem;line-height:1.5;text-align:center}.closure{padding:10px 11px;margin-bottom:9px;border-radius:11px;background:var(--warn-soft);color:var(--warn);font-size:.74rem;font-weight:800}.operation-status{min-height:18px;margin:8px 0 0;color:var(--muted);font-size:.7rem}.operation-status[data-tone="error"]{color:var(--danger)}@media(max-width:850px){.layout,.team-groups{grid-template-columns:1fr}.shell{padding:13px 11px 28px}.topbar{align-items:start;flex-direction:column;padding-left:52px;min-height:44px}.topbar-side{justify-items:start}.panel{padding:13px;border-radius:14px}.hero-panel{order:-1}.button,.signout-button,.action-button{min-height:44px}.appointment-main{grid-template-columns:58px minmax(0,1fr)}.appointment-main>.status-pill{grid-column:2;justify-self:start}.appointment-actions{display:grid;grid-template-columns:1fr 1fr}.appointment-actions .button{grid-column:1/-1}.request-actions,.proposal-fields{display:grid;grid-template-columns:1fr}.team-group{padding:9px}.brand p{max-width:34rem}}`;
}

function timeOnly(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unknown';
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function dateTimeLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unknown';
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg', weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

function practitionerNames(appointment, calendar) {
  const names = new Map((calendar.timeline?.staff || []).map((person) => [Number(person.id), person.displayName]));
  for (const person of appointment.staff || []) {
    const id = Number(person.staffId || person.staff_id);
    if (Number.isSafeInteger(id) && !names.has(id) && person.nameSnapshot) names.set(id, person.nameSnapshot);
  }
  return (
    (appointment.staffIds || [])
      .map((id) => names.get(Number(id)))
      .filter(Boolean)
      .join(' + ') || 'Shiloh practitioner'
  );
}

function statusPresentation(status) {
  const value = String(status || '')
    .trim()
    .toLowerCase();
  if (value === 'completed') return { label: 'Completed', className: '' };
  if (value === 'no_show') return { label: 'No-show', className: ' no-show' };
  if (value === 'cancelled') return { label: 'Cancelled', className: ' no-show' };
  return {
    label: value ? value.replace(/_/g, ' ') : 'Scheduled',
    className: ' pending',
  };
}

function calendarHref(model, dateKey = model.operationalDateKey) {
  return `/calendar/read-only?view=day&amp;date=${escapeHtml(dateKey)}${['owner_overview', 'business_overview'].includes(model.mode) ? '&amp;staff=all' : ''}`;
}

function appointmentItem(item, model) {
  const status = statusPresentation(item.status);
  const itemDateKey = item.operationalDateKey || model.operationalDateKey;
  const carryOver = itemDateKey !== model.operationalDateKey;
  const actions = item.canFinalize ? `<div class="appointment-actions" data-dashboard-finalization-actions><button type="button" class="action-button complete" data-dashboard-finalize="completed">Completed</button><button type="button" class="action-button no-show" data-dashboard-finalize="no_show">No-show</button><a class="button" href="${calendarHref(model, itemDateKey)}">Open / manage</a></div>` : `<div class="appointment-actions"><a class="button" href="${calendarHref(model, itemDateKey)}">Open / manage</a></div>`;
  const detail = `${carryOver ? `${itemDateKey} · ` : ''}${item.serviceName || 'Shiloh appointment'} · ${practitionerNames(item, model.calendar)}`;
  return `<article class="appointment" id="dashboard-appointment-${escapeHtml(item.id)}" data-dashboard-appointment="${escapeHtml(item.id)}" data-revision="${escapeHtml(item.revision || '')}" data-operational-date-key="${escapeHtml(itemDateKey)}"><div class="appointment-main"><span class="appointment-time">${escapeHtml(timeOnly(item.startsAt))}</span><div class="appointment-copy"><strong>${escapeHtml(item.clientName || 'Client')}</strong><span>${escapeHtml(detail)}</span></div><span class="status-pill${status.className}">${escapeHtml(status.label)}</span></div>${actions}</article>`;
}

function activityItem(item, model) {
  const status = statusPresentation(item.status);
  return `<div class="activity-item" data-dashboard-activity><div><strong>${escapeHtml(item.clientName || 'Client')}</strong><span>${escapeHtml(timeOnly(item.endsAt))} · ${escapeHtml(practitionerNames(item, model.calendar))}</span></div><span class="status-pill${status.className}">${escapeHtml(status.label)}</span></div>`;
}

function communicationItem(item) {
  return `<div class="communication-item" data-dashboard-communication-attention><div><strong>${escapeHtml(item.client?.name || 'Client')}</strong><span>Client notification needs attention · appointment #${escapeHtml(item.appointment?.id || '')}</span></div><a class="button" href="/calendar/messages?view=attention">Review</a></div>`;
}

function bookingRequestItem(item, model) {
  const awaiting = item.effectiveStatus === 'awaiting_client_confirmation';
  const status = awaiting ? 'Awaiting client' : 'Needs staff resolution';
  const staffPicker = ['owner_overview', 'business_overview'].includes(model.mode)
    ? `<select aria-label="Alternative practitioner" data-proposal-staff><option value="">Current practitioner</option>${(model.calendar.timeline?.staff || []).map(person => `<option value="${escapeHtml(person.id)}"${Number(person.id) === Number(item.proposedStaffId || 0) ? ' selected' : ''}>${escapeHtml(person.displayName)}</option>`).join('')}</select>`
    : '';
  const proposal = awaiting ? `<p class="request-note">Proposed ${escapeHtml(dateTimeLabel(item.proposedStartsAt))} with ${escapeHtml(item.proposedStaffName || item.staffName)}. The client must accept before confirmation.</p>` : '';
  return `<article class="booking-request" id="booking-request-${escapeHtml(item.appointmentId)}" data-booking-request="${escapeHtml(item.appointmentId)}" data-requested-revision="${escapeHtml(item.requestedRevision || '')}"><div class="appointment-main"><span class="appointment-time">${escapeHtml(dateTimeLabel(item.requestedStartsAt))}</span><div class="appointment-copy"><strong>${escapeHtml(item.clientName)}</strong><span>${escapeHtml(item.serviceName)} · ${escapeHtml(item.staffName)}</span></div><span class="status-pill pending">${escapeHtml(status)}</span></div>${proposal}<div class="request-actions"><button class="action-button complete" type="button" data-booking-action="accept"${awaiting ? ' disabled' : ''}>Accept requested appointment</button><button class="action-button cannot" type="button" data-booking-action="cannot_accommodate">Cannot accommodate</button></div><div class="proposal-fields"><input type="datetime-local" aria-label="Alternative date and time" data-proposal-start>${staffPicker}<button class="action-button" type="button" data-booking-action="propose">Propose alternative</button></div></article>`;
}

function scheduleBody(model) {
  if (!['owner_overview', 'business_overview'].includes(model.mode)) {
    return `<div class="schedule">${model.appointments.map((item) => appointmentItem(item, model)).join('') || '<div class="empty">You have no appointments today.</div>'}</div>`;
  }
  return `<div class="team-groups">${model.teamGroups.map((group) => `<section class="team-group" data-dashboard-team-group="${escapeHtml(group.key)}"><header class="team-head"><h3>${escapeHtml(group.label)}</h3><span class="summary-pill">${group.appointments.length}</span></header>${group.appointments.map((item) => appointmentItem(item, model)).join('')}</section>`).join('') || '<div class="empty">No appointments are scheduled across the team today.</div>'}</div>`;
}

function carryOverBody(model) {
  const carryOver = model.carryOver || [];
  if (!carryOver.length) return '<div class="empty">No unfinished past visits are waiting for an outcome.</div>';
  const groups = new Map();
  for (const item of carryOver) {
    const dateKey = item.operationalDateKey || 'Date unknown';
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey).push(item);
  }
  return `<div class="schedule">${[...groups.entries()].map(([dateKey, items]) => `<section class="team-group" data-dashboard-carryover-day="${escapeHtml(dateKey)}"><header class="team-head"><h3>${escapeHtml(dateKey)}</h3><span class="summary-pill attention">${items.length}</span></header>${items.map(item => appointmentItem(item, model)).join('')}</section>`).join('')}</div>`;
}

function dashboardClientScript() {
  return `(function(){'use strict';var AUTH='/calendar/staff-auth';var API='/calendar/workspace';function one(s,r){return(r||document).querySelector(s);}function all(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}async function json(r){try{return await r.json();}catch(_e){return{};}}function status(message,tone){var target=one('[data-dashboard-operation-status]');if(!target)return;target.textContent=String(message||'');target.dataset.tone=tone||'ready';}async function csrf(){var r=await fetch(AUTH+'/csrf',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json'},body:'{}'});var b=await json(r);if(!r.ok||!b.csrfToken)throw new Error('Your secure Shiloh session has expired.');return b.csrfToken;}async function post(path,payload){var token=await csrf();var response=await fetch(API+path,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json','x-shiloh-csrf-token':token},body:JSON.stringify(payload||{})});token='';var body=await json(response);if(!response.ok)throw new Error(body.error||'Nothing was changed.');return body;}document.addEventListener('click',async function(event){var bookingButton=event.target.closest('[data-booking-action]');if(bookingButton){var request=bookingButton.closest('[data-booking-request]');if(!request)return;var action=bookingButton.dataset.bookingAction;var payload={expectedRevision:request.dataset.requestedRevision};if(action==='propose'){var input=one('[data-proposal-start]',request);if(!input||!input.value){status('Choose the alternative date and time first.','error');return;}payload.startsAt=new Date(input.value).toISOString();var staff=one('[data-proposal-staff]',request);if(staff&&staff.value)payload.staffId=Number(staff.value);}if(action==='cannot_accommodate'&&!window.confirm('Cannot accommodate this request? The held appointment will be cancelled.'))return;all('button,input,select',request).forEach(function(item){item.disabled=true;});status('Revalidating canonical availability…','working');try{await post('/booking-requests/'+encodeURIComponent(request.dataset.bookingRequest)+'/'+encodeURIComponent(action),payload);status(action==='propose'?'Alternative sent to the client.':'Booking request resolved.','ready');window.setTimeout(function(){window.location.reload();},500);}catch(error){status(error.message||'No booking-request change was made.','error');all('button,input,select',request).forEach(function(item){item.disabled=false;});}return;}var button=event.target.closest('[data-dashboard-finalize]');if(!button)return;var card=button.closest('[data-dashboard-appointment]');if(!card)return;var outcome=button.dataset.dashboardFinalize;var label=outcome==='no_show'?'No-show':'Completed';if(!window.confirm('Record this visit as '+label+'? This updates the appointment outcome.'))return;all('button',card).forEach(function(item){item.disabled=true;});status('Checking the latest appointment details…','working');try{await post('/appointments/'+encodeURIComponent(card.dataset.dashboardAppointment)+'/finalize',{expectedRevision:card.dataset.revision,outcome:outcome,operationalDateKey:card.dataset.operationalDateKey});status('Visit outcome recorded. Refreshing Dashboard…','ready');window.setTimeout(function(){window.location.reload();},500);}catch(error){status(error.message||'Nothing was changed. Refresh and retry.','error');all('button',card).forEach(function(item){item.disabled=false;});}});})();`;
}

function renderDashboardPage(model, { staffAccessScriptPath = '/calendar/staff/client.js', dashboardScriptPath = '/calendar/workspace/client.js', navigation = {} } = {}) {
  const nextOperationalDay = model.requestedDateKey !== model.operationalDateKey;
  const isBusinessOverview = ['owner_overview', 'business_overview'].includes(model.mode);
  const heading = isBusinessOverview ? 'Today across the team' : 'My day';
  const closures = (model.closures || []).map((item) => `<div class="closure">Closed · ${escapeHtml(item.reason || 'Clinic closure')}</div>`).join('');
  const bookingRequests = model.bookingRequests || [];
  const attentionCount = (model.awaitingFinalization || []).length + bookingRequests.length;
  const actionableCount = (model.awaitingFinalization || []).filter((item) => item.canFinalize).length;
  const requestCards = bookingRequests.map(item => bookingRequestItem(item, model)).join('');
  const finalizationCount = (model.awaitingFinalization || []).length;
  const finalizationSummary = finalizationCount ? `<div class="attention-summary"><strong>${finalizationCount} ${finalizationCount === 1 ? 'visit is' : 'visits are'} awaiting practitioner finalization.</strong><br>${model.canFinalizeAllBusiness ? 'Authorized all-business backup actions are available on the relevant cards.' : isBusinessOverview ? 'Assigned practitioners finalize their own visits.' : actionableCount === finalizationCount ? 'Record Completed or No-show on the relevant visit card.' : `${actionableCount} can be finalized here; shared visits must be completed by their assigned practitioner.`}</div>` : '';
  const attention = requestCards || finalizationSummary ? `${requestCards}${finalizationSummary}` : '<div class="empty">No booking request or past visit currently needs staff action.</div>';
  const carryOver = model.carryOver || [];
  const activity = (model.recentActivity || []).map((item) => activityItem(item, model)).join('') || '<div class="empty">No completed or no-show visits are recorded today yet.</div>';
  let communications = '<div class="empty">No client-notification issue is currently available in this access.</div>';
  if (model.communicationsUnavailable || model.communications?.attentionUnavailable) communications = '<div class="empty">Client-notification evidence is temporarily unavailable. No delivery claim is being made.</div>';
  else if (model.communications) communications = (model.communications.attention || []).slice(0, 3).map(communicationItem).join('') || '<div class="empty">No client notification currently needs attention.</div>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard — Shiloh Workspace</title><style>${workspaceShellStyles()}${styles()}</style><script src="${escapeHtml(staffAccessScriptPath)}" defer></script><script src="${escapeHtml(dashboardScriptPath)}" defer></script></head><body data-workspace-dashboard="true" data-dashboard-mode="${escapeHtml(model.mode)}"><div class="workspace-frame">${renderWorkspaceNavigation({ active: 'dashboard', displayName: model.displayName, dashboardHref: '/calendar/workspace', calendarHref: '/calendar/read-only', ...navigation })}<div class="workspace-main"><main class="shell"><header class="topbar"><div class="brand"><h1>Welcome, ${escapeHtml(model.displayName)}</h1><p>${isBusinessOverview ? "Today's appointments and clinic activity." : 'Your clients and appointments for today.'}</p></div></header><div class="layout"><section class="panel hero-panel" data-dashboard-today><header class="panel-head"><div><span class="eyebrow">${nextOperationalDay ? 'Next operational day' : 'Today'}</span><h2>${heading} · ${escapeHtml(model.operationalDateKey)}</h2><div class="day-summary"><span class="summary-pill">${model.appointments.length} ${model.appointments.length === 1 ? 'client' : 'clients'}</span>${attentionCount ? `<span class="summary-pill attention">${attentionCount} awaiting outcome</span>` : ''}</div></div><a class="button" href="${calendarHref(model)}">Open Calendar</a></header>${closures}${scheduleBody(model)}<p class="operation-status" data-dashboard-operation-status aria-live="polite"></p></section><div class="stack"><section class="panel" data-dashboard-carryover-panel><header class="panel-head"><div><span class="eyebrow">Carry-over</span><h2>Unfinished to do</h2><p class="truth-note">Past visits stay here until they are recorded as Completed or No-show.</p></div>${carryOver.length ? `<span class="summary-pill attention">${carryOver.length}</span>` : ''}</header>${carryOverBody(model)}</section><section class="panel" data-dashboard-attention-panel><header class="panel-head"><div><span class="eyebrow">Operational action</span><h2>Needs attention</h2></div></header>${attention}</section><section class="panel" data-dashboard-activity-panel><header class="panel-head"><div><span class="eyebrow">Appointment outcomes</span><h2>Recent activity</h2></div></header><div class="activity-list">${activity}</div></section><section class="panel" data-dashboard-communications-panel><header class="panel-head"><div><span class="eyebrow">Communication</span><h2>Client notifications</h2></div>${model.communications ? '<a class="button" href="/calendar/messages?view=attention">Messages</a>' : ''}</header><div class="communication-list">${communications}</div></section></div></div></main></div></div></body></html>`;
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