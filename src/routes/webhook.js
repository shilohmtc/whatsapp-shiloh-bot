
const express = require("express");
const router = express.Router();
const { sendWhatsAppMessage } = require("../services/whatsapp");

router.get("/webhook",(req,res)=>{
 const mode=req.query["hub.mode"];
 const token=req.query["hub.verify_token"];
 const challenge=req.query["hub.challenge"];
 if(mode==="subscribe" && token===process.env.VERIFY_TOKEN){
   console.log("✅ Webhook verified.");
   return res.status(200).send(challenge);
 }
 console.log("❌ Webhook verification failed.");
 return res.sendStatus(403);
});

router.post("/webhook", async (req,res)=>{
 try{
  const body=req.body;
  if(body.object==="whatsapp_business_account"){
    for(const entry of body.entry||[]){
      for(const change of entry.changes||[]){
        const value=change.value;
        if(value.messages){
          for(const message of value.messages){
            console.log("📩 New Message");
            console.log("From:",message.from);
            console.log("Type:",message.type);
            if(message.type==="text"){
              console.log("Text:",message.text.body);
              await sendWhatsAppMessage(message.from,"Hello! 👋 I'm Shiloh. Thanks for your message.");
            }
            console.log("---------------------------");
          }
        }
      }
    }
  }
  res.sendStatus(200);
 }catch(e){console.error(e);res.sendStatus(500);}
});
module.exports=router;
