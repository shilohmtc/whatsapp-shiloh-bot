const {
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
  processReminders,
} = require("../services/appointmentLifecycle");

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
