const test = require('node:test');
const assert = require('node:assert/strict');

const {
  renderStaffCalendarAccessPage,
} = require('../src/presentation/staffCalendarAccessUx');
const {
  withAuthenticatorSetupGuidance,
  retireBrowserWhatsAppGuidance,
} = require('../src/routes/staffCalendarAccessUx');
const {
  renderStaffCalendarHandoffPage,
  staffCalendarHandoffClientScript,
} = require('../src/presentation/staffCalendarHandoffUx');

function decoratedAccessPage(reason = null) {
  const base = renderStaffCalendarAccessPage({
    reason,
    providerIndependentAuthEnabled: true,
  });
  return retireBrowserWhatsAppGuidance(withAuthenticatorSetupGuidance(base));
}

test('direct Workspace sign-in retires the redundant WhatsApp helper block', () => {
  const page = decoratedAccessPage();

  assert.match(page, /Direct browser sign-in/);
  assert.match(page, /Use your authenticator/);
  assert.match(page, /Use a recovery code/);
  assert.match(page, /Need to enroll an authenticator\?/);
  assert.match(page, /Staff-auth administrators: create enrollment link/);

  assert.doesNotMatch(page, /Easiest access/i);
  assert.doesNotMatch(page, /Open from Shiloh WhatsApp/i);
  assert.doesNotMatch(page, /data-shiloh-whatsapp-handoff-guidance/);
  assert.doesNotMatch(page, /send <code>calendar<\/code>/i);
  assert.doesNotMatch(page, /Authenticator and recovery credentials stay outside WhatsApp/i);
  assert.doesNotMatch(page, /open Workspace from your existing Shiloh WhatsApp conversation/i);

  assert.match(page, /data-shiloh-status data-state="ready"><\/div>/);
  assert.match(page, /\[data-shiloh-status\]:empty\{display:none\}/);
});

test('stale-session landing no longer renders a persistent red warning below direct sign-in', () => {
  const page = decoratedAccessPage('session');

  assert.doesNotMatch(page, /Your staff session is missing, expired, or revoked/);
  assert.match(page, /data-shiloh-status data-state="session-ended"><\/div>/);
  assert.match(page, /\[data-shiloh-status\]:empty\{display:none\}/);
});

test('actual WhatsApp one-time Workspace handoff remains a separate unchanged surface', () => {
  const handoffPage = renderStaffCalendarHandoffPage();
  const handoffClient = staffCalendarHandoffClientScript();

  assert.match(handoffPage, /Shiloh Workspace/);
  assert.match(handoffClient, /calendar-handoff\/exchange/);
  assert.match(handoffClient, /Open Workspace/);
  assert.match(handoffClient, /window\.location\.replace/);
});
