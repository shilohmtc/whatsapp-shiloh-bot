const test = require("node:test");
const assert = require("node:assert/strict");

const { buildProfileContext } = require("../src/services/orchestrator");

test("general AI context excludes opaque custom attributes", () => {
  const context = buildProfileContext({
    name: "Synthetic Client",
    preferred_language: "English",
    location: "Test Location",
    preferences: { general: "quiet appointments" },
    customer_status: "active",
    tags: ["synthetic"],
    custom_attributes: {
      medical_note: "SENSITIVE_SENTINEL",
      internal_risk_flag: "OPAQUE_SENTINEL",
    },
  });

  assert.match(context, /Name: Synthetic Client/);
  assert.match(context, /Preference - general: quiet appointments/);
  assert.doesNotMatch(context, /SENSITIVE_SENTINEL/);
  assert.doesNotMatch(context, /OPAQUE_SENTINEL/);
  assert.doesNotMatch(context, /medical_note/);
  assert.doesNotMatch(context, /internal_risk_flag/);
});
