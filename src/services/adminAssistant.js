const { pool } = require("../db/pool");
const { normalizePhone } = require("./clientIdentityOnboarding");
const { findClients, formatClientLookupReply } = require("./adminClientLookup");
const { checkAvailability, formatAvailabilityReply } = require("./adminAvailability");
const { prepareAdminBooking, confirmAdminBooking, cancelPendingBooking } = require("./adminBooking");

function normalizeText(text = "") { return String(text).trim().toLowerCase().replace(/\s+/g, " "); }
function isGreeting(text = "") { return /^(hi|hello|hey|howzit|hiya|good morning|good afternoon|good evening)[!. ]*$/i.test(String(text).trim()); }
function hasPermission(admin, permission) { return admin?.permissions?.[permission] === true; }

async function getAdmin(sender) {
  const result = await pool.query(`SELECT id, staff_id, display_name, role, permissions FROM staff_admin_accounts WHERE normalized_whatsapp = $1 AND active = TRUE`, [normalizePhone(sender)]);
  return result.rows[0] || null;
}

async function audit(adminId, action, metadata = {}) {
  await pool.query(`INSERT INTO crm_audit_events (actor_admin_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, 'admin_assistant', NULL, $3::jsonb)`, [adminId, action, JSON.stringify(metadata)]);
}

function menu(admin) {
  const lines = [`Welcome back, ${admin.display_name} 👋`, "Admin mode is active.", "", "You can use:"];
  if (hasPermission(admin, "appointment:view")) lines.push("• Today — view today's appointments", "• Tomorrow — view tomorrow's appointments", "• Check availability STAFF | SERVICE | DD/MM/YYYY HH:MM — conflict check");
  if (hasPermission(admin, "appointment:create")) lines.push("• Book client CRM_ID | STAFF | SERVICE | DD/MM/YYYY HH:MM — prepare a guarded booking");
  if (hasPermission(admin, "walkin:create")) lines.push("• Add walk-in — register a walk-in client");
  if (hasPermission(admin, "client:lookup")) lines.push("• Find client [name/number] — look up a canonical CRM client");
  lines.push("• Help or Menu — show admin options", "", "Production bookings are only written after explicit CONFIRM BOOKING confirmation and a final conflict re-check.");
  return lines.join("\n");
}

function formatTime(date) {
  return new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(date));
}

async function getSchedule(dayOffset) {
  const result = await pool.query(`WITH bounds AS (SELECT ((CURRENT_DATE + $1::int)::timestamp AT TIME ZONE 'Africa/Johannesburg') AS start_utc, ((CURRENT_DATE + $1::int + 1)::timestamp AT TIME ZONE 'Africa/Johannesburg') AS end_utc) SELECT a.id, a.starts_at, a.ends_at, a.status, COALESCE(c.display_name, a.source_client_name, 'Unknown client') AS client_name, COALESCE(string_agg(DISTINCT aps.service_name_snapshot, ', ') FILTER (WHERE aps.service_name_snapshot IS NOT NULL), '') AS services, COALESCE(string_agg(DISTINCT ast.staff_name_snapshot, ', ') FILTER (WHERE ast.staff_name_snapshot IS NOT NULL), '') AS staff FROM appointments a CROSS JOIN bounds b LEFT JOIN clients c ON c.id = a.client_id LEFT JOIN appointment_services aps ON aps.appointment_id = a.id LEFT JOIN appointment_staff ast ON ast.appointment_id = a.id WHERE a.starts_at >= b.start_utc AND a.starts_at < b.end_utc AND a.status NOT IN ('cancelled') GROUP BY a.id, a.starts_at, a.ends_at, a.status, c.display_name, a.source_client_name ORDER BY a.starts_at, a.id`, [dayOffset]);
  return result.rows;
}

function scheduleReply(label, rows) {
  if (!rows.length) return `${label}: there are no active appointments in the CRM.`;
  const lines = [`${label} — ${rows.length} appointment${rows.length === 1 ? "" : "s"}`];
  for (const row of rows.slice(0, 25)) lines.push(`${formatTime(row.starts_at)} ${row.client_name}${row.services ? ` — ${row.services}` : ""}${row.staff ? ` — ${row.staff}` : ""}`);
  if (rows.length > 25) lines.push(`…and ${rows.length - 25} more.`);
  return lines.join("\n");
}

