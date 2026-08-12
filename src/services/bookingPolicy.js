const { pool } = require("../db/pool");
const {
  commitAcceptedClientBooking,
  processAcceptedClientBookingMessage,
} = require("./clientBookingCommit");
const logger = require("../lib/logger");

const POLICY_VERSION = "2026-08-11-v1";
const POLICY_CHANNEL = "whatsapp";

const POLICY_TEXT = [
  "*Shiloh Massage Therapy & Aesthetic Clinic — Booking Policy & Terms*",
  "",
  "All treatments and services provided by Shiloh are strictly professional and non-sexual. Inappropriate, suggestive, abusive, discriminatory, threatening or disrespectful behaviour, comments or requests will not be tolerated. Shiloh may refuse or immediately end a treatment where these standards are breached.",
  "",
  "*Appointments & Arrival*",
  "Please arrive on time. Late arrival may require a shorter treatment so later clients are not delayed, and the full treatment fee may still apply.",
  "",
  "*Cancellations & Rescheduling*",
  "Please give at least 24 hours' notice when cancelling or rescheduling. Late cancellations and missed appointments may be subject to Shiloh's applicable cancellation or booking policy.",
  "",
  "*Health & Treatment Information*",
  "Please provide accurate and relevant health, medical, pregnancy, allergy, medication and treatment information before your service, and tell your practitioner about any change that could affect treatment safety or suitability.",
  "",
  "*Treatment Suitability & Results*",
  "Some treatments are not suitable for every client. A treatment may be adjusted, postponed or declined for safety reasons. Individual experiences and results may vary.",
  "",
  "*Respect, Safety & Belongings*",
  "Shiloh is committed to a professional, respectful and safe environment. We may refuse service where conduct compromises another person's safety, dignity or wellbeing. Please take reasonable care of your personal belongings while at the clinic.",
  "",
  `Policy version: ${POLICY_VERSION}`,
  "",
  "To continue with this booking request, reply exactly: *I AGREE*",
  "If you do not agree, reply *DECLINE* and the booking request will not proceed.",
].join("\n");

let initialized = false;

