const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  DESKTOP_COMPACT_LANE_MIN_PX,
  calendarDesktopFitCanvasStyles,
  calendarDesktopFitCanvasClientScript,
} = require('../src/presentation/calendarDesktopFitCanvasUx');

test('#866 wide Desktop Day fits seven practitioner lanes before horizontal scrolling', () => {
  assert.equal(DESKTOP_COMPACT_LANE_MIN_PX, 180);
  assert.equal(7 * DESKTOP_COMPACT_LANE_MIN_PX, 1260);

  const css = calendarDesktopFitCanvasStyles();
  assert.match(css, /@media\(min-width:701px\)/);
  assert.match(css, /grid-template-columns:repeat\(var\(--lane-count\),minmax\(180px,1fr\)\)!important/);
  assert.match(css, /\.day-time-grid \.lanes\{[^}]*min-width:0!important;[^}]*width:100%!important/);
  assert.match(css, /\.day-time-grid \.lane\{min-width:180px!important;width:auto!important\}/);
  assert.doesNotMatch(css, /minmax\(300px,1fr\)/);
});

test('#866 fit-to-canvas remains Desktop-only and retains overflow fallback when space is genuinely insufficient', () => {
  const css = calendarDesktopFitCanvasStyles();
  assert.match(css, /\.day-time-grid\{overflow-x:auto!important;overflow-y:auto!important\}/);
  assert.doesNotMatch(css, /max-width:700px/);

  const script = calendarDesktopFitCanvasClientScript();
  assert.match(script, /data-calendar-desktop-fit-canvas/);
  assert.match(script, /document\.head\.appendChild\(style\)/);
});

test('#866 Workspace nav bundle loads fit-to-canvas after the established Desktop Calendar script', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/routes/workspaceOperational.js'), 'utf8');
  assert.match(source, /calendarDesktopFitCanvasClientScript/);
  assert.match(source, /calendarDesktopApprovedClientScript\(\).*calendarDesktopFitCanvasClientScript\(\)/s);
});
