const test = require('node:test');
const assert = require('node:assert/strict');

const { isNavigationEscape } = require('../src/services/adminMobileBookingFlow');

test('active admin booking can escape to Admin from all supported global navigation inputs', () => {
  for (const input of [
    'Menu',
    'home',
    'admin',
    'admin menu',
    'Hi',
    'hello',
    'hey!',
    'howzit',
    'hiya',
    'good morning',
    'good afternoon',
    'good evening',
  ]) {
    assert.equal(isNavigationEscape(input), true, `${input} should escape the active booking flow`);
  }
});

test('slot choices and arbitrary booking input are not mistaken for global navigation', () => {
  for (const input of [
    'admin_booking_slot:0',
    'admin_booking_page:1',
    '13:30',
    '20 Aug',
    'Friday',
    'Juvan',
    'anything else',
  ]) {
    assert.equal(isNavigationEscape(input), false, `${input} should remain inside the active booking flow`);
  }
});
