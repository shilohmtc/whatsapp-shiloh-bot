const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { CALENDAR_ROLES, deriveCalendarCapabilities, resolveCalendarOperator } = require('../src/services/calendarAccess');
const { createCalendarOperationalService, requestHash, strictLocalInput } = require('../src/services/calendarOperationalMutations');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const migrationSource = read('migrations/081_calendar_operational_assurance_cutover.sql');
const operationalSource = read('src/services/calendarOperationalMutations.js');
const routeSource = read('src/routes/calendarOperational.js');
const calendarSource = read('src/routes/calendar.js');
const emergencySource = read('src/services/calendarCreateBooking.js');
const templateMatrixSource = read('docs/calendar-template-disposition-matrix.md');
const uxSource = read('src/presentation/calendarOperationalUx.js');
const recoverySource = read('src/bootstrap/calendarProviderSyncRecovery.js');
const packageSource = read('package.json');

function admin(overrides = {}) {
  return {
    id: 1, staff_id: null, display_name: 'Jean-Pierre', calendar_role: 'super_admin',
    admin_active: true, staff_status: null,
    permissions: {
      'calendar:read': true, 'calendar:create': true, 'calendar:edit': true,
      'calendar:reschedule': true, 'calendar:cancel': true, 'calendar:sync_retry': true,
    },
    ...overrides,
  };
}

function scriptedDb(handler) {
  const calls = [];
  const client = {
    calls,
    async query(sql, params = []) {
      const call = { sql: String(sql), params };
      calls.push(call);
      return (await handler(call, calls)) || { rows: [], rowCount: 0 };
    },
    async connect() { return client; },
    release() {},
  };
  return client;
}

test('P0 role model grants JP and Christel lifecycle capability and other active staff read-only', () => {
  const jp = deriveCalendarCapabilities(admin({ calendar_role: CALENDAR_ROLES.SUPER_ADMIN }));
  const christel = deriveCalendarCapabilities(admin({ staff_id: 2, staff_status: 'active', calendar_role: CALENDAR_ROLES.OPERATIONS_ADMIN }));
  const staff = deriveCalendarCapabilities(admin({ staff_id: 3, staff_status: 'active', calendar_role: CALENDAR_ROLES.READ_ONLY, permissions: { 'calendar:read': true } }));
  for (const caps of [jp, christel]) {
    assert.equal(caps.read, true); assert.equal(caps.create, true); assert.equal(caps.edit, true);
    assert.equal(caps.reschedule, true); assert.equal(caps.cancel, true); assert.equal(caps.syncRetry, true);
  }
  assert.deepEqual(staff, { role: 'read_only', read: true, create: false, edit: false, reschedule: false, cancel: false, syncRetry: false });
  assert.match(migrationSource, /LOWER\(display_name\) = 'jean-pierre' THEN 'super_admin'/);
  assert.match(migrationSource, /LOWER\(display_name\) = 'christel' THEN 'operations_admin'/);
  assert.match(migrationSource, /calendar_scope = CASE WHEN active = TRUE THEN 'all_business'/);
});

test('server operator resolution attributes JP actions to JP and rejects read-only mutation', async () => {
  const db = scriptedDb(async (call) => call.sql.includes('FROM staff_admin_accounts a') ? { rows: [admin()], rowCount: 1 } : null);
  const jp = await resolveCalendarOperator(1, 'calendar:cancel', { db });
  assert.equal(jp.adminId, 1); assert.equal(jp.displayName, 'Jean-Pierre'); assert.equal(jp.calendarRole, 'super_admin'); assert.equal(jp.source, 'shiloh_calendar');
  const readOnlyDb = scriptedDb(async (call) => call.sql.includes('FROM staff_admin_accounts a') ? { rows: [admin({ id: 3, display_name: 'Abigail', staff_id: 9, staff_status: 'active', calendar_role: 'read_only', permissions: { 'calendar:read': true } })], rowCount: 1 } : null);
  await assert.rejects(resolveCalendarOperator(3, 'calendar:create', { db: readOnlyDb }), (error) => error?.code === 'CALENDAR_ACCESS_FORBIDDEN');
});

