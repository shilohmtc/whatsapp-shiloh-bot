const test = require('node:test');
const assert = require('node:assert/strict');

const {
  renderStaffCalendarAccessPage,
  staffCalendarAccessClientScript,
} = require('../src/presentation/staffCalendarAccessUx');

test('Workspace sign-in presents normal South African local mobile format without a visible +27 requirement', () => {
  const html = renderStaffCalendarAccessPage({ providerIndependentAuthEnabled: true });

  assert.match(html, /placeholder="e\.g\. 082 123 4567"/);
  assert.equal((html.match(/placeholder="e\.g\. 082 123 4567"/g) || []).length, 2);
  assert.doesNotMatch(html, /placeholder="[^"]*\+27/);
});

test('browser sign-in converts only a ten-digit local 0-prefix staff number to canonical 27 format before TOTP or recovery submission', () => {
  const client = staffCalendarAccessClientScript();

  assert.match(client, /function normalizeStaffAccountNumber\(value\)/);
  assert.match(client, /if\(\/\^0\\d\{9\}\$\/\.test\(digits\)\)return '27'\+digits\.slice\(1\)/);
  assert.match(client, /var identifier=normalizeStaffAccountNumber\(\(select\('#staff-totp-whatsapp'\)\|\|\{\}\)\.value\|\|''\)/);
  assert.match(client, /var identifier=normalizeStaffAccountNumber\(\(select\('#staff-recovery-whatsapp'\)\|\|\{\}\)\.value\|\|''\)/);
  assert.match(client, /return raw;/);
  assert.doesNotThrow(() => new Function(client));
});
