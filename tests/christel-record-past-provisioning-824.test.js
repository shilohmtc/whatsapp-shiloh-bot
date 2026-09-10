'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  RECORD_PAST,
  withoutRecordPast,
  snapshot,
  validateRow,
} = require('../src/services/christelRecordPastProvisioning824');

test('#824 validation requires one active staff-linked Christel principal with appointment:create', () => {
  const row = {
    id: 2,
    staff_id: 9,
    admin_active: true,
    staff_status: 'active',
    business_role: 'owner',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    staff_scope: '',
    permissions: { 'appointment:create': true, 'appointment:view': true },
  };
  assert.deepEqual(validateRow(row).reasons, []);
  assert.equal(validateRow({ ...row, admin_active: false }).safe, false);
  assert.equal(validateRow({ ...row, permissions: { 'appointment:view': true } }).safe, false);
});

test('#824 target mutation can preserve every non-target permission exactly', () => {
  const before = {
    'appointment:create': true,
    'appointment:view': true,
    'calendar:booking:cancel': true,
    'some:condition': [7, 8],
  };
  const after = { ...before, [RECORD_PAST]: true };
  assert.deepEqual(withoutRecordPast(after), withoutRecordPast(before));
  const beforeSnapshot = snapshot({ id: 2, staff_id: 9, admin_active: true, staff_status: 'active', permissions: before });
  const afterSnapshot = snapshot({ id: 2, staff_id: 9, admin_active: true, staff_status: 'active', permissions: after });
  assert.equal(beforeSnapshot.recordPast, false);
  assert.equal(afterSnapshot.recordPast, true);
  assert.equal(beforeSnapshot.otherPermissionsDigest, afterSnapshot.otherPermissionsDigest);
});
