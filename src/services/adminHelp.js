const { pool } = require("../db/pool");
const { normalizePhone } = require("./clientIdentityOnboarding");

function normalizeHelpText(text = "") { return String(text).trim().toLowerCase().replace(/\s+/g, " "); }
function isHelpRequest(text = "") { const value = normalizeHelpText(text); return ["help","admin help","menu","admin menu","what can i do","what can you do","what can i do as admin","show admin commands","show commands"].includes(value) || /^help\s+/.test(value); }
function hasPermission(admin, permission) { return admin?.permissions?.[permission] === true; }

function mainHelp(admin) {
  const lines = ["Shiloh Admin Assistant", `Hi ${admin.display_name} 👋 Admin mode is active.`, ""];
  if (hasPermission(admin, "appointment:view")) lines.push("Appointments", "• Today — view today's appointments", "• Tomorrow — view tomorrow's appointments", "• Check availability STAFF | SERVICE | DD/MM/YYYY HH:MM — conflict check");
  if (hasPermission(admin, "appointment:create")) lines.push("• Book client CRM_ID | STAFF | SERVICE | DD/MM/YYYY HH:MM — prepare a booking", "• CONFIRM BOOKING — create the pending booking", "• CANCEL BOOKING — discard it");
  if (hasPermission(admin, "schedule:manage")) lines.push("", "Staff Scheduling", "• Working hours STAFF", "• Set working hours STAFF | DAY | HH:MM-HH:MM", "• Set working hours STAFF | DAY | CLOSED", "• Add schedule exception STAFF | YYYY-MM-DD | unavailable | ALL-DAY | REASON", "• Remove schedule exception STAFF | EXCEPTION_ID", "• Help schedule — see schedule guidance");
  if (hasPermission(admin, "walkin:create")) lines.push("", "Client Management", "• Add walk-in — register a new walk-in client", "• Help walk-in — see the walk-in registration steps");
  if (hasPermission(admin, "client:lookup")) lines.push("", "Client Lookup", "• Find client [name or number] — look up canonical CRM client details", "• Help client — see client-lookup guidance");
  lines.push("", "Help", "• Help — return to this menu", "• Menu — return to this menu", "", "Production bookings are never written by the initial Book client command. A separate explicit CONFIRM BOOKING message and final conflict re-check are required.");
  return lines.join("\n");
}

function walkinHelp(admin) {
  if (!hasPermission(admin, "walkin:create")) return "Your admin account does not currently have permission to create walk-in clients.";
  return ["Walk-in Registration Help", "", "Send: Add walk-in", "", "Shiloh will ask for full name, mobile number and mandatory date of birth. Duplicate protection runs before creation. If clear, reply YES to the walk-in summary. The mobile number remains unverified until the client confirms it personally."].join("\n");
}

function clientHelp(admin) {
  if (!hasPermission(admin, "client:lookup")) return "Your admin account does not currently have permission to look up client information.";
  return ["Client Lookup Help", "", "Send:", "• Find client [full or partial name]", "• Find client [mobile/WhatsApp number]", "", "A unique match shows canonical CRM details. Multiple matches remain candidates; Shiloh will not select or merge identities automatically.", "", "Use the returned CRM client number when preparing an admin booking."].join("\n");
}

function scheduleHelp(admin) {
  if (!hasPermission(admin, "schedule:manage")) return "Your admin account does not currently have permission to manage staff schedules.";
  return ["Staff Scheduling Help", "", "Recurring hours:", "• Working hours Christel", "• Set working hours Christel | Monday | 09:00-17:00", "• Set working hours Christel | Monday | 09:00-13:00, 14:00-17:00", "• Set working hours Christel | Sunday | CLOSED", "", "Dated exceptions:", "• Add schedule exception Christel | 2026-08-15 | unavailable | ALL-DAY | Leave", "• Add schedule exception Christel | 2026-08-15 | available | 09:00-12:00 | Special hours", "• Remove schedule exception Christel | 12", "", "Working-hours updates replace only the named day. Exceptions are explicit dated overrides. All changes are audited."].join("\n");
}

function appointmentsHelp(admin) {
  if (!hasPermission(admin, "appointment:view")) return "Your admin account does not currently have permission to view appointments.";
  const lines = ["Appointments Help", "", "• Today", "• Tomorrow", "• Check availability STAFF | SERVICE | DD/MM/YYYY HH:MM"];
  if (hasPermission(admin, "schedule:manage")) lines.push("", "Authoritative availability uses configured recurring working hours, dated exceptions, staff-service eligibility, service duration/buffers, appointments and calendar blocks.");
  if (hasPermission(admin, "appointment:create")) lines.push("", "Guarded booking creation:", "1. Find client [name/number] and use the canonical CRM ID", "2. Check availability STAFF | SERVICE | DD/MM/YYYY HH:MM", "3. Book client CRM_ID | STAFF | SERVICE | DD/MM/YYYY HH:MM", "4. Review Shiloh's summary", "5. Reply exactly CONFIRM BOOKING to write the appointment, or CANCEL BOOKING");
  return lines.join("\n");
}

function getAdminHelpReply(admin, text) {
  if (!isHelpRequest(text)) return null;
  const value = normalizeHelpText(text);
  if (/^help\s+walk[- ]?in$/.test(value) || value === "help walkin") return walkinHelp(admin);
  if (value === "help client" || value === "help clients") return clientHelp(admin);
  if (value === "help schedule" || value === "help scheduling" || value === "help working hours") return scheduleHelp(admin);
  if (value === "help appointment" || value === "help appointments") return appointmentsHelp(admin);
  return mainHelp(admin);
}

async function processAdminHelpMessage(sender, text) {
  if (!isHelpRequest(text)) return { handled: false };
  const result = await pool.query(`SELECT id, staff_id, display_name, role, permissions FROM staff_admin_accounts WHERE normalized_whatsapp = $1 AND active = TRUE`, [normalizePhone(sender)]);
  const admin = result.rows[0] || null;
  if (!admin) return { handled: false };
  return { handled: true, admin, reply: getAdminHelpReply(admin, text) };
}

module.exports = { processAdminHelpMessage, getAdminHelpReply, isHelpRequest };
