const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { resolveImageKey, resolveServiceImageUrl } = require('../src/services/serviceImageMap');

test('all 49 seeded active services resolve to approved imagery', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '039_service_customer_descriptions.sql'), 'utf8');
  const names = [...sql.matchAll(/WHEN '((?:''|[^'])+)' THEN/g)].map((m) => m[1].replace(/''/g, "'"));
  const unique = [...new Set(names)];
  assert.equal(unique.length, 49);
  for (const name of unique) {
    assert.ok(resolveImageKey(name), `Missing image mapping for ${name}`);
    assert.match(resolveServiceImageUrl(name), /^\/assets\/service-images\/[a-z0-9-]+\.webp$/);
  }
});

test('unknown future services fail closed instead of inheriting misleading imagery', () => {
  assert.equal(resolveImageKey('Future Unreviewed Service'), null);
  assert.equal(resolveServiceImageUrl('Future Unreviewed Service'), null);
});

test('all 12 Shiloh-controlled image assets are present', () => {
  const expected = [
    'massage-general','hot-stone','foot-care','facial-general','facial-premium','microneedling',
    'permanent-makeup','advanced-aesthetics','consultation','wellness-heat','facial-technology','facial-device',
  ];
  for (const key of expected) {
    const file = path.join(__dirname, '..', 'public', 'service-images', `${key}.webp`);
    assert.ok(fs.existsSync(file), `Missing ${key}.webp`);
    assert.ok(fs.statSync(file).size > 10_000, `${key}.webp is unexpectedly small`);
  }
});
