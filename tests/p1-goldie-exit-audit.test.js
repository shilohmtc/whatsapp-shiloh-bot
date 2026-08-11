const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(relativePath) { return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8'); }

test('Goldie exit audit uses only read-only reconciliation paths', () => {
  const audit = source('src/services/goldieExitAudit.js');
  assert.match(audit, /runGoldieFutureImport\(\{ mode: 'dry-run' \}\)/);
  assert.match(audit, /reconcileFutureAppointmentsToGoogleCalendar\(\{ mode: 'dry-run' \}\)/);
  assert.doesNotMatch(audit, /\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
  assert.match(audit, /writesPerformed: false/);
});

test('Goldie exit public route is sanitized and read-only', () => {
  const route = source('src/routes/auditRead.js');
  assert.match(route, /\/goldie-exit\/status/);
  assert.match(route, /getGoldieExitAudit/);
  assert.match(route, /No client identity\/contact data or external keys are returned/);
});
