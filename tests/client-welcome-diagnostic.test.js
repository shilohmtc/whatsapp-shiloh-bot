const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  normalizeDiagnosticPhone,
  identityStatusForCount,
  getClientWelcomeDiagnostic,
} = require('../src/services/clientWelcomeDiagnostic');

const routeSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'routes', 'auditRead.js'),
  'utf8'
);

const serviceSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'services', 'clientWelcomeDiagnostic.js'),
  'utf8'
);

test('welcome diagnostic validates and normalizes phone input without returning the full number', async () => {
  assert.equal(normalizeDiagnosticPhone('+27 82 123 4567'), '27821234567');
  assert.throws(() => normalizeDiagnosticPhone('abc'), /valid WhatsApp phone number/i);

  const queries = [];
  const query = async (sql, params) => {
    queries.push({ sql, params });
    if (queries.length === 1) return { rowCount: 0, rows: [] };
    return { rowCount: 1, rows: [{ active_client_count: 0, marker_client_count: 0, marker_sent_at: null }] };
  };

  const result = await getClientWelcomeDiagnostic('+27 82 123 4567', query);
  assert.equal(result.phoneSuffix, '4567');
  assert.equal(JSON.stringify(result).includes('27821234567'), false);
});

test('welcome diagnostic reports ledger and unique canonical marker state', async () => {
  const calls = [];
  const query = async (sql, params) => {
    calls.push({ sql, params });
    if (calls.length === 1) {
      return { rowCount: 1, rows: [{ sent_at: '2026-08-19T04:00:00.000Z' }] };
    }
    return {
      rowCount: 1,
      rows: [{
        active_client_count: 1,
        marker_client_count: 1,
        marker_sent_at: '2026-08-19T04:00:00.000Z',
      }],
    };
  };

  const result = await getClientWelcomeDiagnostic('27821234567', query);
  assert.equal(result.welcomeVersion, 'v2');
  assert.deepEqual(result.ledger, { exists: true, sentAt: '2026-08-19T04:00:00.000Z' });
  assert.deepEqual(result.canonicalIdentity, { status: 'unique', activeClientCount: 1 });
  assert.deepEqual(result.canonicalMarker, {
    status: 'resolved',
    exists: true,
    sentAt: '2026-08-19T04:00:00.000Z',
  });
});

test('ambiguous identity fails closed without exposing a canonical marker timestamp', async () => {
  let call = 0;
  const query = async () => {
    call += 1;
    if (call === 1) return { rowCount: 1, rows: [{ sent_at: '2026-08-19T04:00:00.000Z' }] };
    return {
      rowCount: 1,
      rows: [{ active_client_count: 2, marker_client_count: 1, marker_sent_at: null }],
    };
  };

  const result = await getClientWelcomeDiagnostic('27821234567', query);
  assert.deepEqual(result.canonicalIdentity, { status: 'ambiguous', activeClientCount: 2 });
  assert.deepEqual(result.canonicalMarker, { status: 'ambiguous', exists: null, sentAt: null });
});

test('identity status is deterministic and does not infer a canonical client', () => {
  assert.equal(identityStatusForCount(0), 'none');
  assert.equal(identityStatusForCount(1), 'unique');
  assert.equal(identityStatusForCount(2), 'ambiguous');
  assert.equal(identityStatusForCount(99), 'ambiguous');
});

test('diagnostic implementation is SELECT-only and route is protected by auditReadAuth', async () => {
  const sqlSeen = [];
  const query = async (sql) => {
    sqlSeen.push(sql);
    if (sqlSeen.length === 1) return { rowCount: 0, rows: [] };
    return { rowCount: 1, rows: [{ active_client_count: 0, marker_client_count: 0, marker_sent_at: null }] };
  };

  await getClientWelcomeDiagnostic('27821234567', query);
  assert.equal(sqlSeen.length, 2);
  for (const sql of sqlSeen) {
    assert.match(sql.trim(), /^SELECT\b/i);
    assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE)\b/i);
  }

  assert.match(routeSource, /router\.get\("\/client-welcome\/status", auditReadAuth,/);
  assert.match(routeSource, /getClientWelcomeDiagnostic\(req\.query\.phone \|\| ""\)/);
  assert.doesNotMatch(serviceSource, /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE)\b/i);
});