test('browser lifecycle mutations retain session, same-origin, CSRF, capability and idempotency enforcement', () => {
  for (const pattern of [/requireStaffSession/, /sameOriginGuard/, /csrfGuard/, /x-shiloh-idempotency-key/, /calendar:create/, /calendar:edit/, /calendar:reschedule/, /calendar:cancel/, /calendar:sync_retry/]) assert.match(routeSource, pattern);
  assert.match(migrationSource, /UNIQUE \(actor_admin_id, operation, idempotency_key\)/);
  assert.match(operationalSource, /ON CONFLICT\(actor_admin_id,operation,idempotency_key\) DO NOTHING/);
});

test('canonical availability authority contains no live Google availability check', () => {
  assert.doesNotMatch(operationalSource, /checkCalendarAvailability|checkPractitionerCalendarAvailability/);
  assert.match(operationalSource, /checkClinicHours/); assert.match(operationalSource, /checkAuthoritativeSchedule/);
  assert.match(operationalSource, /calendar_blocks/); assert.match(operationalSource, /a\.status<>'cancelled'/);
});

test('request hashing is key-order stable and local date/time validation is strict', () => {
  assert.equal(requestHash({ b: 2, a: 1 }), requestHash({ a: 1, b: 2 }));
  assert.equal(strictLocalInput('2027-02-28', '09:05'), '2027-02-28 09:05:00');
  assert.throws(() => strictLocalInput('2027-02-30', '09:05'), (error) => error?.code === 'CALENDAR_INVALID_SLOT');
});

test('Google outage cannot veto canonical commit and remains retryable after commit', async () => {
  const sequence = [];
  const db = scriptedDb(async (call) => {
    if (['BEGIN','COMMIT','ROLLBACK'].includes(call.sql)) { sequence.push(call.sql); return { rows: [], rowCount: 0 }; }
    if (call.sql.includes('INSERT INTO calendar_mutation_requests')) return { rows: [{ id: 501 }], rowCount: 1 };
    if (call.sql.includes('FROM clients WHERE id=')) return { rows: [{ id: 44, display_name: 'Jane Doe', status: 'active' }], rowCount: 1 };
    if (call.sql.includes('FROM staff st') && call.sql.includes('JOIN staff_services')) return { rows: [{ staff_id: 9, staff_name: 'Abigail', service_id: 77, service_name: 'Massage', duration_minutes: 60, processing_time_minutes: 0, extra_time_minutes: 0, price: '650.00', variable_price: false }], rowCount: 1 };
    if (call.sql.includes("FROM locations WHERE status='active'")) return { rows: [{ id: 1, name: 'Shiloh', timezone: 'Africa/Johannesburg' }], rowCount: 1 };
    if (call.sql.includes("AT TIME ZONE 'Africa/Johannesburg'")) return { rows: [{ starts_at: '2099-08-25T08:00:00.000Z', ends_at: '2099-08-25T09:00:00.000Z' }], rowCount: 1 };
    if (call.sql.includes('SELECT DISTINCT conflict_type')) return { rows: [], rowCount: 0 };
    if (call.sql.includes('INSERT INTO appointments')) { sequence.push('APPOINTMENT_INSERT'); return { rows: [{ id: 900 }], rowCount: 1 }; }
    if (call.sql.includes('SELECT job.id,job.provider,job.operation,job.payload_json')) return { rows: [
      { id: 701, provider: 'shared_google', operation: 'create', payload_json: { appointmentId: 900, staffName: 'Abigail', serviceName: 'Massage', startsAt: '2099-08-25T08:00:00.000Z', endsAt: '2099-08-25T09:00:00.000Z' } },
      { id: 702, provider: 'practitioner_google', operation: 'create', payload_json: { appointmentId: 900, staffName: 'Abigail', serviceName: 'Massage', startsAt: '2099-08-25T08:00:00.000Z', endsAt: '2099-08-25T09:00:00.000Z' } },
    ], rowCount: 2 };
    if (call.sql.includes("SET status='processing'")) {
      const id = call.params[0], provider = id === 701 ? 'shared_google' : 'practitioner_google';
      return { rows: [{ id, provider, operation: 'create', payload_json: { appointmentId: 900, staffName: 'Abigail', serviceName: 'Massage', startsAt: '2099-08-25T08:00:00.000Z', endsAt: '2099-08-25T09:00:00.000Z' } }], rowCount: 1 };
    }
    return { rows: [], rowCount: 1 };
  });
  const google = {
    eventIdForAppointment: (id) => `event-${id}`, async getBookingEventOnCalendar() { return null; },
    async createBookingEventOnCalendar() { sequence.push('GOOGLE_WRITE'); throw new Error('simulated Google outage'); },
    async updateBookingEventOnCalendar() { throw new Error('unused'); }, async cancelBookingEventOnCalendar() { throw new Error('unused'); },
  };
  const practitionerGoogle = {
    async createPractitionerBookingEvent() { sequence.push('PRACTITIONER_GOOGLE_WRITE'); throw new Error('simulated practitioner outage'); },
    async syncPractitionerBookingEvent() { throw new Error('unused'); }, async cancelPractitionerBookingEvent() { throw new Error('unused'); },
  };
  const service = createCalendarOperationalService({
    db, env: { GOOGLE_CALENDAR_ENABLED: 'true', GOOGLE_BOOKING_CALENDAR_ID: 'shared' },
    resolveOperator: async () => ({ adminId: 1, displayName: 'Jean-Pierre', calendarRole: 'super_admin', source: 'shiloh_calendar' }),
    clinicHoursChecker: async () => ({ covered: true }),
    scheduleChecker: async () => ({ covered: true, partialUnavailable: false, allDayUnavailable: false, insideAvailableException: false }),
    google, practitionerGoogle,
  });
  const result = await service.createAppointment({ adminId: 1, clientId: 44, staffId: 9, serviceId: 77, date: '2099-08-25', time: '10:00', idempotencyKey: 'jp-create-outage-001' });
  assert.equal(result.status, 'created'); assert.equal(result.appointmentId, 900); assert.equal(result.source, 'shiloh_calendar'); assert.equal(result.operator.displayName, 'Jean-Pierre'); assert.equal(result.providerSync, 'queued');
  assert.ok(sequence.indexOf('COMMIT') > sequence.indexOf('APPOINTMENT_INSERT'));
  assert.equal(sequence.includes('GOOGLE_WRITE'), false); assert.equal(sequence.includes('PRACTITIONER_GOOGLE_WRITE'), false);
  const sync = await service.processSyncJobsForMutation(501);
  assert.equal(sync.status, 'degraded'); assert.ok(sequence.indexOf('GOOGLE_WRITE') > sequence.indexOf('COMMIT')); assert.ok(sequence.indexOf('PRACTITIONER_GOOGLE_WRITE') > sequence.indexOf('COMMIT'));
  const failed = db.calls.filter((call) => call.sql.includes('UPDATE calendar_provider_sync_jobs') && call.params[1] === 'failed');
  assert.equal(failed.length, 2);
  const audit = db.calls.find((call) => call.sql.includes('INSERT INTO crm_audit_events'));
  assert.equal(audit.params[0], 1); assert.match(audit.params[3], /"source":"shiloh_calendar"/); assert.doesNotMatch(audit.params[3], /Christel|WhatsApp Admin Assistant/);
});

