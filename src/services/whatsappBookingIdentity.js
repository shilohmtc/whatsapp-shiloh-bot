const { pool } = require('../db/pool');
const { registrationStatus } = require('./clientRegistrationPolicy');
const { resolveVerifiedClientByWhatsApp } = require('./clientVerifiedIdentity');
const {
  IDENTITY_MODELS,
  createLegacyIdentity,
  createCrmV2Identity,
  identityFromSession,
  identityAuditMetadata,
  createWhatsAppCrmV2IdentityCompatService,
} = require('./whatsappCrmV2IdentityCompat');
const {
  normalizeMobile,
  createCrmV2ClientService,
} = require('./crmV2ClientService');
const { PostgresCrmV2ClientRepository } = require('../repositories/crmV2ClientRepository');

const CRM_V2_LEGACY_ONLY_BOUNDARY_REPLY = [
  'This appointment is linked to your Clean CRM V2 profile.',
  'That option still requires the retained legacy client model, so I won\'t create a duplicate client or compatibility contact to continue.',
  'Please contact the clinic team for help. No booking or client record has been changed.',
].join(' ');

function normalizePhone(value = '') {
  return String(value || '').replace(/[^0-9]/g, '');
}

function bookingProfileComplete(identity, client = {}) {
  if (identity?.identityModel === IDENTITY_MODELS.CRM_V2) {
    return Boolean(
      client.status === 'active'
      && String(client.name || client.display_name || '').trim()
      && normalizeMobile(client.normalizedMobile || client.normalized_value)
    );
  }
  return registrationStatus({
    fullName: client.display_name,
    mobileNumber: client.normalized_value,
    dateOfBirth: client.date_of_birth,
  }).complete;
}

function compatibleClient(identity, client) {
  if (!client) return null;
  if (identity.identityModel === IDENTITY_MODELS.CRM_V2) {
    return {
      ...client,
      id: String(client.id),
      display_name: client.name,
      normalized_value: client.normalizedMobile,
      date_of_birth: client.dateOfBirth,
      profile_status: client.profileStatus,
    };
  }
  return client;
}

function createWhatsAppBookingIdentityService({
  queryable = pool,
  resolveLegacyAuthority = resolveVerifiedClientByWhatsApp,
  crmV2Compat = createWhatsAppCrmV2IdentityCompatService(),
} = {}) {
  async function durableSession(phone) {
    const result = await queryable.query(`
      SELECT phone,client_id,crm_v2_client_id,identity_model,state,authority_version
        FROM client_onboarding_sessions
       WHERE phone=$1
       LIMIT 1
    `, [normalizePhone(phone)]);
    return result.rows[0] || null;
  }

  async function resolveByPhone(phone) {
    const session = await durableSession(phone);
    if (session) {
      let durableIdentity;
      try {
        durableIdentity = identityFromSession(session);
      } catch (error) {
        return { status: 'identity_contract_invalid', authorityStatus: error.code, client: null, clientIdentity: null, bookingReady: false };
      }
      if (durableIdentity?.identityModel === IDENTITY_MODELS.CRM_V2) {
        const exact = await crmV2Compat.revalidateSessionIdentity({ phone, session });
        if (exact.status !== 'crm_v2_current') {
          return {
            status: exact.status,
            authorityStatus: exact.status,
            client: null,
            clientIdentity: durableIdentity,
            identityAudit: exact.audit,
            bookingReady: false,
          };
        }
        const client = compatibleClient(durableIdentity, exact.client);
        return {
          status: 'unique',
          authorityStatus: exact.status,
          clientIdentity: durableIdentity,
          client,
          identityAudit: exact.audit,
          bookingReady: bookingProfileComplete(durableIdentity, client),
        };
      }
    }

    const authority = await resolveLegacyAuthority(phone);
    if (authority.status !== 'verified_client' || !authority.client?.id) {
      return { ...authority, authorityStatus: authority.status, clientIdentity: null, bookingReady: false };
    }
    const clientIdentity = createLegacyIdentity(authority.client.id, { provenance: 'legacy_whatsapp_booking' });
    if (session?.client_id && String(session.client_id) !== clientIdentity.legacyClientId) {
      return { status: 'legacy_stale', authorityStatus: 'durable_legacy_mismatch', client: null, clientIdentity, bookingReady: false };
    }
    return {
      ...authority,
      status: 'unique',
      authorityStatus: 'verified_client',
      clientIdentity,
      bookingReady: bookingProfileComplete(clientIdentity, authority.client),
      identityAudit: identityAuditMetadata(clientIdentity, { resolution: 'legacy_verified_whatsapp' }),
    };
  }

  return { durableSession, resolveByPhone };
}

