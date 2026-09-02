const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('production startup does not preload retired #643 Meta reconnect or WABA audit hooks', () => {
  const pkg = JSON.parse(read('package.json'));
  const start = String(pkg.scripts?.start || '');
  assert.doesNotMatch(start, /metaProviderReconnectBootstrap/);
  assert.doesNotMatch(start, /metaWabaTemplatePermissionAuditBootstrap/);
  assert.match(start, /^node scripts\/verify-migrations\.js && /);
});

test('retired browser pilot authority variables stay absent from current Calendar authority', () => {
  const files = [
    'src/services/staffBrowserSession.js',
    'src/routes/calendar.js',
    'src/services/calendarAuthorization.js',
  ].map(read).join('\n');
  assert.doesNotMatch(files, /SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED/);
  assert.doesNotMatch(files, /SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS/);
  assert.doesNotMatch(files, /SHILOH_EMERGENCY_CHRISTEL_CALENDAR_BOOKING_ENABLED/);
});

test('legacy followup and reminder Meta contracts remain retired', () => {
  const source = read('src/services/shilohMessageContracts.js');
  assert.match(source, /appointment_followup_legacy:\s*'retired'/);
  assert.match(source, /appointment_reminder_legacy:\s*'retired'/);
});

test('provider-independent staff auth still owns the legacy-named TOTP rollout allowlist', () => {
  const source = read('src/services/providerIndependentStaffAuth.js');
  assert.match(source, /SHILOH_STAFF_TOTP_PILOT_ADMIN_IDS/);
  assert.match(source, /SHILOH_STAFF_TOTP_AUTH_ENABLED/);
  assert.match(source, /SHILOH_STAFF_TOTP_ENCRYPTION_KEYS_JSON/);
});
