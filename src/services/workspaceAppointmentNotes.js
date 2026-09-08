const crypto = require('crypto');
const { pool } = require('../db/pool');
const {
  resolveCalendarAuthority,
  operationsForAuthority,
  allowsAppointmentTarget,
} = require('./calendarAuthorization');
const { normalizeAppointmentNotes } = require('./appointmentNotes');

function notesError(code, message, httpStatus = null) {
  const error = new Error(message);
  error.code = code;
  if (Number.isInteger(httpStatus)) error.httpStatus = httpStatus;
  return error;
}

function positiveId(value, code = 'CALENDAR_NOTES_INVALID_ID') {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw notesError(code, 'A positive canonical appointment identifier is required.', 400);
  return id;
}

function exactRevision(value) {
  const raw = String(value || '').trim();
  const parsed = new Date(raw);
  if (!raw || Number.isNaN(parsed.getTime()) || parsed.toISOString() !== raw) {
    throw notesError('CALENDAR_NOTES_INVALID_REVISION', 'Reload the appointment before saving notes.', 400);
  }
  return raw;
}

function revisionOf(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function requestId(value) {
  const id = String(value || '').trim();
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(id)) {
    throw notesError('CALENDAR_NOTES_INVALID_REQUEST', 'A valid operation request identifier is required.', 400);
  }
  return id;
}

function fingerprint(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function createWorkspaceAppointmentNotesService({ db = pool } = {}) {
  if (!db || typeof db.query !== 'function' || typeof db.connect !== 'function') {
    throw new Error('Workspace appointment notes require a transactional database.');
  }

  async function resolveOperator(queryable, adminId) {
    const id = positiveId(adminId, 'CALENDAR_NOTES_FORBIDDEN');
    const admin = await resolveCalendarAuthority(queryable, id);
    if (!admin || operationsForAuthority(admin.calendarAuthority).length === 0) {
      throw notesError('CALENDAR_NOTES_FORBIDDEN', 'Current canonical staff authority does not permit appointment management.', 403);
    }
    return admin;
  }

  async function appointmentContext(queryable, appointmentId, { forUpdate = false } = {}) {
    const id = positiveId(appointmentId);
    const appointmentResult = await queryable.query(
      `SELECT id, notes, updated_at
         FROM appointments
        WHERE id=$1${forUpdate ? ' FOR UPDATE' : ''}`,
      [id]
    );
    const appointment = appointmentResult.rows[0];
    if (!appointment) throw notesError('CALENDAR_NOTES_APPOINTMENT_NOT_FOUND', 'The canonical appointment no longer exists.', 404);

    const staffResult = await queryable.query(
      `SELECT staff_id
         FROM appointment_staff
        WHERE appointment_id=$1
        ORDER BY position,id`,
      [id]
    );
    if (!staffResult.rows.length || staffResult.rows.some(row => !row.staff_id)) {
      throw notesError('CALENDAR_NOTES_ASSIGNMENT_AMBIGUOUS', 'The appointment does not have a complete canonical practitioner assignment.', 409);
    }
    const serviceResult = await queryable.query(
      `SELECT service_id
         FROM appointment_services
        WHERE appointment_id=$1
        ORDER BY position,id`,
      [id]
    );
    if (!serviceResult.rows.length || serviceResult.rows.some(row => !row.service_id)) {
      throw notesError('CALENDAR_NOTES_SERVICE_AMBIGUOUS', 'The appointment does not have a complete canonical treatment assignment.', 409);
    }
    return {
      appointment,
      staffIds: staffResult.rows.map(row => Number(row.staff_id)),
      serviceIds: serviceResult.rows.map(row => Number(row.service_id)),
    };
  }

  function requireScope(operator, context) {
    if (!allowsAppointmentTarget(operator.calendarAuthority, {
      staffIds: context.staffIds,
      serviceIds: context.serviceIds,
    })) {
      throw notesError('CALENDAR_NOTES_FORBIDDEN', 'The canonical appointment is outside this operator’s current Calendar/service scope.', 403);
    }
  }

  async function get({ adminId, appointmentId }) {
    const operator = await resolveOperator(db, adminId);
    const context = await appointmentContext(db, appointmentId);
    requireScope(operator, context);
    return {
      appointmentId: Number(context.appointment.id),
      notes: context.appointment.notes || '',
      revision: revisionOf(context.appointment.updated_at),
    };
  }

  async function update({ adminId, appointmentId, expectedRevision, notes, requestId: rawRequestId }) {
    const id = positiveId(appointmentId);
    const expected = exactRevision(expectedRevision);
    const normalizedNotes = normalizeAppointmentNotes(notes);
    const operationId = requestId(rawRequestId);
    const requestFingerprint = fingerprint({ appointmentId: id, expectedRevision: expected, notes: normalizedNotes });
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const operator = await resolveOperator(client, adminId);
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`, [`calendar-notes:${operator.id}:${operationId}`]);
      const replay = await client.query(
        `SELECT entity_id, metadata
           FROM crm_audit_events
          WHERE actor_admin_id=$1
            AND action='calendar.appointment_notes_updated'
            AND metadata->>'requestId'=$2
          ORDER BY id
          LIMIT 1`,
        [operator.id, operationId]
      );
      if (replay.rows[0]) {
        if (String(replay.rows[0].metadata?.requestFingerprint || '') !== requestFingerprint) {
          throw notesError('CALENDAR_NOTES_IDEMPOTENCY_MISMATCH', 'That operation identifier was already used for a different note update.', 409);
        }
        await client.query('COMMIT');
        return {
          status: 'idempotent_replay',
          appointmentId: Number(replay.rows[0].entity_id),
          revision: replay.rows[0].metadata?.after?.revision || null,
        };
      }

      const context = await appointmentContext(client, id, { forUpdate: true });
      requireScope(operator, context);
      const currentRevision = revisionOf(context.appointment.updated_at);
      if (currentRevision !== expected) {
        throw notesError('CALENDAR_NOTES_STALE_REVISION', 'The appointment changed. Reload Calendar before saving notes.', 409);
      }
      const beforeNotes = context.appointment.notes == null ? '' : String(context.appointment.notes);
      const updated = await client.query(
        `UPDATE appointments
            SET notes=$2, updated_at=NOW()
          WHERE id=$1
        RETURNING updated_at`,
        [id, normalizedNotes]
      );
      const revision = revisionOf(updated.rows[0]?.updated_at);
      await client.query(
        `INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
         VALUES($1,'calendar.appointment_notes_updated','appointment',$2,$3::jsonb)`,
        [operator.id, id, JSON.stringify({
          requestId: operationId,
          requestFingerprint,
          before: { notesPresent: Boolean(beforeNotes.trim()), noteLength: beforeNotes.trim().length, revision: currentRevision },
          after: { notesPresent: Boolean(normalizedNotes), noteLength: normalizedNotes ? normalizedNotes.length : 0, revision },
        })]
      );
      await client.query('COMMIT');
      return { status: 'updated', appointmentId: id, revision };
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
  createWorkspaceAppointmentNotesService,
  notesError,
  exactRevision,
  revisionOf,
};
