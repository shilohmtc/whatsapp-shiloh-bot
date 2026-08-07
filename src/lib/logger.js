const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
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
