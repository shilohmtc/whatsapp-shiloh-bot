'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createStaffBrowserSessionService,
} = require('../src/services/staffBrowserSession');
const {
  accountNavigationMetadata,
} = require('../src/routes/workspaceOperational');

const TOKEN = 'A'.repeat(43);
const NOW = new Date('2026-09-10T07:00:00.000Z');

function sessionRow(overrides = {}) {
  return {
    session_id: 91,
    admin_id: 3,
    csrf_hash: 'csrf-hash',
    issued_at: new Date('2026-09-10T06:00:00.000Z'),
    expires_at: new Date('2026-09-10T14:00:00.000Z'),
    revoked_at: null,
    auth_method: 'passkey',
    reauthenticated_at: new Date('2026-09-10T06:00:00.000Z'),
    recovery_required: false,
    id: 3,
    staff_id: null,
    role: 'receptionist',
    business_role: 'booking_operator',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions: { 'appointment:view': true },
    admin_active: true,
    staff_status: null,
    ...overrides,
  };
}

function dbFor(row) {
  return {
    async query(sql) {
      if (String(sql).includes('FROM staff_browser_sessions bs')) return { rows: [row], rowCount: 1 };
      if (String(sql).includes('UPDATE staff_browser_sessions')) return { rows: [], rowCount: 1 };
      throw new Error(`Unexpected SQL in #812 regression: ${sql}`);
    },
  };
}

test('#812 validated shared Reception session keeps Calendar viewer reduced and exposes separate account principal', async () => {
  const service = createStaffBrowserSessionService({ db: dbFor(sessionRow()), now: () => NOW });
  const session = await service.validateSessionToken(TOKEN);

  assert.equal(session.ok, true);
  assert.deepEqual(session.viewer, { calendarScope: 'business_all_staff' });
  assert.deepEqual(session.accountPrincipal, {
    id: 3,
    role: 'receptionist',
    businessRole: 'booking_operator',
    linkedStaffId: null,
    calendarScope: 'all_business',
    serviceScope: 'all_services',
  });
  assert.deepEqual(accountNavigationMetadata({ viewer: session.accountPrincipal, passkeyEnabled: true }), {
    mode: 'shared_reception',
    lockWorkspace: true,
  });
});

test('#812 account projection fails closed for a personal linked principal', async () => {
  const row = sessionRow({
    id: 7,
    admin_id: 7,
    staff_id: 12,
    role: 'staff',
    business_role: 'tenant_practitioner',
    calendar_scope: 'own',
    service_scope: 'own_services',
    staff_status: 'active',
  });
  const service = createStaffBrowserSessionService({ db: dbFor(row), now: () => NOW });
  const session = await service.validateSessionToken(TOKEN);

  assert.equal(session.ok, true);
  assert.deepEqual(session.viewer, { calendarScope: 'own_staff', staffId: 12 });
  assert.deepEqual(accountNavigationMetadata({ viewer: session.accountPrincipal, passkeyEnabled: true }), {
    mode: 'personal',
    lockWorkspace: false,
  });
});
