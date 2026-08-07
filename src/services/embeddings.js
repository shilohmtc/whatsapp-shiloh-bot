const OpenAI = require("openai");
const logger = require("../lib/logger");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

async function createEmbedding(input) {
  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input,
      encoding_format: "float",
    });

    return response.data?.[0]?.embedding;
  } catch (error) {
    logger.error({ err: error }, "Embedding generation failed");
    throw error;
  }
}

module.exports = {
  createEmbedding,
  EMBEDDING_MODEL,
};
