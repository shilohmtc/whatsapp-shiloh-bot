const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');
const express = require('express');
const OTPAuth = require('otpauth');

const auth = require('../src/services/providerIndependentStaffAuth');
const sessions = require('../src/services/staffBrowserSession');
const sessionMiddleware = require('../src/middleware/staffBrowserSession');
const requestContext = require('../src/middleware/requestContext');
const logger = require('../src/lib/logger');
const { createStaffBrowserSessionRouter } = require('../src/routes/staffBrowserSession');
const {
  renderProviderIndependentStaffAuthPage,
  providerIndependentStaffAuthClientScript,
} = require('../src/presentation/providerIndependentStaffAuthUx');

const FIXED_NOW = new Date('2026-08-25T12:00:00.000Z');

function deterministicRandom() {
  let value = 1;
  return (size) => {
    const result = Buffer.alloc(size, value);
    value = value === 254 ? 1 : value + 1;
    return result;
  };
}

function enabledEnv(ids = '1,2') {
  return {
    SHILOH_STAFF_TOTP_AUTH_ENABLED: 'true',
    SHILOH_STAFF_TOTP_PILOT_ADMIN_IDS: ids,
    SHILOH_STAFF_TOTP_ACTIVE_KEY_VERSION: 'v1',
    SHILOH_STAFF_TOTP_ENCRYPTION_KEYS_JSON: JSON.stringify({ v1: Buffer.alloc(32, 42).toString('base64url') }),
    SHILOH_CALENDAR_PUBLIC_ORIGIN: 'https://calendar.shiloh.example',
  };
}

function canonicalAdmin(overrides = {}) {
  return {
    id: 1,
    staff_id: null,
    display_name: 'Jean-Pierre',
    role: 'admin',
    business_role: 'business_admin',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: { 'staff_auth:reset': true },
    admin_active: true,
    staff_status: null,
    normalized_whatsapp: '27725128605',
    ...overrides,
  };
}

function activeCredential(adminId, secret, env = enabledEnv()) {
  const keyring = auth.parseEncryptionKeyring(env);
  const encrypted = auth.encryptTotpSecret(secret, adminId, keyring, () => Buffer.alloc(12, 8));
  return {
    admin_id: adminId,
    status: 'active',
    secret_ciphertext: encrypted.ciphertext,
    secret_nonce: encrypted.nonce,
    secret_auth_tag: encrypted.authTag,
    secret_key_version: encrypted.keyVersion,
    confirmed_at: FIXED_NOW,
    last_accepted_timestep: null,
    failure_window_started_at: null,
    failed_attempt_count: 0,
    locked_until: null,
    recovery_generation: 1,
    replacement_required_at: null,
  };
}

