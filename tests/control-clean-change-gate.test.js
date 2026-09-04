const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

function forbiddenTemporaryArtifacts() {
  const found = [];
  const tempDir = path.join(root, '.control-temp');
  if (fs.existsSync(tempDir)) found.push('.control-temp/');

  for (const [directory, prefix] of [
    ['.github/workflows', 'control-temp-'],
    ['scripts', 'control-temp-'],
  ]) {
    const absolute = path.join(root, directory);
    if (!fs.existsSync(absolute)) continue;
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
      if (entry.name.startsWith(prefix)) found.push(`${directory}/${entry.name}`);
    }
  }
  return found.sort();
}

test('canonical governance makes Clean Change part of meaningful implementation and completion', () => {
  const rules = read('docs/SHILOH_CONTROL_RULES.md');
  assert.match(rules, /### Clean Change and Complexity Gate/);
  for (const marker of [
    '**Reuse**', '**Smallest change**', '**Permanent vs temporary**',
    '**Authority duplication**', '**One-year test**', '**Retirement**',
    '**REPLACES NOW**', '**COEXISTS FOR A REASON**', '**REPLACES LATER**',
  ]) assert.ok(rules.includes(marker), `missing Clean Change marker: ${marker}`);
  assert.match(rules, /before implementation and again before merge\/release\/reconciliation judgment/);
  assert.match(rules, /Leaving Shiloh no more complex than necessary is part of the definition of complete/);
  assert.match(rules, /compact \*\*Clean Change\*\* record/);
});

test('release tree contains no explicitly temporary Control engineering artifacts', () => {
  assert.deepEqual(forbiddenTemporaryArtifacts(), []);
});

test('canonical CI runs the focused Clean Change hygiene gate', () => {
  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /Run focused Clean Change hygiene test/);
  assert.match(ci, /node --test tests\/control-clean-change-gate\.test\.js/);
});
