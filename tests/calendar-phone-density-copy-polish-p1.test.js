const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync(require.resolve('../src/presentation/calendarReadOnlyUx'), 'utf8');
const proof = fs.readFileSync(require.resolve('../scripts/calendar-spatial-phone-week-browser-proof'), 'utf8');

test('Phone Day retains the #723 density base while #725 projects one active full-width lane', () => {
  assert.match(
    source,
    /day-time-grid \.lanes\{display:grid!important;grid-template-columns:repeat\(var\(--lane-count\),210px\)!important;min-width:max-content!important;width:auto!important;gap:0!important\}/,
  );
  assert.match(
    source,
    /day-time-grid \.lane\{min-width:210px!important;width:210px!important;border-right:1px solid var\(--line\)!important\}/,
  );
  assert.doesNotMatch(source, /minmax\(270px,calc\(100vw - 76px\)\)/);
  assert.match(proof, /dayMetrics\.visibleLaneCount, 1/);
  assert.match(proof, /dayMetrics\.laneWidth >= 340/);
  assert.match(proof, /dayMetrics\.scrollerScrollWidth <= dayMetrics\.scrollerClientWidth \+ 2/);
});

test('Calendar removes static canonical-authority helper copy while retaining live mutation status', () => {
  assert.doesNotMatch(source, /Canonical changes are revalidated when saved\./);
  assert.doesNotMatch(source, /Every change is revalidated by canonical Calendar authority\./);
  assert.match(source, /data-calendar-operation-status><\/span>/);
  assert.match(source, /\.operation-status:empty\{display:none\}/);
  assert.doesNotMatch(source, /class=\"panel-hint\"/);
  assert.match(proof, /dayMetrics\.legacyControlsVisible, false/);
  assert.match(proof, /dayMetrics\.legacyAvailabilityVisible, false/);
});
