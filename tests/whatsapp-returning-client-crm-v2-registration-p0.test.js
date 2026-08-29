const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  AUTHORITY_VERSION,
  manualReviewIdentity,
  verifiedLegacyClient,
} = require('../src/services/clientIdentityOnboarding');

const ROOT = path.resolve(__dirname, '..');
const source = () => fs.readFileSync(path.join(ROOT, 'src/services/clientIdentityOnboarding.js'), 'utf8');

test('historical/imported/provisional matches are discovery evidence, not legacy identity authority', () => {
  assert.equal(manualReviewIdentity({ status: 'historical_unverified' }), false);
  assert.equal(manualReviewIdentity({ status: 'claim_required' }), false);
  assert.equal(manualReviewIdentity({ status: 'provisional' }), false);
  assert.equal(manualReviewIdentity({ status: 'unverified_client' }), false);

  assert.equal(verifiedLegacyClient({ status: 'historical_unverified', client: { id: 10 } }), null);
  assert.equal(verifiedLegacyClient({ status: 'claim_required', client: { id: 11 } }), null);
  assert.equal(verifiedLegacyClient({ status: 'provisional', client: { id: 12 } }), null);
  assert.equal(verifiedLegacyClient({ status: 'unverified_client', client: { id: 13 } }), null);
});

test('only explicitly verified legacy authority can retain a legacy onboarding client id', () => {
  const client = { id: 99 };
  assert.equal(verifiedLegacyClient({ status: 'verified_client', client }), client);
  assert.equal(verifiedLegacyClient({ status: 'verified_client', client: null }), null);
  assert.equal(manualReviewIdentity({ status: 'ambiguous' }), true);
  assert.equal(manualReviewIdentity({ status: 'manual_review' }), true);
});

test('authority version invalidates stale legacy-bound onboarding sessions for clean CRM V2 registration', () => {
  assert.equal(AUTHORITY_VERSION, 'verified_client_v3_crm_v2_fresh_registration');
  const onboarding = source();
  const resetStart = onboarding.indexOf('async function resetSessionForCurrentAuthority');
  const processStart = onboarding.indexOf('async function processClientIdentityMessage', resetStart);
  const resetBlock = onboarding.slice(resetStart, processStart);

  assert.match(resetBlock, /const verifiedClient = verifiedLegacyClient\(identity\)/);
  assert.match(resetBlock, /clientId: null/);
  assert.match(resetBlock, /crmV2ClientId: null/);
  assert.match(resetBlock, /identityModel: null/);
  assert.match(resetBlock, /state: "collect_name"/);
});

test('unverified returning clients receive ordinary registration instead of clinic-contact dead end or legacy linking', () => {
  const onboarding = source();
  assert.match(onboarding, /\["claim_required", "provisional", "unverified_client", "historical_unverified"\]\.includes\(identity\.status\)/);
  assert.match(onboarding, /identityStatus: "registration_required", client: null/);
  assert.doesNotMatch(onboarding, /Please complete registration afresh so I can safely link this WhatsApp number/);
  assert.match(onboarding, /const known = verifiedLegacyClient\(identity\)/);
  assert.match(onboarding, /identityModel: known \? IDENTITY_MODELS\.LEGACY : null/);
});

test('ambiguity and explicit manual-review conflicts remain fail closed', () => {
  const onboarding = source();
  assert.match(onboarding, /if \(manualReviewIdentity\(identity\)\)/);
  assert.match(onboarding, /identity\.status === "ambiguous" \? IDENTITY_CONFLICT_REPLY : HUMAN_VERIFICATION_REPLY/);
  assert.match(onboarding, /crmV2Authority\.status === "conflict"/);
  assert.match(onboarding, /reply: IDENTITY_CONFLICT_REPLY/);
});
