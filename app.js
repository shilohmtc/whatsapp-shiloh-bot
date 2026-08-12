require("dotenv").config();
const path = require("path");
const express = require("express");
const { validateEnv } = require("./src/config/env");
const logger = require("./src/lib/logger");
const requestContext = require("./src/middleware/requestContext");

validateEnv();

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
const { startMandatoryDemoCleanupScheduler } = require("./src/services/demoMandatoryCleanup");
// TEMPORARY_READ_ONLY_BIRTHDAY_AUDIT_PROBE — remove immediately after provider status is captured.
const { getBirthdayTemplateStatus, TEMPLATE_BODY } = require("./src/services/birthdayTemplateProvisioning");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(requestContext);
app.use("/assets/service-images", express.static(path.join(__dirname, "public", "service-images"), {
  maxAge: "30d",
  immutable: true,
}));
app.get("/", (req, res) => res.status(200).json({ service: "shiloh-whatsapp-bot", status: "running" }));
app.get("/health", async (req, res) => {
  const ok = await checkDatabase();
  return res.status(ok ? 200 : 503).json({ status: ok ? "ok" : "degraded", database: ok ? "ok" : "unavailable", timestamp: new Date().toISOString() });
});
app.use("/audit-read", auditReadRoutes);
app.use("/admin/privacy", privacyRoutes);
app.use("/admin", adminRoutes);
app.use("/calendar", calendarRoutes);
app.use("/", serviceRoutes);
app.use("/", walkinRoutes);
app.use("/", bookRoutes);
app.use("/", webhookRoutes);
app.use((err, req, res, next) => {
  const log = req.log || logger;
  log.error({ err }, "Unhandled Express error");
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: "Internal server error", requestId: req.id });
});

const PORT = process.env.PORT || 3000;
let server;
async function start() {
  const demoAccess = await ensureDemoClientPermissions();
  logger.info(demoAccess, "Controlled demo client access verified");
  server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "Shiloh started");
    startConversationSessionCleanupScheduler();
    startTemporarySessionCleanupScheduler();
    startGoogleBusinessProfileSyncScheduler();
    startAppointmentLifecycleScheduler();
    startCustomerCareScheduler();
    startBookingIntegrityScheduler();
    startMandatoryDemoCleanupScheduler();
    setImmediate(async () => {
      try {
        const provider = await getBirthdayTemplateStatus();
        const currentBrand = "Shiloh Massage Therapy and Aesthetic Clinic";
        logger.info({
          birthdayTemplateAudit: {
            safety: "read_only_sanitized_provider_status",
            ok: provider.ok === true,
            reason: provider.reason || null,
            templateName: provider.templateName || null,
            configuredTemplateName: provider.configuredTemplateName || null,
            exists: Boolean(provider.template),
            providerStatus: provider.template?.status || null,
            category: provider.template?.category || null,
            language: provider.template?.language || null,
            submittedCopyUsesCurrentBrand: TEMPLATE_BODY.includes(currentBrand),
            safeToEnable: provider.template?.status === "APPROVED" && TEMPLATE_BODY.includes(currentBrand),
            legacyTemplateName: provider.legacyTemplateName || null,
            legacyProviderStatus: provider.legacyTemplate?.status || null,
          },
        }, "Temporary read-only birthday template audit probe");
      } catch (error) {
        logger.warn({ err: error }, "Temporary read-only birthday template audit probe failed");
      }
    });
  });
}
start().catch((error) => { logger.fatal({ err: error }, "Shiloh failed during startup"); process.exit(1); });
function shutdown(signal) {
  logger.info({ signal }, "Shutting down Shiloh");
  if (!server) return process.exit(0);
  server.close(() => { logger.info("HTTP server closed"); process.exit(0); });
  setTimeout(() => { logger.error("Forced shutdown after timeout"); process.exit(1); }, 10000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
