const crypto = require('crypto');
const { pool } = require('../db/pool');
const { createCalendarRetrospectiveBookingService } = require('./calendarRetrospectiveBooking');
const { checkClinicHours, getDefaultActiveLocation } = require('./clinicHours');
const { checkAuthoritativeSchedule, getConflicts } = require('./adminAvailability');
const {
  CALENDAR_CAPABILITIES,
  resolveCalendarAuthority,
  hasCapability,
  retrospectiveClientAllows,
  calendarScopeAllowsBookingTarget,
} = require('./calendarAuthorization');

function customError(code, message, httpStatus = 400) {
  const error = new Error(message);
  error.code = code;
  error.httpStatus = httpStatus;
  return error;
}
function positiveId(value) { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : null; }
function customName(value) {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (!name || name.length > 120) throw customError('CALENDAR_PAST_CUSTOM_SERVICE_INVALID', 'Enter a custom service name up to 120 characters.');
  return name;
}
function requestId(value) {
  const id = String(value || '').trim();
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(id)) throw customError('CALENDAR_PAST_INVALID_REQUEST', 'A valid request identifier is required.');
  return id;
}
function timestamp(value, code) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw customError(code, 'Choose a valid appointment date and time.');
  return date;
}
function notes(value) {
  const text = String(value || '').trim();
  if (text.length > 4000) throw customError('CALENDAR_PAST_NOTES_TOO_LONG', 'Appointment notes must be 4000 characters or fewer.');
  return text || null;
}
function fingerprint(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'); }

function createCalendarRetrospectiveBookingV1Service({
  db = pool,
  baseService = createCalendarRetrospectiveBookingService({ db }),
  clinicHours = checkClinicHours,
  authoritativeSchedule = checkAuthoritativeSchedule,
  conflictsFor = getConflicts,
  now = () => new Date(),
} = {}) {
  async function customContext(adminId, payload, queryable = db) {
    const admin = await resolveCalendarAuthority(queryable, positiveId(adminId));
    const authority = admin?.calendarAuthority;
    if (!admin || !hasCapability(authority, CALENDAR_CAPABILITIES.BOOKING_CREATE) || !hasCapability(authority, CALENDAR_CAPABILITIES.RECORD_PAST)) {
      throw customError('CALENDAR_PAST_FORBIDDEN', 'Current staff authority does not permit past appointment recording.', 403);
    }
    if (authority.serviceScope !== 'all_services') {
      throw customError('CALENDAR_PAST_CUSTOM_SERVICE_SCOPE_DENIED', 'Custom historical services require all-services appointment authority.', 403);
    }
    const clientId = positiveId(payload.clientId), staffId = positiveId(payload.staffId);
    if (!clientId || !staffId || !retrospectiveClientAllows(authority, clientId) || !calendarScopeAllowsBookingTarget(authority, staffId)) {
      throw customError('CALENDAR_PAST_SCOPE_DENIED', 'That client or practitioner is outside current booking scope.', 403);
    }
    const startsAt = timestamp(payload.startsAt, 'CALENDAR_PAST_INVALID_START');
    const endsAt = timestamp(payload.endsAt, 'CALENDAR_PAST_INVALID_END');
    if (endsAt <= startsAt) throw customError('CALENDAR_PAST_INVALID_WINDOW', 'Appointment end time must be after the start time.');
    if (endsAt >= now()) throw customError('CALENDAR_PAST_NOT_ENDED', 'A past appointment can only be recorded after the entire appointment has ended.', 409);
    const [clientResult, staffResult] = await Promise.all([
      queryable.query(`SELECT id,name,status FROM crm_v2_clients WHERE id=$1 LIMIT 1`, [clientId]),
      queryable.query(`SELECT id,display_name,status,resource_type FROM staff WHERE id=$1 LIMIT 1`, [staffId]),
    ]);
    const client = clientResult.rows[0], staff = staffResult.rows[0];
    if (!client || client.status !== 'active') throw customError('CALENDAR_PAST_CLIENT_UNAVAILABLE', 'The selected canonical client is not active.', 409);
    if (!staff || staff.status !== 'active' || staff.resource_type !== 'practitioner') throw customError('CALENDAR_PAST_STAFF_UNAVAILABLE', 'The selected canonical practitioner is not active.', 409);
    let location;
    if (positiveId(payload.locationId)) {
      const result = await queryable.query(`SELECT id,name,status FROM locations WHERE id=$1 LIMIT 1`, [positiveId(payload.locationId)]);
      location = result.rows[0];
      if (!location || location.status !== 'active') throw customError('CALENDAR_PAST_LOCATION_UNAVAILABLE', 'The selected clinic location is not active.', 409);
    } else location = await getDefaultActiveLocation(queryable);
    if (!location?.id) throw customError('CALENDAR_PAST_LOCATION_UNRESOLVED', 'Shiloh could not resolve an active clinic location.', 409);
    const warnings = [];
    const clinic = await clinicHours({ db: queryable, locationId: location.id, startsAt, endsAt });
    if (!clinic.covered) warnings.push({ code: 'clinic_hours', message: 'This historical appointment falls outside the clinic’s scheduling hours.' });
    const schedule = await authoritativeSchedule({ db: queryable, staffId, locationId: location.id, startsAt, endsAt });
    if (!schedule.covered || schedule.partialUnavailable || (schedule.allDayUnavailable && !schedule.insideAvailableException)) warnings.push({ code: 'practitioner_schedule', message: 'This historical appointment falls outside the practitioner’s authoritative availability.' });
    const conflicts = await conflictsFor({ db: queryable, staffId, startsAt, endsAt });
    if (conflicts.length) warnings.push({ code: 'overlap', message: 'This historical appointment overlaps an appointment or Calendar block.' });
    return {
      admin, client, staff, location, startsAt, endsAt,
      service: { id: null, name: customName(payload.customServiceName), custom: true, durationMinutes: Math.round((endsAt - startsAt) / 60000), price: null },
      notes: notes(payload.notes), warnings,
    };
  }

  async function review(payload = {}) {
    if (!String(payload.customServiceName || '').trim()) return baseService.review(payload);
    const context = await customContext(payload.adminId, payload);
    return { status: 'review', client: { id: Number(context.client.id), displayName: context.client.name }, staff: { id: Number(context.staff.id), displayName: context.staff.display_name }, service: context.service, location: { id: Number(context.location.id), name: context.location.name }, startsAt: context.startsAt.toISOString(), endsAt: context.endsAt.toISOString(), notes: context.notes, warnings: context.warnings };
  }

  async function record(payload = {}) {
    if (!String(payload.customServiceName || '').trim()) return baseService.record(payload);
    if (typeof db.connect !== 'function') throw new Error('Retrospective booking writes require a transactional database.');
    const safeRequestId = requestId(payload.requestId);
    const requestFingerprint = fingerprint({ ...payload, requestId: safeRequestId });
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const context = await customContext(payload.adminId, payload, client);
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [`calendar-past:${context.admin.id}:${safeRequestId}`]);
      const replay = await client.query(`SELECT entity_id,metadata FROM crm_audit_events WHERE actor_admin_id=$1 AND action='calendar.past_appointment_recorded' AND metadata->>'requestId'=$2 ORDER BY id LIMIT 1`, [context.admin.id, safeRequestId]);
      if (replay.rows[0]) {
        if (String(replay.rows[0].metadata?.requestFingerprint || '') !== requestFingerprint) throw customError('CALENDAR_PAST_IDEMPOTENCY_MISMATCH', 'That request identifier was already used for a different appointment.', 409);
        await client.query('COMMIT');
        return { status: 'idempotent_replay', appointmentId: Number(replay.rows[0].entity_id), warnings: replay.rows[0].metadata?.warnings || [] };
      }
      await client.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [context.staff.id]);
      const inserted = await client.query(`INSERT INTO appointments(client_id,crm_v2_client_id,source_client_name,location_id,starts_at,ends_at,status,title,notes,total_price,currency,source) VALUES(NULL,$1,$2,$3,$4,$5,'unknown',$6,$7,NULL,'ZAR','shiloh_calendar') RETURNING id`, [context.client.id, context.client.name, context.location.id, context.startsAt, context.endsAt, context.service.name, context.notes]);
      const appointmentId = Number(inserted.rows[0].id);
      await client.query(`INSERT INTO appointment_services(appointment_id,service_id,position,service_name_snapshot,price_snapshot,duration_minutes_snapshot) VALUES($1,NULL,1,$2,NULL,$3)`, [appointmentId, context.service.name, context.service.durationMinutes]);
      await client.query(`INSERT INTO appointment_staff(appointment_id,staff_id,position,staff_name_snapshot) VALUES($1,$2,1,$3)`, [appointmentId, context.staff.id, context.staff.display_name]);
      await client.query(`INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason) VALUES($1,NULL,'unknown',$2,'Retrospective appointment recorded; attendance outcome not inferred')`, [appointmentId, `admin:${context.admin.id}:${context.admin.display_name || ''}`]);
      await client.query(`INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata) VALUES($1,'calendar.past_appointment_recorded','appointment',$2,$3::jsonb)`, [context.admin.id, appointmentId, JSON.stringify({ requestId: safeRequestId, requestFingerprint, mode: 'retrospective_custom_service', crmV2ClientId: Number(context.client.id), staffId: Number(context.staff.id), serviceId: null, customServiceName: context.service.name, locationId: Number(context.location.id), startsAt: context.startsAt.toISOString(), endsAt: context.endsAt.toISOString(), warnings: context.warnings, catalogueServiceCreated: false, clientNotificationsQueued: false, clientNotificationsSent: false })]);
      await client.query('COMMIT');
      return { status: 'created', appointmentId, warnings: context.warnings, customService: true };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally { client.release(); }
  }

  return { ...baseService, review, record };
}

module.exports = { createCalendarRetrospectiveBookingV1Service };
