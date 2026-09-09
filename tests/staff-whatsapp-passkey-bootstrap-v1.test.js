'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  bootstrapPolicy,
  evaluateBootstrapPrincipal,
  setupUrl,
  createStaffWhatsAppPasskeyBootstrapService,
} = require('../src/services/staffWhatsAppPasskeyBootstrap');
const {
  isGreetingOnly,
  createStaffWhatsAppPasskeyBootstrapMiddleware,
} = require('../src/middleware/staffWhatsAppPasskeyBootstrap');
const {
  withWhatsAppBootstrapGuidance,
  withFallbackDisclosure,
  bootstrapAwareSigninScript,
} = require('../src/routes/staffCalendarAccessUx');

const ENV = {
  NODE_ENV: 'test',
  SHILOH_STAFF_WHATSAPP_PASSKEY_BOOTSTRAP_ENABLED: 'true',
  SHILOH_STAFF_PASSKEY_AUTH_ENABLED: 'true',
  SHILOH_CALENDAR_PUBLIC_ORIGIN: 'https://shiloh.example',
  SHILOH_STAFF_WEBAUTHN_RP_ID: 'shiloh.example',
};

function principal(overrides = {}) {
  return {
    id: 44,
    staff_id: null,
    display_name: 'Christel',
    role: 'owner',
    business_role: 'owner',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: { 'appointment:view': true },
    admin_active: true,
    staff_status: null,
    ...overrides,
  };
}

class BootstrapDb {
  constructor(rows = [principal()]) {
    this.identityRows = rows;
    this.bootstraps = [];
    this.challenges = [];
    this.auditEvents = [];
  }
  async connect() { return this; }
  release() {}
  async query(sql, params = []) {
    const text = String(sql).replace(/\s+/g, ' ').trim();
    if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(text)) return { rows: [], rowCount: 0 };
    if (text.includes('FROM staff_admin_accounts a') && text.includes('a.normalized_whatsapp = $1')) return { rows: [...this.identityRows] };
    if (text.includes('FROM staff_admin_accounts a') && text.includes('a.id = $1')) {
      return { rows: this.identityRows.filter(row => Number(row.id) === Number(params[0])) };
    }
    if (text.includes('pg_advisory_xact_lock')) return { rows: [{ pg_advisory_xact_lock: null }] };
    if (text.includes('COUNT(*)::int AS count FROM staff_auth_passkey_bootstraps')) {
      return { rows: [{ count: this.bootstraps.filter(row => Number(row.admin_id) === Number(params[0])).length }] };
    }
    if (text.startsWith('UPDATE staff_auth_passkey_bootstraps SET revoked_at')) {
      for (const row of this.bootstraps) if (Number(row.admin_id) === Number(params[0]) && !row.consumed_at && !row.revoked_at) row.revoked_at = params[1];
      return { rows: [], rowCount: 1 };
    }
    if (text.startsWith('INSERT INTO staff_auth_passkey_bootstraps')) {
      this.bootstraps.push({ id: this.bootstraps.length + 1, admin_id: params[0], token_hash: params[1], issued_at: params[2], expires_at: params[3], consumed_at: null, revoked_at: null });
      return { rows: [], rowCount: 1 };
    }
    if (text.includes('FROM staff_auth_passkey_bootstraps') && text.includes('token_hash = $1')) {
      const row = this.bootstraps.find(item => item.token_hash === params[0]);
      return { rows: row ? [{ ...row }] : [] };
    }
    if (text.startsWith('UPDATE staff_auth_passkey_bootstraps SET consumed_at')) {
      const row = this.bootstraps.find(item => Number(item.id) === Number(params[0]));
      if (row) row.consumed_at = params[1];
      return { rows: [], rowCount: row ? 1 : 0 };
    }
    if (text.startsWith('UPDATE staff_auth_webauthn_challenges SET consumed_at')) {
      for (const row of this.challenges) if (Number(row.admin_id) === Number(params[0]) && row.purpose === 'bootstrap_registration' && !row.consumed_at) row.consumed_at = params[1];
      return { rows: [], rowCount: 1 };
    }
    if (text.includes('SELECT credential_id FROM staff_auth_passkey_credentials')) return { rows: [] };
    if (text.startsWith('INSERT INTO staff_auth_webauthn_challenges')) {
      this.challenges.push({ id: this.challenges.length + 1, challenge_hash: params[0], purpose: 'bootstrap_registration', admin_id: params[1], request_fingerprint_hash: params[2], expires_at: params[3], consumed_at: null });
      return { rows: [], rowCount: 1 };
    }
    if (text.startsWith('INSERT INTO staff_auth_security_events')) {
      this.auditEvents.push({ eventType: params[0], adminId: params[1], fingerprint: params[2], metadata: params[3] });
      return { rows: [], rowCount: 1 };
    }
    throw new Error(`Unhandled bootstrap test SQL: ${text}`);
  }
}

