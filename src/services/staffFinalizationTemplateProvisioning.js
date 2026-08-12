const axios = require('axios');
const { discoverWabaId } = require('./birthdayTemplateProvisioning');

const GRAPH_VERSION = 'v23.0';
const TEMPLATE_NAME = 'shiloh_staff_finalization_v1';
const TEMPLATE_LANGUAGE = 'en';
const TEMPLATE_CATEGORY = 'UTILITY';
const TEMPLATE_BODY = 'Hi {{1}}, {{2}} Shiloh visit(s) {{4}} for {{3}}. Please open Shiloh Admin > Appointments > Finalize past visits and record Completed or No-show. Attendance is never inferred automatically.';

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

async function getStaffFinalizationTemplateStatus() {
  const wabaId = await discoverWabaId();
  if (!wabaId) return { ok: false, reason: 'waba_not_discovered', templateName: TEMPLATE_NAME };
  const templates = await listTemplates(wabaId);
  const target = (templates?.data || []).find((item) => item?.name === TEMPLATE_NAME) || null;
  return {
    ok: true,
    wabaId,
    templateName: TEMPLATE_NAME,
    template: sanitizeTemplate(target),
    definition: buildStaffFinalizationTemplateDefinition(),
  };
}

async function submitStaffFinalizationTemplate() {
  const status = await getStaffFinalizationTemplateStatus();
  if (!status.ok) return status;
  if (status.template) return { ...status, submitted: false, reason: 'already_exists' };
  const response = await axios.post(
    graphUrl(`${status.wabaId}/message_templates`),
    buildStaffFinalizationTemplateDefinition(),
    graphConfig()
  );
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
  buildStaffFinalizationTemplateDefinition,
  getStaffFinalizationTemplateStatus,
  submitStaffFinalizationTemplate,
};
