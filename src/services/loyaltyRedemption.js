const { pool } = require('../db/pool');

function hasRedeemPermission(admin) {
  return admin?.permissions?.['loyalty:redeem'] === true && admin?.service_scope === 'all_services';
}

async function insertEvent(db, redemptionId, adminId, eventType, metadata = {}) {
  await db.query(
    `INSERT INTO loyalty_redemption_events(redemption_id,actor_admin_id,event_type,metadata)
     VALUES($1,$2,$3,$4::jsonb)`,
    [redemptionId, adminId, eventType, JSON.stringify(metadata)]
  );
}

async function prepareLoyaltyRedemption(admin, clientId, appointmentId, db = pool) {
  if (!hasRedeemPermission(admin)) return { status: 'forbidden', reply: 'Your admin account does not have loyalty redemption permission.' };
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const appointment = await client.query(
      `SELECT a.id,a.client_id,a.status,a.starts_at,
              COALESCE(c.display_name,a.source_client_name,'Unknown client') AS client_name
         FROM appointments a
         LEFT JOIN clients c ON c.id=a.client_id
        WHERE a.id=$1
        FOR UPDATE OF a`,
      [appointmentId]
    );
    const appt = appointment.rows[0];
    if (!appt || Number(appt.client_id) !== Number(clientId)) {
      await client.query('ROLLBACK');
      return { status: 'invalid_appointment', reply: 'That appointment does not belong to the specified canonical CRM client.' };
    }
    if (['cancelled','completed'].includes(String(appt.status))) {
      await client.query('ROLLBACK');
      return { status: 'invalid_appointment', reply: `Loyalty redemption cannot be prepared against an appointment with status ${appt.status}.` };
    }

    const existingCommitted = await client.query(
      `SELECT id FROM loyalty_redemptions WHERE appointment_id=$1 AND status='committed' LIMIT 1`,
      [appointmentId]
    );
    if (existingCommitted.rowCount) {
      await client.query('ROLLBACK');
      return { status: 'already_redeemed', reply: 'A loyalty reward has already been committed to this appointment.' };
    }

    const existingPending = await client.query(
      `SELECT lr.id,lr.reward_id,r.reward_percent
         FROM loyalty_redemptions lr
         JOIN loyalty_rewards r ON r.id=lr.reward_id
        WHERE lr.appointment_id=$1 AND lr.client_id=$2 AND lr.status='pending'
        ORDER BY lr.id DESC LIMIT 1`,
      [appointmentId, clientId]
    );
    if (existingPending.rowCount) {
      await client.query('COMMIT');
      const row = existingPending.rows[0];
      return { status: 'pending', redemptionId: row.id, rewardId: row.reward_id, rewardPercent: Number(row.reward_percent), appointment: appt, idempotent: true };
    }

    const reward = await client.query(
      `SELECT id,reward_percent,milestone_visit_count
         FROM loyalty_rewards
        WHERE client_id=$1 AND status='available'
        ORDER BY issued_at,id
        LIMIT 1
        FOR UPDATE SKIP LOCKED`,
      [clientId]
    );
    if (!reward.rowCount) {
      await client.query('ROLLBACK');
      return { status: 'no_reward', reply: 'This client has no available loyalty reward to redeem.' };
    }

    const r = reward.rows[0];
    const key = `loyalty:${clientId}:${appointmentId}:${r.id}`;
    const inserted = await client.query(
      `INSERT INTO loyalty_redemptions(client_id,reward_id,appointment_id,status,idempotency_key,prepared_by_admin_id)
       VALUES($1,$2,$3,'pending',$4,$5)
       ON CONFLICT(idempotency_key) DO UPDATE SET updated_at=NOW()
       RETURNING *`,
      [clientId, r.id, appointmentId, key, admin.id]
    );
    const redemption = inserted.rows[0];

    const reserved = await client.query(
      `UPDATE loyalty_rewards SET status='reserved'
        WHERE id=$1 AND status='available'
        RETURNING id`,
      [r.id]
    );
    if (!reserved.rowCount) throw new Error('reward_reservation_conflict');

    await insertEvent(client, redemption.id, admin.id, 'prepared', { clientId: Number(clientId), appointmentId: Number(appointmentId), rewardId: r.id });
    await client.query('COMMIT');
    return { status: 'pending', redemptionId: redemption.id, rewardId: r.id, rewardPercent: Number(r.reward_percent), milestoneVisitCount: r.milestone_visit_count, appointment: appt, idempotent: false };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}

