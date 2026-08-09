const { pool } = require("../db/pool");
const { extractDate, extractTime, displayDate } = require("./bookingIntent");
const logger = require("../lib/logger");

const BOOKING_URL =
  process.env.GOLDIE_BOOKING_URL ||
  "https://book.heygoldie.com/Shiloh-Massage-Therapy-Clinic";

let initialized = false;

async function ensureTable() {
  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointment_change_intents (
      phone VARCHAR(32) PRIMARY KEY,
      action TEXT NOT NULL,
      existing_appointment_date TEXT,
      preferred_date TEXT,
      preferred_time TEXT,
      status TEXT NOT NULL DEFAULT 'collecting',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(
    `ALTER TABLE appointment_change_intents
     ADD COLUMN IF NOT EXISTS existing_appointment_date TEXT`
  );

  initialized = true;
}

function detectAction(text = "") {
  const value = String(text).toLowerCase();
  if (/\b(cancel|cancellation)\b.*\b(appointment|booking)\b|\b(cancel my appointment|cancel my booking)\b/.test(value)) {
    return "cancel";
  }
  if (/\b(reschedule|move)\b.*\b(appointment|booking)\b|\b(change|move) my (appointment|booking)\b/.test(value)) {
    return "reschedule";
  }
  return null;
}

function isAbort(text = "") {
  return /^(stop|never mind|nevermind|forget it|exit)$/i.test(String(text).trim());
}

function isConfirmation(text = "") {
  return /^(yes|y|confirm|confirmed|correct|proceed|continue|ok|okay)$/i.test(String(text).trim());
}

async function getIntent(phone) {
  await ensureTable();
  const result = await pool.query(
    `SELECT phone, action, existing_appointment_date, preferred_date, preferred_time, status,
            created_at, updated_at
     FROM appointment_change_intents
     WHERE phone = $1`,
    [phone]
  );
  return result.rows[0] || null;
}

async function saveIntent(phone, patch = {}) {
  await ensureTable();
  const current = (await getIntent(phone)) || {};
  const action = patch.action ?? current.action;
  if (!action) throw new Error("Appointment change action is required");

  const currentDate = patch.currentDate ?? current.existing_appointment_date ?? null;
  const preferredDate = patch.preferredDate ?? current.preferred_date ?? null;
  const preferredTime = patch.preferredTime ?? current.preferred_time ?? null;
  const status = patch.status ?? current.status ?? "collecting";

  const result = await pool.query(
    `INSERT INTO appointment_change_intents (
       phone, action, existing_appointment_date, preferred_date, preferred_time, status, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (phone) DO UPDATE SET
       action = EXCLUDED.action,
       existing_appointment_date = EXCLUDED.existing_appointment_date,
       preferred_date = EXCLUDED.preferred_date,
       preferred_time = EXCLUDED.preferred_time,
       status = EXCLUDED.status,
       updated_at = NOW()
     RETURNING phone, action, existing_appointment_date, preferred_date, preferred_time, status,
               created_at, updated_at`,
    [phone, action, currentDate, preferredDate, preferredTime, status]
  );

  return result.rows[0];
}

async function clearIntent(phone) {
  await ensureTable();
  await pool.query("DELETE FROM appointment_change_intents WHERE phone = $1", [phone]);
}

function cancellationPolicyNote() {
  return process.env.SHILOH_CANCELLATION_POLICY ||
    "Shiloh's cancellation policy may apply to late cancellations or no-shows. Please review the policy shown in Goldie before confirming the change.";
}

function nextQuestion(intent) {
  if (!intent.existing_appointment_date) {
    return "What day or date is the existing appointment you want to change?";
  }

  if (intent.action === "reschedule" && !intent.preferred_date) {
    return "What new day or date would you prefer?";
  }

  if (intent.action === "reschedule" && !intent.preferred_time) {
    return "What new time would you prefer? You can also say morning or afternoon.";
  }

  return null;
}

function buildSummary(intent) {
  if (intent.action === "cancel") {
    return [
      "Please confirm this cancellation request:",
      `• Existing appointment: ${displayDate(intent.existing_appointment_date)}`,
      "",
      cancellationPolicyNote(),
      "",
      "Reply YES to continue to Goldie, or STOP to leave the appointment unchanged.",
    ].join("\n");
  }

  return [
    "Please confirm these reschedule preferences:",
    `• Existing appointment: ${displayDate(intent.existing_appointment_date)}`,
    `• Preferred new date: ${displayDate(intent.preferred_date)}`,
    `• Preferred new time: ${intent.preferred_time}`,
    "",
    "Reply YES to continue to Goldie, or STOP to leave the appointment unchanged.",
  ].join("\n");
}

function buildHandoff(intent) {
  const actionText = intent.action === "cancel" ? "cancel" : "reschedule";
  return [
    `Your ${actionText} request is ready to complete in Goldie.`,
    "",
    "Shiloh cannot directly change an existing Goldie appointment yet, so nothing has been changed at this point.",
    "Use the Reschedule or Cancel link in your Goldie appointment confirmation email, or sign in from Shiloh's Goldie booking page to manage your appointment:",
    BOOKING_URL,
    "",
    intent.action === "cancel" ? cancellationPolicyNote() : "Goldie will show the live appointment options available for your account.",
  ].join("\n");
}

async function processAppointmentChangeMessage(phone, text) {
  try {
    let existing = await getIntent(phone);
    const action = detectAction(text);
    let active = existing && ["collecting", "awaiting_confirmation"].includes(existing.status);

    if (action && existing && (existing.action !== action || existing.status === "ready_for_handoff")) {
      await clearIntent(phone);
      existing = null;
      active = false;
    }

    if (!active && !action) return { handled: false };

    if (active && isAbort(text)) {
      await clearIntent(phone);
      return {
        handled: true,
        reply: "No problem — I’ve stopped that appointment-change request. Your Goldie appointment has not been changed.",
      };
    }

    if (existing?.status === "awaiting_confirmation" && action && existing.action !== action) {
      await clearIntent(phone);
      existing = null;
      active = false;
    }

    if (existing?.status === "awaiting_confirmation") {
      if (isConfirmation(text)) {
        const intent = await saveIntent(phone, { status: "ready_for_handoff" });
        return { handled: true, reply: buildHandoff(intent), intent };
      }

      return {
        handled: true,
        reply: "Please reply YES to continue to Goldie, or STOP to leave your appointment unchanged.",
        intent: existing,
      };
    }

    let intent = existing;
    if (!intent) {
      intent = await saveIntent(phone, {
        action,
        currentDate: null,
        preferredDate: null,
        preferredTime: null,
        status: "collecting",
      });
    }

    const date = extractDate(text);
    const time = extractTime(text);

    if (!intent.existing_appointment_date && date) {
      intent = await saveIntent(phone, { currentDate: date });
    } else if (intent.action === "reschedule" && !intent.preferred_date && date) {
      intent = await saveIntent(phone, { preferredDate: date });
    }

    if (intent.action === "reschedule" && !intent.preferred_time && time) {
      intent = await saveIntent(phone, { preferredTime: time });
    }

    const question = nextQuestion(intent);
    if (question) return { handled: true, reply: question, intent };

    intent = await saveIntent(phone, { status: "awaiting_confirmation" });
    return { handled: true, reply: buildSummary(intent), intent };
  } catch (error) {
    logger.error({ err: error }, "Appointment change intent processing failed");
    return { handled: false };
  }
}

module.exports = {
  processAppointmentChangeMessage,
  getIntent,
  clearIntent,
  ensureTable,
  detectAction,
};
