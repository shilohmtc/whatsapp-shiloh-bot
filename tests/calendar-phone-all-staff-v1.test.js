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

test('#888 All staff mode persists explicitly and renders readable horizontally scrollable practitioner columns', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /phoneStaff.*all/);
  assert.match(script, /node\.dataset\.phoneStaffVisible='true'/);
  assert.match(script, /node\.dataset\.phoneAllStaffVisible='true'/);
  assert.match(script, /ids\.find\(id=>permittedIds\.includes\(id\)\)/);
  assert.match(script, /phone-all-staff-column-header/);
  assert.match(script, /phone-all-staff-column-name/);
  assert.match(script, /count\*116/);
  assert.match(script, /contentWidth=Math\.max\(viewport,count\*116\)/);
  assert.match(script, /content\.style\.setProperty\('min-width',contentWidth\+'px','important'\)/);
  assert.match(script, /node\.style\.setProperty\('left',\(index\*columnWidth\+1\)\+'px','important'\)/);
  assert.match(script, /node\.style\.setProperty\('width',Math\.max\(72,columnWidth-2\)\+'px','important'\)/);
  assert.match(script, /position:sticky!important;left:0/);
  assert.match(script, /syncColumnHeaderScroll/);
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

test('#888 Today is an explicit return to todays Week and communicates when already there', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /function todayWeekHref\(\)/);
  assert.match(script, /url\.searchParams\.set\('view','week'\)/);
  assert.match(script, /alreadyToday=currentView\(\)==='week'/);
  assert.match(script, /today\.setAttribute\('aria-disabled','true'\)/);
  assert.match(script, /preventDefault/);
});

test('#888 Phone Calendar fills the dynamic viewport and Month distributes rows through remaining height', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /function fitCalendarViewport\(\)/);
  assert.match(script, /innerHeight-top-4/);
  assert.match(script, /--phone-calendar-surface-height/);
  assert.match(script, /calendar-view\.week-view\{display:flex!important;flex-direction:column!important/);
  assert.match(script, /week-time-grid\{flex:1 1 auto!important;min-height:0!important/);
  assert.match(script, /calendar-view\.month-view\{display:flex!important;flex-direction:column!important/);
  assert.match(script, /month-grid\{display:grid!important;grid-template-rows:auto minmax\(0,1fr\)!important/);
  assert.match(script, /month-days\{min-height:0!important;height:100%!important;grid-auto-rows:1fr!important/);
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
