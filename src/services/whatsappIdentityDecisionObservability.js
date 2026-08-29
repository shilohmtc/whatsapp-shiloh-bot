const { pool } = require('../db/pool');
const { resolveVerifiedClientByWhatsApp } = require('./clientVerifiedIdentity');
const { createWhatsAppCrmV2IdentityCompatService } = require('./whatsappCrmV2IdentityCompat');

const EVENT_NAME = 'whatsapp_identity_decision';
const defaultCrmV2Compat = createWhatsAppCrmV2IdentityCompatService();

const ONBOARDING_STATES = new Set([
  'collect_name',
  'confirm_whatsapp',
  'collect_contact',
  'collect_dob',
  'collect_gender',
  'complete',
]);
const IDENTITY_STATUSES = new Set([
  'not_set',
  'not_run',
  'identity_contract_invalid',
  'matched_complete',
  'matched_incomplete',
  'verified_complete',
  'verified_incomplete',
  'registration_required',
  'ambiguous',
  'manual_review',
  'crm_v2_conflict',
  'crm_v2_current',
  'crm_v2_stale',
  'unknown',
]);
const LEGACY_CLASSES = new Set([
  'not_observed',
  'diagnostic_error',
  'none',
  'verified_client',
  'ambiguous',
  'manual_review',
  'claim_required',
  'historical_unverified',
  'provisional',
  'unverified_client',
]);
const CRM_V2_CLASSES = new Set([
  'not_observed',
  'diagnostic_error',
  'not_found',
  'resolved',
  'conflict',
]);
const LEGACY_REASON_CODES = new Set([
  'missing_phone',
  'no_exact_phone_candidate',
  'multiple_active_clients_for_exact_phone',
  'controlled_demo_binding',
  'imported_contact_unverified',
  'history_without_explicit_verification',
  'provisional_unverified_client',
  'existing_client_without_explicit_verification',
  'multiple_non_active_clients_for_exact_phone',
  'non_reclaimable_exact_phone_owner',
  'archived_client_has_active_verification',
  'archived_imported_contact_unverified',
]);