test('idempotent replay returns original response without a second appointment insert', async () => {
  const payload = { clientId: 44, staffId: 9, serviceId: 77, date: '2099-08-25', time: '10:00' };
  const db = scriptedDb(async (call) => {
    if (call.sql.includes('INSERT INTO calendar_mutation_requests')) return { rows: [], rowCount: 0 };
    if (call.sql.includes('FROM calendar_mutation_requests') && call.sql.includes('FOR UPDATE')) return { rows: [{ id: 501, request_hash: requestHash(payload), status: 'succeeded', response_json: { status: 'created', appointmentId: 900, source: 'shiloh_calendar', providerSync: 'queued' }, appointment_id: 900 }], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  });
  const service = createCalendarOperationalService({ db, resolveOperator: async () => ({ adminId: 1, displayName: 'Jean-Pierre', calendarRole: 'super_admin', source: 'shiloh_calendar' }) });
  const result = await service.createAppointment({ adminId: 1, ...payload, idempotencyKey: 'jp-create-replay-001' });
  assert.equal(result.idempotentReplay, true); assert.equal(result.appointmentId, 900);
  assert.equal(db.calls.some((call) => call.sql.includes('INSERT INTO appointments')), false);
});

test('JP lifecycle paths require distinct server capabilities and record Shiloh provenance', () => {
  const slices = [
    ['createAppointment','lockAppointment','calendar:create','calendar.appointment_created'],
    ['editAppointment','rescheduleAppointment','calendar:edit','calendar.appointment_edited'],
    ['rescheduleAppointment','cancelAppointment','calendar:reschedule','calendar.appointment_rescheduled'],
    ['cancelAppointment','getAppointment','calendar:cancel','calendar.appointment_cancelled'],
  ];
  for (const [startName,endName,capability,auditAction] of slices) {
    const start = operationalSource.indexOf(`async function ${startName}`), end = operationalSource.indexOf(`async function ${endName}`, start + 1);
    const slice = operationalSource.slice(start, end > start ? end : undefined);
    assert.match(slice, new RegExp(capability.replace(':','\\:'))); assert.match(slice, new RegExp(auditAction.replace('.','\\.'))); assert.match(slice, /source: 'shiloh_calendar'/); assert.doesNotMatch(slice, /WhatsApp Admin Assistant|shiloh_admin_whatsapp/);
  }
});

test('browser retries reuse one logical idempotency key and prevent double-submit', () => {
  assert.match(uxSource, /function mutationKey\(button,namespace,payload\)/); assert.match(uxSource, /shilohMutationSignature/); assert.match(uxSource, /shilohMutationKey/); assert.match(uxSource, /lock\(btn,true\)/); assert.match(uxSource, /Retry the unchanged request/); assert.match(uxSource, /data-sync-retry/);
});

test('provider recovery serializes unresolved jobs per appointment and provider', () => {
  assert.match(operationalSource, /older\.appointment_id=job\.appointment_id/); assert.match(operationalSource, /older\.provider=job\.provider/); assert.match(operationalSource, /older\.id<job\.id/); assert.match(operationalSource, /older\.status IN \('pending','processing','failed'\)/); assert.match(migrationSource, /idx_calendar_provider_sync_order/);
});

test('provider recovery worker is durable, bounded, non-blocking and preloaded', () => {
  assert.match(recoverySource, /processDueProviderSyncJobs\(\{ limit: 25 \}\)/); assert.match(recoverySource, /inFlight/); assert.match(recoverySource, /setIntervalFn/); assert.match(recoverySource, /\.unref/); assert.match(packageSource, /calendarProviderSyncRecovery\.js/); assert.match(operationalSource, /NOW\(\)\+INTERVAL '10 minutes'/);
});

test('shared Google update recovery creates deterministic event if prior create never reached Google', () => {
  assert.match(operationalSource, /getBookingEventOnCalendar\(eventId, calendarId\)/); assert.match(operationalSource, /existing[\s\S]*updateBookingEventOnCalendar[\s\S]*createBookingEventOnCalendar/);
});

test('canonical conflict query preserves practitioner and clinic-wide blocks, not Google authority', () => {
  assert.match(operationalSource, /cb\.staff_id=\$1 OR cb\.staff_id IS NULL/); assert.doesNotMatch(operationalSource, /checkCalendarAvailability|checkPractitionerCalendarAvailability/);
});

test('legacy Christel emergency booking remains mounted and un-replaced', () => {
  assert.match(calendarSource, /router\.use\('\/book', createCalendarCreateBookingRouter/); assert.match(calendarSource, /router\.use\('\/operations', createCalendarOperationalRouter/); assert.match(emergencySource, /EMERGENCY_ADMIN_ID/); assert.match(emergencySource, /isEmergencyChristelAuthority/);
});

test('new Shiloh Calendar audit wording contains no WhatsApp-era mutation provenance', () => {
  const slice = operationalSource.slice(operationalSource.indexOf('async function createAppointment'), operationalSource.indexOf('async function lockAppointment'));
  assert.match(slice, /Shiloh Calendar authenticated booking creation/); assert.match(slice, /calendar\.appointment_created/); assert.match(slice, /source: 'shiloh_calendar'/); assert.doesNotMatch(slice, /WhatsApp Admin Assistant|shiloh_admin_whatsapp/);
});

test('template gate includes all dispositions and every retained-template verification dimension', () => {
  for (const disposition of ['RETIRE','RETAIN','CRITICAL INFRASTRUCTURE','OTHER LIFECYCLE']) assert.match(templateMatrixSource, new RegExp(disposition));
  for (const dimension of ['Trigger','Variables','Recipient','Rendered payload','Idempotency','Failure handling','Audit']) assert.match(templateMatrixSource, new RegExp(dimension, 'i'));
  assert.match(templateMatrixSource, /Do not retire WhatsApp infrastructure globally/i);
});
