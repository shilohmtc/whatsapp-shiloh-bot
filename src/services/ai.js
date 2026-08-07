const OpenAI = require("openai");
const { getSession, saveSession } = require("./memory");
const logger = require("../lib/logger");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const instructions = `
You are Shiloh.

You are a friendly WhatsApp AI assistant.

Remember everything the user says during this conversation.

Be concise.

Never invent facts.
`;

async function generateReply(phone, message) {
  const previousResponseId = await getSession(phone);

  const request = {
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: message,
    instructions,
  };

  if (previousResponseId) {
    request.previous_response_id = previousResponseId;
  }

  try {
    const response = await client.responses.create(request);

    if (response.id) {
      await saveSession(phone, response.id);
    }

    const reply = response.output_text?.trim();

    if (!reply) {
      logger.warn({ responseId: response.id }, "OpenAI returned no text output");
      return "Sorry, I couldn't generate a response right now.";
    }

    return reply;
  } catch (error) {
    logger.error(
      {
        err: error,
        status: error.status,
        code: error.code,
      },
      "OpenAI response generation failed"
    );

    throw error;
  }
}

module.exports = {
  generateReply,
};
