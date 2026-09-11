'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { processClinicFaqMessage, resolveClinicFaq } = require('../src/services/clinicFaq');

const evaluations = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'tests', 'fixtures', 'assistant-faq-v1-evals.json'),
  'utf8'
));

let passed = 0;
for (const evaluation of evaluations) {
  const direct = processClinicFaqMessage(evaluation.message);
  const resolved = resolveClinicFaq(evaluation.message);

  if (evaluation.expect === 'defer-canonical') {
    assert.equal(direct.handled, false, evaluation.id);
    assert.equal(direct.reason, 'canonical_authority', evaluation.id);
    assert.equal(resolved.kind, evaluation.faqKind, evaluation.id);
  } else {
    assert.equal(direct.handled, true, evaluation.id);
    assert.equal(direct.resolution.kind, evaluation.expect, evaluation.id);
  }
  passed += 1;
}

console.log(`Assistant FAQ V1 evaluation passed: ${passed}/${evaluations.length} cases.`);
