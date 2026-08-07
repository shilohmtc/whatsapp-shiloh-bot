const axios = require("axios");
const logger = require("../lib/logger");

async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v23.0/${process.env.PHONE_NUMBER_ID}/messages`;

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    logger.info(
      { messageId: response.data.messages?.[0]?.id || null },
      "WhatsApp message sent"
    );

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

module.exports = { sendWhatsAppMessage };
