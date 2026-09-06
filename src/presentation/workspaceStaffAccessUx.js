const { escapeHtml } = require('./workspaceShell');

const READ_ONLY_NOTE = '<div class="read-only-note">Read-only authority view. Role, capability and scope changes remain separately governed; Staff lifecycle does not create or edit authentication credentials.</div>';

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

function accessEnablementMarkup(model = {}) {
  if (model.accessManageAllowed !== true) return READ_ONLY_NOTE;
  const staff = model.staff || {};
  if (model.access) {
    if (eligibleEmployeePractitioner(staff) && isCompatibleLegacyAccessView(model.access)) {
      return `${accessFormMarkup(staff, { mode: 'complete' })}<p class="footer-note">This completion path is available only because the existing active authority already matches the employee-practitioner scopes and has no enabled capabilities. Any different or broader authority remains fail-closed.</p>`;
    }
    return `${READ_ONLY_NOTE}<p class="footer-note">Existing access is preserved. This bounded surface does not edit, broaden, downgrade or replace an active authority record.</p>`;
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
  const needsScript = model.accessManageAllowed === true
    && eligibleEmployeePractitioner(model.staff || {})
    && (!model.access || isCompatibleLegacyAccessView(model.access));
  if (needsScript && !result.includes('/calendar/team/access-manage.js')) {
    result = result.replace('</head>', '<script src="/calendar/team/access-manage.js" defer></script></head>');
  }
  return result;
}

function workspaceStaffAccessClientScript() {
  return `(function(){'use strict';
var API='/calendar/team';var CSRF='/calendar/staff-auth/csrf';var ENABLE_SUFFIX='/access/enable';var COMPLETE_SUFFIX='/access/complete';
function one(s,r){return(r||document).querySelector(s);}function requestId(){if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();return'T'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);}
function status(message,tone){var target=one('[data-staff-access-status]');if(!target)return;target.textContent=String(message||'');target.dataset.tone=tone||'ready';}
async function json(response){try{return await response.json();}catch(_error){return{};}}
async function csrf(){var response=await fetch(CSRF,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json'},body:'{}'});if(!response.ok)throw new Error('Your secure Shiloh session has expired.');var body=await json(response);if(!body.csrfToken)throw new Error('A secure operation token could not be issued.');return body.csrfToken;}
function busy(form,on){Array.prototype.forEach.call(form.querySelectorAll('button,input'),function(el){el.disabled=on;});}
var form=one('[data-staff-access-enable-form]');if(!form)return;form.addEventListener('submit',async function(e){e.preventDefault();var f=new FormData(form);var completion=form.dataset.accessMode==='complete';if(f.get('identityConfirmed')!=='on'){status('Verify the staff member’s current WhatsApp number before changing access.','error');return;}busy(form,true);status(completion?'Completing canonical Workspace access…':'Enabling canonical Workspace access…','working');try{var token=await csrf();var suffix=completion?COMPLETE_SUFFIX:ENABLE_SUFFIX;var response=await fetch(API+'/'+form.dataset.staffId+suffix,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json','x-shiloh-csrf-token':token},body:JSON.stringify({requestId:requestId(),expectedRevision:form.dataset.staffRevision,whatsappNumber:f.get('whatsappNumber'),identityConfirmed:true})});token='';var body=await json(response);if(!response.ok)throw new Error(body.error||'Workspace access change failed closed.');window.location.reload();}catch(err){status(err.message,'error');busy(form,false);}});
})();`;
}

module.exports = {
  READ_ONLY_NOTE,
  isCompatibleLegacyAccessView,
  accessEnablementMarkup,
  decorateStaffDetailAccessHtml,
  workspaceStaffAccessClientScript,
};
