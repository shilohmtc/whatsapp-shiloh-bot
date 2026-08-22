const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  classifyCandidateAuthority,
} = require('../src/services/clientVerifiedIdentity');

function candidate(overrides = {}) {
  return {
    id: 101,
    source: 'goldie_import',
    has_appointment_history: false,
    registration_status: null,
    profile_incomplete: null,
    verified_at: null,
    ...overrides,
  };
}

function source(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

test('genuinely verified canonical client requires explicit verification evidence', () => {
  const result = classifyCandidateAuthority(candidate({ source: 'whatsapp_onboarding' }), {
    verification: { id: 9, verification_method: 'whatsapp_registration', verified_at: '2026-08-22T10:00:00Z' },
  });
  assert.equal(result.status, 'verified_client');
  assert.equal(result.verificationMethod, 'whatsapp_registration');
});

test('imported-contact-only exact-phone candidate is claimable but unverified', () => {
  const result = classifyCandidateAuthority(candidate());
  assert.equal(result.status, 'claim_required');
  assert.equal(result.reason, 'imported_contact_unverified');
});

test('verified_at proxy alone is insufficient identity authority', () => {
  const result = classifyCandidateAuthority(candidate({ verified_at: '2026-08-16T00:00:00Z' }));
  assert.equal(result.status, 'claim_required');
});

test('imported appointment history is preserved as a fail-closed historical state, not identity proof', () => {
  const result = classifyCandidateAuthority(candidate({ has_appointment_history: true }));
  assert.equal(result.status, 'historical_unverified');
});

test('provisional client remains unverified until explicit evidence exists', () => {
  const result = classifyCandidateAuthority(candidate({ source: 'admin_provisional_booking', registration_status: 'provisional' }));
  assert.equal(result.status, 'provisional');
});

test('controlled Juvan binding remains an accepted independent explicit authority', () => {
  const result = classifyCandidateAuthority(candidate({ id: 77, source: 'whatsapp_demo' }), {
    controlled: { status: 'bound', client: { id: 77 } },
  });
  assert.equal(result.status, 'verified_client');
  assert.equal(result.verificationMethod, 'controlled_demo_binding');
});

test('controlled Juvan drift/conflict fails closed', () => {
  const result = classifyCandidateAuthority(candidate({ id: 77 }), {
    controlled: { status: 'identity_conflict', client: { id: 77 } },
  });
  assert.equal(result.status, 'manual_review');
});

test('imported label matching can no longer promote or verify a client', () => {
  const guard = source('src/services/identityOnboardingGuard.js');
  assert.doesNotMatch(guard, /persistVerifiedWhatsAppClaim/);
  assert.doesNotMatch(guard, /pending_name\s*=\s*\$3/);
  assert.match(guard, /MUST NOT be used to verify, claim or link a client/);
});

test('imported DOB and gender are not seeded into a fresh authority-version claim session', () => {
  const onboarding = source('src/services/clientIdentityOnboarding.js');
  assert.match(onboarding, /pendingName:\s*null/);
  assert.match(onboarding, /pendingDateOfBirth:\s*null/);
  assert.match(onboarding, /pendingGender:\s*null/);
  assert.doesNotMatch(onboarding, /pendingDateOfBirth:\s*known\?\.date_of_birth/);
  assert.doesNotMatch(onboarding, /pendingGender:\s*known\?\.gender/);
});

test('Booking/Admin gate and final commit inherit the same centralized resolver authority', () => {
  const onboarding = source('src/services/clientIdentityOnboarding.js');
  const gate = source('src/services/clientBookingIdentityGate.js');
  const commit = source('src/services/clientBookingCommit.js');
  assert.match(onboarding, /resolveVerifiedClientByWhatsApp/);
  assert.match(onboarding, /status:\s*"unique",\s*authorityStatus:\s*"verified_client"/);
  assert.match(gate, /resolveClientByWhatsApp/);
  assert.match(commit, /resolveClientByWhatsApp/);
});

test('exact-phone conflict protection remains fail closed during onboarding completion', () => {
  const onboarding = source('src/services/clientIdentityOnboarding.js');
  assert.match(onboarding, /contacts\.rows\.some\(\(row\) => String\(row\.client_id\) !== String\(clientId\)\)/);
  assert.match(onboarding, /AMBIGUOUS_CONTACT/);
});

test('forward migration 074 is latest, has no trust backfill, and records durable evidence schema', () => {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  assert.equal(files.at(-1), '074_client_identity_verification_authority.sql');
  const migration = source('migrations/074_client_identity_verification_authority.sql');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS client_identity_verifications/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS authority_version/);
  assert.doesNotMatch(migration, /INSERT\s+INTO\s+client_identity_verifications/i);
  assert.doesNotMatch(migration, /UPDATE\s+clients\s+SET/i);
});

test('production start verifies migration 074 before app startup', () => {
  const pkg = JSON.parse(source('package.json'));
  assert.match(pkg.scripts.start, /^node scripts\/ensure-client-identity-verification\.js && node /);
  const bootstrap = source('scripts/ensure-client-identity-verification.js');
  assert.match(bootstrap, /074_client_identity_verification_authority\.sql/);
  assert.match(bootstrap, /checksumVerified/);
});
