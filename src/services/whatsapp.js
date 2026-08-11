const axios = require("axios");
const logger = require("../lib/logger");

function messagesUrl() {
  return `https://graph.facebook.com/v23.0/${process.env.PHONE_NUMBER_ID}/messages`;
}

function requestConfig() {
  return {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  };
}

function triggerBookingCustomerConfirmation(message = "") {
  const match = String(message).match(/Booking created successfully\s*[—-]\s*appointment\s+#(\d+)/i);
  if (!match) return;
  const appointmentId = Number(match[1]);
  setImmediate(() => {
    const { sendCustomerBookingConfirmationForAppointment } = require('./customerBookingConfirmation');
    sendCustomerBookingConfirmationForAppointment(appointmentId).catch((error) => {
      logger.error({ err: error, appointmentId }, "Post-booking customer confirmation trigger failed");
    });
  });
}

async function sendWhatsAppMessage(to, message) {
  try {
    const response = await axios.post(
      messagesUrl(),
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      },
      requestConfig()
    );

    logger.info(
      { messageId: response.data.messages?.[0]?.id || null },
      "WhatsApp message sent"
    );

    triggerBookingCustomerConfirmation(message);
    return response.data;
  } catch (error) {
    logger.error(
      {
        err: error,
        status: error.response?.status,
        metaError: error.response?.data?.error,
      },
      "WhatsApp send failed"
    );

    throw error;
  }
}

async function sendWhatsAppReplyButtons(to, body, buttons = []) {
  const safeBody = String(body || "").trim();
  if (!safeBody) throw new Error("WhatsApp reply-button body is required");
  if (!Array.isArray(buttons) || buttons.length < 1 || buttons.length > 3) {
    throw new Error("WhatsApp reply buttons require between 1 and 3 buttons");
  }
  const normalized = buttons.map((button) => {
    const id = String(button?.id || "").trim();
    const title = String(button?.title || "").trim();
    if (!id || id.length > 256) throw new Error("WhatsApp reply-button id must be 1-256 characters");
    if (!title || title.length > 20) throw new Error("WhatsApp reply-button title must be 1-20 characters");
    return { type: "reply", reply: { id, title } };
  });

  try {
    const response = await axios.post(
      messagesUrl(),
      {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: safeBody },
          action: { buttons: normalized },
        },
      },
      requestConfig()
    );
    logger.info(
      { messageId: response.data.messages?.[0]?.id || null, buttonCount: normalized.length },
      "WhatsApp reply buttons sent"
    );
    return response.data;
  } catch (error) {
    logger.error(
      {
        err: error,
        status: error.response?.status,
        metaError: error.response?.data?.error,
      },
      "WhatsApp reply-button send failed"
    );
    throw error;
  }
}

async function sendWhatsAppTemplate(to, templateName, bodyParameters = [], languageCode = "en") {
  if (!templateName) {
    throw new Error("WhatsApp template name is required");
  }

  const components = bodyParameters.length
    ? [
        {
          type: "body",
          parameters: bodyParameters.map((value) => ({
            type: "text",
            text: String(value),
          })),
        },
      ]
    : undefined;

  try {
    const response = await axios.post(
      messagesUrl(),
      {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          ...(components ? { components } : {}),
        },
      },
      requestConfig()
    );

    logger.info(
      {
        messageId: response.data.messages?.[0]?.id || null,
        templateName,
      },
      "WhatsApp template sent"
    );

    return response.data;
  } catch (error) {
    logger.error(
      {
        err: error,
        status: error.response?.status,
        metaError: error.response?.data?.error,
        templateName,
      },
      "WhatsApp template send failed"
    );
    throw error;
  }
}

module.exports = { sendWhatsAppMessage, sendWhatsAppReplyButtons, sendWhatsAppTemplate };
