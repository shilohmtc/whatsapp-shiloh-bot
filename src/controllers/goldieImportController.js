const { stageGoldieClients } = require("../services/goldieClientImport");
const { stageGoldieAppointments } = require("../services/goldieAppointmentStaging");

exports.stageClients = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "Upload Clients.csv using form field 'file'", requestId: req.id });
    }

    const result = await stageGoldieClients(req.file.buffer, req.file.originalname || "Clients.csv");
    return res.status(200).json({ result, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Goldie client staging failed");
    return res.status(500).json({ error: error.message || "Goldie client staging failed", requestId: req.id });
  }
};

exports.stageAppointments = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "Upload the Goldie appointments CSV using form field 'file'", requestId: req.id });
    }

    const result = await stageGoldieAppointments(req.file.buffer, req.file.originalname || "Appointments.csv");
    return res.status(200).json({ result, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Goldie appointment staging failed");
    return res.status(500).json({ error: error.message || "Goldie appointment staging failed", requestId: req.id });
  }
};
