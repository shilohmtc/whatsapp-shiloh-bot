const {
  escapeHtml,
  workspaceShellStyles,
  renderWorkspaceNavigation,
} = require('./workspaceShell');

function reportStyles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#66776f;--paper:#f4f3ed;--panel:#fffdf9;--line:#dce3dd;--line-strong:#c9d4cc;--leaf:#3f6653;--leaf-deep:#294c3c;--leaf-soft:#e7eee9;--sand:#f1ede2;--danger:#8a4138;--danger-soft:#f5ebe6;--shadow:0 8px 28px rgba(32,50,43,.07)}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:inherit}.shell{max-width:1280px;margin:0 auto;padding:22px}.topbar{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:16px}.brand h1{margin:0;font-size:1.55rem}.brand p{margin:5px 0 0;color:var(--muted);font-size:.9rem}.topbar-side{display:grid;justify-items:end;gap:7px}.truth-note,.access-status{font-size:.74rem;color:var(--muted)}.signout-button,.button,.preset-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;border:1px solid var(--line-strong);border-radius:999px;padding:8px 13px;background:#fff;color:var(--ink);font:inherit;font-size:.8rem;font-weight:750;text-decoration:none}.signout-button{cursor:pointer}.button.primary,.preset-link.active{background:var(--leaf-deep);border-color:var(--leaf-deep);color:#fff}.filter-panel,.panel,.metric-card{background:var(--panel);border:1px solid var(--line);box-shadow:var(--shadow)}.filter-panel{border-radius:17px;padding:13px;margin-bottom:12px}.preset-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:12px}.preset-label,.eyebrow{font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;font-weight:800;color:var(--muted)}.filter-grid{display:grid;grid-template-columns:minmax(150px,.8fr) minmax(150px,.8fr) minmax(190px,1fr) auto;gap:9px;align-items:end}.field{display:grid;gap:5px}.field label{font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;font-weight:800;color:var(--muted)}.field input,.field select{width:100%;min-height:42px;border:1px solid var(--line-strong);border-radius:10px;padding:9px 11px;background:#fff;color:var(--ink);font:inherit}.field input:focus,.field select:focus{outline:2px solid var(--leaf-soft);border-color:var(--leaf)}.scope-note{display:flex;justify-content:space-between;gap:10px;margin-top:10px;color:var(--muted);font-size:.73rem}.metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:12px}.metric-card{border-radius:14px;padding:13px}.metric-card span{display:block;color:var(--muted);font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;font-weight:800}.metric-card strong{display:block;margin-top:5px;font-size:1.35rem;line-height:1}.metric-card small{display:block;margin-top:6px;color:var(--muted);font-size:.69rem;line-height:1.35}.grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,.8fr);gap:12px}.panel{border-radius:17px;padding:16px;margin-bottom:12px;min-width:0}.panel-heading{display:flex;justify-content:space-between;align-items:start;gap:12px;margin-bottom:12px}.panel-heading h2{margin:2px 0 0;font-size:1.08rem}.panel-heading p{margin:4px 0 0;color:var(--muted);font-size:.74rem}.status-strip{display:flex;gap:7px;flex-wrap:wrap}.status-pill{display:inline-flex;gap:6px;align-items:center;border-radius:999px;padding:7px 10px;background:var(--leaf-soft);color:var(--leaf-deep);font-size:.72rem;font-weight:750}.status-pill.cancelled{background:var(--danger-soft);color:var(--danger)}.status-pill strong{font-size:.82rem}.capacity-table{width:100%;border-collapse:separate;border-spacing:0 6px}.capacity-table th{text-align:right;padding:0 9px 4px;color:var(--muted);font-size:.65rem;text-transform:uppercase;letter-spacing:.07em}.capacity-table th:first-child{text-align:left}.capacity-table td{padding:10px 9px;background:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line);text-align:right;font-size:.78rem}.capacity-table td:first-child{text-align:left;border-left:1px solid var(--line);border-radius:10px 0 0 10px}.capacity-table td:last-child{border-right:1px solid var(--line);border-radius:0 10px 10px 0}.person{font-weight:800}.util{display:grid;gap:4px;min-width:92px}.util-track{height:6px;border-radius:999px;background:var(--leaf-soft);overflow:hidden}.util-fill{height:100%;background:var(--leaf-deep);border-radius:999px}.util small{color:var(--muted);font-size:.65rem;text-align:right}.service-list{display:grid;gap:8px}.service-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.service-meta{display:grid;gap:4px}.service-name{font-size:.79rem;font-weight:750}.service-category{font-size:.67rem;color:var(--muted)}.service-bar{height:6px;border-radius:999px;background:var(--leaf-soft);overflow:hidden}.service-bar span{display:block;height:100%;background:var(--leaf-deep);border-radius:999px}.service-count{font-size:.78rem;font-weight:800}.client-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.client-stat{padding:12px;border:1px solid var(--line);border-radius:11px;background:#fff}.client-stat strong{display:block;font-size:1.18rem}.client-stat span{display:block;margin-top:4px;color:var(--muted);font-size:.68rem}.trend-card{padding:14px;border-radius:12px;background:var(--sand)}.trend-number{font-size:1.5rem;font-weight:850}.trend-copy{margin-top:5px;color:var(--muted);font-size:.75rem;line-height:1.45}.empty{padding:30px 14px;text-align:center;border:1px dashed var(--line-strong);border-radius:12px;color:var(--muted);font-size:.78rem}.footer-note{margin:14px 0 0;color:var(--muted);font-size:.72rem;line-height:1.55}@media(max-width:1050px){.metrics{grid-template-columns:repeat(3,1fr)}.grid{grid-template-columns:1fr}.capacity-table{min-width:760px}.table-scroll{overflow-x:auto}}@media(max-width:700px){.shell{padding:12px 10px 28px}.topbar{align-items:start;flex-direction:column}.topbar-side{justify-items:start;width:100%}.signout-button,.button,.preset-link{min-height:44px}.metrics{grid-template-columns:repeat(2,1fr)}.filter-grid{grid-template-columns:1fr}.field input,.field select,.button{min-height:46px}.button{width:100%}.scope-note{flex-direction:column}.panel{padding:13px}.client-grid{grid-template-columns:1fr}.metrics .metric-card:last-child{grid-column:1/-1}.footer-note{text-align:left}}`;
}

