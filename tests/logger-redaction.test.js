const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

test("logger never serializes provider Authorization values from nested errors", () => {
  const token = `EAA${"sensitive".repeat(30)}`;
  const script = `
    const logger = require(${JSON.stringify(path.join(__dirname, "../src/lib/logger"))});
    const token = process.env.LOG_REDACTION_TEST_TOKEN;
    const error = new Error("provider rejected Bearer " + token);
    error.code = "ERR_BAD_REQUEST";
    error.config = { headers: { Authorization: "Bearer " + token } };
    error.request = { _header: "Authorization: Bearer " + token };
    error.response = {
      status: 400,
      config: { headers: { Authorization: "Bearer " + token } },
    };
    logger.error({ err: error, status: 400 }, "provider request failed");
  `;

  const result = spawnSync(process.execPath, ["-e", script], {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8",
    env: { ...process.env, LOG_REDACTION_TEST_TOKEN: token },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, new RegExp(token));
  assert.doesNotMatch(result.stdout, /\"config\"|\"request\"|\"response\"/);
  assert.match(result.stdout, /Bearer \[REDACTED\]/);
  assert.match(result.stdout, /\"code\":\"ERR_BAD_REQUEST\"/);
  assert.match(result.stdout, /\"status\":400/);
});

test("logger redacts provider credentials and database URLs in error stacks", () => {
  const token = `sk-${"secret".repeat(20)}`;
  const databaseUrl = "postgresql://user:password@database.example/shiloh";
  const script = `
    const logger = require(${JSON.stringify(path.join(__dirname, "../src/lib/logger"))});
    const error = new Error(process.env.LOG_REDACTION_TEST_TOKEN + " " + process.env.LOG_REDACTION_TEST_DATABASE_URL);
    logger.error({ err: error }, "provider request failed");
  `;

  const result = spawnSync(process.execPath, ["-e", script], {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8",
    env: {
      ...process.env,
      LOG_REDACTION_TEST_TOKEN: token,
      LOG_REDACTION_TEST_DATABASE_URL: databaseUrl,
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, new RegExp(token));
  assert.doesNotMatch(result.stdout, /user:password/);
  assert.match(result.stdout, /\[REDACTED\]/);
  assert.match(result.stdout, /\[REDACTED_DATABASE_URL\]/);
});
