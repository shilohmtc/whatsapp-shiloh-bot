function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function signinPanel() {
  return `<section class="section" data-shiloh-passkey-panel>
    <span class="eyebrow">Fast secure re-entry</span><h2>Continue with a passkey</h2>
    <p class="lead">Use the passkey already saved on this device or in your password manager. Your fingerprint, face scan, or device PIN stays with your device.</p>
    <div class="actions"><button class="button" type="button" data-shiloh-passkey-signin>Continue with passkey</button></div>
    <p class="privacy-note" data-shiloh-passkey-status aria-live="polite"></p>
  </section>`;
}
function signinScript() {
  return `(function(){'use strict';
var button=document.querySelector('[data-shiloh-passkey-signin]');var status=document.querySelector('[data-shiloh-passkey-status]');if(!button)return;
function msg(v){if(status)status.textContent=v||'';}function bytes(v){var s=String(v||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var raw=atob(s);var a=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);return a.buffer;}function enc(v){if(v==null)return null;var a=new Uint8Array(v),s='';for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}function json(r){return r.json().catch(function(){return {};});}
if(!window.PublicKeyCredential||!navigator.credentials){button.disabled=true;msg('Passkeys are not supported in this browser. Use the authenticator sign-in below.');return;}
button.addEventListener('click',async function(){button.disabled=true;msg('Choose your Shiloh passkey…');try{var start=await fetch('/calendar/staff-auth/passkeys/authentication/options',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json','Content-Type':'application/json'},body:'{}'});if(!start.ok)throw new Error('unavailable');var body=await json(start);var options=body.options||{};options.challenge=bytes(options.challenge);var credential=await navigator.credentials.get({publicKey:options});if(!credential)throw new Error('cancelled');var finish=await fetch('/calendar/staff-auth/passkeys/authentication/finish',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json','Content-Type':'application/json'},body:JSON.stringify({response:{id:credential.id,rawId:enc(credential.rawId),type:credential.type,response:{clientDataJSON:enc(credential.response.clientDataJSON),authenticatorData:enc(credential.response.authenticatorData),signature:enc(credential.response.signature),userHandle:enc(credential.response.userHandle)}}})});var result=await json(finish);if(!finish.ok||!result.authenticated)throw new Error('invalid');msg('Signed in. Opening Workspace…');window.location.replace('/calendar/workspace');}catch(error){if(error&&error.name==='NotAllowedError')msg('Passkey prompt was cancelled or unavailable. You can use the authenticator sign-in below.');else msg('Passkey sign-in could not be verified. Use another passkey or the authenticator sign-in below.');button.disabled=false;}});
})();`;
}

function dateLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function initialCredentialList(credentials = []) {
  if (!Array.isArray(credentials) || !credentials.length) return '<p>No passkeys enrolled yet.</p>';
  return credentials.map((row) => {
    const created = dateLabel(row?.createdAt) || 'unknown date';
    const lastUsed = dateLabel(row?.lastUsedAt);
    const backup = row?.backedUp === true ? ' · synced/backup capable' : '';
    return `<div class="credential"><strong>${row?.revokedAt ? 'Revoked passkey' : 'Passkey'}</strong><div class="meta">Added ${escapeHtml(created)}${lastUsed ? ` · last used ${escapeHtml(lastUsed)}` : ''}${backup}</div></div>`;
  }).join('');
}

