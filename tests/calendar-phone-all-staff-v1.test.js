const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { calendarPhoneAllStaffClientScript } = require('../src/presentation/calendarPhoneAllStaffUx');

test('#888 Phone week defaults to All staff from server-permitted buttons only', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.doesNotThrow(() => new vm.Script(script));
  assert.match(script, /data-phone-week-staff-id/);
  assert.match(script, /phoneWeekStaffRendered/);
  assert.match(script, /phoneWeekStaffAll/);
  assert.match(script, /All staff/);
  assert.match(script, /const initialMode=mode\(\)/);
  assert.match(script, /else if\(allRendered\(\)\)\{activateAll\(\)\}else\{reloadAll\(\)\}/);
  assert.match(script, /permittedIds\.forEach\(id=>url\.searchParams\.append\('staff',id\)\)/);
  assert.doesNotMatch(script, /permittedStaff|calendarScope|all_business/);
});

test('#888 All staff is one non-horizontal timetable with dynamic overlap lanes', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /overflow-y:auto!important;overflow-x:hidden!important/);
  assert.match(script, /function layoutOverlaps\(\)/);
  assert.match(script, /item\.node\.dataset\.phoneOverlapLanes=String\(count\)/);
  assert.match(script, /node\.dataset\.phoneAllStaffVisible='true'/);
  assert.match(script, /event-practitioners\{display:inline-flex!important\}/);
  assert.doesNotMatch(script, /phone-all-staff-column-header/);
  assert.doesNotMatch(script, /count\*116/);
  assert.doesNotMatch(script, /scrollLeft/);
});

test('#888 Phone Calendar exposes one People selector and no duplicated large day context', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /content:"People"/);
  assert.match(script, /phone-calendar-utility-bar/);
  assert.match(script, /\['week','Week'\],\['month','Month'\]/);
  assert.match(script, /phone-calendar-today-link/);
  assert.match(script, /phone-calendar-primary-action/);
  assert.match(script, /\.phone-calendar-v2-controls,\.phone-calendar-v2-actions\{display:none!important\}/);
  assert.doesNotMatch(script, /phone-calendar-day-context/);
  assert.doesNotMatch(script, /formatActiveDate/);
});

test('#888 individual staff mode remains explicit and persists across calendar links', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /function activateIndividual\(id\)/);
  assert.match(script, /url\.searchParams\.set\('phoneStaff',id\)/);
  assert.match(script, /syncModeLinks\(id\)/);
  assert.match(script, /staffButtons\.forEach\(button=>button\.addEventListener\('click'/);
});

test('#888 Today returns to todays Week and communicates when already there', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /function todayWeekHref\(\)/);
  assert.match(script, /url\.searchParams\.set\('view','week'\)/);
  assert.match(script, /alreadyToday=currentView\(\)==='week'/);
  assert.match(script, /today\.setAttribute\('aria-disabled','true'\)/);
});

test('#888 Phone Calendar fills dynamic viewport and Month distributes rows through remaining height', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /function fitCalendarViewport\(\)/);
  assert.match(script, /innerHeight-top-4/);
  assert.match(script, /--phone-calendar-surface-height/);
  assert.match(script, /calendar-view\.month-view\{display:flex!important;flex-direction:column!important/);
  assert.match(script, /month-days\{min-height:0!important;height:100%!important;grid-auto-rows:1fr!important/);
});

test('#888 Phone Calendar visibly clamps operational timeline at 18:00', () => {
  const script = calendarPhoneAllStaffClientScript();
  assert.match(script, /Number\(match\[1\]\)>18/);
  assert.match(script, /data-phone-after-close/);
});

test('#888 production Calendar phone-v2 asset composes canonical V2 client with bounded adaptive schedule enhancement', () => {
  const routeSource = fs.readFileSync(path.join(__dirname, '../src/routes/calendar.js'), 'utf8');
  assert.match(routeSource, /calendarPhoneCompactV2ClientScript/);
  assert.match(routeSource, /calendarPhoneAllStaffClientScript/);
  assert.match(routeSource, /router\.get\('\/read-only\/phone-v2\.js'/);
});
