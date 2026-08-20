const { pool } = require('../db/pool');
const logger = require('../lib/logger');

async function reconcileStalePendingRescheduleHolds({ db = pool, staffId = null } = {}) {
  const result = await db.query(`
    UPDATE appointment_reschedule_requests request
       SET status='superseded',
           decided_at=COALESCE(request.decided_at,NOW()),
           decision_note='canonical appointment changed while reschedule approval was pending',
           updated_at=NOW()
      FROM appointments appointment
     WHERE request.appointment_id=appointment.id
       AND request.status='pending'
       AND ($1::bigint IS NULL OR request.approver_staff_id=$1)
       AND (
         appointment.status='cancelled'
         OR appointment.starts_at IS DISTINCT FROM request.original_starts_at
         OR appointment.ends_at IS DISTINCT FROM request.original_ends_at
         OR (SELECT COUNT(*)::int FROM appointment_staff x WHERE x.appointment_id=appointment.id)<>1
         OR (SELECT staff_id FROM appointment_staff x WHERE x.appointment_id=appointment.id ORDER BY x.position,x.id LIMIT 1) IS DISTINCT FROM request.approver_staff_id
         OR (SELECT COUNT(*)::int FROM appointment_services x WHERE x.appointment_id=appointment.id)<>1
         OR (SELECT service_id FROM appointment_services x WHERE x.appointment_id=appointment.id ORDER BY x.position,x.id LIMIT 1) IS DISTINCT FROM request.service_id
       )
     RETURNING request.id,request.appointment_id
  `, [staffId == null ? null : Number(staffId)]);

  for (const row of result.rows) {
    try {
      await db.query(`
        INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
        VALUES ('client.reschedule_approval.superseded','appointment',$1,$2::jsonb)
      `, [row.appointment_id, JSON.stringify({
        requestId: Number(row.id),
        reason: 'canonical appointment changed while reschedule approval was pending',
        reconciledBeforeAvailability: true,
      })]);
    } catch (error) {
      logger.error({ err: error, requestId: Number(row.id), appointmentId: Number(row.appointment_id) }, 'Stale reschedule hold audit failed');
    }
  }

  return { superseded: result.rowCount, requestIds: result.rows.map((row) => Number(row.id)) };
}

module.exports = { reconcileStalePendingRescheduleHolds };
