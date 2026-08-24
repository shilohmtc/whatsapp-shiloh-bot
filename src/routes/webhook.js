const express = require("express");
const router = express.Router();

const {
  verifyWebhook,
  receiveWebhook,
} = require("../controllers/webhookController");
const { processWhatsAppStatusWebhook } = require("../controllers/whatsappStatusWebhookController");

router.get("/webhook", verifyWebhook);
router.post("/webhook", processWhatsAppStatusWebhook, receiveWebhook);

module.exports = router;
