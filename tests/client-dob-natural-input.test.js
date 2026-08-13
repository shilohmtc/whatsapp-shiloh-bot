const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDateOfBirth, REGISTRATION_START_PROMPT, extractWhatsAppRegistration } = require('../src/services/clientIdentityOnboarding');

test('DOB parser normalizes numeric and clear day-first natural dates to the same canonical value',()=>{
  const expected='1988-09-20';
  assert.equal(parseDateOfBirth('20/09/1988'),expected);
  assert.equal(parseDateOfBirth('20-09-1988'),expected);
  assert.equal(parseDateOfBirth('1988-09-20'),expected);
  assert.equal(parseDateOfBirth('20 Sep 1988'),expected);
  assert.equal(parseDateOfBirth('20 Sept 1988'),expected);
  assert.equal(parseDateOfBirth('20 September 1988'),expected);
  assert.equal(parseDateOfBirth('20 SEPTEMBER 1988'),expected);
  assert.equal(parseDateOfBirth('20 September, 1988'),expected);
});

test('DOB parser rejects ambiguous month-first, unknown-month and impossible dates',()=>{
  assert.equal(parseDateOfBirth('Sep 20 1988'),null);
  assert.equal(parseDateOfBirth('10/20/1988'),null);
  assert.equal(parseDateOfBirth('20 Foo 1988'),null);
  assert.equal(parseDateOfBirth('31 Feb 1988'),null);
  assert.equal(parseDateOfBirth('29 Feb 1989'),null);
  assert.equal(parseDateOfBirth('31/04/1988'),null);
});

test('DOB parser retains age and future-date safety boundaries',()=>{
  assert.equal(parseDateOfBirth('01 Jan 2999'),null);
  assert.equal(parseDateOfBirth('01 Jan 1800'),null);
});

test('registration copy demonstrates a friendly natural DOB and parser also accepts numeric day-first DOB',()=>{
  assert.match(REGISTRATION_START_PROMPT,/14 May 1990/);
  assert.equal(extractWhatsAppRegistration('Test Person, 20/10/1988, Female').dateOfBirth,'1988-10-20');
  assert.equal(extractWhatsAppRegistration('Test Person, 20 Sep 1988, Female').dateOfBirth,'1988-09-20');
});
