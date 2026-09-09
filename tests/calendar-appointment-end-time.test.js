const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CALENDAR_CAPABILITIES,
  evaluateCalendarAuthority,
  hasCapability,
  operationsForAuthority,
} = require('../src/services/calendarAuthorization');
const {
  createCalendarAppointmentEndTimeService,
} = require('../src/services/calendarAppointmentEndTime');
const {
  calendarAppointmentEndTimeClientScript,
} = require('../src/presentation/calendarAppointmentEndTimeUx');

const BASE = {
  id: 701,
  location_id: 1,
  starts_at: '2026-09-08T08:00:00.000Z',
  ends_at: '2026-09-08T09:00:00.000Z',
  status: 'confirmed',
  updated_at: '2026-09-08T07:00:00.000Z',
};

function principalRow(permissions = { 'appointment:adjust_end': true }) {
  return {
    id: 5,
    staff_id: 17,
    display_name: 'Synthetic operator',
    role: 'owner',
    business_role: 'owner',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions,
    admin_active: true,
    staff_status: 'active',
  };
}

function fixture({ conflict = false, permissions, updatedEnd = '2026-09-08T08:30:00.000Z' } = {}) {
  const audit = [];
  let released = false;
  let rolledBack = false;
  let committed = false;
  const client = {
    async query(sql, params = []) {
      const text = String(sql);
      if (text === 'BEGIN') return { rows: [] };
      if (text === 'COMMIT') { committed = true; return { rows: [] }; }
      if (text === 'ROLLBACK') { rolledBack = true; return { rows: [] }; }
      if (text.includes('calendarAuthorization:principal')) return { rows: [principalRow(permissions)] };
      if (text.includes("action='calendar.appointment_end_adjusted'")) return { rows: [] };
      if (text.includes('hashtextextended') || text.includes('pg_advisory_xact_lock($1::bigint)')) return { rows: [] };
      if (text.includes('FROM appointments') && text.includes('WHERE id=$1') && !text.includes("'appointment'::text")) return { rows: [{ ...BASE }] };
      if (text.includes('FROM appointment_staff')) return { rows: [{ staff_id: 17, position: 0, staff_name_snapshot: 'Synthetic practitioner', staff_status: 'active' }] };
      if (text.includes('FROM appointment_services')) return { rows: [{ service_id: 44, position: 0, service_name_snapshot: 'Synthetic service' }] };
      if (text.includes("'appointment'::text AS conflict_type")) {
        return conflict
          ? { rows: [{ conflict_type: 'appointment', id: 702, starts_at: '2026-09-08T09:10:00.000Z', ends_at: '2026-09-08T10:00:00.000Z' }] }
          : { rows: [] };
      }
      if (text.includes('UPDATE appointments')) {
        return { rows: [{ ...BASE, ends_at: updatedEnd, updated_at: '2026-09-08T07:05:00.000Z' }] };
      }
      if (text.includes('UPDATE appointment_lifecycle')) return { rows: [] };
      if (text.includes('INSERT INTO crm_audit_events')) { audit.push(JSON.parse(params[2])); return { rows: [] }; }
      throw new Error(`Unexpected SQL in end-time fixture: ${text}`);
    },
    release() { released = true; },
  };
  const db = {
    query: client.query.bind(client),
    async connect() { return client; },
  };
  return {
    db,
    audit,
    state: () => ({ released, rolledBack, committed }),
  };
}

test('appointment:adjust_end is a distinct bounded capability outside the legacy operation matrix', () => {
  const authority = evaluateCalendarAuthority(principalRow(), { allowedServiceIds: [] });
  assert.ok(authority);
  assert.equal(hasCapability(authority, CALENDAR_CAPABILITIES.ADJUST_END), true);
  assert.equal(operationsForAuthority(authority).includes('appointment:adjust_end'), false);
  const without = evaluateCalendarAuthority(principalRow({}), { allowedServiceIds: [] });
  assert.equal(hasCapability(without, CALENDAR_CAPABILITIES.ADJUST_END), false);
});

test('shortening an appointment updates canonical end/lifecycle and preserves before/after audit', async () => {
  const f = fixture({ updatedEnd: '2026-09-08T08:30:00.000Z' });
  const service = createCalendarAppointmentEndTimeService({ db: f.db, now: () => new Date('2026-09-08T12:00:00.000Z') });
  const result = await service.adjust({
    adminId: 5,
    appointmentId: 701,
    expectedRevision: BASE.updated_at,
    endsAt: '2026-09-08T08:30:00.000Z',
    requestId: 'endtime_test_001',
  });
  assert.equal(result.status, 'adjusted');
  assert.equal(result.endsAt, '2026-09-08T08:30:00.000Z');
  assert.equal(f.audit.length, 1);
  assert.deepEqual(f.audit[0].before, { endsAt: BASE.ends_at, revision: BASE.updated_at });
  assert.equal(f.audit[0].after.endsAt, '2026-09-08T08:30:00.000Z');
  assert.equal(f.audit[0].mode, 'actual_end');
  assert.equal(f.audit[0].extending, false);
  assert.equal(f.audit[0].clientNotificationsSent, false);
  assert.deepEqual(f.state(), { released: true, rolledBack: false, committed: true });
});

test('extending into another canonical appointment fails atomically', async () => {
  const f = fixture({ conflict: true, updatedEnd: '2026-09-08T09:30:00.000Z' });
  const service = createCalendarAppointmentEndTimeService({ db: f.db, now: () => new Date('2026-09-08T12:00:00.000Z') });
  await assert.rejects(
    service.adjust({
      adminId: 5,
      appointmentId: 701,
      expectedRevision: BASE.updated_at,
      endsAt: '2026-09-08T09:30:00.000Z',
      requestId: 'endtime_test_002',
    }),
    error => error.code === 'CALENDAR_END_TIME_CONFLICT' && error.httpStatus === 409
  );
  assert.equal(f.audit.length, 0);
  assert.deepEqual(f.state(), { released: true, rolledBack: true, committed: false });
});

test('stale revision and missing capability fail closed', async () => {
  const stale = fixture();
  const staleService = createCalendarAppointmentEndTimeService({ db: stale.db, now: () => new Date('2026-09-08T12:00:00.000Z') });
  await assert.rejects(
    staleService.adjust({ adminId: 5, appointmentId: 701, expectedRevision: '2026-09-08T06:00:00.000Z', endsAt: '2026-09-08T08:30:00.000Z', requestId: 'endtime_test_003' }),
    error => error.code === 'CALENDAR_END_TIME_STALE_REVISION'
  );

  const forbidden = fixture({ permissions: { 'appointment:view': true } });
  const forbiddenService = createCalendarAppointmentEndTimeService({ db: forbidden.db });
  await assert.rejects(
    forbiddenService.adjust({ adminId: 5, appointmentId: 701, expectedRevision: BASE.updated_at, endsAt: '2026-09-08T08:30:00.000Z', requestId: 'endtime_test_004' }),
    error => error.code === 'CALENDAR_END_TIME_FORBIDDEN' && error.httpStatus === 403
  );
});

test('end-time Workspace enhancer is capability-served, CSRF-protected and keeps a 44px Phone target', () => {
  const script = calendarAppointmentEndTimeClientScript();
  assert.match(script, /Adjust end time/);
  assert.match(script, /min-height:44px/);
  assert.match(script, /window\.location\.reload/);
  assert.match(script, /x-shiloh-csrf-token/);
});
