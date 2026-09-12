const crypto = require('crypto');
const { pool } = require('../db/pool');
const {
  resolveCalendarAuthority,
  hasFullAppointmentEditAuthority,
  allowsAppointmentTarget,
} = require('./calendarAuthorization');
const {
  listEligibleReplacementServices,
  updateSingleAppointmentTreatmentAndPrice,
} = require('./appointmentTreatmentPriceMutation');

class CalendarAppointmentTreatmentPriceError extends Error {
  constructor(code, message, httpStatus = 400, details = null) {
    super(message);
    this.name = 'CalendarAppointmentTreatmentPriceError';
    this.code = code;
    this.httpStatus = httpStatus;
    if (details) this.details = details;
  }
}

function positiveId(value, code = 'CALENDAR_TREATMENT_PRICE_INVALID_ID') {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new CalendarAppointmentTreatmentPriceError(code, 'A positive canonical identifier is required.');
  }
  return id;
}

function revisionOf(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function exactRevision(value) {
  const raw = String(value || '').trim();
  const date = new Date(raw);
  if (!raw || Number.isNaN(date.getTime()) || date.toISOString() !== raw) {
    throw new CalendarAppointmentTreatmentPriceError(
      'CALENDAR_TREATMENT_PRICE_INVALID_REVISION',
      'Reload the canonical appointment before retrying.'
    );
  }
  return raw;
}

function normalizeChargedPrice(value) {
  const raw = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) {
    throw new CalendarAppointmentTreatmentPriceError(
      'CALENDAR_TREATMENT_PRICE_INVALID_PRICE',
      'Charged price must be a non-negative amount with at most two decimals.'
    );
  }
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999.99) {
    throw new CalendarAppointmentTreatmentPriceError(
      'CALENDAR_TREATMENT_PRICE_INVALID_PRICE',
      'Charged price is outside the canonical NUMERIC(12,2) range.'
    );
  }
  return amount.toFixed(2);
}

function requireRequestId(value) {
  const requestId = String(value || '').trim();
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(requestId)) {
    throw new CalendarAppointmentTreatmentPriceError(
      'CALENDAR_TREATMENT_PRICE_INVALID_REQUEST',
      'A valid operation request identifier is required.'
    );
  }
  return requestId;
}

