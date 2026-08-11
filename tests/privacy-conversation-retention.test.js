const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  normalizeSessionTtlHours,
  isSessionFresh,
  DEFAULT_SESSION_TTL_HOURS,
  MAX_SESSION_TTL_HOURS,
} = require("../src/services/memory");

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

test("conversation session TTL is short, bounded and fail-closed", () => {
  assert.equal(DEFAULT_SESSION_TTL_HOURS, 24);
  assert.equal(normalizeSessionTtlHours(undefined), 24);
  assert.equal(normalizeSessionTtlHours("6"), 6);
  assert.equal(normalizeSessionTtlHours("0"), 1);
  assert.equal(normalizeSessionTtlHours("999"), MAX_SESSION_TTL_HOURS);
  assert.equal(MAX_SESSION_TTL_HOURS, 168);
});

test("stale OpenAI response mappings are not reusable", () => {
  const now = Date.parse("2026-08-11T12:00:00Z");
  assert.equal(isSessionFresh("2026-08-11T11:30:00Z", now, 24), true);
  assert.equal(isSessionFresh("2026-08-10T11:59:59Z", now, 24), false);
  assert.equal(isSessionFresh("not-a-date", now, 24), false);
});

test("runtime deletes expired mappings and runs periodic aggregate cleanup", () => {
  const memory = source("src/services/memory.js");
  const app = source("app.js");

  assert.match(memory, /DELETE FROM conversation_sessions WHERE phone = \$1/);
  assert.match(memory, /WHERE updated_at < NOW\(\) - make_interval\(hours => \$1::int\)/);
  assert.match(memory, /setInterval\(cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL_MS\)/);
  assert.match(app, /startConversationSessionCleanupScheduler\(\)/);
});
