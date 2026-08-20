const axios = require('axios');
const { discoverWabaId } = require('./birthdayTemplateProvisioning');
const logger = require('../lib/logger');

const GRAPH_VERSION = 'v23.0';
const TEMPLATE_NAME = 'shiloh_booking_confirmation_v2';
const TEMPLATE_LANGUAGE = 'en';
const TEMPLATE_CATEGORY = 'UTILITY';
const TEMPLATE_HEADER = 'Appointment confirmed';
const TEMPLATE_BODY = `Hi {{1}}, your Shiloh appointment is confirmed. 🌿

✨ Service: {{2}}
👤 Practitioner: {{3}}
📅 Date: {{4}}
🕐 Time: {{5}}

Use the options below to add this appointment to your calendar or manage your booking.

We look forward to welcoming you. 🌿`;
const TEMPLATE_FOOTER = 'Shiloh Massage Therapy & Aesthetic Clinic';
const TEMPLATE_BUTTONS = Object.freeze([
  'Add to calendar',
  'Manage booking',
  'My appointments',
]);

function graphUrl(path) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${String(path).replace(/^\//, '')}`;
}

function graphConfig() {
  return {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  };
}

function buildBookingConfirmationV2TemplateDefinition() {
  return {
    name: TEMPLATE_NAME,
    language: TEMPLATE_LANGUAGE,
    category: TEMPLATE_CATEGORY,
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: TEMPLATE_HEADER,
      },
      {
        type: 'BODY',
        text: TEMPLATE_BODY,
        example: {
          body_text: [[
            'Naledi Mokoena',
            'Full Body Swedish',
            'Abigail',
            'Thursday, 20 August 2026',
            '15:00–16:30',
          ]],
        },
      },
      {
        type: 'FOOTER',
        text: TEMPLATE_FOOTER,
      },
      {
        type: 'BUTTONS',
        buttons: TEMPLATE_BUTTONS.map((text) => ({ type: 'QUICK_REPLY', text })),
      },
    ],
  };
}

function semanticButton(button = {}) {
  return { type: String(button.type || '').toUpperCase(), text: button.text ?? null };
}

function semanticComponents(components = []) {
  return (Array.isArray(components) ? components : []).map((component) => {
    const normalized = { type: String(component.type || '').toUpperCase() };
    if (component.format != null) normalized.format = String(component.format).toUpperCase();
    if (component.text != null) normalized.text = component.text;
    if (Array.isArray(component.buttons)) normalized.buttons = component.buttons.map(semanticButton);
    return normalized;
  });
}

function providerContractMatches(provider) {
  const expected = buildBookingConfirmationV2TemplateDefinition();
  return Boolean(
    provider?.name === expected.name &&
    provider?.language === expected.language &&
    String(provider?.category || '').toUpperCase() === expected.category &&
    JSON.stringify(semanticComponents(provider?.components)) === JSON.stringify(semanticComponents(expected.components))
  );
}

async function listTemplates(wabaId) {
  let url = graphUrl(`${wabaId}/message_templates`);
  let params = { fields: 'id,name,status,category,language,components', limit: 100 };
  const templates = [];
  do {
    const response = await axios.get(url, { ...graphConfig(), params });
    templates.push(...(response.data?.data || []));
    url = response.data?.paging?.next || null;
    params = undefined;
  } while (url);
  return templates;
}

function sanitizeTemplate(template, duplicateCount = 0) {
  if (!template) return null;
  return {
    name: template.name || null,
    status: template.status || null,
    category: template.category || null,
    language: template.language || null,
    duplicateCount,
    exact: providerContractMatches(template),
    components: semanticComponents(template.components),
  };
}

async function getBookingConfirmationV2TemplateStatus() {
  const wabaId = await discoverWabaId();
  if (!wabaId) return { ok: false, reason: 'waba_not_discovered', templateName: TEMPLATE_NAME };

  const templates = await listTemplates(wabaId);
  const variants = templates
    .filter((item) => item?.name === TEMPLATE_NAME && item?.language === TEMPLATE_LANGUAGE)
    .sort((a, b) => String(a?.id || '').localeCompare(String(b?.id || '')));
  const duplicateCount = Math.max(variants.length - 1, 0);
  return {
    ok: true,
    wabaId,
    templateName: TEMPLATE_NAME,
    template: sanitizeTemplate(variants[0] || null, duplicateCount),
    duplicateCount,
    definition: buildBookingConfirmationV2TemplateDefinition(),
  };
}

function logProviderVerification(status, reason) {
  logger.info({
    reason,
    templateName: status?.template?.name || TEMPLATE_NAME,
    providerStatus: status?.template?.status || null,
    providerCategory: status?.template?.category || null,
    providerLanguage: status?.template?.language || null,
    exact: status?.template?.exact ?? null,
    duplicateCount: status?.duplicateCount ?? status?.template?.duplicateCount ?? null,
    providerComponents: status?.template?.components || null,
  }, 'Booking confirmation v2 provider verification');
}

async function submitBookingConfirmationV2Template() {
  const status = await getBookingConfirmationV2TemplateStatus();
  if (!status.ok) return status;
  if (status.template) {
    if (status.duplicateCount > 0) {
      logProviderVerification(status, 'duplicate_variants_present');
      return { ...status, submitted: false, reason: 'duplicate_variants_present' };
    }
    if (status.template.exact) {
      logProviderVerification(status, 'already_exists_exact');
      return { ...status, submitted: false, reason: 'already_exists_exact' };
    }
    logProviderVerification(status, 'existing_contract_mismatch');
    return { ...status, submitted: false, reason: 'existing_contract_mismatch' };
  }

  const response = await axios.post(
    graphUrl(`${status.wabaId}/message_templates`),
    buildBookingConfirmationV2TemplateDefinition(),
    graphConfig()
  );

  const verification = await getBookingConfirmationV2TemplateStatus();
  logProviderVerification(verification, 'post_submission_readback');

  return {
    ok: true,
    wabaId: status.wabaId,
    templateName: TEMPLATE_NAME,
    submitted: true,
    reason: 'submitted',
    provider: {
      status: response.data?.status || null,
      category: response.data?.category || TEMPLATE_CATEGORY,
    },
    verification: verification?.template || null,
    duplicateCount: verification?.duplicateCount ?? null,
  };
}

function renderBookingConfirmationV2Body(values = []) {
  if (!Array.isArray(values) || values.length !== 5) throw new Error('Booking confirmation v2 requires exactly five body values');
  return TEMPLATE_BODY.replace(/\{\{([1-5])\}\}/g, (_, index) => String(values[Number(index) - 1] ?? ''));
}

module.exports = {
  TEMPLATE_NAME,
  TEMPLATE_LANGUAGE,
  TEMPLATE_CATEGORY,
  TEMPLATE_HEADER,
  TEMPLATE_BODY,
  TEMPLATE_FOOTER,
  TEMPLATE_BUTTONS,
  buildBookingConfirmationV2TemplateDefinition,
  providerContractMatches,
  getBookingConfirmationV2TemplateStatus,
  submitBookingConfirmationV2Template,
  renderBookingConfirmationV2Body,
};
