const {
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
  processReminders,
} = require("../services/appointmentLifecycle");
const { sendWhatsAppTemplate } = require("../services/whatsapp");
const { upsertProfile } = require("../services/profile");
const { createPendingExperience } = require("../services/customerExperience");

exports.createLifecycleAppointment = async (req, res) => {
  try {
    const appointment = await createAppointment({
      phone: req.body?.phone,
      service: req.body?.service,
      appointmentAt: req.body?.appointmentAt,
      therapist: req.body?.therapist,
      source: req.body?.source || "admin",
    });

    return res.status(201).json({ appointment, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to create appointment lifecycle record");
    return res.status(400).json({ error: error.message, requestId: req.id });
  }
};

exports.getLifecycleAppointments = async (req, res) => {
  try {
    const appointments = await listAppointments(req.query.limit);
    return res.status(200).json({ appointments, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to list appointment lifecycle records");
    return res.status(500).json({ error: "Could not list appointments", requestId: req.id });
  }
};

exports.patchLifecycleAppointment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid appointment id", requestId: req.id });
    }

    const appointment = await updateAppointmentStatus(id, String(req.body?.status || ""));
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found", requestId: req.id });
    }

    return res.status(200).json({ appointment, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to update appointment lifecycle record");
    return res.status(400).json({ error: error.message, requestId: req.id });
  }
};

exports.runLifecycleScan = async (req, res) => {
  try {
    await processReminders();
    return res.status(200).json({ status: "ok", requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to run appointment lifecycle scan");
    return res.status(500).json({ error: "Lifecycle scan failed", requestId: req.id });
  }
};

exports.runControlledLifecycleTest = async (req, res) => {
  try {
    const phone = String(req.body?.phone || "").replace(/[^0-9]/g, "");
    const name = String(req.body?.name || "").trim();
    const service = String(req.body?.service || "").trim();
    const date = String(req.body?.date || "").trim();
    const time = String(req.body?.time || "").trim();
    const therapist = String(req.body?.therapist || "").trim() || null;

    if (!phone || !name || !service || !date || !time) {
      return res.status(400).json({
        error: "phone, name, service, date and time are required",
        requestId: req.id,
      });
    }

    if (phone !== "27725128605") {
      return res.status(400).json({
        error: "Controlled lifecycle test is restricted to the configured test number",
        requestId: req.id,
      });
    }

    await upsertProfile(phone, { name });

    const appointment = await createAppointment({
      phone,
      service,
      appointmentAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      therapist,
      source: "controlled-lifecycle-test",
    });

    const reminderResult = await sendWhatsAppTemplate(
      phone,
      "appointment_reminder",
      [name, service, date, time],
      "en"
    );

    const followupResult = await sendWhatsAppTemplate(
      phone,
      "appointment_followup",
      [name, service],
      "en"
    );

    const experience = await createPendingExperience({
      appointmentId: appointment.id,
      phone,
      service,
    });

    return res.status(200).json({
      status: "ok",
      appointment,
      customerExperience: experience,
      reminderMessageId: reminderResult?.messages?.[0]?.id || null,
      followupMessageId: followupResult?.messages?.[0]?.id || null,
      nextStep: "Reply to the follow-up message with a rating from 1 to 5.",
      requestId: req.id,
    });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Controlled lifecycle test failed");
    return res.status(500).json({
      error: "Controlled lifecycle test failed",
      requestId: req.id,
    });
  }
};
