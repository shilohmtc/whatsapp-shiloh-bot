const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  crmV2RegistrationRequiresContinuation,
} = require('../src/services/clientIdentityOnboarding');

const onboardingSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'services', 'clientIdentityOnboarding.js'),
  'utf8'
);

test('CRM V2 registered profile is the terminal onboarding authority', () => {
  assert.equal(
    crmV2RegistrationRequiresContinuation(
      { state: 'complete' },
      { profileStatus: 'minimal' }
    ),
    true,
    'a stale complete onboarding row must resume when the canonical CRM V2 profile is not registered'
  );

  assert.equal(
    crmV2RegistrationRequiresContinuation(
      { state: 'complete' },
      { profileStatus: 'registered' }
    ),
    false,
    'a complete onboarding row may be terminal only when the canonical CRM V2 profile is registered'
  );

  assert.equal(
    crmV2RegistrationRequiresContinuation(
      { state: 'collect_name' },
      { profileStatus: 'registered' }
    ),
    true,
    'an incomplete onboarding row must still continue even if the linked CRM V2 profile is registered'
  );
});

test('current CRM V2 session resumes poisoned complete state before pass-through routing', () => {
  assert.match(
    onboardingSource,
    /if \(revalidated\.status === "crm_v2_current"\) \{\s*if \(crmV2RegistrationRequiresContinuation\(existingSession, revalidated\.client\)\) \{\s*return processActiveSession\(phone, text, existingSession\);/s
  );
});
