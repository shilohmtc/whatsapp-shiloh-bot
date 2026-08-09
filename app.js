require("dotenv").config();
const express = require("express");
const { validateEnv } = require("./src/config/env");
const logger = require("./src/lib/logger");
const requestContext = require("./src/middleware/requestContext");
validateEnv();

const webhookRoutes = require("./src/routes/webhook");
const adminRoutes = require("./src/routes/admin");
const auditReadRoutes = require("./src/routes/auditRead");
const { checkDatabase } = require("./src/services/memory");
const { startGoldieSyncScheduler } = require("./src/services/goldieSync");
const { startAppointmentLifecycleScheduler } = require("./src/services/appointmentLifecycle");

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
app.use("/", webhookRoutes);

app.use((err, req, res, next) => {
  const log = req.log || logger;
  log.error({ err }, "Unhandled Express error");
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: "Internal server error", requestId: req.id });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, "Shiloh started");
  startGoldieSyncScheduler();
  startAppointmentLifecycleScheduler();
});

function shutdown(signal) {
  logger.info({ signal }, "Shutting down Shiloh");
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
