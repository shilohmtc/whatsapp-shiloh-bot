const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'services', 'adminMobileBookingFlow.js'),
  'utf8'
);

test('active admin booking recognizes the full Admin navigation escape surface', () => {
  assert.ok(source.includes("function isGreeting(v=''){return /^(hi|hello|hey|howzit|hiya|good morning|good afternoon|good evening)[!. ]*$/i.test(clean(v));}"));
  assert.ok(source.includes("function isNavigationEscape(v=''){const n=norm(v);return ['menu','admin menu','home','admin'].includes(n)||isGreeting(v);}"));
});

test('booking session is cleared before global navigation yields to the Admin router', () => {
  assert.ok(source.includes("if(session&&isNavigationEscape(raw)){if(['confirm','historical-confirm'].includes(session.step))await cancelPendingBooking(admin.id);await deleteSession(k);return{handled:false};}"));
});

test('invalid slot input remains fail-safe inside the slot picker', () => {
  assert.ok(source.includes("if(!slot)return{handled:true,admin,interactive:slotsInteractive(session,session.page||0)};"));
});
