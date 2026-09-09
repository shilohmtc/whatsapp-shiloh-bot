const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  PWA_BASE,
  STATIC_CACHE_NAME,
  ICON_URLS,
  workspacePwaManifest,
  decorateWorkspacePwaHtml,
  augmentWorkspacePwaCsp,
  workspacePwaServiceWorkerScript,
  workspacePwaClientScript,
} = require('../src/presentation/workspacePwa');
const {
  shouldDecoratePwaHtmlPath,
  pwaLaunchDestination,
} = require('../src/routes/workspacePwa');
const { normalizeReason, retireBrowserWhatsAppGuidance } = require('../src/routes/staffCalendarAccessUx');
const { renderStaffCalendarAccessPage } = require('../src/presentation/staffCalendarAccessUx');

test('#791 manifest installs one canonical Shiloh Workspace delivery shell', () => {
  const manifest = workspacePwaManifest();
  assert.equal(manifest.name, 'Shiloh');
  assert.equal(manifest.short_name, 'Shiloh');
  assert.equal(manifest.id, '/calendar/pwa/launch');
  assert.equal(manifest.start_url, '/calendar/pwa/launch');
  assert.equal(manifest.scope, '/calendar/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#17382d');
  assert.deepEqual(manifest.icons.map(icon => icon.src), [...ICON_URLS]);
  assert.ok(manifest.icons.some(icon => /maskable/.test(icon.purpose)));
  assert.doesNotMatch(JSON.stringify(manifest), /token|secret|credential|permission|capability|scope.*all_business/i);
});

test('#791 PWA metadata decorates existing HTML idempotently and only expands CSP for manifest/worker self', () => {
  const source = '<!doctype html><html><head><title>Workspace</title></head><body></body></html>';
  const once = decorateWorkspacePwaHtml(source);
  const twice = decorateWorkspacePwaHtml(once);
  assert.equal(once, twice);
  assert.match(once, new RegExp(`${PWA_BASE.replaceAll('/', '\\/')}\\/manifest\\.webmanifest`));
  assert.match(once, /apple-mobile-web-app-capable/);
  assert.match(once, /theme-color/);
  assert.match(once, /client\.js\?v=791-v1/);

  const original = "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
  const expanded = augmentWorkspacePwaCsp(original);
  assert.match(expanded, /manifest-src 'self'/);
  assert.match(expanded, /worker-src 'self'/);
  assert.match(expanded, /default-src 'none'/);
  assert.doesNotMatch(expanded, /https:|data:|blob:|\*/);
});

test('#791 service worker caches only inert versioned icon assets and never protected Workspace/API responses', () => {
  const worker = workspacePwaServiceWorkerScript();
  assert.match(STATIC_CACHE_NAME, /^shiloh-pwa-static-791-v1$/);
  assert.match(worker, /cache\.addAll\(STATIC_URLS\)/);
  assert.match(worker, /STATIC_URLS\.includes\(url\.pathname\+url\.search\)/);
  assert.match(worker, /request\.mode==='navigate'.*url\.pathname\.startsWith\('\/calendar\/'\)/s);
  assert.match(worker, /fetch\(request\)\.catch/);
  assert.match(worker, /Protected Workspace information is not stored for offline use/);
  assert.match(worker, /Cache-Control':'no-store/);
  assert.doesNotMatch(worker, /cache\.put\(|caches\.match\(request\).*calendar|localStorage|sessionStorage|indexedDB|BackgroundSync|\bpush\b/i);
  assert.doesNotMatch(worker, /staff-auth\/session|\/clients|\/team|\/messages|\/book|\/operations/);
});

test('#791 installed client revalidates only through canonical live staff session and persists no browser authority', () => {
  const client = workspacePwaClientScript();
  assert.match(client, /navigator\.serviceWorker\.register/);
  assert.match(client, /scope:'\/calendar\/'/);
  assert.match(client, /updateViaCache:'none'/);
  assert.match(client, /\/calendar\/staff-auth\/session/);
  assert.match(client, /credentials:'same-origin',cache:'no-store'/);
  assert.match(client, /reason=session/);
  assert.match(client, /reason=access/);
  assert.match(client, /totp\/manage/);
  assert.match(client, /SHILOH_ACTIVATE_UPDATE/);
  assert.match(client, /registration\.waiting/);
  assert.match(client, /addEventListener\('offline'/);
  assert.match(client, /addEventListener\('online'/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|indexedDB|document\.cookie|Authorization|Bearer\s|recoveryCode|totp_secret|csrfToken/i);
});

test('#791 canonical launch gate uses current server session state and never creates PWA authority', () => {
  assert.equal(pwaLaunchDestination(null), '/calendar/staff?reason=session');
  assert.equal(pwaLaunchDestination({ ok: false }), '/calendar/staff?reason=session');
  assert.equal(pwaLaunchDestination({ ok: true, recoveryRequired: true }), '/calendar/staff-auth/totp/manage');
  assert.equal(pwaLaunchDestination({ ok: true, viewer: null }), '/calendar/staff?reason=access');
  assert.equal(pwaLaunchDestination({ ok: true, viewer: { calendarScope: 'own_staff' } }), '/calendar/workspace');
});

test('#791 PWA metadata covers canonical Workspace/auth HTML surfaces without intercepting PWA assets', () => {
  for (const pathValue of ['/staff', '/staff-auth/totp/manage', '/workspace', '/clients/42', '/team', '/services', '/reports', '/messages', '/read-only']) {
    assert.equal(shouldDecoratePwaHtmlPath(pathValue), true, pathValue);
  }
  assert.equal(shouldDecoratePwaHtmlPath('/pwa/sw.js'), false);
  assert.equal(shouldDecoratePwaHtmlPath('/abc123.ics'), false);
});

test('#791 expired/revoked session remains explicit after retired WhatsApp browser guidance', () => {
  assert.equal(normalizeReason('session'), 'session');
  assert.equal(normalizeReason('access'), 'access');
  const sessionPage = retireBrowserWhatsAppGuidance(renderStaffCalendarAccessPage({ reason: 'session', providerIndependentAuthEnabled: true }));
  assert.match(sessionPage, /missing, expired, or revoked/i);
  assert.doesNotMatch(sessionPage, /Open from Shiloh WhatsApp/);
});

test('#791 integration is a delivery shell only: no auth/session/permission source or schema mutation is introduced', () => {
  const pwaRoute = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'workspacePwa.js'), 'utf8');
  const pwaPresentation = fs.readFileSync(path.join(__dirname, '..', 'src', 'presentation', 'workspacePwa.js'), 'utf8');
  const calendarRoute = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'calendar.js'), 'utf8');
  assert.match(calendarRoute, /createWorkspacePwaHtmlMiddleware/);
  assert.match(calendarRoute, /createWorkspacePwaRouter\(\{ sessionService: staffBrowserSessionService \}\)/);
  assert.match(pwaRoute, /createOptionalCalendarSessionMiddleware/);
  assert.doesNotMatch(pwaRoute + pwaPresentation, /INSERT INTO|UPDATE staff_|DELETE FROM|CREATE TABLE|ALTER TABLE|staff_admin_accounts|permissions\s*=|calendar_scope\s*=|service_scope\s*=/i);
  assert.doesNotMatch(pwaRoute + pwaPresentation, /passkey|webauthn|pushManager|showNotification|background sync|React Native|Flutter/i);
});
