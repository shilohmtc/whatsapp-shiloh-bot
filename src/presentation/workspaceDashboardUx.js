const {
  escapeHtml,
  workspaceShellStyles,
  renderWorkspaceNavigation,
} = require('./workspaceShell');
const { formatDateTime } = require('./workspaceClientNotificationsUx');

function styles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#66776f;--paper:#f4f3ed;--panel:#fffdf9;--line:#dce3dd;--leaf:#3f6653;--leaf-deep:#294c3c;--leaf-soft:#e7eee9;--warn:#8a623d;--warn-soft:#f5eee5}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:1280px;margin:0 auto;padding:22px}.topbar{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:14px}.topbar-side{display:grid;justify-items:end;gap:7px}.brand h1{margin:0;font-size:1.55rem}.brand p,.truth-note{margin:5px 0 0;color:var(--muted);font-size:.8rem;line-height:1.45}.signout-button{min-height:42px;border:1px solid var(--line);border-radius:999px;padding:8px 13px;background:#fff;color:var(--ink);font:inherit;font-size:.76rem;font-weight:800;cursor:pointer}.layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(320px,.75fr);gap:12px}.stack{display:grid;gap:12px;align-content:start}.panel{min-width:0;background:var(--panel);border:1px solid var(--line);border-radius:17px;padding:16px}.panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:11px}.eyebrow{font-size:.67rem;text-transform:uppercase;letter-spacing:.1em;font-weight:850;color:var(--muted)}.panel h2{margin:3px 0 0;font-size:1.12rem}.button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border:1px solid var(--line);border-radius:999px;padding:8px 13px;background:#fff;color:var(--ink);font:inherit;font-size:.76rem;font-weight:800;text-decoration:none}.list{display:grid;gap:8px}.item{display:grid;grid-template-columns:82px minmax(0,1fr) auto;gap:10px;align-items:center;min-width:0;border:1px solid var(--line);border-radius:12px;padding:11px;background:#fff}.item-time{font-size:.74rem;font-weight:850;color:var(--leaf-deep)}.item-copy{min-width:0}.item-copy strong,.item-copy span{display:block;overflow-wrap:anywhere}.item-copy span{margin-top:3px;color:var(--muted);font-size:.7rem;line-height:1.35}.pill{display:inline-flex;max-width:100%;border-radius:999px;padding:5px 8px;background:var(--leaf-soft);color:var(--leaf-deep);font-size:.67rem;font-weight:850;text-align:center}.pill.attention{background:var(--warn-soft);color:var(--warn)}.attention-item,.activity-item{grid-template-columns:minmax(0,1fr) auto}.empty{padding:24px 14px;border:1px dashed var(--line);border-radius:12px;color:var(--muted);font-size:.78rem;line-height:1.5;text-align:center}.closure{padding:10px 11px;margin-bottom:9px;border-radius:11px;background:var(--warn-soft);color:var(--warn);font-size:.76rem;font-weight:800}@media(max-width:800px){.layout{grid-template-columns:1fr}.shell{padding:14px 12px 28px}.topbar{align-items:start;flex-direction:column}.button,.signout-button{min-height:44px}.item{grid-template-columns:66px minmax(0,1fr)}.item>.pill{grid-column:2;justify-self:start}.attention-item,.activity-item{grid-template-columns:minmax(0,1fr) auto}.attention-item>.pill,.activity-item>.pill{grid-column:auto}}`;
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

function appointmentItem(item, calendar) {
  const href = `/calendar/read-only?view=day&amp;date=${escapeHtml(String(item.startsAt || '').slice(0, 10))}`;
  return `<article class="item" data-dashboard-appointment="${escapeHtml(item.id)}"><span class="item-time">${escapeHtml(timeOnly(item.startsAt))}</span><div class="item-copy"><strong>${escapeHtml(item.clientName || 'Client')}</strong><span>${escapeHtml(item.serviceName || 'Shiloh appointment')} · ${escapeHtml(practitionerNames(item, calendar))}</span></div><a class="button" href="${href}">Open</a></article>`;
}

function attentionItem(item) {
  return `<article class="item attention-item" data-dashboard-attention="${escapeHtml(item.appointment?.id)}"><div class="item-copy"><strong>${escapeHtml(item.client?.name || 'Unnamed client')}</strong><span>Appointment #${escapeHtml(item.appointment?.id)} · ${escapeHtml(item.confirmation?.statusLabel || 'Unknown')}</span></div><a class="button" href="/calendar/messages?view=attention">Review</a></article>`;
}

