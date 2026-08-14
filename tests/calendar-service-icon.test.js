const test = require('node:test');
const assert = require('node:assert/strict');
const { serviceIcon } = require('../src/services/googleBookingCalendar');

test('Medi-Heel pedicure with foot massage uses the foot icon', () => {
  assert.equal(serviceIcon('Medi-Heel Pedicure (With Gel Toes) & Foot Massage'), '🦶');
});

test('ordinary massage services keep the massage icon', () => {
  assert.equal(serviceIcon('Bamboo Sports Massage - Area Specific'), '💆');
  assert.equal(serviceIcon('Swedish Massage'), '💆');
});
