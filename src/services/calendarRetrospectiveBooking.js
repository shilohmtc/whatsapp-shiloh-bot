const crypto = require('crypto');
const { pool } = require('../db/pool');
const crmV2ClientService = require('./crmV2ClientService');
const { checkClinicHours, getDefaultActiveLocation } = require('./clinicHours');
const { checkAuthoritativeSchedule, getConflicts } = require('./adminAvailability');
const {
  CALENDAR_CAPABILITIES,
  RETROSPECTIVE_CLIENT_IDS_KEY,
  resolveCalendarAuthority,
  hasCapability,
  retrospectiveClientAllows,
  allowsRetrospectiveBookingTarget,
} = require('./calendarAuthorization');

const RETROSPECTIVE_CAPABILITY = CALENDAR_CAPABILITIES.RECORD_PAST;
const MAX_NOTES_LENGTH = 4000;

function retrospectiveError(code, message, httpStatus = 400, details = null) {
  const error = new Error(message);
  error.code = code;
  error.httpStatus = httpStatus;
  if (details) error.details = details;
  return error;
}

function positiveId(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function requireTimestamp(value, code) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw retrospectiveError(code, 'Choose a valid appointment date and time.');
  }
  return date;
}

function cleanNotes(value) {
  const notes = String(value || '').trim();
  if (notes.length > MAX_NOTES_LENGTH) {
    throw retrospectiveError('CALENDAR_PAST_NOTES_TOO_LONG', `Appointment notes must be ${MAX_NOTES_LENGTH} characters or fewer.`);
  }
  return notes || null;
}

function requireRequestId(value) {
  const requestId = String(value || '').trim();
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(requestId)) {
    throw retrospectiveError('CALENDAR_PAST_INVALID_REQUEST', 'A valid request identifier is required.');
  }
  return requestId;
}

function permissionClientRestriction(admin = {}) {
  if (Array.isArray(admin?.calendarAuthority?.retrospectiveClientIds)) {
    return [...admin.calendarAuthority.retrospectiveClientIds];
  }
  const permissions = admin.permissions && typeof admin.permissions === 'object' && !Array.isArray(admin.permissions)
    ? admin.permissions
    : {};
  if (!Object.prototype.hasOwnProperty.call(permissions, RETROSPECTIVE_CLIENT_IDS_KEY)) return null;
  const raw = permissions[RETROSPECTIVE_CLIENT_IDS_KEY];
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map(positiveId).filter(Boolean))].sort((a, b) => a - b);
}

function clientRestrictionAllows(admin, clientId) {
  if (admin?.calendarAuthority) return retrospectiveClientAllows(admin.calendarAuthority, clientId);
  const restriction = permissionClientRestriction(admin);
  return restriction == null || restriction.includes(positiveId(clientId));
}

function warning(code, message, details = null) {
  return { code, message, ...(details ? { details } : {}) };
}

