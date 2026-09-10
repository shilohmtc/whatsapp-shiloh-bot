'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  bookingOperationalActions,
} = require('../src/routes/calendarReadOnlyUx');
const {
  calendarPastHandoffClientScript,
  injectPastHandoffScript,
} = require('../src/routes/calendarCreateBooking');

test('#823 Calendar entry offers Record past appointment only when retrospective authority resolved', () => {
  const unauthorized = bookingOperationalActions('2026-09-10', '/calendar/book', false, '/calendar/book/past');
  assert.deepEqual(unauthorized.map(action => action.label), ['+ New appointment']);
  assert.equal(unauthorized.some(action => action.href.includes('/calendar/book/past')), false);

  const authorized = bookingOperationalActions('2026-09-10', '/calendar/book', true, '/calendar/book/past');
  assert.deepEqual(authorized.map(action => action.label), ['+ New appointment', 'Record past appointment']);
  assert.equal(authorized[1].href, '/calendar/book/past?date=2026-09-10');
  assert.equal(authorized[1].tone, 'secondary');
});

test('#823 ordinary booking handoff script is injected only by the authorized route path', () => {
  const html = '<!doctype html><html><head><title>Booking</title></head><body></body></html>';
  const unchanged = injectPastHandoffScript(html, null);
  assert.equal(unchanged, html);

  const injected = injectPastHandoffScript(html, '/calendar/book/past-handoff.js');
  assert.match(injected, /<script src="\/calendar\/book\/past-handoff\.js" defer><\/script>/);
});

test('#823 historical handoff preserves existing retrospective route and entered context without duplicating its rules', () => {
  const script = calendarPastHandoffClientScript({ pastPath: '/calendar/book/past' });
  assert.match(script, /This appointment has already ended\. Record it as a past appointment instead\./);
  assert.match(script, /Record past appointment/);
  assert.match(script, /PAST='?"?\/calendar\/book\/past/);
  assert.match(script, /params\.set\('date',context\.date\)/);
  assert.match(script, /params\.set\('time',context\.time\)/);
  assert.match(script, /params\.set\('staff',String\(context\.staff\)\)/);
  assert.match(script, /end\.getTime\(\)<Date\.now\(\)/);
  assert.match(script, /if\(!context\)return;/);
  assert.match(script, /stopImmediatePropagation/);
  assert.doesNotMatch(script, /confirm|reminder|deposit|payment|provider/i);
});
