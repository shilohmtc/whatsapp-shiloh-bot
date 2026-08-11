require("dotenv").config();
const path = require("path");
const express = require("express");
const { validateEnv } = require("./src/config/env");
const logger = require("./src/lib/logger");
const requestContext = require("./src/middleware/requestContext");

validateEnv();

const webhookRoutes = require("./src/routes/webhook");
const adminRoutes = require("./src/routes/admin");
const auditReadRoutes = require("./src/routes/auditRead");
const calendarRoutes = require("./src/routes/calendar");
const walkinRoutes = require("./src/routes/walkin");
const serviceRoutes = require("./src/routes/services");
const internalBirthdayTemplateRoutes = require("./src/routes/internalBirthdayTemplate");
const { checkDatabase } = require("./src/services/memory");
const { startGoogleBusinessProfileSyncScheduler } = require("./src/services/googleBusinessProfileSync");
const { startAppointmentLifecycleScheduler } = require("./src/services/appointmentLifecycle");
const { startCustomerCareScheduler } = require("./src/services/customerCare");
const { getBirthdayTemplateStatus } = require("./src/services/birthdayTemplateProvisioning");

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
app.use("/admin/internal", internalBirthdayTemplateRoutes);
app.use("/admin", adminRoutes);
app.use("/calendar", calendarRoutes);
app.use("/", serviceRoutes);
app.use("/", walkinRoutes);
app.use("/", webhookRoutes);
app.use((err, req, res, next) => {
  const log = req.log || logger;
  log.error({ err }, "Unhandled Express error");
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: "Internal server error", requestId: req.id });
});

const PORT = process.env.PORT || 3000;
let server;
async function runTemporaryBirthdayTemplateVerifier() {
  if (process.env.BIRTHDAY_TEMPLATE_PROVISIONING_ENABLED !== 'true') return;
  try {
    const result = await getBirthdayTemplateStatus();
    logger.info({
      ok: result.ok,
      reason: result.reason || null,
      wabaId: result.wabaId || null,
      templateName: result.templateName || null,
      configuredTemplateName: result.configuredTemplateName || null,
      template: result.template ? {
        id: result.template.id || null,
        name: result.template.name,
        status: result.template.status || null,
        category: result.template.category || null,
        language: result.template.language || null,
      } : null,
    }, "Birthday template provisioning inspection completed");
  } catch (error) {
    logger.error({
      err: error,
      providerStatus: error.response?.status || null,
      providerError: error.response?.data?.error?.message || error.message,
      providerCode: error.response?.data?.error?.code || null,
    }, "Birthday template provisioning inspection failed");
  }
}
async function start() {
  // Normal production boot intentionally contains no migrations, one-time repairs,
  // rollout jobs, imports, reconciliations or smoke tests. Goldie live knowledge
  // sync was retired after the verified P1 cutover reconciliation on 11 Aug 2026.
  server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "Shiloh started");
    startGoogleBusinessProfileSyncScheduler();
    startAppointmentLifecycleScheduler();
    startCustomerCareScheduler();
    setTimeout(runTemporaryBirthdayTemplateVerifier, 5000).unref();
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
