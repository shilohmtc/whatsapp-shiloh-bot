const test = require('node:test');
const assert = require('node:assert/strict');

const { SHILOH_UX_TOKENS, shilohUxTokenCss } = require('../src/presentation/shilohUxTokens');
const { SHILOH_ICONS, renderShilohIcon } = require('../src/presentation/shilohIcon');

test('#862 UX tokens preserve the standing Phone/Desktop boundary and touch target contract', () => {
  assert.equal(SHILOH_UX_TOKENS.breakpoint.phoneMax, '700px');
  assert.equal(SHILOH_UX_TOKENS.breakpoint.desktopMin, '701px');
  assert.equal(SHILOH_UX_TOKENS.touch.minTarget, '44px');
  assert.ok(SHILOH_UX_TOKENS.staffAccentPalette.length >= 5);

  const css = shilohUxTokenCss();
  assert.match(css, /--shiloh-phone-max:700px/);
  assert.match(css, /--shiloh-desktop-min:701px/);
  assert.match(css, /--shiloh-touch-min:44px/);
  assert.match(css, /--shiloh-focus:/);
});

test('#862 canonical icon vocabulary is Lucide-backed and server-renderable', () => {
  assert.ok(SHILOH_ICONS.calendar);
  assert.ok(SHILOH_ICONS.person);
  assert.ok(SHILOH_ICONS.people);

  const html = renderShilohIcon('calendar', { size: 20, className: 'nav-icon' });
  assert.match(html, /^<svg /);
  assert.match(html, /data-shiloh-icon="calendar"/);
  assert.match(html, /class="shiloh-icon nav-icon"/);
  assert.match(html, /width="20" height="20"/);
  assert.match(html, /aria-hidden="true" focusable="false"/);
  assert.match(html, /<path /);
});

test('#862 labelled icons expose an accessible name and inputs are escaped', () => {
  const html = renderShilohIcon('search', { label: 'Search <clients>', className: 'x" onclick="bad' });
  assert.match(html, /role="img" aria-label="Search &lt;clients&gt;"/);
  assert.match(html, /class="shiloh-icon x&quot; onclick=&quot;bad"/);
  assert.doesNotMatch(html, /class="[^"]*" onclick=/);
});

test('#862 icon renderer fails closed for non-canonical icon names', () => {
  assert.throws(() => renderShilohIcon('not-a-shiloh-icon'), /Unknown Shiloh icon/);
});
