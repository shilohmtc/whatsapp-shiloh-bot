const express=require("express");
const router=express.Router();
const {verifyWebhook,receiveWebhook}=require("../controllers/webhookController");
router.get("/webhook",verifyWebhook);
router.post("/webhook",receiveWebhook);
module.exports=router;
