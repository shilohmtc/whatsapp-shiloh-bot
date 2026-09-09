const { escapeHtml, workspaceShellStyles, renderWorkspaceNavigation } = require('./workspaceShell');

function styles() {
  return `.setup-shell{max-width:840px;margin:0 auto;padding:24px}.setup-header{margin-bottom:16px}.setup-header h1{margin:0 0 6px;font-size:1.6rem}.setup-header p{margin:0;color:#66776f}.panel{background:#fffdf9;border:1px solid #dce3dd;border-radius:17px;padding:18px;margin-bottom:14px}.panel h2{margin:0 0 10px;font-size:1.1rem}.scope-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.scope{border:1px solid #dce3dd;border-radius:11px;padding:11px;background:#fff}.scope span{display:block;color:#66776f;font-size:.7rem;margin-bottom:3px}.scope strong{font-size:.85rem}.capabilities{display:flex;flex-wrap:wrap;gap:7px}.capability{border:1px solid #dce3dd;border-radius:999px;padding:7px 9px;background:#fff;font-size:.76rem}.notice{padding:11px;border-radius:11px;background:#e7eee9;font-size:.8rem;line-height:1.45}.warning{background:#f5eee5;color:#785332}.field{display:grid;gap:6px;margin:12px 0}.field label{font-size:.76rem;font-weight:750}.field input[type=tel]{min-height:46px;border:1px solid #c9d4cc;border-radius:10px;padding:10px 12px;font:inherit}.check{display:flex;gap:9px;align-items:flex-start;padding:10px;border:1px solid #c9d4cc;border-radius:10px;background:#fff}.button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border:1px solid #294c3c;border-radius:999px;padding:9px 15px;background:#294c3c;color:#fff;font:inherit;font-weight:800;cursor:pointer}.button:disabled{opacity:.55}.status{min-height:20px;margin:10px 0;font-size:.8rem}.status[data-tone=error]{color:#8f433d}.status[data-tone=working]{color:#8a623d}.back{display:inline-block;margin-top:4px;color:#294c3c;font-weight:750;text-decoration:none}@media(max-width:700px){.setup-shell{padding:14px 10px 28px}.scope-grid{grid-template-columns:1fr}.button{width:100%;min-height:46px}}`;
}

function capabilityLabel(key) {
  const labels = {
    'appointment:view': 'View Calendar',
    'appointment:create': 'Create bookings',
    'calendar:booking:reschedule': 'Reschedule bookings',
    'calendar:booking:cancel': 'Cancel bookings',
    'calendar:booking:reassign': 'Reassign bookings',
    'client:lookup': 'View clients',
    'client:manage': 'Manage clients',
    'services:view': 'View services',
    'services:manage': 'Manage services',
    'schedule:manage': 'Manage clinic hours',
    'staff:view': 'View staff',
  };
  return labels[key] || key;
}

function renderReceptionSetupPage(model = {}) {
  const configured = model.configured === true;
  const capabilityMarkup = (model.capabilities || []).map(key => `<span class="capability">${escapeHtml(capabilityLabel(key))}</span>`).join('');
  const body = configured
    ? `<div class="notice"><strong>Reception access is configured.</strong> The shared principal is active and uses the bounded Reception preset. Final real-phone Open Workspace acceptance remains a separate proof.</div>`
    : `<p class="status" role="status" aria-live="polite" data-reception-status></p><form data-reception-setup-form><div class="field"><label for="reception-whatsapp">Dedicated Reception WhatsApp mobile</label><input id="reception-whatsapp" name="whatsappNumber" type="tel" inputmode="tel" autocomplete="tel" maxlength="24" required placeholder="e.g. 082 123 4567"></div><label class="check"><input name="identityConfirmed" type="checkbox" required><span>I verified this is the dedicated clinic Reception WhatsApp number and should be bound to the shared <strong>Shiloh Reception</strong> Workspace principal.</span></label><button class="button" type="submit">Create Reception access</button></form>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reception access — Shiloh Workspace</title><style>${workspaceShellStyles()}${styles()}</style><script src="/calendar/team/reception-setup/client.js" defer></script></head><body><div class="workspace-frame">${renderWorkspaceNavigation({ active: 'staff', displayName: model.authorityDisplayName, calendarHref: '/calendar/read-only', clientsHref: '/calendar/clients', staffHref: '/calendar/team' })}<main class="workspace-main"><div class="setup-shell"><header class="setup-header"><h1>Reception access</h1><p>Set up the shared clinic Reception Workspace identity.</p></header><section class="panel"><h2>Reception preset</h2><div class="scope-grid"><div class="scope"><span>Principal</span><strong>Shared operational</strong></div><div class="scope"><span>Calendar</span><strong>All business</strong></div><div class="scope"><span>Services</span><strong>All services</strong></div></div><div class="capabilities" style="margin-top:12px">${capabilityMarkup}</div><p class="notice warning" style="margin-top:12px">Does not grant Staff or Access administration, credential/recovery administration, financial authority, Meta/provider controls, destructive deletion, Control functions or bulk campaign messaging.</p></section><section class="panel"><h2>${configured ? 'Current state' : 'Bind Reception phone'}</h2>${body}</section><a class="back" href="/calendar/team">← Back to Staff</a></div></main></div></body></html>`;
}

function workspaceReceptionSetupClientScript() {
  return `(function(){'use strict';var form=document.querySelector('[data-reception-setup-form]');if(!form)return;var status=document.querySelector('[data-reception-status]');function tell(m,t){if(!status)return;status.textContent=String(m||'');status.dataset.tone=t||'ready';}function rid(){if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();return'R'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);}async function read(r){try{return await r.json();}catch(_e){return{};}}async function csrf(){var r=await fetch('/calendar/staff-auth/csrf',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json'},body:'{}'});if(!r.ok)throw new Error('Your secure Shiloh session has expired.');var b=await read(r);if(!b.csrfToken)throw new Error('A secure operation token could not be issued.');return b.csrfToken;}function busy(on){Array.prototype.forEach.call(form.querySelectorAll('button,input'),function(el){el.disabled=on;});}form.addEventListener('submit',async function(e){e.preventDefault();var f=new FormData(form);if(f.get('identityConfirmed')!=='on'){tell('Verify the dedicated Reception WhatsApp number before creating access.','error');return;}busy(true);tell('Creating bounded Reception access…','working');try{var token=await csrf();var r=await fetch('/calendar/team/reception-setup',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json','x-shiloh-csrf-token':token},body:JSON.stringify({requestId:rid(),whatsappNumber:f.get('whatsappNumber'),identityConfirmed:true})});token='';var b=await read(r);if(!r.ok)throw new Error(b.error||'Reception access creation failed closed.');window.location.reload();}catch(err){tell(err.message,'error');busy(false);}});})();`;
}

module.exports = { renderReceptionSetupPage, workspaceReceptionSetupClientScript };
