const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseDateOfBirth } = require('../src/services/clientIdentityOnboarding');

const source = fs.readFileSync(path.join(__dirname,'..','src','services','clientIdentityOnboarding.js'),'utf8');

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

test('onboarding copy tells clients both friendly accepted formats',()=>{
  assert.match(source,/20\/10\/1988 or 20 Sep 1988/);
  assert.doesNotMatch(source,/Please send a valid date of birth in DD\/MM\/YYYY format/);
});
