const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  temporarySessionTtlHours,
  DEFAULT_TEMPORARY_SESSION_TTL_HOURS,
  MAX_TEMPORARY_SESSION_TTL_HOURS,
} = require("../src/services/temporarySessionRetention");

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

test("temporary registration session retention is short and bounded", () => {
  assert.equal(DEFAULT_TEMPORARY_SESSION_TTL_HOURS, 2);
  assert.equal(temporarySessionTtlHours(undefined), 2);
  assert.equal(temporarySessionTtlHours("4"), 4);
  assert.equal(temporarySessionTtlHours("0"), 1);
  assert.equal(temporarySessionTtlHours("999"), MAX_TEMPORARY_SESSION_TTL_HOURS);
  assert.equal(MAX_TEMPORARY_SESSION_TTL_HOURS, 24);
});

test("cleanup covers both onboarding and staff walk-in staging without client-table deletion", () => {
  const retention = source("src/services/temporarySessionRetention.js");
  assert.match(retention, /DELETE FROM client_onboarding_sessions/);
  assert.match(retention, /DELETE FROM walkin_registration_sessions/);
  assert.doesNotMatch(retention, /DELETE FROM clients\b/);
  assert.doesNotMatch(retention, /DELETE FROM client_contacts\b/);
  assert.match(retention, /setInterval\(cleanupTemporarySessions, CLEANUP_INTERVAL_MS\)/);
});

test("temporary cleanup scheduler is started with the production service", () => {
  const app = source("app.js");
  assert.match(app, /startTemporarySessionCleanupScheduler\(\)/);
});
