require("dotenv").config();
const path = require("path");
const express = require("express");
const { validateEnv } = require("./src/config/env");
const logger = require("./src/lib/logger");
const requestContext = require("./src/middleware/requestContext");
const { presentClientFamilyResult } = require("./src/presentation/clientFamilyPresentation");
const { presentClientAppointmentChangeResult } = require("./src/presentation/clientAppointmentChangePresentation");
const { presentCustomerExperienceResult } = require("./src/presentation/customerExperiencePresentation");
const clientFamilyService = require("./src/services/clientServiceFamilyDiscovery");
const appointmentChangeService = require("./src/services/appointmentChange");
const { decorateAppointmentChangeTemplate } = require("./src/services/appointmentChangeTemplateDelivery");
const customerExperienceService = require("./src/services/customerExperience");
const clientIdentityService = require("./src/services/clientIdentityOnboarding");
const clientDiscoveryService = require("./src/services/clientDiscoveryMenu");
const { installClientNavigationPriority } = require("./src/services/clientNavigationPriority");
const adminAssistantService = require("./src/services/adminAssistant");
const { activateSportsPackage } = require("./src/services/clientDiscoveryPackages");

validateEnv();
const processClientServiceFamilyMessage = clientFamilyService.processClientServiceFamilyMessage;
clientFamilyService.processClientServiceFamilyMessage = async (...args) => presentClientFamilyResult(await processClientServiceFamilyMessage(...args));
const processAppointmentChangeMessage = appointmentChangeService.processAppointmentChangeMessage;
appointmentChangeService.processAppointmentChangeMessage = async (phone, text, ...rest) => {
  const priorIntent = await appointmentChangeService.getIntent(phone);
  const result = await processAppointmentChangeMessage(phone, text, ...rest);
  const templated = await decorateAppointmentChangeTemplate(phone, priorIntent, result);
  return presentClientAppointmentChangeResult(templated);
};
const processCustomerExperienceMessage = customerExperienceService.processCustomerExperienceMessage;
customerExperienceService.processCustomerExperienceMessage = async (...args) => presentCustomerExperienceResult(await processCustomerExperienceMessage(...args));
installClientNavigationPriority({ identityService: clientIdentityService, discoveryService: clientDiscoveryService });

// Package activation is an explicit business-admin command. Delegate it before the
// generic Admin assistant fallback claims unknown Admin text, while leaving all other
// Admin commands on their established path.
const processAdminAssistantMessage = adminAssistantService.processAdminAssistantMessage;
adminAssistantService.processAdminAssistantMessage = async (sender, text, ...rest) => {
  const activation = String(text || '').trim().match(/^(?:activate|grant)\s+sports massage(?:\s+monthly)?\s+package\s+(?:for|to)\s+(.+)$/i);
  if (activation) {
    const result = await activateSportsPackage(sender, activation[1]);
    if (result?.handled) return result;
  }
  return processAdminAssistantMessage(sender, text, ...rest);
};

