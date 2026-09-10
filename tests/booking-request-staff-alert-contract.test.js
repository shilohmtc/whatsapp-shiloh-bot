const test = require('node:test');
const assert = require('node:assert/strict');
const { getShilohMessageContract } = require('../src/services/shilohMessageContracts');
const { getMetaTemplateBindingSpec, buildMetaTemplateContractView } = require('../src/services/metaTemplateAdapter');
const alerts = require('../src/services/bookingRequestStaffAlerts');

function fakeAlertDb() {
  const state = new Map();
  return {
    state,
    async query(sql, params = []) {
      if (sql.includes('FROM appointment_booking_approvals aba') && sql.includes('requested_starts_at')) {
        return { rowCount: 1, rows: [{
          appointment_id: 501,
          status: 'pending',
          requested_staff_id: 3,
          requested_starts_at: '2026-09-10T08:00:00Z',
          staff_name: 'Practitioner',
          team_id: 11,
          team_name: 'Team Eleven',
        }] };
      }
      if (sql.includes('FROM staff_admin_accounts a')) {
        return { rowCount: 1, rows: [{
          admin_id: 100,
          normalized_whatsapp: '27820000000',
          display_name: 'Reception',
          effective_scope: 'global',
          team_id: null,
          pending_count: 4,
        }] };
      }
      if (sql.includes('INSERT INTO booking_request_staff_alerts')) {
        const key = `${params[0]}:${params[1]}`;
        if (!state.has(key)) state.set(key, { status: 'pending', attempt_count: 0, last_attempt_at: null });
        return { rowCount: 1, rows: [] };
      }
      if (sql.includes("SET status='sending'")) {
        const key = `${params[0]}:${params[1]}`;
        const row = state.get(key);
        if (!row || row.status === 'sent' || row.attempt_count >= params[3]) return { rowCount: 0, rows: [] };
        if (row.status === 'failed' && row.last_attempt_at && row.last_attempt_at > params[4]) return { rowCount: 0, rows: [] };
        row.status = 'sending';
        row.attempt_count += 1;
        row.last_attempt_at = params[2];
        return { rowCount: 1, rows: [{ appointment_id: params[0], admin_id: params[1], attempt_count: row.attempt_count }] };
      }
      if (sql.includes("SET status='sent'")) {
        const row = state.get(`${params[0]}:${params[1]}`);
        row.status = 'sent';
        row.provider_message_id = params[2];
        return { rowCount: 1, rows: [] };
      }
      if (sql.includes("SET status='failed'")) {
        const row = state.get(`${params[0]}:${params[1]}`);
        row.status = 'failed';
        row.last_error_code = params[2];
        return { rowCount: 1, rows: [] };
      }
      throw new Error(`Unexpected alert SQL: ${sql.slice(0, 100)}`);
    },
  };
}

test('booking-request staff alert reuses the canonical current proactive Utility contract with only Open Workspace action', () => {
  const contract = getShilohMessageContract('workspace_booking_request_alert');
  assert.equal(contract.lifecycle, 'current');
  assert.equal(contract.sendable, true);
  assert.equal(contract.message.category, 'UTILITY');
  const binding = getMetaTemplateBindingSpec('workspace_booking_request_alert');
  assert.equal(binding.templateName, 'shiloh_workspace_booking_request_alert_v1');
  assert.equal(binding.defaultWhenUnset, false);
  const definition = buildMetaTemplateContractView('workspace_booking_request_alert');
  const buttons = definition.components.find(component => String(component.type).toUpperCase() === 'BUTTONS')?.buttons || [];
  assert.deepEqual(buttons.map(button => button.text), ['Open Workspace']);
  assert.doesNotMatch(JSON.stringify(definition), /Approve|Decline|booking_approval_(?:approve|decline)/i);
});

test('default staff alert sender uses canonical template delivery with staff_open_workspace payload', async () => {
  assert.equal(alerts.STAFF_ALERT_TEMPLATE, 'shiloh_workspace_booking_request_alert_v1');
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '../src/services/bookingRequestStaffAlerts.js'), 'utf8');
  assert.match(source, /sendWhatsAppTemplate/);
  assert.match(source, /staff_open_workspace/);
  assert.match(source, /pending_count/);
  assert.doesNotMatch(source, /sendWhatsAppReplyButtons/);
  assert.doesNotMatch(source, /booking_approval_(?:approve|decline)/);
  assert.doesNotMatch(source, /shiloh_booking_request_staff_alert_v1/);
});

test('one successful initial alert per request/recipient is replay-safe', async () => {
  const db = fakeAlertDb();
  let sends = 0;
  const sendAlert = async () => {
    sends += 1;
    return { messages: [{ id: `wamid.${sends}` }] };
  };
  const first = await alerts.dispatchBookingRequestAlerts({ db, appointmentId: 501, now: new Date('2026-09-09T08:00:00Z'), sendAlert });
  const second = await alerts.dispatchBookingRequestAlerts({ db, appointmentId: 501, now: new Date('2026-09-09T08:05:00Z'), sendAlert });
  assert.equal(first.sent, 1);
  assert.equal(second.sent, 0);
  assert.equal(sends, 1);
  assert.equal(db.state.get('501:100').status, 'sent');
});

test('failed alerts respect retry backoff and bounded attempts', async () => {
  const db = fakeAlertDb();
  let sends = 0;
  const sendAlert = async () => {
    sends += 1;
    throw Object.assign(new Error('provider unavailable'), { code: 'PROVIDER_DOWN' });
  };
  await alerts.dispatchBookingRequestAlerts({ db, appointmentId: 501, now: new Date('2026-09-09T08:00:00Z'), sendAlert });
  await alerts.dispatchBookingRequestAlerts({ db, appointmentId: 501, now: new Date('2026-09-09T08:05:00Z'), sendAlert });
  assert.equal(sends, 1);
  await alerts.dispatchBookingRequestAlerts({ db, appointmentId: 501, now: new Date('2026-09-09T08:16:00Z'), sendAlert });
  await alerts.dispatchBookingRequestAlerts({ db, appointmentId: 501, now: new Date('2026-09-09T08:32:00Z'), sendAlert });
  await alerts.dispatchBookingRequestAlerts({ db, appointmentId: 501, now: new Date('2026-09-09T08:48:00Z'), sendAlert });
  assert.equal(sends, alerts.MAX_ATTEMPTS);
  assert.equal(db.state.get('501:100').attempt_count, alerts.MAX_ATTEMPTS);
});
