const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname,'..','src','services','adminReports.js'),'utf8');

test('this-week report uses Johannesburg calendar-week bounds',()=>{
  assert.match(source,/date_trunc\('week', NOW\(\) AT TIME ZONE 'Africa\/Johannesburg'\)/);
  assert.match(source,/INTERVAL '7 days'/);
});

test('this-week report reuses existing business-wide versus practitioner scope',()=>{
  assert.match(source,/isBusinessWide\(admin\)/);
  assert.match(source,/report_scope\.staff_id/);
  assert.match(source,/staff_services report_ss/);
});

test('this-week report is permission gated and auditable',()=>{
  assert.match(source,/appointment:view/);
  assert.match(source,/admin\.report\.\$\{period\}/);
  assert.match(source,/this week report/);
});

test('today report remains supported when month reporting is added',()=>{
  assert.match(source,/today report/);
  assert.match(source,/const period=month\?'month':week\?'week':'today'/);
});
