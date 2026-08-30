const {
  escapeHtml,
  workspaceShellStyles,
  renderWorkspaceNavigation,
} = require('./workspaceShell');

function styles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#66776f;--paper:#f4f3ed;--panel:#fffdf9;--line:#dce3dd;--line-strong:#c9d4cc;--leaf:#3f6653;--leaf-deep:#294c3c;--leaf-soft:#e7eee9;--warn:#8a623d;--warn-soft:#f5eee5;--shadow:0 8px 28px rgba(32,50,43,.07)}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:inherit}.shell{max-width:1240px;margin:0 auto;padding:22px}.topbar{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:16px}.brand h1{margin:0;font-size:1.55rem}.brand p{margin:5px 0 0;color:var(--muted);font-size:.9rem}.topbar-side{display:grid;justify-items:end;gap:7px}.truth-note,.access-status,.muted{font-size:.75rem;color:var(--muted)}.signout-button,.button,.pager-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;border:1px solid var(--line-strong);border-radius:999px;padding:8px 13px;background:#fff;color:var(--ink);font:inherit;font-size:.8rem;font-weight:750;text-decoration:none}.signout-button{cursor:pointer}.filter-panel,.panel{background:var(--panel);border:1px solid var(--line);border-radius:17px;box-shadow:var(--shadow)}.filter-panel{padding:13px;margin-bottom:12px}.filter-form{display:grid;grid-template-columns:minmax(220px,1fr) 160px auto;gap:9px;align-items:end}.field{display:grid;gap:5px}.field label,.eyebrow{font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;font-weight:800;color:var(--muted)}.field input,.field select{width:100%;min-height:42px;border:1px solid var(--line-strong);border-radius:10px;padding:9px 11px;background:#fff;color:var(--ink);font:inherit}.button.primary{background:var(--leaf-deep);border-color:var(--leaf-deep);color:#fff}.result-summary{display:flex;justify-content:space-between;gap:14px;align-items:center;margin:0 2px 9px;color:var(--muted);font-size:.78rem}.service-list{display:grid;gap:6px}.service-row{display:grid;grid-template-columns:minmax(210px,1.35fr) minmax(145px,.8fr) 95px 120px 90px 100px 120px 26px;gap:12px;align-items:center;padding:11px 13px;border:1px solid var(--line);border-radius:12px;background:var(--panel);text-decoration:none}.service-row:hover{border-color:var(--leaf);box-shadow:0 4px 16px rgba(32,50,43,.06)}.service-name{font-weight:800}.small{font-size:.76rem;color:var(--muted)}.pill{display:inline-flex;width:max-content;border-radius:999px;padding:5px 8px;background:var(--leaf-soft);color:var(--leaf);font-size:.69rem;font-weight:800;text-transform:capitalize}.pill.inactive,.pill.not-bookable{background:var(--warn-soft);color:var(--warn)}.row-arrow{font-size:1.2rem;color:var(--muted)}.empty{padding:44px 18px;text-align:center;border:1px dashed var(--line-strong);border-radius:14px;background:var(--panel);color:var(--muted)}.pager,.detail-actions{display:flex;justify-content:space-between;gap:10px;margin-top:12px}.detail-actions{justify-content:flex-start;margin:0 0 12px}.panel{padding:17px;margin-bottom:12px}.panel h2{margin:3px 0 12px;font-size:1.15rem}.profile-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.profile-field{padding:11px;border:1px solid var(--line);border-radius:11px;background:#fff}.profile-field span{display:block;color:var(--muted);font-size:.7rem;margin-bottom:4px}.profile-field strong{font-size:.86rem}.content-copy{margin:0;white-space:pre-wrap;line-height:1.55;font-size:.87rem}.staff-list{display:grid;gap:7px}.staff-row{display:grid;grid-template-columns:minmax(180px,1fr) 120px 140px;gap:12px;padding:11px 12px;border:1px solid var(--line);border-radius:11px;background:#fff}.booking-note{padding:12px;border-radius:11px;background:var(--leaf-soft);font-size:.8rem;line-height:1.5}.booking-note.review{background:var(--warn-soft)}.footer-note{margin:14px 0 0;color:var(--muted);font-size:.73rem;line-height:1.5}@media(max-width:1000px){.service-row{grid-template-columns:minmax(180px,1.3fr) minmax(130px,.8fr) 90px 110px 95px 120px 26px}.service-row .assigned{display:none}.profile-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.shell{padding:12px 10px 28px}.topbar{align-items:start;flex-direction:column}.topbar-side{justify-items:start;width:100%}.signout-button{min-height:44px}.filter-form{grid-template-columns:1fr}.field input,.field select,.button{min-height:46px}.button{width:100%}.result-summary{align-items:start;flex-direction:column}.service-row{grid-template-columns:1fr auto;padding:13px}.service-row .small,.service-row .pill{grid-column:1}.service-row .category,.service-row .assigned{display:none}.row-arrow{grid-column:2;grid-row:1/6}.profile-grid{grid-template-columns:1fr}.staff-row{grid-template-columns:1fr}.pager-link{min-height:44px}}`;
}