function deterministicRandom() {
  let seed = 1;
  return function randomBytes(size) {
    const value = seed++;
    return Buffer.alloc(size, value);
  };
}

test('#804 policy is separately gated and depends on released passkey authority', () => {
  assert.equal(bootstrapPolicy(ENV).operational, true);
  assert.equal(bootstrapPolicy({ ...ENV, SHILOH_STAFF_WHATSAPP_PASSKEY_BOOTSTRAP_ENABLED: 'false' }).operational, false);
  assert.equal(bootstrapPolicy({ ...ENV, SHILOH_STAFF_PASSKEY_AUTH_ENABLED: 'false' }).operational, false);
});

test('#804 bootstrap principal must be exact, active and already Workspace-enabled', () => {
  assert.equal(evaluateBootstrapPrincipal([]).matched, false);
  assert.equal(evaluateBootstrapPrincipal([principal(), principal({ id: 45 })]).code, 'STAFF_PASSKEY_BOOTSTRAP_AMBIGUOUS');
  assert.equal(evaluateBootstrapPrincipal([principal({ admin_active: false })]).eligible, false);
  assert.equal(evaluateBootstrapPrincipal([principal({ calendar_scope: 'none', permissions: {} })]).code, 'STAFF_PASSKEY_BOOTSTRAP_ACCESS_REQUIRED');
  const allowed = evaluateBootstrapPrincipal([principal()]);
  assert.equal(allowed.eligible, true);
  assert.equal(allowed.admin.id, 44);
});

test('#804 secure setup token stays in URL fragment and never in server request path/query', () => {
  const token = Buffer.alloc(32, 9).toString('base64url');
  const url = new URL(setupUrl(token, ENV));
  assert.equal(url.pathname, '/calendar/staff-auth/passkeys/bootstrap');
  assert.equal(url.search, '');
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('setup'), token);
});