function activityItem(item) {
  return `<article class="item activity-item" data-dashboard-activity><div class="item-copy"><strong>${escapeHtml(item.clientName || 'Unnamed client')}</strong><span>${escapeHtml(item.label || 'Shiloh notification')} · ${escapeHtml(formatDateTime(item.occurredAt))}</span></div><span class="pill${['failed', 'uncertain', 'unknown'].includes(item.status) ? ' attention' : ''}">${escapeHtml(item.statusLabel || 'Unknown')}</span></article>`;
}

function renderDashboardPage(model, {
  staffAccessScriptPath = '/calendar/staff/client.js',
  navigation = {},
} = {}) {
  const communications = model.communications;
  const nextOperationalDay = model.requestedDateKey !== model.operationalDateKey;
  const appointments = (model.appointments || []).map(item => appointmentItem(item, model.calendar)).join('');
  const attentionBody = model.communicationsUnavailable
    ? '<div class="empty">Communication attention is temporarily unavailable. No delivery claim is being made.</div>'
    : !communications
      ? '<div class="empty">Communication attention is outside this access. Calendar operations remain available.</div>'
      : communications.attentionUnavailable
        ? '<div class="empty">Communication attention is temporarily unavailable. No recovery claim is being made.</div>'
        : (communications.attention || []).slice(0, 4).map(attentionItem).join('') || '<div class="empty">Nothing currently needs communication recovery.</div>';
  const activityBody = model.communicationsUnavailable
    ? '<div class="empty">Communication evidence is temporarily unavailable.</div>'
    : !communications
      ? '<div class="empty">Recent communication activity is outside this access.</div>'
      : communications.activityUnavailable
        ? '<div class="empty">Communication evidence is temporarily unavailable. No delivery claim is being made.</div>'
        : (communications.activity || []).slice(0, 5).map(activityItem).join('') || '<div class="empty">No canonical communication activity is recorded yet.</div>';
  const closures = (model.closures || []).map(item => `<div class="closure">Closed · ${escapeHtml(item.reason || 'Clinic closure')}</div>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard — Shiloh Workspace</title><style>${workspaceShellStyles()}${styles()}</style><script src="${escapeHtml(staffAccessScriptPath)}" defer></script></head><body data-workspace-dashboard="true"><div class="workspace-frame">${renderWorkspaceNavigation({ active: 'dashboard', dashboardHref: '/calendar/workspace', calendarHref: '/calendar/read-only', ...navigation })}<div class="workspace-main"><main class="shell"><header class="topbar"><div class="brand"><h1>Dashboard</h1><p>What is happening ${nextOperationalDay ? 'on the next operational day' : 'today'}, and what genuinely needs attention.</p></div><div class="topbar-side"><span class="truth-note">Africa/Johannesburg · canonical operational projections</span><button type="button" class="signout-button" data-shiloh-logout>Sign out</button></div></header><div class="layout"><section class="panel" data-dashboard-today><header class="panel-head"><div><span class="eyebrow">${nextOperationalDay ? 'Next operational day' : 'Today'}</span><h2>${escapeHtml(model.operationalDateKey)}</h2></div><a class="button" href="/calendar/read-only?view=day&amp;date=${escapeHtml(model.operationalDateKey)}">Open Calendar</a></header>${closures}<div class="list">${appointments || '<div class="empty">No canonical appointments are scheduled for this operational day.</div>'}</div></section><div class="stack"><section class="panel" data-dashboard-attention-panel><header class="panel-head"><div><span class="eyebrow">Action</span><h2>Needs attention</h2></div>${communications ? '<a class="button" href="/calendar/messages?view=attention">Messages</a>' : ''}</header><div class="list">${attentionBody}</div></section><section class="panel" data-dashboard-activity-panel><header class="panel-head"><div><span class="eyebrow">Evidence</span><h2>Recent activity</h2></div>${communications ? '<a class="button" href="/calendar/messages?view=recent">All activity</a>' : ''}</header><div class="list">${activityBody}</div></section></div></div></main></div></div></body></html>`;
}

function renderDashboardUnavailablePage({ message = 'Dashboard is unavailable.' } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard unavailable — Shiloh Workspace</title><style>${workspaceShellStyles()}${styles()}</style></head><body><div class="workspace-frame">${renderWorkspaceNavigation({ active: 'dashboard' })}<div class="workspace-main"><main class="shell"><section class="panel"><span class="eyebrow">Fail closed</span><h2>Dashboard unavailable</h2><p>${escapeHtml(message)}</p></section></main></div></div></body></html>`;
}

module.exports = { timeOnly, practitionerNames, renderDashboardPage, renderDashboardUnavailablePage };