async function resolveFinalBookingIdentity({ db, phone, identity }) {
  if (!identity) return { status: 'identity_missing', client: null };
  if (identity.identityModel === IDENTITY_MODELS.LEGACY) {
    const result = await db.query(`
      SELECT c.id,c.display_name,c.date_of_birth,c.status,cc.normalized_value
        FROM clients c
        JOIN client_contacts cc ON cc.client_id=c.id
       WHERE c.id=$1
         AND c.status='active'
         AND cc.normalized_value=$2
         AND LOWER(cc.contact_type) IN ('whatsapp','mobile','phone','telephone')
       ORDER BY cc.is_primary DESC,cc.id
       LIMIT 1
       FOR UPDATE OF c,cc
    `, [identity.legacyClientId, normalizePhone(phone)]);
    const client = result.rows[0] || null;
    return client
      ? { status: 'ready', identity, client, audit: identityAuditMetadata(identity, { resolution: 'legacy_final_exact_mobile' }) }
      : { status: 'legacy_stale', identity, client: null, audit: identityAuditMetadata(identity, { resolution: 'legacy_final_authority_missing' }) };
  }
  if (identity.identityModel !== IDENTITY_MODELS.CRM_V2) return { status: 'identity_model_unsupported', client: null };

  const normalizedMobile = normalizeMobile(phone);
  if (!normalizedMobile) {
    return { status: 'crm_v2_invalid_mobile', identity, client: null, audit: identityAuditMetadata(identity, { resolution: 'crm_v2_final_invalid_mobile' }) };
  }
  const repository = new PostgresCrmV2ClientRepository(db);
  const service = createCrmV2ClientService({ repository });
  await repository.lockNormalizedMobile(normalizedMobile);
  const exact = await service.resolveExactMobile(normalizedMobile, repository, { forUpdate: true });
  if (exact.status !== 'found' || String(exact.client.id) !== String(identity.crmV2ClientId)) {
    const resolution = exact.status === 'conflict' ? 'crm_v2_final_mobile_conflict' : 'crm_v2_final_stale_authority';
    return { status: exact.status === 'conflict' ? 'crm_v2_conflict' : 'crm_v2_stale', identity, client: null, audit: identityAuditMetadata(identity, { resolution }) };
  }
  const client = compatibleClient(identity, exact.client);
  if (!bookingProfileComplete(identity, client)) {
    return { status: 'crm_v2_profile_invalid', identity, client: null, audit: identityAuditMetadata(identity, { resolution: 'crm_v2_final_profile_invalid' }) };
  }
  return {
    status: 'ready',
    identity,
    client,
    audit: identityAuditMetadata(identity, { resolution: 'crm_v2_final_exact_mobile_locked' }),
  };
}

function appointmentIdentityColumns(identity, client) {
  if (identity?.identityModel === IDENTITY_MODELS.LEGACY) {
    return { clientId: identity.legacyClientId, crmV2ClientId: null, sourceClientName: client.display_name };
  }
  if (identity?.identityModel === IDENTITY_MODELS.CRM_V2) {
    return { clientId: null, crmV2ClientId: identity.crmV2ClientId, sourceClientName: client.name || client.display_name };
  }
  throw new Error('WhatsApp appointment identity must be exactly legacy or crm_v2.');
}

function identityFromAppointment(appointment = {}) {
  if (appointment.client_id != null && appointment.crm_v2_client_id == null) return createLegacyIdentity(appointment.client_id, { provenance: 'appointment_legacy' });
  if (appointment.client_id == null && appointment.crm_v2_client_id != null) return createCrmV2Identity(appointment.crm_v2_client_id, { provenance: 'appointment_crm_v2' });
  return null;
}

const service = createWhatsAppBookingIdentityService();

module.exports = {
  CRM_V2_LEGACY_ONLY_BOUNDARY_REPLY,
  normalizePhone,
  bookingProfileComplete,
  compatibleClient,
  createWhatsAppBookingIdentityService,
  resolveWhatsAppBookingIdentity: service.resolveByPhone,
  resolveFinalBookingIdentity,
  appointmentIdentityColumns,
  identityFromAppointment,
};