const webhookRoutes = require("./src/routes/webhook");
const adminRoutes = require("./src/routes/admin");
const privacyRoutes = require("./src/routes/privacy");
const auditReadRoutes = require("./src/routes/auditRead");
const calendarRoutes = require("./src/routes/calendar");
const walkinRoutes = require("./src/routes/walkin");
const bookRoutes = require("./src/routes/book");
const serviceRoutes = require("./src/routes/services");
const { checkDatabase, startConversationSessionCleanupScheduler } = require("./src/services/memory");
const { startTemporarySessionCleanupScheduler } = require("./src/services/temporarySessionRetention");
const { startGoogleBusinessProfileSyncScheduler } = require("./src/services/googleBusinessProfileSync");
const { startAppointmentLifecycleScheduler } = require("./src/services/appointmentLifecycle");
const { startCustomerCareScheduler } = require("./src/services/customerCare");
const { startBookingIntegrityScheduler } = require("./src/services/bookingIntegrityMonitor");
const { ensureDemoClientPermissions } = require("./src/services/demoClientAccessBootstrap");
const { ensureJeanPierreAdminCapabilities } = require("./src/services/jeanPierreAdminAccessBootstrap");
const { ensureChristelMediHeelOwnership } = require("./src/services/pedicureOwnershipBootstrap");
const { ensureMassagePackageSchema } = require("./src/services/massagePackageBootstrap");
const { ensureChristelServiceCatalogueCorrection } = require("./src/services/christelServiceCatalogueCorrectionBootstrap");
const { startMandatoryDemoCleanupScheduler } = require("./src/services/demoMandatoryCleanup");
const { startAttendanceFinalizationReminderScheduler } = require("./src/services/attendanceFinalizationReminders");
const { startHistoricalFinalizationPromptScheduler } = require("./src/services/historicalFinalizationPrompt");
const { ensureHistoricalFinalizationFinancialSchema } = require("./src/services/historicalFinalizationFinancialBootstrap");
const { runConfiguredClientProvenanceAudit } = require("./src/services/clientProvenanceAudit");
const { submitStaffFinalizationTemplate, submitStaffFinalizationActionTemplate } = require("./src/services/staffFinalizationTemplateProvisioning");
const { submitBookingConfirmationTemplate } = require("./src/services/bookingConfirmationTemplateProvisioning");
const { submitBookingConfirmationV2Template } = require("./src/services/bookingConfirmationV2TemplateProvisioning");
const { DEFINITIONS: CLIENT_LIFECYCLE_TEMPLATE_DEFINITIONS, getClientLifecycleTemplateStatus, submitClientLifecycleTemplate } = require("./src/services/clientLifecycleTemplateProvisioning");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(requestContext);
app.use("/assets/service-images", express.static(path.join(__dirname, "public", "service-images"), { maxAge: "30d", immutable: true }));
app.get("/", (req, res) => res.status(200).json({ service: "shiloh-whatsapp-bot", status: "running" }));
app.get("/health", async (req, res) => { const ok = await checkDatabase(); return res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "degraded", database: ok ? "ok" : "unavailable", timestamp: new Date().toISOString() }); });
app.use("/audit-read", auditReadRoutes); app.use("/admin/privacy", privacyRoutes); app.use("/admin", adminRoutes); app.use("/calendar", calendarRoutes); app.use("/", serviceRoutes); app.use("/", walkinRoutes); app.use("/", bookRoutes); app.use("/", webhookRoutes);
app.use((err, req, res, next) => { const log = req.log || logger; log.error({ err }, "Unhandled Express error"); if (res.headersSent) return next(err); return res.status(500).json({ error: "Internal server error", requestId: req.id }); });

async function provisionStaffFinalizationTemplateSafely() { try { const result = await submitStaffFinalizationTemplate(); logger.info({ ok: result?.ok === true, submitted: result?.submitted === true, reason: result?.reason || null, templateName: result?.templateName || null, providerStatus: result?.provider?.status || result?.template?.status || null, providerCategory: result?.provider?.category || result?.template?.category || null }, "Staff finalization WhatsApp template provisioning checked"); } catch (error) { logger.warn({ err: error }, "Staff finalization WhatsApp template provisioning failed; reminders remain fail-closed"); } }
async function provisionStaffFinalizationActionTemplateSafely() { try { const result = await submitStaffFinalizationActionTemplate(); logger.info({ ok: result?.ok === true, submitted: result?.submitted === true, reason: result?.reason || null, templateName: result?.templateName || null, providerStatus: result?.provider?.status || result?.template?.status || null, providerCategory: result?.provider?.category || result?.template?.category || null }, "Staff finalization action template provisioning checked"); } catch (error) { logger.warn({ err: error }, "Staff finalization action template provisioning failed; button prompt remains fail-closed"); } }
async function provisionBookingConfirmationTemplateSafely() { try { const result = await submitBookingConfirmationTemplate(); logger.info({ ok: result?.ok === true, submitted: result?.submitted === true, reason: result?.reason || null, templateName: result?.templateName || null, configuredTemplateName: result?.configuredTemplateName || null, providerStatus: result?.provider?.status || result?.template?.status || null, providerCategory: result?.provider?.category || result?.template?.category || null }, "Booking confirmation WhatsApp template provisioning checked"); } catch (error) { logger.warn({ err: error }, "Booking confirmation WhatsApp template provisioning failed; plain-text confirmation remains active"); } }
async function provisionBookingConfirmationV2IfExplicitlyEnabled() {
  if (String(process.env.META_BOOKING_CONFIRMATION_V2_PROVISION_ON_START || '').toLowerCase() !== 'true') return;
  try {
    const result = await submitBookingConfirmationV2Template();
    logger.info({
      ok: result?.ok === true,
      submitted: result?.submitted === true,
      reason: result?.reason || null,
      templateName: result?.templateName || null,
      providerStatus: result?.provider?.status || result?.template?.status || null,
      providerCategory: result?.provider?.category || result?.template?.category || null,
      providerLanguage: result?.template?.language || null,
      exact: result?.template?.exact ?? null,
      duplicateCount: result?.duplicateCount ?? result?.template?.duplicateCount ?? null,
    }, "Booking confirmation v2 one-shot provisioning checked");
  } catch (error) {
    logger.error({ err: error, metaError: error.response?.data?.error }, "Booking confirmation v2 one-shot provisioning failed");
  }
}
async function provisionClientLifecycleTemplatesIfExplicitlyEnabled() {
  if (String(process.env.META_LIFECYCLE_PROVISION_ON_START || '').toLowerCase() !== 'true') return;
  try {
    const before = await getClientLifecycleTemplateStatus();
    if (!before?.ok) { logger.warn({ reason: before?.reason || null }, "Client lifecycle template one-shot provisioning skipped"); return; }
    const keys = Object.keys(CLIENT_LIFECYCLE_TEMPLATE_DEFINITIONS); const results = [];
    for (const key of keys) { const existing = before.templates.find((item) => item.key === key)?.provider; if (existing) { results.push({ key, submitted: false, reason: 'already_exists', providerStatus: existing.status || null }); continue; } const result = await submitClientLifecycleTemplate(key); results.push({ key, submitted: result?.submitted === true, reason: result?.reason || null, providerStatus: result?.provider?.status || null }); }
    logger.info({ results }, "Client lifecycle template one-shot provisioning completed");
  } catch (error) { logger.error({ err: error, metaError: error.response?.data?.error }, "Client lifecycle template one-shot provisioning failed"); }
}

