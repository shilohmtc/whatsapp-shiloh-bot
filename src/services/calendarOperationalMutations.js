const crypto = require('crypto');
const { pool } = require('../db/pool');
const { findClients } = require('./adminClientLookup');
const { checkClinicHours } = require('./clinicHours');
const { checkAuthoritativeSchedule } = require('./adminAvailability');
const { resolveCalendarOperator } = require('./calendarAccess');
const {
  createBookingEventOnCalendar,
  updateBookingEventOnCalendar,
  cancelBookingEventOnCalendar,
  getBookingEventOnCalendar,
  eventIdForAppointment,
} = require('./googleBookingCalendar');
const {
  createPractitionerBookingEvent,
  syncPractitionerBookingEvent,
  cancelPractitionerBookingEvent,
} = require('./practitionerGoogleCalendar');

function operationalError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeIdempotencyKey(value) {
  const key = String(value || '').trim();
  if (key.length < 8 || key.length > 160 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
    throw operationalError('CALENDAR_IDEMPOTENCY_KEY_REQUIRED', 'A valid idempotency key is required for Calendar mutations.');
  }
  return key;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function requestHash(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(stableValue(payload || {}))).digest('hex');
}

function strictLocalInput(date, time) {
  const dm = String(date || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const tm = String(time || '').trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!dm || !tm) throw operationalError('CALENDAR_INVALID_SLOT', 'Choose a valid Calendar date and start time.');
  const y = Number(dm[1]), m = Number(dm[2]), d = Number(dm[3]);
  const probe = new Date(Date.UTC(y, m - 1, d, 12));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() + 1 !== m || probe.getUTCDate() !== d) {
    throw operationalError('CALENDAR_INVALID_SLOT', 'Choose a valid Calendar date and start time.');
  }
  return `${dm[1]}-${dm[2]}-${dm[3]} ${tm[1]}:${tm[2]}:00`;
}

function maskContact(value = '') {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 4 ? `ending in ${digits.slice(-4)}` : null;
}

function serializeClient(client) {
  const primary = (client.contacts || []).find((item) => item.isPrimary) || (client.contacts || [])[0];
  return {
    id: Number(client.id),
    displayName: client.display_name || 'Unnamed client',
    status: client.status || 'unknown',
    contactHint: primary ? maskContact(primary.normalizedValue || primary.value) : null,
  };
}

function changedBy(operator) {
  return `calendar:${operator.adminId}:${operator.displayName}`.slice(0, 240);
}

function auditOperator(operator) {
  return {
    adminId: operator.adminId,
    displayName: operator.displayName,
    calendarRole: operator.calendarRole,
  };
}

