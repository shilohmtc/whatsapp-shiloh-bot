const express = require("express");
const router = express.Router();

const {
  verifyWebhook,
  receiveWebhook,
} = require("../controllers/webhookController");
const { clientTestModeWebhook } = require("../controllers/clientTestWebhookController");

router.get("/webhook", verifyWebhook);
router.post("/webhook", clientTestModeWebhook, receiveWebhook);

module.exports = router;
