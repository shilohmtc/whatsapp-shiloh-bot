const { randomUUID } = require("crypto");
const logger = require("../lib/logger");
const { runWithRequestLog } = require("../lib/requestLogContext");

function requestContext(req, res, next) {
  const requestId = req.get("x-request-id") || randomUUID();
  const startedAt = Date.now();

  req.id = requestId;
  req.log = logger.child({ requestId });
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    req.log.info(
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      },
      "request completed"
    );
  });

  return runWithRequestLog(req.log, next);
}

module.exports = requestContext;