async function confirmLoyaltyRedemption(admin, redemptionId, db = pool) {
  if (!hasRedeemPermission(admin)) return { status: 'forbidden', reply: 'Your admin account does not have loyalty redemption permission.' };
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      `SELECT lr.*,r.status AS reward_status,r.reward_percent,a.status AS appointment_status,a.client_id AS appointment_client_id
         FROM loyalty_redemptions lr
         JOIN loyalty_rewards r ON r.id=lr.reward_id
         JOIN appointments a ON a.id=lr.appointment_id
        WHERE lr.id=$1
        FOR UPDATE OF lr,r,a`,
      [redemptionId]
    );
    const row = current.rows[0];
    if (!row) { await client.query('ROLLBACK'); return { status: 'not_found', reply: 'That loyalty redemption was not found.' }; }
    if (row.status === 'committed') { await client.query('COMMIT'); return { status: 'committed', redemption: row, idempotent: true }; }
    if (row.status !== 'pending' || row.reward_status !== 'reserved') {
      await client.query('ROLLBACK');
      return { status: 'invalid_state', reply: 'That loyalty redemption is no longer in a confirmable pending state.' };
    }
    if (Number(row.client_id) !== Number(row.appointment_client_id) || ['cancelled','completed'].includes(String(row.appointment_status))) {
      await client.query(
        `UPDATE loyalty_redemptions SET status='failed',failure_reason='appointment_no_longer_eligible',updated_at=NOW() WHERE id=$1`,
        [redemptionId]
      );
      await client.query(`UPDATE loyalty_rewards SET status='available' WHERE id=$1 AND status='reserved'`, [row.reward_id]);
      await insertEvent(client, redemptionId, admin.id, 'failed', { reason: 'appointment_no_longer_eligible' });
      await client.query('COMMIT');
      return { status: 'failed', reply: 'The appointment is no longer eligible. The reserved reward was safely released back to available.' };
    }

    await client.query(
      `UPDATE loyalty_rewards
          SET status='redeemed',redeemed_at=NOW(),appointment_id_redeemed=$2
        WHERE id=$1 AND status='reserved'`,
      [row.reward_id, row.appointment_id]
    );
    const committed = await client.query(
      `UPDATE loyalty_redemptions
          SET status='committed',committed_by_admin_id=$2,committed_at=NOW(),updated_at=NOW()
        WHERE id=$1 AND status='pending'
        RETURNING *`,
      [redemptionId, admin.id]
    );
    if (!committed.rowCount) throw new Error('redemption_commit_conflict');
    await insertEvent(client, redemptionId, admin.id, 'committed', { rewardId: row.reward_id, appointmentId: row.appointment_id });
    await client.query('COMMIT');
    return { status: 'committed', redemption: { ...row, ...committed.rows[0] }, rewardPercent: Number(row.reward_percent), idempotent: false };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}

async function cancelLoyaltyRedemption(admin, redemptionId, db = pool) {
  if (!hasRedeemPermission(admin)) return { status: 'forbidden', reply: 'Your admin account does not have loyalty redemption permission.' };
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(`SELECT * FROM loyalty_redemptions WHERE id=$1 FOR UPDATE`, [redemptionId]);
    const row = current.rows[0];
    if (!row) { await client.query('ROLLBACK'); return { status: 'not_found', reply: 'That loyalty redemption was not found.' }; }
    if (row.status === 'cancelled') { await client.query('COMMIT'); return { status: 'cancelled', idempotent: true }; }
    if (row.status !== 'pending') { await client.query('ROLLBACK'); return { status: 'invalid_state', reply: `A ${row.status} redemption cannot be cancelled.` }; }

    await client.query(`UPDATE loyalty_rewards SET status='available' WHERE id=$1 AND status='reserved'`, [row.reward_id]);
    await client.query(
      `UPDATE loyalty_redemptions SET status='cancelled',cancelled_by_admin_id=$2,cancelled_at=NOW(),updated_at=NOW() WHERE id=$1`,
      [redemptionId, admin.id]
    );
    await insertEvent(client, redemptionId, admin.id, 'cancelled', { rewardId: row.reward_id, appointmentId: row.appointment_id });
    await client.query('COMMIT');
    return { status: 'cancelled', idempotent: false };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { hasRedeemPermission, prepareLoyaltyRedemption, confirmLoyaltyRedemption, cancelLoyaltyRedemption };
