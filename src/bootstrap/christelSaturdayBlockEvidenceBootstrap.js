const { pool } = require('../db/pool');
const logger = require('../lib/logger');

setImmediate(async () => {
  try {
    const staff = await pool.query(`SELECT id FROM staff WHERE LOWER(display_name) = 'christel' AND status = 'active' AND resource_type = 'practitioner' ORDER BY id`);
    if (staff.rows.length !== 1) {
      logger.warn({ christelSaturdayBlockEvidence: { targetDate: '2026-08-29', staffMatchCount: staff.rows.length } }, 'Christel Saturday block evidence completed');
      return;
    }
    const blocks = await pool.query(
      `SELECT cb.id, cb.block_type, cb.starts_at, cb.ends_at, cb.title, cb.source, cb.created_at, cb.updated_at,
              (SELECT ae.action FROM crm_audit_events ae WHERE ae.entity_type = 'calendar_block' AND ae.entity_id = cb.id ORDER BY ae.created_at DESC, ae.id DESC LIMIT 1) AS latest_audit_action,
              (SELECT ae.created_at FROM crm_audit_events ae WHERE ae.entity_type = 'calendar_block' AND ae.entity_id = cb.id ORDER BY ae.created_at DESC, ae.id DESC LIMIT 1) AS latest_audit_at
         FROM calendar_blocks cb
        WHERE cb.staff_id = $1
          AND cb.starts_at < (('2026-08-29'::date + time '14:00') AT TIME ZONE 'Africa/Johannesburg')
          AND cb.ends_at > (('2026-08-29'::date + time '08:00') AT TIME ZONE 'Africa/Johannesburg')
        ORDER BY cb.starts_at, cb.id`,
      [Number(staff.rows[0].id)]
    );
    logger.info({
      christelSaturdayBlockEvidence: {
        targetDate: '2026-08-29',
        blockCount: blocks.rows.length,
        blocks: blocks.rows.map((row) => ({
          id: Number(row.id),
          blockType: row.block_type,
          startsAt: row.starts_at,
          endsAt: row.ends_at,
          title: row.title,
          source: row.source,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          latestAuditAction: row.latest_audit_action,
          latestAuditAt: row.latest_audit_at,
        })),
      },
    }, 'Christel Saturday block evidence completed');
  } catch (error) {
    logger.error({ err: error }, 'Christel Saturday block evidence failed');
  }
});
