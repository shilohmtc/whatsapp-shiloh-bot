const test = require("node:test");
const assert = require("node:assert/strict");

const { buildProfileContext, isAllowedProfilePreference } = require("../src/services/orchestrator");

test("profile preference allowlist is exact and fail-closed", () => {
  assert.equal(isAllowedProfilePreference("favorite_practitioner"), true);
  assert.equal(isAllowedProfilePreference("favorite_therapist"), true);
  assert.equal(isAllowedProfilePreference("favorite_pressure"), true);

  assert.equal(isAllowedProfilePreference("general"), false);
  assert.equal(isAllowedProfilePreference("favorite_treatment"), false);
  assert.equal(isAllowedProfilePreference("favorite_service"), false);
  assert.equal(isAllowedProfilePreference("favorite_medication"), false);
  assert.equal(isAllowedProfilePreference("favorite_diagnosis"), false);
  assert.equal(isAllowedProfilePreference("favorite_pregnancy_status"), false);
  assert.equal(isAllowedProfilePreference("favorite_treatment_notes"), false);
  assert.equal(isAllowedProfilePreference("unknown_future_key"), false);
});

test("general AI profile context includes only explicitly allowlisted low-risk preferences", () => {
  const context = buildProfileContext({
    name: "Synthetic Client",
    preferences: {
      favorite_practitioner: "Synthetic Practitioner",
      favorite_pressure: "firm",
      general: "SENSITIVE_GENERAL_SENTINEL",
      favorite_treatment: "SENSITIVE_TREATMENT_SENTINEL",
      favorite_medication: "SENSITIVE_MEDICATION_SENTINEL",
      unknown_future_key: "SENSITIVE_UNKNOWN_SENTINEL",
    },
  });

  assert.match(context, /Name: Synthetic Client/);
  assert.match(context, /Preference - favorite_practitioner: Synthetic Practitioner/);
  assert.match(context, /Preference - favorite_pressure: firm/);

  assert.doesNotMatch(context, /SENSITIVE_GENERAL_SENTINEL/);
  assert.doesNotMatch(context, /SENSITIVE_TREATMENT_SENTINEL/);
  assert.doesNotMatch(context, /SENSITIVE_MEDICATION_SENTINEL/);
  assert.doesNotMatch(context, /SENSITIVE_UNKNOWN_SENTINEL/);
  assert.doesNotMatch(context, /favorite_treatment/);
  assert.doesNotMatch(context, /favorite_medication/);
  assert.doesNotMatch(context, /unknown_future_key/);
});
