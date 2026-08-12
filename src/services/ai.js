const OpenAI = require("openai");
const { getSession, saveSession } = require("./memory");
const { retrieveKnowledge } = require("./knowledge");
const { getProfile } = require("./profile");
const { getActiveCatalogueKnowledge } = require("./activeCatalogueKnowledge");
const { getPractitionerKnowledge } = require("./practitionerKnowledge");
const { buildInstructions } = require("./orchestrator");
const logger = require("../lib/logger");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PRIMARY_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-terra";
const FAST_MODEL = process.env.OPENAI_FAST_MODEL || "gpt-5.6-luna";
const REASONING_EFFORT = process.env.OPENAI_REASONING_EFFORT || "low";

function getModelForWorkload(workload = "conversation") {
  return workload === "fast" ? FAST_MODEL : PRIMARY_MODEL;
}

function logUsage(response, workload) {
  const usage = response?.usage;
  if (!usage) return;

  logger.info(
    {
      provider: "openai",
      workload,
      model: response.model || getModelForWorkload(workload),
      responseId: response.id,
      inputTokens: usage.input_tokens,
      cachedInputTokens: usage.input_tokens_details?.cached_tokens || 0,
      outputTokens: usage.output_tokens,
      reasoningTokens: usage.output_tokens_details?.reasoning_tokens || 0,
      totalTokens: usage.total_tokens,
    },
    "OpenAI usage"
  );
}

async function generateReply(phone, message) {
  const [previousResponseId, knowledge, profile, activeCatalogue, practitionerKnowledge] = await Promise.all([
    getSession(phone),
    retrieveKnowledge(message, 5),
    getProfile(phone),
    getActiveCatalogueKnowledge(),
    getPractitionerKnowledge(),
  ]);

  const authoritativeKnowledge = [activeCatalogue, practitionerKnowledge, ...knowledge].filter(Boolean);
  const workload = "conversation";
  const request = {
    model: getModelForWorkload(workload),
    input: message,
    instructions: buildInstructions({ profile, knowledge: authoritativeKnowledge }),
    reasoning: { effort: REASONING_EFFORT },
    store: true,
  };

  if (previousResponseId) {
    request.previous_response_id = previousResponseId;
  }

  try {
    const response = await client.responses.create(request);

    logUsage(response, workload);

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
        model: getModelForWorkload("conversation"),
      },
      "OpenAI response generation failed"
    );

    throw error;
  }
}

module.exports = {
  generateReply,
  getModelForWorkload,
};