function present(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function normalizePhone(value = '') {
  return String(value || '').replace(/[^0-9]/g, '');
}

function classifyOnboardingState(value) {
  if (!present(value)) return 'none';
  return ONBOARDING_STATES.has(value) ? value : 'other';
}

function classifyAuthorityVersion(value, currentAuthorityVersion) {
  if (!present(value)) return 'missing';
  if (present(currentAuthorityVersion) && value === currentAuthorityVersion) return 'current';
  return 'stale';
}

function classifyCandidateCount(count) {
  if (!Number.isInteger(count) || count < 0) return 'unknown';
  if (count === 0) return 'none';
  if (count === 1) return 'one';
  return 'multiple';
}

function safeIdentityStatus(value) {
  if (!present(value)) return 'not_set';
  return IDENTITY_STATUSES.has(value) ? value : 'unknown';
}

function safeLegacyClass(value) {
  return LEGACY_CLASSES.has(value) ? value : 'diagnostic_error';
}

function safeCrmV2Class(value) {
  return CRM_V2_CLASSES.has(value) ? value : 'diagnostic_error';
}

function safeLegacyReason(value) {
  if (LEGACY_REASON_CODES.has(value)) return value;
  if (String(value || '').startsWith('controlled_demo_')) return 'controlled_demo_noncanonical';
  return 'unclassified';
}

function responseClass(result = {}, navigationKind = null) {
  if (navigationKind) return 'navigation_pass_through';
  const status = safeIdentityStatus(result.identityStatus);
  if (status === 'identity_contract_invalid' || status === 'manual_review') return 'human_verification';
  if (status === 'ambiguous' || status === 'crm_v2_conflict') return 'identity_conflict';
  if (status === 'crm_v2_stale') return 'crm_v2_stale_authority';
  if (status === 'registration_required' || status === 'verified_incomplete' || status === 'matched_incomplete') return 'registration_prompt';
  if (status === 'verified_complete') return 'registration_complete';
  if (status === 'matched_complete') return result.handled === false ? 'pass_through' : 'welcome_back';
  if (result.handled === false) return 'pass_through';
  return result.handled === true ? 'handled_other' : 'no_response';
}

function selectedRoute({ result = {}, sessionBefore, navigationKind = null } = {}) {
  if (navigationKind === 'book_another') return 'book_another_navigation_bypass';
  if (navigationKind === 'matched_greeting') return 'matched_greeting_navigation_priority';

  const status = safeIdentityStatus(result.identityStatus);
  if (status === 'identity_contract_invalid') return 'existing_session_contract_invalid';
  if (sessionBefore?.present && sessionBefore.authorityVersionClass === 'stale') {
    if (status === 'ambiguous' || status === 'manual_review') return 'stale_session_reresolution_fail_closed';
    return 'stale_session_reset_reentry';
  }
  if (sessionBefore?.present && sessionBefore.crmV2ClientIdPresent) return 'existing_crm_v2_session';
  if (status === 'crm_v2_conflict') return 'crm_v2_exact_conflict';
  if (status === 'ambiguous' || status === 'manual_review') return 'legacy_manual_review';
  if (status === 'registration_required') return 'fresh_crm_v2_registration';
  if (status === 'verified_incomplete') return 'verified_legacy_registration';
  if (status === 'matched_complete') return 'matched_identity';
  if (status === 'verified_complete') return 'active_registration_completion';
  return 'identity_onboarding_result';
}

function resolverReasonCode({ identityStatus, legacyReason }) {
  switch (safeIdentityStatus(identityStatus)) {
    case 'identity_contract_invalid': return 'persisted_identity_contract_invalid';
    case 'crm_v2_conflict': return 'crm_v2_exact_conflict';
    case 'crm_v2_stale': return 'crm_v2_session_stale';
    case 'registration_required': return legacyReason !== 'unclassified' ? legacyReason : 'fresh_registration_required';
    case 'verified_incomplete': return 'verified_legacy_profile_incomplete';
    case 'matched_complete': return 'matched_current_authority';
    case 'verified_complete': return 'registration_completed';
    case 'ambiguous':
    case 'manual_review': return legacyReason;
    case 'not_set': return 'active_onboarding_session';
    default: return 'unclassified';
  }
}

function observationMode({ result = {}, sessionBefore, navigationKind = null } = {}) {
  if (navigationKind === 'book_another') return 'none';
  const status = safeIdentityStatus(result.identityStatus);
  if (status === 'identity_contract_invalid') return 'both';
  if (sessionBefore?.present && sessionBefore.crmV2ClientIdPresent) return 'crm_v2';
  if (sessionBefore?.present && sessionBefore.authorityVersionClass === 'stale') return 'both';
  if (['registration_required', 'ambiguous', 'manual_review', 'crm_v2_conflict', 'verified_incomplete', 'unknown'].includes(status)) return 'both';
  if (!sessionBefore?.present && status === 'matched_complete') return 'both';
  return 'none';
}

function emptySessionSnapshot() {
  return {
    present: false,
    onboardingState: 'none',
    authorityVersionClass: 'missing',
    clientIdPresent: false,
    crmV2ClientIdPresent: false,
    identityModelPresent: false,
  };
}

function safeSessionSnapshot(row, currentAuthorityVersion) {
  if (!row) return emptySessionSnapshot();
  return {
    present: true,
    onboardingState: classifyOnboardingState(row.state),
    authorityVersionClass: classifyAuthorityVersion(row.authority_version, currentAuthorityVersion),
    clientIdPresent: present(row.client_id),
    crmV2ClientIdPresent: present(row.crm_v2_client_id),
    identityModelPresent: present(row.identity_model),
  };
}

function createWhatsAppIdentityDecisionObservability({
  db = pool,
  legacyResolver = resolveVerifiedClientByWhatsApp,
  crmV2Resolver = defaultCrmV2Compat.resolveCrmV2ByExactMobile,
} = {}) {
  async function captureSession(phone, currentAuthorityVersion) {
    try {
      const result = await db.query(
        'SELECT client_id,crm_v2_client_id,identity_model,state,authority_version FROM client_onboarding_sessions WHERE phone=$1',
        [normalizePhone(phone)]
      );
      return safeSessionSnapshot(result.rows?.[0] || null, currentAuthorityVersion);
    } catch (_error) {
      return {
        ...emptySessionSnapshot(),
        onboardingState: 'unknown',
        authorityVersionClass: 'unknown',
      };
    }
  }

  async function observeResolution(phone, mode) {
    let legacyResolutionClass = 'not_observed';
    let legacyReason = 'unclassified';
    let candidateCountBucket = 'not_observed';
    let durableVerifiedLegacyAuthority = false;
    let crmV2ResolutionClass = 'not_observed';

    if (mode === 'both') {
      try {
        const legacy = await legacyResolver(phone);
        legacyResolutionClass = safeLegacyClass(legacy?.status);
        legacyReason = safeLegacyReason(legacy?.reason);
        candidateCountBucket = classifyCandidateCount(Array.isArray(legacy?.clients) ? legacy.clients.length : 0);
        durableVerifiedLegacyAuthority = legacy?.status === 'verified_client';
      } catch (_error) {
        legacyResolutionClass = 'diagnostic_error';
        candidateCountBucket = 'unknown';
      }
    }

    if (mode === 'both' || mode === 'crm_v2') {
      try {
        const crmV2 = await crmV2Resolver(phone);
        crmV2ResolutionClass = safeCrmV2Class(crmV2?.status);
      } catch (_error) {
        crmV2ResolutionClass = 'diagnostic_error';
      }
    }

    return {
      legacyResolutionClass,
      legacyReason,
      candidateCountBucket,
      durableVerifiedLegacyAuthority,
      crmV2ResolutionClass,
    };
  }

  async function observeAndLog({
    logger,
    phone,
    currentAuthorityVersion,
    sessionBefore = emptySessionSnapshot(),
    originalResult = {},
    finalResult = originalResult,
    navigationKind = null,
  } = {}) {
    if (!logger || typeof logger.info !== 'function') return null;
    const mode = observationMode({ result: originalResult, sessionBefore, navigationKind });
    const resolution = await observeResolution(phone, mode);
    const resolverStatus = navigationKind === 'book_another'
      ? 'not_run'
      : safeIdentityStatus(originalResult.identityStatus);
    const legacyReason = resolution.legacyReason;
    const payload = {
      event: EVENT_NAME,
      resolverStatus,
      resolverReasonCode: resolverReasonCode({ identityStatus: resolverStatus, legacyReason }),
      resolutionObservationClass: mode === 'none' ? 'not_observed' : 'diagnostic_post_decision',
      selectedConsumer: navigationKind ? 'client_navigation_priority' : 'client_identity_onboarding',
      selectedRoute: selectedRoute({ result: originalResult, sessionBefore, navigationKind }),
      crmV2ResolutionClass: resolution.crmV2ResolutionClass,
      legacyResolutionClass: resolution.legacyResolutionClass,
      candidateCountBucket: resolution.candidateCountBucket,
      durableVerifiedLegacyAuthority: resolution.durableVerifiedLegacyAuthority,
      onboardingSessionPresent: sessionBefore.present === true,
      onboardingState: sessionBefore.onboardingState || 'unknown',
      authorityVersionClass: sessionBefore.authorityVersionClass || 'unknown',
      clientIdPresent: sessionBefore.clientIdPresent === true,
      crmV2ClientIdPresent: sessionBefore.crmV2ClientIdPresent === true,
      identityModelPresent: sessionBefore.identityModelPresent === true,
      finalResponseClass: responseClass(finalResult, navigationKind),
    };
    logger.info(payload, EVENT_NAME);
    return payload;
  }

  return {
    captureSession,
    observeAndLog,
  };
}

const whatsappIdentityDecisionObservability = createWhatsAppIdentityDecisionObservability();

module.exports = {
  EVENT_NAME,
  classifyOnboardingState,
  classifyAuthorityVersion,
  classifyCandidateCount,
  safeSessionSnapshot,
  responseClass,
  selectedRoute,
  createWhatsAppIdentityDecisionObservability,
  whatsappIdentityDecisionObservability,
};
