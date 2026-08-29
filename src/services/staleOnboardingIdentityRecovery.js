const { pool } = require('../db/pool');
const { resolveVerifiedClientByWhatsApp } = require('./clientVerifiedIdentity');
const {
  identityFromSession,
  createWhatsAppCrmV2IdentityCompatService,
} = require('./whatsappCrmV2IdentityCompat');

const defaultCrmV2Compat = createWhatsAppCrmV2IdentityCompatService();
const RECOVERABLE_CONTRACT_CODES = new Set([
  'WHATSAPP_IDENTITY_DUAL_MASTER',
  'WHATSAPP_IDENTITY_DISCRIMINATOR_MISMATCH',
]);

function normalizePhone(value = '') {
  return String(value || '').replace(/[^0-9]/g, '');
}

function manualReviewIdentity(identity) {
  return ['ambiguous', 'manual_review'].includes(identity?.status);
}

async function acquireClient(db) {
  if (db && typeof db.connect === 'function') {
    const client = await db.connect();
    return { client, release: () => client.release() };
  }
  if (db && typeof db.query === 'function') {
    return { client: db, release: () => {} };
  }
  throw new TypeError('A PostgreSQL pool or query client is required');
}

function invalidContractCode(session, parseIdentity) {
  try {
    parseIdentity(session);
    return null;
  } catch (error) {
    return error?.code || 'UNKNOWN_IDENTITY_CONTRACT_ERROR';
  }
}

function createStaleOnboardingIdentityRecovery({
  db = pool,
  parseIdentity = identityFromSession,
  legacyResolver = resolveVerifiedClientByWhatsApp,
  crmV2Resolver = defaultCrmV2Compat.resolveCrmV2ByExactMobile,
} = {}) {
  async function recoverAndRetry({ phone, currentAuthorityVersion, retry } = {}) {
    const key = normalizePhone(phone);
    if (!key || !currentAuthorityVersion || typeof retry !== 'function') {
      return { recovered: false, reason: 'invalid_recovery_input', result: null };
    }

    const { client, release } = await acquireClient(db);
    let began = false;
    try {
      await client.query('BEGIN');
      began = true;
      const current = await client.query(
        `SELECT phone,client_id,crm_v2_client_id,identity_model,state,booking_requested,authority_version
           FROM client_onboarding_sessions
          WHERE phone=$1
          FOR UPDATE`,
        [key]
      );
      if (current.rowCount !== 1) {
        await client.query('ROLLBACK');
        began = false;
        return { recovered: false, reason: 'session_missing', result: null };
      }

      const session = current.rows[0];
      if (session.state === 'complete') {
        await client.query('ROLLBACK');
        began = false;
        return { recovered: false, reason: 'complete_session_fail_closed', result: null };
      }
      if (session.authority_version === currentAuthorityVersion) {
        await client.query('ROLLBACK');
        began = false;
        return { recovered: false, reason: 'current_authority_fail_closed', result: null };
      }

      const contractCode = invalidContractCode(session, parseIdentity);
      if (!RECOVERABLE_CONTRACT_CODES.has(contractCode)) {
        await client.query('ROLLBACK');
        began = false;
        return { recovered: false, reason: 'contract_not_recoverable', result: null };
      }

      // Preflight the same canonical authorities used by ordinary onboarding.
      // This gate prevents mutating even stale session state when the sender is
      // currently ambiguous/conflicting. It does not bind or choose an identity;
      // the ordinary identity service re-runs these authorities after reset.
      const legacy = await legacyResolver(phone);
      let crmV2 = null;
      if (legacy?.status !== 'verified_client') {
        crmV2 = await crmV2Resolver(phone);
        if (crmV2?.status === 'conflict') {
          await client.query('ROLLBACK');
          began = false;
          return { recovered: false, reason: 'crm_v2_conflict_fail_closed', result: null };
        }
        if (crmV2?.status !== 'resolved' && manualReviewIdentity(legacy)) {
          await client.query('ROLLBACK');
          began = false;
          return { recovered: false, reason: 'legacy_manual_review_fail_closed', result: null };
        }
      }

      // The row is stale, incomplete and structurally invalid. Remove only this
      // disposable onboarding state so the existing canonical resolver path can
      // restart from authoritative identity data. No client/profile/history data
      // is changed or inferred from the stale row.
      const removed = await client.query(
        'DELETE FROM client_onboarding_sessions WHERE phone=$1 RETURNING phone',
        [key]
      );
      if (removed.rowCount !== 1) {
        throw new Error('Stale onboarding identity recovery lost its locked session row');
      }

      await client.query('COMMIT');
      began = false;
    } catch (error) {
      if (began) {
        try { await client.query('ROLLBACK'); } catch (_) {}
      }
      throw error;
    } finally {
      release();
    }

    const result = await retry();
    return { recovered: true, reason: 'stale_invalid_session_reentered', result };
  }

  return { recoverAndRetry };
}

const staleOnboardingIdentityRecovery = createStaleOnboardingIdentityRecovery();

module.exports = {
  RECOVERABLE_CONTRACT_CODES,
  normalizePhone,
  invalidContractCode,
  createStaleOnboardingIdentityRecovery,
  staleOnboardingIdentityRecovery,
};
