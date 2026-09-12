const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  DESKTOP_COMPACT_LANE_MIN_PX,
  DESKTOP_BASE_GRID_HEIGHT_PX,
  DESKTOP_GRID_HOURS,
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

test('Desktop Team day expands vertically into available viewport space', () => {
  assert.equal(DESKTOP_BASE_GRID_HEIGHT_PX, 792);
  assert.equal(DESKTOP_GRID_HOURS, 11);
  const css = calendarDesktopFitCanvasStyles();
  assert.match(css, /--desktop-grid-height,792px/);
  assert.match(css, /--desktop-hour-height,72px/);
  assert.match(css, /--desktop-event-top,var\(--event-top\)/);
  assert.match(css, /--desktop-slot-top,var\(--slot-top\)/);

  const script = calendarDesktopFitCanvasClientScript();
  assert.match(script, /window\.innerHeight-top-footerHeight-24-54/);
  assert.match(script, /calendarDesktopVerticalFit/);
  assert.match(script, /requestAnimationFrame\(fitVerticalCanvas\)/);
  assert.doesNotThrow(() => new Function(script));
});

test('#866 Workspace nav bundle loads fit-to-canvas after the established Desktop Calendar script', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/routes/workspaceOperational.js'), 'utf8');
  assert.match(source, /calendarDesktopFitCanvasClientScript/);
  assert.match(source, /calendarDesktopApprovedClientScript\(\).*calendarDesktopFitCanvasClientScript\(\)/s);
});
