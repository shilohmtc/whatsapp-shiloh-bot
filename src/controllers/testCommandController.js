const logger = require("../lib/logger");
const { processAdminAvailableSlotsMessage } = require("../services/adminAvailableSlots");
const { sendWhatsAppMessage } = require("../services/whatsapp");
const { runBookingPolicySelfTest } = require("../services/bookingPolicySelfTest");

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 10;
const requestTimes = [];

function cleanCommand(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 500);
}

function isAllowedCommand(command) {
  return /^(check\s+availability|available\s+slots|next\s+available)\b/i.test(command);
}

function takeRateLimitSlot() {
  const now = Date.now();
  while (requestTimes.length && requestTimes[0] <= now - WINDOW_MS) requestTimes.shift();
  if (requestTimes.length >= MAX_REQUESTS) return false;
  requestTimes.push(now);
  return true;
}

async function runTestCommand(req, res) {
  const log = req.log || logger;
  const command = cleanCommand(req.body?.command);
  const sendReplyToWhatsApp = req.body?.sendReplyToWhatsApp === true;
  const sender = String(process.env.SHILOH_TEST_ADMIN_WHATSAPP || "").trim();
  const replyTo = String(process.env.SHILOH_TEST_REPLY_TO_WHATSAPP || sender).trim();

  if (!sender) {
    return res.status(503).json({ error: "SHILOH_TEST_ADMIN_WHATSAPP is not configured", requestId: req.id });
  }
  if (!command) {
    return res.status(400).json({ error: "command is required", requestId: req.id });
  }
  if (!isAllowedCommand(command)) {
    return res.status(400).json({
      error: "Only Check availability, Available slots, and Next available commands are permitted by this test endpoint",
      requestId: req.id,
    });
  }
  if (!takeRateLimitSlot()) {
    return res.status(429).json({ error: "Test command rate limit exceeded", requestId: req.id });
  }

  try {
    const result = await processAdminAvailableSlotsMessage(sender, command);
    if (!result.handled) {
      return res.status(422).json({ error: "Command was not handled as an authoritative admin availability command", requestId: req.id });
    }

    let whatsappMessageId = null;
    if (sendReplyToWhatsApp) {
      if (!replyTo) {
        return res.status(503).json({ error: "Test WhatsApp recipient is not configured", requestId: req.id });
      }
      const sent = await sendWhatsAppMessage(replyTo, result.reply);
      whatsappMessageId = sent?.messages?.[0]?.id || null;
    }

    log.info({
      admin: result.admin?.display_name || null,
      commandType: command.split("|")[0].trim().slice(0, 80),
      sentToWhatsApp: sendReplyToWhatsApp,
    }, "Executed protected Shiloh test command");

    return res.status(200).json({
      ok: true,
      handled: true,
      reply: result.reply,
      sentToWhatsApp: sendReplyToWhatsApp,
      whatsappMessageId,
      requestId: req.id,
    });
  } catch (error) {
    log.error({ err: error }, "Protected Shiloh test command failed");
    return res.status(502).json({ error: "Test command failed", detail: error.message, requestId: req.id });
  }
}

async function runBookingPolicyTest(req, res) {
  const log = req.log || logger;
  try {
    const result = await runBookingPolicySelfTest();
    log.info({ policyVersion: result.policyVersion }, "Booking policy production self-test passed");
    return res.status(200).json({ ...result, requestId: req.id });
  } catch (error) {
    log.error({ err: error }, "Booking policy production self-test failed");
    return res.status(502).json({
      ok: false,
      error: "Booking policy self-test failed",
      detail: error.message,
      requestId: req.id,
    });
  }
}

module.exports = { runTestCommand, runBookingPolicyTest };
