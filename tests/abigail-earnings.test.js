const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/services/adminReports.js'), 'utf8');

test('Abigail commission is fixed at 20 percent and only completed appointments qualify', () => {
  assert.match(source, /ABIGAIL_COMMISSION_RATE = 0\.20/);
  assert.match(source, /a\.status='completed'/);
  assert.match(source, /completedValue\*ABIGAIL_COMMISSION_RATE/);
});

test('Abigail has a fixed R5000 monthly salary in addition to commission', () => {
  assert.match(source, /ABIGAIL_MONTHLY_SALARY = 5000/);
  assert.match(source, /period==='month'\?ABIGAIL_MONTHLY_SALARY:0/);
  assert.match(source, /salary\+commission/);
  assert.match(source, /Fixed monthly salary/);
  assert.match(source, /Total gross compensation/);
  assert.match(source, /fixed R5,000 salary \+ 20% commission/);
});

test('salary is monthly only and is not prorated into today or week reports', () => {
  assert.match(source, /Salary is monthly and is not prorated into today\/week earnings/);
  assert.match(source, /monthlySalary:earnings\.period==='month'\?ABIGAIL_MONTHLY_SALARY:null/);
});

test('joint-practitioner and unpriced appointments fail closed', () => {
  assert.match(source, /COUNT\(DISTINCT ast\.staff_id\)::int AS staff_count/);
  assert.match(source, /Number\(r\.staff_count\)===1&&r\.total_price!==null/);
  assert.match(source, /Number\(r\.staff_count\)>1/);
  assert.match(source, /Completed appointments without a CRM price excluded/);
  assert.match(source, /Joint-practitioner appointments excluded/);
});

test('Abigail can view her own earnings and business-wide admins can view Abigail earnings', () => {
  assert.match(source, /\^my earnings/);
  assert.match(source, /\^abigail\(\?:'s\)\? earnings/);
  assert.match(source, /The 20% earnings report is configured for Abigail only/);
  assert.match(source, /Only a business-wide admin can view another practitioner’s earnings report/);
});

test('earnings support today week and month and remain audited', () => {
  assert.match(source, /token\.includes\('month'\)/);
  assert.match(source, /token\.includes\('week'\)/);
  assert.match(source, /date_trunc\('month'/);
  assert.match(source, /abigail_earnings_\$\{earnings\.period\}/);
  assert.match(source, /jointExcluded:data\.joint\.length/);
  assert.match(source, /totalCompensation:data\.totalCompensation/);
});
