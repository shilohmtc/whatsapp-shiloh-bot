const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFINITIONS,
  buildDefinition,
} = require('../src/services/clientLifecycleTemplateProvisioning');

test('lifecycle package defines reminder, reschedule and cancellation templates', () => {
  assert.deepEqual(Object.keys(DEFINITIONS), [
    'reminder_actions',
    'reschedule_confirmation',
    'cancellation_confirmation',
  ]);
});

test('all lifecycle definitions are English utility templates', () => {
  for (const key of Object.keys(DEFINITIONS)) {
    const definition = buildDefinition(key);
    assert.equal(definition.language, 'en');
    assert.equal(definition.category, 'UTILITY');
    assert.match(definition.name, /^shiloh_/);
    assert.ok(definition.components.some((component) => component.type === 'BODY'));
  }
});

test('reminder actions template preserves reschedule and cancellation quick replies', () => {
  const definition = buildDefinition('reminder_actions');
  const buttons = definition.components.find((component) => component.type === 'BUTTONS');
  assert.deepEqual(buttons.buttons, [
    { type: 'QUICK_REPLY', text: 'Reschedule' },
    { type: 'QUICK_REPLY', text: 'Cancel booking' },
  ]);
});

test('unknown lifecycle template fails closed', () => {
  assert.throws(() => buildDefinition('unknown'), /Unknown lifecycle template/);
});
