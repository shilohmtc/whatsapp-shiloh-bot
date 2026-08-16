const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const service = fs.readFileSync(path.join(root, 'src/services/historicalFinalizationAudit.js'), 'utf8');
const routes = fs.readFileSync(path.join(root, 'src/routes/auditRead.js'), 'utf8');

test('historical finalization audit is fixed to the approved August 1-15 window and read-only', () => {
  assert.match(service, /WINDOW_START = '2026-08-01'/);
  assert.match(service, /WINDOW_END = '2026-08-15'/);
  assert.match(service, /SELECT a\.id/);
  assert.doesNotMatch(service, /\b(?:UPDATE|INSERT|DELETE)\b/i);
  assert.doesNotMatch(service, /sendWhatsApp|createBookingEvent|cancelBookingEvent/);
});

test('audit classifies Christel-Abigail and Marietjie finalization ownership fail-closed', () => {
  assert.match(service, /CHRISTEL_POOL = new Set\(\['christel', 'abigail'\]\)/);
  assert.match(service, /finalizer: 'Christel'/);
  assert.match(service, /name === 'marietjie'/);
  assert.match(service, /finalizer: 'Marietjie'/);
  assert.match(service, /missing_or_orphaned_practitioner/);
  assert.match(service, /mixed_or_unsupported_practitioner_scope/);
  assert.match(service, /complete: counts\.failClosed === 0/);
});

test('temporary audit status route is sanitized and no-store', () => {
  assert.match(routes, /\/historical-finalization\/status/);
  assert.match(routes, /getHistoricalFinalizationAudit/);
  assert.match(routes, /Cache-Control/);
  assert.doesNotMatch(service, /client_name|display_name.*client|mobile|whatsapp|email/i);
});
