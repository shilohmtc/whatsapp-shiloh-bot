const OpenAI = require("openai");
const { getHistory, addMessage } = require("./memory");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateReply(phone, message) {
  // Save the user's message
  addMessage(phone, "user", message);

  const history = getHistory(phone);

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content: `
You are Shiloh.

You are a friendly, intelligent WhatsApp AI assistant.

Remember previous messages in the conversation.

Keep replies concise unless the user asks for more detail.

Never invent facts.

If you're unsure of something, say so.

Respond naturally as if chatting on WhatsApp.
        `,
      },
      ...history,
    ],
  });

  const reply = response.output_text;

  // Save the assistant's reply
  addMessage(phone, "assistant", reply);

  return reply;
}

module.exports = {
  generateReply,
};
