const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  evaluateCalendarAuthority,
  hasFullAppointmentEditAuthority,
} = require('../src/services/calendarAuthorization');
const {
  createCalendarAppointmentTreatmentPriceService,
  normalizeChargedPrice,
} = require('../src/services/calendarAppointmentTreatmentPrice');
const {
  calendarAppointmentTreatmentPriceClientScript,
} = require('../src/presentation/calendarAppointmentTreatmentPriceUx');

const FULL_EDIT = {
  'appointment:view': true,
  'calendar:booking:reschedule': true,
  'calendar:booking:cancel': true,
  'calendar:booking:reassign': true,
  'appointment:adjust_end': true,
};

const APPOINTMENT = {
  id: 701,
  status: 'completed',
  title: 'Original treatment',
  total_price: '500.00',
  currency: 'ZAR',
  updated_at: '2026-09-08T07:00:00.000Z',
};

function principalRow(permissions = FULL_EDIT) {
  return {
    id: 5,
    staff_id: 17,
    display_name: 'Synthetic operator',
    role: 'owner',
    business_role: 'booking_operator',
    calendar_scope: 'all_business',
    service_scope: 'all_services',
    permissions,
    admin_active: true,
    staff_status: 'active',
  };
}

function fixture({ permissions = FULL_EDIT, mapped = true } = {}) {
  const audit = [];
  const statements = [];
  let committed = false;
  let rolledBack = false;
  const client = {
    async query(sql, params = []) {
      const text = String(sql);
      statements.push(text);
      if (text === 'BEGIN') return { rows: [] };
      if (text === 'COMMIT') { committed = true; return { rows: [] }; }
      if (text === 'ROLLBACK') { rolledBack = true; return { rows: [] }; }
      if (text.includes('calendarAuthorization:principal')) return { rows: [principalRow(permissions)] };
      if (text.includes("action='calendar.appointment_treatment_price_updated'")) return { rows: [] };
      if (text.includes('hashtextextended')) return { rows: [] };
      if (text.includes('calendarAppointmentTreatmentPrice:appointment')) return { rows: [{ ...APPOINTMENT }] };
      if (text.includes('FROM appointment_staff')) {
        return { rows: [{ assignment_id: 1, staff_id: 17, position: 1, staff_name_snapshot: 'Practitioner', staff_status: 'active' }] };
      }
      if (text.includes('FROM appointment_services')) {
        return { rows: [{ assignment_id: 2, service_id: 44, position: 1, service_name_snapshot: 'Original treatment', price_snapshot: '500.00', duration_minutes_snapshot: 60 }] };
      }
      if (text.includes('FROM services') && text.includes("status='active'") && text.includes('FOR SHARE')) {
        return { rows: [{ id: 55, name: 'Canonical treatment', price: '650.00', duration_minutes: 50, processing_time_minutes: 5, extra_time_minutes: 5 }] };
      }
      if (text.includes('FROM staff_services')) return { rows: mapped ? [{ staff_id: 17 }] : [] };
      if (text.startsWith('UPDATE appointment_services')) return { rows: [] };
      if (text.startsWith('UPDATE appointments')) return { rows: [] };
      if (text.startsWith('SELECT id,status,title,total_price')) return { rows: [{ ...APPOINTMENT, title: 'Canonical treatment', total_price: '575.00', updated_at: '2026-09-08T07:05:00.000Z' }] };
      if (text.startsWith('INSERT INTO crm_audit_events')) { audit.push(JSON.parse(params[2])); return { rows: [] }; }
      if (text.includes('calendarAppointmentTreatmentPrice:catalogue')) return { rows: [] };
      throw new Error(`Unexpected SQL in treatment/price fixture: ${text}`);
    },
    release() {},
  };
  return {
    db: { query: client.query.bind(client), async connect() { return client; } },
    audit,
    statements,
    state: () => ({ committed, rolledBack }),
  };
}

test('treatment/price correction reuses the exact released #903 full appointment-edit tuple', () => {
  const full = evaluateCalendarAuthority(principalRow());
  assert.equal(hasFullAppointmentEditAuthority(full), true);
  assert.equal(hasFullAppointmentEditAuthority(evaluateCalendarAuthority(principalRow({ 'appointment:view': true }))), false);
  assert.equal(hasFullAppointmentEditAuthority(evaluateCalendarAuthority({ ...principalRow(), calendar_scope: 'own_appointments' })), false);
});

test('charged price validation matches canonical NUMERIC(12,2) without mutating a catalogue price', () => {
  assert.equal(normalizeChargedPrice('575'), '575.00');
  assert.equal(normalizeChargedPrice('0.5'), '0.50');
  assert.throws(() => normalizeChargedPrice('-1'));
  assert.throws(() => normalizeChargedPrice('10.999'));
});

