function workspaceIconClientScript() {
  return `(()=>{'use strict';
const PATHS={
 dashboard:'<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
 calendar:'<path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
 clients:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 messages:'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
 staff:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M19 8v4M21 10h-4"/>',
 services:'<path d="m12 3-1.9 4.1L6 9l4.1 1.9L12 15l1.9-4.1L18 9l-4.1-1.9z"/><path d="m5 15-.9 2.1L2 18l2.1.9L5 21l.9-2.1L8 18l-2.1-.9z"/><path d="m19 13-.9 2.1L16 16l2.1.9L19 19l.9-2.1L22 16l-2.1-.9z"/>',
 reports:'<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V8M17 16V5"/>',
 clinicHours:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 logout:'<path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>',
 lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
};
function svg(path){return '<svg class="workspace-nav-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';}
function label(node){const existing=node.querySelector('.workspace-link-label');return existing?existing.textContent.trim():node.textContent.trim();}
function decorateDestination(node){const key=node.dataset.workspaceDestination;if(!PATHS[key]||node.querySelector('.workspace-nav-icon'))return;const text=label(node);node.innerHTML=svg(PATHS[key])+'<span class="workspace-link-label">'+text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span>';}
function decorateAccount(){const button=document.querySelector('[data-shiloh-logout]');if(!button||button.querySelector('.workspace-nav-icon'))return;const text=button.textContent.trim()||'Sign out';const key=/lock/i.test(text)?'lock':'logout';button.innerHTML=svg(PATHS[key])+'<span class="workspace-link-label">'+text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span>';}
function paint(){document.querySelectorAll('[data-workspace-destination]').forEach(decorateDestination);decorateAccount();}
const style=document.createElement('style');style.dataset.workspaceIconStyles='true';style.textContent='.workspace-nav-icon{width:18px;height:18px;flex:0 0 18px}.workspace-link-label{min-width:0}.workspace-account-signout{gap:8px}.workspace-link{gap:9px}@media(max-width:700px){.workspace-nav-icon{width:17px;height:17px;flex-basis:17px}}';document.head.appendChild(style);paint();
const nav=document.querySelector('[data-workspace-navigation-drawer]');if(nav)new MutationObserver(()=>queueMicrotask(paint)).observe(nav,{childList:true,subtree:true,characterData:true});
})();`;
}

module.exports = { workspaceIconClientScript };
