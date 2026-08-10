const { pool } = require("../db/pool");
const { normalizePhone } = require("./clientIdentityOnboarding");
const { findClients, formatClientLookupReply } = require("./adminClientLookup");
const { checkAvailability, formatAvailabilityReply } = require("./adminAvailability");
const { prepareAdminBooking, confirmAdminBooking, cancelPendingBooking } = require("./adminBooking");
const { resolveStaff, getWorkingHours, replaceWorkingHoursDay, addScheduleException, removeScheduleException, formatWorkingHours } = require("./staffScheduleService");
const { authorizeRequestedStaffService } = require("./staffScopeAuthorization");

function normalizeText(text = "") { return String(text).trim().toLowerCase().replace(/\s+/g, " "); }
function isGreeting(text = "") { return /^(hi|hello|hey|howzit|hiya|good morning|good afternoon|good evening)[!. ]*$/i.test(String(text).trim()); }
function hasPermission(admin, permission) { return admin?.permissions?.[permission] === true; }

async function getAdmin(sender) {
  const result = await pool.query(`SELECT id, staff_id, display_name, role, permissions, service_scope FROM staff_admin_accounts WHERE normalized_whatsapp = $1 AND active = TRUE`, [normalizePhone(sender)]);
  return result.rows[0] || null;
}

async function audit(adminId, action, metadata = {}) {
  await pool.query(`INSERT INTO crm_audit_events (actor_admin_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, 'admin_assistant', NULL, $3::jsonb)`, [adminId, action, JSON.stringify(metadata)]);
}

function menu(admin) {
  const lines = [`Welcome back, ${admin.display_name} 👋`, "Admin mode is active.", "", "You can use:"];
  if (hasPermission(admin, "appointment:view")) lines.push("• Today — view today's appointments", "• Tomorrow — view tomorrow's appointments", "• Check availability STAFF | SERVICE | DD/MM/YYYY HH:MM — conflict check");
  if (hasPermission(admin, "appointment:create")) lines.push("• Book client CRM_ID | STAFF | SERVICE | DD/MM/YYYY HH:MM — prepare a guarded booking");
  if (hasPermission(admin, "schedule:manage")) lines.push("• Working hours STAFF — view recurring hours/exceptions", "• Set working hours STAFF | DAY | HH:MM-HH:MM — replace one day", "• Add schedule exception STAFF | YYYY-MM-DD | TYPE | RANGE | REASON");
  if (hasPermission(admin, "walkin:create")) lines.push("• Add walk-in — register a walk-in client");
  if (hasPermission(admin, "client:lookup")) lines.push("• Find client [name/number] — look up a canonical CRM client");
  lines.push("• Help or Menu — show admin options", "", "Production bookings are only written after explicit CONFIRM BOOKING confirmation and a final conflict re-check.");
  return lines.join("\n");
}

function formatTime(date) {
  return new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(date));
}

async function getSchedule(dayOffset, admin) {
  const result = await pool.query(`
    WITH bounds AS (
      SELECT ((CURRENT_DATE + $1::int)::timestamp AT TIME ZONE 'Africa/Johannesburg') AS start_utc,
             ((CURRENT_DATE + $1::int + 1)::timestamp AT TIME ZONE 'Africa/Johannesburg') AS end_utc
    )
    SELECT a.id, a.starts_at, a.ends_at, a.status,
           COALESCE(c.display_name, a.source_client_name, 'Unknown client') AS client_name,
           COALESCE(string_agg(DISTINCT aps.service_name_snapshot, ', ') FILTER (WHERE aps.service_name_snapshot IS NOT NULL), '') AS services,
           COALESCE(string_agg(DISTINCT ast.staff_name_snapshot, ', ') FILTER (WHERE ast.staff_name_snapshot IS NOT NULL), '') AS staff
      FROM appointments a
      CROSS JOIN bounds b
      LEFT JOIN clients c ON c.id = a.client_id
      LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
      LEFT JOIN appointment_staff ast ON ast.appointment_id = a.id
     WHERE a.starts_at >= b.start_utc
       AND a.starts_at < b.end_utc
       AND a.status NOT IN ('cancelled')
       AND (
         $2::text = 'all_services'
         OR (
           $3::bigint IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM appointment_staff ast_scope
              WHERE ast_scope.appointment_id = a.id AND ast_scope.staff_id = $3
           )
           AND EXISTS (
             SELECT 1
               FROM appointment_services aps_scope
               JOIN staff_services ss_scope
                 ON ss_scope.service_id = aps_scope.service_id
                AND ss_scope.staff_id = $3
              WHERE aps_scope.appointment_id = a.id
           )
         )
       )
     GROUP BY a.id, a.starts_at, a.ends_at, a.status, c.display_name, a.source_client_name
     ORDER BY a.starts_at, a.id`, [dayOffset, admin.service_scope, admin.staff_id]);
  return result.rows;
}

