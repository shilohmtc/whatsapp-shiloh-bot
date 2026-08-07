const { sendWhatsAppMessage } = require("../services/whatsapp");
const { generateReply } = require("../services/ai");

// Verify webhook
exports.verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

// Receive messages
exports.receiveWebhook = async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages) {
      return res.sendStatus(200);
    }

    const message = value.messages[0];

    // Only respond to text messages
    if (message.type !== "text") {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text.body;

    console.log(`Incoming message from ${from}: ${text}`);

    // Generate GPT-5 reply
    const reply = await generateReply(text);

    // Send reply back to WhatsApp
    await sendWhatsAppMessage(from, reply);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.sendStatus(500);
  }
};
