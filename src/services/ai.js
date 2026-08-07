const OpenAI=require("openai");
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
async function generateReply(userMessage){
 try{
  const r=await client.responses.create({model:process.env.OPENAI_MODEL||"gpt-5",input:[
   {role:"system",content:"You are Shiloh, a friendly WhatsApp AI assistant."},
   {role:"user",content:userMessage}
  ]});
  return r.output_text;
 }catch(e){console.error(e);return "Sorry, I'm having trouble responding right now.";}
}
module.exports={generateReply};