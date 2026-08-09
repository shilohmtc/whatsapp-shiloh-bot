const { pool } = require("../db/pool");
const { sendWhatsAppTemplate } = require("./whatsapp");
const { getProfile } = require("./profile");
const { createPendingExperience } = require("./customerExperience");
const logger = require("../lib/logger");

const REMINDER_HOURS = Number(process.env.APPOINTMENT_REMINDER_HOURS || 24);
const FOLLOWUP_HOURS = Number(process.env.APPOINTMENT_FOLLOWUP_HOURS || 4);
const SCAN_MINUTES = Number(process.env.APPOINTMENT_SCAN_MINUTES || 5);
const LANGUAGE_CODE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";

let initialized = false;
let timer = null;
let running = false;

async function ensureTable() {
  if (initialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointment_lifecycle (
      id BIGSERIAL PRIMARY KEY,
      phone VARCHAR(32) NOT NULL,
      service_text TEXT NOT NULL,
      appointment_at TIMESTAMPTZ NOT NULL,
      therapist_text TEXT,
      status TEXT NOT NULL DEFAULT 'confirmed',
      source TEXT NOT NULL DEFAULT 'admin',
      reminder_sent_at TIMESTAMPTZ,
      followup_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_appointment_lifecycle_due ON appointment_lifecycle (status, appointment_at)`);
  initialized = true;
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^0-9]/g, "");
}

function formatAppointmentDate(value) {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function createAppointment({ phone, service, appointmentAt, therapist, source = "admin" }) {
  await ensureTable();
  const cleanPhone = normalizePhone(phone);
  const when = new Date(appointmentAt);
  if (!cleanPhone || !service || Number.isNaN(when.getTime())) {
    throw new Error("phone, service and a valid appointmentAt are required");
  }
  const result = await pool.query(
    `INSERT INTO appointment_lifecycle (phone, service_text, appointment_at, therapist_text, source)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [cleanPhone, String(service).trim(), when.toISOString(), therapist || null, source]
  );
  return result.rows[0];
}

async function listAppointments(limit = 100) {
  await ensureTable();
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const result = await pool.query(`SELECT * FROM appointment_lifecycle ORDER BY appointment_at DESC LIMIT $1`, [safeLimit]);
  return result.rows;
}

async function updateAppointmentStatus(id, status) {
  await ensureTable();
  const allowed = new Set(["confirmed", "cancelled", "completed"]);
  if (!allowed.has(status)) throw new Error("Invalid appointment status");
  const result = await pool.query(
    `UPDATE appointment_lifecycle SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return result.rows[0] || null;
}

async function claimDueReminder() {
  await ensureTable();
  const result = await pool.query(
    `UPDATE appointment_lifecycle a SET reminder_sent_at = NOW(), updated_at = NOW()
     WHERE a.id = (
       SELECT id FROM appointment_lifecycle
       WHERE status = 'confirmed' AND reminder_sent_at IS NULL
         AND appointment_at > NOW()
         AND appointment_at <= NOW() + ($1 * INTERVAL '1 hour')
       ORDER BY appointment_at ASC FOR UPDATE SKIP LOCKED LIMIT 1
     ) RETURNING a.*`,
    [REMINDER_HOURS]
  );
  return result.rows[0] || null;
}

async function claimDueFollowup() {
  await ensureTable();
  const result = await pool.query(
    `UPDATE appointment_lifecycle a SET followup_sent_at = NOW(), updated_at = NOW()
     WHERE a.id = (
       SELECT id FROM appointment_lifecycle
       WHERE status IN ('confirmed', 'completed') AND followup_sent_at IS NULL
         AND appointment_at <= NOW() - ($1 * INTERVAL '1 hour')
       ORDER BY appointment_at ASC FOR UPDATE SKIP LOCKED LIMIT 1
     ) RETURNING a.*`,
    [FOLLOWUP_HOURS]
  );
  return result.rows[0] || null;
}

async function undoClaim(id, column) {
  if (!["reminder_sent_at", "followup_sent_at"].includes(column)) return;
  await pool.query(`UPDATE appointment_lifecycle SET ${column} = NULL, updated_at = NOW() WHERE id = $1`, [id]);
}

async function customerName(phone) {
  const profile = await getProfile(phone);
  return profile?.name || "there";
}

async function processReminders() {
  const reminderTemplate = process.env.WHATSAPP_REMINDER_TEMPLATE;
  const followupTemplate = process.env.WHATSAPP_FOLLOWUP_TEMPLATE;
  if (!reminderTemplate && !followupTemplate) return;

  if (reminderTemplate) {
    for (let i = 0; i < 20; i += 1) {
      const appointment = await claimDueReminder();
      if (!appointment) break;
      try {
        const name = await customerName(appointment.phone);
        const formatted = formatAppointmentDate(appointment.appointment_at);
        const parts = formatted.split(", ");
        const time = parts[parts.length - 1] || formatted;
        const date = parts.slice(0, -1).join(", ") || formatted;
        await sendWhatsAppTemplate(
          appointment.phone,
          reminderTemplate,
          [name, appointment.service_text, date, time],
          LANGUAGE_CODE
        );
      } catch (error) {
        await undoClaim(appointment.id, "reminder_sent_at");
        logger.error({ err: error, appointmentId: appointment.id }, "Appointment reminder failed");
        break;
      }
    }
  }

  if (followupTemplate) {
    for (let i = 0; i < 20; i += 1) {
      const appointment = await claimDueFollowup();
      if (!appointment) break;
      try {
        const name = await customerName(appointment.phone);
        await sendWhatsAppTemplate(
          appointment.phone,
          followupTemplate,
          [name, appointment.service_text],
          LANGUAGE_CODE
        );
        await createPendingExperience({
          appointmentId: appointment.id,
          phone: appointment.phone,
          service: appointment.service_text,
        });
      } catch (error) {
        await undoClaim(appointment.id, "followup_sent_at");
        logger.error({ err: error, appointmentId: appointment.id }, "Appointment follow-up failed");
        break;
      }
    }
  }
}

async function runScan() {
  if (running) return;
  running = true;
  try {
    await processReminders();
  } catch (error) {
    logger.error({ err: error }, "Appointment lifecycle scan failed");
  } finally {
    running = false;
  }
}

function startAppointmentLifecycleScheduler() {
  if (timer) return;
  logger.info({
    scanMinutes: SCAN_MINUTES,
    reminderHours: REMINDER_HOURS,
    followupHours: FOLLOWUP_HOURS,
    reminderTemplateConfigured: Boolean(process.env.WHATSAPP_REMINDER_TEMPLATE),
    followupTemplateConfigured: Boolean(process.env.WHATSAPP_FOLLOWUP_TEMPLATE),
  }, "Appointment lifecycle scheduler started");
  setTimeout(runScan, 5000).unref();
  timer = setInterval(runScan, Math.max(SCAN_MINUTES, 1) * 60 * 1000);
  timer.unref();
}

module.exports = {
  ensureTable,
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
  processReminders,
  startAppointmentLifecycleScheduler,
};