function memoryDb({
  admins = [canonicalAdmin()],
  credentials = [],
  recoveryCodes = [],
  sessions: seededSessions = [],
  forceTotpAdvanceMiss = false,
} = {}) {
  const state = {
    admins: new Map(admins.map((admin) => [Number(admin.id), { ...admin }])),
    credentials: new Map(credentials.map((credential) => [Number(credential.admin_id), { ...credential }])),
    recoveryCodes: recoveryCodes.map((item, index) => ({ id: index + 1, consumed_at: null, revoked_at: null, ...item })),
    rate: new Map(),
    sessions: seededSessions.map((item) => ({ ...item })),
    breakGlass: [],
    audits: [],
    calls: [],
    totpAdvanceTransitions: 0,
    recoveryConsumptionTransitions: 0,
  };
  let transactionTail = Promise.resolve();

  const client = {
    async query(sql, params = []) {
      const q = String(sql).replace(/\s+/g, ' ').trim();
      state.calls.push({ sql: q, params });
      if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(q) || q.includes('pg_advisory_xact_lock')) return { rows: [], rowCount: 0 };
      if (q.includes('FROM staff_admin_accounts a')) {
        let rows;
        if (q.includes('a.normalized_whatsapp = $1')) rows = [...state.admins.values()].filter((item) => item.normalized_whatsapp === params[0]);
        else rows = [state.admins.get(Number(params[0]))].filter(Boolean);
        return { rows: rows.map((item) => ({ ...item })), rowCount: rows.length };
      }
      if (q.startsWith('SELECT * FROM staff_totp_credentials')) {
        const row = state.credentials.get(Number(params[0]));
        return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
      }
      if (q.startsWith('SELECT window_started_at')) {
        const row = state.rate.get(params[0]);
        return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
      }
      if (q.startsWith('INSERT INTO staff_auth_security_events')) {
        state.audits.push({ eventType: params[0], operatorAdminId: params[1], subjectAdminId: params[2], authMethod: params[3], reason: params[4], fingerprint: params[5], metadata: JSON.parse(params[6]) });
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('UPDATE staff_totp_credentials SET last_accepted_timestep')) {
        if (forceTotpAdvanceMiss) return { rows: [], rowCount: 0 };
        const row = state.credentials.get(Number(params[0]));
        if (row && (row.last_accepted_timestep == null || Number(row.last_accepted_timestep) < Number(params[1]))) {
          row.last_accepted_timestep = Number(params[1]); row.updated_at = params[2]; state.totpAdvanceTransitions += 1; return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      if (q.startsWith('UPDATE staff_totp_credentials SET failure_window_started_at = NULL')) {
        Object.assign(state.credentials.get(Number(params[0])), { failure_window_started_at: null, failed_attempt_count: 0, locked_until: null, updated_at: params[1] });
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('UPDATE staff_totp_credentials SET failure_window_started_at = $2')) {
        Object.assign(state.credentials.get(Number(params[0])), { failure_window_started_at: params[1], failed_attempt_count: params[2], locked_until: params[3], updated_at: params[4] });
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('INSERT INTO staff_auth_rate_limits')) {
        state.rate.set(params[0], { window_started_at: params[1], failed_attempt_count: params[2], locked_until: params[3], updated_at: params[4] });
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('DELETE FROM staff_auth_rate_limits')) {
        state.rate.delete(params[0]);
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('SELECT id FROM staff_browser_sessions')) {
        const active = state.sessions.filter((item) => item.admin_id === Number(params[0]) && !item.revoked_at).at(-1);
        return { rows: active ? [{ id: active.id }] : [], rowCount: active ? 1 : 0 };
      }
      if (q.startsWith('UPDATE staff_browser_sessions SET revoked_at = $2') || q.startsWith('UPDATE staff_browser_sessions SET revoked_at = COALESCE')) {
        let count = 0;
        for (const item of state.sessions) if (item.admin_id === Number(params[0]) && !item.revoked_at) { item.revoked_at = params[1]; item.revoke_reason = q.includes('credential_reset') ? 'credential_reset' : q.includes('break_glass') ? 'break_glass' : 'rotated'; count += 1; }
        return { rows: [], rowCount: count };
      }
      if (q.startsWith('INSERT INTO staff_browser_sessions')) {
        const item = { id: state.sessions.length + 1, admin_id: Number(params[0]), token_hash: params[1], csrf_hash: params[2], issued_at: params[3], expires_at: params[4], rotated_from_session_id: params[5], auth_method: params[7], recovery_required: params[8], revoked_at: null };
        state.sessions.push(item);
        return { rows: [{ id: item.id }], rowCount: 1 };
      }
      if (q.startsWith('INSERT INTO staff_totp_credentials')) {
        const existing = state.credentials.get(Number(params[0])) || { admin_id: Number(params[0]), status: 'pending', recovery_generation: 0, failed_attempt_count: 0 };
        Object.assign(existing, { pending_secret_ciphertext: params[1], pending_secret_nonce: params[2], pending_secret_auth_tag: params[3], pending_secret_key_version: params[4], enrollment_started_at: params[5], enrollment_expires_at: params[6], status: existing.status === 'active' ? 'active' : 'pending' });
        state.credentials.set(Number(params[0]), existing);
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('UPDATE staff_auth_recovery_codes SET revoked_at')) {
        let count = 0;
        for (const item of state.recoveryCodes) if (item.admin_id === Number(params[0]) && !item.consumed_at && !item.revoked_at) { item.revoked_at = params[1]; count += 1; }
        return { rows: [], rowCount: count };
      }
      if (q.startsWith('INSERT INTO staff_auth_recovery_codes')) {
        state.recoveryCodes.push({ id: state.recoveryCodes.length + 1, admin_id: Number(params[0]), generation: Number(params[1]), code_hash: params[2], created_at: params[3], consumed_at: null, revoked_at: null });
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('UPDATE staff_totp_credentials SET status = \'active\'')) {
        const row = state.credentials.get(Number(params[0]));
        Object.assign(row, { status: 'active', secret_ciphertext: row.pending_secret_ciphertext, secret_nonce: row.pending_secret_nonce, secret_auth_tag: row.pending_secret_auth_tag, secret_key_version: row.pending_secret_key_version, pending_secret_ciphertext: null, pending_secret_nonce: null, pending_secret_auth_tag: null, pending_secret_key_version: null, enrollment_started_at: null, enrollment_expires_at: null, confirmed_at: params[1], last_accepted_timestep: Number(params[2]), recovery_generation: Number(params[3]), replacement_required_at: null, failed_attempt_count: 0, locked_until: null });
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('UPDATE staff_browser_sessions SET recovery_required = FALSE')) return { rows: [], rowCount: 1 };
      if (q.startsWith('SELECT id, code_hash FROM staff_auth_recovery_codes')) {
        const rows = state.recoveryCodes.filter((item) => item.admin_id === Number(params[0]) && item.generation === Number(params[1]) && !item.consumed_at && !item.revoked_at);
        return { rows: rows.map((item) => ({ id: item.id, code_hash: item.code_hash })), rowCount: rows.length };
      }
      if (q.startsWith('UPDATE staff_auth_recovery_codes SET consumed_at')) {
        const row = state.recoveryCodes.find((item) => item.id === Number(params[0]) && !item.consumed_at && !item.revoked_at);
        if (!row) return { rows: [], rowCount: 0 };
        row.consumed_at = params[1]; state.recoveryConsumptionTransitions += 1; return { rows: [{ id: row.id }], rowCount: 1 };
      }
      if (q.startsWith('UPDATE staff_totp_credentials SET replacement_required_at')) {
        const row = state.credentials.get(Number(params[0])); row.replacement_required_at = row.replacement_required_at || params[1]; return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('UPDATE staff_auth_break_glass_bootstraps SET revoked_at')) {
        let count = 0;
        for (const item of state.breakGlass) if (item.admin_id === Number(params[0]) && !item.consumed_at && !item.revoked_at) { item.revoked_at = params[1]; count += 1; }
        return { rows: [], rowCount: count };
      }
      if (q.startsWith('INSERT INTO staff_auth_break_glass_bootstraps')) {
        state.breakGlass.push({ id: state.breakGlass.length + 1, admin_id: Number(params[0]), token_hash: params[1], issued_at: params[2], expires_at: params[3], operator_reference: params[4], control_reference: params[5], consumed_at: null, revoked_at: null });
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('SELECT id, admin_id, expires_at, consumed_at, revoked_at, operator_reference, control_reference FROM staff_auth_break_glass_bootstraps')) {
        const row = state.breakGlass.find((item) => item.token_hash === params[0]);
        return { rows: row ? [{ ...row }] : [], rowCount: row ? 1 : 0 };
      }
      if (q.startsWith('UPDATE staff_auth_break_glass_bootstraps SET consumed_at')) {
        const row = state.breakGlass.find((item) => item.id === Number(params[0]) && !item.consumed_at && !item.revoked_at);
        if (!row) return { rows: [], rowCount: 0 };
        row.consumed_at = params[1]; return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('UPDATE staff_totp_credentials SET recovery_generation')) {
        const row = state.credentials.get(Number(params[0])); row.recovery_generation = Number(params[1]); return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('UPDATE staff_totp_credentials SET status = \'disabled\'')) {
        const row = state.credentials.get(Number(params[0]));
        if (row) Object.assign(row, { status: 'disabled', secret_ciphertext: null, secret_nonce: null, secret_auth_tag: null, secret_key_version: null, replacement_required_at: params[1], disabled_at: params[1], disabled_reason: params[2] });
        return { rows: [], rowCount: row ? 1 : 0 };
      }
      throw new Error(`Unhandled test SQL: ${q}`);
    },
    release() {},
  };

  function transactionClient() {
    let releaseTransaction = null;
    return {
      async query(sql, params = []) {
        const q = String(sql).replace(/\s+/g, ' ').trim();
        if (q === 'BEGIN') {
          const previous = transactionTail;
          let unlock;
          transactionTail = new Promise((resolve) => { unlock = resolve; });
          await previous;
          releaseTransaction = unlock;
        }
        try {
          return await client.query(sql, params);
        } finally {
          if ((q === 'COMMIT' || q === 'ROLLBACK') && releaseTransaction) {
            const unlock = releaseTransaction;
            releaseTransaction = null;
            unlock();
          }
        }
      },
      release() {
        if (releaseTransaction) {
          const unlock = releaseTransaction;
          releaseTransaction = null;
          unlock();
        }
      },
    };
  }

  return {
    ...state,
    get totpAdvanceTransitions() { return state.totpAdvanceTransitions; },
    get recoveryConsumptionTransitions() { return state.recoveryConsumptionTransitions; },
    query: client.query.bind(client),
    async connect() { return transactionClient(); },
  };
}

async function withHttpServer(app, run) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test('feature control and incomplete configuration fail closed by default', () => {
  assert.equal(auth.providerIndependentAuthPolicy({}).enabled, false);
  assert.equal(auth.providerIndependentAuthPolicy({ SHILOH_STAFF_TOTP_AUTH_ENABLED: 'true' }).operational, false);
  assert.equal(auth.providerIndependentAuthPolicy(enabledEnv()).operational, true);
});

test('TOTP secret is 160-bit and AES-256-GCM storage is versioned, authenticated, and not plaintext', () => {
  const env = enabledEnv();
  const keyring = auth.parseEncryptionKeyring(env);
  const secret = new OTPAuth.Secret({ buffer: Buffer.alloc(auth.TOTP_SECRET_BYTES, 7) }).base32;
  const encrypted = auth.encryptTotpSecret(secret, 1, keyring, () => Buffer.alloc(12, 9));
  assert.equal(auth.TOTP_SECRET_BYTES, 20);
  assert.equal(encrypted.keyVersion, 'v1');
  assert.notEqual(encrypted.ciphertext, secret);
  assert.equal(auth.decryptTotpSecret({ ciphertext: encrypted.ciphertext, nonce: encrypted.nonce, authTag: encrypted.authTag, keyVersion: encrypted.keyVersion }, 1, keyring), secret);
  assert.throws(() => auth.decryptTotpSecret({ ciphertext: encrypted.ciphertext, nonce: encrypted.nonce, authTag: encrypted.authTag, keyVersion: encrypted.keyVersion }, 2, keyring), /DECRYPTION_FAILED/);
});

test('valid RFC 6238 SHA-1 six-digit TOTP creates the existing opaque session with canonical authorization', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const db = memoryDb({ credentials: [activeCredential(1, secret, env)], sessions: [{ id: 1, admin_id: 1, revoked_at: null }] });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW, randomBytes: deterministicRandom() });
  const code = auth.createTotp(secret).generate({ timestamp: FIXED_NOW.getTime() });
  const result = await service.verifyTotp({ identifier: '+27 72 512 8605', code, requestFingerprintHash: 'a'.repeat(64) });
  assert.equal(result.ok, true);
  assert.deepEqual(result.viewer, { calendarScope: 'business_all_staff' });
  assert.match(result.sessionToken, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(db.sessions[0].revoke_reason, 'rotated');
  assert.equal(db.sessions[1].token_hash, sessions.sha256(result.sessionToken));
  assert.equal(db.sessions[1].rotated_from_session_id, 1);
  assert.equal(db.sessions[1].auth_method, 'totp');
  assert.equal(db.audits.some((event) => event.eventType === 'totp_verification_succeeded'), true);
});