test('appointment treatment and charged price update atomically while preserving before/after evidence', async () => {
  const f = fixture();
  const service = createCalendarAppointmentTreatmentPriceService({ db: f.db });
  const result = await service.update({
    adminId: 5,
    appointmentId: 701,
    expectedRevision: APPOINTMENT.updated_at,
    serviceId: 55,
    chargedPrice: '575.00',
    requestId: 'treatment_price_001',
  });
  assert.equal(result.status, 'updated');
  assert.equal(result.appointment.chargedPrice, '575.00');
  assert.equal(result.appointment.services[0].name, 'Canonical treatment');
  assert.equal(result.appointment.services[0].durationMinutesSnapshot, 60);
  assert.equal(f.audit.length, 1);
  assert.equal(f.audit[0].before.services[0].name, 'Original treatment');
  assert.equal(f.audit[0].before.chargedPrice, '500.00');
  assert.equal(f.audit[0].after.services[0].name, 'Canonical treatment');
  assert.equal(f.audit[0].appointmentSnapshotPreservedInAudit, true);
  assert.equal(f.audit[0].catalogueAuthority, 'services');
  assert.deepEqual(f.state(), { committed: true, rolledBack: false });
  assert.equal(f.statements.some(sql => /UPDATE services|INSERT INTO services/i.test(sql)), false);
});

test('practitioner/service mapping and stale revision fail closed before appointment snapshots change', async () => {
  const mapping = fixture({ mapped: false });
  await assert.rejects(
    createCalendarAppointmentTreatmentPriceService({ db: mapping.db }).update({
      adminId: 5, appointmentId: 701, expectedRevision: APPOINTMENT.updated_at,
      serviceId: 55, chargedPrice: '575.00', requestId: 'treatment_price_002',
    }),
    error => error.code === 'CALENDAR_TREATMENT_PRICE_SERVICE_MAPPING'
  );
  assert.equal(mapping.statements.some(sql => sql.startsWith('UPDATE appointment_services')), false);
  assert.deepEqual(mapping.state(), { committed: false, rolledBack: true });

  const stale = fixture();
  await assert.rejects(
    createCalendarAppointmentTreatmentPriceService({ db: stale.db }).update({
      adminId: 5, appointmentId: 701, expectedRevision: '2026-09-08T06:00:00.000Z',
      serviceId: 55, chargedPrice: '575.00', requestId: 'treatment_price_003',
    }),
    error => error.code === 'CALENDAR_TREATMENT_PRICE_STALE_REVISION'
  );
  assert.equal(stale.statements.some(sql => sql.startsWith('UPDATE appointment_services')), false);
});

test('the existing appointment drawer receives a bounded Phone/Desktop treatment and price form', () => {
  const script = calendarAppointmentTreatmentPriceClientScript();
  assert.match(script, /shiloh:appointment-panel-open/);
  assert.match(script, /Correct this appointment/);
  assert.match(script, /The treatment catalogue and its standard price stay under Services/);
  assert.match(script, /method:'PATCH'/);
  assert.match(script, /x-shiloh-csrf-token/);
  assert.match(script, /min-height:44px/);
  assert.match(script, /@media\(max-width:700px\)/);
  assert.doesNotMatch(script, /localStorage|sessionStorage|indexedDB/);
});

test('routing stays inside released #903 appointment mutation authority and needs no migration', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'calendarAppointmentEndTime.js'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'calendarAppointmentTreatmentPrice.js'), 'utf8');
  const shared = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'appointmentTreatmentPriceMutation.js'), 'utf8');
  const legacy = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'adminBookingUpdate.js'), 'utf8');
  assert.match(route, /appointments\/:appointmentId\/treatment-price/);
  assert.match(route, /sameOrigin, requireSession, requireCsrf/);
  assert.match(route, /renderOperationalClient\(\)/);
  assert.match(service, /hasFullAppointmentEditAuthority/);
  assert.match(service, /FROM services[\s\S]*status='active'/);
  assert.match(service, /updateSingleAppointmentTreatmentAndPrice/);
  assert.match(service, /INSERT INTO crm_audit_events/);
  assert.doesNotMatch(service, /UPDATE services|INSERT INTO services/i);
  assert.match(shared, /UPDATE appointment_services/);
  assert.match(shared, /UPDATE appointments SET total_price/);
  assert.match(legacy, /updateSingleAppointmentTreatment/);
  assert.match(legacy, /updateAppointmentChargedPrice/);
});
