const { escapeHtml } = require('./workspaceShell');

const READ_ONLY_NOTE = '<div class="read-only-note">Read-only authority view. Role, capability and scope changes remain separately governed; Staff lifecycle does not create or edit authentication credentials.</div>';
const POLICY_STYLES = '<style>.access-policy-scope{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:0 0 13px}.access-policy-scope div{padding:10px 11px;border:1px solid var(--line);border-radius:11px;background:#fff}.access-policy-scope span{display:block;color:var(--muted);font-size:.68rem;margin-bottom:4px}.access-policy-scope strong{font-size:.82rem}.access-policy-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.access-policy-option{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:9px;align-items:start;min-height:54px;padding:10px 11px;border:1px solid var(--line-strong);border-radius:11px;background:#fff;cursor:pointer}.access-policy-option input{width:18px;height:18px;margin:2px 0 0}.access-policy-option strong,.access-policy-option span{display:block}.access-policy-option .policy-copy span{margin-top:3px;color:var(--muted);font-size:.7rem;line-height:1.35}.access-policy-option.required{background:var(--leaf-soft);cursor:default}.policy-state{font-size:.67rem;color:var(--leaf);font-weight:800;white-space:nowrap}.access-policy-heading{margin:0 0 10px;font-size:.86rem}.access-policy-help{margin:8px 0 0;color:var(--muted);font-size:.72rem;line-height:1.45}@media(max-width:700px){.access-policy-scope,.access-policy-options{grid-template-columns:1fr}.access-policy-option{min-height:52px;align-items:center}.access-policy-option input{width:20px;height:20px}.policy-state{align-self:center}}</style>';

function isCompatibleLegacyAccessView(access) {
  return Boolean(access)
    && access.businessRole === 'employee_practitioner'
    && access.calendarScope === 'own_appointments'
    && access.serviceScope === 'own_services'
    && Array.isArray(access.capabilities)
    && access.capabilities.length === 0;
}

function eligibleEmployeePractitioner(staff = {}) {
  return staff.status === 'active'
    && staff.resource_type === 'practitioner'
    && staff.business_role === 'employee_practitioner';
}

function accessFormMarkup(staff, { mode = 'enable' } = {}) {
  const completion = mode === 'complete';
  const button = completion ? 'Complete Workspace access' : 'Enable Workspace access';
  const badge = completion ? 'Complete view-only access' : 'View-only practitioner preset';
  const scopeNote = completion
    ? 'Preserves the existing WhatsApp identity, business role and scopes and adds <strong>appointment:view</strong> only. It does not add any other capability or create, reset or expose authentication credentials.'
    : 'Creates one canonical linked access principal with <strong>appointment:view</strong>, own appointments and own services only. It does not grant booking changes, schedules, pricing, Staff management or Access management, and it does not create or reset authentication credentials.';
  return `<div data-staff-access-management><p class="status-message" role="status" aria-live="polite" data-staff-access-status></p><form data-staff-access-enable-form data-access-mode="${mode}" data-staff-id="${escapeHtml(staff.id)}" data-staff-revision="${escapeHtml(staff.revision)}"><div class="edit-grid"><div class="field wide"><label for="staff-access-whatsapp">Staff WhatsApp mobile</label><input id="staff-access-whatsapp" name="whatsappNumber" type="tel" inputmode="tel" autocomplete="tel" required maxlength="24" placeholder="e.g. 082 123 4567" aria-describedby="staff-access-scope"></div><div class="field wide"><label class="check-field"><input name="identityConfirmed" type="checkbox" required> I verified this is ${escapeHtml(staff.display_name)}’s current WhatsApp number.</label></div></div><div class="manage-actions"><button class="button primary" type="submit">${button}</button><span class="manage-badge">${badge}</span></div></form><div id="staff-access-scope" class="read-only-note">${scopeNote}</div></div>`;
}

function humanScope(value) {
  const raw = String(value || '').replace(/_/g, ' ').trim();
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Not configured';
}