test('invalid and malformed TOTP fail closed without session creation', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  for (const code of ['000000', '12345x']) {
    const db = memoryDb({ credentials: [activeCredential(1, secret, env)] });
    const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW });
    const result = await service.verifyTotp({ identifier: '27725128605', code, requestFingerprintHash: 'b'.repeat(64) });
    assert.equal(result.ok, false);
    assert.equal(db.sessions.length, 0);
  }
});

test('missing or corrupt encrypted authenticator state fails closed with sanitized audit evidence', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const credential = activeCredential(1, secret, env);
  credential.secret_auth_tag = Buffer.alloc(16, 99).toString('base64url');
  const db = memoryDb({ credentials: [credential] });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW });
  const result = await service.verifyTotp({ identifier: '27725128605', code: '123456', requestFingerprintHash: '1'.repeat(64) });
  assert.equal(result.code, 'STAFF_TOTP_UNAVAILABLE');
  assert.equal(db.sessions.length, 0);
  const event = db.audits.find((item) => item.eventType === 'totp_secret_unavailable');
  assert.ok(event);
  assert.equal(JSON.stringify(event).includes(secret), false);
});

test('bounded clock skew accepts previous timestep but rejects an older timestep', () => {
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const totp = auth.createTotp(secret);
  const previous = totp.generate({ timestamp: FIXED_NOW.getTime() - 30_000 });
  const old = totp.generate({ timestamp: FIXED_NOW.getTime() - 60_000 });
  assert.notEqual(auth.validateTotp(secret, previous, FIXED_NOW.getTime()), null);
  assert.equal(auth.validateTotp(secret, old, FIXED_NOW.getTime()), null);
});