const PORT = process.env.PORT || 3000; let server;
async function start() {
  const packageSchema = await ensureMassagePackageSchema(); logger.info(packageSchema, "Massage package schema verified");
  const demoAccess = await ensureDemoClientPermissions(); logger.info(demoAccess, "Controlled demo client production UI disabled");
  const jeanPierreAccess = await ensureJeanPierreAdminCapabilities(); if (!jeanPierreAccess) throw new Error('Jean-Pierre business admin capability clone could not be initialized'); logger.info({ configured: true, businessRole: jeanPierreAccess.business_role }, "Jean-Pierre business admin access verified");
  const mediHeelOwnership = await ensureChristelMediHeelOwnership(); logger.info(mediHeelOwnership, "Christel MediHeel ownership verified");
  const christelCatalogueCorrection = await ensureChristelServiceCatalogueCorrection(); logger.info(christelCatalogueCorrection, "Christel service catalogue correction verified");
  await ensureHistoricalFinalizationFinancialSchema(); logger.info({ initialized: true }, "Historical finalization financial schema verified");
  try { await runConfiguredClientProvenanceAudit(logger); } catch (error) { logger.error({ err: error }, "Read-only CRM provenance audit failed"); }
  await provisionStaffFinalizationTemplateSafely(); await provisionStaffFinalizationActionTemplateSafely(); await provisionBookingConfirmationTemplateSafely(); await provisionBookingConfirmationV2IfExplicitlyEnabled(); await provisionClientLifecycleTemplatesIfExplicitlyEnabled();
  server = app.listen(PORT, () => { logger.info({ port: PORT }, "Shiloh started"); startConversationSessionCleanupScheduler(); startTemporarySessionCleanupScheduler(); startGoogleBusinessProfileSyncScheduler(); startAppointmentLifecycleScheduler(); startCustomerCareScheduler(); startBookingIntegrityScheduler(); startMandatoryDemoCleanupScheduler(); startAttendanceFinalizationReminderScheduler(); startHistoricalFinalizationPromptScheduler(); });
}
start().catch((error) => { logger.fatal({ err: error }, "Shiloh failed during startup"); process.exit(1); });
function shutdown(signal) { logger.info({ signal }, "Shutting down Shiloh"); if (!server) return process.exit(0); server.close(() => { logger.info("HTTP server closed"); process.exit(0); }); setTimeout(() => { logger.error("Forced shutdown after timeout"); process.exit(1); }, 10000).unref(); }
process.on("SIGTERM", () => shutdown("SIGTERM")); process.on("SIGINT", () => shutdown("SIGINT"));