function fingerprint(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function createCalendarRetrospectiveBookingService({
  db = pool,
  clinicHours = checkClinicHours,
  authoritativeSchedule = checkAuthoritativeSchedule,
  conflictsFor = getConflicts,
  crmV2 = crmV2ClientService,
  now = () => new Date(),
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Retrospective booking database is required.');

  async function resolveOperator(adminId, queryable = db) {
    const id = positiveId(adminId);
    if (!id) throw retrospectiveError('CALENDAR_PAST_FORBIDDEN', 'Current staff authority does not permit past appointment recording.', 403);
    const admin = await resolveCalendarAuthority(queryable, id);
    const authority = admin?.calendarAuthority;
    if (!admin
      || !hasCapability(authority, CALENDAR_CAPABILITIES.BOOKING_CREATE)
      || !hasCapability(authority, CALENDAR_CAPABILITIES.RECORD_PAST)) {
      throw retrospectiveError('CALENDAR_PAST_FORBIDDEN', 'Current staff authority does not permit past appointment recording.', 403);
    }
    return admin;
  }

  async function listBookableOptions(adminId) {
    const admin = await resolveOperator(adminId);
    const result = await db.query(`SELECT st.id staff_id,st.display_name staff_name,sv.id service_id,sv.name service_name,
      sv.duration_minutes,sv.processing_time_minutes,sv.extra_time_minutes,sv.price,sv.variable_price,
      visibility.owner_staff_id private_owner_staff_id FROM staff st JOIN staff_services ss ON ss.staff_id=st.id
      JOIN services sv ON sv.id=ss.service_id LEFT JOIN service_visibility_policies visibility
      ON visibility.service_id=sv.id AND visibility.visibility_scope='tenant_private'
      WHERE st.status='active' AND sv.status='active' ORDER BY sv.name,st.display_name`);
    const staff = new Map(), services = new Map();
    const clientId = admin.calendarAuthority.retrospectiveClientIds?.[0] || 1;
    for (const row of result.rows) {
      if (!allowsRetrospectiveBookingTarget(admin.calendarAuthority, { clientId, staffId:row.staff_id, serviceId:row.service_id, privateOwnerStaffId:row.private_owner_staff_id })) continue;
      if (!staff.has(Number(row.staff_id))) staff.set(Number(row.staff_id), { id:Number(row.staff_id), displayName:row.staff_name, serviceIds:[] });
      staff.get(Number(row.staff_id)).serviceIds.push(Number(row.service_id));
      if (!services.has(Number(row.service_id))) services.set(Number(row.service_id), { id:Number(row.service_id), name:row.service_name, durationMinutes:Number(row.duration_minutes||0)+Number(row.processing_time_minutes||0)+Number(row.extra_time_minutes||0), price:row.price==null?null:Number(row.price), variablePrice:row.variable_price===true, staffIds:[] });
      services.get(Number(row.service_id)).staffIds.push(Number(row.staff_id));
    }
    return { staff:[...staff.values()], services:[...services.values()] };
  }

  async function searchClients(adminId, query) {
    const admin = await resolveOperator(adminId);
    const found = await crmV2.searchClients({ query, status:'active', limit:10 });
    return { clients:found.filter(client=>retrospectiveClientAllows(admin.calendarAuthority,client.id)).map(client=>({id:String(client.id),displayName:client.name,contactHint:null})), requiresExplicitSelection:true };
  }

  async function resolveSelection(queryable, admin, { clientId, staffId, serviceId, locationId, startsAt, endsAt, notes }) {
    const client = positiveId(clientId);
    const staff = positiveId(staffId);
    const service = positiveId(serviceId);
    if (!client || !staff || !service) {
      throw retrospectiveError('CALENDAR_PAST_INVALID_SELECTION', 'Choose one canonical client, treatment and practitioner.');
    }
    if (!retrospectiveClientAllows(admin.calendarAuthority, client)) {
      throw retrospectiveError('CALENDAR_PAST_CLIENT_SCOPE_DENIED', 'That client is outside this staff member’s retrospective recording scope.', 403);
    }

    const start = requireTimestamp(startsAt, 'CALENDAR_PAST_INVALID_START');
    const end = requireTimestamp(endsAt, 'CALENDAR_PAST_INVALID_END');
    if (end.getTime() <= start.getTime()) {
      throw retrospectiveError('CALENDAR_PAST_INVALID_WINDOW', 'Appointment end time must be after the start time.');
    }
    if (end.getTime() >= now().getTime()) {
      throw retrospectiveError('CALENDAR_PAST_NOT_ENDED', 'A past appointment can only be recorded after the entire appointment has ended.', 409);
    }

    const clientResult = await queryable.query(
      `SELECT id, name, status FROM crm_v2_clients WHERE id=$1 LIMIT 1`,
      [client]
    );
    const clientRow = clientResult.rows[0];
    if (!clientRow || clientRow.status !== 'active') {
      throw retrospectiveError('CALENDAR_PAST_CLIENT_UNAVAILABLE', 'The selected canonical client is not active.', 409);
    }

    const selectionResult = await queryable.query(
      `SELECT st.id AS staff_id, st.display_name AS staff_name, st.status AS staff_status,
              sv.id AS service_id, sv.name AS service_name, sv.status AS service_status,
              sv.duration_minutes, sv.price, sv.variable_price,
              visibility.owner_staff_id AS private_owner_staff_id
         FROM staff st
         JOIN staff_services ss ON ss.staff_id=st.id
         JOIN services sv ON sv.id=ss.service_id
         LEFT JOIN service_visibility_policies visibility
           ON visibility.service_id=sv.id AND visibility.visibility_scope='tenant_private'
        WHERE st.id=$1 AND sv.id=$2
        LIMIT 1`,
      [staff, service]
    );
    const selection = selectionResult.rows[0];
    if (!selection || selection.staff_status !== 'active' || selection.service_status !== 'active') {
      throw retrospectiveError('CALENDAR_PAST_SELECTION_UNAVAILABLE', 'The practitioner/service selection is not an active canonical eligible pairing.', 409);
    }
    if (!allowsRetrospectiveBookingTarget(admin.calendarAuthority, {
      clientId: client,
      staffId: staff,
      serviceId: service,
      privateOwnerStaffId: selection.private_owner_staff_id,
    })) {
      throw retrospectiveError('CALENDAR_PAST_SCOPE_DENIED', 'That practitioner or treatment is outside current booking scope.', 403);
    }

    let location;
    if (positiveId(locationId)) {
      const locationResult = await queryable.query(`SELECT id,name,status FROM locations WHERE id=$1 LIMIT 1`, [positiveId(locationId)]);
      location = locationResult.rows[0] || null;
      if (!location || location.status !== 'active') {
        throw retrospectiveError('CALENDAR_PAST_LOCATION_UNAVAILABLE', 'The selected clinic location is not active.', 409);
      }
    } else {
      location = await getDefaultActiveLocation(queryable);
      if (!location?.id) {
        throw retrospectiveError('CALENDAR_PAST_LOCATION_UNRESOLVED', 'Shiloh could not resolve exactly one active clinic location.', 409);
      }
    }

    const warnings = [];
    const clinic = await clinicHours({ db: queryable, locationId: location.id, startsAt: start, endsAt: end });
    if (!clinic.covered) {
      warnings.push(warning('clinic_hours', 'This historical appointment falls outside the clinic’s scheduling hours.', { reason: clinic.reason || 'outside_clinic_hours' }));
    }
    const schedule = await authoritativeSchedule({ db: queryable, staffId: staff, locationId: location.id, startsAt: start, endsAt: end });
    if (schedule.partialUnavailable || (schedule.allDayUnavailable && !schedule.insideAvailableException) || !schedule.covered) {
      warnings.push(warning('practitioner_schedule', 'This historical appointment falls outside the practitioner’s authoritative availability.'));
    }
    const conflicts = await conflictsFor({ db: queryable, staffId: staff, startsAt: start, endsAt: end });
    if (conflicts.length) {
      warnings.push(warning('overlap', 'This historical appointment overlaps an appointment or Calendar block.', {
        conflicts: conflicts.slice(0, 20).map(row => ({
          type: row.conflict_type,
          id: Number(row.id),
          startsAt: row.starts_at,
          endsAt: row.ends_at,
        })),
      }));
    }

    return {
      client: clientRow,
      staff: { id: staff, displayName: selection.staff_name },
      service: {
        id: service,
        name: selection.service_name,
        durationMinutes: Number(selection.duration_minutes || 0),
        price: selection.price,
        variablePrice: selection.variable_price === true,
      },
      location,
      startsAt: start,
      endsAt: end,
      notes: cleanNotes(notes),
      warnings,
    };
  }

  async function review({ adminId, ...payload } = {}) {
    const admin = await resolveOperator(adminId, db);
    const context = await resolveSelection(db, admin, payload);
    return {
      status: 'review',
      client: { id: Number(context.client.id), displayName: context.client.name },
      staff: context.staff,
      service: context.service,
      location: { id: Number(context.location.id), name: context.location.name },
      startsAt: context.startsAt.toISOString(),
      endsAt: context.endsAt.toISOString(),
      notes: context.notes,
      warnings: context.warnings,
    };
  }

  async function record({ adminId, requestId: rawRequestId, ...payload } = {}) {
    if (typeof db.connect !== 'function') throw new Error('Retrospective booking writes require a transactional database.');
    const requestId = requireRequestId(rawRequestId);
    const requestFingerprint = fingerprint({ ...payload, requestId });
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const admin = await resolveOperator(adminId, client);
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [`calendar-past:${admin.id}:${requestId}`]);
      const replay = await client.query(
        `SELECT entity_id, metadata FROM crm_audit_events
          WHERE actor_admin_id=$1 AND action='calendar.past_appointment_recorded'
            AND metadata->>'requestId'=$2
          ORDER BY id LIMIT 1`,
        [admin.id, requestId]
      );
      if (replay.rows[0]) {
        if (String(replay.rows[0].metadata?.requestFingerprint || '') !== requestFingerprint) {
          throw retrospectiveError('CALENDAR_PAST_IDEMPOTENCY_MISMATCH', 'That request identifier was already used for a different appointment.', 409);
        }
        await client.query('COMMIT');
        return { status: 'idempotent_replay', appointmentId: Number(replay.rows[0].entity_id), warnings: replay.rows[0].metadata?.warnings || [] };
      }

      const context = await resolveSelection(client, admin, payload);
      await client.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [context.staff.id]);
      const locked = await resolveSelection(client, admin, payload);
      const totalPrice = locked.service.variablePrice ? null : locked.service.price;
      const inserted = await client.query(
        `INSERT INTO appointments
           (client_id, crm_v2_client_id, source_client_name, location_id,
            starts_at, ends_at, status, title, notes, total_price, currency, source)
         VALUES (NULL,$1,$2,$3,$4,$5,'unknown',$6,$7,$8,'ZAR','shiloh_calendar')
         RETURNING id, starts_at, ends_at, status`,
        [locked.client.id, locked.client.name, locked.location.id, locked.startsAt, locked.endsAt,
          locked.service.name, locked.notes, totalPrice]
      );
      const appointment = inserted.rows[0];
      await client.query(
        `INSERT INTO appointment_services
           (appointment_id,service_id,position,service_name_snapshot,price_snapshot,duration_minutes_snapshot)
         VALUES($1,$2,1,$3,$4,$5)`,
        [appointment.id, locked.service.id, locked.service.name, locked.service.price, locked.service.durationMinutes]
      );
      await client.query(
        `INSERT INTO appointment_staff(appointment_id,staff_id,position,staff_name_snapshot)
         VALUES($1,$2,1,$3)`,
        [appointment.id, locked.staff.id, locked.staff.displayName]
      );
      await client.query(
        `INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason)
         VALUES($1,NULL,'unknown',$2,'Retrospective appointment recorded; attendance outcome not inferred')`,
        [appointment.id, `admin:${admin.id}:${admin.display_name || ''}`]
      );
      await client.query(
        `INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
         VALUES($1,'calendar.past_appointment_recorded','appointment',$2,$3::jsonb)`,
        [admin.id, appointment.id, JSON.stringify({
          requestId,
          requestFingerprint,
          mode: 'retrospective',
          crmV2ClientId: Number(locked.client.id),
          staffId: Number(locked.staff.id),
          serviceId: Number(locked.service.id),
          locationId: Number(locked.location.id),
          startsAt: locked.startsAt.toISOString(),
          endsAt: locked.endsAt.toISOString(),
          notesPresent: Boolean(locked.notes),
          warnings: locked.warnings,
          clientNotificationsQueued: false,
          clientNotificationsSent: false,
          futureSchedulingOverride: false,
        })]
      );
      await client.query('COMMIT');
      return { status: 'created', appointmentId: Number(appointment.id), warnings: locked.warnings };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      client.release();
    }
  }

  return { resolveOperator, listBookableOptions, searchClients, review, record };
}

const service = createCalendarRetrospectiveBookingService();
module.exports = {
  RETROSPECTIVE_CAPABILITY,
  RETROSPECTIVE_CLIENT_IDS_KEY,
  MAX_NOTES_LENGTH,
  retrospectiveError,
  permissionClientRestriction,
  clientRestrictionAllows,
  createCalendarRetrospectiveBookingService,
  ...service,
};
