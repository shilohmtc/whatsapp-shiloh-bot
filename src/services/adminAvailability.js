const { pool } = require("../db/pool");

function clean(value = "") {
  return String(value).trim().replace(/\s+/g, " ").slice(0, 120);
}

function parseLocalDateTime(value = "") {
  const match = clean(value).match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    probe.getUTCFullYear() !== year || probe.getUTCMonth() + 1 !== month || probe.getUTCDate() !== day
    || hour > 23 || minute > 59
  ) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

async function resolveStaff(name) {
  const query = clean(name);
  const result = await pool.query(
    `SELECT id, display_name, resource_type, status
       FROM staff
      WHERE status = 'active' AND display_name ILIKE $1
      ORDER BY CASE WHEN LOWER(display_name) = LOWER($2) THEN 0 ELSE 1 END, display_name, id
      LIMIT 10`,
    [`%${query}%`, query]
  );
  return result.rows;
}

async function resolveService(name) {
  const query = clean(name);
  const result = await pool.query(
    `SELECT id, name, duration_minutes, processing_time_minutes, extra_time_minutes, price, variable_price, status
       FROM services
      WHERE status = 'active' AND name ILIKE $1
      ORDER BY CASE WHEN LOWER(name) = LOWER($2) THEN 0 ELSE 1 END, name, id
      LIMIT 10`,
    [`%${query}%`, query]
  );
  return result.rows;
}

async function suggestActiveServices(name) {
  const query = clean(name).toLowerCase();
  const tokens = query.split(/\s+/).filter((token) => token.length >= 3).slice(0, 6);
  const result = await pool.query(
    `SELECT id, name
       FROM services
      WHERE status = 'active'
      ORDER BY
        CASE
          WHEN LOWER(name) = $1 THEN 0
          WHEN $2::text[] <> '{}'::text[] AND EXISTS (
            SELECT 1 FROM unnest($2::text[]) token WHERE LOWER(name) LIKE '%' || token || '%'
          ) THEN 1
          ELSE 2
        END,
        name,
        id
      LIMIT 8`,
    [query, tokens]
  );
  return result.rows;
}

function candidateNames(rows, field) {
  return rows.slice(0, 8).map((row) => `• ${row[field]} (#${row.id})`).join("\n");
}

