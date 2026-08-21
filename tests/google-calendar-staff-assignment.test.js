const test = require('node:test');
const assert = require('node:assert/strict');

const { eventAppliesToStaff } = require('../src/services/googleBookingCalendar');

test('private Shiloh staff metadata remains authoritative', () => {
  const event = {
    summary: 'Full Body Swedish — Linda — Abigail',
    description: 'Practitioner: Christel',
    extendedProperties: { private: { shilohStaffName: 'Abigail' } },
  };

  assert.equal(eventAppliesToStaff(event, 'Abigail'), true);
  assert.equal(eventAppliesToStaff(event, 'Christel'), false);
});

test('manual Practitioner assignment does not become a clinic-wide block', () => {
  const event = {
    summary: 'Client appointment',
    description: 'Client: Linda\nPractitioner: Abigail\nService: Massage',
  };

  assert.equal(eventAppliesToStaff(event, 'Abigail'), true);
  assert.equal(eventAppliesToStaff(event, 'Christel'), false);
});

test('existing Staff assignment remains practitioner-specific', () => {
  const event = {
    summary: 'Client appointment',
    description: 'Staff: Marietjie',
  };

  assert.equal(eventAppliesToStaff(event, 'Marietjie'), true);
  assert.equal(eventAppliesToStaff(event, 'Christel'), false);
});

test('multi-practitioner manual assignment applies to every named practitioner', () => {
  const event = {
    summary: 'Couples massage',
    description: 'Practitioner: Abigail & Christel',
  };

  assert.equal(eventAppliesToStaff(event, 'Abigail'), true);
  assert.equal(eventAppliesToStaff(event, 'Christel'), true);
  assert.equal(eventAppliesToStaff(event, 'Marietjie'), false);
});

test('unassigned busy entries remain clinic-wide fail-closed blocks', () => {
  const event = {
    summary: 'Clinic maintenance',
    description: 'Treatment rooms unavailable',
  };

  assert.equal(eventAppliesToStaff(event, 'Christel'), true);
  assert.equal(eventAppliesToStaff(event, 'Abigail'), true);
});

test('legacy title naming still associates an event with the named practitioner', () => {
  const event = { summary: 'Linda — Full Body Swedish — Christel' };

  assert.equal(eventAppliesToStaff(event, 'Christel'), true);
  assert.equal(eventAppliesToStaff(event, 'Abigail'), false);
});
