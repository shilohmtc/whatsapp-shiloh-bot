const {
  escapeHtml,
  workspaceShellStyles,
  renderWorkspaceNavigation,
} = require('./workspaceShell');
const { formatDateTime } = require('./workspaceClientNotificationsUx');

function styles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#66776f;--paper:#f4f3ed;--panel:#fffdf9;--line:#dce3dd;--leaf:#3f6653;--leaf-deep:#294c3c;--leaf-soft:#e7eee9;--warn:#8a623d;--warn-soft:#f5eee5}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:1080px;margin:0 auto;padding:22px}.topbar{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:14px}.topbar h1{margin:0;font-size:1.5rem}.topbar p,.truth{margin:5px 0 0;color:var(--muted);font-size:.78rem}.button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border:1px solid var(--line);border-radius:999px;padding:8px 13px;background:#fff;color:var(--ink);font:inherit;font-size:.78rem;font-weight:800;text-decoration:none}.button.primary{background:var(--leaf-deep);border-color:var(--leaf-deep);color:#fff}.button[disabled]{opacity:.55}.list{display:grid;gap:10px}.item{background:var(--panel);border:1px solid var(--line);border-radius:15px;padding:15px}.item-head,.item-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.item h2{font-size:1rem;margin:0}.details{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.details div{padding:9px;border-radius:9px;background:#fff;border:1px solid var(--line)}.details span{display:block;color:var(--muted);font-size:.68rem;margin-bottom:3px}.status{display:inline-flex;border-radius:999px;padding:5px 9px;background:var(--warn-soft);color:var(--warn);font-size:.72rem;font-weight:800}.empty{padding:28px;background:var(--panel);border:1px solid var(--line);border-radius:15px;color:var(--muted);text-align:center}.operation-status{min-height:1.2em;color:var(--muted);font-size:.78rem;margin:10px 0}@media(max-width:700px){.shell{padding:12px 10px 28px}.topbar{align-items:start;flex-direction:column}.details{grid-template-columns:1fr}.button{width:100%;min-height:46px}}`;
}

function renderBookingConfirmationExceptionsPage(model, {
  staffAccessScriptPath = '/calendar/staff/client.js',
  actionScriptPath = '/calendar/operations/client.js',
} = {}) {
  const rows = (model.exceptions || []).map(item => {
    const appointment = item.appointment || {};
    const client = item.client || {};
    const confirmation = item.confirmation || {};
    const action = item.canRecover
      ? `<button class="button primary" type="button" data-booking-confirmation-recover data-appointment-id="${escapeHtml(appointment.id)}">${escapeHtml(item.actionLabel)}</button>`
      : `<button class="button" type="button" disabled>${escapeHtml(item.reasonMessage || 'Recovery unavailable')}</button>`;
    const when = confirmation.lastEvidenceAt ? formatDateTime(confirmation.lastEvidenceAt) : 'No attempt recorded';
    return `<article class="item" data-booking-confirmation-exception="${escapeHtml(appointment.id)}"><header class="item-head"><div><h2>${escapeHtml(client.name)} · Appointment #${escapeHtml(appointment.id)}</h2><p class="truth">WhatsApp ending ${escapeHtml(client.mobileLast4 || '—')}</p></div><span class="status">${escapeHtml(confirmation.statusLabel)}</span></header><div class="details"><div><span>Appointment</span><strong>${escapeHtml(formatDateTime(appointment.startsAt))}</strong></div><div><span>Treatment</span><strong>${escapeHtml(appointment.serviceName)}</strong></div><div><span>Last evidence</span><strong>${escapeHtml(when)}</strong></div></div><div class="item-actions"><a class="button" href="/calendar/read-only?view=day&date=${escapeHtml(String(appointment.startsAt || '').slice(0, 10))}">Open Calendar</a>${action}</div></article>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Booking confirmation exceptions — Shiloh Workspace</title><style>${workspaceShellStyles()}${styles()}</style><script src="${escapeHtml(staffAccessScriptPath)}" defer></script><script src="${escapeHtml(actionScriptPath)}" defer></script></head><body data-booking-confirmation-exceptions="true"><div class="workspace-frame">${renderWorkspaceNavigation({ active: 'calendar', clientsHref: '/calendar/clients' })}<div class="workspace-main"><main class="shell"><header class="topbar"><div><h1>Booking confirmation exceptions</h1><p>Recent Workspace bookings with missing, delayed, failed or uncertain confirmation evidence.</p></div><a class="button" href="/calendar/read-only">← Calendar</a></header><p class="operation-status" role="status" aria-live="polite" data-calendar-operation-status>Every recovery revalidates client:notify, appointment, recipient and provider evidence.</p><section class="list">${rows || '<div class="empty">No recent booking-confirmation exceptions need attention.</div>'}</section></main></div></div></body></html>`;
}

module.exports = { renderBookingConfirmationExceptionsPage };
