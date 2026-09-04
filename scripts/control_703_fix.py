from pathlib import Path

source = Path('src/services/workspaceClientNotifications.js')
text = source.read_text()
needle = 'entity_id=a.id::text'
count = text.count(needle)
if count < 2:
    raise SystemExit(f'expected at least 2 unsafe audit predicates, found {count}')
text = text.replace(needle, 'entity_id=a.id')
if needle in text:
    raise SystemExit('unsafe bigint/text predicate remains')
source.write_text(text)

test = Path('tests/workspace-booking-confirmation-postgres-type.test.js')
test.write_text("""const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Workspace booking-confirmation audit predicates preserve bigint appointment identity', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'workspaceClientNotifications.js'), 'utf8');
  assert.equal(source.includes('entity_id=a.id::text'), false, 'must not compare bigint audit entity_id with text appointment id');
  const safeMatches = source.match(/entity_id=a\.id(?:\s|\))/g) || [];
  assert.ok(safeMatches.length >= 2, 'appointment confirmation projections must compare audit entity_id directly to bigint appointment id');
});
""")
