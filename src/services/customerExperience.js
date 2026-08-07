const { Pool } = require("pg");
const logger = require("../lib/logger");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("render.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

const GOOGLE_REVIEW_URL =
  process.env.SHILOH_GOOGLE_REVIEW_URL ||
  "https://g.page/r/CTRgQZGHbwfNEBM/review";
const REVIEW_COOLDOWN_DAYS = Number(process.env.REVIEW_REQUEST_COOLDOWN_DAYS || 30);

let initialized = false;

async function ensureTable() {
  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_experience (
      id BIGSERIAL PRIMARY KEY,
      appointment_id BIGINT,
      phone VARCHAR(32) NOT NULL,
      service_text TEXT,
      rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
      feedback TEXT,
      status TEXT NOT NULL DEFAULT 'awaiting_rating',
      review_requested_at TIMESTAMPTZ,
      feedback_received_at TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (appointment_id)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_customer_experience_phone_status
    ON customer_experience (phone, status, created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_customer_experience_rating
    ON customer_experience (rating, created_at DESC)
  `);

  initialized = true;
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^0-9]/g, "");
}

async function createPendingExperience({ appointmentId, phone, service }) {
  await ensureTable();
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) throw new Error("phone is required");

  const result = await pool.query(
    `INSERT INTO customer_experience
       (appointment_id, phone, service_text, status)
     VALUES ($1, $2, $3, 'awaiting_rating')
     ON CONFLICT (appointment_id) DO UPDATE SET
       phone = EXCLUDED.phone,
       service_text = EXCLUDED.service_text,
       status = CASE
         WHEN customer_experience.rating IS NULL THEN 'awaiting_rating'
         ELSE customer_experience.status
       END,
       updated_at = NOW()
     RETURNING *`,
    [appointmentId || null, cleanPhone, service || null]
  );
  return result.rows[0];
}

async function getActiveExperience(phone) {
  await ensureTable();
  const cleanPhone = normalizePhone(phone);
  const result = await pool.query(
    `SELECT * FROM customer_experience
     WHERE phone = $1
       AND status IN ('awaiting_rating', 'awaiting_feedback')
     ORDER BY created_at DESC
     LIMIT 1`,
    [cleanPhone]
  );
  return result.rows[0] || null;
}

async function recentlyRequestedReview(phone) {
  const cleanPhone = normalizePhone(phone);
  const result = await pool.query(
    `SELECT 1 FROM customer_experience
     WHERE phone = $1
       AND review_requested_at IS NOT NULL
       AND review_requested_at >= NOW() - ($2 * INTERVAL '1 day')
     LIMIT 1`,
    [cleanPhone, REVIEW_COOLDOWN_DAYS]
  );
  return result.rowCount > 0;
}

function reviewInvite(alreadyRequested) {
  if (alreadyRequested) return "";
  return [
    "",
    "If you'd also like to share your experience publicly, you can leave a Google review here:",
    GOOGLE_REVIEW_URL,
  ].join("\n");
}

async function processCustomerExperienceMessage(phone, text) {
  try {
    const experience = await getActiveExperience(phone);
    if (!experience) return { handled: false };

    const value = String(text || "").trim();

    if (experience.status === "awaiting_rating") {
      if (!/^[1-5]$/.test(value)) {
        return {
          handled: true,
          reply: "Please reply with a number from 1 to 5 so I can record your experience.",
          experience,
        };
      }

      const rating = Number(value);
      const alreadyRequested = await recentlyRequestedReview(phone);
      const reviewRequestedAtSql = alreadyRequested ? "review_requested_at" : "NOW()";

      if (rating >= 4) {
        const result = await pool.query(
          `UPDATE customer_experience
           SET rating = $2,
               status = 'completed',
               review_requested_at = ${reviewRequestedAtSql},
               updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [experience.id, rating]
        );

        const reply = [
          "Thank you so much! We're delighted that you had a good experience at Shiloh Massage Therapy & Aesthetic Clinic.",
          reviewInvite(alreadyRequested),
          "",
          "Thank you for supporting Shiloh.",
        ].filter(Boolean).join("\n");

        return { handled: true, reply, experience: result.rows[0] };
      }

      const result = await pool.query(
        `UPDATE customer_experience
         SET rating = $2,
             status = 'awaiting_feedback',
             review_requested_at = ${reviewRequestedAtSql},
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [experience.id, rating]
      );

      const reply = [
        "Thank you for telling us. I'm sorry your visit wasn't what you hoped for.",
        "Would you mind telling us what we could have done better? Your feedback will be kept for the clinic team to follow up.",
        reviewInvite(alreadyRequested),
      ].filter(Boolean).join("\n\n");

      return { handled: true, reply, experience: result.rows[0] };
    }

    if (experience.status === "awaiting_feedback") {
      if (value.length < 2) {
        return {
          handled: true,
          reply: "Please tell us briefly what we could have done better. Your feedback is important to the clinic team.",
          experience,
        };
      }

      const result = await pool.query(
        `UPDATE customer_experience
         SET feedback = $2,
             feedback_received_at = NOW(),
             status = 'needs_followup',
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [experience.id, value.slice(0, 4000)]
      );

      logger.warn(
        { experienceId: experience.id, rating: experience.rating },
        "Customer experience requires clinic follow-up"
      );

      return {
        handled: true,
        reply: "Thank you for being honest with us. I've recorded your feedback for the Shiloh clinic team so they can review it and follow up where needed. We appreciate you giving us the opportunity to improve.",
        experience: result.rows[0],
      };
    }

    return { handled: false };
  } catch (error) {
    logger.error({ err: error }, "Customer experience processing failed");
    return { handled: false };
  }
}

