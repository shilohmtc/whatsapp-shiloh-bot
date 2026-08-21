const pino = require("pino");

function redactSensitiveText(value) {
  return String(value)
    .replace(/\bBearer\s+[^\s"',}\]]+/gi, "Bearer [REDACTED]")
    .replace(/\bEAA[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]")
    .replace(/\bya29\.[A-Za-z0-9._-]{20,}\b/g, "[REDACTED]")
    .replace(/\bpostgres(?:ql)?:\/\/[^\s"']+/gi, "[REDACTED_DATABASE_URL]");
}

function serializeError(error) {
  if (!error || typeof error !== "object") return error;

  const status = error.response?.status ?? error.status;
  return {
    type: redactSensitiveText(error.name || error.constructor?.name || "Error"),
    message: redactSensitiveText(error.message || String(error)),
    stack: error.stack ? redactSensitiveText(error.stack) : undefined,
    code: error.code == null ? undefined : redactSensitiveText(error.code),
    status: status == null ? undefined : status,
  };
}

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  serializers: {
    err: serializeError,
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "headers.authorization",
      "authorization",
      "WHATSAPP_TOKEN",
      "OPENAI_API_KEY",
      "DATABASE_URL",
    ],
    censor: "[REDACTED]",
  },
});

module.exports = logger;
