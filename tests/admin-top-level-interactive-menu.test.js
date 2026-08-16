const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const helperPath = path.join(__dirname, '..', 'src', 'services', 'adminInteractiveMenu.js');
const webhookPath = path.join(__dirname, '..', 'src', 'controllers', 'webhookController.js');
const source = fs.readFileSync(helperPath, 'utf8');
const webhook = fs.readFileSync(webhookPath, 'utf8');
const { actionForId, parseVisibleMenu, topLevelInteractive, sectionInteractive } = require(helperPath);

const christelMenu = `*Shiloh Admin 🌿*\nWelcome back, Christel 👋\n\nWhat would you like to do?\n\n*Appointments*\n1️⃣ Today's clients\n2️⃣ Tomorrow's clients\n3️⃣ Find an available time\n4️⃣ 🧪 Demo Client\n\n*Reports*\n5️⃣ Today's report\n6️⃣ 💰 Christel earnings\n7️⃣ 💰 Abigail earnings\n\n*Clients*\n8️⃣ Find a client\n9️⃣ Add a walk-in\n\n*Services*\n10️⃣ Staff services\n11️⃣ Services & pricing\n\n*Schedule*\n12️⃣ Schedule management\n\n*More*\n13️⃣ 🛡️ Calendar integrity\n14️⃣ Help\n\nUse the real *Appointments* or *Demo Client* buttons below, or reply with a number/option name.`;

const practitionerMenu = `*Shiloh Admin 🌿*\nWelcome back, Abigail 👋\nPractitioner access — your diary and assigned client work only.\n\nWhat would you like to do?\n\n*Appointments*\n1️⃣ My clients today\n2️⃣ My clients tomorrow\n3️⃣ Find an available time\n\n*Reports*\n4️⃣ My report today\n\n*Clients*\n5️⃣ Find my client\n\n*Services*\n6️⃣ My services\n\n*More*\n7️⃣ Help\n\nUse the real *Appointments* button below for appointment actions, or reply with a number/option name.`;

test('top-level Admin UI exposes only polished operational sections', () => {
  const interactive = topLevelInteractive(christelMenu);
  assert.equal(interactive.type, 'list');
  assert.deepEqual(interactive.rows.map((row) => row.id), [
    'admin_section_appointments',
    'admin_section_reports',
    'admin_section_services',
    'admin_section_schedule',
    'admin_section_more',
  ]);
  assert.doesNotMatch(interactive.body, /\d+️⃣/u);
  assert.match(interactive.body, /Choose a section below\./);
});

test('client lookup is secondary under More while Help and diagnostics stay hidden', () => {
  const sections = parseVisibleMenu(practitionerMenu);
  const report = sectionInteractive('Reports', practitionerMenu);
  const more = sectionInteractive('More', practitionerMenu);
  assert.deepEqual(report.rows.map((row) => row.id), ['admin_action_today_report', 'menu']);
  assert.deepEqual(more.rows.map((row) => row.id), ['admin_action_client', 'menu']);
  assert.equal(sections.get('Reports').length, 1);
  assert.equal(sections.get('More').length, 1); // raw legacy menu still contains Help; presentation filters it.
  assert.equal(more.rows[0].title, 'Client details');
  assert.ok(!source.includes('Savanna'));
  assert.ok(!source.includes('Pieter'));
});

test('Reports collapses individual earnings entries into a role-aware Earnings action', () => {
  const report = sectionInteractive('Reports', christelMenu);
  assert.deepEqual(report.rows.map((row) => row.id), ['admin_action_today_report', 'admin_action_earnings', 'menu']);
});

test('every advertised stable action ID maps to an explicit guarded command', () => {
  const sections = parseVisibleMenu(christelMenu);
  for (const entries of sections.values()) {
    for (const { action } of entries) {
      const resolved = actionForId(`admin_action_${action.key}`);
      assert.ok(resolved, `missing action mapping for ${action.key}`);
      assert.ok(resolved.command, `missing guarded command for ${action.key}`);
    }
  }
  assert.equal(actionForId('admin_action_unknown'), null);
});

test('webhook uses the interactive adapter before appointment/admin fallthrough handlers', () => {
  assert.match(webhook, /require\("\.\.\/services\/adminInteractiveMenu"\)/);
  const mobile = webhook.indexOf('processAdminInteractiveMenuMessage(from,text)');
  const appointments = webhook.indexOf('processAdminAppointmentsByDateMessage(from,text)');
  const assistant = webhook.indexOf('processAdminAssistantMessage(from,text)');
  assert.ok(mobile >= 0 && appointments >= 0 && assistant >= 0);
  assert.ok(mobile < appointments);
  assert.ok(appointments < assistant);
});