test('same-timestep replay is rejected after the first atomic acceptance', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const db = memoryDb({ credentials: [activeCredential(1, secret, env)] });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW, randomBytes: deterministicRandom() });
  const code = auth.createTotp(secret).generate({ timestamp: FIXED_NOW.getTime() });
  assert.equal((await service.verifyTotp({ identifier: '27725128605', code })).ok, true);
  const replay = await service.verifyTotp({ identifier: '27725128605', code });
  assert.equal(replay.ok, false);
  assert.equal(db.audits.some((event) => event.eventType === 'totp_replay_rejected'), true);
});

test('concurrent TOTP replay permits one authentication and advances the timestep exactly once', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const db = memoryDb({ credentials: [activeCredential(1, secret, env)] });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW, randomBytes: deterministicRandom() });
  const code = auth.createTotp(secret).generate({ timestamp: FIXED_NOW.getTime() });

  const results = await Promise.all([
    service.verifyTotp({ identifier: '27725128605', code, requestFingerprintHash: '1'.repeat(64) }),
    service.verifyTotp({ identifier: '27725128605', code, requestFingerprintHash: '2'.repeat(64) }),
  ]);

  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.filter((result) => !result.ok && result.code === 'STAFF_AUTH_INVALID').length, 1);
  assert.equal(db.sessions.length, 1);
  assert.equal(db.totpAdvanceTransitions, 1);
  assert.equal(db.credentials.get(1).last_accepted_timestep, Math.floor(FIXED_NOW.getTime() / 1000 / auth.TOTP_PERIOD_SECONDS));
  assert.equal(db.audits.filter((event) => event.eventType === 'totp_replay_rejected').length, 1);
});

test('a lost TOTP compare-and-update fails closed, audits replay, and cannot issue a session', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const db = memoryDb({ credentials: [activeCredential(1, secret, env)], forceTotpAdvanceMiss: true });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW, randomBytes: deterministicRandom() });
  const code = auth.createTotp(secret).generate({ timestamp: FIXED_NOW.getTime() });

  const result = await service.verifyTotp({ identifier: '27725128605', code, requestFingerprintHash: '3'.repeat(64) });

  assert.equal(result.ok, false);
  assert.equal(result.code, 'STAFF_AUTH_INVALID');
  assert.equal(db.sessions.length, 0);
  assert.equal(db.totpAdvanceTransitions, 0);
  assert.equal(db.audits.filter((event) => event.eventType === 'totp_replay_rejected').length, 1);
});

