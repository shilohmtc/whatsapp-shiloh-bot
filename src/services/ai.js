const OpenAI = require("openai");
const { getSession, saveSession } = require("./memory");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateReply(phone, message) {
  const previousResponseId = await getSession(phone);

  const request = {
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: message,
  };

  if (previousResponseId) {
    request.previous_response_id = previousResponseId;
  } else {
    request.instructions = `
You are Shiloh.

You are a friendly WhatsApp AI assistant.

Remember everything the user says during this conversation.

Be concise.

Never invent facts.
`;
  }

  const response = await client.responses.create(request);

  await saveSession(phone, response.id);

  return (
    response.output_text?.trim() ||
    "Sorry, I couldn't generate a response."
  );
}

module.exports = {
  generateReply,
};
