const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const earnings = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminMarietjieEarnings.js'), 'utf8');
const menu = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminInteractiveMenu.js'), 'utf8');

test('Marietjie can view her own earnings while Christel and Jean-Pierre remain authorized', () => {
  assert.match(earnings, /const marietjieSelf = name === 'marietjie'/);
  assert.match(earnings, /String\(admin\.staff_id \|\| ''\) === String\(marietjie\.id\)/);
  assert.match(earnings, /return christel \|\| jeanPierre \|\| marietjieSelf/);
});

test('Marietjie own admin Reports menu exposes Marietjie earnings', () => {
  assert.match(menu, /function isMarietjieAdmin/);
  assert.match(menu, /const marietjie = isMarietjieAdmin\(result\.admin\)/);
  assert.match(menu, /💰 Marietjie earnings/);
  assert.match(menu, /marietjieEarningsButtons/);
});
