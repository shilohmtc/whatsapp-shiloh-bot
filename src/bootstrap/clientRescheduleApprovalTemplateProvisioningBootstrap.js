const logger = require('../lib/logger');

if (String(process.env.META_RESCHEDULE_APPROVAL_TEMPLATES_PROVISION_ON_START || '').toLowerCase() === 'true') {
  setImmediate(async () => {
    try {
      const { provisionRescheduleApprovalTemplatesOnce } = require('../services/clientRescheduleApprovalTemplateProvisioning');
      const result = await provisionRescheduleApprovalTemplatesOnce();
      logger.info({
        ok: result?.ok === true,
        results: (result?.results || []).map((item) => ({
          key: item.key,
          templateName: item.templateName,
          submitted: item.submitted === true,
          reason: item.reason || null,
          configured: item.template?.configured ?? null,
          providerStatus: item.template?.provider?.status || null,
          providerCategory: item.template?.provider?.category || null,
          providerLanguage: item.template?.provider?.language || null,
          exact: item.template?.contract?.exact ?? null,
          duplicateCount: item.template?.provider?.duplicateCount ?? null,
          providerComponents: item.template?.provider?.components || null,
        })),
      }, 'Reschedule approval Meta one-shot provisioning checked');
    } catch (error) {
      logger.error({ err: error, metaError: error.response?.data?.error }, 'Reschedule approval Meta one-shot provisioning failed');
    }
  });
}