function scheduleReply(label, rows) {
  if (!rows.length) return `${label}: there are no active appointments in your authorized service scope.`;
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

function parseWindows(value) {
  if (/^(closed|none)$/i.test(String(value).trim())) return [];
  const windows = [];
  for (const piece of String(value).split(',')) {
    const match = piece.trim().match(/^([0-2]\d:[0-5]\d)\s*-\s*([0-2]\d:[0-5]\d)$/);
    if (!match) return null;
    windows.push({ startsLocal: match[1], endsLocal: match[2] });
  }
  return windows;
}

async function resolvedStaffOrReply(value) {
  const resolved = await resolveStaff(value);
  if (resolved.exact) return { staff: resolved.exact };
  if (!resolved.matches.length) return { reply: `I couldn't find an active staff member matching “${value}”.` };
  return { reply: `I found more than one staff match. Please use the exact name:\n${resolved.matches.map((s)=>`• ${s.display_name} (#${s.id})`).join('\n')}` };
}

async function handleScheduleCommand(admin, text) {
  const value = String(text).trim();
  let match = value.match(/^working\s+hours\s+(.+)$/i);
  if (match) {
    if (!hasPermission(admin, "schedule:manage")) return { handled:true, reply:"Your admin account does not currently have permission to manage staff schedules." };
    const resolved = await resolvedStaffOrReply(match[1].trim()); if (resolved.reply) return { handled:true, reply:resolved.reply };
    const data = await getWorkingHours(resolved.staff.id);
    return { handled:true, reply:formatWorkingHours(data) };
  }

  match = value.match(/^set\s+working\s+hours\s+(.+?)\s*\|\s*([^|]+)\s*\|\s*(.+)$/i);
  if (match) {
    if (!hasPermission(admin, "schedule:manage")) return { handled:true, reply:"Your admin account does not currently have permission to manage staff schedules." };
    const windows = parseWindows(match[3]);
    if (windows === null) return { handled:true, reply:"Use HH:MM-HH:MM. Multiple windows may be comma-separated. Use CLOSED to clear the day." };
    const resolved = await resolvedStaffOrReply(match[1].trim()); if (resolved.reply) return { handled:true, reply:resolved.reply };
    const result = await replaceWorkingHoursDay({ staffId:resolved.staff.id, dayOfWeek:match[2].trim(), windows, actorAdminId:admin.id });
    if (result.status !== 'updated') return { handled:true, reply:result.reply || 'Working-hours update rejected.' };
    const data = await getWorkingHours(resolved.staff.id);
    return { handled:true, reply:`Working hours updated for ${resolved.staff.display_name}.\n\n${formatWorkingHours(data)}` };
  }

  match = value.match(/^add\s+schedule\s+exception\s+(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(available|unavailable)\s*\|\s*([^|]+?)(?:\s*\|\s*(.+))?$/i);
  if (match) {
    if (!hasPermission(admin, "schedule:manage")) return { handled:true, reply:"Your admin account does not currently have permission to manage staff schedules." };
    const resolved = await resolvedStaffOrReply(match[1].trim()); if (resolved.reply) return { handled:true, reply:resolved.reply };
    const range = match[4].trim();
    let startsLocal=null, endsLocal=null;
    if (!/^all[- ]?day$/i.test(range)) {
      const rangeMatch = range.match(/^([0-2]\d:[0-5]\d)\s*-\s*([0-2]\d:[0-5]\d)$/);
      if (!rangeMatch) return { handled:true, reply:"Exception range must be ALL-DAY or HH:MM-HH:MM." };
      startsLocal=rangeMatch[1]; endsLocal=rangeMatch[2];
    }
    const result = await addScheduleException({ staffId:resolved.staff.id, date:match[2], type:match[3].toLowerCase(), startsLocal, endsLocal, reason:match[5] || null, actorAdminId:admin.id });
    if (result.status !== 'created') return { handled:true, reply:result.reply || 'Schedule exception rejected.' };
    return { handled:true, reply:`Schedule exception #${result.exception.id} added for ${resolved.staff.display_name} on ${match[2]} (${match[3].toLowerCase()}, ${range}).` };
  }

  match = value.match(/^remove\s+schedule\s+exception\s+(.+?)\s*\|\s*(\d+)$/i);
  if (match) {
    if (!hasPermission(admin, "schedule:manage")) return { handled:true, reply:"Your admin account does not currently have permission to manage staff schedules." };
    const resolved = await resolvedStaffOrReply(match[1].trim()); if (resolved.reply) return { handled:true, reply:resolved.reply };
    const result = await removeScheduleException({ staffId:resolved.staff.id, exceptionId:match[2], actorAdminId:admin.id });
    return { handled:true, reply:result.status === 'removed' ? `Schedule exception #${match[2]} removed for ${resolved.staff.display_name}.` : `Schedule exception #${match[2]} was not found for ${resolved.staff.display_name}.` };
  }

  if (/^(working\s+hours|set\s+working\s+hours|add\s+schedule\s+exception|remove\s+schedule\s+exception)\b/i.test(value)) {
    return { handled:true, reply:["Schedule commands:","• Working hours STAFF","• Set working hours STAFF | DAY | HH:MM-HH:MM","• Set working hours STAFF | DAY | CLOSED","• Add schedule exception STAFF | YYYY-MM-DD | unavailable | ALL-DAY | REASON","• Add schedule exception STAFF | YYYY-MM-DD | available | HH:MM-HH:MM | REASON","• Remove schedule exception STAFF | EXCEPTION_ID"].join('\n') };
  }
  return { handled:false };
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

  const scheduleCommand = await handleScheduleCommand(admin, text);
  if (scheduleCommand.handled) return { handled:true, isAdmin:true, admin, reply:scheduleCommand.reply };

  const bookingRequest = extractBookingRequest(text);
  if (bookingRequest) {
    if (!hasPermission(admin, "appointment:create")) return { handled: true, isAdmin: true, admin, reply: "Your admin account does not currently have permission to create appointments." };
    const scope = await authorizeRequestedStaffService(admin, bookingRequest.staffName, bookingRequest.serviceName);
    if (!scope.allowed) return { handled:true, isAdmin:true, admin, reply:scope.reply };
    const result = await prepareAdminBooking({ adminId: admin.id, ...bookingRequest });
    await audit(admin.id, "admin.booking_prepared", { status: result.status, clientId: result.client?.id || Number(bookingRequest.clientId), staffId: result.staff?.id || null, serviceId: result.service?.id || null, startsAt: result.startsAt || null });
    return { handled: true, isAdmin: true, admin, reply: result.reply };
  }

  if (/^book\s+client\b/i.test(String(text).trim())) return { handled: true, isAdmin: true, admin, reply: "Use: Book client CRM_ID | STAFF | SERVICE | DD/MM/YYYY HH:MM\nExample: Book client 123 | Christel | Full Body Swedish | 10/08/2026 14:30" };

  if (isGreeting(text)) { await audit(admin.id, "admin.whatsapp_greeting"); return { handled: true, isAdmin: true, admin, reply: menu(admin) }; }

  const availabilityCheck = extractAvailabilityCheck(text);
  if (availabilityCheck) {
    if (!hasPermission(admin, "appointment:view")) return { handled: true, isAdmin: true, admin, reply: "Your admin account does not currently have permission to view appointment availability." };
    const scope = await authorizeRequestedStaffService(admin, availabilityCheck.staffName, availabilityCheck.serviceName);
    if (!scope.allowed) return { handled:true, isAdmin:true, admin, reply:scope.reply };
    const result = await checkAvailability(availabilityCheck);
    await audit(admin.id, "admin.availability_checked", { status: result.status, staffId: result.staff?.id || null, serviceId: result.service?.id || null, startsAt: result.startsAt || null, endsAt: result.endsAt || null, conflictCount: result.conflicts?.length || 0 });
    return { handled: true, isAdmin: true, admin, reply: formatAvailabilityReply(result) };
  }
  if (/^(?:check\s+)?availability\b/i.test(String(text).trim())) return { handled: true, isAdmin: true, admin, reply: "Use: Check availability STAFF | SERVICE | DD/MM/YYYY HH:MM\nExample: Check availability Christel | Full Body Swedish | 10/08/2026 14:30" };

  const clientLookup = extractClientLookup(text);
  if (clientLookup !== null) {
    if (!hasPermission(admin, "client:lookup")) return { handled: true, isAdmin: true, admin, reply: "Your admin account does not currently have permission to look up client information." };
    const lookup = await findClients(clientLookup);
    await audit(admin.id, "admin.client_lookup", { queryType: lookup.queryType, resultCount: lookup.clients.length, resultClientIds: lookup.clients.map((client) => client.id) });
    return { handled: true, isAdmin: true, admin, reply: formatClientLookupReply(clientLookup, lookup.clients) };
  }

  if (["today", "today's clients", "todays clients", "today's appointments", "todays appointments", "appointments today", "show today", "show today's appointments"].includes(value)) {
    if (!hasPermission(admin, "appointment:view")) return { handled: true, isAdmin: true, admin, reply: "Your admin account does not currently have permission to view appointments." };
    const rows = await getSchedule(0, admin); await audit(admin.id, "admin.appointments_viewed", { day: "today", count: rows.length, serviceScope: admin.service_scope }); return { handled: true, isAdmin: true, admin, reply: scheduleReply("Today's schedule", rows) };
  }
  if (["tomorrow", "tomorrow's clients", "tomorrows clients", "tomorrow's appointments", "tomorrows appointments", "appointments tomorrow", "show tomorrow", "show tomorrow's appointments"].includes(value)) {
    if (!hasPermission(admin, "appointment:view")) return { handled: true, isAdmin: true, admin, reply: "Your admin account does not currently have permission to view appointments." };
    const rows = await getSchedule(1, admin); await audit(admin.id, "admin.appointments_viewed", { day: "tomorrow", count: rows.length, serviceScope: admin.service_scope }); return { handled: true, isAdmin: true, admin, reply: scheduleReply("Tomorrow's schedule", rows) };
  }

  await audit(admin.id, "admin.whatsapp_unrecognized_command", { text: String(text).slice(0, 200) });
  return { handled: true, isAdmin: true, admin, reply: `Admin mode is active, ${admin.display_name}. I don't have that admin command connected yet.\n\n${menu(admin)}` };
}

module.exports = { processAdminAssistantMessage };
