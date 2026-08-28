const { pool } = require('../db/pool');
const logger = require('../lib/logger');

const LIVE_PENDING_WHERE = `
  request.status='pending'
  AND appointment.status<>'cancelled'
  AND num_nonnulls(request.client_id,request.crm_v2_client_id)=1
  AND num_nonnulls(appointment.client_id,appointment.crm_v2_client_id)=1
  AND appointment.client_id IS NOT DISTINCT FROM request.client_id
  AND appointment.crm_v2_client_id IS NOT DISTINCT FROM request.crm_v2_client_id
  AND (
    request.crm_v2_client_id IS NULL
    OR EXISTS (
      SELECT 1
        FROM crm_v2_clients client
       WHERE client.id=request.crm_v2_client_id
         AND client.status='active'
         AND client.normalized_mobile=request.requested_by_phone
    )
  )
  AND appointment.starts_at > NOW()
  AND appointment.starts_at IS NOT DISTINCT FROM request.original_starts_at
  AND appointment.ends_at IS NOT DISTINCT FROM request.original_ends_at
  AND (SELECT COUNT(*)::int FROM appointment_staff x WHERE x.appointment_id=appointment.id)=1
  AND (SELECT staff_id FROM appointment_staff x WHERE x.appointment_id=appointment.id ORDER BY x.position,x.id LIMIT 1) IS NOT DISTINCT FROM request.approver_staff_id
  AND (SELECT COUNT(*)::int FROM appointment_services x WHERE x.appointment_id=appointment.id)=1
  AND (SELECT service_id FROM appointment_services x WHERE x.appointment_id=appointment.id ORDER BY x.position,x.id LIMIT 1) IS NOT DISTINCT FROM request.service_id
`;

const STALE_REASON = 'canonical appointment changed while reschedule approval was pending, or the appointment reached its start boundary';

async function livePendingRescheduleConflicts({ db = pool, staffId, startsAt, endsAt, excludeRequestId = null }) {
  const result = await db.query(`
    SELECT 'reschedule_hold'::text AS conflict_type,
           request.id,
           request.proposed_starts_at AS starts_at,
           request.proposed_ends_at AS ends_at,
           'Pending client reschedule approval'::text AS label
      FROM appointment_reschedule_requests request
      JOIN appointments appointment ON appointment.id=request.appointment_id
     WHERE ${LIVE_PENDING_WHERE}
       AND request.approver_staff_id=$1
       AND request.proposed_starts_at<$3
       AND request.proposed_ends_at>$2
       AND ($4::bigint IS NULL OR request.id<>$4)
     ORDER BY request.proposed_starts_at,request.id
  `, [staffId, startsAt, endsAt, excludeRequestId]);
  return result.rows;
}

async function reconcileStalePendingRescheduleHolds({ db = pool, staffId = null } = {}) {
  const result = await db.query(`
    UPDATE appointment_reschedule_requests request
       SET status='superseded',
           decided_at=COALESCE(request.decided_at,NOW()),
           decision_note=$2,
           updated_at=NOW()
      FROM appointments appointment
     WHERE request.appointment_id=appointment.id
       AND request.status='pending'
       AND ($1::bigint IS NULL OR request.approver_staff_id=$1)
       AND NOT (${LIVE_PENDING_WHERE})
     RETURNING request.id,request.appointment_id
  `, [staffId == null ? null : Number(staffId), STALE_REASON]);

  for (const row of result.rows) {
    try {
      await db.query(`
        INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
        VALUES ('client.reschedule_approval.superseded','appointment',$1,$2::jsonb)
      `, [row.appointment_id, JSON.stringify({
        requestId: Number(row.id),
        reason: STALE_REASON,
        reconciledAtChangeBoundary: true,
      })]);
    } catch (error) {
      logger.error({ err: error, requestId: Number(row.id), appointmentId: Number(row.appointment_id) }, 'Stale reschedule hold audit failed');
    }
  }

  return { superseded: result.rowCount, requestIds: result.rows.map((row) => Number(row.id)) };
}

module.exports = { livePendingRescheduleConflicts, reconcileStalePendingRescheduleHolds };
