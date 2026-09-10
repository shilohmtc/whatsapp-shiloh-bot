'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { calendarOperationalMutationsClientScript } = require('../src/presentation/calendarOperationalMutationsUx');

test('#839 Block time and Leave create drawers expose an authorized practitioner selector', () => {
  const client = calendarOperationalMutationsClientScript();

  assert.match(client, /function availabilityTargets\(kind\)/);
  assert.match(client, /data-calendar-operation="add-block"/);
  assert.match(client, /data-calendar-operation="add-leave"/);
  assert.equal((client.match(/<select name="staffId" required><\/select>/g) || []).length, 2);
  assert.match(client, /field\.hidden=state\.mode!==['"]create['"]/);
  assert.match(client, /select\.disabled=state\.mode!==['"]create['"]/);
});

test('#839 create submits selected practitioner while edit keeps canonical practitioner fixed', () => {
  const client = calendarOperationalMutationsClientScript();

  assert.match(client, /var selectedStaffId=state\.mode===['"]create['"]\?Number\(form\.elements\.staffId\.value\):state\.staffId/);
  assert.match(client, /if\(state\.mode===['"]create['"]&&!Number\.isSafeInteger\(selectedStaffId\)\)return status\(['"]Choose a practitioner before saving\./);
  assert.match(client, /staffId:selectedStaffId/);
  assert.match(client, /if\(state\.mode===['"]edit['"]\)\{payload\.expectedRevision=state\.revision/);
  assert.match(client, /if\(state\.mode===['"]edit['"]\)\{leavePayload\.expectedRevision=state\.revision/);
});
