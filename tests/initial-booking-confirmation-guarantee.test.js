const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const confirmation = require('../src/services/customerBookingConfirmation');
const { customerConfirmationState } = require('../src/routes/calendarCreateBooking');

const ROOT = path.join(__dirname, '..');
const STARTS_AT = '2026-08-28T08:15:00.000Z';
const ENDS_AT = '2026-08-28T09:15:00.000Z';

function memoryDeliveryDb({
  appointmentId = 901,
  clientId = 101,
  clientStatus = 'active',
  contactId = 501,
  phone = '27820000001',
  nameAuthorityId = 301,
  source = 'shiloh_calendar',
} = {}) {
  const state = {
    appointment: {
      id: appointmentId,
      client_id: clientId,
      starts_at: STARTS_AT,
      ends_at: ENDS_AT,
      source,
      location_name: 'Shiloh',
      service_name: 'Deep Tissue Massage',
      staff_name: 'Christel',
    },
    authority: {
      appointment_id: appointmentId,
      client_id: clientId,
      client_status: clientStatus,
      contact_id: contactId,
      client_phone: phone,
      name_authority_id: nameAuthorityId,
    },
    delivery: null,
    audits: [],
    calls: [],
    token: null,
    snapshot: null,
  };

  function clone(value) { return structuredClone(value); }

  const db = {
    state,
    async query(sql, params = []) {
      const q = String(sql).replace(/\s+/g, ' ').trim();
      state.calls.push({ sql: q, params: clone(params) });
      if (q === 'BEGIN') {
        state.snapshot = clone({ delivery: state.delivery, audits: state.audits, token: state.token });
        return { rows: [], rowCount: 0 };
      }
      if (q === 'COMMIT') { state.snapshot = null; return { rows: [], rowCount: 0 }; }
      if (q === 'ROLLBACK') {
        if (state.snapshot) {
          state.delivery = state.snapshot.delivery;
          state.audits.splice(0, state.audits.length, ...state.snapshot.audits);
          state.token = state.snapshot.token;
        }
        state.snapshot = null;
        return { rows: [], rowCount: 0 };
      }
      if (q.includes("action='customer.booking_confirmation_sent'") && q.startsWith('SELECT 1')) {
        const sent = state.audits.some((event) => event.action === 'customer.booking_confirmation_sent');
        return { rows: sent ? [{ '?column?': 1 }] : [], rowCount: sent ? 1 : 0 };
      }
      if (q.startsWith('SELECT a.id AS appointment_id')) {
        return state.appointment && Number(params[0]) === Number(state.appointment.id)
          ? { rows: [{ ...state.authority }], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      if (q.startsWith('INSERT INTO customer_message_deliveries')) {
        if (state.delivery) return { rows: [], rowCount: 0 };
        state.delivery = {
          appointment_id: Number(params[0]),
          message_kind: 'booking_confirmation',
          status: params[1],
          client_id: Number(params[2]),
          contact_id: params[3] == null ? null : Number(params[3]),
          name_authority_id: params[4] == null ? null : Number(params[4]),
          last_error: params[5] || null,
          attempt_count: 0,
          provider_message_id: null,
          template_name: null,
        };
        return { rows: [{ appointment_id: state.delivery.appointment_id, status: state.delivery.status }], rowCount: 1 };
      }
      if (q.startsWith("INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata) VALUES('customer.booking_confirmation_queued'")) {
        state.audits.push({ action: 'customer.booking_confirmation_queued', appointmentId: Number(params[0]), metadata: JSON.parse(params[1]) });
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('SELECT status,last_error FROM customer_message_deliveries')) {
        return { rows: state.delivery ? [{ status: state.delivery.status, last_error: state.delivery.last_error }] : [], rowCount: state.delivery ? 1 : 0 };
      }
      if (q.startsWith('UPDATE customer_message_deliveries SET status=\'sending\'')) {
        if (!state.delivery || !['pending', 'failed'].includes(state.delivery.status) || state.delivery.retry_due === false) return { rows: [], rowCount: 0 };
        state.delivery.status = 'sending';
        state.delivery.attempt_count += 1;
        state.delivery.last_error = null;
        state.delivery.retry_due = false;
        state.delivery.client_id = Number(params[1] || state.delivery.client_id);
        state.delivery.contact_id = params[2] == null ? state.delivery.contact_id : Number(params[2]);
        state.delivery.name_authority_id = params[3] == null ? state.delivery.name_authority_id : Number(params[3]);
        return { rows: [{ appointment_id: state.delivery.appointment_id }], rowCount: 1 };
      }
      if (q.startsWith("UPDATE customer_message_deliveries SET status='sent'")) {
        if (!state.delivery) return { rows: [], rowCount: 0 };
        state.delivery.status = 'sent';
        state.delivery.last_error = null;
        if (params.length >= 3) {
          state.delivery.template_name = params[1];
          state.delivery.provider_message_id = params[2];
        }
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('UPDATE customer_message_deliveries SET status=\'failed\'')) {
        if (!state.delivery) return { rows: [], rowCount: 0 };
        state.delivery.status = 'failed';
        state.delivery.last_error = params[1];
        state.delivery.retry_due = false;
        if (q.includes('attempt_count=attempt_count+1')) state.delivery.attempt_count += 1;
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith("UPDATE customer_message_deliveries SET status='uncertain'")) {
        if (!state.delivery) return { rows: [], rowCount: 0 };
        state.delivery.status = 'uncertain';
        state.delivery.last_error = 'provider_delivery_unknown';
        state.delivery.retry_due = false;
        return { rows: [], rowCount: 1 };
      }
      if (q.startsWith('SELECT token FROM appointment_calendar_share_tokens')) {
        return { rows: state.token ? [{ token: state.token }] : [], rowCount: state.token ? 1 : 0 };
      }
      if (q.startsWith('INSERT INTO appointment_calendar_share_tokens')) {
        state.token = params[1];
        return { rows: [{ token: state.token }], rowCount: 1 };
      }
      if (q.startsWith('SELECT a.id,a.client_id,a.starts_at')) {
        return state.appointment
          ? { rows: [{ ...state.appointment }], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }
      if (q.startsWith("INSERT INTO crm_audit_events (action,entity_type,entity_id,metadata) VALUES ('customer.booking_confirmation_sent'")) {
        state.audits.push({ action: 'customer.booking_confirmation_sent', appointmentId: Number(params[0]), metadata: JSON.parse(params[1]) });
        return { rows: [], rowCount: 1 };
      }
      throw new Error(`Unhandled confirmation test SQL: ${q}`);
    },
  };
  return db;
}

function deliveryOptions(db, provider) {
  return {
    db,
    env: {
      WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE: 'shiloh_booking_confirmation_v2',
      WHATSAPP_TEMPLATE_LANGUAGE: 'en',
    },
    sendTemplate: provider,
    sendMessage: async () => { throw new Error('configured v2 must use the approved template'); },
    sendCta: async () => { throw new Error('v2 suppresses supplemental CTA messages'); },
    sendButtons: async () => { throw new Error('v2 suppresses supplemental button messages'); },
    enrollLifecycle: async () => ({ id: 1 }),
    resolveName: async (clientId) => ({ name: 'Ma Marinda', authorityId: clientId === 101 ? 301 : null }),
  };
}

test('browser booking commit durably queues exactly one initial confirmation before transaction commit', async () => {
  const db = memoryDeliveryDb();
  await db.query('BEGIN');
  const first = await confirmation.queueCustomerBookingConfirmation(901, { db });
  const replay = await confirmation.queueCustomerBookingConfirmation(901, { db });
  await db.query('COMMIT');

  assert.equal(first.queued, true);
  assert.equal(first.status, 'pending');
  assert.equal(replay.queued, false);
  assert.equal(db.state.delivery.appointment_id, 901);
  assert.equal(db.state.delivery.client_id, 101);
  assert.equal(db.state.delivery.contact_id, 501);
  assert.equal(db.state.delivery.name_authority_id, 301);
  assert.equal(db.state.audits.filter((event) => event.action === 'customer.booking_confirmation_queued').length, 1);

  const adminBooking = fs.readFileSync(path.join(ROOT, 'src/services/adminBooking.js'), 'utf8');
  const commitSegment = adminBooking.slice(adminBooking.indexOf('const appointmentResult'), adminBooking.indexOf('return {\n      status: "created"'));
  const appointmentInsert = commitSegment.indexOf('INSERT INTO appointments');
  const obligation = commitSegment.indexOf('queueCustomerBookingConfirmation(appointment.id, { db })');
  const commit = commitSegment.indexOf('await db.query("COMMIT")');
  const attempt = commitSegment.indexOf('sendCustomerBookingConfirmationForAppointment(appointment.id)');
  assert.ok(appointmentInsert >= 0 && obligation > appointmentInsert && commit > obligation && attempt > commit);
  assert.match(adminBooking, /CLIENT CONFIRMATION NOT SENT/);
  assert.match(adminBooking, /CLIENT CONFIRMATION DELIVERY STATUS UNCERTAIN/);
});

test('committed appointment sends the approved initial template with authoritative client, contact and booking details once', async () => {
  const db = memoryDeliveryDb();
  const providerCalls = [];
  const provider = async (...args) => {
    providerCalls.push(args);
    return { messages: [{ id: 'wamid.initial.901' }] };
  };

  const first = await confirmation.sendCustomerBookingConfirmationForAppointment(901, deliveryOptions(db, provider));
  const replay = await confirmation.sendCustomerBookingConfirmationForAppointment(901, deliveryOptions(db, provider));

  assert.equal(first.sent, true);
  assert.equal(first.deliveryStatus, 'sent');
  assert.equal(replay.sent, false);
  assert.equal(replay.reason, 'already_sent');
  assert.equal(providerCalls.length, 1);
  assert.equal(providerCalls[0][0], '27820000001');
  assert.equal(providerCalls[0][1], 'shiloh_booking_confirmation_v2');
  assert.deepEqual(providerCalls[0][2], [
    'Ma Marinda',
    'Deep Tissue Massage',
    'Christel',
    'Friday, 28 August 2026',
    '10:15–11:15',
  ]);
  assert.deepEqual(providerCalls[0][4], [
    'client_booking_confirmation_v2_calendar_901',
    'client_booking_confirmation_v2_manage_901',
    'client_postbook_my_appointments',
  ]);
  assert.equal(db.state.delivery.status, 'sent');
  assert.equal(db.state.delivery.provider_message_id, 'wamid.initial.901');
  assert.equal(db.state.delivery.attempt_count, 1);
  assert.equal(db.state.audits.filter((event) => event.action === 'customer.booking_confirmation_sent').length, 1);
  assert.equal(JSON.stringify(db.state.delivery).includes('27820000001'), false);
  assert.equal(JSON.stringify(db.state.audits).includes('27820000001'), false);
});

test('concurrent refresh or replay can claim only one initial confirmation provider send', async () => {
  const db = memoryDeliveryDb({ appointmentId: 904 });
  const providerCalls = [];
  let releaseProvider;
  const providerGate = new Promise((resolve) => { releaseProvider = resolve; });
  const provider = async (...args) => {
    providerCalls.push(args);
    await providerGate;
    return { messages: [{ id: 'wamid.initial.904' }] };
  };
  const options = deliveryOptions(db, provider);
  const first = confirmation.sendCustomerBookingConfirmationForAppointment(904, options);
  const competing = confirmation.sendCustomerBookingConfirmationForAppointment(904, options);
  await new Promise((resolve) => setImmediate(resolve));
  releaseProvider();
  const results = await Promise.all([first, competing]);

  assert.equal(results.filter((result) => result.sent === true).length, 1);
  assert.equal(providerCalls.length, 1);
  assert.equal(db.state.delivery.status, 'sent');
  assert.equal(db.state.delivery.attempt_count, 1);
  assert.equal(db.state.audits.filter((event) => event.action === 'customer.booking_confirmation_sent').length, 1);
});

test('definitive transport failure remains durable and retryable without a duplicate obligation', async () => {
  const db = memoryDeliveryDb({ appointmentId: 902 });
  let attempts = 0;
  const provider = async () => {
    attempts += 1;
    if (attempts === 1) {
      const error = new Error('provider unavailable');
      error.response = { status: 503 };
      throw error;
    }
    return { messages: [{ id: 'wamid.initial.902' }] };
  };
  const options = deliveryOptions(db, provider);

  const failed = await confirmation.sendCustomerBookingConfirmationForAppointment(902, options);
  assert.equal(failed.sent, false);
  assert.equal(failed.deliveryStatus, 'retry_pending');
  assert.equal(db.state.delivery.status, 'failed');
  assert.equal(db.state.delivery.last_error, 'provider_rejected');

  db.state.delivery.retry_due = true;
  const retried = await confirmation.sendCustomerBookingConfirmationForAppointment(902, options);
  assert.equal(retried.sent, true);
  assert.equal(db.state.delivery.status, 'sent');
  assert.equal(db.state.delivery.attempt_count, 2);
  assert.equal(attempts, 2);
  assert.equal(db.state.audits.filter((event) => event.action === 'customer.booking_confirmation_queued').length, 1);
});

test('ambiguous transport result becomes actionable uncertain state and is never automatically replayed', async () => {
  const db = memoryDeliveryDb({ appointmentId: 905 });
  let attempts = 0;
  const result = await confirmation.sendCustomerBookingConfirmationForAppointment(905, deliveryOptions(db, async () => {
    attempts += 1;
    throw new Error('network response lost');
  }));

  assert.equal(result.sent, false);
  assert.equal(result.deliveryStatus, 'uncertain');
  assert.equal(result.retryable, false);
  assert.equal(db.state.delivery.status, 'uncertain');
  assert.equal(db.state.delivery.last_error, 'provider_delivery_unknown');
  assert.deepEqual(customerConfirmationState({ customerConfirmation: result }), {
    status: 'delivery_status_uncertain',
    sent: false,
    retryable: false,
    reason: 'delivery_state_uncertain',
  });
  const ux = fs.readFileSync(path.join(ROOT, 'src/presentation/calendarCreateBookingUx.js'), 'utf8');
  assert.match(ux, /CLIENT CONFIRMATION DELIVERY STATUS UNCERTAIN/);
  assert.match(ux, /Verify with the client before resending/);

  const replay = await confirmation.sendCustomerBookingConfirmationForAppointment(905, deliveryOptions(db, async () => {
    attempts += 1;
    return { messages: [{ id: 'must-not-retry' }] };
  }));
  assert.equal(replay.sent, false);
  assert.equal(attempts, 1);
});

test('missing contact and inactive canonical authority fail visibly without selecting a same-name duplicate', async () => {
  for (const fixture of [
    { contactId: null, phone: null, expected: 'client_contact_not_found' },
    { nameAuthorityId: null, expected: 'client_name_authority_not_found' },
    { clientStatus: 'inactive', expected: 'canonical_client_inactive' },
  ]) {
    const db = memoryDeliveryDb(fixture);
    let providerCalls = 0;
    const result = await confirmation.sendCustomerBookingConfirmationForAppointment(901, deliveryOptions(db, async () => {
      providerCalls += 1;
      return { messages: [{ id: 'must-not-send' }] };
    }));
    assert.equal(result.sent, false);
    assert.equal(result.reason, fixture.expected);
    assert.equal(result.deliveryStatus, 'manual_action_required');
    assert.equal(providerCalls, 0);
    assert.equal(db.state.delivery.client_id, 101);
    assert.equal(db.state.delivery.status, 'failed');
    assert.deepEqual(customerConfirmationState({ customerConfirmation: result }), {
      status: 'manual_action_required',
      sent: false,
      retryable: true,
      reason: fixture.expected,
    });
  }

  const authoritySql = fs.readFileSync(path.join(ROOT, 'src/services/customerBookingConfirmation.js'), 'utf8');
  assert.match(authoritySql, /JOIN clients c ON c\.id=a\.client_id/);
  assert.match(authoritySql, /WHERE cc\.client_id=c\.id/);
  assert.doesNotMatch(authoritySql, /WHERE[^`]*(?:display_name|current_name)\s*=\s*\$1/i);
  const ux = fs.readFileSync(path.join(ROOT, 'src/presentation/calendarCreateBookingUx.js'), 'utf8');
  assert.match(ux, /BOOKED — CLIENT CONFIRMATION NOT SENT/);
});

test('rolled-back or failed booking cannot retain an initial confirmation obligation', async () => {
  const db = memoryDeliveryDb({ appointmentId: 903 });
  await db.query('BEGIN');
  await confirmation.queueCustomerBookingConfirmation(903, { db });
  await db.query('ROLLBACK');
  assert.equal(db.state.delivery, null);
  assert.equal(db.state.audits.length, 0);

  const adminBooking = fs.readFileSync(path.join(ROOT, 'src/services/adminBooking.js'), 'utf8');
  assert.match(adminBooking, /catch \(error\) \{[\s\S]*await db\.query\("ROLLBACK"\)/);
});

test('migration 083 upgrades only initial-confirmation delivery evidence and preserves independent workstreams', () => {
  const migration = fs.readFileSync(path.join(ROOT, 'migrations/083_initial_booking_confirmation_guarantee.sql'), 'utf8');
  assert.match(migration, /customer_message_deliveries_status_check/);
  assert.match(migration, /'pending', 'sending', 'sent', 'failed', 'uncertain'/);
  assert.match(migration, /attempt_count/);
  assert.match(migration, /next_attempt_at/);
  assert.match(migration, /contact_id/);
  assert.match(migration, /name_authority_id/);
  assert.doesNotMatch(migration, /staff_totp|staff_auth|emergency_calendar_bootstrap/i);
});
