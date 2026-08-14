const axios = require('axios');
const { discoverWabaId } = require('./birthdayTemplateProvisioning');

const GRAPH_VERSION = 'v23.0';
const TEMPLATE_NAME = 'shiloh_appointment_reminder_actions_v1';
const TEMPLATE_LANGUAGE = 'en';
const TEMPLATE_CATEGORY = 'UTILITY';
const TEMPLATE_BODY = `Hello {{1}},

This is a friendly reminder of your appointment at Shiloh Massage Therapy & Aesthetic Clinic.

Treatment: {{2}}
Date: {{3}}
Time: {{4}}

We look forward to welcoming you.

Need to make a change? Use a button below.`;

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

function buildReminderActionTemplateDefinition() {
  return {
    name: TEMPLATE_NAME,
    language: TEMPLATE_LANGUAGE,
    category: TEMPLATE_CATEGORY,
    components: [
      {
        type: 'BODY',
        text: TEMPLATE_BODY,
        example: {
          body_text: [['Dummy Test', 'Medi-Heel Pedicure', 'Sat, 15 Aug 2026', '12:15']],
        },
      },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'QUICK_REPLY', text: 'Reschedule' },
          { type: 'QUICK_REPLY', text: 'Cancel booking' },
        ],
      },
    ],
  };
}

async function listTemplates(wabaId) {
  const response = await axios.get(graphUrl(`${wabaId}/message_templates`), {
    ...graphConfig(),
    params: { fields: 'id,name,status,category,language,components', limit: 250 },
  });
  return response.data;
}

async function getReminderActionTemplateStatus() {
  const wabaId = await discoverWabaId();
  if (!wabaId) return { ok: false, reason: 'waba_not_discovered', templateName: TEMPLATE_NAME };
  const templates = await listTemplates(wabaId);
  const template = (templates?.data || []).find((item) => item?.name === TEMPLATE_NAME) || null;
  return {
    ok: true,
    wabaId,
    templateName: TEMPLATE_NAME,
    configuredTemplateName: process.env.WHATSAPP_REMINDER_ACTIONS_TEMPLATE || null,
    template: template ? { id: template.id || null, name: template.name || null, status: template.status || null, category: template.category || null, language: template.language || null } : null,
    definition: buildReminderActionTemplateDefinition(),
  };
}

async function submitReminderActionTemplate() {
  const status = await getReminderActionTemplateStatus();
  if (!status.ok) return status;
  if (status.template) return { ...status, submitted: false, reason: 'already_exists' };
  const response = await axios.post(graphUrl(`${status.wabaId}/message_templates`), buildReminderActionTemplateDefinition(), graphConfig());
  return {
    ok: true,
    wabaId: status.wabaId,
    templateName: TEMPLATE_NAME,
    submitted: true,
    provider: {
      id: response.data?.id || null,
      status: response.data?.status || null,
      category: response.data?.category || TEMPLATE_CATEGORY,
    },
  };
}

module.exports = {
  TEMPLATE_NAME,
  TEMPLATE_LANGUAGE,
  TEMPLATE_CATEGORY,
  TEMPLATE_BODY,
  buildReminderActionTemplateDefinition,
  getReminderActionTemplateStatus,
  submitReminderActionTemplate,
};
