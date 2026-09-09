const axios = require('axios');
const { discoverWabaId } = require('./birthdayTemplateProvisioning');
const logger = require('../lib/logger');

const GRAPH_VERSION = 'v23.0';
const TEMPLATE_NAME = 'shiloh_workspace_booking_request_alert_v1';
const TEMPLATE_LANGUAGE = 'en';
const TEMPLATE_CATEGORY = 'UTILITY';
const TEMPLATE_BODY = `Hi {{1}}, a new booking request is waiting in Shiloh Workspace. 🌿\n\n{{2}} request(s) currently need attention.\n\nOpen Workspace to review and respond.`;
const TEMPLATE_BUTTONS = Object.freeze(['Open Workspace']);

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

function buildWorkspaceBookingRequestAlertTemplateDefinition() {
  return {
    name: TEMPLATE_NAME,
    language: TEMPLATE_LANGUAGE,
    category: TEMPLATE_CATEGORY,
    components: [
      {
        type: 'BODY',
        text: TEMPLATE_BODY,
        example: { body_text: [['Christel', '3']] },
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
  const expected = buildWorkspaceBookingRequestAlertTemplateDefinition();
  return Boolean(
    provider?.name === expected.name
    && provider?.language === expected.language
    && String(provider?.category || '').toUpperCase() === expected.category
    && JSON.stringify(semanticComponents(provider?.components)) === JSON.stringify(semanticComponents(expected.components))
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

async function getWorkspaceBookingRequestAlertTemplateStatus() {
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
    definition: buildWorkspaceBookingRequestAlertTemplateDefinition(),
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
  }, 'Workspace booking request alert provider verification');
}

async function submitWorkspaceBookingRequestAlertTemplate() {
  const status = await getWorkspaceBookingRequestAlertTemplateStatus();
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
    buildWorkspaceBookingRequestAlertTemplateDefinition(),
    graphConfig(),
  );
  const verification = await getWorkspaceBookingRequestAlertTemplateStatus();
  logProviderVerification(verification, 'post_submission_readback');
  return {
    ok: true,
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

module.exports = {
  TEMPLATE_NAME,
  TEMPLATE_LANGUAGE,
  TEMPLATE_CATEGORY,
  TEMPLATE_BODY,
  TEMPLATE_BUTTONS,
  buildWorkspaceBookingRequestAlertTemplateDefinition,
  providerContractMatches,
  getWorkspaceBookingRequestAlertTemplateStatus,
  submitWorkspaceBookingRequestAlertTemplate,
};
