const { pool } = require('../db/pool');

function normalizePhone(value = '') {
  return String(value || '').replace(/[^0-9]/g, '');
}

function fmtDateTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function parseConfirmationCommand(text = '') {
  const raw = String(text || '').trim();
  let match = raw.match(/^reminder_confirm_(\d+)$/i);
  if (match) return { appointmentId: Number(match[1]), explicitId: true };
  match = raw.match(/^confirm\s+(?:my\s+)?(?:appointment|booking)(?:\s+#?(\d+))?$/i);
  if (!match) return null;
  return { appointmentId: match[1] ? Number(match[1]) : null, explicitId: Boolean(match[1]) };
}

async function reminderAppointmentsForPhone(phone) {
  const result = await pool.query(
    `SELECT DISTINCT a.id,a.starts_at,a.ends_at,a.status,
            al.status AS lifecycle_status,
            COALESCE(c.display_name,a.source_client_name,'Client') AS client_name,
            COALESCE((SELECT string_agg(service_name_snapshot,' + ' ORDER BY position)
                        FROM appointment_services WHERE appointment_id=a.id),a.title,'Appointment') AS service_name,
            COALESCE((SELECT string_agg(staff_name_snapshot,' + ' ORDER BY position)
                        FROM appointment_staff WHERE appointment_id=a.id),'Shiloh practitioner') AS staff_name
       FROM appointments a
       JOIN appointment_lifecycle al ON al.appointment_id=a.id
       JOIN clients c ON c.id=a.client_id
       JOIN client_contacts cc ON cc.client_id=c.id
      WHERE cc.normalized_value=$1
        AND cc.contact_type IN ('whatsapp','mobile','phone')
        AND c.status='active'
        AND al.reminder_sent_at IS NOT NULL
        AND al.appointment_at>NOW()
        AND a.ends_at>NOW()
        AND a.status IN ('scheduled','confirmed')
        AND al.status IN ('confirmed','confirmed_by_client')
      ORDER BY a.starts_at,a.id`,
    [normalizePhone(phone)]
  );
  return result.rows;
}

function choiceReply(rows) {
  return [
    'I found more than one reminded upcoming appointment linked to this WhatsApp number.',
    'Please confirm the one you mean using its booking number:',
    '',
    ...rows.slice(0, 8).map((row) => `• #${row.id} · ${fmtDateTime(row.starts_at)} · ${row.service_name} · ${row.staff_name}`),
    '',
    'Reply *CONFIRM APPOINTMENT #123* using the correct booking number.',
  ].join('\n');
}

async function confirmReminderAppointment(phone, appointmentId) {
  const cleanPhone = normalizePhone(phone);
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const locked = await db.query(
      `SELECT DISTINCT a.id,a.status,a.starts_at,a.ends_at,al.status AS lifecycle_status
         FROM appointments a
         JOIN appointment_lifecycle al ON al.appointment_id=a.id
         JOIN clients c ON c.id=a.client_id
         JOIN client_contacts cc ON cc.client_id=c.id
        WHERE a.id=$2
          AND cc.normalized_value=$1
          AND cc.contact_type IN ('whatsapp','mobile','phone')
          AND c.status='active'
          AND al.reminder_sent_at IS NOT NULL
          AND al.appointment_at>NOW()
          AND a.ends_at>NOW()
          AND a.status IN ('scheduled','confirmed')
          AND al.status IN ('confirmed','confirmed_by_client')
        FOR UPDATE OF a,al`,
      [cleanPhone, appointmentId]
    );
    const row = locked.rows[0];
    if (!row) {
      await db.query('ROLLBACK');
      return { status: 'stale_or_unmatched' };
    }
    if (row.lifecycle_status === 'confirmed_by_client') {
      await db.query('ROLLBACK');
      return { status: 'already_confirmed', appointmentId: row.id, startsAt: row.starts_at };
    }

    if (row.status === 'scheduled') {
      await db.query(`UPDATE appointments SET status='confirmed',updated_at=NOW() WHERE id=$1`, [row.id]);
      await db.query(
        `INSERT INTO appointment_status_history
           (appointment_id,from_status,to_status,changed_by,reason)
         VALUES ($1,'scheduled','confirmed',$2,'Client explicitly confirmed appointment reminder in WhatsApp')`,
        [row.id, `client:${cleanPhone}`]
      );
    }
    await db.query(
      `UPDATE appointment_lifecycle
          SET status='confirmed_by_client',updated_at=NOW()
        WHERE appointment_id=$1`,
      [row.id]
    );
    await db.query(
      `INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
       VALUES ('client.appointment_reminder_confirmed','appointment',$1,$2::jsonb)`,
      [row.id, JSON.stringify({ phone: cleanPhone, explicitClientConfirmation: true })]
    );
    await db.query('COMMIT');
    return { status: 'confirmed', appointmentId: row.id, startsAt: row.starts_at };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

async function processAppointmentReminderConfirmationMessage(phone, text) {
  const command = parseConfirmationCommand(text);
  if (!command) return { handled: false };

  const rows = await reminderAppointmentsForPhone(phone);
  if (!rows.length) {
    return {
      handled: true,
      reply: 'I can’t find a reminder-eligible upcoming Shiloh appointment linked to this WhatsApp number. Your booking has not been changed.',
    };
  }

  let appointment = null;
  if (command.appointmentId) appointment = rows.find((row) => Number(row.id) === Number(command.appointmentId)) || null;
  else if (rows.length === 1) appointment = rows[0];
  else return { handled: true, reply: choiceReply(rows) };

  if (!appointment) {
    return {
      handled: true,
      reply: 'That booking number is not one of the reminded upcoming appointments linked to this WhatsApp number. Nothing was changed.',
    };
  }

  const result = await confirmReminderAppointment(phone, appointment.id);
  if (result.status === 'already_confirmed') {
    return {
      handled: true,
      reply: `✅ Booking #${appointment.id} is already confirmed for ${fmtDateTime(appointment.starts_at)}.`,
    };
  }
  if (result.status !== 'confirmed') {
    return {
      handled: true,
      reply: 'That appointment changed while I was checking it, so I did not update anything. Please check your upcoming booking again.',
    };
  }
  return {
    handled: true,
    reply: `✅ Thank you — booking #${appointment.id} is confirmed for ${fmtDateTime(appointment.starts_at)}. We look forward to seeing you at Shiloh.`,
  };
}

module.exports = {
  parseConfirmationCommand,
  reminderAppointmentsForPhone,
  confirmReminderAppointment,
  processAppointmentReminderConfirmationMessage,
};