test('per-account and per-source failures escalate into temporary lockout', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const db = memoryDb({ credentials: [activeCredential(1, secret, env)] });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW });
  let result;
  for (let attempt = 0; attempt < 3; attempt += 1) result = await service.verifyTotp({ identifier: '27725128605', code: '000000', requestFingerprintHash: 'c'.repeat(64) });
  assert.equal(result.code, 'STAFF_AUTH_RATE_LIMITED');
  assert.ok(new Date(db.rate.get('c'.repeat(64)).locked_until).getTime() > FIXED_NOW.getTime());
  assert.equal(db.audits.some((event) => event.eventType === 'authentication_rate_limited'), true);
});

test('per-account lockout is independent of source throttling and expires after the bounded lock', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const db = memoryDb({ credentials: [activeCredential(1, secret, env)] });
  let current = new Date(FIXED_NOW);
  const service = auth.createProviderIndependentStaffAuthService({
    db,
    env,
    now: () => new Date(current),
    randomBytes: deterministicRandom(),
  });
  const fingerprint = (value) => value.toString(16).padStart(64, '0');
  const invalidCode = () => {
    const valid = auth.createTotp(secret).generate({ timestamp: current.getTime() });
    return valid === '000000' ? '000001' : '000000';
  };

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    await service.verifyTotp({ identifier: '27725128605', code: invalidCode(), requestFingerprintHash: fingerprint(attempt) });
  }
  current = new Date(current.getTime() + 5_001);
  await service.verifyTotp({ identifier: '27725128605', code: invalidCode(), requestFingerprintHash: fingerprint(7) });
  current = new Date(current.getTime() + 30_001);
  await service.verifyTotp({ identifier: '27725128605', code: invalidCode(), requestFingerprintHash: fingerprint(8) });

  const credential = db.credentials.get(1);
  assert.equal(credential.failed_attempt_count, auth.ACCOUNT_FAILURE_LIMIT);
  assert.equal(new Date(credential.locked_until).getTime(), current.getTime() + auth.LOCKOUT_MS);
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    assert.equal(db.rate.get(fingerprint(attempt)).failed_attempt_count, 1);
    assert.equal(db.rate.get(fingerprint(attempt)).locked_until, null);
  }

  const lockedCode = auth.createTotp(secret).generate({ timestamp: current.getTime() });
  const locked = await service.verifyTotp({ identifier: '27725128605', code: lockedCode, requestFingerprintHash: fingerprint(9) });
  assert.equal(locked.code, 'STAFF_AUTH_RATE_LIMITED');
  assert.equal(db.sessions.length, 0);

  current = new Date(current.getTime() + auth.LOCKOUT_MS + 1);
  const unlockedCode = auth.createTotp(secret).generate({ timestamp: current.getTime() });
  const unlocked = await service.verifyTotp({ identifier: '27725128605', code: unlockedCode, requestFingerprintHash: fingerprint(10) });
  assert.equal(unlocked.ok, true);
  assert.equal(db.sessions.length, 1);
});

test('source throttling also covers unknown account guesses without revealing identity state', async () => {
  const env = enabledEnv();
  const db = memoryDb({ admins: [], credentials: [] });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW });
  const fingerprint = '9'.repeat(64);
  let result;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    result = await service.verifyTotp({ identifier: '27829999999', code: '000000', requestFingerprintHash: fingerprint });
  }
  assert.equal(result.code, 'STAFF_AUTH_RATE_LIMITED');
  assert.equal(db.audits.every((event) => event.subjectAdminId == null), true);
});

test('inactive linked staff and inactive Admin identities cannot authenticate', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  for (const admin of [canonicalAdmin({ staff_id: 4, staff_status: 'inactive' }), canonicalAdmin({ admin_active: false })]) {
    const db = memoryDb({ admins: [admin], credentials: [activeCredential(1, secret, env)] });
    const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW });
    const code = auth.createTotp(secret).generate({ timestamp: FIXED_NOW.getTime() });
    assert.equal((await service.verifyTotp({ identifier: '27725128605', code })).ok, false);
    assert.equal(db.sessions.length, 0);
  }
});

test('enrollment returns QR/manual material once, requires possession proof, and issues ten 128-bit recovery codes', async () => {
  const env = enabledEnv();
  const db = memoryDb();
  const randomBytes = deterministicRandom();
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW, randomBytes, qrToDataURL: async (uri) => `data:image/png;base64,${Buffer.from(uri).toString('base64')}` });
  const session = { ok: true, adminId: 1, sessionId: 99, authenticatedAt: FIXED_NOW, recoveryRequired: false };
  const started = await service.startEnrollment({ session, requestFingerprintHash: 'd'.repeat(64) });
  assert.equal(started.ok, true);
  assert.match(started.qrDataUrl, /^data:image\/png;base64,/);
  const secret = started.manualKey.replace(/\s/g, '');
  const code = auth.createTotp(secret).generate({ timestamp: FIXED_NOW.getTime() });
  const confirmed = await service.confirmEnrollment({ session, code, requestFingerprintHash: 'd'.repeat(64) });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.recoveryCodes.length, 10);
  assert.equal(new Set(confirmed.recoveryCodes).size, 10);
  assert.ok(confirmed.recoveryCodes.every((item) => item.replace(/-/g, '').length === 32));
  assert.equal(db.credentials.get(1).pending_secret_ciphertext, null);
  assert.equal(db.recoveryCodes.some((item) => confirmed.recoveryCodes.includes(item.code_hash)), false);
});

