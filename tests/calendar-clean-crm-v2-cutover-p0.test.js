const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const confirmation = require('../src/services/customerBookingConfirmation');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('085 is the smallest expand-only compatibility seam and performs no data mutation or backfill', () => {
  const sql = read('migrations/085_calendar_clean_crm_v2_cutover.sql');
  assert.match(sql, /ALTER COLUMN client_id DROP NOT NULL/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS crm_v2_client_id BIGINT/);
  assert.match(sql, /admin_booking_sessions_one_client_model_check/);
  assert.match(sql, /customer_message_deliveries_v2_recipient_check/);
  assert.doesNotMatch(sql, /\b(?:UPDATE|INSERT\s+INTO|DELETE\s+FROM)\b/i);
  assert.doesNotMatch(sql, /ALTER TABLE appointments|crm_v2_client_id\s*=|FROM clients|JOIN clients/i);
  assert.match(read('app.js'), /verifyMigrationState\(\)/);
  assert.doesNotMatch(read('app.js'), /applyMigrationFile/);
});

test('V2 final commit orders all canonical checks, last identity reread, appointment write, durable queue and commit', () => {
  const source = read('src/services/adminBooking.js');
  const start = source.indexOf('async function confirmCalendarV2Booking');
  const end = source.indexOf('\nmodule.exports', start);
  const cutover = source.slice(start, end);
  const conflict = cutover.indexOf('await getConflicts');
  const finalRead = cutover.indexOf('FROM crm_v2_clients');
  const appointmentWrite = cutover.indexOf('INSERT INTO appointments');
  const durableQueue = cutover.indexOf('queueCustomerBookingConfirmation(appointment.id, { db })');
  const commit = cutover.indexOf('await db.query("COMMIT")', durableQueue);
  const providerAttempt = cutover.indexOf('sendCustomerBookingConfirmationForAppointment(appointment.id)');
  assert.ok(start >= 0 && conflict >= 0);
  assert.ok(finalRead > conflict);
  assert.ok(appointmentWrite > finalRead);
  assert.ok(durableQueue > appointmentWrite);
  assert.ok(commit > durableQueue);
  assert.ok(providerAttempt > commit);
  assert.match(cutover, /FROM crm_v2_clients[\s\S]*FOR UPDATE/);
  assert.match(cutover, /finalClient\.name\.trim\(\)/);
  assert.match(cutover, /finalClient\.normalized_mobile !== session\.acknowledged_mobile/);
  assert.match(cutover, /\(client_id, crm_v2_client_id, source_client_name/);
  assert.match(cutover, /VALUES \(NULL, \$1, \$2/);
  assert.doesNotMatch(cutover, /INSERT INTO (?:clients|client_contacts|client_identity_verifications)/);
});

test('a changed CRM V2 mobile after acknowledgement fails closed before appointment insertion', async () => {
  const poolModulePath = require.resolve('../src/db/pool');
  const availabilityPath = require.resolve('../src/services/adminAvailability');
  const clinicPath = require.resolve('../src/services/clinicHours');
  const confirmationPath = require.resolve('../src/services/customerBookingConfirmation');
  const adminBookingPath = require.resolve('../src/services/adminBooking');
  const poolModule = require(poolModulePath);
  const oldConnect = poolModule.pool.connect;
  const oldAvailability = require.cache[availabilityPath]?.exports || require(availabilityPath);
  const oldClinic = require.cache[clinicPath]?.exports || require(clinicPath);
  const oldConfirmation = require.cache[confirmationPath]?.exports || require(confirmationPath);
  const calls = [];
  const pending = {
    admin_id: 7, client_id: null, crm_v2_client_id: 912, source_client_name: 'Synthetic Client',
    client_mobile_snapshot: '27821234567', acknowledged_mobile: '27821234567', mobile_acknowledged_at: '2099-01-01T00:00:00.000Z',
    staff_id: 9, service_id: 44, location_id: 1, starts_at: '2099-08-28T08:15:00.000Z', ends_at: '2099-08-28T09:15:00.000Z', state: 'confirm',
    staff_name: 'Christel', staff_status: 'active', service_name: 'Synthetic Massage', service_status: 'active',
    duration_minutes: 60, processing_time_minutes: 0, extra_time_minutes: 0, price: '500.00', variable_price: false,
    location_name: 'Synthetic Clinic', location_status: 'active',
  };
  const db = {
    released: false,
    async query(sql) {
      const q = String(sql).replace(/\s+/g, ' ').trim();
      calls.push(q);
      if (q.includes('FROM admin_booking_sessions abs')) return { rows: [pending], rowCount: 1 };
      if (q.startsWith('SELECT 1 FROM staff_services')) return { rows: [{ '?column?': 1 }], rowCount: 1 };
      if (q.includes('FROM crm_v2_clients')) return { rows: [{ id: 912, name: 'Synthetic Client', normalized_mobile: '27821234568', status: 'active' }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    },
    release() { this.released = true; },
  };
  try {
    poolModule.pool.connect = async () => db;
    require.cache[availabilityPath].exports = {
      ...oldAvailability,
      checkAuthoritativeSchedule: async () => ({ covered: true, partialUnavailable: false, allDayUnavailable: false, insideAvailableException: false }),
      getConflicts: async () => [],
    };
    require.cache[clinicPath].exports = { ...oldClinic, checkClinicHours: async () => ({ covered: true }) };
    require.cache[confirmationPath].exports = {
      ...oldConfirmation,
      queueCustomerBookingConfirmation: async () => { throw new Error('must not queue after mobile drift'); },
      sendCustomerBookingConfirmationForAppointment: async () => { throw new Error('must not send after mobile drift'); },
    };
    delete require.cache[adminBookingPath];
    const { confirmCalendarV2Booking } = require(adminBookingPath);
    const result = await confirmCalendarV2Booking({ id: 7, display_name: 'Synthetic Operator' });
    assert.equal(result.status, 'client_mobile_changed');
    assert.equal(calls.some((sql) => sql.startsWith('INSERT INTO appointments')), false);
    assert.equal(calls.some((sql) => sql.startsWith('DELETE FROM admin_booking_sessions')), true);
    assert.equal(calls.includes('COMMIT'), true);
    assert.equal(db.released, true);
  } finally {
    poolModule.pool.connect = oldConnect;
    require.cache[availabilityPath].exports = oldAvailability;
    require.cache[clinicPath].exports = oldClinic;
    require.cache[confirmationPath].exports = oldConfirmation;
    delete require.cache[adminBookingPath];
  }
});

test('final-mobile acknowledgement is entirely server-derived and the browser cannot submit identity evidence', () => {
  const booking = read('src/services/adminBooking.js');
  const route = read('src/routes/calendarCreateBooking.js');
  const start = booking.indexOf('async function acknowledgeCalendarV2Mobile');
  const end = booking.indexOf('async function confirmAdminBooking', start);
  const acknowledgement = booking.slice(start, end);
  const routeStart = route.indexOf("router.post('/mobile-acknowledgement'");
  const routeEnd = route.indexOf("router.post('/discard'", routeStart);
  const endpoint = route.slice(routeStart, routeEnd);
  assert.match(acknowledgement, /JOIN crm_v2_clients client ON client\.id = abs\.crm_v2_client_id/);
  assert.match(acknowledgement, /FOR UPDATE OF abs, client/);
  assert.match(acknowledgement, /acknowledged_mobile = \$2/);
  assert.match(acknowledgement, /\[adminId, pending\.normalized_mobile\]/);
  assert.match(endpoint, /sameOrigin, requireSession, requireCsrf/);
  assert.match(endpoint, /adminId: req\.staffBrowserSession\.adminId/);
  assert.doesNotMatch(endpoint, /req\.body|clientId|actorAdminId|body\.(?:mobile|normalizedMobile)/);
});

test('existing legacy appointments remain readable and are never rewritten or backfilled', () => {
  const scheduling = read('src/services/schedulingEngine.js');
  const migration = read('migrations/085_calendar_clean_crm_v2_cutover.sql');
  assert.match(scheduling, /LEFT JOIN clients c ON c\.id=a\.client_id/);
  assert.match(scheduling, /COALESCE\(c\.display_name,a\.source_client_name,'Client'\) AS client_name/);
  assert.doesNotMatch(migration, /(?:UPDATE|DELETE FROM|INSERT INTO)\s+appointments/i);
  assert.doesNotMatch(migration, /ALTER TABLE appointments/i);
});

test('CRM V2 confirmation obligations persist exact recipient/name snapshots without legacy authority evidence', async () => {
  const authority = {
    appointment_id: 991,
    client_id: null,
    crm_v2_client_id: 912,
    identity_model: 'crm_v2',
    client_status: 'active',
    client_phone: '27821234567',
    client_name_snapshot: 'Synthetic Client',
    contact_id: null,
    identity_verification_id: null,
    name_authority_id: null,
  };
  const calls = [];
  const db = {
    async query(sql, params = []) {
      const q = String(sql).replace(/\s+/g, ' ').trim();
      calls.push({ sql: q, params });
      if (q.startsWith("SELECT 1 FROM crm_audit_events")) return { rows: [], rowCount: 0 };
      if (q.startsWith('SELECT a.id AS appointment_id')) return { rows: [authority], rowCount: 1 };
      if (q.startsWith('INSERT INTO customer_message_deliveries')) return { rows: [{ appointment_id: 991, status: 'pending' }], rowCount: 1 };
      if (q.startsWith("INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)")) return { rows: [], rowCount: 1 };
      throw new Error(`Unhandled V2 confirmation SQL: ${q}`);
    },
  };
  assert.equal(confirmation.initialDeliveryFailure(authority), null);
  const result = await confirmation.queueCustomerBookingConfirmation(991, { db });
  assert.deepEqual(result, { queued: true, status: 'pending', reason: null, crmV2ClientId: 912, identityModel: 'crm_v2' });
  const insert = calls.find((call) => call.sql.startsWith('INSERT INTO customer_message_deliveries'));
  assert.deepEqual(insert.params, [991, 'pending', null, null, null, null, 912, '27821234567', 'Synthetic Client']);
  const audit = calls.find((call) => call.sql.startsWith('INSERT INTO crm_audit_events'));
  assert.deepEqual(JSON.parse(audit.params[1]), { crmV2ClientId: 912, identityModel: 'crm_v2_exact_mobile', initialStatus: 'pending', reason: null });
});

test('the V2 Calendar path is CRM V2-only and preserves the #500 retry/uncertain state machine', () => {
  const calendar = read('src/services/calendarCreateBooking.js');
  const confirmationSource = read('src/services/customerBookingConfirmation.js');
  assert.match(calendar, /require\('\.\/crmV2ClientService'\)/);
  assert.doesNotMatch(calendar, /clientCrmLookup|operatorClientAuthority|clientVerifiedIdentity|clientFacingNameAuthority/);
  assert.doesNotMatch(calendar, /INSERT INTO (?:clients|client_contacts)/);
  assert.match(confirmationSource, /status IN \('pending','failed'\)/);
  assert.match(confirmationSource, /status='uncertain'/);
  assert.match(confirmationSource, /provider_delivery_unknown/);
  assert.match(confirmationSource, /if\(providerAttempted&&!error\.response\)await markBookingConfirmationUncertain/);
  assert.match(confirmationSource, /identityModel==='crm_v2'[\s\S]*client_name_snapshot/);
});
