function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function styles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#6c7d75;--paper:#f7f5ef;--panel:#fffdf9;--line:#dfe5df;--leaf:#496b5a;--leaf-soft:#e7eee9;--error:#8a3f3f;--error-soft:#f8eaea}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:780px;margin:0 auto;padding:28px 18px 40px}.brand h1{margin:0;font-size:1.5rem}.brand p,.lead,.note{color:var(--muted);line-height:1.5}.card{margin-top:18px;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 5px 22px rgba(32,50,43,.05)}.section{border-top:1px solid var(--line);margin-top:20px;padding-top:18px}.section:first-child{border-top:0;margin-top:0;padding-top:0}.eyebrow{font-size:.75rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}h2{margin:5px 0 8px;font-size:1.2rem}.field{display:grid;gap:7px;margin-top:14px}.field label{font-size:.83rem;font-weight:700}.field input{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 12px;background:#fff;color:var(--ink);font:inherit}.actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:14px}.button{border:1px solid var(--leaf);border-radius:999px;padding:9px 14px;background:var(--leaf);color:#fff;font:inherit;font-weight:700;cursor:pointer}.button.secondary{background:#fff;color:var(--leaf)}.button.danger{border-color:var(--error);background:#fff;color:var(--error)}.button:disabled{opacity:.55}.status{margin:16px 0 0;border:1px solid var(--line);border-radius:12px;padding:11px 12px;background:#fff;line-height:1.45}.status[data-state="ok"]{background:var(--leaf-soft)}.status[data-state="error"]{background:var(--error-soft);color:#6d3434}.enrollment,.codes{margin-top:16px;padding:16px;border:1px solid var(--line);border-radius:14px;background:#fff}.enrollment[hidden],.codes[hidden],.admin-reset[hidden]{display:none}.qr{display:block;width:240px;height:240px;max-width:100%;margin:12px auto}.manual,.codes pre{white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--paper);font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.warning{color:var(--error);font-weight:700}.nav{display:inline-block;margin-top:14px;color:var(--leaf);font-weight:700;text-decoration:none}@media(max-width:560px){.shell{padding:18px 12px}.card{padding:16px}.button{width:100%}}`;
}