test('recovery code is atomically single-use and its session cannot authorize Calendar until replacement', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const code = 'ABCD'.repeat(8);
  const db = memoryDb({ credentials: [activeCredential(1, secret, env)], recoveryCodes: [{ admin_id: 1, generation: 1, code_hash: await auth.hashRecoveryCode(code, () => Buffer.alloc(16, 4)) }] });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW, randomBytes: deterministicRandom() });
  const first = await service.verifyRecovery({ identifier: '27725128605', recoveryCode: code, requestFingerprintHash: 'e'.repeat(64) });
  assert.equal(first.ok, true);
  assert.equal(first.recoveryRequired, true);
  assert.equal(first.viewer, null);
  assert.equal(db.recoveryCodes[0].consumed_at != null, true);
  const replay = await service.verifyRecovery({ identifier: '27725128605', recoveryCode: code, requestFingerprintHash: 'e'.repeat(64) });
  assert.equal(replay.ok, false);
});

test('concurrent recovery-code use consumes once, issues one recovery session, and rejects every replay', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const code = 'DCBA'.repeat(8);
  const db = memoryDb({
    credentials: [activeCredential(1, secret, env)],
    recoveryCodes: [{ admin_id: 1, generation: 1, code_hash: await auth.hashRecoveryCode(code, () => Buffer.alloc(16, 5)) }],
  });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW, randomBytes: deterministicRandom() });

  const results = await Promise.all([
    service.verifyRecovery({ identifier: '27725128605', recoveryCode: code, requestFingerprintHash: '4'.repeat(64) }),
    service.verifyRecovery({ identifier: '27725128605', recoveryCode: code, requestFingerprintHash: '5'.repeat(64) }),
  ]);

  const accepted = results.filter((result) => result.ok);
  assert.equal(accepted.length, 1);
  assert.equal(accepted[0].recoveryRequired, true);
  assert.equal(accepted[0].viewer, null);
  assert.equal(results.filter((result) => !result.ok && result.code === 'STAFF_AUTH_INVALID').length, 1);
  assert.equal(db.recoveryConsumptionTransitions, 1);
  assert.equal(db.recoveryCodes[0].consumed_at != null, true);
  assert.equal(db.sessions.length, 1);
  assert.equal(db.sessions[0].recovery_required, true);

  const replay = await service.verifyRecovery({ identifier: '27725128605', recoveryCode: code, requestFingerprintHash: '6'.repeat(64) });
  assert.equal(replay.ok, false);
  assert.equal(replay.code, 'STAFF_AUTH_INVALID');
  assert.equal(db.recoveryConsumptionTransitions, 1);
  assert.equal(db.sessions.length, 1);
});

test('recovery-required session is accepted only by credential-management middleware, not Calendar authorization', async () => {
  const service = { async validateSessionToken() { return { ok: true, recoveryRequired: true, adminId: 1, viewer: null }; } };
  const req = { headers: {}, get() {}, id: 'request' };
  const res = { statusCode: null, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
  let nextCalls = 0;
  await sessionMiddleware.requireStaffSession({ service })(req, res, () => { nextCalls += 1; });
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalls, 0);
  await sessionMiddleware.requireStaffSession({ service, allowRecoveryRequired: true })(req, res, () => { nextCalls += 1; });
  assert.equal(nextCalls, 1);
});

test('recovery-code regeneration revokes every prior unused code before activating ten replacements', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const old = { admin_id: 1, generation: 1, code_hash: await auth.hashRecoveryCode('1234'.repeat(8), () => Buffer.alloc(16, 3)) };
  const db = memoryDb({ credentials: [activeCredential(1, secret, env)], recoveryCodes: [old] });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW, randomBytes: deterministicRandom() });
  const result = await service.regenerateRecoveryCodes({ session: { ok: true, adminId: 1, sessionId: 5, authenticatedAt: FIXED_NOW, recoveryRequired: false } });
  assert.equal(result.ok, true);
  assert.equal(result.recoveryCodes.length, 10);
  assert.equal(db.recoveryCodes[0].revoked_at != null, true);
  assert.equal(db.credentials.get(1).recovery_generation, 2);
});

test('privileged reset is capability-bound, revokes the subject, and prohibits self-reset', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const subject = canonicalAdmin({ id: 2, normalized_whatsapp: '27820000000', display_name: 'Christel', staff_id: 4, staff_status: 'active', permissions: {} });
  const db = memoryDb({ admins: [canonicalAdmin(), subject], credentials: [activeCredential(2, secret, env)], sessions: [{ id: 1, admin_id: 2, revoked_at: null }] });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW });
  const session = { ok: true, adminId: 1, sessionId: 9, authenticatedAt: FIXED_NOW, recoveryRequired: false };
  assert.equal((await service.privilegedReset({ session, subjectAdminId: 1, reason: 'lost device' })).code, 'STAFF_RESET_FORBIDDEN');
  const noPermissionDb = memoryDb({ admins: [canonicalAdmin({ permissions: {} }), subject], credentials: [activeCredential(2, secret, env)] });
  const noPermissionService = auth.createProviderIndependentStaffAuthService({ db: noPermissionDb, env, now: () => FIXED_NOW });
  assert.equal((await noPermissionService.privilegedReset({ session, subjectAdminId: 2, reason: 'lost device' })).code, 'STAFF_RESET_FORBIDDEN');
  const reset = await service.privilegedReset({ session, subjectAdminId: 2, reason: 'lost device', requestFingerprintHash: 'f'.repeat(64) });
  assert.equal(reset.ok, true);
  assert.equal(db.credentials.get(2).status, 'disabled');
  assert.equal(db.sessions[0].revoke_reason, 'credential_reset');
  assert.equal(db.audits.some((event) => event.eventType === 'credential_reset' && event.operatorAdminId === 1 && event.subjectAdminId === 2), true);
});