async function ensurePolicySchema() {
  if (initialized) return;

  await pool.query(`ALTER TABLE booking_intents ADD COLUMN IF NOT EXISTS policy_version TEXT`);
  await pool.query(`ALTER TABLE booking_intents ADD COLUMN IF NOT EXISTS policy_accepted_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE booking_intents ADD COLUMN IF NOT EXISTS policy_channel TEXT`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_policy_acceptances (
      id BIGSERIAL PRIMARY KEY,
      phone VARCHAR(32) NOT NULL,
      policy_version TEXT NOT NULL,
      accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      channel TEXT NOT NULL,
      service_text TEXT,
      preferred_date TEXT,
      preferred_time TEXT,
      therapist_text TEXT
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_booking_policy_acceptances_phone
    ON booking_policy_acceptances (phone, accepted_at DESC)
  `);

  initialized = true;
}

function isSummaryConfirmation(text = "") {
  return /^(yes|y|confirm|confirmed|correct|looks good|that works|proceed|continue|ok|okay)$/i.test(
    String(text).trim()
  );
}

function isEditRequest(text = "") {
  return /\b(change|edit|update|different|instead|wrong)\b/i.test(String(text));
}

function isExplicitAcceptance(text = "") {
  return /^(i agree|agree|i accept|accept|yes[,. ]+i agree)$/i.test(String(text).trim());
}

function isDecline(text = "") {
  return /^(decline|i decline|do not agree|don't agree|cancel|stop|never mind|nevermind)$/i.test(
    String(text).trim()
  );
}

async function getBookingIntent(phone) {
  await ensurePolicySchema();
  const result = await pool.query(
    `SELECT phone, service_text, preferred_date, preferred_time, therapist_text,
            service_verified, status, policy_version, policy_accepted_at, policy_channel
     FROM booking_intents
     WHERE phone = $1`,
    [phone]
  );
  return result.rows[0] || null;
}

async function beginPolicyAcceptance(phone) {
  await ensurePolicySchema();
  const result = await pool.query(
    `UPDATE booking_intents
     SET status = 'awaiting_policy_acceptance',
         policy_version = $2,
         policy_accepted_at = NULL,
         policy_channel = NULL,
         updated_at = NOW()
     WHERE phone = $1 AND status = 'awaiting_confirmation'
     RETURNING *`,
    [phone, POLICY_VERSION]
  );
  return result.rows[0] || null;
}

async function recordAcceptance(phone) {
  await ensurePolicySchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `UPDATE booking_intents
       SET status = 'policy_accepted',
           policy_version = $2,
           policy_accepted_at = NOW(),
           policy_channel = $3,
           updated_at = NOW()
       WHERE phone = $1 AND status = 'awaiting_policy_acceptance'
       RETURNING *`,
      [phone, POLICY_VERSION, POLICY_CHANNEL]
    );

    const intent = updated.rows[0];
    if (!intent) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `INSERT INTO booking_policy_acceptances
         (phone, policy_version, channel, service_text, preferred_date, preferred_time, therapist_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        phone,
        POLICY_VERSION,
        POLICY_CHANNEL,
        intent.service_text,
        intent.preferred_date,
        intent.preferred_time,
        intent.therapist_text,
      ]
    );

    await client.query("COMMIT");
    return intent;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function declinePolicy(phone) {
  await ensurePolicySchema();
  await pool.query("DELETE FROM booking_intents WHERE phone = $1", [phone]);
}

async function finalizeAcceptedBooking(phone) {
  try {
    return await commitAcceptedClientBooking(phone);
  } catch (error) {
    logger.error({ err: error }, "Canonical client booking commit failed after policy acceptance");
    return {
      handled: true,
      status: "commit_failed",
      reply: "Your Booking Policy acceptance was recorded, but I couldn’t safely complete the final appointment write. I have not claimed a booking. Reply *RETRY BOOKING* to run the final availability and calendar checks again, or *CANCEL BOOKING* to stop.",
    };
  }
}

async function processBookingPolicyMessage(phone, text) {
  try {
    const intent = await getBookingIntent(phone);
    if (!intent) return { handled: false };

    if (intent.status === "policy_accepted") {
      return processAcceptedClientBookingMessage(phone, text);
    }

    if (intent.status === "awaiting_confirmation") {
      // Before policy acceptance begins, cancellation still belongs to the booking-intent
      // state machine so it can clear the pending request without touching any appointment.
      if (isDecline(text)) return { handled: false };
      if (isEditRequest(text)) return { handled: false };

      if (!isSummaryConfirmation(text)) {
        return {
          handled: true,
          reply: "Please reply YES if the booking details are correct so I can show you Shiloh's Booking Policy & Terms, or tell me what you'd like to change.",
          intent,
        };
      }

      const pending = await beginPolicyAcceptance(phone);
      if (!pending) return { handled: false };
      return { handled: true, reply: POLICY_TEXT, intent: pending };
    }

    if (intent.status !== "awaiting_policy_acceptance") return { handled: false };

    if (isDecline(text)) {
      await declinePolicy(phone);
      return {
        handled: true,
        reply: "No problem — the booking request has been cancelled and no appointment has been confirmed. I can help again whenever you're ready.",
      };
    }

    if (!isExplicitAcceptance(text)) {
      return {
        handled: true,
        reply: "I can only continue after explicit acceptance of the Booking Policy & Terms. Please reply *I AGREE* to accept, or *DECLINE* to stop this booking request.",
        intent,
      };
    }

    const accepted = await recordAcceptance(phone);
    if (!accepted) {
      return {
        handled: true,
        reply: "I couldn't record your policy acceptance safely, so the booking has not been confirmed. Please try again.",
      };
    }

    logger.info({ policyVersion: POLICY_VERSION }, "Booking policy accepted via WhatsApp");
    return finalizeAcceptedBooking(phone);
  } catch (error) {
    logger.error({ err: error }, "Booking policy processing failed");
    return {
      handled: true,
      reply: "I couldn't complete the booking-policy step safely, so I have not claimed an appointment. Please try again in a moment.",
    };
  }
}

function sanitizeBookingReply(reply = "") {
  return String(reply)
    .replace(
      "Reply YES to continue to Goldie, or tell me what you'd like to change.",
      "Reply YES if these details are correct. I'll then show you Shiloh's Booking Policy & Terms for explicit acceptance before the booking can proceed."
    )
    .replace(
      "Please reply YES to continue to Goldie, or tell me what you'd like to change — for example, ‘change the time to 3pm’.",
      "Please reply YES if the details are correct so I can show you Shiloh's Booking Policy & Terms, or tell me what you'd like to change — for example, ‘change the time to 3pm’."
    );
}

module.exports = {
  POLICY_VERSION,
  POLICY_TEXT,
  ensurePolicySchema,
  processBookingPolicyMessage,
  sanitizeBookingReply,
  isExplicitAcceptance,
};
