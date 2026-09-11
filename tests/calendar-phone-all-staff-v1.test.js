const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { calendarPhoneAllStaffClientScript } = require('../src/presentation/calendarPhoneAllStaffUx');

test('#895 Phone Week defaults to all permitted staff columns', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.doesNotThrow(() => new vm.Script(script));
  assert.match(script, /data-phone-week-staff-id/);
  assert.match(script, /phoneWeekStaffRendered/);
  assert.match(script, /selectedIds=parseMode\(\)/);
  assert.match(script, /if\(!raw\|\|raw==='all'\)return \[\.\.\.permittedIds\]/);
  assert.match(script, /permittedIds\.forEach\(id=>url\.searchParams\.append\('staff',id\)\)/);
  assert.doesNotMatch(script, /permittedStaff|calendarScope|all_business/);
});

test('#895 staff chips toggle persistent named columns instead of mutually-exclusive focus', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /phone-staff-column-header/);
  assert.match(script, /phone-staff-column-name/);
  assert.match(script, /selectedIds=selectedIds\.includes\(id\)\?selectedIds\.filter/);
  assert.match(script, /staffButtons\.forEach\(button=>button\.addEventListener\('click'/);
  assert.match(script, /event\.stopImmediatePropagation\(\)/);
  assert.match(script, /selectedIds=\[\.\.\.permittedIds\]/);
  assert.match(script, /allButton\.addEventListener/);
});

test('#895 visible events are laid out inside their selected practitioner column with overlap sublanes', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /function eventOwner\(node\)/);
  assert.match(script, /function layoutStaffGroup\(nodes,columnIndex,columnCount\)/);
  assert.match(script, /base=columnIndex\*100\/columnCount/);
  assert.match(script, /laneWidth=\(100\/columnCount\)\/laneCount/);
  assert.match(script, /node\.dataset\.phoneColumnVisible=String\(visible\)/);
  assert.match(script, /phone-staff-column-dividers/);
  assert.match(script, /overflow-y:auto!important;overflow-x:hidden!important/);
  assert.doesNotMatch(script, /scrollLeft/);
});

test('#895 week strip carries compact month context and no large duplicate day heading', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /function addMonthContext\(\)/);
  assert.match(script, /phone-week-month-context/);
  assert.match(script, /Intl\.DateTimeFormat\('en-ZA',\{month:'short'\}\)/);
  assert.doesNotMatch(script, /phone-calendar-day-context/);
  assert.doesNotMatch(script, /formatActiveDate/);
});

test('#895 Phone Calendar keeps direct Week Month Today and Appointment hierarchy', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /phone-calendar-utility-bar/);
  assert.match(script, /\['week','Week'\],\['month','Month'\]/);
  assert.match(script, /phone-calendar-today-link/);
  assert.match(script, /phone-calendar-primary-action/);
  assert.match(script, /\.phone-calendar-v2-controls,\.phone-calendar-v2-actions\{display:none!important\}/);
});

test('#895 Today returns to todays Week and communicates when already there', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /function todayWeekHref\(\)/);
  assert.match(script, /url\.searchParams\.set\('view','week'\)/);
  assert.match(script, /alreadyToday=currentView\(\)==='week'/);
  assert.match(script, /today\.setAttribute\('aria-disabled','true'\)/);
});

test('#895 full-height Month and 18:00 operating boundary remain', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /function fitCalendarViewport\(\)/);
  assert.match(script, /--phone-calendar-surface-height/);
  assert.match(script, /calendar-view\.month-view\{display:flex!important;flex-direction:column!important/);
  assert.match(script, /month-days\{min-height:0!important;height:100%!important;grid-auto-rows:1fr!important/);
  assert.match(script, /Number\(match\[1\]\)>18/);
  assert.match(script, /data-phone-after-close/);
});

test('#895 production Calendar phone-v2 asset still composes canonical V2 with bounded column-toggle enhancement', () => {
  const routeSource = fs.readFileSync(path.join(__dirname, '../src/routes/calendar.js'), 'utf8');
  assert.match(routeSource, /calendarPhoneCompactV2ClientScript/);
  assert.match(routeSource, /calendarPhoneAllStaffClientScript/);
  assert.match(routeSource, /router\.get\('\/read-only\/phone-v2\.js'/);
});
