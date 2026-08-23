const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  classifyCandidateAuthority,
  resolveVerifiedClientByWhatsApp,
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

test('imported appointment history no longer forces the clinic-verification dead end', () => {
  const result = classifyCandidateAuthority(candidate({ has_appointment_history: true }));
  assert.equal(result.status, 'claim_required');
  assert.equal(result.reason, 'imported_contact_unverified');
});

test('non-imported historical client without explicit evidence remains fail-closed', () => {
  const result = classifyCandidateAuthority(candidate({
    source: 'whatsapp_onboarding',
    has_appointment_history: true,
  }));
  assert.equal(result.status, 'historical_unverified');
  assert.equal(result.reason, 'history_without_explicit_verification');
});

test('verified imported historical client remains verified and is not forced to register again', () => {
  const result = classifyCandidateAuthority(candidate({ has_appointment_history: true }), {
    verification: {
      id: 10,
      verification_method: 'imported_claim_registration',
      verified_at: '2026-08-23T10:00:00Z',
    },
  });
  assert.equal(result.status, 'verified_client');
  assert.equal(result.verificationMethod, 'imported_claim_registration');
});

test('multiple active exact-phone candidates remain ambiguous before any claim flow', async () => {
  const db = {
    async query() {
      return {
        rowCount: 2,
        rows: [
          {
            ...candidate({ id: 101 }),
            contact_id: 501,
            contact_type: 'mobile',
            normalized_value: '27820000001',
          },
          {
            ...candidate({ id: 202 }),
            contact_id: 502,
            contact_type: 'mobile',
            normalized_value: '27820000001',
          },
        ],
      };
    },
  };
  const result = await resolveVerifiedClientByWhatsApp('27820000001', db);
  assert.equal(result.status, 'ambiguous');
  assert.equal(result.reason, 'multiple_active_clients_for_exact_phone');
  assert.equal(result.clients.length, 2);
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

test('fresh imported registration reuses the canonical client and preserves provenance and appointments', () => {
  const onboarding = source('src/services/clientIdentityOnboarding.js');
  assert.match(onboarding, /let clientId = session\.client_id/);
  assert.match(onboarding, /SELECT id,source FROM clients WHERE id=\$1 AND status='active' FOR UPDATE/);
  assert.match(onboarding, /clientSource = lockedClient\.rows\[0\]\.source/);
  assert.match(onboarding, /UPDATE clients SET display_name=\$2,date_of_birth=\$3::date,custom_attributes=.*jsonb_build_object\('gender',\$4::text\).*WHERE id=\$1/s);
  assert.match(onboarding, /else \{\s*const created = await db\.query\(`INSERT INTO clients/s);
  assert.doesNotMatch(onboarding, /UPDATE clients SET[^`]*source\s*=/s);
  assert.doesNotMatch(onboarding, /(?:UPDATE|DELETE FROM) appointments/i);
  assert.match(onboarding, /verificationMethod = clientSource === "goldie_import" \? "imported_claim_registration" : "whatsapp_registration"/);
});

test('fresh imported registration writes explicit verification evidence on the retained client', () => {
  const onboarding = source('src/services/clientIdentityOnboarding.js');
  assert.match(onboarding, /INSERT INTO client_identity_verifications \(client_id,client_contact_id,verification_method,status,verified_at,evidence_reference\)/);
  assert.match(onboarding, /\[clientId, contactId, verificationMethod/);
  assert.match(onboarding, /client\.identity_verified/);
  assert.match(onboarding, /UPDATE client_onboarding_sessions SET client_id=\$2,state='complete',authority_version=\$3/);
});

test('same-client exact-phone completion cannot silently create or steal another active identity', () => {
  const onboarding = source('src/services/clientIdentityOnboarding.js');
  assert.match(onboarding, /SELECT id,client_id,contact_type FROM client_contacts WHERE normalized_value=\$1 AND contact_type IN \('whatsapp','mobile'\)[\s\S]*FOR UPDATE/);
  assert.match(onboarding, /contacts\.rows\.some\(\(row\) => String\(row\.client_id\) !== String\(clientId\)\)/);
  assert.match(onboarding, /AMBIGUOUS_CONTACT/);
  assert.match(onboarding, /if \(clientId\)[\s\S]*UPDATE clients[\s\S]*else \{[\s\S]*INSERT INTO clients/);
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