function extractClientLookup(text = "") {
  const value = String(text).trim();
  const match = value.match(/^(?:find|lookup|search(?: for)?)\s+client\s+(.+)$/i) || value.match(/^client\s+(?:find|lookup|search)\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function extractAvailabilityCheck(text = "") {
  const value = String(text).trim();
  const match = value.match(/^(?:check\s+)?availability\s+(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/i) || value.match(/^check\s+availability\s+for\s+(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/i);
  return match ? { staffName: match[1].trim(), serviceName: match[2].trim(), localDateTime: match[3].trim() } : null;
}

function extractBookingRequest(text = "") {
  const value = String(text).trim();
  const match = value.match(/^book\s+client\s+(?:crm\s*#?\s*)?(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/i);
  return match ? { clientId: match[1], staffName: match[2].trim(), serviceName: match[3].trim(), localDateTime: match[4].trim() } : null;
}

async function processAdminAssistantMessage(sender, text) {
  const admin = await getAdmin(sender);
  if (!admin) return { handled: false, isAdmin: false };
  const value = normalizeText(text);

  if (value === "confirm booking") {
    if (!hasPermission(admin, "appointment:create")) return { handled: true, isAdmin: true, admin, reply: "Your admin account does not currently have permission to create appointments." };
    const result = await confirmAdminBooking(admin);
    return { handled: true, isAdmin: true, admin, reply: result.reply };
  }

  if (value === "cancel booking") {
    const cancelled = await cancelPendingBooking(admin.id);
    await audit(admin.id, "admin.booking_cancelled", { hadPendingBooking: cancelled });
    return { handled: true, isAdmin: true, admin, reply: cancelled ? "Pending admin booking cancelled. No appointment was created." : "There is no pending admin booking to cancel." };
  }

  const bookingRequest = extractBookingRequest(text);
  if (bookingRequest) {
    if (!hasPermission(admin, "appointment:create")) return { handled: true, isAdmin: true, admin, reply: "Your admin account does not currently have permission to create appointments." };
    const result = await prepareAdminBooking({ adminId: admin.id, ...bookingRequest });
    await audit(admin.id, "admin.booking_prepared", { status: result.status, clientId: result.client?.id || Number(bookingRequest.clientId), staffId: result.staff?.id || null, serviceId: result.service?.id || null, startsAt: result.startsAt || null });
    return { handled: true, isAdmin: true, admin, reply: result.reply };
  }

  if (/^book\s+client\b/i.test(String(text).trim())) return { handled: true, isAdmin: true, admin, reply: "Use: Book client CRM_ID | STAFF | SERVICE | DD/MM/YYYY HH:MM\nExample: Book client 123 | Christel | Swedish Massage | 10/08/2026 14:30" };

  if (isGreeting(text)) { await audit(admin.id, "admin.whatsapp_greeting"); return { handled: true, isAdmin: true, admin, reply: menu(admin) }; }

  const availabilityCheck = extractAvailabilityCheck(text);
  if (availabilityCheck) {
    if (!hasPermission(admin, "appointment:view")) return { handled: true, isAdmin: true, admin, reply: "Your admin account does not currently have permission to view appointment availability." };
    const result = await checkAvailability(availabilityCheck);
    await audit(admin.id, "admin.availability_checked", { status: result.status, staffId: result.staff?.id || null, serviceId: result.service?.id || null, startsAt: result.startsAt || null, endsAt: result.endsAt || null, conflictCount: result.conflicts?.length || 0 });
    return { handled: true, isAdmin: true, admin, reply: formatAvailabilityReply(result) };
  }
  if (/^(?:check\s+)?availability\b/i.test(String(text).trim())) return { handled: true, isAdmin: true, admin, reply: "Use: Check availability STAFF | SERVICE | DD/MM/YYYY HH:MM\nExample: Check availability Christel | Swedish Massage | 10/08/2026 14:30" };

  const clientLookup = extractClientLookup(text);
  if (clientLookup !== null) {
    if (!hasPermission(admin, "client:lookup")) return { handled: true, isAdmin: true, admin, reply: "Your admin account does not currently have permission to look up client information." };
    const lookup = await findClients(clientLookup);
    await audit(admin.id, "admin.client_lookup", { queryType: lookup.queryType, resultCount: lookup.clients.length, resultClientIds: lookup.clients.map((client) => client.id) });
    return { handled: true, isAdmin: true, admin, reply: formatClientLookupReply(clientLookup, lookup.clients) };
  }

  if (["today", "today's appointments", "todays appointments", "appointments today", "show today", "show today's appointments"].includes(value)) {
    if (!hasPermission(admin, "appointment:view")) return { handled: true, isAdmin: true, admin, reply: "Your admin account does not currently have permission to view appointments." };
    const rows = await getSchedule(0); await audit(admin.id, "admin.appointments_viewed", { day: "today", count: rows.length }); return { handled: true, isAdmin: true, admin, reply: scheduleReply("Today's schedule", rows) };
  }
  if (["tomorrow", "tomorrow's appointments", "tomorrows appointments", "appointments tomorrow", "show tomorrow", "show tomorrow's appointments"].includes(value)) {
    if (!hasPermission(admin, "appointment:view")) return { handled: true, isAdmin: true, admin, reply: "Your admin account does not currently have permission to view appointments." };
    const rows = await getSchedule(1); await audit(admin.id, "admin.appointments_viewed", { day: "tomorrow", count: rows.length }); return { handled: true, isAdmin: true, admin, reply: scheduleReply("Tomorrow's schedule", rows) };
  }

  await audit(admin.id, "admin.whatsapp_unrecognized_command", { text: String(text).slice(0, 200) });
  return { handled: true, isAdmin: true, admin, reply: `Admin mode is active, ${admin.display_name}. I don't have that admin command connected yet.\n\n${menu(admin)}` };
}

module.exports = { processAdminAssistantMessage };
