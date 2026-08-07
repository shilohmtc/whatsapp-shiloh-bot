
const axios = require("axios");

async function sendWhatsAppMessage(to, message) {
  try {
    const url = `https://graph.facebook.com/v23.0/${process.env.PHONE_NUMBER_ID}/messages`;
    const response = await axios.post(url,{
      messaging_product:"whatsapp",
      to,
      type:"text",
      text:{body:message}
    },{
      headers:{
        Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type":"application/json"
      }
    });
    console.log("✅ Message sent:", response.data.messages?.[0]?.id || "");
  } catch(error){
    console.error("❌ Send failed:", error.response?.data || error.message);
  }
}

module.exports={sendWhatsAppMessage};
