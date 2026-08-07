const { Pool } = require("pg");
const logger = require("../lib/logger");

const BOOKING_URL =
  process.env.GOLDIE_BOOKING_URL ||
  "https://book.heygoldie.com/Shiloh-Massage-Therapy-Clinic";

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
      status TEXT NOT NULL DEFAULT 'collecting',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  initialized = true;
}

function isBookingStart(text = "") {
  return /\b(book|booking|appointment|schedule|reserve)\b/i.test(String(text));
}

function isBookingCancel(text = "") {
  return /\b(cancel|stop|never mind|nevermind)\b/i.test(String(text));
}

function extractTime(text = "") {
  const match = String(text).match(
    /\b(?:at\s*)?((?:[01]?\d|2[0-3])(?::[0-5]\d)?\s*(?:am|pm)?|(?:1[0-2]|0?[1-9])\s*(?:am|pm))\b/i
  );
  return match ? match[1].trim() : null;
}

function extractDate(text = "") {
  const value = String(text);
  const relative = value.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (relative) return relative[1].trim();

  const numeric = value.match(/\b(\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?)\b/);
  return numeric ? numeric[1] : null;
}

function extractService(text = "") {
  const value = String(text).trim();
  const patterns = [
    /\b(?:book|schedule|reserve)\s+(?:me\s+)?(?:an?\s+)?(.+?)(?=\s+(?:for|on|at|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|$)/i,
    /\b(?:i(?:'d| would)? like|i want)\s+(?:to book\s+)?(?:an?\s+)?(.+?)(?=\s+(?:for|on|at|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|$)/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/[.!?]+$/, "");
  }

  return null;
}

async function getIntent(phone) {
  await ensureTable();
  const result = await pool.query(
    `SELECT phone, service_text, preferred_date, preferred_time, status, created_at, updated_at
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
  const status = patch.status ?? current.status ?? "collecting";

  const result = await pool.query(
    `INSERT INTO booking_intents (phone, service_text, preferred_date, preferred_time, status, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (phone) DO UPDATE SET
       service_text = EXCLUDED.service_text,
       preferred_date = EXCLUDED.preferred_date,
       preferred_time = EXCLUDED.preferred_time,
       status = EXCLUDED.status,
       updated_at = NOW()
     RETURNING phone, service_text, preferred_date, preferred_time, status, created_at, updated_at`,
    [phone, service, date, time, status]
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
  if (!intent.preferred_date) {
    return "What day or date would you prefer?";
  }
  if (!intent.preferred_time) {
    return "What time would you prefer?";
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

    const patch = {
      serviceText: extractService(text),
      preferredDate: extractDate(text),
      preferredTime: extractTime(text),
      status: "collecting",
    };

    if (active) {
      if (!existing.service_text && !patch.serviceText) patch.serviceText = String(text).trim();
      if (!existing.preferred_date && !patch.preferredDate) patch.preferredDate = extractDate(text) || null;
      if (!existing.preferred_time && !patch.preferredTime) patch.preferredTime = extractTime(text) || null;
    }

    let intent = await saveIntent(phone, patch);
    const question = nextQuestion(intent);

    if (question) {
      return { handled: true, reply: question, intent };
    }

    intent = await saveIntent(phone, { status: "ready_for_handoff" });

    const reply = [
      "I have your booking preferences:",
      `• Service: ${intent.service_text}`,
      `• Date: ${intent.preferred_date}`,
      `• Time: ${intent.preferred_time}`,
      "",
      "I can collect the booking details, but I can’t reserve a live Goldie time slot yet. Please use Shiloh’s secure booking page to confirm current availability and complete the appointment:",
      BOOKING_URL,
    ].join("\n");

    return { handled: true, reply, intent };
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
};
