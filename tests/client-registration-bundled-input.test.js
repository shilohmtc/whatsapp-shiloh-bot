const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const identityPath = path.join(__dirname, '..', 'src', 'services', 'clientIdentityOnboarding.js');
const identitySource = fs.readFileSync(identityPath, 'utf8');
const {
  extractWhatsAppRegistration,
  normalizeRegistrationMobile,
  looksLikeRegistrationMobileInput,
  REGISTRATION_START_PROMPT,
} = require(identityPath);

test('South African mobile normalization remains available for non-self-registration surfaces', () => {
  assert.equal(normalizeRegistrationMobile('0825600139'), '27825600139');
  assert.equal(normalizeRegistrationMobile('+27 82 560 0139'), '27825600139');
  assert.equal(normalizeRegistrationMobile('27825600139'), '27825600139');
  assert.equal(normalizeRegistrationMobile('12345'), null);
});

test('phone-like input can still be distinguished from DOB input', () => {
  assert.equal(looksLikeRegistrationMobileInput('082 560 0139'), true);
  assert.equal(looksLikeRegistrationMobileInput('+27 82 560 0139'), true);
  assert.equal(looksLikeRegistrationMobileInput('20/09/1988'), false);
});

test('WhatsApp self-registration accepts name DOB and gender together without repeating the mobile number', () => {
  assert.deepEqual(
    extractWhatsAppRegistration('Chenique Botha\n10/06/2011\nFemale'),
    { fullName: 'Chenique Botha', dateOfBirth: '2011-06-10', gender: 'female' }
  );
  assert.deepEqual(
    extractWhatsAppRegistration('Name: Chenique Botha, DOB: 10 Jun 2011, female'),
    { fullName: 'Chenique Botha', dateOfBirth: '2011-06-10', gender: 'female' }
  );
});

test('progressive registration accepts partial fields and leaves missing fields for the session to request', () => {
  assert.deepEqual(extractWhatsAppRegistration('Chenique'), { fullName: 'Chenique' });
  assert.deepEqual(extractWhatsAppRegistration('Botha, 10 Jun 2011'), { fullName: 'Botha', dateOfBirth: '2011-06-10' });
  assert.deepEqual(extractWhatsAppRegistration('Female'), { gender: 'female' });
});

test('self-registration copy never asks the client to repeat the WhatsApp/mobile number', () => {
  assert.doesNotMatch(REGISTRATION_START_PROMPT, /mobile number|phone number/i);
  assert.match(REGISTRATION_START_PROMPT, /first name/i);
  assert.match(REGISTRATION_START_PROMPT, /surname/i);
  assert.match(REGISTRATION_START_PROMPT, /date of birth/i);
  assert.match(REGISTRATION_START_PROMPT, /gender/i);
});

test('completion binds the canonical client to the inbound WhatsApp identity and preserves conflict guards', () => {
  assert.match(identitySource, /const key = normalizePhone\(phone\)/);
  assert.match(identitySource, /contact_type IN \('whatsapp','mobile'\)/);
  assert.match(identitySource, /INSERT INTO client_contacts[\s\S]*'whatsapp'/);
  assert.match(identitySource, /AMBIGUOUS_CONTACT/);
  assert.doesNotMatch(identitySource, /registrationPhone!==key/);
});
