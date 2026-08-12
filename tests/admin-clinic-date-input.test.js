const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const parserPath=path.join(__dirname,'..','src','services','adminClinicDateInput.js');
const bookingPath=path.join(__dirname,'..','src','services','adminMobileBookingFlow.js');
const { parseClinicDateInput }=require(parserPath);
const bookingSource=fs.readFileSync(bookingPath,'utf8');
const NOW=new Date('2026-08-12T10:00:00Z');

test('natural day-month input resolves in Johannesburg and preserves future intent',()=>{
  assert.equal(parseClinicDateInput('13 Aug',{now:NOW}),'2026-08-13');
  assert.equal(parseClinicDateInput('13 August',{now:NOW}),'2026-08-13');
  assert.equal(parseClinicDateInput('13 Aug 2027',{now:NOW}),'2027-08-13');
  assert.equal(parseClinicDateInput('2 Jan',{now:NOW}),'2027-01-02');
});

test('relative and weekday dates are supported without weakening invalid-date checks',()=>{
  assert.equal(parseClinicDateInput('today',{now:NOW}),'2026-08-12');
  assert.equal(parseClinicDateInput('tomorrow',{now:NOW}),'2026-08-13');
  assert.equal(parseClinicDateInput('Friday',{now:NOW}),'2026-08-14');
  assert.equal(parseClinicDateInput('next Friday',{now:NOW}),'2026-08-21');
  assert.equal(parseClinicDateInput('31 February',{now:NOW}),null);
  assert.equal(parseClinicDateInput('13/08/2026',{now:NOW}),'2026-08-13');
});

test('guided admin booking uses the shared natural-date parser and client-friendly copy',()=>{
  assert.match(bookingSource,/parseClinicDateInput/);
  assert.match(bookingSource,/13 Aug/);
  assert.match(bookingSource,/tomorrow/);
  assert.match(bookingSource,/Friday/);
  assert.doesNotMatch(bookingSource,/const date=parseDate\(raw\)/);
});
