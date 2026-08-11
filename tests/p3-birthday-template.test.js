const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  TEMPLATE_NAME,
  TEMPLATE_LANGUAGE,
  TEMPLATE_CATEGORY,
  buildBirthdayTemplateDefinition,
} = require('../src/services/birthdayTemplateProvisioning');

test('birthday template definition is stable and non-promotional in copy', () => {
  const definition = buildBirthdayTemplateDefinition();
  assert.equal(TEMPLATE_NAME, 'shiloh_birthday_wish_v1');
  assert.equal(TEMPLATE_LANGUAGE, 'en');
  assert.equal(TEMPLATE_CATEGORY, 'MARKETING');
  assert.equal(definition.name, TEMPLATE_NAME);
  assert.equal(definition.language, TEMPLATE_LANGUAGE);
  assert.equal(definition.category, TEMPLATE_CATEGORY);
  assert.equal(definition.components.length, 2);

  const body = definition.components.find((component) => component.type === 'BODY');
  const footer = definition.components.find((component) => component.type === 'FOOTER');
  assert.ok(body);
  assert.ok(footer);
  assert.match(body.text, /Happy birthday, \{\{1\}\}!/);
  assert.deepEqual(body.example, { body_text: [['Christel']] });
  assert.match(footer.text, /BIRTHDAY OFF/);
  assert.doesNotMatch(body.text, /discount|sale|offer|book now/i);
});

test('birthday provider status endpoint is read-only, sanitized and brand-gated', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/routes/auditRead.js'), 'utf8');
  assert.match(source, /\/birthday-template\/status/);
  assert.match(source, /getBirthdayTemplateStatus/);
  assert.match(source, /submittedCopyUsesCurrentBrand/);
  assert.match(source, /safeToEnable/);
  assert.match(source, /provider\.template\?\.status === "APPROVED" && submittedCopyUsesCurrentBrand/);
  assert.doesNotMatch(source, /wabaId\s*:/);
  assert.doesNotMatch(source, /templateId\s*:/);
  assert.doesNotMatch(source, /WHATSAPP_TOKEN\s*:/);
  assert.doesNotMatch(source, /sendWhatsApp/);
});