async function listFeedback(limit = 100, unresolvedOnly = false) {
  await ensureTable();
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const where = unresolvedOnly ? "WHERE status = 'needs_followup'" : "WHERE feedback IS NOT NULL";
  const result = await pool.query(
    `SELECT * FROM customer_experience
     ${where}
     ORDER BY created_at DESC
     LIMIT $1`,
    [safeLimit]
  );
  return result.rows;
}

async function listReviewRequests(limit = 100) {
  await ensureTable();
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const result = await pool.query(
    `SELECT * FROM customer_experience
     WHERE review_requested_at IS NOT NULL
     ORDER BY review_requested_at DESC
     LIMIT $1`,
    [safeLimit]
  );
  return result.rows;
}

async function getSatisfactionAnalytics() {
  await ensureTable();
  const summary = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE rating IS NOT NULL)::int AS total_ratings,
      ROUND(AVG(rating)::numeric, 2) AS average_rating,
      COUNT(*) FILTER (WHERE rating = 5)::int AS rating_5,
      COUNT(*) FILTER (WHERE rating = 4)::int AS rating_4,
      COUNT(*) FILTER (WHERE rating = 3)::int AS rating_3,
      COUNT(*) FILTER (WHERE rating = 2)::int AS rating_2,
      COUNT(*) FILTER (WHERE rating = 1)::int AS rating_1,
      COUNT(*) FILTER (WHERE rating >= 4)::int AS positive_ratings,
      COUNT(*) FILTER (WHERE rating <= 3)::int AS recovery_ratings,
      COUNT(*) FILTER (WHERE review_requested_at IS NOT NULL)::int AS review_requests,
      COUNT(*) FILTER (WHERE status = 'needs_followup')::int AS unresolved_feedback
    FROM customer_experience
  `);

  const monthly = await pool.query(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
      COUNT(*) FILTER (WHERE rating IS NOT NULL)::int AS ratings,
      ROUND(AVG(rating)::numeric, 2) AS average_rating
    FROM customer_experience
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at)
  `);

  return { ...summary.rows[0], monthly: monthly.rows };
}

async function resolveFeedback(id) {
  await ensureTable();
  const result = await pool.query(
    `UPDATE customer_experience
     SET status = 'resolved', resolved_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = {
  ensureTable,
  createPendingExperience,
  processCustomerExperienceMessage,
  listFeedback,
  listReviewRequests,
  getSatisfactionAnalytics,
  resolveFeedback,
};
