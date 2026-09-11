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

test('#888 All staff mode persists explicitly and renders actual practitioner columns while individual focus remains reversible', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /phoneStaff.*all/);
  assert.match(script, /node\.dataset\.phoneStaffVisible='true'/);
  assert.match(script, /node\.dataset\.phoneAllStaffVisible='true'/);
  assert.match(script, /ids\.find\(id=>permittedIds\.includes\(id\)\)/);
  assert.match(script, /phone-all-staff-column-header/);
  assert.match(script, /phone-all-staff-column-name/);
  assert.match(script, /gridTemplateColumns='repeat\('\+count\+',minmax\(0,1fr\)\)'/);
  assert.match(script, /--phone-all-staff-columns/);
  assert.match(script, /linear-gradient\(to right/);
  assert.match(script, /node\.style\.setProperty\('left','calc\('/);
  assert.match(script, /node\.style\.setProperty\('width','calc\('/);
  assert.match(script, /url\.searchParams\.delete\('phoneStaff'\)/);
  assert.match(script, /addEventListener\('click'.*true\)/s);
});

test('#888 Phone Calendar removes duplicate dropdown chrome and exposes direct Week Month Today plus Appointment hierarchy', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /phone-calendar-utility-bar/);
  assert.match(script, /phone-calendar-view-nav/);
  assert.match(script, /\['week','Week'\],\['month','Month'\]/);
  assert.match(script, /phone-calendar-today-link/);
  assert.match(script, /phone-calendar-primary-action/);
  assert.match(script, /\.phone-calendar-v2-controls,\.phone-calendar-v2-actions\{display:none!important\}/);
  assert.match(script, /phone-calendar-day-context/);
  assert.match(script, /content:"People"/);
  assert.doesNotMatch(script, /Choose action practitioner/);
});

test('#888 Phone Calendar visibly clamps the operational timeline at 18:00', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /Number\(match\[1\]\)>18/);
  assert.match(script, /data-phone-after-close/);
  assert.match(script, /max-height:660px!important/);
});

test('#888 production Calendar phone-v2 asset composes the canonical V2 client with the bounded All staff enhancement', () => {
  const routeSource = fs.readFileSync(path.join(__dirname, '../src/routes/calendar.js'), 'utf8');
  assert.match(routeSource, /calendarPhoneCompactV2ClientScript/);
  assert.match(routeSource, /calendarPhoneAllStaffClientScript/);
  assert.match(routeSource, /router\.get\('\/read-only\/phone-v2\.js'/);
  assert.match(routeSource, /send\(`\$\{calendarPhoneCompactV2ClientScript\(\)\}\\n\$\{calendarPhoneAllStaffClientScript\(\)\}`\)/);
});
