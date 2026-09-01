const test = require('node:test');
const assert = require('node:assert/strict');

const { workspaceStaffManageClientScript } = require('../src/presentation/workspaceStaffUx');

function assertSerializedBeforeDisabled(script, formName) {
  const listener = script.indexOf(`var ${formName}=one('[data-staff-${formName}-form]')`);
  assert.notEqual(listener, -1, `${formName} submit listener must exist`);

  const serialized = script.indexOf(`var f=new FormData(${formName})`, listener);
  const disabled = script.indexOf(`busy(${formName},true)`, listener);

  assert.notEqual(serialized, -1, `${formName} form must be serialized`);
  assert.notEqual(disabled, -1, `${formName} form must be disabled while submitting`);
  assert.ok(
    serialized < disabled,
    `${formName} form controls must be serialized before they are disabled because disabled controls are omitted from FormData`
  );
}

test('Staff create and edit serialize enabled controls before disabling them', () => {
  const script = workspaceStaffManageClientScript();
  assertSerializedBeforeDisabled(script, 'create');
  assertSerializedBeforeDisabled(script, 'edit');
});
