from pathlib import Path

source = Path('src/services/customerBookingConfirmation.js')
text = source.read_text()
needle = "audit.entity_type='appointment' AND audit.entity_id=a.id::text"
replacement = "audit.entity_type='appointment' AND audit.entity_id=a.id"
count = text.count(needle)
if count != 1:
    raise SystemExit(f'expected exactly one unsafe recovery audit predicate, found {count}')
text = text.replace(needle, replacement)
source.write_text(text)

test = Path('tests/workspace-booking-confirmation-postgres-type.test.js')
content = test.read_text()
if "customerBookingConfirmation.js" not in content:
    content += """

test('Canonical booking-confirmation recovery preserves bigint appointment identity', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'customerBookingConfirmation.js'), 'utf8');
  assert.equal(source.includes('audit.entity_id=a.id::text'), false, 'recovery must not compare bigint audit entity_id with text appointment id');
  assert.match(source, /customerBookingConfirmation:recoveryState[\\s\\S]*audit\\.entity_id=a\\.id(?:\\s|\\))/);
});
"""
test.write_text(content)