function label(value) {
  const text = String(value || 'Not configured').replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatPrice(service) {
  const display = String(service?.display_price || '').trim();
  if (display) return display;
  const raw = Number(service?.price);
  if (!Number.isFinite(raw)) return service?.variable_price === true ? 'Variable' : 'Not priced';
  const amount = new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(raw);
  return `${service?.variable_price === true ? 'From ' : ''}R ${amount}`;
}

function durationLabel(service) {
  const total = Number(service?.total_minutes || 0);
  const treatment = Number(service?.duration_minutes || 0);
  if (total > treatment && treatment > 0) return `${treatment} min treatment • ${total} min slot`;
  return total > 0 ? `${total} min` : 'Duration not set';
}

function shellStart({
  title,
  subtitle,
  calendarNavigationAllowed,
  clientsNavigationAllowed,
  staffNavigationAllowed,
  staffAccessScriptPath,
}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} — Shiloh Workspace</title><style>${workspaceShellStyles()}${styles()}</style><script src="${escapeHtml(staffAccessScriptPath)}" defer></script></head><body data-workspace-services="true"><div class="workspace-frame">${renderWorkspaceNavigation({ active: 'services', calendarHref: calendarNavigationAllowed ? '/calendar/read-only' : null, clientsHref: clientsNavigationAllowed ? '/calendar/clients' : null, staffHref: staffNavigationAllowed ? '/calendar/team' : null, servicesHref: '/calendar/services' })}<div class="workspace-main"><div class="shell"><header class="topbar"><div class="brand"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div><div class="topbar-side"><span class="truth-note">Canonical service authority • Read-only</span><button class="signout-button" type="button" data-shiloh-logout>Sign out</button><span class="access-status" role="status" aria-live="polite" data-shiloh-calendar-access-status></span></div></header>`;
}

function listHref({ query = '', status = 'active', offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (status) params.set('status', status);
  if (offset > 0) params.set('offset', String(offset));
  const suffix = params.toString();
  return `/calendar/services${suffix ? `?${suffix}` : ''}`;
}

function renderServicesListPage(model, options = {}) {
  const selectedStatus = model.status || 'all';
  const rows = (model.services || []).map(service => {
    const eligible = service.booking_eligibility?.eligible === true;
    return `<a class="service-row" href="/calendar/services/${escapeHtml(service.id)}"><span class="service-name">${escapeHtml(service.name)}</span><span class="small category">${escapeHtml(service.category_name || 'Uncategorised')}</span><span class="small">${escapeHtml(durationLabel(service))}</span><span class="small">${escapeHtml(formatPrice(service))}</span><span class="pill ${service.status === 'inactive' ? 'inactive' : ''}">${escapeHtml(label(service.status))}</span><span class="small assigned">${Number(service.assigned_staff_count) || 0} assigned</span><span class="pill ${eligible ? '' : 'not-bookable'}">${eligible ? 'Booking ready' : 'Not booking ready'}</span><span class="row-arrow" aria-hidden="true">›</span></a>`;
  }).join('');
  const statusOptions = [['active', 'Active'], ['inactive', 'Inactive'], ['all', 'All']]
    .map(([value, text]) => `<option value="${value}"${selectedStatus === value || (!model.status && value === 'all') ? ' selected' : ''}>${text}</option>`).join('');
  const prev = model.offset > 0 ? `<a class="pager-link" href="${escapeHtml(listHref({ query: model.query, status: selectedStatus, offset: Math.max(0, model.offset - model.pageSize) }))}">Previous</a>` : '<span></span>';
  const next = model.hasMore ? `<a class="pager-link" href="${escapeHtml(listHref({ query: model.query, status: selectedStatus, offset: model.offset + model.pageSize }))}">Next</a>` : '<span></span>';
  return `${shellStart({ title: 'Services', subtitle: 'Canonical offerings, pricing and practitioner relationships.', ...options })}<main data-services-list-view><section class="filter-panel"><form class="filter-form" method="get" action="/calendar/services"><div class="field"><label for="service-search">Search services</label><input id="service-search" name="q" type="search" value="${escapeHtml(model.query || '')}" placeholder="Service name" maxlength="120"></div><div class="field"><label for="service-status">Status</label><select id="service-status" name="status">${statusOptions}</select></div><button class="button primary" type="submit">Search</button></form></section><div class="result-summary"><span>${model.services.length} service${model.services.length === 1 ? '' : 's'} on this page</span><span>Results are bounded to ${model.pageSize}</span></div><section class="service-list" aria-label="Canonical services">${rows || '<div class="empty">No canonical services match this view.</div>'}</section><nav class="pager" aria-label="Service result pages">${prev}${next}</nav></main><p class="footer-note">Services visibility requires the current <strong>services:view</strong> capability. “Booking ready” is a read-only indicator derived from active service + active client-bookable assigned staff; final slot eligibility remains Calendar/booking authority.</p></div></div></div></body></html>`;
}

function renderServiceDetailPage(model, options = {}) {
  const service = model.service;
  const staffRows = (model.assignedStaff || []).map(staff => `<div class="staff-row"><strong>${escapeHtml(staff.display_name)}</strong><span class="pill ${staff.status === 'inactive' ? 'inactive' : ''}">${escapeHtml(label(staff.status))}</span><span class="small">${staff.client_bookable === true ? 'Client bookable' : 'Not client bookable'}</span></div>`).join('');
  const eligibility = model.bookingEligibility || {};
  const content = String(service.customer_description || '').trim();
  const bookingNote = String(service.booking_note || '').trim();
  return `${shellStart({ title: 'Service detail', subtitle: 'Canonical offering and practitioner relationship.', ...options })}<main data-service-detail-view><nav class="detail-actions"><a class="button" href="/calendar/services">← Back to Services</a></nav><section class="panel"><span class="eyebrow">Offering</span><h2>${escapeHtml(service.name)}</h2><div class="profile-grid"><div class="profile-field"><span>Category</span><strong>${escapeHtml(service.category_name || 'Uncategorised')}</strong></div><div class="profile-field"><span>Status</span><strong>${escapeHtml(label(service.status))}</strong></div><div class="profile-field"><span>Duration</span><strong>${escapeHtml(durationLabel(service))}</strong></div><div class="profile-field"><span>Price</span><strong>${escapeHtml(formatPrice(service))}</strong></div></div></section><section class="panel"><span class="eyebrow">Customer-facing content</span><h2>Service information</h2>${content ? `<p class="content-copy">${escapeHtml(content)}</p>` : '<p class="muted">No customer-facing description is configured.</p>'}${bookingNote ? `<p class="content-copy"><strong>Booking note:</strong> ${escapeHtml(bookingNote)}</p>` : ''}</section><section class="panel"><span class="eyebrow">Assigned staff</span><h2>Practitioner relationships</h2><div class="staff-list">${staffRows || '<p class="muted">No canonical staff assignments.</p>'}</div></section><section class="panel"><span class="eyebrow">Booking eligibility</span><h2>Read-only operational indicator</h2><div class="booking-note ${eligibility.eligible ? '' : 'review'}">${eligibility.eligible ? `Booking-ready relationship: this service is active and ${Number(eligibility.clientBookableStaffCount) || 0} assigned staff member${Number(eligibility.clientBookableStaffCount) === 1 ? '' : 's'} are active and client-bookable.` : `Not currently booking-ready: ${service.status !== 'active' ? 'the service is inactive' : 'there is no active client-bookable assigned staff member'}.`} This does not calculate live slots; Calendar/booking authority still decides actual availability.</div></section></main><p class="footer-note">This V1 surface cannot edit service details, pricing, status or staff assignments and does not expose source/provenance identifiers.</p></div></div></div></body></html>`;
}

function renderServicesUnavailablePage({ code = 'WORKSPACE_SERVICES_UNAVAILABLE', message = 'Services is unavailable.' } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Services unavailable — Shiloh Workspace</title><style>${workspaceShellStyles()}${styles()}</style></head><body><div class="shell"><section class="empty"><h1>Services unavailable</h1><p>${escapeHtml(message)}</p><small>Reference: ${escapeHtml(code)}</small></section></div></body></html>`;
}

module.exports = {
  label,
  formatPrice,
  durationLabel,
  renderServicesListPage,
  renderServiceDetailPage,
  renderServicesUnavailablePage,
};