test('#804 recognized eligible WhatsApp identity gets one-time token; redemption consumes it before WebAuthn', async () => {
  const db = new BootstrapDb();
  const service = createStaffWhatsAppPasskeyBootstrapService({ db, env: ENV, randomBytes: deterministicRandom(), now: () => new Date('2026-09-09T18:00:00Z') });
  const issued = await service.issueBootstrap({ whatsapp: '27721234567' });
  assert.equal(issued.ok, true);
  assert.equal(issued.handled, true);
  assert.equal(issued.eligible, true);
  assert.match(issued.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(db.bootstraps.length, 1);
  assert.equal(db.bootstraps[0].token_hash.includes(issued.token), false);
  assert.equal(db.auditEvents[0].eventType, 'passkey_bootstrap_issued');
  assert.doesNotMatch(JSON.stringify(db.auditEvents), new RegExp(issued.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  const started = await service.startRegistration({ token: issued.token, requestFingerprintHash: 'a'.repeat(64) });
  assert.equal(started.ok, true);
  assert.equal(db.bootstraps[0].consumed_at instanceof Date, true);
  assert.equal(started.options.authenticatorSelection.authenticatorAttachment, 'platform');
  assert.equal(started.options.authenticatorSelection.residentKey, 'discouraged');
  assert.equal(started.options.authenticatorSelection.requireResidentKey, false);
  assert.equal(started.options.authenticatorSelection.userVerification, 'required');
  assert.equal(db.challenges[0].purpose, 'bootstrap_registration');
  assert.equal(Number(db.challenges[0].admin_id), 44);

  const replay = await service.startRegistration({ token: issued.token, requestFingerprintHash: 'a'.repeat(64) });
  assert.equal(replay.ok, false);
  assert.equal(replay.code, 'STAFF_PASSKEY_BOOTSTRAP_INVALID');
});

test('#804 access removal between WhatsApp issuance and redemption fails closed', async () => {
  const db = new BootstrapDb();
  const service = createStaffWhatsAppPasskeyBootstrapService({ db, env: ENV, randomBytes: deterministicRandom(), now: () => new Date('2026-09-09T18:00:00Z') });
  const issued = await service.issueBootstrap({ whatsapp: '27721234567' });
  db.identityRows = [principal({ admin_active: false })];
  const started = await service.startRegistration({ token: issued.token, requestFingerprintHash: 'b'.repeat(64) });
  assert.equal(started.ok, false);
  assert.equal(started.code, 'STAFF_PASSKEY_BOOTSTRAP_INVALID');
});

test('#804 unknown WhatsApp greeting remains on the existing client flow; eligible greeting is handled by existing sender seam', async () => {
  assert.equal(isGreetingOnly('Hi!'), true);
  assert.equal(isGreetingOnly('I need an appointment'), false);

  let nextCount = 0;
  const unknown = createStaffWhatsAppPasskeyBootstrapMiddleware({
    bootstrapService: { issueBootstrap: async () => ({ ok: true, handled: false }) },
    sendMessage: async () => { throw new Error('must not send'); },
  });
  await unknown({ body: { entry: [{ changes: [{ value: { messages: [{ type: 'text', from: '2772', text: { body: 'Hi' } }] } }] }] } }, {}, () => { nextCount += 1; });
  assert.equal(nextCount, 1);

  const sends = [];
  const eligible = createStaffWhatsAppPasskeyBootstrapMiddleware({
    bootstrapService: { issueBootstrap: async () => ({ ok: true, handled: true, eligible: true, displayName: 'Christel', url: 'https://shiloh.example/calendar/staff-auth/passkeys/bootstrap#setup=secret' }) },
    sendMessage: async (to, body) => sends.push({ to, body }),
  });
  const res = { status: null, sendStatus(value) { this.status = value; return this; } };
  await eligible({ body: { entry: [{ changes: [{ value: { messages: [{ type: 'text', from: '2772', text: { body: 'Hi' } }] } }] }] } }, log: { error() {} } }, res, () => { throw new Error('must not fall through'); });
  assert.equal(res.status, 200);
  assert.equal(sends.length, 1);
  assert.match(sends[0].body, /Set up Shiloh securely/);
});

test('#804 migration isolates ordinary passkey bootstrap from break-glass/reset authority', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'migrations', '113_staff_whatsapp_passkey_bootstrap_v1.sql'), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS staff_auth_passkey_bootstraps/);
  assert.match(migration, /bootstrap_registration/);
  assert.doesNotMatch(migration, /ALTER TABLE staff_auth_break_glass_bootstraps/);
  assert.doesNotMatch(migration, /UPDATE staff_admin_accounts|permissions\s*=|calendar_scope\s*=|service_scope\s*=/i);
});

test('#804 bootstrap route cannot issue a Workspace session until successful passkey finish', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'staffPasskeyBootstrap.js'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'staffWhatsAppPasskeyBootstrap.js'), 'utf8');
  assert.match(route, /router\.post\('\/bootstrap\/start', sameOrigin/);
  assert.match(route, /router\.post\('\/bootstrap\/finish', sameOrigin/);
  assert.match(service, /verifyRegistrationResponse/);
  const verifyAt = service.indexOf('verified = verifyRegistrationResponse');
  const sessionAt = service.indexOf('const issued = await issueStaffBrowserSession');
  assert.ok(verifyAt >= 0 && sessionAt > verifyAt, 'canonical browser session must be issued only after WebAuthn verification');
  assert.doesNotMatch(service, /UPDATE staff_admin_accounts|INSERT INTO staff_admin_accounts|permissions\s*=|calendar_scope\s*=|service_scope\s*=/i);
});

test('#804 sign-in UX makes WhatsApp bootstrap normal and Authenticator/Recovery secondary', () => {
  const base = '<section data-shiloh-provider-independent-auth><h2>Use your authenticator</h2><details><summary>Use a recovery code</summary></details>\n      </section>';
  const guided = withWhatsAppBootstrapGuidance(base);
  assert.match(guided, /First time \/ new device/);
  assert.match(guided, /send <code>Hi<\/code> to Shiloh/);
  const folded = withFallbackDisclosure(guided);
  assert.match(folded, /Use another sign-in method/);
  assert.match(folded, /data-shiloh-fallback-auth/);
  const script = bootstrapAwareSigninScript(ENV);
  assert.match(script, /Send “Hi” to Shiloh on WhatsApp/);
});

test('#804 bootstrap presentation persists no browser authority or setup token', () => {
  const presentation = fs.readFileSync(path.join(__dirname, '..', 'src', 'presentation', 'staffPasskeyBootstrapUx.js'), 'utf8');
  assert.match(presentation, /history\.replaceState/);
  assert.doesNotMatch(presentation, /localStorage|sessionStorage|indexedDB|document\.cookie|Authorization|Bearer/i);
});