function fingerprint(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function createCalendarAppointmentTreatmentPriceService({ db = pool } = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Appointment treatment/price service requires a database.');

  async function resolveOperator(adminId, queryable = db) {
    const operator = await resolveCalendarAuthority(queryable, positiveId(adminId, 'CALENDAR_TREATMENT_PRICE_FORBIDDEN'));
    if (!operator || !hasFullAppointmentEditAuthority(operator.calendarAuthority)) {
      throw new CalendarAppointmentTreatmentPriceError(
        'CALENDAR_TREATMENT_PRICE_FORBIDDEN',
        'Current canonical staff authority does not permit full appointment editing.',
        403
      );
    }
    return operator;
  }

  async function loadContext(queryable, appointmentId, { lock = false } = {}) {
    const id = positiveId(appointmentId);
    const appointmentResult = await queryable.query(
      `/* calendarAppointmentTreatmentPrice:appointment */
       SELECT id,status,title,total_price,currency,updated_at
         FROM appointments
        WHERE id=$1
        ${lock ? 'FOR UPDATE' : ''}`,
      [id]
    );
    const appointment = appointmentResult.rows[0];
    if (!appointment) {
      throw new CalendarAppointmentTreatmentPriceError(
        'CALENDAR_TREATMENT_PRICE_NOT_FOUND',
        'The canonical appointment no longer exists.',
        404
      );
    }
    const [staffResult, serviceResult] = await Promise.all([
      queryable.query(
        `SELECT ast.id AS assignment_id,ast.staff_id,ast.position,ast.staff_name_snapshot,st.status AS staff_status
           FROM appointment_staff ast
           LEFT JOIN staff st ON st.id=ast.staff_id
          WHERE ast.appointment_id=$1
          ORDER BY ast.position,ast.id
          ${lock ? 'FOR UPDATE OF ast' : ''}`,
        [id]
      ),
      queryable.query(
        `SELECT aps.id AS assignment_id,aps.service_id,aps.position,aps.service_name_snapshot,
                aps.price_snapshot,aps.duration_minutes_snapshot
           FROM appointment_services aps
          WHERE aps.appointment_id=$1
          ORDER BY aps.position,aps.id
          ${lock ? 'FOR UPDATE OF aps' : ''}`,
        [id]
      ),
    ]);
    if (!staffResult.rows.length || staffResult.rows.some(row => !row.staff_id)) {
      throw new CalendarAppointmentTreatmentPriceError(
        'CALENDAR_TREATMENT_PRICE_ASSIGNMENT_AMBIGUOUS',
        'The appointment does not have a complete canonical practitioner assignment.',
        409
      );
    }
    if (serviceResult.rows.length !== 1) {
      throw new CalendarAppointmentTreatmentPriceError(
        'CALENDAR_TREATMENT_PRICE_SERVICE_AMBIGUOUS',
        'Treatment correction is limited to appointments with one treatment snapshot.',
        409
      );
    }
    return { appointment, staff: staffResult.rows, services: serviceResult.rows };
  }

  function requireAppointmentAuthority(operator, context) {
    const serviceIds = context.services.map(row => Number(row.service_id)).filter(id => Number.isSafeInteger(id) && id > 0);
    const staffIds = context.staff.map(row => Number(row.staff_id));
    if (serviceIds.length && !allowsAppointmentTarget(operator.calendarAuthority, { staffIds, serviceIds })) {
      throw new CalendarAppointmentTreatmentPriceError(
        'CALENDAR_TREATMENT_PRICE_FORBIDDEN',
        'The appointment is outside this staff member’s current Calendar/service scope.',
        403
      );
    }
  }

  async function listCatalogue(queryable, appointmentId) {
    const rows = await listEligibleReplacementServices(queryable, { appointmentId });
    return rows.map(row => ({
      id: Number(row.id),
      name: String(row.name || ''),
      standardPrice: row.price == null ? null : String(row.price),
      displayPrice: row.display_price == null ? null : String(row.display_price),
      variablePrice: row.variable_price === true,
      durationMinutes: Number(row.duration_minutes || 0)
        + Number(row.processing_time_minutes || 0)
        + Number(row.extra_time_minutes || 0),
    }));
  }

  function state(context) {
    return {
      id: Number(context.appointment.id),
      status: String(context.appointment.status || ''),
      currency: String(context.appointment.currency || 'ZAR'),
      chargedPrice: context.appointment.total_price == null ? null : String(context.appointment.total_price),
      revision: revisionOf(context.appointment.updated_at),
      services: context.services.map(row => ({
        serviceId: row.service_id == null ? null : Number(row.service_id),
        name: String(row.service_name_snapshot || ''),
        priceSnapshot: row.price_snapshot == null ? null : String(row.price_snapshot),
        durationMinutesSnapshot: row.duration_minutes_snapshot == null ? null : Number(row.duration_minutes_snapshot),
        position: Number(row.position),
      })),
    };
  }

  async function get({ adminId, appointmentId } = {}) {
    const operator = await resolveOperator(adminId, db);
    const context = await loadContext(db, appointmentId);
    requireAppointmentAuthority(operator, context);
    if (String(context.appointment.status || '') === 'cancelled') {
      throw new CalendarAppointmentTreatmentPriceError(
        'CALENDAR_TREATMENT_PRICE_FINAL',
        'A cancelled appointment cannot be corrected here.',
        409
      );
    }
    return { status: 'ready', appointment: state(context), catalogue: await listCatalogue(db, context.appointment.id) };
  }

  async function update({ adminId, appointmentId, expectedRevision, serviceId, chargedPrice, requestId: rawRequestId } = {}) {
    if (typeof db.connect !== 'function') throw new Error('Appointment treatment/price writes require a transactional database.');
    const id = positiveId(appointmentId);
    const selectedServiceId = positiveId(serviceId, 'CALENDAR_TREATMENT_PRICE_INVALID_SERVICE');
    const expected = exactRevision(expectedRevision);
    const price = normalizeChargedPrice(chargedPrice);
    const requestId = requireRequestId(rawRequestId);
    const requestFingerprint = fingerprint({ appointmentId: id, expectedRevision: expected, serviceId: selectedServiceId, chargedPrice: price });
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const operator = await resolveOperator(adminId, client);
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`calendar-treatment-price:${operator.id}:${requestId}`]);
      const replay = await client.query(
        `SELECT entity_id,metadata
           FROM crm_audit_events
          WHERE actor_admin_id=$1
            AND action='calendar.appointment_treatment_price_updated'
            AND metadata->>'requestId'=$2
          ORDER BY id LIMIT 1`,
        [operator.id, requestId]
      );
      if (replay.rows[0]) {
        if (String(replay.rows[0].metadata?.requestFingerprint || '') !== requestFingerprint) {
          throw new CalendarAppointmentTreatmentPriceError(
            'CALENDAR_TREATMENT_PRICE_IDEMPOTENCY_MISMATCH',
            'That operation identifier was already used for a different appointment correction.',
            409
          );
        }
        await client.query('COMMIT');
        return {
          status: 'idempotent_replay',
          appointmentId: Number(replay.rows[0].entity_id),
          revision: replay.rows[0].metadata?.after?.revision || null,
        };
      }

      const context = await loadContext(client, id, { lock: true });
      requireAppointmentAuthority(operator, context);
      if (String(context.appointment.status || '') === 'cancelled') {
        throw new CalendarAppointmentTreatmentPriceError(
          'CALENDAR_TREATMENT_PRICE_FINAL',
          'A cancelled appointment cannot be corrected here.',
          409
        );
      }
      if (revisionOf(context.appointment.updated_at) !== expected) {
        throw new CalendarAppointmentTreatmentPriceError(
          'CALENDAR_TREATMENT_PRICE_STALE_REVISION',
          'The appointment changed. Reload Calendar before retrying.',
          409
        );
      }

      const serviceResult = await client.query(
        `SELECT id,name,price,duration_minutes,processing_time_minutes,extra_time_minutes
           FROM services
          WHERE id=$1 AND status='active'
            AND COALESCE(external_source,'')<>'shiloh_package'
            AND NOT EXISTS (
              SELECT 1 FROM service_packages sp
               WHERE sp.session_service_id=services.id AND sp.status='active'
            )
          FOR SHARE`,
        [selectedServiceId]
      );
      const selected = serviceResult.rows[0];
      if (!selected) {
        throw new CalendarAppointmentTreatmentPriceError(
          'CALENDAR_TREATMENT_PRICE_SERVICE_UNAVAILABLE',
          'Choose a current active treatment from canonical Services.',
          409
        );
      }
      const staffIds = [...new Set(context.staff.map(row => Number(row.staff_id)))].sort((a, b) => a - b);
      const mappings = await client.query(
        `SELECT staff_id
           FROM staff_services
          WHERE service_id=$1 AND staff_id=ANY($2::bigint[])
          ORDER BY staff_id`,
        [selectedServiceId, staffIds]
      );
      const mapped = new Set(mappings.rows.map(row => Number(row.staff_id)));
      const missingStaffIds = staffIds.filter(staffId => !mapped.has(staffId));
      if (missingStaffIds.length) {
        throw new CalendarAppointmentTreatmentPriceError(
          'CALENDAR_TREATMENT_PRICE_SERVICE_MAPPING',
          'Every assigned practitioner must be canonically eligible for the selected treatment.',
          409,
          { staffIds: missingStaffIds }
        );
      }

      const durationMinutes = Number(selected.duration_minutes || 0)
        + Number(selected.processing_time_minutes || 0)
        + Number(selected.extra_time_minutes || 0);
      const before = state(context);
      await updateSingleAppointmentTreatmentAndPrice(client, {
        appointmentId: id,
        appointmentServiceId: context.services[0].assignment_id,
        serviceId: selectedServiceId,
        serviceName: selected.name,
        durationMinutes,
        priceSnapshot: price,
        chargedPrice: price,
      });
      const updated = await client.query(
        `SELECT id,status,title,total_price,currency,updated_at FROM appointments WHERE id=$1`,
        [id]
      );
      const after = {
        id,
        status: String(updated.rows[0].status || ''),
        currency: String(updated.rows[0].currency || 'ZAR'),
        chargedPrice: String(updated.rows[0].total_price),
        revision: revisionOf(updated.rows[0].updated_at),
        services: [{
          serviceId: selectedServiceId,
          name: String(selected.name),
          priceSnapshot: price,
          durationMinutesSnapshot: durationMinutes,
          position: Number(context.services[0].position),
        }],
      };
      await client.query(
        `INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
         VALUES($1,'calendar.appointment_treatment_price_updated','appointment',$2,$3::jsonb)`,
        [operator.id, id, JSON.stringify({
          requestId,
          requestFingerprint,
          origin: 'workspace.calendar',
          catalogueAuthority: 'services',
          appointmentSnapshotPreservedInAudit: true,
          before,
          after,
        })]
      );
      await client.query('COMMIT');
      return { status: 'updated', appointmentId: id, revision: after.revision, appointment: after };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      client.release();
    }
  }

  return { resolveOperator, get, update };
}

module.exports = {
  CalendarAppointmentTreatmentPriceError,
  createCalendarAppointmentTreatmentPriceService,
  normalizeChargedPrice,
  exactRevision,
  revisionOf,
  fingerprint,
};
