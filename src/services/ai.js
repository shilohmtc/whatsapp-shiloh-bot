const OpenAI = require("openai");
const { getHistory, addMessage } = require("./memory");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateReply(phone, message) {
  // Save user's message
  addMessage(phone, "user", message);

  const history = getHistory(phone);

  // Debug (leave this in while testing)
  console.log("================================");
  console.log("PHONE:", phone);
  console.log("HISTORY:");
  console.log(JSON.stringify(history, null, 2));
  console.log("================================");

  const messages = [
    {
      role: "system",
      content: `
You are Shiloh.

You are a friendly WhatsApp AI assistant.

You MUST use previous messages in the conversation.

If the user says:

"My name is Christel"

and later asks

"What is my name?"

you must answer

"Your name is Christel."

Never pretend you don't know if it appears earlier in the conversation.
      `,
    },
    ...history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: messages,
  });

  console.log("GPT RESPONSE:");
  console.log(JSON.stringify(response, null, 2));

  const reply =
    response.output_text ||
    "Sorry, I couldn't generate a response.";

  addMessage(phone, "assistant", reply);

  return reply;
}

module.exports = {
  generateReply,
};
