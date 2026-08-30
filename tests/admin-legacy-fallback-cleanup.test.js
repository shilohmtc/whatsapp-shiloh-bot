const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  isLegacyAdminFallback,
  modernizeLegacyAdminFallback,
} = require('../src/bootstrap/adminUxStandardizationPatch');

test('legacy unrecognized Admin fallback no longer exposes raw command syntax', () => {
  const result = modernizeLegacyAdminFallback({
    handled: true,
    isAdmin: true,
    admin: { display_name: 'Christel' },
    reply: [
      "Admin mode is active, Christel. I don't have that admin command connected yet.",
      '',
      'Welcome back, Christel 👋',
      '• Check availability STAFF | SERVICE | DD/MM/YYYY HH:MM — conflict check',
      '• Book client CRM_ID | STAFF | SERVICE | DD/MM/YYYY HH:MM — prepare a guarded booking',
      '• Delete client CRM_ID — archive an authorized client record',
    ].join('\n'),
  });

  assert.equal(isLegacyAdminFallback(result), false);
  assert.equal(result.reply, "I didn't recognise that admin request. Send *Menu* to open Shiloh Admin.");
  assert.doesNotMatch(result.reply, /CRM_ID|CONFIRM BOOKING|working hours STAFF|Check availability STAFF/i);
});

test('guarded Admin command replies are left unchanged', () => {
  const original = {
    handled: true,
    isAdmin: true,
    reply: 'Pending admin booking cancelled. No appointment was created.',
  };
  assert.equal(isLegacyAdminFallback(original), false);
  assert.equal(modernizeLegacyAdminFallback(original), original);
});

test('retirement routing replaces active mobile booking and legacy Assistant fallbacks', () => {
  const controller = fs.readFileSync(path.join(__dirname, '..', 'src', 'controllers', 'webhookController.js'), 'utf8');
  const retired = controller.indexOf('processAdminRetiredAuthorityMessage(from,text)');
  const retained = controller.indexOf('processAdminInteractiveMenuMessage(from,text)');
  assert.ok(retired >= 0 && retained > retired);
  assert.doesNotMatch(controller, /processAdminMobileBookingFlowMessage|processAdminAssistantMessage/);
});

test('startup preloads the fallback cleanup patch before app.js captures the Admin assistant export', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  for (const scriptName of ['start', 'dev']) {
    const script = pkg.scripts[scriptName];
    assert.ok(script.includes('./src/bootstrap/adminUxStandardizationPatch.js'), `${scriptName} must preload the Admin UX patch`);
    assert.ok(script.trim().endsWith('app.js') || script.includes(' app.js'), `${scriptName} must load app.js after preloads`);
  }
});
