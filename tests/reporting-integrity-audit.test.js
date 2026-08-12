const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

const audit = source('src/services/reportingIntegrityAudit.js');
const route = source('src/routes/auditRead.js');

test('reporting integrity audit is limited to Christel Abigail and required periods', () => {
  assert.match(audit, /AUDITED_STAFF = Object\.freeze\(\['Christel', 'Abigail'\]\)/);
  assert.match(audit, /AUDITED_PERIODS = Object\.freeze\(\['today', 'week', 'last_week', 'month'\]\)/);
  assert.match(audit, /client_bookable=TRUE/);
  assert.match(audit, /earningsIntegrity/);
});

test('public reporting audit exposes only sanitized counts and no earnings values or client detail', () => {
  assert.match(audit, /pendingFinalStatusCount/);
  assert.match(audit, /unresolvedLegacyCount/);
  assert.match(audit, /no_client_identity_no_earnings_amounts/);
  assert.doesNotMatch(audit, /unresolvedGoldieValue/);
  assert.doesNotMatch(audit, /client_name|source_payload|total_price|price\b/i);
});

test('reporting audit is read-only', () => {
  assert.doesNotMatch(audit, /\bINSERT\b|\bUPDATE\b|\bDELETE\b/i);
  assert.match(audit, /SELECT id, display_name/);
});

test('sanitized reporting integrity status is mounted on the established audit-read surface', () => {
  assert.match(route, /getReportingIntegrityAudit/);
  assert.match(route, /router\.get\("\/reporting-integrity\/status"/);
  assert.match(route, /Could not build reporting integrity audit/);
});
