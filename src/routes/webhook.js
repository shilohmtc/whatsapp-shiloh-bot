const express = require("express");
const router = express.Router();

// Webhook Verification
router.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (
        mode === "subscribe" &&
        token === process.env.VERIFY_TOKEN
    ) {
        console.log("✅ Webhook verified.");
        return res.status(200).send(challenge);
    }

    console.log("❌ Webhook verification failed.");
    return res.sendStatus(403);
});

// Receive WhatsApp Messages
router.post("/webhook", (req, res) => {
    try {
        const body = req.body;

        if (body.object === "whatsapp_business_account") {
            body.entry?.forEach((entry) => {
                entry.changes?.forEach((change) => {
                    const value = change.value;

                    if (value.messages) {
                        value.messages.forEach((message) => {
                            console.log("📩 New Message");
                            console.log("From:", message.from);
                            console.log("Type:", message.type);

                            if (message.type === "text") {
                                console.log("Text:", message.text.body);
                            }

                            console.log("---------------------------");
                        });
                    }
                });
            });
        }

        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});

module.exports = router;