const { pool } = require('../db/pool');

const BATCH_KEY = 'historical_attendance_christel_abigail_2026-08-01_2026-08-08';
const CANDIDATE_IDS = Object.freeze([
  327, 485, 328, 553, 329, 554, 331, 330, 486, 334,
  557, 556, 336, 337, 338, 339, 340, 342, 341, 343,
  344, 345, 346, 347, 349, 350, 559, 351, 352,
]);
const FINAL_PRESERVE = new Set(['cancelled', 'no_show']);
const ALLOWED_STAFF = new Set(['christel', 'abigail']);

async function applyHistoricalAttendanceCorrectionAug2026() {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');

    const existing = await db.query(
      `SELECT id FROM crm_audit_events
        WHERE action='maintenance.historical_attendance_aug1_8_2026'
          AND entity_type='batch'
          AND metadata->>'batchKey'=$1
        LIMIT 1`,
      [BATCH_KEY]
    );
    if (existing.rowCount) {
      await db.query('ROLLBACK');
      return { status: 'already_applied', batchKey: BATCH_KEY };
    }

    const christel = await db.query(
      `SELECT id FROM staff_admin_accounts
        WHERE active=TRUE AND lower(trim(display_name))='christel'
        ORDER BY id LIMIT 1`
    );
    const actorAdminId = christel.rows[0]?.id || null;
    if (!actorAdminId) throw new Error('Christel admin account not available for historical attendance audit');

    const rows = await db.query(
      `SELECT a.id,a.status,a.starts_at,
              array_agg(DISTINCT lower(trim(s.display_name)) ORDER BY lower(trim(s.display_name))) AS staff_names
         FROM appointments a
         JOIN appointment_staff ast ON ast.appointment_id=a.id
         JOIN staff s ON s.id=ast.staff_id
        WHERE a.id = ANY($1::bigint[])
        GROUP BY a.id,a.status,a.starts_at
        ORDER BY a.id
        FOR UPDATE OF a`,
      [CANDIDATE_IDS]
    );

    if (rows.rowCount !== CANDIDATE_IDS.length) {
      throw new Error(`Historical attendance proof mismatch: expected ${CANDIDATE_IDS.length} appointments, found ${rows.rowCount}`);
    }

    const found = new Set(rows.rows.map((row) => Number(row.id)));
    for (const id of CANDIDATE_IDS) if (!found.has(id)) throw new Error(`Historical attendance appointment #${id} missing`);

    for (const row of rows.rows) {
      const clinicDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date(row.starts_at));
      if (clinicDate < '2026-08-01' || clinicDate > '2026-08-08') {
        throw new Error(`Historical attendance appointment #${row.id} outside confirmed date range (${clinicDate})`);
      }
      const staffNames = row.staff_names || [];
      if (!staffNames.length || staffNames.some((name) => !ALLOWED_STAFF.has(name))) {
        throw new Error(`Historical attendance appointment #${row.id} has staff outside Christel/Abigail scope`);
      }
    }

    let updated = 0;
    let alreadyCompleted = 0;
    const preserved = [];
    for (const row of rows.rows) {
      if (row.status === 'completed') { alreadyCompleted += 1; continue; }
      if (FINAL_PRESERVE.has(row.status)) { preserved.push({ id: Number(row.id), status: row.status }); continue; }

      await db.query(`UPDATE appointments SET status='completed',updated_at=NOW() WHERE id=$1`, [row.id]);
      await db.query(
        `INSERT INTO appointment_status_history (appointment_id,from_status,to_status,changed_by,reason)
         VALUES ($1,$2,'completed',$3,$4)`,
        [row.id, row.status, 'maintenance:user-confirmed:christel', 'User-confirmed historical attendance correction for Christel/Abigail visits, 1-8 August 2026']
      );
      await db.query(`UPDATE appointment_lifecycle SET status='completed',updated_at=NOW() WHERE appointment_id=$1`, [row.id]);
      await db.query(
        `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata)
         VALUES ($1,'maintenance.historical_appointment_completed','appointment',$2,$3::jsonb)`,
        [actorAdminId, Number(row.id), JSON.stringify({
          batchKey: BATCH_KEY,
          fromStatus: row.status,
          toStatus: 'completed',
          userConfirmed: true,
          confirmedDateRange: ['2026-08-01', '2026-08-08'],
          confirmedPractitioners: ['Christel', 'Abigail'],
        })]
      );
      updated += 1;
    }

    await db.query(
      `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata)
       VALUES ($1,'maintenance.historical_attendance_aug1_8_2026','batch',0,$2::jsonb)`,
      [actorAdminId, JSON.stringify({
        batchKey: BATCH_KEY,
        candidateCount: CANDIDATE_IDS.length,
        updated,
        alreadyCompleted,
        preserved,
        userConfirmed: true,
        confirmedDateRange: ['2026-08-01', '2026-08-08'],
        confirmedPractitioners: ['Christel', 'Abigail'],
      })]
    );

    await db.query('COMMIT');
    return { status: 'applied', batchKey: BATCH_KEY, candidateCount: CANDIDATE_IDS.length, updated, alreadyCompleted, preserved };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

module.exports = { BATCH_KEY, CANDIDATE_IDS, applyHistoricalAttendanceCorrectionAug2026 };
