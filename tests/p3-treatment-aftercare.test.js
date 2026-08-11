const test = require('node:test');
const assert = require('node:assert/strict');
const { getTreatmentAftercare, buildGuidance } = require('../src/services/treatmentAftercare');

test('maps known treatment families deterministically', () => {
  assert.equal(getTreatmentAftercare('Full Body Swedish').key, 'massage');
  assert.equal(getTreatmentAftercare('Dermaplane Facial').key, 'facial');
  assert.equal(getTreatmentAftercare('Medi-Heel Pedicure (With Gel Toes) & Foot Massage').key, 'massage');
  assert.equal(getTreatmentAftercare('Permanent Makeup - Brows').key, 'permanent-makeup');
  assert.equal(getTreatmentAftercare('GF Needling with Growth Factors under Local Anesthetic').key, 'needling');
  assert.equal(getTreatmentAftercare('HIFU (High-Intensity Focused Ultrasound)').key, 'advanced-aesthetics');
});

test('fails closed for unknown services', () => {
  assert.equal(getTreatmentAftercare('Unmapped Future Treatment'), null);
  assert.equal(buildGuidance('Unmapped Future Treatment'), '');
});

test('positive experience guidance includes rebooking', () => {
  const text = buildGuidance('Hydrate & Plump Facial', { includeRebooking: true });
  assert.match(text, /Aftercare/);
  assert.match(text, /When to rebook/);
});

test('recovery guidance suppresses rebooking pressure', () => {
  const text = buildGuidance('Hot Stone Massage', { includeRebooking: false });
  assert.match(text, /Aftercare/);
  assert.doesNotMatch(text, /When to rebook/);
});
