const OpenAI = require("openai");
const { getSession, saveSession } = require("./memory");
const { retrieveKnowledge } = require("./knowledge");
const { getProfile, buildProfileContext } = require("./profile");
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

When a USER PROFILE is provided, treat it as durable information explicitly saved for this WhatsApp user. Use it for personalization when relevant, but do not repeat private profile details unnecessarily.

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
  const [previousResponseId, knowledge, profile] = await Promise.all([
    getSession(phone),
    retrieveKnowledge(message, 5),
    getProfile(phone),
  ]);

  const request = {
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: message,
    instructions: `${baseInstructions}${buildProfileContext(profile)}${buildKnowledgeContext(knowledge)}`,
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
