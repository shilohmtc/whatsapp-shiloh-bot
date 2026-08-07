const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateReply(message) {
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: [
      {
        role: "system",
        content:
          "You are Shiloh, a friendly WhatsApp AI assistant.",
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  return response.output_text;
}

module.exports = {
  generateReply,
};
