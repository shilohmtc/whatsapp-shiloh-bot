const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFINITIONS, buildDefinition } = require('../src/services/clientLifecycleTemplateProvisioning');

test('follow-up v2 is part of the foreseeable lifecycle inventory', () => {
  assert.ok(DEFINITIONS.appointment_followup_actions);
  assert.equal(DEFINITIONS.appointment_followup_actions.name, 'shiloh_appointment_followup_v2');
  assert.equal(DEFINITIONS.appointment_followup_actions.env, 'WHATSAPP_FOLLOWUP_ACTIONS_TEMPLATE');
});

test('follow-up v2 is an English utility template with five rating quick replies', () => {
  const definition = buildDefinition('appointment_followup_actions');
  assert.equal(definition.name, 'shiloh_appointment_followup_v2');
  assert.equal(definition.language, 'en');
  assert.equal(definition.category, 'UTILITY');
  const buttons = definition.components.find((component) => component.type === 'BUTTONS');
  assert.deepEqual(buttons.buttons, [
    { type: 'QUICK_REPLY', text: '1' },
    { type: 'QUICK_REPLY', text: '2' },
    { type: 'QUICK_REPLY', text: '3' },
    { type: 'QUICK_REPLY', text: '4' },
    { type: 'QUICK_REPLY', text: '5' },
  ]);
});
