const { pool } = require("../db/pool");
const { checkAvailability, formatAvailabilityReply, checkAuthoritativeSchedule, getConflicts } = require("./adminAvailability");

function formatLocalDateTime(value) {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

async function getSingleActiveLocation() {
  const result = await pool.query(
    `SELECT id, name, timezone
       FROM locations
      WHERE status = 'active'
      ORDER BY id
      LIMIT 2`
  );
  if (result.rowCount !== 1) return null;
  return result.rows[0];
}

async function prepareAdminBooking({ adminId, clientId, staffName, serviceName, localDateTime }) {
  if (!/^\d+$/.test(String(clientId)) || Number(clientId) <= 0) {
    return { status: "invalid_client", reply: "Use the canonical CRM client number from Find client, for example: Book client 123 | Christel | Full Body Swedish | 10/08/2026 14:30" };
  }

  const clientResult = await pool.query(
    `SELECT id, display_name, date_of_birth, status
       FROM clients
      WHERE id = $1`,
    [clientId]
  );
  const client = clientResult.rows[0] || null;
  if (!client) return { status: "client_not_found", reply: `Canonical CRM client #${clientId} was not found.` };
  if (client.status !== "active") return { status: "client_inactive", reply: `CRM client #${clientId} (${client.display_name || "Unnamed client"}) is not active, so I won't create a booking.` };

  const location = await getSingleActiveLocation();
  if (!location) {
    return { status: "location_ambiguous", reply: "I can't safely create this booking because the CRM does not currently resolve to exactly one active clinic location." };
  }

  const availability = await checkAvailability({ staffName, serviceName, localDateTime });
  if (availability.status !== "available") {
    return { status: availability.status, reply: formatAvailabilityReply(availability), availability };
  }

  if (new Date(availability.startsAt).getTime() <= Date.now()) {
    return { status: "past_time", reply: "I won't prepare a new booking in the past. Please choose a future date and time." };
  }

  await pool.query(
    `INSERT INTO admin_booking_sessions
       (admin_id, client_id, staff_id, service_id, location_id, starts_at, ends_at, state, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirm', NOW())
     ON CONFLICT (admin_id) DO UPDATE SET
       client_id = EXCLUDED.client_id,
       staff_id = EXCLUDED.staff_id,
       service_id = EXCLUDED.service_id,
       location_id = EXCLUDED.location_id,
       starts_at = EXCLUDED.starts_at,
       ends_at = EXCLUDED.ends_at,
       state = 'confirm',
       updated_at = NOW()`,
    [adminId, client.id, availability.staff.id, availability.service.id, location.id, availability.startsAt, availability.endsAt]
  );

  const price = availability.service.variable_price
    ? (availability.service.price == null ? "variable" : `from R${Number(availability.service.price).toFixed(2)} (variable)`)
    : (availability.service.price == null ? "not set" : `R${Number(availability.service.price).toFixed(2)}`);

  return {
    status: "pending_confirmation",
    client,
    staff: availability.staff,
    service: availability.service,
    location,
    startsAt: availability.startsAt,
    endsAt: availability.endsAt,
    reply: [
      "Booking ready for confirmation",
      `• Client: ${client.display_name || "Unnamed client"} — CRM #${client.id}`,
      `• Service: ${availability.service.name}`,
      `• Staff: ${availability.staff.display_name}`,
      `• Location: ${location.name}`,
      `• Time: ${formatLocalDateTime(availability.startsAt)} to ${new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(availability.endsAt))}`,
      `• Price: ${price}`,
      "",
      "No production appointment has been created yet.",
      "Reply exactly CONFIRM BOOKING to create it, or CANCEL BOOKING to discard it.",
    ].join("\n"),
  };
}

async function cancelPendingBooking(adminId) {
  const result = await pool.query(`DELETE FROM admin_booking_sessions WHERE admin_id = $1 RETURNING admin_id`, [adminId]);
  return result.rowCount > 0;
}

async function confirmAdminBooking(admin) {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");

    const sessionResult = await db.query(
      `SELECT abs.admin_id, abs.client_id, abs.staff_id, abs.service_id, abs.location_id,
              abs.starts_at, abs.ends_at, abs.state,
              c.display_name AS client_name, c.status AS client_status,
              st.display_name AS staff_name, st.status AS staff_status,
              s.name AS service_name, s.status AS service_status,
              s.duration_minutes, s.processing_time_minutes, s.extra_time_minutes,
              s.price, s.variable_price,
              l.name AS location_name, l.status AS location_status
         FROM admin_booking_sessions abs
         JOIN clients c ON c.id = abs.client_id
         JOIN staff st ON st.id = abs.staff_id
         JOIN services s ON s.id = abs.service_id
         JOIN locations l ON l.id = abs.location_id
        WHERE abs.admin_id = $1
        FOR UPDATE OF abs`,
      [admin.id]
    );
    const session = sessionResult.rows[0] || null;
    if (!session) {
      await db.query("ROLLBACK");
      return { status: "no_pending", reply: "There is no pending admin booking to confirm. Start with: Book client CRM_ID | STAFF | SERVICE | DD/MM/YYYY HH:MM" };
    }

    await db.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [session.staff_id]);

    if (session.state !== "confirm" || session.client_status !== "active" || session.staff_status !== "active" || session.service_status !== "active" || session.location_status !== "active") {
      await db.query(`DELETE FROM admin_booking_sessions WHERE admin_id = $1`, [admin.id]);
      await db.query("COMMIT");
      return { status: "stale", reply: "The pending booking is no longer valid because one of its canonical CRM records changed. It was discarded; please start again." };
    }

    if (new Date(session.starts_at).getTime() <= Date.now()) {
      await db.query(`DELETE FROM admin_booking_sessions WHERE admin_id = $1`, [admin.id]);
      await db.query("COMMIT");
      return { status: "past_time", reply: "The pending booking time has already passed, so it was discarded. Please start again with a future time." };
    }

    const eligibility = await db.query(`SELECT 1 FROM staff_services WHERE staff_id = $1 AND service_id = $2 LIMIT 1`, [session.staff_id, session.service_id]);
    if (!eligibility.rowCount) {
      await db.query(`DELETE FROM admin_booking_sessions WHERE admin_id = $1`, [admin.id]);
      await db.query("COMMIT");
      return { status: "eligibility_changed", reply: "The staff/service eligibility changed before confirmation, so the booking was not created." };
    }

    const schedule = await checkAuthoritativeSchedule({ db, staffId: session.staff_id, startsAt: session.starts_at, endsAt: session.ends_at });
    if (schedule.partialUnavailable || (schedule.allDayUnavailable && !schedule.insideAvailableException) || !schedule.covered) {
      await db.query(`DELETE FROM admin_booking_sessions WHERE admin_id = $1`, [admin.id]);
      await db.query("COMMIT");
      return { status: "schedule_changed", reply: "The practitioner's authoritative working schedule no longer permits this time. Nothing was written. Please run availability again." };
    }

    const conflicts = await getConflicts({ db, staffId: session.staff_id, startsAt: session.starts_at, endsAt: session.ends_at });
    if (conflicts.length) {
      await db.query(`DELETE FROM admin_booking_sessions WHERE admin_id = $1`, [admin.id]);
      await db.query("COMMIT");
      return { status: "conflict", reply: "A conflicting appointment or staff calendar block appeared before confirmation. Nothing was written. Please run availability again." };
    }

    const totalPrice = session.variable_price ? null : session.price;
    const appointmentResult = await db.query(
      `INSERT INTO appointments
         (client_id, location_id, starts_at, ends_at, status, title, total_price, currency, source)
       VALUES ($1, $2, $3, $4, 'scheduled', $5, $6, 'ZAR', 'shiloh_admin_whatsapp')
       RETURNING id, starts_at, ends_at, status`,
      [session.client_id, session.location_id, session.starts_at, session.ends_at, session.service_name, totalPrice]
    );
    const appointment = appointmentResult.rows[0];

    await db.query(
      `INSERT INTO appointment_services
         (appointment_id, service_id, position, service_name_snapshot, price_snapshot, duration_minutes_snapshot)
       VALUES ($1, $2, 1, $3, $4, $5)`,
      [appointment.id, session.service_id, session.service_name, session.price, session.duration_minutes]
    );

    await db.query(
      `INSERT INTO appointment_staff
         (appointment_id, staff_id, position, staff_name_snapshot)
       VALUES ($1, $2, 1, $3)`,
      [appointment.id, session.staff_id, session.staff_name]
    );

    await db.query(
      `INSERT INTO appointment_status_history
         (appointment_id, from_status, to_status, changed_by, reason)
       VALUES ($1, NULL, 'scheduled', $2, 'WhatsApp Admin Assistant explicit booking confirmation')`,
      [appointment.id, `admin:${admin.id}:${admin.display_name}`]
    );

    await db.query(
      `INSERT INTO crm_audit_events
         (actor_admin_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'admin.booking_created', 'appointment', $2, $3::jsonb)`,
      [admin.id, appointment.id, JSON.stringify({ clientId: session.client_id, staffId: session.staff_id, serviceId: session.service_id, locationId: session.location_id, startsAt: session.starts_at, endsAt: session.ends_at, authoritativeScheduleChecked: true })]
    );

    await db.query(`DELETE FROM admin_booking_sessions WHERE admin_id = $1`, [admin.id]);
    await db.query("COMMIT");

    return {
      status: "created",
      appointmentId: appointment.id,
      reply: [
        `Booking created successfully — appointment #${appointment.id}.`,
        `• Client: ${session.client_name} — CRM #${session.client_id}`,
        `• Service: ${session.service_name}`,
        `• Staff: ${session.staff_name}`,
        `• Time: ${formatLocalDateTime(session.starts_at)}`,
        `• Location: ${session.location_name}`,
        "",
        "The production write occurred only after your explicit CONFIRM BOOKING message and a final authoritative schedule, eligibility, and conflict re-check.",
      ].join("\n"),
    };
  } catch (error) {
    try { await db.query("ROLLBACK"); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

module.exports = { prepareAdminBooking, confirmAdminBooking, cancelPendingBooking };
