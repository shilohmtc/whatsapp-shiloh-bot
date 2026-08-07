const { Pool } = require("pg");
const { retrieveKnowledge } = require("./knowledge");
const logger = require("../lib/logger");

const BOOKING_URL =
  process.env.GOLDIE_BOOKING_URL ||
  "https://book.heygoldie.com/Shiloh-Massage-Therapy-Clinic";

const CLINIC_TIME_ZONE = "Africa/Johannesburg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("render.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

let initialized = false;

async function ensureTable() {
  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_intents (
      phone VARCHAR(32) PRIMARY KEY,
      service_text TEXT,
      preferred_date TEXT,
      preferred_time TEXT,
      therapist_text TEXT,
      service_verified BOOLEAN,
      status TEXT NOT NULL DEFAULT 'collecting',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE booking_intents ADD COLUMN IF NOT EXISTS therapist_text TEXT`);
  await pool.query(`ALTER TABLE booking_intents ADD COLUMN IF NOT EXISTS service_verified BOOLEAN`);

  initialized = true;
}

function isBookingStart(text = "") {
  return /\b(book|booking|appointment|schedule|reserve)\b/i.test(String(text));
}

function isBookingCancel(text = "") {
  return /\b(cancel|stop|never mind|nevermind)\b/i.test(String(text));
}

function localDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

function dateFromLocalParts({ year, month, day }) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function formatIsoDate(date) {
  const parts = localDateParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function currentClinicDate(now = new Date()) {
  return dateFromLocalParts(localDateParts(now));
}

function resolveWeekday(targetDay, { next = false } = {}, now = new Date()) {
  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const target = weekdays.indexOf(targetDay.toLowerCase());
  if (target < 0) return null;

  const base = currentClinicDate(now);
  const current = base.getUTCDay();
  let delta = (target - current + 7) % 7;
  if (next || delta === 0) delta += 7;
  return formatIsoDate(addDays(base, delta));
}

function extractDate(text = "", now = new Date()) {
  const value = String(text).trim();
  const base = currentClinicDate(now);

  if (/\btoday\b/i.test(value)) return formatIsoDate(base);
  if (/\btomorrow\b/i.test(value)) return formatIsoDate(addDays(base, 1));

  const weekday = value.match(
    /\b(?:(next)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
  );
  if (weekday) {
    return resolveWeekday(weekday[2], { next: Boolean(weekday[1]) }, now);
  }

  const numeric = value.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    let year = numeric[3] ? Number(numeric[3]) : localDateParts(now).year;
    if (year < 100) year += 2000;

    const candidate = dateFromLocalParts({ year, month, day });
    if (
      candidate.getUTCFullYear() === year &&
      candidate.getUTCMonth() + 1 === month &&
      candidate.getUTCDate() === day
    ) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return null;
}

function extractTime(text = "") {
  const value = String(text).trim();

  const explicit = value.match(
    /\b(?:at\s+)?((?:[01]?\d|2[0-3]):[0-5]\d\s*(?:am|pm)?|(?:1[0-2]|0?[1-9])\s*(?:am|pm))\b/i
  );
  if (explicit) return explicit[1].trim().toLowerCase();

  const atHour = value.match(/\bat\s+((?:[01]?\d|2[0-3]))\b/i);
  if (atHour) return atHour[1].trim();

  if (/^(?:[01]?\d|2[0-3])$/.test(value)) return value;

  const daypart = value.match(/\b(morning|afternoon|evening)\b/i);
  return daypart ? daypart[1].toLowerCase() : null;
}

function extractTherapist(text = "") {
  const value = String(text).trim();
  if (/\b(any therapist|anyone|whoever is available|no preference)\b/i.test(value)) {
    return "Any therapist";
  }

  const match = value.match(/\b(?:with|therapist)\s+([A-Za-z][A-Za-z' -]{1,60})\b/i);
  if (!match?.[1]) return null;

  return match[1]
    .trim()
    .replace(/\b(?:on|at|tomorrow|today|next)\b.*$/i, "")
    .trim()
    .replace(/[.!?]+$/, "");
}

function extractService(text = "") {
  const value = String(text).trim();
  const patterns = [
    /\b(?:book|schedule|reserve)\s+(?:me\s+)?(?:an?\s+)?(.+?)(?=\s+(?:for|on|at|with|tomorrow|today|next\s+|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening)\b|$)/i,
    /\b(?:i(?:'d| would)? like|i want)\s+(?:to book\s+)?(?:an?\s+)?(.+?)(?=\s+(?:for|on|at|with|tomorrow|today|next\s+|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening)\b|$)/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/[.!?]+$/, "");
  }

  return null;
}

function significantServiceTokens(service = "") {
  const ignored = new Set([
    "massage",
    "treatment",
    "therapy",
    "service",
    "session",
    "full",
    "body",
    "minute",
    "minutes",
  ]);

  return String(service)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !ignored.has(token));
}

async function hasLexicalKnowledgeMatch(service) {
  const tokens = significantServiceTokens(service);
  if (!tokens.length) return false;

  await ensureTable();

  const result = await pool.query(
    `SELECT EXISTS (
       SELECT 1
       FROM documents d
       WHERE ${tokens.map((_, index) => `LOWER(d.content) LIKE $${index + 1}`).join(" AND ")}
     ) AS found`,
    tokens.map((token) => `%${token}%`)
  );

  return Boolean(result.rows[0]?.found);
}

async function verifyService(service) {
  if (!service?.trim()) return { verified: false, reason: "missing" };

  try {
    // Prefer a deterministic text match against the full authoritative
    // knowledge document. This avoids false negatives when a short service
    // name such as "Swedish massage" does not rank in the top vector chunks.
    if (await hasLexicalKnowledgeMatch(service)) {
      return { verified: true, reason: "lexical_knowledge_match" };
    }

    const matches = await retrieveKnowledge(service, 8);
    const tokens = significantServiceTokens(service);

    const verified = matches.some((item) => {
      if (Number(item.similarity) < 0.35) return false;
      const haystack = `${item.title || ""} ${item.content || ""}`.toLowerCase();
      if (tokens.length === 0) return Number(item.similarity) >= 0.58;
      return tokens.every((token) => haystack.includes(token));
    });

    return { verified, reason: verified ? "semantic_knowledge_match" : "not_found" };
  } catch (error) {
    logger.warn({ err: error }, "Could not verify requested booking service");
    return { verified: null, reason: "verification_unavailable" };
  }
}

async function getIntent(phone) {
  await ensureTable();
  const result = await pool.query(
    `SELECT phone, service_text, preferred_date, preferred_time, therapist_text,
            service_verified, status, created_at, updated_at
     FROM booking_intents WHERE phone = $1`,
    [phone]
  );
  return result.rows[0] || null;
}

async function saveIntent(phone, patch = {}) {
  await ensureTable();
  const current = (await getIntent(phone)) || {};

  const service = patch.serviceText ?? current.service_text ?? null;
  const date = patch.preferredDate ?? current.preferred_date ?? null;
  const time = patch.preferredTime ?? current.preferred_time ?? null;
  const therapist = patch.therapistText ?? current.therapist_text ?? null;
  const serviceVerified = patch.serviceVerified ?? current.service_verified ?? null;
  const status = patch.status ?? current.status ?? "collecting";

  const result = await pool.query(
    `INSERT INTO booking_intents (
       phone, service_text, preferred_date, preferred_time, therapist_text,
       service_verified, status, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (phone) DO UPDATE SET
       service_text = EXCLUDED.service_text,
       preferred_date = EXCLUDED.preferred_date,
       preferred_time = EXCLUDED.preferred_time,
       therapist_text = EXCLUDED.therapist_text,
       service_verified = EXCLUDED.service_verified,
       status = EXCLUDED.status,
       updated_at = NOW()
     RETURNING phone, service_text, preferred_date, preferred_time, therapist_text,
               service_verified, status, created_at, updated_at`,
    [phone, service, date, time, therapist, serviceVerified, status]
  );

  return result.rows[0];
}

async function clearIntent(phone) {
  await ensureTable();
  await pool.query("DELETE FROM booking_intents WHERE phone = $1", [phone]);
}

function nextQuestion(intent) {
  if (!intent.service_text) {
    return "Which Shiloh treatment or service would you like to book?";
  }
  if (intent.service_verified === false) {
    return `I can't verify “${intent.service_text}” in Shiloh's current service information. Please choose one of Shiloh's listed treatments or tell me the treatment name again.`;
  }
  if (!intent.preferred_date) {
    return "What day or date would you prefer? You can say something like ‘tomorrow’ or ‘next Friday’.";
  }
  if (!intent.preferred_time) {
    return "What time would you prefer? You can also say morning, afternoon or evening.";
  }
  return null;
}

async function processBookingMessage(phone, text) {
  try {
    const existing = await getIntent(phone);
    const active = existing?.status === "collecting";

    if (!active && !isBookingStart(text)) {
      return { handled: false };
    }

    if (active && isBookingCancel(text)) {
      await clearIntent(phone);
      return {
        handled: true,
        reply: "No problem — I’ve cleared that booking request. How else can I help with Shiloh?",
      };
    }

    const extractedService = extractService(text);
    const patch = {
      serviceText: extractedService,
      preferredDate: extractDate(text),
      preferredTime: extractTime(text),
      therapistText: extractTherapist(text),
      status: "collecting",
    };

    if (active) {
      // If the previous service failed verification, treat the next plain-text
      // reply as a corrected service name so the customer is not stuck.
      if (existing.service_verified === false && !patch.serviceText) {
        patch.serviceText = String(text).trim().replace(/[.!?]+$/, "");
        patch.serviceVerified = null;
      } else if (!existing.service_text && !patch.serviceText) {
        patch.serviceText = String(text).trim();
      }

      if (!existing.preferred_date && !patch.preferredDate) patch.preferredDate = extractDate(text) || null;
      if (!existing.preferred_time && !patch.preferredTime) patch.preferredTime = extractTime(text) || null;
    }

    const serviceChanged =
      patch.serviceText && patch.serviceText.trim() !== String(existing?.service_text || "").trim();

    if (patch.serviceText && (serviceChanged || existing?.service_verified == null)) {
      const verification = await verifyService(patch.serviceText);
      patch.serviceVerified = verification.verified;
    }

    let intent = await saveIntent(phone, patch);
    const question = nextQuestion(intent);

    if (question) {
      return { handled: true, reply: question, intent };
    }

    intent = await saveIntent(phone, { status: "ready_for_handoff" });

    const summary = [
      "I have your booking preferences:",
      `• Service: ${intent.service_text}`,
      `• Date: ${intent.preferred_date}`,
      `• Time: ${intent.preferred_time}`,
    ];

    if (intent.therapist_text) {
      summary.push(`• Therapist: ${intent.therapist_text}`);
    }

    summary.push(
      "",
      "These are your preferences, not a reserved appointment. Please use Shiloh’s secure Goldie booking page to check live availability and complete the booking:",
      BOOKING_URL
    );

    return { handled: true, reply: summary.join("\n"), intent };
  } catch (error) {
    logger.error({ err: error }, "Booking intent processing failed");
    return { handled: false };
  }
}

module.exports = {
  processBookingMessage,
  getIntent,
  clearIntent,
  ensureTable,
  extractDate,
  extractTime,
  extractTherapist,
  verifyService,
};
