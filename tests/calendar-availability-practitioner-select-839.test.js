'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calendarAvailabilityPractitionerSelectClientScript,
} = require('../src/presentation/calendarAvailabilityPractitionerSelectUx');

test('#839 practitioner selector client is valid JavaScript and bounded to rendered availability authority', () => {
  const client = calendarAvailabilityPractitionerSelectClientScript();
  assert.doesNotThrow(() => new Function(client));
  assert.match(client, /data-calendar-operation=/);
  assert.match(client, /add-block/);
  assert.match(client, /add-leave/);
  assert.match(client, /data-date/);
  assert.match(client, /data-staff-id/);
  assert.match(client, /Practitioner/);
  assert.doesNotMatch(client, /\/staff\b|\/people\b|permission|capabilit/i);
});

test('#839 block and leave create submissions use the selected practitioner and canonical operation endpoints', () => {
  const client = calendarAvailabilityPractitionerSelectClientScript();
  assert.match(client, /practitionerStaffId/);
  assert.match(client, /staffId:selected/);
  assert.match(client, /create\('\/blocks'/);
  assert.match(client, /create\('\/leave'/);
  assert.match(client, /\/calendar\/staff-auth/);
  assert.match(client, /x-shiloh-csrf-token/);
  assert.match(client, /stopImmediatePropagation/);
});

test('#839 selector is create-only and edit availability keeps the existing canonical edit path', () => {
  const client = calendarAvailabilityPractitionerSelectClientScript();
  assert.match(client, /availabilityPractitionerCreate/);
  assert.match(client, /manage-block/);
  assert.match(client, /manage-leave/);
  assert.match(client, /clearSelector/);
  assert.doesNotMatch(client, /PATCH|DELETE/);
});
