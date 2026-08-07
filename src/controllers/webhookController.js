const { sendWhatsAppMessage } = require("../services/whatsapp");
const { generateReply } = require("../services/ai");


// GPT-5 integration example
async function handleIncomingText(from, text){
  const reply = await generateReply(text);
  await sendWhatsAppMessage(from, reply);
}
module.exports.handleIncomingText = handleIncomingText;
