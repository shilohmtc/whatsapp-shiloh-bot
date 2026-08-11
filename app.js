require("dotenv").config();
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
const { checkDatabase } = require("./src/services/memory");
const { startGoldieSyncScheduler } = require("./src/services/goldieSync");
const { startGoogleBusinessProfileSyncScheduler } = require("./src/services/googleBusinessProfileSync");
const { startAppointmentLifecycleScheduler } = require("./src/services/appointmentLifecycle");
const { startCustomerCareScheduler } = require("./src/services/customerCare");
const { runGoldieDuplicate360RepairFromEnv } = require("./src/services/goldieDuplicate360Repair");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(requestContext);
app.get("/", (req, res) => res.status(200).json({ service: "shiloh-whatsapp-bot", status: "running" }));
app.get("/health", async (req, res) => {
  const ok = await checkDatabase();
  return res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    database: ok ? "ok" : "unavailable",
    timestamp: new Date().toISOString(),
  });
});
app.use("/audit-read", auditReadRoutes);
app.use("/admin", adminRoutes);
app.use("/calendar", calendarRoutes);
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

async function start() {
  // Temporary one-shot cutover repair. This executes only when the operator
  // explicitly enables RUN_GOLDIE_DUPLICATE_360_REPAIR in Render. The hook is
  // removed immediately after the verified repair run.
  await runGoldieDuplicate360RepairFromEnv();

  server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "Shiloh started");
    startGoldieSyncScheduler();
    startGoogleBusinessProfileSyncScheduler();
    startAppointmentLifecycleScheduler();
    startCustomerCareScheduler();
  });
}

start().catch((error) => {
  logger.fatal({ err: error }, "Shiloh failed during startup");
  process.exit(1);
});

function shutdown(signal) {
  logger.info({ signal }, "Shutting down Shiloh");
  if (!server) return process.exit(0);
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
