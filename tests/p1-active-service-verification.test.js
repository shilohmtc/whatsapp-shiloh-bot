const test = require("node:test");
const assert = require("node:assert/strict");
const { matchActiveServiceName } = require("../src/services/bookingIntent");

const active = [
  "Full Body Swedish",
  "Hot Stone Massage",
  "Targeted Area-Specific Sports Massage",
  "Medi-Heel No Gel",
  "Medi-Heel With Gel",
  "Clarity Facial (Blackheads, Whiteheads & Acne)",
];

test("active CRM services and safe aliases resolve uniquely", () => {
  assert.equal(matchActiveServiceName("swedish massage", active).name, "Full Body Swedish");
  assert.equal(matchActiveServiceName("hot stone", active).name, "Hot Stone Massage");
  assert.equal(matchActiveServiceName("Targeted Area-Specific Sports Massage", active).matched, true);
});

test("retired Goldie-only services do not validate against active CRM", () => {
  for (const legacy of ["Toe Gel Application", "Pressotherapy Single Session", "Waxing"]) {
    const result = matchActiveServiceName(legacy, active);
    assert.equal(result.matched, false, legacy);
    assert.equal(result.reason, "not_active_in_crm", legacy);
  }
});

test("ambiguous generic service text fails closed", () => {
  const result = matchActiveServiceName("Medi-Heel", active);
  assert.equal(result.matched, false);
  assert.equal(result.reason, "ambiguous_active_crm_match");
});