function managePage({ credentials = [] } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shiloh passkeys</title><style>:root{color-scheme:light;--ink:#20322b;--muted:#6c7d75;--paper:#f7f5ef;--panel:#fffdf9;--line:#dfe5df;--leaf:#496b5a;--leaf-soft:#e7eee9;--error:#8a3f3f}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:760px;margin:0 auto;padding:28px 18px 40px}.card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:20px}.eyebrow{font-size:.75rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}h1{margin:5px 0 8px;font-size:1.5rem}p{color:var(--muted);line-height:1.5}.actions{display:flex;gap:9px;flex-wrap:wrap;margin:16px 0}.button{border:1px solid var(--leaf);border-radius:999px;padding:10px 15px;background:var(--leaf);color:#fff;font:inherit;font-weight:700;cursor:pointer}.button.secondary{background:#fff;color:var(--leaf)}.button:disabled{opacity:.55}.list{display:grid;gap:10px;margin-top:16px}.credential{border:1px solid var(--line);border-radius:12px;padding:13px;background:#fff}.credential strong{display:block}.meta{font-size:.82rem;color:var(--muted);margin-top:5px}.status{min-height:1.4em;color:var(--muted)}a{color:var(--leaf)}@media(max-width:560px){.shell{padding:18px 12px}.card{padding:16px}.button{width:100%}}</style><script src="/calendar/staff-auth/passkeys/manage.js" defer></script></head><body><div class="shell"><main class="card"><span class="eyebrow">Shiloh security</span><h1>Passkeys</h1><p>Add more than one passkey if you use multiple devices. Revoking a passkey does not remove your existing authenticator or recovery fallback.</p><div class="actions"><button class="button" type="button" data-passkey-add>Add passkey</button><a class="button secondary" href="/calendar/workspace">Back to Workspace</a></div><div class="status" role="status" aria-live="polite" data-passkey-status></div><div class="list" data-passkey-list>${initialCredentialList(credentials)}</div><p>Registration and revocation require a recent strong sign-in. If Shiloh asks you to sign in again, use your authenticator or an existing passkey.</p></main></div></body></html>`;
}
function manageScript() {
  return `(function(){'use strict';
var add=document.querySelector('[data-passkey-add]'),list=document.querySelector('[data-passkey-list]'),status=document.querySelector('[data-passkey-status]');var csrf='';function msg(v){if(status)status.textContent=v||'';}function bytes(v){var s=String(v||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var raw=atob(s),a=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);return a.buffer;}function enc(v){if(v==null)return null;var a=new Uint8Array(v),s='';for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}function safe(r){return r.json().catch(function(){return {};});}function headers(){return {'Accept':'application/json','Content-Type':'application/json','X-CSRF-Token':csrf};}
async function ensureCsrf(){if(csrf)return csrf;var r=await fetch('/calendar/staff-auth/csrf',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json','Content-Type':'application/json'},body:'{}'});var b=await safe(r);if(!r.ok||!b.csrfToken)throw new Error('session');csrf=b.csrfToken;return csrf;}
function render(rows){list.textContent='';if(!rows.length){var p=document.createElement('p');p.textContent='No passkeys enrolled yet.';list.appendChild(p);return;}rows.forEach(function(row){var box=document.createElement('div');box.className='credential';var title=document.createElement('strong');title.textContent=row.revokedAt?'Revoked passkey':'Passkey';box.appendChild(title);var meta=document.createElement('div');meta.className='meta';meta.textContent='Added '+new Date(row.createdAt).toLocaleDateString()+(row.lastUsedAt?' · last used '+new Date(row.lastUsedAt).toLocaleDateString():'')+(row.backedUp?' · synced/backup capable':'');box.appendChild(meta);if(!row.revokedAt){var b=document.createElement('button');b.className='button secondary';b.type='button';b.textContent='Revoke';b.addEventListener('click',function(){revoke(row.id,b);});box.appendChild(b);}list.appendChild(box);});}
async function load(){var r=await fetch('/calendar/staff-auth/passkeys',{credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}});if(r.status===401){window.location.replace('/calendar/staff?reason=session');return;}var b=await safe(r);if(!r.ok)throw new Error('load');render(b.credentials||[]);}
async function register(){if(!window.PublicKeyCredential||!navigator.credentials){msg('Passkeys are not supported in this browser.');return;}add.disabled=true;try{await ensureCsrf();var r=await fetch('/calendar/staff-auth/passkeys/registration/options',{method:'POST',credentials:'same-origin',cache:'no-store',headers:headers(),body:'{}'});var b=await safe(r);if(r.status===428){msg('Sign in again with your authenticator or an existing passkey before adding a passkey.');return;}if(!r.ok)throw new Error('start');var o=b.options;o.challenge=bytes(o.challenge);o.user.id=bytes(o.user.id);(o.excludeCredentials||[]).forEach(function(c){c.id=bytes(c.id);});var c=await navigator.credentials.create({publicKey:o});if(!c)throw new Error('cancelled');var transports=c.response.getTransports?c.response.getTransports():[];var finish=await fetch('/calendar/staff-auth/passkeys/registration/finish',{method:'POST',credentials:'same-origin',cache:'no-store',headers:headers(),body:JSON.stringify({response:{id:c.id,rawId:enc(c.rawId),type:c.type,response:{clientDataJSON:enc(c.response.clientDataJSON),attestationObject:enc(c.response.attestationObject),transports:transports}}})});if(!finish.ok)throw new Error('finish');msg('Passkey added.');await load();}catch(error){if(error&&error.name==='NotAllowedError')msg('Passkey registration was cancelled or unavailable.');else msg('Passkey could not be added.');}finally{add.disabled=false;}}
async function revoke(id,button){button.disabled=true;try{await ensureCsrf();var r=await fetch('/calendar/staff-auth/passkeys/'+encodeURIComponent(id)+'/revoke',{method:'POST',credentials:'same-origin',cache:'no-store',headers:headers(),body:'{}'});if(r.status===428){msg('Sign in again with your authenticator or an existing passkey before revoking a passkey.');return;}if(!r.ok)throw new Error('revoke');msg('Passkey revoked.');await load();}catch(_){msg('Passkey could not be revoked.');}finally{button.disabled=false;}}
if(add)add.addEventListener('click',register);load().catch(function(){msg('Passkeys could not be loaded.');});
})();`;
}
module.exports = { signinPanel, signinScript, managePage, manageScript, initialCredentialList };
