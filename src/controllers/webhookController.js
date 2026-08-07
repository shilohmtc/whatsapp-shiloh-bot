const { sendWhatsAppMessage } = require("../services/whatsapp");
const { generateReply } = require("../services/ai");
const { updateProfileFromMessage } = require("../services/profileExtractor");
const { CLINIC_REDIRECT, evaluateClinicScope } = require("../services/scopeGuard");
const logger = require("../lib/logger");

function maskPhone(phone = "") {
  return phone.length > 4 ? `***${phone.slice(-4)}` : "***";
}

exports.verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    (req.log || logger).info("WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }

  (req.log || logger).warn("WhatsApp webhook verification rejected");
  return res.sendStatus(403);
};

exports.receiveWebhook = async (req, res) => {
  const log = req.log || logger;

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages) {
      return res.sendStatus(200);
    }

    const message = value.messages[0];

    if (message.type !== "text") {
      log.info({ messageType: message.type }, "Ignoring unsupported WhatsApp message");
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text?.body?.trim();

    if (!from || !text) {
      log.warn("Received malformed WhatsApp text message");
      return res.sendStatus(200);
    }

    log.info({ from: maskPhone(from) }, "Processing incoming WhatsApp message");

    try {
      const scope = evaluateClinicScope(text);

      if (!scope.allowed) {
        log.info(
          { from: maskPhone(from), scopeReason: scope.reason },
          "Redirecting off-topic WhatsApp request"
        );
        await sendWhatsAppMessage(from, CLINIC_REDIRECT);
        return res.sendStatus(200);
      }

      // Capture explicit durable facts before generating the reply so the
      // current message can immediately benefit from the updated profile.
      await updateProfileFromMessage(from, text);

      const reply = await generateReply(from, text);
      await sendWhatsAppMessage(from, reply);
    } catch (error) {
      log.error({ err: error, from: maskPhone(from) }, "Failed to process WhatsApp message");

      try {
        await sendWhatsAppMessage(
          from,
          "Sorry, I'm having trouble responding right now. Please try again in a moment."
        );
      } catch (fallbackError) {
        log.error({ err: fallbackError }, "Failed to send WhatsApp fallback message");
        return res.sendStatus(500);
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    log.error({ err: error }, "Unhandled WhatsApp webhook error");
    return res.sendStatus(500);
  }
};