function accessPolicyMarkup(model = {}) {
  const policy = model.accessPolicy || {};
  const enabled = new Set(Array.isArray(policy.capabilities) ? policy.capabilities : []);
  const definitions = Array.isArray(policy.definitions) ? policy.definitions : [];
  const controls = definitions.map(item => {
    const mandatory = item.mandatory === true;
    const checked = mandatory || enabled.has(item.key);
    const requirement = mandatory ? '<span class="policy-state">Required</span>' : '';
    return `<label class="access-policy-option${mandatory ? ' required' : ''}" data-access-capability="${escapeHtml(item.key)}"><input type="checkbox" name="capability" value="${escapeHtml(item.key)}"${checked ? ' checked' : ''}${mandatory ? ' disabled aria-disabled="true"' : ''}><span class="policy-copy"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span></span>${requirement}</label>`;
  }).join('');
  return `<div data-staff-access-management data-access-policy-editor><p class="status-message" role="status" aria-live="polite" data-staff-access-status></p><div class="access-policy-scope" aria-label="Fixed practitioner authority"><div><span>Business role</span><strong>${escapeHtml(humanScope(policy.businessRole))}</strong></div><div><span>Calendar scope</span><strong>${escapeHtml(humanScope(policy.calendarScope))}</strong></div><div><span>Service scope</span><strong>${escapeHtml(humanScope(policy.serviceScope))}</strong></div></div><h3 class="access-policy-heading">Operational capabilities</h3><form data-staff-access-policy-form data-staff-id="${escapeHtml(model.staff?.id)}" data-access-revision="${escapeHtml(policy.revision)}"><div class="access-policy-options">${controls}</div><p class="access-policy-help">These controls never change whose appointments or services this practitioner can access. Own appointments and own services remain fixed. Create bookings automatically includes Find clients.</p><div class="manage-actions"><button class="button primary" type="submit">Save access</button><span class="manage-badge">Practitioner policy</span></div></form><div class="read-only-note">Authentication, WhatsApp identity, owner/admin authority and protected security capabilities are not changed by this surface.</div></div>`;
}

function accessEnablementMarkup(model = {}) {
  if (model.accessManageAllowed !== true) return READ_ONLY_NOTE;
  const staff = model.staff || {};
  if (model.access) {
    if (eligibleEmployeePractitioner(staff) && isCompatibleLegacyAccessView(model.access)) {
      return `${accessFormMarkup(staff, { mode: 'complete' })}<p class="footer-note">This completion path is available only because the existing active authority already matches the employee-practitioner scopes and has no enabled capabilities. Any different or broader authority remains fail-closed.</p>`;
    }
    if (model.accessPolicy?.supported === true) return accessPolicyMarkup(model);
    const reason = model.accessPolicy?.reason
      ? `<div class="warning-note">${escapeHtml(model.accessPolicy.reason)}</div>`
      : '';
    return `${READ_ONLY_NOTE}${reason}<p class="footer-note">Existing access is preserved. Protected, broader or incompatible authority is not silently downgraded or replaced.</p>`;
  }
  if (staff.status !== 'active') {
    return `${READ_ONLY_NOTE}<div class="warning-note">Workspace access can only be enabled for an active canonical Staff profile. Reactivate the Staff profile first if that reflects current clinic authority.</div>`;
  }
  if (staff.resource_type !== 'practitioner' || staff.business_role !== 'employee_practitioner') {
    return `${READ_ONLY_NOTE}<div class="warning-note">This bounded enablement is only available for active employee practitioners. Other access roles remain separately governed.</div>`;
  }
  return accessFormMarkup(staff, { mode: 'enable' });
}

function decorateStaffDetailAccessHtml(html, model = {}) {
  const source = String(html || '');
  const replacement = accessEnablementMarkup(model);
  if (!source.includes(READ_ONLY_NOTE)) return source;
  let result = source.replace(READ_ONLY_NOTE, replacement);
  const canEnableOrComplete = model.accessManageAllowed === true
    && eligibleEmployeePractitioner(model.staff || {})
    && (!model.access || isCompatibleLegacyAccessView(model.access));
  const canEditPolicy = model.accessManageAllowed === true && model.accessPolicy?.supported === true;
  if ((canEnableOrComplete || canEditPolicy) && !result.includes('/calendar/team/access-manage.js')) {
    result = result.replace('</head>', `${canEditPolicy ? POLICY_STYLES : ''}<script src="/calendar/team/access-manage.js" defer></script></head>`);
  }
  return result;
}