async function checkAvailability({ staffName, serviceName, localDateTime }) {
  const parsedDateTime = parseLocalDateTime(localDateTime);
  if (!parsedDateTime) {
    return { status: "invalid_datetime", reply: "Please use DD/MM/YYYY HH:MM, for example 10/08/2026 14:30." };
  }

  const staffMatches = await resolveStaff(staffName);
  if (!staffMatches.length) return { status: "staff_not_found", reply: `I couldn't find an active staff member matching “${clean(staffName)}”.` };
  if (staffMatches.length > 1 && staffMatches[0].display_name.toLowerCase() !== clean(staffName).toLowerCase()) {
    return { status: "staff_ambiguous", reply: `I found more than one possible staff match. Please be more specific:\n${candidateNames(staffMatches, "display_name")}` };
  }
  const staff = staffMatches[0];

  const serviceMatches = await resolveService(serviceName);
  if (!serviceMatches.length) {
    const suggestions = await suggestActiveServices(serviceName);
    const suggestionText = suggestions.length
      ? `\n\nActive canonical services you can use:\n${candidateNames(suggestions, "name")}\n\nRetry the command using one of these exact service names.`
      : "\n\nThere are currently no active canonical services available to suggest.";
    return {
      status: "service_not_found",
      reply: `I couldn't find an active service matching “${clean(serviceName)}”.${suggestionText}`,
    };
  }
  if (serviceMatches.length > 1 && serviceMatches[0].name.toLowerCase() !== clean(serviceName).toLowerCase()) {
    return { status: "service_ambiguous", reply: `I found more than one possible service match. Please be more specific:\n${candidateNames(serviceMatches, "name")}` };
  }
  const service = serviceMatches[0];

  const eligibility = await pool.query(
    `SELECT 1 FROM staff_services WHERE staff_id = $1 AND service_id = $2 LIMIT 1`,
    [staff.id, service.id]
  );
  if (!eligibility.rowCount) {
    return {
      status: "not_eligible",
      staff,
      service,
      reply: `${staff.display_name} is not currently mapped as eligible for ${service.name} in the canonical CRM catalogue. No booking should be created for this combination.`,
    };
  }

  const totalMinutes = Number(service.duration_minutes || 0) + Number(service.processing_time_minutes || 0) + Number(service.extra_time_minutes || 0);
  if (totalMinutes <= 0) {
    return { status: "invalid_duration", staff, service, reply: `${service.name} does not have a usable positive duration in the canonical service catalogue.` };
  }

  const conflictResult = await pool.query(
    `WITH requested AS (
       SELECT
         ($3::timestamp AT TIME ZONE 'Africa/Johannesburg') AS starts_at,
         (($3::timestamp + ($4::text || ' minutes')::interval) AT TIME ZONE 'Africa/Johannesburg') AS ends_at
     )
     SELECT 'appointment' AS conflict_type, a.id, a.starts_at, a.ends_at,
            COALESCE(c.display_name, a.source_client_name, 'Unknown client') AS label
       FROM requested r
       JOIN appointment_staff ast ON ast.staff_id = $1
       JOIN appointments a ON a.id = ast.appointment_id
       LEFT JOIN clients c ON c.id = a.client_id
      WHERE a.status <> 'cancelled'
        AND a.starts_at < r.ends_at
        AND a.ends_at > r.starts_at
     UNION ALL
     SELECT 'calendar_block' AS conflict_type, cb.id, cb.starts_at, cb.ends_at,
            COALESCE(cb.title, cb.block_type, 'Calendar block') AS label
       FROM requested r
       JOIN calendar_blocks cb ON cb.staff_id = $1
      WHERE cb.starts_at < r.ends_at
        AND cb.ends_at > r.starts_at
     ORDER BY starts_at, id`,
    [staff.id, service.id, parsedDateTime, totalMinutes]
  );

  const windowResult = await pool.query(
    `SELECT
       ($1::timestamp AT TIME ZONE 'Africa/Johannesburg') AS starts_at,
       (($1::timestamp + ($2::text || ' minutes')::interval) AT TIME ZONE 'Africa/Johannesburg') AS ends_at`,
    [parsedDateTime, totalMinutes]
  );

  return {
    status: conflictResult.rows.length ? "conflict" : "clear",
    staff,
    service,
    startsAt: windowResult.rows[0].starts_at,
    endsAt: windowResult.rows[0].ends_at,
    totalMinutes,
    conflicts: conflictResult.rows,
  };
}

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

function formatAvailabilityReply(result) {
  if (result.reply) return result.reply;
  const start = formatLocalDateTime(result.startsAt);
  const end = formatLocalDateTime(result.endsAt);
  const heading = `${result.staff.display_name} — ${result.service.name}\nRequested: ${start} to ${end}`;

  if (result.status === "conflict") {
    const lines = [heading, "", "CRM conflict found:"];
    for (const conflict of result.conflicts.slice(0, 8)) {
      lines.push(`• ${formatLocalDateTime(conflict.starts_at)}–${new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(conflict.ends_at))} — ${conflict.conflict_type.replace("_", " ")} — ${conflict.label}`);
    }
    lines.push("", "Do not create a booking for this time unless the conflict is resolved.");
    return lines.join("\n");
  }

  return [
    heading,
    "",
    "No conflicting canonical appointment or staff calendar block was found.",
    "",
    "Important: this is a CRM conflict check, not a complete working-hours guarantee. Recurring staff working-hours rules are not yet modeled, so the admin must still confirm the practitioner is working at this time before any production booking is created.",
  ].join("\n");
}

module.exports = { checkAvailability, formatAvailabilityReply };
