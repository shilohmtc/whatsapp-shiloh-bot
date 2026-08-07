const { syncGoldieKnowledge, getSyncState } = require("../services/goldieSync");

exports.syncGoldie = async (req, res) => {
  try {
    const force = Boolean(req.body?.force);
    const result = await syncGoldieKnowledge({ force });
    return res.status(result.status === "busy" ? 202 : 200).json({
      result,
      requestId: req.id,
    });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Goldie sync request failed");
    return res.status(502).json({
      error: "Goldie knowledge sync failed",
      detail: String(error.message || error),
      requestId: req.id,
    });
  }
};

exports.getGoldieSyncStatus = async (req, res) => {
  try {
    const state = await getSyncState();
    return res.status(200).json({ state, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Goldie sync status request failed");
    return res.status(500).json({
      error: "Could not read Goldie sync status",
      requestId: req.id,
    });
  }
};
