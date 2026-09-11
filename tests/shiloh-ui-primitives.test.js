const test = require('node:test');
const assert = require('node:assert/strict');

const {
  renderButton,
  renderIconButton,
  renderChip,
  renderBadge,
  shilohUiPrimitiveStyles,
} = require('../src/presentation/shilohUiPrimitives');

test('#865 button uses safe text, canonical icon and touch density by default', () => {
  const html = renderButton({ label: 'Book <now>', icon: 'calendar', variant: 'primary' });
  assert.match(html, /class="shiloh-button shiloh-button--primary shiloh-control--touch"/);
  assert.match(html, /data-shiloh-icon="calendar"/);
  assert.match(html, /Book &lt;now&gt;/);
  assert.doesNotMatch(html, /Book <now>/);
});

test('#865 icon button requires an accessible label and exposes it', () => {
  assert.throws(() => renderIconButton({ icon: 'more' }), /accessible label/);
  assert.throws(() => renderIconButton({ label: 'More' }), /requires an icon/);
  const html = renderIconButton({ label: 'More actions', icon: 'more', density: 'compact' });
  assert.match(html, /aria-label="More actions"/);
  assert.match(html, /shiloh-control--compact/);
});

test('#865 chip selected state is semantic and not colour-only', () => {
  const selected = renderChip({ label: 'Abigail', selected: true, icon: 'person' });
  const plain = renderChip({ label: 'Christel' });
  assert.match(selected, /aria-pressed="true"/);
  assert.match(selected, /is-selected/);
  assert.match(selected, />Abigail</);
  assert.match(plain, /aria-pressed="false"/);
});

test('#865 badge keeps visible status text alongside optional icon', () => {
  const html = renderBadge({ label: 'Confirmed', tone: 'success', icon: 'confirm' });
  assert.match(html, /shiloh-badge--success/);
  assert.match(html, /data-shiloh-icon="confirm"/);
  assert.match(html, />Confirmed</);
});

test('#865 unsafe class tokens are discarded and enums fail to safe defaults', () => {
  const html = renderButton({
    label: 'Safe',
    className: 'good bad" onclick="oops',
    variant: 'unknown',
    density: 'unknown',
  });
  assert.match(html, /shiloh-button--secondary/);
  assert.match(html, /shiloh-control--touch/);
  assert.match(html, / good/);
  assert.doesNotMatch(html, /onclick=/);
});

test('#865 shared styles encode 44px touch and compact desktop modes', () => {
  const css = shilohUiPrimitiveStyles();
  assert.match(css, /--shiloh-touch-min:44px/);
  assert.match(css, /\.shiloh-control--touch\{min-height:var\(--shiloh-touch-min\)/);
  assert.match(css, /\.shiloh-control--compact\{min-height:34px/);
  assert.match(css, /\.shiloh-chip\.is-selected/);
  assert.match(css, /\.shiloh-badge--success/);
});

test('#870 shared controls preserve semantic navigation when href is supplied', () => {
  const previous = renderIconButton({
    label: 'Previous period',
    icon: 'previous',
    href: '/workspace/calendar?view=week&date=2026-09-07',
    density: 'compact',
  });
  assert.match(previous, /^<a /);
  assert.match(previous, /href="\/workspace\/calendar\?view=week&amp;date=2026-09-07"/);
  assert.match(previous, /aria-label="Previous period"/);
  assert.doesNotMatch(previous, /<button/);

  const week = renderChip({
    label: 'Week',
    selected: true,
    href: '/workspace/calendar?view=week',
    ariaCurrent: 'page',
    density: 'compact',
  });
  assert.match(week, /^<a /);
  assert.match(week, /aria-current="page"/);
  assert.match(week, /is-selected/);
  assert.doesNotMatch(week, /aria-pressed/);
});

test('#870 disabled navigation primitives remain non-operable', () => {
  const html = renderButton({
    label: 'Today',
    href: '/workspace/calendar?date=2026-09-11',
    disabled: true,
  });
  assert.match(html, /^<a/);
  assert.match(html, /aria-disabled="true"/);
  assert.match(html, /tabindex="-1"/);
  assert.doesNotMatch(html, / href=/);
});