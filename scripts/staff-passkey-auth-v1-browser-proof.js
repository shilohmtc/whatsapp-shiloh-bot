const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const https = require('node:https');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { execFile, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const { promisify } = require('node:util');
const express = require('express');
const requestContext = require('../src/middleware/requestContext');
const { serializeSessionCookie } = require('../src/middleware/staffBrowserSession');
const { createStaffCalendarAccessRouter } = require('../src/routes/staffCalendarAccessUx');
const { renderStaffCalendarAccessPage } = require('../src/presentation/staffCalendarAccessUx');
const { createStaffPasskeyAuthRouter, serializePasskeyHintCookie } = require('../src/routes/staffPasskeyAuth');

const execFileAsync = promisify(execFile);
const OUT_DIR = path.join(process.cwd(), 'artifacts', 'staff-passkey-auth-v1');
const TOKEN = 'P'.repeat(43);
const DEVICE_CREDENTIAL_HINT = Buffer.alloc(32, 7).toString('base64url');
function chromeExecutable() { return [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(v => v && fs.existsSync(v)) || null; }
function sha(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function cert(dir) { const key = path.join(dir,'key.pem'), crt = path.join(dir,'cert.pem'); const r=spawnSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',crt,'-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1','-days','1'],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);return{key:fs.readFileSync(key),cert:fs.readFileSync(crt)}; }
async function port(){const s=net.createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const p=s.address().port;await new Promise((resolve,reject)=>s.close(e=>e?reject(e):resolve()));return p;}
async function chromeRun(chrome,args){try{const r=await execFileAsync(chrome,['--headless=new','--no-sandbox','--disable-gpu','--ignore-certificate-errors','--allow-insecure-localhost','--disable-dev-shm-usage',...args],{encoding:'utf8',timeout:60000,maxBuffer:10*1024*1024});return r.stdout||'';}catch(e){throw new Error(e.stderr||e.stdout||e.message);}}
function fixture(origin){
  const env={NODE_ENV:'production',SHILOH_CALENDAR_READONLY_UX_ENABLED:'true',SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED:'true',SHILOH_STAFF_PASSKEY_AUTH_ENABLED:'true',SHILOH_CALENDAR_PUBLIC_ORIGIN:origin,SHILOH_STAFF_WEBAUTHN_RP_ID:'localhost'};
  const sessionService={
    async validateSessionToken(token){return token===TOKEN?{ok:true,sessionId:794,adminId:1794,authenticatedAt:new Date(),authMethod:'totp',recoveryRequired:false,viewer:{calendarScope:'own_staff',staffId:94}}:{ok:false,code:'STAFF_SESSION_INVALID'};},
    async validateCsrfToken(){return true;},async rotateCsrfToken(){return{ok:true,csrfToken:'C'.repeat(43)}}
  };
  const passkeyService={
    policy(){return{enabled:true,operational:true,origin,rpId:'localhost'};},
    async knownPrincipal({credentialIdHint}={}){return credentialIdHint===DEVICE_CREDENTIAL_HINT?{ok:true,adminId:1794,displayName:'Jean-Pierre',credentialId:DEVICE_CREDENTIAL_HINT,transports:['internal']}:{ok:false,code:'STAFF_PASSKEY_KNOWN_PRINCIPAL_REQUIRED'};},
    async listCredentials(){return{ok:true,credentials:[{id:1,transports:['internal'],backedUp:false,createdAt:'2026-09-09T12:00:00Z',lastUsedAt:'2026-09-09T13:00:00Z',revokedAt:null},{id:2,transports:['internal'],backedUp:false,createdAt:'2026-09-08T12:00:00Z',lastUsedAt:null,revokedAt:'2026-09-09T12:30:00Z'}]};}
  };
  const app=express();app.use(requestContext);app.use(express.json());
  app.use('/calendar/staff',createStaffCalendarAccessRouter({env,renderPage(options){return renderStaffCalendarAccessPage({...options,providerIndependentAuthEnabled:true});}}));
  app.use('/calendar/staff-auth/passkeys',createStaffPasskeyAuthRouter({env,sessionService,passkeyService}));
  app.get('/proof-known',(_req,res)=>{res.setHeader('Set-Cookie',serializePasskeyHintCookie(DEVICE_CREDENTIAL_HINT,{env}));res.redirect(302,'/calendar/staff');});
  app.get('/proof-auth',(_req,res)=>{res.setHeader('Set-Cookie',serializeSessionCookie(TOKEN,{env,maxAgeSeconds:3600}));res.redirect(302,'/calendar/staff-auth/passkeys/manage');});
  app.get('/calendar/workspace',(_req,res)=>res.type('html').send('<!doctype html><meta name="viewport" content="width=device-width"><title>Workspace</title><h1>Workspace</h1>'));
  return app;
}
async function main(){const chrome=chromeExecutable();if(!chrome)throw new Error('Chrome/Chromium is required for #794 browser proof');fs.rmSync(OUT_DIR,{recursive:true,force:true});fs.mkdirSync(OUT_DIR,{recursive:true});const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'shiloh-passkey-proof-'));const c=cert(tmp);const p=await port();const origin=`https://localhost:${p}`;const server=https.createServer(c,fixture(origin));server.listen(p,'127.0.0.1');await once(server,'listening');try{
  const phoneProfile=path.join(tmp,'phone');const phonePng=path.join(OUT_DIR,'phone-390x844-passkey-entry.png');await chromeRun(chrome,[`--user-data-dir=${phoneProfile}`,'--window-size=390,844','--virtual-time-budget=1200',`--screenshot=${phonePng}`,`${origin}/proof-known`]);const phoneDom=await chromeRun(chrome,[`--user-data-dir=${phoneProfile}`,'--window-size=390,844','--virtual-time-budget=1200','--dump-dom',`${origin}/calendar/staff`]);const passkeyPanel=(phoneDom.match(/<section class="section" data-shiloh-passkey-panel(?:="")?>[\s\S]*?<\/section>/)||[''])[0];assert.match(passkeyPanel,/Continue as Jean-Pierre/);assert.match(passkeyPanel,/secure WebAuthn credential registered for this device/i);assert.match(phoneDom,/Use your authenticator/);assert.doesNotMatch(passkeyPanel,/082 123 4567|staff-totp-whatsapp|staff-recovery-whatsapp/);
  const desktopProfile=path.join(tmp,'desktop');const desktopPng=path.join(OUT_DIR,'desktop-1440x900-passkey-management.png');await chromeRun(chrome,[`--user-data-dir=${desktopProfile}`,'--window-size=1440,900',`--screenshot=${desktopPng}`,`${origin}/proof-auth`]);const desktopDom=await chromeRun(chrome,[`--user-data-dir=${desktopProfile}`,'--window-size=1440,900','--virtual-time-budget=800','--dump-dom',`${origin}/proof-auth`]);assert.match(desktopDom,/<h1>Passkeys<\/h1>/);assert.match(desktopDom,/Add passkey/);assert.match(desktopDom,/Revoked passkey/);assert.doesNotMatch(desktopDom,/normalized_whatsapp|session token|recovery code: [A-F0-9]/i);
  const report={issue:794,syntheticOnly:true,productionCredentialMutation:false,phone:{viewport:'390x844',knownPrincipal:'Jean-Pierre',deviceCredentialHintOnly:true,fallbackAuthenticatorPreserved:true,screenshot:path.basename(phonePng),sha256:sha(phonePng)},desktop:{viewport:'1440x900',authenticatedPasskeyLifecycle:true,multipleAuthenticators:true,screenshot:path.basename(desktopPng),sha256:sha(desktopPng)},pwaShellRegression:'Workspace PWA V1 Proof workflow runs on the same exact head; this proof adds #794 remembered-device entry/lifecycle composition.',platformLimitation:'Headless Chromium proves the remembered-principal/device-targeted UX. Cryptographic registration/assertion and device-hint invariants are exercised by focused security tests; OS biometric/FIDO chooser chrome remains platform-controlled.'};fs.writeFileSync(path.join(OUT_DIR,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await new Promise(r=>server.close(r));fs.rmSync(tmp,{recursive:true,force:true});}}
main().catch(e=>{console.error(e);process.exitCode=1;});