test('JP total-factor-loss path exists only as controlled 00+40 one-time break glass, not privileged self-reset', () => {
  const serviceSource = fs.readFileSync(path.join(__dirname, '..', 'src/services/providerIndependentStaffAuth.js'), 'utf8');
  const issueScript = fs.readFileSync(path.join(__dirname, '..', 'scripts/issue-staff-auth-break-glass.js'), 'utf8');
  assert.match(serviceSource, /subjectId === Number\(session\.adminId\)/);
  assert.match(issueScript, /--operator/);
  assert.match(issueScript, /--control-reference/);
  assert.match(serviceSource, /token_hash/);
  assert.match(serviceSource, /recoveryRequired: true/);
});

test('controlled break-glass handoff is hash-at-rest, short-lived, single-use, and recovery-only', async () => {
  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const db = memoryDb({ credentials: [activeCredential(1, secret, env)], sessions: [{ id: 1, admin_id: 1, revoked_at: null }] });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW, randomBytes: deterministicRandom() });
  const issued = await service.issueBreakGlass({ adminId: 1, operatorReference: '40:JP', controlReference: '00:WS-10-recovery' });
  assert.equal(issued.ok, true);
  assert.equal(new Date(issued.expiresAt).getTime() - FIXED_NOW.getTime(), auth.BREAK_GLASS_TTL_MS);
  assert.equal(db.breakGlass[0].token_hash, sessions.sha256(issued.token));
  assert.notEqual(db.breakGlass[0].token_hash, issued.token);
  const exchanged = await service.exchangeBreakGlass({ token: issued.token, requestFingerprintHash: '7'.repeat(64) });
  assert.equal(exchanged.ok, true);
  assert.equal(exchanged.recoveryRequired, true);
  assert.equal(exchanged.viewer, null);
  assert.equal((await service.exchangeBreakGlass({ token: issued.token })).ok, false);
});

