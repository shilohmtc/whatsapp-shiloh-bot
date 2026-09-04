const { pool } = require('../db/pool');
const {
  normalizeControlledPhone,
  resolveCurrentControlledDemoCrmV2Client,
} = require('./controlledDemoIdentity');

const CONTROLLED_MESSAGING_E2E_GATE = 'SHILOH_CONTROLLED_MESSAGING_E2E_ENABLED';

class ControlledMessagingTestLaneError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ControlledMessagingTestLaneError';
    this.code = code;
  }
}

function e2eLaneEnabled(env = process.env) {
  return String(env[CONTROLLED_MESSAGING_E2E_GATE] || '').trim().toLowerCase() === 'true'
    && Boolean(String(env.PHONE_NUMBER_ID || '').trim())
    && Boolean(String(env.WHATSAPP_TOKEN || '').trim());
}

function createControlledMessagingTestLane({
  db = pool,
  resolver = resolveCurrentControlledDemoCrmV2Client,
} = {}) {
  async function assertTarget({ clientId = null, crmV2ClientId = null, phone, env = process.env } = {}) {
    if (!e2eLaneEnabled(env)) {
      throw new ControlledMessagingTestLaneError(
        'CONTROLLED_MESSAGING_E2E_DISABLED',
        'Controlled messaging E2E is not explicitly enabled.'
      );
    }

    const target = await resolver(db);
    const normalizedPhone = normalizeControlledPhone(phone);
    const matchesLegacy = clientId != null
      && String(clientId) === String(target?.client?.id || '');
    const matchesCrmV2 = crmV2ClientId != null
      && String(crmV2ClientId) === String(target?.crmV2Client?.id || '');
    const matchesConfiguredMobile = normalizedPhone
      && normalizedPhone === normalizeControlledPhone(target?.normalizedPhone)
      && normalizedPhone === normalizeControlledPhone(target?.crmV2Client?.normalized_mobile);

    if (target?.status !== 'bound' || !matchesConfiguredMobile || (!matchesLegacy && !matchesCrmV2)) {
      throw new ControlledMessagingTestLaneError(
        'CONTROLLED_MESSAGING_E2E_TARGET_DENIED',
        'Outbound E2E target does not match the configured controlled CRM identity.'
      );
    }

    return {
      allowed: true,
      demoKey: target.demoKey,
      legacyClientId: Number(target.client.id),
      crmV2ClientId: Number(target.crmV2Client.id),
    };
  }

  return { assertTarget };
}

const lane = createControlledMessagingTestLane();

module.exports = {
  CONTROLLED_MESSAGING_E2E_GATE,
  ControlledMessagingTestLaneError,
  e2eLaneEnabled,
  createControlledMessagingTestLane,
  ...lane,
};
