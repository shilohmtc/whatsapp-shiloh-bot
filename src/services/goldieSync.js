const axios = require("axios");
const crypto = require("crypto");
const { pool } = require("../db/pool");
const { replaceDocumentBySource } = require("./knowledge");
const logger = require("../lib/logger");

const DEFAULT_GOLDIE_URL =
  "https://book.heygoldie.com/Shiloh-Massage-Therapy-Clinic";
const SOURCE_KEY = "goldie:shiloh-booking-page";

let syncInProgress = false;
let schedulerTimer = null;

function decodeHtmlEntities(value = "") {
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };

  return String(value).replace(
    /&(#\d+|#x[0-9a-f]+|amp|lt|gt|quot|apos|nbsp);/gi,
    (match, token) => {
      const lower = token.toLowerCase();
      if (named[lower]) return named[lower];
      if (lower.startsWith("#x")) {
        return String.fromCodePoint(parseInt(lower.slice(2), 16));
      }
      if (lower.startsWith("#")) {
        return String.fromCodePoint(parseInt(lower.slice(1), 10));
      }
      return match;
    }
  );
}

function htmlToReadableText(html = "") {
  let text = String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/section|\/article|\/h[1-6]|\/tr)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ");

  text = decodeHtmlEntities(text)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const firstUseful = text.indexOf("Shiloh Massage Therapy & Aesthetic Clinic");
  if (firstUseful >= 0) text = text.slice(firstUseful);

  return text;
}

function normalizeGoldieSnapshot(text = "") {
  const lines = String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const compact = [];
  let previous = null;

  for (const line of lines) {
    if (line === previous) continue;
    if (/^(select|show more|book now|see all reviews|see portfolio|see details)$/i.test(line)) {
      continue;
    }
    compact.push(line);
    previous = line;
  }

  return compact.join("\n").trim();
}

async function ensureSyncStateTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS knowledge_sync_state (
      source_key TEXT PRIMARY KEY,
      source_url TEXT NOT NULL,
      content_hash TEXT,
      last_status TEXT,
      last_synced_at TIMESTAMPTZ,
      last_checked_at TIMESTAMPTZ,
      last_error TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getSyncState() {
  await ensureSyncStateTable();
  const result = await pool.query(
    `SELECT source_key, source_url, content_hash, last_status,
            last_synced_at, last_checked_at, last_error, updated_at
     FROM knowledge_sync_state
     WHERE source_key = $1`,
    [SOURCE_KEY]
  );
  return result.rows[0] || null;
}

async function saveSyncState({ url, hash, status, error = null, synced = false }) {
  await ensureSyncStateTable();
  await pool.query(
    `INSERT INTO knowledge_sync_state (
       source_key, source_url, content_hash, last_status,
       last_synced_at, last_checked_at, last_error, updated_at
     )
     VALUES ($1, $2, $3, $4, CASE WHEN $5 THEN NOW() ELSE NULL END, NOW(), $6, NOW())
     ON CONFLICT (source_key)
     DO UPDATE SET
       source_url = EXCLUDED.source_url,
       content_hash = COALESCE(EXCLUDED.content_hash, knowledge_sync_state.content_hash),
       last_status = EXCLUDED.last_status,
       last_synced_at = CASE WHEN $5 THEN NOW() ELSE knowledge_sync_state.last_synced_at END,
       last_checked_at = NOW(),
       last_error = EXCLUDED.last_error,
       updated_at = NOW()`,
    [SOURCE_KEY, url, hash || null, status, synced, error]
  );
}

async function fetchGoldiePage(url) {
  const response = await axios.get(url, {
    timeout: 20000,
    maxContentLength: 5 * 1024 * 1024,
    headers: {
      "User-Agent": "ShilohKnowledgeSync/1.0 (+https://shiloh-whatsapp-bot.onrender.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    validateStatus: (status) => status >= 200 && status < 400,
  });

  return String(response.data || "");
}

async function syncGoldieKnowledge({ force = false } = {}) {
  if (syncInProgress) {
    return { status: "busy", changed: false };
  }

  syncInProgress = true;
  const url = process.env.GOLDIE_SYNC_URL || DEFAULT_GOLDIE_URL;

  try {
    const html = await fetchGoldiePage(url);
    const content = normalizeGoldieSnapshot(htmlToReadableText(html));

    if (!content || content.length < 1000) {
      throw new Error("Goldie page did not contain enough readable business content");
    }

    const hash = crypto.createHash("sha256").update(content).digest("hex");
    const state = await getSyncState();

    if (!force && state?.content_hash === hash) {
      await saveSyncState({ url, hash, status: "unchanged", synced: false });
      return {
        status: "unchanged",
        changed: false,
        contentHash: hash,
        characters: content.length,
      };
    }

    const document = await replaceDocumentBySource({
      title: "Shiloh Goldie Business Knowledge",
      source: SOURCE_KEY,
      content,
    });

    await saveSyncState({ url, hash, status: "synced", synced: true });

    return {
      status: "synced",
      changed: true,
      contentHash: hash,
      characters: content.length,
      document,
    };
  } catch (error) {
    logger.error({ err: error }, "Goldie knowledge sync failed");
    try {
      await saveSyncState({
        url,
        status: "error",
        error: String(error.message || error).slice(0, 1000),
        synced: false,
      });
    } catch (stateError) {
      logger.error({ err: stateError }, "Failed to persist Goldie sync error state");
    }
    throw error;
  } finally {
    syncInProgress = false;
  }
}

function startGoldieSyncScheduler() {
  if (schedulerTimer) return schedulerTimer;

  const hours = Math.max(
    1,
    Math.min(Number(process.env.GOLDIE_SYNC_INTERVAL_HOURS) || 12, 168)
  );
  const intervalMs = hours * 60 * 60 * 1000;

  const run = () => {
    syncGoldieKnowledge().catch(() => {});
  };

  setTimeout(run, 15000).unref();
  schedulerTimer = setInterval(run, intervalMs);
  schedulerTimer.unref();

  logger.info({ intervalHours: hours }, "Goldie knowledge sync scheduler started");
  return schedulerTimer;
}

module.exports = {
  syncGoldieKnowledge,
  getSyncState,
  startGoldieSyncScheduler,
  htmlToReadableText,
  normalizeGoldieSnapshot,
  SOURCE_KEY,
};
