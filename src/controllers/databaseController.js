const {
  getDatabaseStatus,
  listDatabaseTables,
  getDatabaseSchema,
  getDatabaseOverview,
} = require("../services/databaseInspector");

exports.getStatus = async (req, res) => {
  try {
    const status = await getDatabaseStatus();
    return res.status(200).json({ status, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to inspect database status");
    return res.status(500).json({
      error: "Could not inspect database status",
      requestId: req.id,
    });
  }
};

exports.getTables = async (req, res) => {
  try {
    const tables = await listDatabaseTables();
    return res.status(200).json({ tables, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to inspect database tables");
    return res.status(500).json({
      error: "Could not inspect database tables",
      requestId: req.id,
    });
  }
};

exports.getSchema = async (req, res) => {
  try {
    const schema = await getDatabaseSchema();
    return res.status(200).json({ schema, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to inspect database schema");
    return res.status(500).json({
      error: "Could not inspect database schema",
      requestId: req.id,
    });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const overview = await getDatabaseOverview();
    return res.status(200).json({ overview, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to inspect database overview");
    return res.status(500).json({
      error: "Could not inspect database overview",
      requestId: req.id,
    });
  }
};
