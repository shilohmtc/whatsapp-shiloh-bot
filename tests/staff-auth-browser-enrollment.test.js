const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeStaffNumber,
  createStaffAuthBrowserEnrollmentService,
} = require('../src/services/staffAuthBrowserEnrollment');
const {
  renderStaffAuthBrowserEnrollmentPage,
  staffAuthBrowserEnrollmentClientScript,
} = require('../src/presentation/staffAuthBrowserEnrollmentUx');
const {
  withAuthenticatorSetupGuidance,
} = require('../src/routes/staffCalendarAccessUx');
const {
  renderStaffCalendarAccessPage,
} = require('../src/presentation/staffCalendarAccessUx');

const NOW = new Date('2026-09-01T08:00:00.000Z');

function authEnv() {
  return {
    SHILOH_STAFF_TOTP_AUTH_ENABLED: 'true',
    SHILOH_STAFF_TOTP_PILOT_ADMIN_IDS: '1,2',
    SHILOH_STAFF_TOTP_ENCRYPTION_KEYS_JSON: JSON.stringify({ v1: Buffer.alloc(32, 7).toString('base64url') }),
    SHILOH_STAFF_TOTP_ACTIVE_KEY_VERSION: 'v1',
    SHILOH_CALENDAR_PUBLIC_ORIGIN: 'https://example.test',
  };
}

function fakeDb({ operatorPermission = true, subjectActive = true } = {}) {
  const calls = [];
  const client = {
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (/FROM staff_admin_accounts a/.test(sql)) {
        if (Number(params[0]) === 1) {
          return { rows: [{ id: 1, staff_id: 11, display_name: 'Operator', normalized_whatsapp: '27820000001', permissions: { 'staff_auth:reset': operatorPermission }, admin_active: true, staff_status: 'active' }] };
        }
        if (String(params[0]) === '27820000002') {
          return { rows: [{ id: 2, staff_id: 12, display_name: 'Subject', normalized_whatsapp: '27820000002', permissions: {}, admin_active: subjectActive, staff_status: subjectActive ? 'active' : 'inactive' }] };
        }
        return { rows: [] };
      }
      if (/UPDATE staff_browser_sessions/.test(sql)) return { rows: [], rowCount: 2 };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  return {
    calls,
    connect: async () => client,
    query: (...args) => client.query(...args),
  };
}

function recentSession(overrides = {}) {
  return {
    ok: true,
    adminId: 1,
    authenticatedAt: new Date(NOW.getTime() - 60_000),
    recoveryRequired: false,
    ...overrides,
  };
}

test('normalizes South African local staff numbers for canonical lookup', () => {
  assert.equal(normalizeStaffNumber('082 000 0002'), '27820000002');
  assert.equal(normalizeStaffNumber('+27 82 000 0002'), '27820000002');
});

test('authorized recent non-recovery operator can issue a five-minute controlled enrollment link', async () => {
  const db = fakeDb();
  const service = createStaffAuthBrowserEnrollmentService({
    db,
    env: authEnv(),
    now: () => new Date(NOW),
    randomBytes: () => Buffer.alloc(32, 9),
  });
  const result = await service.issue({
    session: recentSession(),
    staffNumber: '082 000 0002',
    requestFingerprintHash: 'a'.repeat(64),
  });
  assert.equal(result.ok, true);
  assert.equal(result.subject.adminId, 2);
  assert.equal(result.subject.staffNumber, '27820000002');
  assert.match(result.url, /^https:\/\/example\.test\/calendar\/staff#staff-recovery=/);
  assert.equal(new Date(result.expiresAt).getTime() - NOW.getTime(), 5 * 60 * 1000);
  assert.ok(db.calls.some(({ sql }) => /UPDATE staff_auth_break_glass_bootstraps SET revoked_at/.test(sql)), 'prior unused handoff must be invalidated');
  assert.ok(db.calls.some(({ sql }) => /INSERT INTO staff_auth_break_glass_bootstraps/.test(sql)), 'single-use handoff must be persisted');
  assert.ok(db.calls.some(({ sql }) => /replacement_required_at = COALESCE/.test(sql)), 'subject must be forced into enrollment or replacement');
  assert.ok(db.calls.some(({ sql }) => /INSERT INTO staff_auth_security_events/.test(sql)), 'issuance must be audited');
});

test('issuance fails closed for stale, recovery, unauthorized, and inactive-subject cases', async () => {
  const make = (db) => createStaffAuthBrowserEnrollmentService({ db, env: authEnv(), now: () => new Date(NOW), randomBytes: () => Buffer.alloc(32, 4) });

  let result = await make(fakeDb()).issue({ session: recentSession({ authenticatedAt: new Date(NOW.getTime() - 11 * 60 * 1000) }), staffNumber: '0820000002' });
  assert.equal(result.code, 'STAFF_RECENT_AUTH_REQUIRED');

  result = await make(fakeDb()).issue({ session: recentSession({ recoveryRequired: true }), staffNumber: '0820000002' });
  assert.equal(result.code, 'STAFF_RECENT_AUTH_REQUIRED');

  result = await make(fakeDb({ operatorPermission: false })).issue({ session: recentSession(), staffNumber: '0820000002' });
  assert.equal(result.code, 'STAFF_RESET_FORBIDDEN');

  result = await make(fakeDb({ subjectActive: false })).issue({ session: recentSession(), staffNumber: '0820000002' });
  assert.equal(result.code, 'STAFF_ENROLLMENT_SUBJECT_INVALID');
});

test('staff sign-in UX surfaces first-time/new-phone guidance without changing direct authenticator sign-in', () => {
  const base = renderStaffCalendarAccessPage({ providerIndependentAuthEnabled: true });
  const html = withAuthenticatorSetupGuidance(base);
  assert.match(html, /First-time setup \/ new phone/);
  assert.match(html, /five minutes/);
  assert.match(html, /does not use WhatsApp or Meta/);
  assert.match(html, /Sign in with authenticator/);
  assert.match(html, /\/calendar\/staff-auth\/admin-enrollment/);
});

test('browser enrollment management UX keeps the enrollment token in the one-time response surface', () => {
  const html = renderStaffAuthBrowserEnrollmentPage();
  const script = staffAuthBrowserEnrollmentClientScript();
  assert.match(html, /Create one-time enrollment link/);
  assert.match(html, /five-minute, single-use enrollment link/);
  assert.match(script, /HERE=BASE\+'\/admin-enrollment'/);
  assert.match(script, /fetch\(HERE\+'\/issue'/);
  assert.match(script, /x-shiloh-csrf-token/);
  assert.doesNotMatch(script, /localStorage|sessionStorage/);
});
