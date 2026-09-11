const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { calendarPhoneAllStaffClientScript } = require('../src/presentation/calendarPhoneAllStaffUx');

test('#888 Phone week planner adds an explicit All staff mode from server-permitted buttons only', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.doesNotThrow(() => new vm.Script(script));
  assert.match(script, /data-phone-week-staff-id/);
  assert.match(script, /phoneWeekStaffRendered/);
  assert.match(script, /phoneWeekStaffAll/);
  assert.match(script, /All staff/);
  assert.match(script, /permittedIds\.forEach\(id=>url\.searchParams\.append\('staff',id\)\)/);
  assert.doesNotMatch(script, /permittedStaff|calendarScope|all_business/);
});

test('#888 All staff mode persists explicitly and shows every rendered permitted appointment while individual focus remains reversible', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /phoneStaff.*all/);
  assert.match(script, /node\.dataset\.phoneStaffVisible='true'/);
  assert.match(script, /node\.dataset\.phoneAllStaffVisible='true'/);
  assert.match(script, /ids\.find\(id=>permittedIds\.includes\(id\)\)/);
  assert.match(script, /url\.searchParams\.delete\('phoneStaff'\)/);
  assert.match(script, /addEventListener\('click'.*true\)/s);
});

test('#888 production Calendar phone-v2 asset composes the canonical V2 client with the bounded All staff enhancement', () => {
  const routeSource = fs.readFileSync(path.join(__dirname, '../src/routes/calendar.js'), 'utf8');
  assert.match(routeSource, /calendarPhoneCompactV2ClientScript/);
  assert.match(routeSource, /calendarPhoneAllStaffClientScript/);
  assert.match(routeSource, /router\.get\('\/read-only\/phone-v2\.js'/);
  assert.match(routeSource, /send\(`\$\{calendarPhoneCompactV2ClientScript\(\)\}\\n\$\{calendarPhoneAllStaffClientScript\(\)\}`\)/);
});
