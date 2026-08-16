const axios = require('axios');
const { discoverWabaId } = require('./birthdayTemplateProvisioning');

const GRAPH_VERSION = 'v23.0';
const TEMPLATE_NAME = 'shiloh_staff_finalization_v1';
const ACTION_TEMPLATE_NAME = 'shiloh_staff_finalization_actions_v1';
const TEMPLATE_LANGUAGE = 'en';
const TEMPLATE_CATEGORY = 'UTILITY';
const TEMPLATE_BODY = 'Hi {{1}}, {{2}} Shiloh visit(s) {{4}} for {{3}}. Please open Shiloh Admin > Appointments > Finalize past visits and record Completed or No-show. Attendance is never inferred automatically.';
const ACTION_TEMPLATE_BODY = 'Hi {{1}}, you have {{2}} Shiloh visit(s) awaiting finalization. Review them in batches if needed and return later. Attendance is never inferred automatically.';
const ACTION_BUTTON_TEXT = 'Finalize past visits';
const ACTION_BUTTON_PAYLOAD = 'admin_action_finalize';

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

function buildStaffFinalizationTemplateDefinition() {
  return {
    name: TEMPLATE_NAME,
    language: TEMPLATE_LANGUAGE,
    category: TEMPLATE_CATEGORY,
    components: [
      {
        type: 'BODY',
        text: TEMPLATE_BODY,
        example: {
          body_text: [['Abigail', '2', '2026-08-12', 'need finalization from today']],
        },
      },
    ],
  };
}

function buildStaffFinalizationActionTemplateDefinition() {
  return {
    name: ACTION_TEMPLATE_NAME,
    language: TEMPLATE_LANGUAGE,
    category: TEMPLATE_CATEGORY,
    components: [
      {
        type: 'BODY',
        text: ACTION_TEMPLATE_BODY,
        example: { body_text: [['Christel', '24']] },
      },
      {
        type: 'BUTTONS',
        buttons: [{ type: 'QUICK_REPLY', text: ACTION_BUTTON_TEXT }],
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

function sanitizeTemplate(template) {
  if (!template) return null;
  return {
    id: template.id || null,
    name: template.name || null,
    status: template.status || null,
    category: template.category || null,
    language: template.language || null,
  };
}

async function statusFor(templateName, definition) {
  const wabaId = await discoverWabaId();
  if (!wabaId) return { ok: false, reason: 'waba_not_discovered', templateName };
  const templates = await listTemplates(wabaId);
  const target = (templates?.data || []).find((item) => item?.name === templateName) || null;
  return { ok: true, wabaId, templateName, template: sanitizeTemplate(target), definition };
}

async function getStaffFinalizationTemplateStatus() {
  return statusFor(TEMPLATE_NAME, buildStaffFinalizationTemplateDefinition());
}

async function getStaffFinalizationActionTemplateStatus() {
  return statusFor(ACTION_TEMPLATE_NAME, buildStaffFinalizationActionTemplateDefinition());
}

async function submitDefinition(status) {
  if (!status.ok) return status;
  if (status.template) return { ...status, submitted: false, reason: 'already_exists' };
  const response = await axios.post(graphUrl(`${status.wabaId}/message_templates`), status.definition, graphConfig());
  return {
    ok: true,
    wabaId: status.wabaId,
    templateName: status.templateName,
    submitted: true,
    provider: {
      id: response.data?.id || null,
      status: response.data?.status || null,
      category: response.data?.category || TEMPLATE_CATEGORY,
    },
  };
}

async function submitStaffFinalizationTemplate() {
  return submitDefinition(await getStaffFinalizationTemplateStatus());
}

async function submitStaffFinalizationActionTemplate() {
  return submitDefinition(await getStaffFinalizationActionTemplateStatus());
}

module.exports = {
  TEMPLATE_NAME,
  ACTION_TEMPLATE_NAME,
  TEMPLATE_LANGUAGE,
  TEMPLATE_CATEGORY,
  TEMPLATE_BODY,
  ACTION_TEMPLATE_BODY,
  ACTION_BUTTON_TEXT,
  ACTION_BUTTON_PAYLOAD,
  buildStaffFinalizationTemplateDefinition,
  buildStaffFinalizationActionTemplateDefinition,
  getStaffFinalizationTemplateStatus,
  getStaffFinalizationActionTemplateStatus,
  submitStaffFinalizationTemplate,
  submitStaffFinalizationActionTemplate,
};
