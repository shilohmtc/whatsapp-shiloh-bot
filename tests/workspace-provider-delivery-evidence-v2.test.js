const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  providerEventTime,
  createWhatsAppStatusEvidenceService,
} = require('../src/services/whatsappStatusEvidence');
const {
  createWhatsAppStatusWebhookController,
} = require('../src/controllers/whatsappStatusWebhookController');

function evidenceDb() {
  const known = new Set(['wamid.synthetic-1']);
  const state = new Map();
  return {
    calls: [],
    state,
    async query(sql, values) {
      this.calls.push({ sql, values });
      const [id, occurredAt, providerError] = values;
      if (!known.has(id)) return { rows: [], rowCount: 0 };
      const row = state.get(id) || {};
      const match = sql.match(/SET (provider_(?:sent|delivered|read|failed)_at)=COALESCE/);
      assert.ok(match, 'persistence must update one whitelisted provider timestamp column');
      const column = match[1];
      if (!row[column]) row[column] = occurredAt;
      if (providerError && !row.provider_error) row.provider_error = JSON.parse(providerError);
      state.set(id, row);
      return { rows: [{ appointment_id: 620, message_kind: 'booking_confirmation' }], rowCount: 1 };
    },
  };
}

test('provider callback epoch timestamps are converted safely with a receipt-time fallback', () => {
  assert.equal(providerEventTime('1788467000').toISOString(), '2026-09-03T20:23:20.000Z');
  assert.equal(providerEventTime('not-a-timestamp', new Date('2026-09-03T20:30:00Z')).toISOString(), '2026-09-03T20:30:00.000Z');
});

test('provider evidence persists by exact provider message id and duplicate callbacks are idempotent', async () => {
  const db = evidenceDb();
  const service = createWhatsAppStatusEvidenceService({ db, now: () => new Date('2026-09-03T20:30:00Z') });

  const first = await service.persistStatus({
    metaMessageId: 'wamid.synthetic-1',
    providerStatus: 'delivered',
    providerTimestamp: '1788467000',
  });
  const duplicate = await service.persistStatus({
    metaMessageId: 'wamid.synthetic-1',
    providerStatus: 'delivered',
    providerTimestamp: '1788467010',
  });
  const failed = await service.persistStatus({
    metaMessageId: 'wamid.synthetic-1',
    providerStatus: 'failed',
    providerTimestamp: '1788467020',
    providerError: { code: '131000', title: 'Synthetic failure', message: 'Synthetic provider failure' },
  });
  const unknown = await service.persistStatus({
    metaMessageId: 'wamid.unknown',
    providerStatus: 'read',
    providerTimestamp: '1788467030',
  });

  assert.equal(first.matched, 1);
  assert.equal(duplicate.matched, 1);
  assert.equal(failed.matched, 1);
  assert.equal(unknown.matched, 0);
  assert.match(db.calls[0].sql, /WHERE provider_message_id=\$1/);
  assert.match(db.calls[0].sql, /COALESCE\(provider_delivered_at, \$2::timestamptz\)/);
  assert.equal(db.state.get('wamid.synthetic-1').provider_delivered_at, '2026-09-03T20:23:20.000Z');
  assert.equal(db.state.get('wamid.synthetic-1').provider_failed_at, '2026-09-03T20:23:40.000Z');
  assert.equal(db.state.get('wamid.synthetic-1').provider_error.code, '131000');
});

test('webhook persists sanitized statuses but persistence failure never blocks inbound message handling', async () => {
  let persisted = null;
  let nextCalls = 0;
  const logCalls = [];
  const controller = createWhatsAppStatusWebhookController({
    async persistStatuses(records) {
      persisted = records;
      throw new Error('synthetic database outage');
    },
  });
  const req = {
    log: {
      info(fields, message) { logCalls.push({ level: 'info', fields, message }); },
      warn(fields, message) { logCalls.push({ level: 'warn', fields, message }); },
    },
    body: {
      entry: [{ changes: [{ value: {
        statuses: [{ id: 'wamid.synthetic-1', status: 'delivered', timestamp: '1788467000' }],
        messages: [{ id: 'wamid.inbound-1' }],
      } }] }],
    },
  };
  const res = { sendStatus() { assert.fail('mixed status/message webhook must continue to inbound handler'); } };

  await controller(req, res, () => { nextCalls += 1; });

  assert.equal(nextCalls, 1);
  assert.equal(persisted.length, 1);
  assert.equal(persisted[0].providerStatus, 'delivered');
  assert.ok(logCalls.some(item => /persistence failed safely/i.test(item.message)));
});

test('status-only webhook still acknowledges Meta when evidence persistence fails', async () => {
  let responseStatus = null;
  const controller = createWhatsAppStatusWebhookController({
    async persistStatuses() { throw new Error('synthetic database outage'); },
  });
  const req = {
    log: { info() {}, warn() {} },
    body: { entry: [{ changes: [{ value: {
      statuses: [{ id: 'wamid.synthetic-1', status: 'read', timestamp: '1788467000' }],
    } }] }] },
  };
  const res = { sendStatus(status) { responseStatus = status; return status; } };

  await controller(req, res, () => assert.fail('status-only webhook must terminate with 200'));
  assert.equal(responseStatus, 200);
});

test('migration 096 is additive provider evidence and preserves Shiloh delivery status authority', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'migrations', '096_whatsapp_provider_delivery_evidence.sql'), 'utf8');
  assert.match(sql, /ADD COLUMN IF NOT EXISTS provider_sent_at TIMESTAMPTZ/);
  assert.match(sql, /provider_delivered_at TIMESTAMPTZ/);
  assert.match(sql, /provider_read_at TIMESTAMPTZ/);
  assert.match(sql, /provider_failed_at TIMESTAMPTZ/);
  assert.match(sql, /provider_error JSONB/);
  assert.match(sql, /provider_message_id/);
  assert.doesNotMatch(sql, /DROP CONSTRAINT|UPDATE\s+customer_message_deliveries\s+SET\s+status|ALTER COLUMN status/i);
});
