const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PILOT_IDS_FLAG,
  providerIndependentAuthPolicy,
} = require('../src/services/providerIndependentStaffAuth');
const {
  sortedAdminIds,
  reconcileStaffAuthResetPilotEligibility,
} = require('../src/services/staffAuthResetPilotBridge');

function authEnv(pilots = '1') {
  return {
    SHILOH_STAFF_TOTP_AUTH_ENABLED: 'true',
    SHILOH_STAFF_TOTP_PILOT_ADMIN_IDS: pilots,
    SHILOH_STAFF_TOTP_ACTIVE_KEY_VERSION: 'v1',
    SHILOH_STAFF_TOTP_ENCRYPTION_KEYS_JSON: JSON.stringify({ v1: Buffer.alloc(32, 7).toString('base64url') }),
  };
}

test('sorts and sanitizes effective admin IDs', () => {
  assert.deepEqual(sortedAdminIds(new Set([5, 2, 5, 1, -1, NaN])), [1, 2, 5]);
});

test('adds only canonical reset-capable principals returned by the guarded authority query', async () => {
  const env = authEnv('1');
  const calls = [];
  const db = {
    async query(sql) {
      calls.push(sql);
      return { rows: [{ id: 1 }, { id: 7 }] };
    },
  };

  const result = await reconcileStaffAuthResetPilotEligibility({ db, env });

  assert.equal(env[PILOT_IDS_FLAG], '1,7');
  assert.deepEqual(result, {
    enabled: true,
    staticPilotCount: 1,
    resetPrincipalCount: 2,
    effectivePilotCount: 2,
    addedResetPrincipalCount: 1,
  });
  assert.equal(providerIndependentAuthPolicy(env).pilotIds.has(7), true);
  assert.match(calls[0], /a\.active = TRUE/);
  assert.match(calls[0], /a\.staff_id IS NULL OR s\.status = 'active'/);
  assert.match(calls[0], /staff_auth:reset/);
});

test('preserves the existing static pilot set and does not fabricate ordinary staff eligibility', async () => {
  const env = authEnv('3,1');
  const db = { query: async () => ({ rows: [] }) };

  const result = await reconcileStaffAuthResetPilotEligibility({ db, env });

  assert.equal(env[PILOT_IDS_FLAG], '1,3');
  assert.equal(result.addedResetPrincipalCount, 0);
  assert.equal(providerIndependentAuthPolicy(env).pilotIds.has(2), false);
});

test('fails closed when provider-independent auth is enabled with an invalid static pilot configuration', async () => {
  const env = authEnv('bad');
  const db = { query: async () => { throw new Error('must not query'); } };

  await assert.rejects(
    reconcileStaffAuthResetPilotEligibility({ db, env }),
    (error) => error.code === 'STAFF_TOTP_PILOT_CONFIGURATION_INVALID'
  );
});

test('does not query or mutate pilot state when provider-independent auth is disabled', async () => {
  const env = authEnv('1');
  env.SHILOH_STAFF_TOTP_AUTH_ENABLED = 'false';
  let queried = false;
  const db = { query: async () => { queried = true; return { rows: [] }; } };

  const result = await reconcileStaffAuthResetPilotEligibility({ db, env });

  assert.equal(queried, false);
  assert.equal(env[PILOT_IDS_FLAG], '1');
  assert.equal(result.enabled, false);
});
