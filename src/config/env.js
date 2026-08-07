const REQUIRED_ENV_VARS = [
  "OPENAI_API_KEY",
  "VERIFY_TOKEN",
  "PHONE_NUMBER_ID",
  "WHATSAPP_TOKEN",
  "DATABASE_URL",
];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

module.exports = {
  validateEnv,
};