function workspaceStaffAccessClientScript() {
  return `(function(){'use strict';
var API='/calendar/team';var CSRF='/calendar/staff-auth/csrf';var ENABLE_SUFFIX='/access/enable';var COMPLETE_SUFFIX='/access/complete';var POLICY_SUFFIX='/access/policy';
function one(s,r){return(r||document).querySelector(s);}function requestId(){if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();return'T'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);}
function status(message,tone){var target=one('[data-staff-access-status]');if(!target)return;target.textContent=String(message||'');target.dataset.tone=tone||'ready';}
async function json(response){try{return await response.json();}catch(_error){return{};}}
async function csrf(){var response=await fetch(CSRF,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json'},body:'{}'});if(!response.ok)throw new Error('Your secure Shiloh session has expired.');var body=await json(response);if(!body.csrfToken)throw new Error('A secure operation token could not be issued.');return body.csrfToken;}
function busy(form,on){Array.prototype.forEach.call(form.querySelectorAll('button,input'),function(el){if(on){el.dataset.shilohWasDisabled=el.disabled?'1':'0';el.disabled=true;}else{el.disabled=el.dataset.shilohWasDisabled==='1';delete el.dataset.shilohWasDisabled;}});}
var accessForm=one('[data-staff-access-enable-form]');if(accessForm)accessForm.addEventListener('submit',async function(e){e.preventDefault();var f=new FormData(accessForm);var completion=accessForm.dataset.accessMode==='complete';if(f.get('identityConfirmed')!=='on'){status('Verify the staff member’s current WhatsApp number before changing access.','error');return;}busy(accessForm,true);status(completion?'Completing canonical Workspace access…':'Enabling canonical Workspace access…','working');try{var token=await csrf();var suffix=completion?COMPLETE_SUFFIX:ENABLE_SUFFIX;var response=await fetch(API+'/'+accessForm.dataset.staffId+suffix,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json','x-shiloh-csrf-token':token},body:JSON.stringify({requestId:requestId(),expectedRevision:accessForm.dataset.staffRevision,whatsappNumber:f.get('whatsappNumber'),identityConfirmed:true})});token='';var body=await json(response);if(!response.ok)throw new Error(body.error||'Workspace access change failed closed.');window.location.reload();}catch(err){status(err.message,'error');busy(accessForm,false);}});
var policyForm=one('[data-staff-access-policy-form]');if(policyForm){var create=one('input[value="appointment:create"]',policyForm),lookup=one('input[value="client:lookup"]',policyForm);if(create&&lookup)create.addEventListener('change',function(){if(create.checked)lookup.checked=true;});policyForm.addEventListener('submit',async function(e){e.preventDefault();var capabilities=Array.prototype.filter.call(policyForm.querySelectorAll('input[name="capability"]'),function(input){return input.checked;}).map(function(input){return input.value;});busy(policyForm,true);status('Saving bounded practitioner access…','working');try{var token=await csrf();var response=await fetch(API+'/'+policyForm.dataset.staffId+POLICY_SUFFIX,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json','x-shiloh-csrf-token':token},body:JSON.stringify({requestId:requestId(),expectedAccessRevision:policyForm.dataset.accessRevision,capabilities:capabilities})});token='';var body=await json(response);if(!response.ok)throw new Error(body.error||'Staff access policy change failed closed.');window.location.reload();}catch(err){status(err.message,'error');busy(policyForm,false);}});}
})();`;
}

module.exports = {
  READ_ONLY_NOTE,
  POLICY_STYLES,
  isCompatibleLegacyAccessView,
  accessFormMarkup,
  accessPolicyMarkup,
  accessEnablementMarkup,
  decorateStaffDetailAccessHtml,
  workspaceStaffAccessClientScript,
};
