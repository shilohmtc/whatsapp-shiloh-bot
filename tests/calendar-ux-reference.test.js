const test = require('node:test');
const assert = require('node:assert/strict');

const { calendarReferenceUxCss } = require('../src/presentation/calendarUxReference');
const { serviceFamilyAccentCss } = require('../src/presentation/calendarServiceFamilyVisuals');

test('#870 Calendar reference adapter consumes released Shiloh primitive styles', () => {
  const css = calendarReferenceUxCss();
  assert.match(css, /--shiloh-touch-min:44px/);
  assert.match(css, /\.shiloh-control--compact\{min-height:34px/);
  assert.match(css, /\.workspace-main \.controls \.nav-button/);
  assert.match(css, /\.workspace-main \.controls \.view-tab\.active/);
  assert.match(css, /var\(--shiloh-focus\)/);
});

test('#870 Phone Calendar controls preserve the shared 44px touch contract', () => {
  const css = calendarReferenceUxCss();
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /min-height:var\(--shiloh-touch-min\)!important/);
  assert.match(css, /touch-action:manipulation/);
});

test('#870 Desktop Calendar controls retain compact density', () => {
  const css = calendarReferenceUxCss();
  assert.match(css, /@media\(min-width:701px\)/);
  assert.match(css, /min-height:34px!important/);
  assert.match(css, /padding:0 var\(--shiloh-space-3\)!important/);
});

test('#870 practitioner identity and appointment status remain distinct semantic roles', () => {
  const css = calendarReferenceUxCss();
  assert.match(css, /\.view-practitioner/);
  assert.match(css, /\.event-practitioners/);
  assert.match(css, /\.read-only-badge/);
  assert.match(css, /\.kind-pill/);
  assert.match(css, /\.closure-strip/);
  assert.match(css, /var\(--shiloh-danger\)/);
  assert.doesNotMatch(css, /staff.*danger/i);
});

test('#870 production Calendar stylesheet includes the reference adapter without replacing service-family visuals', () => {
  const css = serviceFamilyAccentCss();
  assert.match(css, /--shiloh-touch-min:44px/);
  assert.match(css, /service-family-icon\[data-service-family="facial_skin"\]/);
  assert.match(css, /desktopAppointmentCardDensityCss|@container/);
});
