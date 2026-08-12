const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src/services/adminClientDemo.js'), 'utf8');

test('demo client tagging explicitly types PostgreSQL jsonb parameters', () => {
  assert.match(source, /jsonb_build_object\('demo_admin_id',\$2::text,'demo_owner',\$3::text,'demo_only',true\)/);
  assert.doesNotMatch(source, /'demo_owner',\$3,'demo_only'/);
});

test('completed demo onboarding tags the canonical demo client before booking continues', () => {
  assert.match(source, /if \(identity\.onboardingComplete && identity\.client\?\.id\)/);
  assert.match(source, /await tagDemoClient\(admin, session, identity\.client\.id\)/);
  assert.match(source, /if \(identity\.resumeBooking\)/);
});
