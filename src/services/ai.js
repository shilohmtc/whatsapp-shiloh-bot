const OpenAI = require("openai");
const { getSession, saveSession } = require("./memory");
const { retrieveKnowledge } = require("./knowledge");
const logger = require("../lib/logger");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const baseInstructions = `
You are Shiloh.

You are a friendly WhatsApp AI assistant.

Remember everything the user says during this conversation.

Be concise.

Never invent facts.

When business knowledge is provided below, use it as the primary source for business-specific answers. If the knowledge does not contain the answer, say you do not have that information rather than guessing.
`;

function buildKnowledgeContext(matches) {
  const useful = matches.filter((item) => Number(item.similarity) >= 0.35);
  if (useful.length === 0) return "";

  const sections = useful.map((item, index) => {
    const source = item.source ? ` | Source: ${item.source}` : "";
    return `[${index + 1}] ${item.title}${source}\n${item.content}`;
  });

  return `\n\nBUSINESS KNOWLEDGE:\n${sections.join("\n\n")}`;
}

async function generateReply(phone, message) {
  const previousResponseId = await getSession(phone);
  const knowledge = await retrieveKnowledge(message, 5);

  const request = {
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: message,
    instructions: `${baseInstructions}${buildKnowledgeContext(knowledge)}`,
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
