const { Pool } = require("pg");
const { createEmbedding } = require("./embeddings");
const logger = require("../lib/logger");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("render.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

let initialized = false;

async function ensureKnowledgeSchema() {
  if (initialized) return;

  await pool.query("CREATE EXTENSION IF NOT EXISTS vector");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      source TEXT,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id BIGSERIAL PRIMARY KEY,
      document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding vector(1536) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(document_id, chunk_index)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw
    ON document_chunks USING hnsw (embedding vector_cosine_ops)
  `);

  initialized = true;
}

function chunkText(text, maxChars = 1800, overlap = 250) {
  const clean = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + maxChars, clean.length);

    if (end < clean.length) {
      const boundary = Math.max(
        clean.lastIndexOf("\n\n", end),
        clean.lastIndexOf(". ", end)
      );
      if (boundary > start + Math.floor(maxChars * 0.55)) {
        end = boundary + 1;
      }
    }

    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

function vectorLiteral(values) {
  return `[${values.join(",")}]`;
}

async function ingestDocument({ title, source, content }) {
  await ensureKnowledgeSchema();

  const chunks = chunkText(content);
  if (!title?.trim()) throw new Error("Document title is required");
  if (chunks.length === 0) throw new Error("Document content is required");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const documentResult = await client.query(
      `INSERT INTO documents (title, source, content)
       VALUES ($1, $2, $3)
       RETURNING id, title, source, created_at`,
      [title.trim(), source?.trim() || null, String(content).trim()]
    );

    const document = documentResult.rows[0];

    for (let i = 0; i < chunks.length; i += 1) {
      const embedding = await createEmbedding(chunks[i]);
      if (!embedding?.length) throw new Error("Embedding generation returned no vector");

      await client.query(
        `INSERT INTO document_chunks (document_id, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4::vector)`,
        [document.id, i, chunks[i], vectorLiteral(embedding)]
      );
    }

    await client.query("COMMIT");

    return {
      ...document,
      chunkCount: chunks.length,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error({ err: error }, "Document ingestion failed");
    throw error;
  } finally {
    client.release();
  }
}

async function retrieveKnowledge(query, limit = 5) {
  try {
    await ensureKnowledgeSchema();

    const embedding = await createEmbedding(query);
    if (!embedding?.length) return [];

    const result = await pool.query(
      `SELECT
         dc.content,
         d.title,
         d.source,
         1 - (dc.embedding <=> $1::vector) AS similarity
       FROM document_chunks dc
       JOIN documents d ON d.id = dc.document_id
       ORDER BY dc.embedding <=> $1::vector
       LIMIT $2`,
      [vectorLiteral(embedding), Math.max(1, Math.min(Number(limit) || 5, 8))]
    );

    return result.rows;
  } catch (error) {
    logger.error({ err: error }, "Knowledge retrieval failed");
    return [];
  }
}

async function listDocuments() {
  await ensureKnowledgeSchema();

  const result = await pool.query(`
    SELECT d.id, d.title, d.source, d.created_at, COUNT(dc.id)::int AS chunk_count
    FROM documents d
    LEFT JOIN document_chunks dc ON dc.document_id = d.id
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `);

  return result.rows;
}

async function deleteDocument(id) {
  await ensureKnowledgeSchema();
  const result = await pool.query(
    "DELETE FROM documents WHERE id = $1 RETURNING id, title",
    [id]
  );
  return result.rows[0] || null;
}

module.exports = {
  ingestDocument,
  retrieveKnowledge,
  listDocuments,
  deleteDocument,
  ensureKnowledgeSchema,
};
