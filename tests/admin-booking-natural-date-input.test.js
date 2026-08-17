const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const patchPath = path.join(__dirname, '..', 'src', 'bootstrap', 'adminBookingNaturalDatePatch.js');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

function expand(value) {
  const script = `const { expandAdminBookingDateInput } = require(${JSON.stringify(patchPath)}); process.stdout.write(expandAdminBookingDateInput(${JSON.stringify(value)}));`;
  const result = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

test('admin Other date accepts common abbreviated clinic date input', () => {
  const year = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric' }).format(new Date());
  assert.match(expand('21 Aug'), /^21\/08\/\d{4}$/);
  assert.equal(expand(`21 August ${year}`), `21/08/${year}`);
  assert.match(expand('21/08'), /^21\/08\/\d{4}$/);
});

test('invalid or unrelated text is left untouched', () => {
  assert.equal(expand('31 Feb 2026'), '31 Feb 2026');
  assert.equal(expand('admin menu'), 'admin menu');
  assert.equal(expand('21/08/2026'), '21/08/2026');
});

test('production start preloads the natural-date normalizer', () => {
  assert.match(packageJson.scripts.start, /-r \.\/src\/bootstrap\/adminBookingNaturalDatePatch\.js/);
});
