const { escapeHtml } = require('./workspaceShell');

const READ_ONLY_NOTE = '<div class="read-only-note">Read-only authority view. Role, capability and scope changes remain separately governed; Staff lifecycle does not create or edit authentication credentials.</div>';

function accessEnablementMarkup(model = {}) {
  if (model.accessManageAllowed !== true) return READ_ONLY_NOTE;
  if (model.access) {
    return `${READ_ONLY_NOTE}<p class="footer-note">Existing access is preserved. This bounded surface does not edit, broaden, downgrade or replace an active authority record.</p>`;
  }
  const staff = model.staff || {};
  if (staff.status !== 'active') {
    return `${READ_ONLY_NOTE}<div class="warning-note">Workspace access can only be enabled for an active canonical Staff profile. Reactivate the Staff profile first if that reflects current clinic authority.</div>`;
  }
  if (staff.resource_type !== 'practitioner' || staff.business_role !== 'employee_practitioner') {
    return `${READ_ONLY_NOTE}<div class="warning-note">This bounded enablement is only available for active employee practitioners. Other access roles remain separately governed.</div>`;
  }
  return `<div data-staff-access-management><p class="status-message" role="status" aria-live="polite" data-staff-access-status></p><form data-staff-access-enable-form data-staff-id="${escapeHtml(staff.id)}" data-staff-revision="${escapeHtml(staff.revision)}"><div class="edit-grid"><div class="field wide"><label for="staff-access-whatsapp">Staff WhatsApp mobile</label><input id="staff-access-whatsapp" name="whatsappNumber" type="tel" inputmode="tel" autocomplete="tel" required maxlength="24" placeholder="e.g. 082 123 4567" aria-describedby="staff-access-scope"></div><div class="field wide"><label class="check-field"><input name="identityConfirmed" type="checkbox" required> I verified this is ${escapeHtml(staff.display_name)}’s current WhatsApp number.</label></div></div><div class="manage-actions"><button class="button primary" type="submit">Enable Workspace access</button><span class="manage-badge">View-only practitioner preset</span></div></form><div id="staff-access-scope" class="read-only-note">Creates one canonical linked access principal with <strong>appointment:view</strong>, own appointments and own services only. It does not grant booking changes, schedules, pricing, Staff management or Access management, and it does not create or reset authentication credentials.</div></div>`;
}

function decorateStaffDetailAccessHtml(html, model = {}) {
  const source = String(html || '');
  const replacement = accessEnablementMarkup(model);
  if (!source.includes(READ_ONLY_NOTE)) return source;
  let result = source.replace(READ_ONLY_NOTE, replacement);
  const needsScript = model.accessManageAllowed === true
    && !model.access
    && model.staff?.status === 'active'
    && model.staff?.resource_type === 'practitioner'
    && model.staff?.business_role === 'employee_practitioner';
  if (needsScript && !result.includes('/calendar/team/access-manage.js')) {
    result = result.replace('</head>', '<script src="/calendar/team/access-manage.js" defer></script></head>');
  }
  return result;
}

function workspaceStaffAccessClientScript() {
  return `(function(){'use strict';
var API='/calendar/team';var CSRF='/calendar/staff-auth/csrf';
function one(s,r){return(r||document).querySelector(s);}function requestId(){if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();return'T'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);}
function status(message,tone){var target=one('[data-staff-access-status]');if(!target)return;target.textContent=String(message||'');target.dataset.tone=tone||'ready';}
async function json(response){try{return await response.json();}catch(_error){return{};}}
async function csrf(){var response=await fetch(CSRF,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json'},body:'{}'});if(!response.ok)throw new Error('Your secure Shiloh session has expired.');var body=await json(response);if(!body.csrfToken)throw new Error('A secure operation token could not be issued.');return body.csrfToken;}
function busy(form,on){Array.prototype.forEach.call(form.querySelectorAll('button,input'),function(el){el.disabled=on;});}
var form=one('[data-staff-access-enable-form]');if(!form)return;form.addEventListener('submit',async function(e){e.preventDefault();var f=new FormData(form);if(f.get('identityConfirmed')!=='on'){status('Verify the staff member’s current WhatsApp number before enabling access.','error');return;}if(!window.confirm('Enable view-only Shiloh Workspace access for this staff member using the verified WhatsApp number?'))return;busy(form,true);status('Enabling canonical Workspace access…','working');try{var token=await csrf();var response=await fetch(API+'/'+form.dataset.staffId+'/access/enable',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json','x-shiloh-csrf-token':token},body:JSON.stringify({requestId:requestId(),expectedRevision:form.dataset.staffRevision,whatsappNumber:f.get('whatsappNumber'),identityConfirmed:true})});token='';var body=await json(response);if(!response.ok)throw new Error(body.error||'Workspace access enablement failed closed.');window.location.reload();}catch(err){status(err.message,'error');busy(form,false);}});
})();`;
}

module.exports = {
  READ_ONLY_NOTE,
  accessEnablementMarkup,
  decorateStaffDetailAccessHtml,
  workspaceStaffAccessClientScript,
};
