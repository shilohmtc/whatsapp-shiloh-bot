const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const identityPath = path.join(__dirname, '..', 'src', 'services', 'clientIdentityOnboarding.js');
const identitySource = fs.readFileSync(identityPath, 'utf8');
const { extractBundledRegistration, normalizeRegistrationMobile } = require(identityPath);

test('South African local and international mobiles normalize to the same registration number', () => {
  assert.equal(normalizeRegistrationMobile('0825600139'), '27825600139');
  assert.equal(normalizeRegistrationMobile('+27 82 560 0139'), '27825600139');
  assert.equal(normalizeRegistrationMobile('27825600139'), '27825600139');
  assert.equal(normalizeRegistrationMobile('12345'), null);
});

test('new client can send name mobile and DOB together on separate lines', () => {
  assert.deepEqual(
    extractBundledRegistration('Chenique Botha\n0825600139\n10/06/2011'),
    { fullName: 'Chenique Botha', mobileNumber: '27825600139', dateOfBirth: '2011-06-10' }
  );
});

test('bundled registration also accepts labelled details in one sentence', () => {
  assert.deepEqual(
    extractBundledRegistration('Name: Chenique Botha, mobile: +27 82 560 0139, DOB: 10 Jun 2011'),
    { fullName: 'Chenique Botha', mobileNumber: '27825600139', dateOfBirth: '2011-06-10' }
  );
});

test('bundled registration fails closed unless all three fields are valid', () => {
  assert.equal(extractBundledRegistration('Chenique Botha\n10/06/2011'), null);
  assert.equal(extractBundledRegistration('Chenique Botha\n0825600139\n31/02/2011'), null);
  assert.equal(extractBundledRegistration('0825600139\n10/06/2011'), null);
});

test('bundled mobile is retained as registration evidence without weakening WhatsApp identity ownership', () => {
  assert.match(identitySource, /pendingContact:combined\.mobileNumber/);
  assert.match(identitySource, /registrationPhone!==key/);
  assert.match(identitySource, /contact_type IN \('whatsapp','mobile'\)/);
  assert.match(identitySource, /'mobile'.*FALSE,NULL/s);
  assert.match(identitySource, /e\.code="AMBIGUOUS_CONTACT"/);
});

test('registration copy explicitly allows all required details in one message', () => {
  assert.match(identitySource, /You can send all three together in one message/);
  assert.match(identitySource, /full name, mobile number and date of birth together in one message/);
});
