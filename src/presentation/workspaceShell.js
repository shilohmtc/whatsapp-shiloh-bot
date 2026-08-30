function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function workspaceShellStyles() {
  return `.workspace-frame{display:grid;grid-template-columns:188px minmax(0,1fr);min-height:100vh}.workspace-nav{background:#17382d;color:#f7faf7;padding:24px 16px;display:flex;flex-direction:column;gap:28px}.workspace-mark{display:grid;gap:2px;font-weight:850;letter-spacing:-.02em}.workspace-mark small{color:#b9ccc3;font-size:.68rem;text-transform:uppercase;letter-spacing:.13em}.workspace-links{display:grid;gap:7px}.workspace-link{display:flex;align-items:center;gap:9px;border-radius:10px;padding:10px 11px;color:#d7e4dd;font-size:.86rem;font-weight:750;text-decoration:none}.workspace-link.active{background:#f6faf7;color:#17382d}.workspace-link.future{color:#809f91}.workspace-link:not(.active):not(.future):hover{background:#264b3e;color:#fff}.workspace-main{min-width:0}@media(max-width:900px){.workspace-frame{grid-template-columns:1fr}.workspace-nav{padding:11px 12px;display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:12px}.workspace-links{display:flex}.workspace-link{min-height:44px}.workspace-link.future{display:none}.workspace-mark small{display:none}}`;
}

function workspaceItem({ label, active, href, activationAttribute = '' }) {
  if (active) return `<span class="workspace-link active" aria-current="page">${escapeHtml(label)}</span>`;
  if (href) return `<a class="workspace-link" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
  return `<span class="workspace-link future" aria-disabled="true"${activationAttribute ? ` ${activationAttribute}` : ''}>${escapeHtml(label)}</span>`;
}

function renderWorkspaceNavigation({
  active,
  calendarHref = null,
  clientsHref = null,
  staffHref = null,
  servicesHref = null,
} = {}) {
  const nav = `<aside class="workspace-nav"><div class="workspace-mark">Shiloh <small>Workspace</small></div><nav class="workspace-links" aria-label="Workspace">${[
    workspaceItem({ label: 'Calendar', active: active === 'calendar', href: calendarHref }),
    workspaceItem({ label: 'Clients', active: active === 'clients', href: clientsHref }),
    workspaceItem({ label: 'Staff', active: active === 'staff', href: staffHref, activationAttribute: 'data-workspace-staff-link' }),
    workspaceItem({ label: 'Services', active: active === 'services', href: servicesHref, activationAttribute: 'data-workspace-services-link' }),
  ].join('')}</nav></aside>`;
  return `${nav}<script src="/calendar/team/nav.js" defer></script><script src="/calendar/services/nav.js" defer></script>`;
}

module.exports = { escapeHtml, workspaceShellStyles, renderWorkspaceNavigation };