test('feature-off rollback is safe, auditable, and leaves WhatsApp challenge routes intact', () => {
  const routes = fs.readFileSync(path.join(__dirname, '..', 'src/routes/staffBrowserSession.js'), 'utf8');
  const rollback = fs.readFileSync(path.join(__dirname, '..', 'scripts/audit-staff-auth-rollback.js'), 'utf8');
  assert.match(routes, /router\.post\('\/challenge'/);
  assert.match(routes, /router\.post\('\/verify'/);
  assert.match(routes, /router\.post\('\/totp\/verify'/);
  assert.match(rollback, /recordRollback/);
  assert.doesNotMatch(routes, /delete.*template|WABA/i);
});

test('Meta unavailable cannot affect provider-independent verification path', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src/services/providerIndependentStaffAuth.js'), 'utf8');
  assert.doesNotMatch(source, /require\(['"]\.\/whatsapp|staffAuthWhatsApp|axios|graph\.facebook|sendMessage|challengeDispatcher/);
  assert.match(source, /issueStaffBrowserSession/);
});

test('migration and UI contain no plaintext-secret persistence or persistent browser storage', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'migrations/081_provider_independent_staff_auth.sql'), 'utf8');
  const html = renderProviderIndependentStaffAuthPage();
  const client = providerIndependentStaffAuthClientScript();
  assert.match(migration, /secret_ciphertext TEXT/);
  assert.match(migration, /code_hash TEXT NOT NULL/);
  assert.match(migration, /auth_method TEXT NOT NULL DEFAULT 'whatsapp_otp'/);
  assert.doesNotMatch(migration, /\b(?:totp_secret|recovery_code|session_token|otp_value)\s+TEXT\b/i);
  assert.doesNotMatch(html + client, /localStorage|sessionStorage|document\.cookie/i);
  assert.match(client, /removeAttribute\('src'\)/);
  assert.match(client, /textContent=''/);
});

test('secret-shaped inputs are absent from error responses, request logs, and security-audit evidence', async () => {
  const materials = {
    totpSecret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
    liveTotp: '654321',
    recoveryCode: 'ABCD-EF12-3456-7890-ABCD-EF12-3456-7890',
    sessionToken: Buffer.alloc(32, 13).toString('base64url'),
    encryptionKey: Buffer.alloc(32, 42).toString('base64url'),
  };
  materials.otpauthUri = `otpauth://totp/Shiloh%20OS:JP?secret=${materials.totpSecret}&issuer=Shiloh%20OS`;
  const prohibited = Object.values(materials);

  const capturedLogs = [];
  const captureLogger = {
    info(...args) { capturedLogs.push({ level: 'info', args }); },
    error(...args) { capturedLogs.push({ level: 'error', args }); },
  };
  const hadOwnChild = Object.prototype.hasOwnProperty.call(logger, 'child');
  const originalChild = logger.child;
  logger.child = () => captureLogger;
  const responseBodies = [];
  try {
    const app = express();
    app.use(express.json());
    app.use(requestContext);
    app.use('/calendar/staff-auth', createStaffBrowserSessionRouter({
      env: { NODE_ENV: 'test' },
      service: {
        async validateSessionToken() { return { ok: false }; },
        validateCsrfToken() { return false; },
      },
      emergencyBootstrapService: { async exchange() { return { ok: false }; } },
      providerIndependentAuthService: {
        async verifyTotp() { return { ok: false, code: 'STAFF_AUTH_INVALID' }; },
        async verifyRecovery() { return { ok: false, code: 'STAFF_AUTH_INVALID' }; },
      },
    }));
    app.use((error, req, res, _next) => {
      req.log.error({ err: error }, 'Unhandled Express error');
      res.status(500).json({ error: 'Internal server error', requestId: req.id });
    });

    await withHttpServer(app, async (origin) => {
      for (const [pathName, payload] of [
        ['/calendar/staff-auth/totp/verify', { identifier: `${materials.totpSecret} ${materials.otpauthUri}`, code: materials.liveTotp, sessionToken: materials.sessionToken, encryptionKey: materials.encryptionKey }],
        ['/calendar/staff-auth/totp/recovery/verify', { identifier: `${materials.sessionToken} ${materials.encryptionKey}`, recoveryCode: materials.recoveryCode, totpSecret: materials.totpSecret, otpauthUri: materials.otpauthUri }],
      ]) {
        const response = await fetch(`${origin}${pathName}`, {
          method: 'POST',
          headers: { Origin: origin, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        assert.equal(response.status, 401);
        responseBodies.push(await response.text());
      }
    });
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    if (hadOwnChild) logger.child = originalChild;
    else delete logger.child;
  }

  const env = enabledEnv();
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const subject = canonicalAdmin({ id: 2, normalized_whatsapp: '27820000000', display_name: 'Christel', staff_id: 4, staff_status: 'active', permissions: {} });
  const db = memoryDb({ admins: [canonicalAdmin(), subject], credentials: [activeCredential(2, secret, env)] });
  const service = auth.createProviderIndependentStaffAuthService({ db, env, now: () => FIXED_NOW });
  const reset = await service.privilegedReset({
    session: { ok: true, adminId: 1, sessionId: 9, authenticatedAt: FIXED_NOW, recoveryRequired: false },
    subjectAdminId: 2,
    reason: prohibited.join(' | '),
    requestFingerprintHash: '8'.repeat(64),
  });
  assert.equal(reset.ok, true);

  const evidence = JSON.stringify({ responseBodies, capturedLogs, audits: db.audits });
  for (const value of prohibited) assert.equal(evidence.includes(value), false, `prohibited material was retained: ${value}`);
  const resetAudit = db.audits.find((event) => event.eventType === 'credential_reset');
  assert.equal(resetAudit.operatorAdminId, 1);
  assert.equal(resetAudit.subjectAdminId, 2);
  assert.equal(resetAudit.authMethod, 'totp');
  assert.match(resetAudit.reason, /\[redacted-totp-secret\]/);
  assert.match(resetAudit.reason, /\[redacted-otp\]/);
  assert.match(resetAudit.reason, /\[redacted-auth-uri\]/);
  assert.match(resetAudit.reason, /\[redacted-recovery-code\]/);
  assert.match(resetAudit.reason, /\[redacted-secret\]/);
});

test('management mutations retain same-origin, staff-session, and CSRF guards', () => {
  const routes = fs.readFileSync(path.join(__dirname, '..', 'src/routes/staffBrowserSession.js'), 'utf8');
  for (const route of ['enrollment/start', 'enrollment/confirm', 'enrollment/cancel', 'recovery/regenerate', 'admin/reset']) {
    assert.match(routes, new RegExp(`router\\.post\\('\\/totp\\/${route.replace('/', '\\/')}', sameOrigin, requireSession, requireCsrf`));
  }
});

test('current session validation immediately rejects authority loss for linked staff', async () => {
  const token = Buffer.alloc(32, 9).toString('base64url');
  const db = {
    async query(sql) {
      if (String(sql).includes('FROM staff_browser_sessions')) return { rows: [{
        session_id: 1, admin_id: 2, csrf_hash: 'a'.repeat(64), issued_at: FIXED_NOW,
        expires_at: new Date(FIXED_NOW.getTime() + 60_000), revoked_at: null,
        admin_active: true, staff_id: 4, staff_status: 'inactive',
      }], rowCount: 1 };
      throw new Error('unexpected query');
    },
  };
  const service = sessions.createStaffBrowserSessionService({ db, now: () => FIXED_NOW });
  assert.equal((await service.validateSessionToken(token)).ok, false);
});
