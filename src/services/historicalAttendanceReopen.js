const { pool } = require('../db/pool');

const MARKER = 'system:approved-historical-attendance-reopen-2026-08-16';

async function runApprovedHistoricalAttendanceReopen() {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');

    const prior = await db.query(
      `SELECT COUNT(*)::int AS count
         FROM appointment_status_history
        WHERE changed_by=$1
          AND reason LIKE 'Approved historical attendance reopen%'`,
      [MARKER]
    );
    if (Number(prior.rows[0]?.count || 0) === 31) {
      await db.query('ROLLBACK');
      return { applied: false, alreadyApplied: true, reopened: 31 };
    }
    if (Number(prior.rows[0]?.count || 0) !== 0) {
      throw new Error(`Historical attendance reopen marker is partial (${prior.rows[0]?.count}); refusing to continue`);
    }

    const targets = await db.query(
      `SELECT a.id, a.status AS previous_status
         FROM appointments a
        WHERE (a.starts_at AT TIME ZONE 'Africa/Johannesburg')::date BETWEEN DATE '2026-08-01' AND DATE '2026-08-15'
          AND a.status IN ('completed','no_show')
        ORDER BY a.id
        FOR UPDATE`
    );
    if (targets.rowCount !== 31) {
      throw new Error(`Historical attendance reopen expected exactly 31 finalized visits; found ${targets.rowCount}`);
    }

    const ids = targets.rows.map((row) => Number(row.id));
    const routing = await db.query(
      `SELECT a.id,
              COUNT(ast.staff_id) FILTER (WHERE ast.staff_id IS NOT NULL)::int AS assigned_count,
              BOOL_OR(lower(trim(s.display_name))='marietjie') AS has_marietjie,
              BOOL_OR(lower(trim(s.display_name)) IN ('christel','abigail')) AS has_christel_pool,
              BOOL_OR(ast.staff_id IS NULL OR lower(trim(COALESCE(s.display_name, ast.staff_name_snapshot, ''))) NOT IN ('christel','abigail','marietjie')) AS has_forbidden
         FROM appointments a
         LEFT JOIN appointment_staff ast ON ast.appointment_id=a.id
         LEFT JOIN staff s ON s.id=ast.staff_id
        WHERE a.id = ANY($1::bigint[])
        GROUP BY a.id
        ORDER BY a.id`,
      [ids]
    );

    const unroutable = routing.rows.filter((row) =>
      Number(row.assigned_count || 0) < 1 || row.has_forbidden === true || (row.has_marietjie === true && row.has_christel_pool === true)
    );
    if (unroutable.length) {
      throw new Error(`Historical attendance reopen found ${unroutable.length} unroutable finalized visits: ${unroutable.map((row) => row.id).join(',')}`);
    }

    for (const row of targets.rows) {
      await db.query(
        `INSERT INTO appointment_status_history (appointment_id,from_status,to_status,changed_by,reason)
         VALUES ($1,$2,'scheduled',$3,$4)`,
        [
          row.id,
          row.previous_status,
          MARKER,
          'Approved historical attendance reopen so Christel/Marietjie can perform final practitioner certification through Admin Finalize past visits',
        ]
      );
    }

    await db.query(
      `UPDATE appointment_lifecycle
          SET status='scheduled', updated_at=NOW()
        WHERE appointment_id = ANY($1::bigint[])`,
      [ids]
    );
    await db.query(
      `UPDATE appointments
          SET status='scheduled', updated_at=NOW()
        WHERE id = ANY($1::bigint[])`,
      [ids]
    );

    await db.query('COMMIT');
    return { applied: true, alreadyApplied: false, reopened: ids.length, appointmentIds: ids };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

module.exports = { MARKER, runApprovedHistoricalAttendanceReopen };