function createCalendarOperationalService({
  db = pool,
  env = process.env,
  clientFinder = findClients,
  resolveOperator = resolveCalendarOperator,
  clinicHoursChecker = checkClinicHours,
  scheduleChecker = checkAuthoritativeSchedule,
  google = {
    createBookingEventOnCalendar,
    updateBookingEventOnCalendar,
    cancelBookingEventOnCalendar,
    getBookingEventOnCalendar,
    eventIdForAppointment,
  },
  practitionerGoogle = {
    createPractitionerBookingEvent,
    syncPractitionerBookingEvent,
    cancelPractitionerBookingEvent,
  },
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Calendar operational db is required');

  async function operator(adminId, capability) {
    return resolveOperator(adminId, capability, { db });
  }

  async function listBookableOptions(adminId) {
    await operator(adminId, 'calendar:create');
    const result = await db.query(
      `SELECT st.id AS staff_id, st.display_name AS staff_name,
              sv.id AS service_id, sv.name AS service_name,
              sv.duration_minutes, sv.processing_time_minutes, sv.extra_time_minutes,
              sv.price, sv.variable_price
         FROM staff st
         JOIN staff_services ss ON ss.staff_id = st.id
         JOIN services sv ON sv.id = ss.service_id
        WHERE st.status = 'active'
          AND st.client_bookable = TRUE
          AND sv.status = 'active'
        ORDER BY sv.name, st.display_name, sv.id, st.id`
    );
    const staffById = new Map();
    const serviceById = new Map();
    for (const row of result.rows) {
      const staffId = Number(row.staff_id);
      const serviceId = Number(row.service_id);
      if (!staffById.has(staffId)) staffById.set(staffId, { id: staffId, displayName: row.staff_name, serviceIds: [] });
      staffById.get(staffId).serviceIds.push(serviceId);
      if (!serviceById.has(serviceId)) {
        serviceById.set(serviceId, {
          id: serviceId,
          name: row.service_name,
          durationMinutes: Number(row.duration_minutes || 0) + Number(row.processing_time_minutes || 0) + Number(row.extra_time_minutes || 0),
          price: row.price == null ? null : Number(row.price),
          variablePrice: row.variable_price === true,
          staffIds: [],
        });
      }
      serviceById.get(serviceId).staffIds.push(staffId);
    }
    return { staff: [...staffById.values()], services: [...serviceById.values()] };
  }

  async function searchClients(adminId, query) {
    await operator(adminId, 'calendar:create');
    const cleaned = String(query || '').trim().replace(/\s+/g, ' ').slice(0, 120);
    if (cleaned.length < 2) return { clients: [], requiresExplicitSelection: true };
    const found = await clientFinder(cleaned, 10);
    return {
      clients: (found.clients || []).map(serializeClient),
      requiresExplicitSelection: true,
      ambiguous: (found.clients || []).length > 1,
    };
  }

  async function activeLocation(client) {
    const result = await client.query(`SELECT id, name, timezone FROM locations WHERE status='active' ORDER BY id LIMIT 2`);
    if (result.rowCount !== 1) throw operationalError('CALENDAR_LOCATION_AMBIGUOUS', 'Shiloh does not resolve to exactly one active clinic location.');
    return result.rows[0];
  }

  async function eligibleSelection(client, staffId, serviceId) {
    const staff = Number(staffId), service = Number(serviceId);
    if (!Number.isSafeInteger(staff) || staff <= 0 || !Number.isSafeInteger(service) || service <= 0) {
      throw operationalError('CALENDAR_INVALID_SELECTION', 'Choose an eligible practitioner and service.');
    }
    const result = await client.query(
      `SELECT st.id AS staff_id, st.display_name AS staff_name,
              sv.id AS service_id, sv.name AS service_name,
              sv.duration_minutes, sv.processing_time_minutes, sv.extra_time_minutes,
              sv.price, sv.variable_price
         FROM staff st
         JOIN staff_services ss ON ss.staff_id=st.id
         JOIN services sv ON sv.id=ss.service_id
        WHERE st.id=$1 AND sv.id=$2
          AND st.status='active' AND st.client_bookable=TRUE AND sv.status='active'
        LIMIT 1`,
      [staff, service]
    );
    if (!result.rowCount) throw operationalError('CALENDAR_INELIGIBLE_SELECTION', 'That practitioner/service combination is not currently bookable.');
    const row = result.rows[0];
    row.total_minutes = Number(row.duration_minutes || 0) + Number(row.processing_time_minutes || 0) + Number(row.extra_time_minutes || 0);
    if (row.total_minutes <= 0) throw operationalError('CALENDAR_INVALID_DURATION', 'The selected service does not have a usable canonical duration.');
    return row;
  }

  async function activeClient(client, clientId) {
    const id = Number(clientId);
    if (!Number.isSafeInteger(id) || id <= 0) throw operationalError('CALENDAR_CLIENT_REQUIRED', 'Select one canonical CRM client.');
    const result = await client.query(`SELECT id, display_name, status FROM clients WHERE id=$1 LIMIT 1`, [id]);
    const row = result.rows[0] || null;
    if (!row || row.status !== 'active') throw operationalError('CALENDAR_CLIENT_UNAVAILABLE', 'The selected canonical CRM client is not active.');
    return row;
  }

  async function windowFor(client, date, time, totalMinutes) {
    const local = strictLocalInput(date, time);
    const result = await client.query(
      `SELECT ($1::timestamp AT TIME ZONE 'Africa/Johannesburg') AS starts_at,
              (($1::timestamp + ($2::text || ' minutes')::interval) AT TIME ZONE 'Africa/Johannesburg') AS ends_at`,
      [local, totalMinutes]
    );
    return result.rows[0];
  }

  async function canonicalConflicts(client, { staffId, startsAt, endsAt, ignoreAppointmentId = null }) {
    const result = await client.query(
      `SELECT DISTINCT conflict_type,id,starts_at,ends_at,label FROM (
         SELECT 'appointment'::text conflict_type,a.id,a.starts_at,a.ends_at,
                COALESCE(c.display_name,a.source_client_name,'Unknown client') label
           FROM appointment_staff ast
           JOIN appointments a ON a.id=ast.appointment_id
           LEFT JOIN clients c ON c.id=a.client_id
          WHERE ast.staff_id=$1 AND a.status<>'cancelled'
            AND ($4::bigint IS NULL OR a.id<>$4)
            AND a.starts_at<$3 AND a.ends_at>$2
         UNION ALL
         SELECT 'calendar_block'::text,cb.id,cb.starts_at,cb.ends_at,COALESCE(cb.title,cb.block_type,'Calendar block')
           FROM calendar_blocks cb
          WHERE (cb.staff_id=$1 OR cb.staff_id IS NULL) AND cb.starts_at<$3 AND cb.ends_at>$2
       ) conflicts ORDER BY starts_at,id`,
      [staffId, startsAt, endsAt, ignoreAppointmentId]
    );
    return result.rows;
  }

  async function assertCanonicalAvailability(client, { staffId, locationId, startsAt, endsAt, ignoreAppointmentId = null }) {
    if (new Date(startsAt).getTime() <= Date.now()) throw operationalError('CALENDAR_PAST_TIME', 'Shiloh will not create or move a booking into the past.');
    const clinic = await clinicHoursChecker({ db: client, locationId, startsAt, endsAt });
    if (!clinic.covered) throw operationalError('CALENDAR_OUTSIDE_CLINIC_HOURS', 'The full appointment window falls outside canonical clinic hours.');
    const schedule = await scheduleChecker({ db: client, staffId, locationId, startsAt, endsAt });
    if (schedule.partialUnavailable || (schedule.allDayUnavailable && !schedule.insideAvailableException) || !schedule.covered) {
      throw operationalError('CALENDAR_STAFF_UNAVAILABLE', 'The canonical practitioner schedule does not permit the full appointment window.');
    }
    const conflicts = await canonicalConflicts(client, { staffId, startsAt, endsAt, ignoreAppointmentId });
    if (conflicts.length) throw operationalError('CALENDAR_CONFLICT', 'Canonical Shiloh state contains an appointment or Calendar block conflict.');
    return { clinic, schedule, conflicts: [] };
  }

  async function previewCreate({ adminId, clientId, staffId, serviceId, date, time } = {}) {
    const auth = await operator(adminId, 'calendar:create');
    const client = await activeClient(db, clientId);
    const selected = await eligibleSelection(db, staffId, serviceId);
    const location = await activeLocation(db);
    const window = await windowFor(db, date, time, selected.total_minutes);
    await assertCanonicalAvailability(db, { staffId: selected.staff_id, locationId: location.id, startsAt: window.starts_at, endsAt: window.ends_at });
    return {
      status: 'available',
      source: 'shiloh_canonical',
      operator: auditOperator(auth),
      review: {
        client: { id: Number(client.id), displayName: client.display_name || 'Unnamed client' },
        practitioner: { id: Number(selected.staff_id), displayName: selected.staff_name },
        service: { id: Number(selected.service_id), name: selected.service_name },
        location: { id: Number(location.id), name: location.name },
        startsAt: window.starts_at,
        endsAt: window.ends_at,
        durationMinutes: selected.total_minutes,
      },
    };
  }

  async function beginMutation(client, auth, operation, idempotencyKey, payload) {
    const key = normalizeIdempotencyKey(idempotencyKey);
    const hash = requestHash(payload);
    const inserted = await client.query(
      `INSERT INTO calendar_mutation_requests(actor_admin_id,operation,idempotency_key,request_hash,status)
       VALUES($1,$2,$3,$4,'processing')
       ON CONFLICT(actor_admin_id,operation,idempotency_key) DO NOTHING
       RETURNING id`,
      [auth.adminId, operation, key, hash]
    );
    if (inserted.rowCount) return { id: Number(inserted.rows[0].id), replay: null };
    const existing = await client.query(
      `SELECT id,request_hash,status,response_json,appointment_id
         FROM calendar_mutation_requests
        WHERE actor_admin_id=$1 AND operation=$2 AND idempotency_key=$3
        FOR UPDATE`,
      [auth.adminId, operation, key]
    );
    const row = existing.rows[0];
    if (!row) throw operationalError('CALENDAR_IDEMPOTENCY_STATE_INVALID', 'Calendar idempotency state could not be resolved.');
    if (row.request_hash !== hash) throw operationalError('CALENDAR_IDEMPOTENCY_KEY_REUSED', 'That idempotency key was already used for a different Calendar mutation.');
    if (row.status === 'succeeded' && row.response_json) return { id: Number(row.id), replay: row.response_json };
    throw operationalError('CALENDAR_MUTATION_IN_PROGRESS', 'An identical Calendar mutation is already in progress.');
  }

  async function completeMutation(client, mutationId, appointmentId, response) {
    await client.query(
      `UPDATE calendar_mutation_requests
          SET appointment_id=$2,status='succeeded',response_json=$3::jsonb,completed_at=NOW()
        WHERE id=$1`,
      [mutationId, appointmentId, JSON.stringify(response)]
    );
  }

  async function enqueueProviderJobs(client, mutationId, appointmentId, operation, payload) {
    for (const provider of ['shared_google', 'practitioner_google']) {
      await client.query(
        `INSERT INTO calendar_provider_sync_jobs
           (mutation_request_id,appointment_id,provider,operation,payload_json,status,next_attempt_at)
         VALUES($1,$2,$3,$4,$5::jsonb,'pending',NOW())
         ON CONFLICT(mutation_request_id,provider) DO NOTHING`,
        [mutationId, appointmentId, provider, operation, JSON.stringify(payload)]
      );
    }
  }

  async function audit(client, auth, action, appointmentId, metadata = {}) {
    await client.query(
      `INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
       VALUES($1,$2,'appointment',$3,$4::jsonb)`,
      [auth.adminId, action, appointmentId, JSON.stringify({ source: 'shiloh_calendar', operator: auditOperator(auth), ...metadata })]
    );
  }

  async function appointmentPayload(client, appointmentId) {
    const result = await client.query(
      `SELECT a.id,a.client_id,a.location_id,a.starts_at,a.ends_at,a.status,a.title,a.notes,
              COALESCE(c.display_name,a.source_client_name,'Client') AS client_name,
              (SELECT COALESCE(NULLIF(cc.value,''),cc.normalized_value)
                 FROM client_contacts cc WHERE cc.client_id=a.client_id
                 ORDER BY cc.is_primary DESC,cc.verified_at DESC NULLS LAST,cc.id LIMIT 1) AS client_mobile,
              l.name AS location_name,
              ast.staff_id,ast.staff_name_snapshot AS staff_name,
              aps.service_id,aps.service_name_snapshot AS service_name
         FROM appointments a
         LEFT JOIN clients c ON c.id=a.client_id
         LEFT JOIN locations l ON l.id=a.location_id
         LEFT JOIN LATERAL (SELECT staff_id,staff_name_snapshot FROM appointment_staff WHERE appointment_id=a.id ORDER BY position,id LIMIT 1) ast ON TRUE
         LEFT JOIN LATERAL (SELECT service_id,service_name_snapshot FROM appointment_services WHERE appointment_id=a.id ORDER BY position,id LIMIT 1) aps ON TRUE
        WHERE a.id=$1 LIMIT 1`,
      [appointmentId]
    );
    const row = result.rows[0] || null;
    if (!row) throw operationalError('CALENDAR_APPOINTMENT_NOT_FOUND', 'Canonical Shiloh appointment was not found.');
    return {
      appointmentId: Number(row.id),
      clientId: row.client_id == null ? null : Number(row.client_id),
      clientName: row.client_name,
      clientMobile: row.client_mobile,
      serviceId: row.service_id == null ? null : Number(row.service_id),
      serviceName: row.service_name,
      staffId: row.staff_id == null ? null : Number(row.staff_id),
      staffName: row.staff_name,
      locationId: row.location_id == null ? null : Number(row.location_id),
      locationName: row.location_name,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      title: row.title,
      notes: row.notes,
      source: 'shiloh_calendar',
    };
  }

  async function createAppointment({ adminId, clientId, staffId, serviceId, date, time, idempotencyKey } = {}) {
    const auth = await operator(adminId, 'calendar:create');
    const payload = { clientId: Number(clientId), staffId: Number(staffId), serviceId: Number(serviceId), date: String(date || ''), time: String(time || '') };
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    let mutationId;
    let appointmentId;
    try {
      await client.query('BEGIN');
      const mutation = await beginMutation(client, auth, 'create', idempotencyKey, payload);
      mutationId = mutation.id;
      if (mutation.replay) {
        await client.query('COMMIT');
        return { ...mutation.replay, idempotentReplay: true };
      }
      const canonicalClient = await activeClient(client, payload.clientId);
      const selected = await eligibleSelection(client, payload.staffId, payload.serviceId);
      const location = await activeLocation(client);
      const window = await windowFor(client, payload.date, payload.time, selected.total_minutes);
      await client.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [selected.staff_id]);
      await assertCanonicalAvailability(client, { staffId: selected.staff_id, locationId: location.id, startsAt: window.starts_at, endsAt: window.ends_at });

      const inserted = await client.query(
        `INSERT INTO appointments(client_id,location_id,starts_at,ends_at,status,title,total_price,currency,source)
         VALUES($1,$2,$3,$4,'scheduled',$5,$6,'ZAR','shiloh_calendar')
         RETURNING id,starts_at,ends_at,status`,
        [canonicalClient.id, location.id, window.starts_at, window.ends_at, selected.service_name, selected.variable_price ? null : selected.price]
      );
      appointmentId = Number(inserted.rows[0].id);
      await client.query(
        `INSERT INTO appointment_services(appointment_id,service_id,position,service_name_snapshot,price_snapshot,duration_minutes_snapshot)
         VALUES($1,$2,1,$3,$4,$5)`,
        [appointmentId, selected.service_id, selected.service_name, selected.price, selected.total_minutes]
      );
      await client.query(
        `INSERT INTO appointment_staff(appointment_id,staff_id,position,staff_name_snapshot)
         VALUES($1,$2,1,$3)`,
        [appointmentId, selected.staff_id, selected.staff_name]
      );
      await client.query(
        `INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason)
         VALUES($1,NULL,'scheduled',$2,'Shiloh Calendar authenticated booking creation')`,
        [appointmentId, changedBy(auth)]
      );
      const syncPayload = {
        appointmentId,
        clientName: canonicalClient.display_name,
        clientMobile: null,
        serviceName: selected.service_name,
        staffName: selected.staff_name,
        locationName: location.name,
        startsAt: window.starts_at,
        endsAt: window.ends_at,
        source: 'shiloh_calendar',
      };
      await audit(client, auth, 'calendar.appointment_created', appointmentId, { clientId: canonicalClient.id, staffId: selected.staff_id, serviceId: selected.service_id, startsAt: window.starts_at, endsAt: window.ends_at });
      await enqueueProviderJobs(client, mutationId, appointmentId, 'create', syncPayload);
      const response = { status: 'created', appointmentId, source: 'shiloh_calendar', operator: auditOperator(auth), providerSync: 'queued' };
      await completeMutation(client, mutationId, appointmentId, response);
      await client.query('COMMIT');
      return response;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally {
      if (client !== db && typeof client.release === 'function') client.release();
    }
  }

  async function lockAppointment(client, appointmentId) {
    const id = Number(appointmentId);
    if (!Number.isSafeInteger(id) || id <= 0) throw operationalError('CALENDAR_APPOINTMENT_NOT_FOUND', 'Canonical Shiloh appointment was not found.');
    const result = await client.query(
      `SELECT a.id,a.client_id,a.location_id,a.starts_at,a.ends_at,a.status,a.title,a.notes,
              ast.staff_id,ast.staff_name_snapshot AS staff_name,
              aps.service_id,aps.service_name_snapshot AS service_name,aps.price_snapshot,aps.duration_minutes_snapshot
         FROM appointments a
         LEFT JOIN LATERAL (SELECT staff_id,staff_name_snapshot FROM appointment_staff WHERE appointment_id=a.id ORDER BY position,id LIMIT 1) ast ON TRUE
         LEFT JOIN LATERAL (SELECT service_id,service_name_snapshot,price_snapshot,duration_minutes_snapshot FROM appointment_services WHERE appointment_id=a.id ORDER BY position,id LIMIT 1) aps ON TRUE
        WHERE a.id=$1
        LIMIT 1
        FOR UPDATE OF a`,
      [id]
    );
    const row = result.rows[0] || null;
    if (!row) throw operationalError('CALENDAR_APPOINTMENT_NOT_FOUND', 'Canonical Shiloh appointment was not found.');
    return row;
  }

  async function editAppointment({ adminId, appointmentId, title, notes, idempotencyKey } = {}) {
    const auth = await operator(adminId, 'calendar:edit');
    const cleanTitle = String(title == null ? '' : title).trim().slice(0, 160);
    const cleanNotes = String(notes == null ? '' : notes).trim().slice(0, 4000);
    const payload = { appointmentId: Number(appointmentId), title: cleanTitle, notes: cleanNotes };
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    let mutationId;
    try {
      await client.query('BEGIN');
      const mutation = await beginMutation(client, auth, 'edit', idempotencyKey, payload);
      mutationId = mutation.id;
      if (mutation.replay) { await client.query('COMMIT'); return { ...mutation.replay, idempotentReplay: true }; }
      const current = await lockAppointment(client, appointmentId);
      if (current.status === 'cancelled') throw operationalError('CALENDAR_APPOINTMENT_CANCELLED', 'Cancelled appointments cannot be edited.');
      await client.query(`UPDATE appointments SET title=$2,notes=$3,updated_at=NOW() WHERE id=$1`, [current.id, cleanTitle || null, cleanNotes || null]);
      await client.query(
        `INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason)
         VALUES($1,$2,$2,$3,'Shiloh Calendar authenticated appointment edit')`,
        [current.id, current.status, changedBy(auth)]
      );
      await audit(client, auth, 'calendar.appointment_edited', current.id, { fields: ['title', 'notes'] });
      const syncPayload = await appointmentPayload(client, current.id);
      await enqueueProviderJobs(client, mutationId, current.id, 'update', syncPayload);
      const response = { status: 'updated', appointmentId: Number(current.id), source: 'shiloh_calendar', operator: auditOperator(auth), providerSync: 'queued' };
      await completeMutation(client, mutationId, current.id, response);
      await client.query('COMMIT');
      return response;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally { if (client !== db && typeof client.release === 'function') client.release(); }
  }

  async function rescheduleAppointment({ adminId, appointmentId, date, time, staffId = null, idempotencyKey } = {}) {
    const auth = await operator(adminId, 'calendar:reschedule');
    const payload = { appointmentId: Number(appointmentId), date: String(date || ''), time: String(time || ''), staffId: staffId == null ? null : Number(staffId) };
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    let mutationId;
    try {
      await client.query('BEGIN');
      const mutation = await beginMutation(client, auth, 'reschedule', idempotencyKey, payload);
      mutationId = mutation.id;
      if (mutation.replay) { await client.query('COMMIT'); return { ...mutation.replay, idempotentReplay: true }; }
      const current = await lockAppointment(client, appointmentId);
      if (current.status === 'cancelled') throw operationalError('CALENDAR_APPOINTMENT_CANCELLED', 'Cancelled appointments cannot be rescheduled.');
      const targetStaffId = payload.staffId || Number(current.staff_id);
      const selected = await eligibleSelection(client, targetStaffId, current.service_id);
      const window = await windowFor(client, payload.date, payload.time, selected.total_minutes);
      const locks = [...new Set([Number(current.staff_id), Number(selected.staff_id)].filter(Number.isSafeInteger))].sort((a,b)=>a-b);
      for (const staffLockId of locks) await client.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [staffLockId]);
      await assertCanonicalAvailability(client, { staffId: selected.staff_id, locationId: current.location_id, startsAt: window.starts_at, endsAt: window.ends_at, ignoreAppointmentId: current.id });
      await client.query(`UPDATE appointments SET starts_at=$2,ends_at=$3,updated_at=NOW() WHERE id=$1`, [current.id, window.starts_at, window.ends_at]);
      await client.query(`UPDATE appointment_staff SET staff_id=$2,staff_name_snapshot=$3 WHERE appointment_id=$1 AND position=1`, [current.id, selected.staff_id, selected.staff_name]);
      await client.query(
        `INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason)
         VALUES($1,$2,$2,$3,'Shiloh Calendar authenticated reschedule')`,
        [current.id, current.status, changedBy(auth)]
      );
      await audit(client, auth, 'calendar.appointment_rescheduled', current.id, { from: { startsAt: current.starts_at, endsAt: current.ends_at, staffId: current.staff_id }, to: { startsAt: window.starts_at, endsAt: window.ends_at, staffId: selected.staff_id } });
      const syncPayload = await appointmentPayload(client, current.id);
      syncPayload.previousStaffName = current.staff_name;
      await enqueueProviderJobs(client, mutationId, current.id, 'update', syncPayload);
      const response = { status: 'rescheduled', appointmentId: Number(current.id), source: 'shiloh_calendar', operator: auditOperator(auth), providerSync: 'queued' };
      await completeMutation(client, mutationId, current.id, response);
      await client.query('COMMIT');
      return response;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally { if (client !== db && typeof client.release === 'function') client.release(); }
  }

  async function cancelAppointment({ adminId, appointmentId, reason = null, idempotencyKey } = {}) {
    const auth = await operator(adminId, 'calendar:cancel');
    const cleanReason = String(reason || 'Cancelled in Shiloh Calendar').trim().slice(0, 500);
    const payload = { appointmentId: Number(appointmentId), reason: cleanReason };
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    let mutationId;
    try {
      await client.query('BEGIN');
      const mutation = await beginMutation(client, auth, 'cancel', idempotencyKey, payload);
      mutationId = mutation.id;
      if (mutation.replay) { await client.query('COMMIT'); return { ...mutation.replay, idempotentReplay: true }; }
      const current = await lockAppointment(client, appointmentId);
      if (current.status !== 'cancelled') {
        await client.query(`UPDATE appointments SET status='cancelled',updated_at=NOW() WHERE id=$1`, [current.id]);
        await client.query(
          `INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason)
           VALUES($1,$2,'cancelled',$3,$4)`,
          [current.id, current.status, changedBy(auth), `Shiloh Calendar authenticated cancellation: ${cleanReason}`]
        );
        await audit(client, auth, 'calendar.appointment_cancelled', current.id, { fromStatus: current.status, reason: cleanReason });
      }
      const syncPayload = await appointmentPayload(client, current.id);
      syncPayload.staffName = current.staff_name;
      await enqueueProviderJobs(client, mutationId, current.id, 'cancel', syncPayload);
      const response = { status: 'cancelled', appointmentId: Number(current.id), source: 'shiloh_calendar', operator: auditOperator(auth), providerSync: 'queued' };
      await completeMutation(client, mutationId, current.id, response);
      await client.query('COMMIT');
      return response;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally { if (client !== db && typeof client.release === 'function') client.release(); }
  }

  async function getAppointment(adminId, appointmentId) {
    const auth = await operator(adminId, 'calendar:read');
    return { operator: auditOperator(auth), appointment: await appointmentPayload(db, Number(appointmentId)) };
  }

  async function markSyncJob(jobId, fields) {
    const status = fields.status;
    await db.query(
      `UPDATE calendar_provider_sync_jobs
          SET status=$2,
              provider_calendar_id=$3,
              provider_event_id=$4,
              last_error=$5,
              synced_at=CASE WHEN $2 IN ('synced','skipped') THEN NOW() ELSE synced_at END,
              next_attempt_at=CASE WHEN $2='failed' THEN NOW()+INTERVAL '5 minutes' ELSE next_attempt_at END,
              updated_at=NOW()
        WHERE id=$1`,
      [jobId, status, fields.calendarId || null, fields.eventId || null, fields.lastError || null]
    );
  }

  async function processOneSyncJob(job) {
    const data = job.payload_json || {};
    try {
      if (String(env.GOOGLE_CALENDAR_ENABLED || '').toLowerCase() !== 'true') {
        await markSyncJob(job.id, { status: 'failed', lastError: 'google_calendar_disabled' });
        return { id: job.id, status: 'failed', error: 'google_calendar_disabled' };
      }
      if (job.provider === 'shared_google') {
        const calendarId = String(env.GOOGLE_BOOKING_CALENDAR_ID || '').trim();
        if (!calendarId) throw new Error('Google Calendar is enabled but GOOGLE_BOOKING_CALENDAR_ID is missing.');
        const eventId = google.eventIdForAppointment(data.appointmentId);
        let result;
        if (job.operation === 'create') {
          result = await google.createBookingEventOnCalendar(calendarId, data);
        } else if (job.operation === 'update') {
          const existing = await google.getBookingEventOnCalendar(eventId, calendarId);
          result = existing
            ? await google.updateBookingEventOnCalendar(calendarId, { ...data, eventId })
            : await google.createBookingEventOnCalendar(calendarId, data);
        } else {
          result = await google.cancelBookingEventOnCalendar(eventId, calendarId);
        }
        await markSyncJob(job.id, { status: 'synced', calendarId, eventId: result?.event?.id || eventId });
        if (job.operation === 'cancel') {
          await db.query(
            `UPDATE appointment_calendar_events
                SET sync_status='cancelled',last_error=NULL,updated_at=NOW()
              WHERE appointment_id=$1 AND provider='google_calendar'`,
            [data.appointmentId]
          );
        } else {
          await db.query(
            `INSERT INTO appointment_calendar_events(appointment_id,provider,calendar_id,event_id,sync_status,updated_at)
             VALUES($1,'google_calendar',$2,$3,'synced',NOW())
             ON CONFLICT(appointment_id,provider) DO UPDATE SET calendar_id=EXCLUDED.calendar_id,event_id=EXCLUDED.event_id,sync_status='synced',last_error=NULL,updated_at=NOW()`,
            [data.appointmentId, calendarId, result?.event?.id || eventId]
          );
        }
        return { id: job.id, status: 'synced' };
      }
      let result;
      if (job.operation === 'create') result = await practitionerGoogle.createPractitionerBookingEvent(data);
      else if (job.operation === 'update') {
        if (data.previousStaffName && data.staffName && data.previousStaffName !== data.staffName) {
          await practitionerGoogle.cancelPractitionerBookingEvent({ appointmentId: data.appointmentId, staffName: data.previousStaffName });
        }
        result = await practitionerGoogle.syncPractitionerBookingEvent(data);
      } else result = await practitionerGoogle.cancelPractitionerBookingEvent({ appointmentId: data.appointmentId, staffName: data.staffName || data.previousStaffName });
      if (result?.configured === false) {
        await markSyncJob(job.id, { status: 'failed', lastError: 'practitioner_calendar_not_configured' });
        return { id: job.id, status: 'failed', error: 'practitioner_calendar_not_configured' };
      }
      await markSyncJob(job.id, { status: 'synced', calendarId: result?.calendarId || null, eventId: result?.event?.id || result?.eventId || google.eventIdForAppointment(data.appointmentId) });
      return { id: job.id, status: 'synced' };
    } catch (error) {
      await markSyncJob(job.id, { status: 'failed', lastError: String(error?.message || error).slice(0, 2000) });
      return { id: job.id, status: 'failed', error: error?.message || String(error) };
    }
  }

  async function processSyncJobsForMutation(mutationId) {
    const result = await db.query(
      `SELECT job.id,job.provider,job.operation,job.payload_json
         FROM calendar_provider_sync_jobs job
        WHERE job.mutation_request_id=$1
          AND ((job.status IN ('pending','failed') AND job.next_attempt_at<=NOW()) OR (job.status='processing' AND job.next_attempt_at<=NOW()))
          AND NOT EXISTS (
                SELECT 1 FROM calendar_provider_sync_jobs older
                 WHERE older.appointment_id=job.appointment_id
                   AND older.provider=job.provider
                   AND older.id<job.id
                   AND older.status IN ('pending','processing','failed')
              )
        ORDER BY job.id`,
      [mutationId]
    );
    const outcomes = [];
    for (const row of result.rows) {
      const claimed = await db.query(
        `UPDATE calendar_provider_sync_jobs job
            SET status='processing',attempt_count=job.attempt_count+1,last_attempt_at=NOW(),next_attempt_at=NOW()+INTERVAL '10 minutes',updated_at=NOW()
          WHERE job.id=$1
            AND (job.status IN ('pending','failed') OR (job.status='processing' AND job.next_attempt_at<=NOW()))
            AND NOT EXISTS (
                  SELECT 1 FROM calendar_provider_sync_jobs older
                   WHERE older.appointment_id=job.appointment_id
                     AND older.provider=job.provider
                     AND older.id<job.id
                     AND older.status IN ('pending','processing','failed')
                )
          RETURNING job.id,job.provider,job.operation,job.payload_json`,
        [row.id]
      );
      if (!claimed.rowCount) continue;
      outcomes.push(await processOneSyncJob(claimed.rows[0]));
    }
    const failed = outcomes.some((item) => item.status === 'failed');
    return { status: failed ? 'degraded' : 'synced', outcomes };
  }

  async function processDueProviderSyncJobs({ limit = 25 } = {}) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 100));
    const due = await db.query(
      `SELECT DISTINCT mutation_request_id
         FROM calendar_provider_sync_jobs
        WHERE (status IN ('pending','failed') OR status='processing')
          AND next_attempt_at<=NOW()
        ORDER BY mutation_request_id
        LIMIT $1`,
      [safeLimit]
    );
    const outcomes = [];
    for (const row of due.rows) {
      outcomes.push({ mutationRequestId: Number(row.mutation_request_id), ...(await processSyncJobsForMutation(row.mutation_request_id)) });
    }
    return { processedMutations: outcomes.length, outcomes };
  }

  async function retryProviderSync({ adminId, appointmentId = null, idempotencyKey } = {}) {
    const auth = await operator(adminId, 'calendar:sync_retry');
    const payload = { appointmentId: appointmentId == null ? null : Number(appointmentId) };
    const client = typeof db.connect === 'function' ? await db.connect() : db;
    let mutationId;
    try {
      await client.query('BEGIN');
      const mutation = await beginMutation(client, auth, 'sync_retry', idempotencyKey, payload);
      mutationId = mutation.id;
      if (mutation.replay) { await client.query('COMMIT'); return { ...mutation.replay, idempotentReplay: true }; }
      const selected = await client.query(
        `SELECT id FROM calendar_provider_sync_jobs
          WHERE (status='failed' OR (status='processing' AND next_attempt_at<=NOW())) AND ($1::bigint IS NULL OR appointment_id=$1)
          ORDER BY id FOR UPDATE`,
        [payload.appointmentId]
      );
      await client.query(
        `UPDATE calendar_provider_sync_jobs
            SET status='pending',next_attempt_at=NOW(),updated_at=NOW()
          WHERE (status='failed' OR (status='processing' AND next_attempt_at<=NOW())) AND ($1::bigint IS NULL OR appointment_id=$1)`,
        [payload.appointmentId]
      );
      const response = { status: 'retry_queued', queuedJobs: selected.rowCount, appointmentId: payload.appointmentId, source: 'shiloh_calendar', operator: auditOperator(auth) };
      await completeMutation(client, mutationId, payload.appointmentId, response);
      await client.query('COMMIT');
      return { ...response, providerSync: 'queued' };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw error;
    } finally { if (client !== db && typeof client.release === 'function') client.release(); }
  }

  return {
    listBookableOptions,
    searchClients,
    previewCreate,
    createAppointment,
    editAppointment,
    rescheduleAppointment,
    cancelAppointment,
    getAppointment,
    retryProviderSync,
    processSyncJobsForMutation,
    processDueProviderSyncJobs,
    canonicalConflicts,
    assertCanonicalAvailability,
  };
}

module.exports = {
  operationalError,
  normalizeIdempotencyKey,
  requestHash,
  strictLocalInput,
  serializeClient,
  createCalendarOperationalService,
};
