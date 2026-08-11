const { applyServiceCatalogueMigrations } = require('../services/serviceCatalogueMigration');

exports.applyCatalogueMigrations = async (req, res) => {
  try {
    const result = await applyServiceCatalogueMigrations();
    (req.log || console).info?.({ result }, 'Catalogue content migrations applied through guarded one-time endpoint');
    return res.status(200).json({ result, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, 'Catalogue content migration rejected');
    return res.status(409).json({ error: 'Catalogue migration rejected', detail: error.message, requestId: req.id });
  }
};
