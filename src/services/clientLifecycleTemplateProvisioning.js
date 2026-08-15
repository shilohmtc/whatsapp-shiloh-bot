const axios = require('axios');
const { discoverWabaId } = require('./birthdayTemplateProvisioning');

const GRAPH_VERSION = 'v23.0';
const TEMPLATE_LANGUAGE = 'en';
const TEMPLATE_CATEGORY = 'UTILITY';

const DEFINITIONS = Object.freeze({
  reminder_actions: {
    name: 'shiloh_appointment_reminder_actions_v1',
    env: 'WHATSAPP_REMINDER_ACTIONS_TEMPLATE',
    body: 'Hi {{1}}, a reminder of your Shiloh appointment. 🌿\n\n✨ Service: {{2}}\n📅 Date: {{3}}\n🕐 Time: {{4}}\n\nNeed to make a change? Use an option below.',
    example: [['Christel', 'HIFU', 'Friday, 21 August 2026', '10:00']],
    buttons: [
      { type: 'QUICK_REPLY', text: 'Reschedule' },
      { type: 'QUICK_REPLY', text: 'Cancel booking' },
    ],
  },
  reschedule_confirmation: {
    name: 'shiloh_reschedule_confirmation_v1',
    env: 'WHATSAPP_RESCHEDULE_CONFIRMATION_TEMPLATE',
    body: 'Hi {{1}}, your Shiloh appointment has been rescheduled. 🌿\n\n✨ Service: {{2}}\n👤 With: {{3}}\n📅 New date: {{4}}\n🕐 New time: {{5}}\n\nReply RESCHEDULE or CANCEL if you need another change.',
    example: [['Christel', 'HIFU', 'Marietjie', 'Friday, 21 August 2026', '10:00']],
  },
  cancellation_confirmation: {
    name: 'shiloh_cancellation_confirmation_v1',
    env: 'WHATSAPP_CANCELLATION_CONFIRMATION_TEMPLATE',
    body: 'Hi {{1}}, your Shiloh appointment has been cancelled.\n\n✨ Service: {{2}}\n📅 Date: {{3}}\n🕐 Time: {{4}}\nBooking #{{5}}\n\nReply BOOK if you would like to make another appointment. 🌿',
    example: [['Christel', 'HIFU', 'Friday, 21 August 2026', '10:00', '567']],
  },
});

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

function buildDefinition(key) {
  const item = DEFINITIONS[key];
  if (!item) throw new Error(`Unknown lifecycle template: ${key}`);
  const components = [{ type: 'BODY', text: item.body, example: { body_text: item.example } }];
  if (item.buttons) components.push({ type: 'BUTTONS', buttons: item.buttons });
  return { name: item.name, language: TEMPLATE_LANGUAGE, category: TEMPLATE_CATEGORY, components };
}

function sanitize(template) {
  if (!template) return null;
  return {
    id: template.id || null,
    name: template.name || null,
    status: template.status || null,
    category: template.category || null,
    language: template.language || null,
  };
}

async function listProviderTemplates(wabaId) {
  const response = await axios.get(graphUrl(`${wabaId}/message_templates`), {
    ...graphConfig(),
    params: { fields: 'id,name,status,category,language,components', limit: 250 },
  });
  return response.data?.data || [];
}

async function getClientLifecycleTemplateStatus() {
  const wabaId = await discoverWabaId();
  if (!wabaId) return { ok: false, reason: 'waba_not_discovered', templates: [] };
  const providerTemplates = await listProviderTemplates(wabaId);
  const templates = Object.entries(DEFINITIONS).map(([key, item]) => {
    const provider = providerTemplates.find((candidate) => candidate?.name === item.name) || null;
    return {
      key,
      templateName: item.name,
      configuredTemplateName: process.env[item.env] || null,
      provider: sanitize(provider),
      safeToEnable: provider?.status === 'APPROVED' && process.env[item.env] === item.name,
      definition: buildDefinition(key),
    };
  });
  return { ok: true, wabaId, templates };
}

// Provider mutation is deliberately explicit: nothing calls this at application startup.
async function submitClientLifecycleTemplate(key) {
  const item = DEFINITIONS[key];
  if (!item) throw new Error(`Unknown lifecycle template: ${key}`);
  const status = await getClientLifecycleTemplateStatus();
  if (!status.ok) return status;
  const existing = status.templates.find((template) => template.key === key)?.provider;
  if (existing) return { ...status, key, submitted: false, reason: 'already_exists', provider: existing };
  const response = await axios.post(
    graphUrl(`${status.wabaId}/message_templates`),
    buildDefinition(key),
    graphConfig()
  );
  return {
    ok: true,
    wabaId: status.wabaId,
    key,
    templateName: item.name,
    submitted: true,
    provider: {
      id: response.data?.id || null,
      status: response.data?.status || null,
      category: response.data?.category || TEMPLATE_CATEGORY,
    },
  };
}

module.exports = {
  DEFINITIONS,
  TEMPLATE_LANGUAGE,
  TEMPLATE_CATEGORY,
  buildDefinition,
  getClientLifecycleTemplateStatus,
  submitClientLifecycleTemplate,
};