function renderProviderIndependentStaffAuthPage({ clientScriptPath = '/calendar/staff-auth/totp/manage.js' } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shiloh authenticator security</title><style>${styles()}</style><script src="${escapeHtml(clientScriptPath)}" defer></script></head><body data-shiloh-totp-management="true"><div class="shell">
  <header class="brand"><h1>Shiloh staff authenticator</h1><p>Provider-independent security for your canonical Shiloh staff account.</p></header>
  <main class="card">
    <section class="section"><span class="eyebrow">Authenticator</span><h2>Enroll or replace your authenticator</h2><p class="lead">A recently authenticated staff session is required. Starting enrollment does not reveal an existing secret and does not disable WhatsApp sign-in.</p>
      <div class="actions"><button class="button" type="button" data-start-enrollment>Start secure enrollment</button></div>
      <div class="enrollment" data-enrollment hidden>
        <p><strong>1.</strong> Scan this QR code with an authenticator app, or enter the manual key.</p>
        <img class="qr" data-enrollment-qr alt="Authenticator enrollment QR code">
        <div class="manual" data-manual-key></div>
        <p class="note">Profile: SHA-1, six digits, 30 seconds. This enrollment expires after ten minutes.</p>
        <form method="post" data-confirm-enrollment novalidate><div class="field"><label for="enrollment-code">Authenticator code</label><input id="enrollment-code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="6 digits"></div><div class="actions"><button class="button" type="submit">Confirm enrollment</button><button class="button secondary" type="button" data-cancel-enrollment>Cancel</button></div></form>
      </div>
    </section>
    <section class="section"><span class="eyebrow">Recovery</span><h2>One-time recovery codes</h2><p class="lead">Regenerating creates ten new codes and immediately invalidates every previous unused code. Codes are shown only once.</p><div class="actions"><button class="button secondary" type="button" data-regenerate-recovery>Regenerate recovery codes</button></div>
      <div class="codes" data-recovery-codes hidden><p class="warning">Save these codes securely now. Shiloh cannot show them again.</p><pre data-recovery-code-list></pre><div class="actions"><button class="button secondary" type="button" data-copy-recovery>Copy codes</button><button class="button" type="button" data-dismiss-recovery>I saved them</button></div></div>
    </section>
    <section class="section admin-reset" data-admin-reset hidden><span class="eyebrow">Privileged reset</span><h2>Reset another staff authenticator</h2><p class="lead">Requires <code>staff_auth:reset</code>. You cannot reset your own authenticator here.</p><form method="post" data-reset-form novalidate><div class="field"><label for="reset-subject">Subject Admin ID</label><input id="reset-subject" type="number" inputmode="numeric" min="1" step="1"></div><div class="field"><label for="reset-reason">Controlled reason</label><input id="reset-reason" type="text" maxlength="240" autocomplete="off"></div><div class="actions"><button class="button danger" type="submit">Disable credentials and revoke sessions</button></div></form></section>
    <div class="status" role="status" aria-live="polite" data-management-status data-state="ready">Checking your current security state…</div>
    <a class="nav" href="/calendar/staff">Return to staff sign-in</a>
  </main></div></body></html>`;
}

function providerIndependentStaffAuthClientScript() {
  return `(function(){
'use strict';
var BASE='/calendar/staff-auth';
var csrfToken='';
var recoveryText='';
var enrollmentTimer=0;
function select(q){return document.querySelector(q);}
function status(state,message){var n=select('[data-management-status]');if(!n)return;n.dataset.state=state;n.textContent=message;}
function busy(button,value){if(button)button.disabled=!!value;}
function headers(){return {'Content-Type':'application/json','Accept':'application/json','x-shiloh-csrf-token':csrfToken};}
function safeJson(response){return response.json().catch(function(){return {};});}
async function ensureCsrf(){var response=await fetch(BASE+'/csrf',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Accept':'application/json'},body:'{}'});if(response.status===401){window.location.replace('/calendar/staff?reason=session');throw new Error('session');}if(!response.ok)throw new Error('csrf');var body=await safeJson(response);csrfToken=String(body.csrfToken||'');if(!csrfToken)throw new Error('csrf');}
async function post(path,payload){await ensureCsrf();return fetch(BASE+path,{method:'POST',credentials:'same-origin',cache:'no-store',headers:headers(),body:JSON.stringify(payload||{})});}
function clearEnrollment(){if(enrollmentTimer){window.clearTimeout(enrollmentTimer);enrollmentTimer=0;}var box=select('[data-enrollment]');if(box)box.hidden=true;var image=select('[data-enrollment-qr]');if(image)image.removeAttribute('src');var manual=select('[data-manual-key]');if(manual)manual.textContent='';var code=select('#enrollment-code');if(code)code.value='';}
function showRecovery(codes){recoveryText=(codes||[]).join('\n');var box=select('[data-recovery-codes]');var list=select('[data-recovery-code-list]');if(list)list.textContent=recoveryText;if(box)box.hidden=false;}
async function probe(){try{var response=await fetch(BASE+'/totp/status',{credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}});if(response.status===401){window.location.replace('/calendar/staff?reason=session');return;}if(!response.ok){status('error','Provider-independent authentication is not available for this account.');return;}var body=await safeJson(response);if(body.canResetOther){var panel=select('[data-admin-reset]');if(panel)panel.hidden=false;}if(body.recoveryRequired)status('error','Recovery authentication is active. Enroll a replacement authenticator before Calendar access.');else if(body.enrolled)status('ok','Your provider-independent authenticator is active.');else status('ready','No provider-independent authenticator is active yet. Start enrollment when ready.');}catch(_error){status('error','Security status is temporarily unavailable.');}}
async function start(){var button=select('[data-start-enrollment]');busy(button,true);status('ready','Creating a short-lived enrollment…');try{var response=await post('/totp/enrollment/start',{});var body=await safeJson(response);if(response.status===428){status('error','Recent authentication is required. Sign out and sign in again before enrollment.');return;}if(!response.ok){status('error','Enrollment could not be started.');return;}clearEnrollment();var image=select('[data-enrollment-qr]');var manual=select('[data-manual-key]');var box=select('[data-enrollment]');if(image)image.src=String(body.qrDataUrl||'');if(manual)manual.textContent=String(body.manualKey||'');if(box)box.hidden=false;var expiresAt=new Date(body.expiresAt||0).getTime();var delay=Math.max(0,expiresAt-Date.now());enrollmentTimer=window.setTimeout(function(){clearEnrollment();status('error','The enrollment expired. Start a new enrollment to continue.');},delay);status('ready','Scan the QR code, then prove possession with a current six-digit code.');}catch(_error){status('error','Enrollment is temporarily unavailable.');}finally{busy(button,false);}}
async function confirm(event){event.preventDefault();var code=String((select('#enrollment-code')||{}).value||'').trim();if(!/^[0-9]{6}$/.test(code)){status('error','Enter a valid six-digit authenticator code.');return;}status('ready','Confirming authenticator possession…');try{var response=await post('/totp/enrollment/confirm',{code:code});var body=await safeJson(response);if(response.status===429){status('error','Too many attempts. Wait before trying again.');return;}if(!response.ok){status('error','The code is invalid, expired, or cannot be accepted.');return;}clearEnrollment();showRecovery(body.recoveryCodes);status('ok','Authenticator enrollment is complete. Save the new recovery codes now.');}catch(_error){status('error','Enrollment confirmation is temporarily unavailable.');}}
async function cancel(){try{var response=await post('/totp/enrollment/cancel',{});if(response.ok){clearEnrollment();status('ok','The pending enrollment was cancelled.');return;}status('error','Enrollment cancellation failed.');}catch(_error){status('error','Enrollment cancellation is temporarily unavailable.');}}
async function regenerate(){var button=select('[data-regenerate-recovery]');busy(button,true);status('ready','Generating a new recovery-code set…');try{var response=await post('/totp/recovery/regenerate',{});var body=await safeJson(response);if(response.status===428){status('error','Recent non-recovery authentication is required. Sign in with your authenticator first.');return;}if(!response.ok){status('error','Recovery codes could not be regenerated.');return;}showRecovery(body.recoveryCodes);status('ok','New recovery codes are active. Every previous unused code is invalid.');}catch(_error){status('error','Recovery-code regeneration is temporarily unavailable.');}finally{busy(button,false);}}
async function copyCodes(){if(!recoveryText)return;try{await navigator.clipboard.writeText(recoveryText);status('ok','Recovery codes copied. Keep the destination secure.');}catch(_error){status('error','Copy was blocked. Select and copy the displayed codes manually.');}}
function dismissCodes(){recoveryText='';var list=select('[data-recovery-code-list]');if(list)list.textContent='';var box=select('[data-recovery-codes]');if(box)box.hidden=true;status('ok','Recovery codes cleared from this page.');}
async function resetOther(event){event.preventDefault();var subjectAdminId=Number((select('#reset-subject')||{}).value);var reason=String((select('#reset-reason')||{}).value||'').trim();if(!Number.isSafeInteger(subjectAdminId)||subjectAdminId<=0||!reason){status('error','Enter the subject Admin ID and a controlled reason.');return;}if(!window.confirm('Disable this staff authenticator, invalidate recovery codes, and revoke active sessions?'))return;try{var response=await post('/totp/admin/reset',{subjectAdminId:subjectAdminId,reason:reason});if(response.status===403){status('error','The reset is not authorized, including any attempted privileged self-reset.');return;}if(!response.ok){status('error','The controlled reset could not be completed.');return;}status('ok','The subject credentials were disabled and active sessions revoked.');}catch(_error){status('error','The controlled reset is temporarily unavailable.');}}
var startButton=select('[data-start-enrollment]');if(startButton)startButton.addEventListener('click',start);
var confirmForm=select('[data-confirm-enrollment]');if(confirmForm)confirmForm.addEventListener('submit',confirm);
var cancelButton=select('[data-cancel-enrollment]');if(cancelButton)cancelButton.addEventListener('click',cancel);
var regenerateButton=select('[data-regenerate-recovery]');if(regenerateButton)regenerateButton.addEventListener('click',regenerate);
var copyButton=select('[data-copy-recovery]');if(copyButton)copyButton.addEventListener('click',copyCodes);
var dismissButton=select('[data-dismiss-recovery]');if(dismissButton)dismissButton.addEventListener('click',dismissCodes);
var resetForm=select('[data-reset-form]');if(resetForm)resetForm.addEventListener('submit',resetOther);
probe();
})();`;
}

module.exports = {
  renderProviderIndependentStaffAuthPage,
  providerIndependentStaffAuthClientScript,
};
