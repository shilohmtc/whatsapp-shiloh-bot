const test = require('node:test');
const assert = require('node:assert/strict');

const {
  firstName,
  canCreateAppointments,
  isChristelOrAbigail,
} = require('../src/bootstrap/adminBookingCrossConfirmPatch');

test('cross-confirm identity guard recognizes only Christel and Abigail', () => {
  assert.equal(firstName('Christel Botha'), 'christel');
  assert.equal(firstName(' Abigail '), 'abigail');
  assert.equal(isChristelOrAbigail({ display_name: 'Christel Botha' }), true);
  assert.equal(isChristelOrAbigail({ display_name: 'Abigail' }), true);
  assert.equal(isChristelOrAbigail({ display_name: 'Jean-Pierre' }), false);
});

test('cross-confirm requires appointment:create permission', () => {
  assert.equal(canCreateAppointments({ permissions: { 'appointment:create': true } }), true);
  assert.equal(canCreateAppointments({ permissions: { 'appointment:create': false } }), false);
  assert.equal(canCreateAppointments({ permissions: {} }), false);
  assert.equal(canCreateAppointments(null), false);
});

test('cross-confirm pair guard does not broaden authorization by similar names', () => {
  assert.equal(isChristelOrAbigail({ display_name: 'Christelle' }), false);
  assert.equal(isChristelOrAbigail({ display_name: 'Abigail-Rose' }), false);
  assert.equal(isChristelOrAbigail({ display_name: 'Abigail Smith' }), true);
});
