const {
  resolveExactMobile: resolveCanonicalCrmV2ExactMobile,
} = require('./crmV2ClientService');

const IDENTITY_CONTRACT_VERSION = 'whatsapp_crm_identity_compat_v1';
const IDENTITY_MODELS = Object.freeze({
  LEGACY: 'legacy',
  CRM_V2: 'crm_v2',
});

class WhatsAppIdentityContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'WhatsAppIdentityContractError';
    this.code = code;
  }
}

function presentId(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function canonicalId(value, field) {
  if (!presentId(value) || !/^\d+$/.test(String(value)) || BigInt(String(value)) <= 0n) {
    throw new WhatsAppIdentityContractError('WHATSAPP_IDENTITY_INVALID_ID', `${field} must be a positive canonical id.`);
  }
  return String(value);
}

function createLegacyIdentity(clientId, { provenance = 'legacy_runtime' } = {}) {
  return Object.freeze({
    contractVersion: IDENTITY_CONTRACT_VERSION,
    identityModel: IDENTITY_MODELS.LEGACY,
    legacyClientId: canonicalId(clientId, 'client_id'),
    crmV2ClientId: null,
    provenance,
  });
}

function createCrmV2Identity(crmV2ClientId, { provenance = 'crm_v2_exact_mobile' } = {}) {
  return Object.freeze({
    contractVersion: IDENTITY_CONTRACT_VERSION,
    identityModel: IDENTITY_MODELS.CRM_V2,
    legacyClientId: null,
    crmV2ClientId: canonicalId(crmV2ClientId, 'crm_v2_client_id'),
    provenance,
  });
}

function identityFromSession(session = {}) {
  const hasLegacy = presentId(session.client_id);
  const hasCrmV2 = presentId(session.crm_v2_client_id);
  const model = session.identity_model || null;

  if (hasLegacy && hasCrmV2) {
    throw new WhatsAppIdentityContractError(
      'WHATSAPP_IDENTITY_DUAL_MASTER',
      'Onboarding session cannot reference both legacy and CRM V2 clients.'
    );
  }
  if (!hasLegacy && !hasCrmV2) {
    if (model) {
      throw new WhatsAppIdentityContractError(
        'WHATSAPP_IDENTITY_DISCRIMINATOR_MISMATCH',
        'Unbound onboarding session cannot declare an identity model.'
      );
    }
    return null;
  }
  if (hasLegacy) {
    if (model && model !== IDENTITY_MODELS.LEGACY) {
      throw new WhatsAppIdentityContractError(
        'WHATSAPP_IDENTITY_DISCRIMINATOR_MISMATCH',
        'Legacy onboarding identity does not match its discriminator.'
      );
    }
    return createLegacyIdentity(session.client_id, {
      provenance: model ? 'durable_legacy_session' : 'retained_pre_086_legacy_session',
    });
  }
  if (model !== IDENTITY_MODELS.CRM_V2) {
    throw new WhatsAppIdentityContractError(
      'WHATSAPP_IDENTITY_DISCRIMINATOR_MISMATCH',
      'CRM V2 onboarding identity requires the crm_v2 discriminator.'
    );
  }
  return createCrmV2Identity(session.crm_v2_client_id, {
    provenance: 'durable_crm_v2_session',
  });
}

function sessionIdentityColumns(identity) {
  if (!identity) {
    return { clientId: null, crmV2ClientId: null, identityModel: null };
  }
  if (identity.identityModel === IDENTITY_MODELS.LEGACY) {
    const normalized = createLegacyIdentity(identity.legacyClientId, { provenance: identity.provenance });
    return { clientId: normalized.legacyClientId, crmV2ClientId: null, identityModel: IDENTITY_MODELS.LEGACY };
  }
  if (identity.identityModel === IDENTITY_MODELS.CRM_V2) {
    const normalized = createCrmV2Identity(identity.crmV2ClientId, { provenance: identity.provenance });
    return { clientId: null, crmV2ClientId: normalized.crmV2ClientId, identityModel: IDENTITY_MODELS.CRM_V2 };
  }
  throw new WhatsAppIdentityContractError(
    'WHATSAPP_IDENTITY_UNKNOWN_MODEL',
    'Onboarding identity model is not supported.'
  );
}

function identityAuditMetadata(identity, { resolution = null } = {}) {
  if (!identity) {
    return {
      identityContractVersion: IDENTITY_CONTRACT_VERSION,
      identityModel: null,
      legacyClientId: null,
      crmV2ClientId: null,
      identityResolution: resolution || 'unbound',
      dualMaster: false,
    };
  }
  return {
    identityContractVersion: IDENTITY_CONTRACT_VERSION,
    identityModel: identity.identityModel,
    legacyClientId: identity.legacyClientId,
    crmV2ClientId: identity.crmV2ClientId,
    identityResolution: resolution || identity.provenance,
    dualMaster: false,
  };
}

function createWhatsAppCrmV2IdentityCompatService({
  resolveCrmV2ExactMobile = resolveCanonicalCrmV2ExactMobile,
} = {}) {
  async function resolveCrmV2ByExactMobile(mobile) {
    const result = await resolveCrmV2ExactMobile(mobile);
    if (result.status === 'found') {
      const identity = createCrmV2Identity(result.client.id);
      return {
        status: 'resolved',
        identity,
        client: result.client,
        audit: identityAuditMetadata(identity, { resolution: 'crm_v2_exact_mobile' }),
      };
    }
    if (result.status === 'conflict') {
      return {
        status: 'conflict',
        identity: null,
        client: null,
        normalizedMobile: result.normalizedMobile,
        clientIds: result.clientIds || [],
        audit: identityAuditMetadata(null, { resolution: 'crm_v2_exact_mobile_conflict' }),
      };
    }
    return {
      status: 'not_found',
      identity: null,
      client: null,
      normalizedMobile: result.normalizedMobile,
      audit: identityAuditMetadata(null, { resolution: 'crm_v2_exact_mobile_not_found' }),
    };
  }

  async function revalidateSessionIdentity({ phone, session }) {
    const identity = identityFromSession(session);
    if (!identity) {
      return {
        status: 'unbound',
        identity: null,
        client: null,
        resumable: true,
        audit: identityAuditMetadata(null, { resolution: 'durable_session_unbound' }),
      };
    }
    if (identity.identityModel === IDENTITY_MODELS.LEGACY) {
      return {
        status: 'legacy_compatible',
        identity,
        client: null,
        resumable: true,
        audit: identityAuditMetadata(identity, { resolution: 'retained_legacy_runtime' }),
      };
    }

    const exact = await resolveCrmV2ByExactMobile(phone);
    if (exact.status === 'resolved' && exact.identity.crmV2ClientId === identity.crmV2ClientId) {
      return {
        status: 'crm_v2_current',
        identity,
        client: exact.client,
        resumable: true,
        audit: identityAuditMetadata(identity, { resolution: 'crm_v2_restart_exact_mobile' }),
      };
    }
    if (exact.status === 'conflict') {
      return {
        status: 'crm_v2_conflict',
        identity,
        client: null,
        resumable: false,
        recovery: 'manual_rebind_required',
        audit: identityAuditMetadata(identity, { resolution: 'crm_v2_restart_mobile_conflict' }),
      };
    }
    return {
      status: 'crm_v2_stale',
      identity,
      client: exact.client || null,
      actualCrmV2ClientId: exact.identity?.crmV2ClientId || null,
      resumable: false,
      recovery: 'manual_rebind_required',
      audit: identityAuditMetadata(identity, { resolution: 'crm_v2_restart_stale_authority' }),
    };
  }

  return { resolveCrmV2ByExactMobile, revalidateSessionIdentity };
}

module.exports = {
  IDENTITY_CONTRACT_VERSION,
  IDENTITY_MODELS,
  WhatsAppIdentityContractError,
  createLegacyIdentity,
  createCrmV2Identity,
  identityFromSession,
  sessionIdentityColumns,
  identityAuditMetadata,
  createWhatsAppCrmV2IdentityCompatService,
};