function formatMinutes(value) {
  const total = Math.max(0, Math.round(Number(value) || 0));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return `${minutes}m`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatDate(value) {
  const date = new Date(`${String(value)}T12:00:00+02:00`);
  if (Number.isNaN(date.getTime())) return String(value || '');
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function queryForPreset(preset, selectedStaffId) {
  const params = new URLSearchParams({ range: preset });
  if (selectedStaffId) params.set('staff', String(selectedStaffId));
  return `/calendar/reports?${params.toString()}`;
}

function statusLabel(value) {
  return String(value || 'unknown')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function trendSummary(trend) {
  const delta = Number(trend?.delta || 0);
  if (delta === 0) return 'No change from the preceding equal-length period.';
  const direction = delta > 0 ? 'more' : 'fewer';
  return `${Math.abs(delta)} ${direction} operational appointment${Math.abs(delta) === 1 ? '' : 's'} than the preceding equal-length period.`;
}

function renderReportsPage(model, {
  staffAccessScriptPath = '/calendar/staff/client.js',
} = {}) {
  const selectedStaffId = model.selectedStaffId;
  const staffOptions = [];
  if (model.authority?.reportScope === 'all_business') {
    staffOptions.push(`<option value="all"${selectedStaffId == null ? ' selected' : ''}>All permitted practitioners</option>`);
  }
  for (const person of model.permittedStaff || []) {
    const id = Number(person.id);
    staffOptions.push(`<option value="${escapeHtml(id)}"${id === Number(selectedStaffId) ? ' selected' : ''}>${escapeHtml(person.displayName || person.display_name || 'Practitioner')}</option>`);
  }

  const presetLinks = [
    ['7d', '7 days'],
    ['30d', '30 days'],
    ['month', 'This month'],
  ].map(([value, label]) => {
    const active = model.period.preset === value ? ' active' : '';
    return `<a class="preset-link${active}" href="${escapeHtml(queryForPreset(value, selectedStaffId))}">${escapeHtml(label)}</a>`;
  }).join('');

  const statusPills = Object.entries(model.appointments?.statusCounts || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `<span class="status-pill${status === 'cancelled' ? ' cancelled' : ''}"><span>${escapeHtml(statusLabel(status))}</span><strong>${escapeHtml(count)}</strong></span>`)
    .join('');

  const maxService = Math.max(1, ...(model.services || []).map(item => Number(item.appointments || 0)));
  const serviceRows = (model.services || []).map(item => {
    const width = Math.max(4, Math.round((Number(item.appointments || 0) / maxService) * 100));
    return `<div class="service-row"><div class="service-meta"><div class="service-name">${escapeHtml(item.name)}</div>${item.category ? `<div class="service-category">${escapeHtml(item.category)}</div>` : ''}<div class="service-bar" aria-hidden="true"><span style="width:${width}%"></span></div></div><div class="service-count">${escapeHtml(item.appointments)}</div></div>`;
  }).join('');

  const capacityRows = (model.capacity || []).map(row => `<tr>
    <td><span class="person">${escapeHtml(row.name)}</span></td>
    <td>${escapeHtml(formatMinutes(row.scheduledMinutes))}</td>
    <td>${escapeHtml(formatMinutes(row.bookedMinutes))}</td>
    <td>${escapeHtml(formatMinutes(row.blockedMinutes))}</td>
    <td>${escapeHtml(formatMinutes(row.leaveMinutes))}</td>
    <td>${escapeHtml(formatMinutes(row.remainingMinutes))}</td>
    <td><div class="util"><div class="util-track" aria-hidden="true"><div class="util-fill" style="width:${Math.max(0, Math.min(100, Number(row.utilisationPct || 0)))}%"></div></div><small>${escapeHtml(row.utilisationPct)}%</small></div></td>
  </tr>`).join('');

  const scopeText = model.authority?.reportScope === 'own_staff'
    ? 'Scoped to your canonical practitioner authority.'
    : selectedStaffId
      ? 'Scoped to the selected practitioner within your business-wide authority.'
      : 'Business-wide operational scope from your current Shiloh authority.';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reports — Shiloh Workspace</title><style>${workspaceShellStyles()}${reportStyles()}</style><script src="${escapeHtml(staffAccessScriptPath)}" defer></script></head><body data-workspace-reports="true"><div class="workspace-frame">${renderWorkspaceNavigation({
    active: 'reports',
    calendarHref: '/calendar/read-only',
    clientsHref: '/calendar/clients',
    staffHref: '/calendar/team',
    servicesHref: '/calendar/services',
    reportsHref: '/calendar/reports',
  })}<div class="workspace-main"><div class="shell">
    <header class="topbar"><div class="brand"><h1>Reports</h1><p>Appointments and operational capacity from canonical Shiloh data.</p></div><div class="topbar-side"><span class="truth-note">Africa/Johannesburg • Read-only operational truth</span><button class="signout-button" type="button" data-shiloh-logout>Sign out</button><span class="access-status" role="status" aria-live="polite" data-shiloh-calendar-access-status></span></div></header>

    <section class="filter-panel" aria-label="Report filters">
      <div class="preset-row"><span class="preset-label">Quick range</span>${presetLinks}</div>
      <form class="filter-grid" method="get" action="/calendar/reports">
        <div class="field"><label for="report-from">From</label><input id="report-from" name="from" type="date" value="${escapeHtml(model.period.startKey)}" required></div>
        <div class="field"><label for="report-to">To</label><input id="report-to" name="to" type="date" value="${escapeHtml(model.period.endInclusiveKey)}" required></div>
        <div class="field"><label for="report-staff">Practitioner</label><select id="report-staff" name="staff">${staffOptions.join('')}</select></div>
        <button class="button primary" type="submit">Apply report</button>
      </form>
      <div class="scope-note"><span>${escapeHtml(formatDate(model.period.startKey))}–${escapeHtml(formatDate(model.period.endInclusiveKey))} · ${escapeHtml(model.period.dayCount)} day${model.period.dayCount === 1 ? '' : 's'}</span><span>${escapeHtml(scopeText)}</span></div>
    </section>

    <section class="metrics" aria-label="Report summary">
      <article class="metric-card"><span>Operational appointments</span><strong>${escapeHtml(model.appointments?.operational || 0)}</strong><small>Canonical non-cancelled appointments in this period.</small></article>
      <article class="metric-card"><span>Booked time</span><strong>${escapeHtml(formatMinutes(model.totals?.bookedMinutes))}</strong><small>Occupied practitioner time across canonical appointments.</small></article>
      <article class="metric-card"><span>Remaining capacity</span><strong>${escapeHtml(formatMinutes(model.totals?.remainingMinutes))}</strong><small>Estimated after leave, booked time and blocks.</small></article>
      <article class="metric-card"><span>Utilisation</span><strong>${escapeHtml(model.totals?.utilisationPct || 0)}%</strong><small>Booked time ÷ net scheduled practitioner time.</small></article>
      <article class="metric-card"><span>Unique clients</span><strong>${escapeHtml(model.clients?.uniqueClients || 0)}</strong><small>Aggregate canonical clients with non-cancelled appointments.</small></article>
    </section>

    <div class="grid">
      <div>
        <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Capacity</span><h2>Practitioner utilisation</h2><p>Scheduled, occupied and unavailable practitioner time.</p></div><span class="truth-note">${escapeHtml(model.closures || 0)} closure${Number(model.closures || 0) === 1 ? '' : 's'} in range</span></div>
          <div class="table-scroll"><table class="capacity-table"><thead><tr><th>Practitioner</th><th>Scheduled</th><th>Booked</th><th>Blocks</th><th>Leave / unavailable</th><th>Remaining</th><th>Utilisation</th></tr></thead><tbody>${capacityRows || '<tr><td colspan="7">No practitioner capacity is available for this scope.</td></tr>'}</tbody></table></div>
        </section>

        <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Appointments</span><h2>Canonical status outcomes</h2><p>${escapeHtml(model.appointments?.allRecorded || 0)} appointment record${Number(model.appointments?.allRecorded || 0) === 1 ? '' : 's'} including cancellations.</p></div></div><div class="status-strip">${statusPills || '<div class="empty">No appointment outcomes were recorded in this period.</div>'}</div></section>
      </div>

      <div>
        <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Services</span><h2>Service mix</h2><p>Appointments by canonical service snapshot.</p></div></div><div class="service-list">${serviceRows || '<div class="empty">No services were booked in this period.</div>'}</div></section>

        <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Clients</span><h2>Client mix</h2><p>Aggregate identity counts only — no contact details.</p></div></div><div class="client-grid"><div class="client-stat"><strong>${escapeHtml(model.clients?.uniqueClients || 0)}</strong><span>Unique clients</span></div><div class="client-stat"><strong>${escapeHtml(model.clients?.newClients || 0)}</strong><span>New to clinic</span></div><div class="client-stat"><strong>${escapeHtml(model.clients?.returningClients || 0)}</strong><span>Returning</span></div></div></section>

        <section class="panel"><div class="panel-heading"><div><span class="eyebrow">Trend</span><h2>Appointment volume</h2><p>Compared with the immediately preceding ${escapeHtml(model.period.dayCount)}-day period.</p></div></div><div class="trend-card"><div class="trend-number">${Number(model.trend?.delta || 0) > 0 ? '+' : ''}${escapeHtml(model.trend?.delta || 0)}</div><div class="trend-copy">${escapeHtml(trendSummary(model.trend))} Current: ${escapeHtml(model.trend?.currentOperationalAppointments || 0)} · Previous: ${escapeHtml(model.trend?.previousOperationalAppointments || 0)}.</div></div></section>
      </div>
    </div>

    <p class="footer-note">Reports V1 is operational and read-only. Capacity is calculated from canonical Shiloh working windows, closures, schedule exceptions, leave, blocks and appointments. It is not a payment, settlement or financial accounting report. Report windows are limited to 31 days and every request revalidates current staff authority.</p>
  </div></div></div></body></html>`;
}

function renderReportsUnavailablePage({
  code = 'WORKSPACE_REPORTS_UNAVAILABLE',
  message = 'Canonical operational reports are temporarily unavailable.',
} = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reports unavailable — Shiloh Workspace</title><style>${workspaceShellStyles()}${reportStyles()}</style></head><body><div class="workspace-frame">${renderWorkspaceNavigation({ active: 'reports', reportsHref: '/calendar/reports' })}<div class="workspace-main"><div class="shell"><header class="topbar"><div class="brand"><h1>Reports unavailable</h1><p>${escapeHtml(message)}</p></div></header><section class="panel"><span class="eyebrow">Fail closed</span><h2>Operational report data was not shown.</h2><p class="footer-note">Reference: ${escapeHtml(code)}</p><p><a class="button" href="/calendar/read-only">Back to Calendar</a></p></section></div></div></div></body></html>`;
}

module.exports = {
  formatMinutes,
  formatDate,
  queryForPreset,
  statusLabel,
  trendSummary,
  renderReportsPage,
  renderReportsUnavailablePage,
};
