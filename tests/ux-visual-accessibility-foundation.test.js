const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const workflow = fs.readFileSync('.github/workflows/ux-quality.yml', 'utf8');
const config = fs.readFileSync('playwright.ux.config.js', 'utf8');
const spec = fs.readFileSync('tests/ux-visual-accessibility.spec.js', 'utf8');
const codec = fs.readFileSync('scripts/ux-baseline-codec.js', 'utf8');
const calendarStory = fs.readFileSync('stories/CalendarReference.stories.js', 'utf8');

function baselineParts(prefix) {
  return fs.readdirSync('tests/ux-baselines').filter((name) => name.startsWith(`${prefix}.png.b64.part`)).sort();
}

test('UX gate reuses production-backed Calendar reference stories instead of copying presentation logic', () => {
  assert.match(calendarStory, /\.\.\/src\/presentation\/shilohUiPrimitives\.js/);
  assert.match(calendarStory, /\.\.\/src\/presentation\/calendarUxReference\.js/);
  assert.match(spec, /calendar-reference-implementation--desktop-toolbar-and-identity/);
  assert.match(spec, /calendar-reference-implementation--phone-touch-toolbar/);
});

test('UX gate keeps Desktop and 390x844 Phone contracts explicit', () => {
  assert.match(spec, /width:\s*1280,\s*height:\s*900/);
  assert.match(spec, /width:\s*390,\s*height:\s*844/);
  assert.match(codec, /calendar-desktop\.png/);
  assert.match(codec, /calendar-phone\.png/);
  assert.ok(baselineParts('calendar-desktop').length > 0);
  assert.ok(baselineParts('calendar-phone').length > 0);
});

test('visual regression uses Playwright screenshots with bounded tolerance and inspectable artifacts', () => {
  assert.match(spec, /toHaveScreenshot/);
  assert.match(spec, /maxDiffPixelRatio:\s*0\.001/);
  assert.match(config, /artifacts\/ux-playwright-results/);
  assert.match(config, /artifacts\/ux-playwright-report/);
  assert.match(workflow, /upload-artifact@v4/);
  assert.match(workflow, /ux-visual-accessibility-evidence/);
});

test('accessibility automation fails serious configured axe violations without claiming product authority', () => {
  assert.match(spec, /@axe-core\/playwright/);
  assert.match(spec, /wcag2a/);
  assert.match(spec, /wcag2aa/);
  assert.match(spec, /serious/);
  assert.match(spec, /critical/);
});

test('baseline acceptance is fail-closed, deliberate, and stored as bounded text parts', () => {
  assert.match(workflow, /No committed reviewed UX baselines found/);
  assert.match(workflow, /\.png\.b64\.part\*/);
  assert.match(workflow, /exit 1/);
  assert.match(codec, /PART_SIZE = 12000/);
  assert.match(codec, /Missing committed UX baseline parts/);
  assert.doesNotMatch(workflow, /chromatic|percy/i);
});
