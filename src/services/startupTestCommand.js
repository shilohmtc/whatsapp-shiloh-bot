const { pool } = require("../db/pool");
const logger = require("../lib/logger");
const { processAdminAvailableSlotsMessage } = require("./adminAvailableSlots");
const { sendWhatsAppMessage } = require("./whatsapp");

function cleanCommand(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 500);
}

function isAllowedCommand(command) {
  return /^(check\s+availability|available\s+slots|next\s+available)\b/i.test(command);
}

async function ensureRunTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shiloh_test_command_runs (
      nonce TEXT PRIMARY KEY,
      command TEXT NOT NULL,
      status TEXT NOT NULL,
      reply TEXT,
      whatsapp_message_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `);
}

async function claimRun(nonce, command) {
  const result = await pool.query(
    `
      INSERT INTO shiloh_test_command_runs (nonce, command, status)
      VALUES ($1, $2, 'running')
      ON CONFLICT (nonce) DO NOTHING
      RETURNING nonce
    `,
    [nonce, command]
  );
  return result.rowCount === 1;
}

async function finishRun(nonce, status, reply = null, whatsappMessageId = null) {
  await pool.query(
    `
      UPDATE shiloh_test_command_runs
      SET status = $2,
          reply = $3,
          whatsapp_message_id = $4,
          completed_at = NOW()
      WHERE nonce = $1
    `,
    [nonce, status, reply, whatsappMessageId]
  );
}

async function runStartupTestCommand(request) {
  if (!request || request.enabled !== true) return { skipped: true, reason: "disabled" };

  const nonce = String(request.nonce || "").trim();
  const command = cleanCommand(request.command);
  const sendReplyToWhatsApp = request.sendReplyToWhatsApp !== false;
  const sender = String(process.env.SHILOH_TEST_ADMIN_WHATSAPP || "").trim();
  const replyTo = String(process.env.SHILOH_TEST_REPLY_TO_WHATSAPP || sender).trim();

  if (!nonce || nonce.length > 120) throw new Error("Startup test request requires a valid nonce");
  if (!sender) throw new Error("SHILOH_TEST_ADMIN_WHATSAPP is not configured");
  if (!command) throw new Error("Startup test request command is missing");
  if (!isAllowedCommand(command)) {
    throw new Error("Startup test runner only permits Check availability, Available slots, and Next available commands");
  }
  if (sendReplyToWhatsApp && !replyTo) throw new Error("Startup test WhatsApp recipient is not configured");

  await ensureRunTable();
  const claimed = await claimRun(nonce, command);
  if (!claimed) {
    logger.info({ nonce }, "Startup Shiloh test command already executed; skipping duplicate");
    return { skipped: true, reason: "duplicate", nonce };
  }

  try {
    const result = await processAdminAvailableSlotsMessage(sender, command);
    if (!result.handled) throw new Error("Test command was not handled as an authoritative admin availability command");

    let whatsappMessageId = null;
    if (sendReplyToWhatsApp) {
      const sent = await sendWhatsAppMessage(replyTo, result.reply);
      whatsappMessageId = sent?.messages?.[0]?.id || null;
    }

    await finishRun(nonce, "completed", result.reply, whatsappMessageId);
    logger.info({
      nonce,
      admin: result.admin?.display_name || null,
      sentToWhatsApp: sendReplyToWhatsApp,
      whatsappMessageId,
    }, "Executed startup Shiloh test command");

    return {
      skipped: false,
      nonce,
      reply: result.reply,
      whatsappMessageId,
    };
  } catch (error) {
    await finishRun(nonce, "failed", error.message, null);
    logger.error({ err: error, nonce }, "Startup Shiloh test command failed");
    throw error;
  }
}

module.exports = { runStartupTestCommand };
