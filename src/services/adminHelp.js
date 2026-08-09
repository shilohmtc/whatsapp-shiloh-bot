const { pool } = require("../db/pool");
const { normalizePhone } = require("./clientIdentityOnboarding");

function normalizeHelpText(text = "") {
  return String(text).trim().toLowerCase().replace(/\s+/g, " ");
}

function isHelpRequest(text = "") {
  const value = normalizeHelpText(text);
  return ["help","admin help","menu","admin menu","what can i do","what can you do","what can i do as admin","show admin commands","show commands"].includes(value) || /^help\s+/.test(value);
}

function hasPermission(admin, permission) {
  return admin?.permissions?.[permission] === true;
}

function mainHelp(admin) {
  const lines = ["Shiloh Admin Assistant", `Hi ${admin.display_name} 👋 How can I help you today?`, ""];
  if (hasPermission(admin, "walkin:create")) lines.push("Client Management", "• Add walk-in — register a new walk-in client", "• Help walk-in — see the walk-in registration steps");
  if (hasPermission(admin, "client:lookup")) lines.push("", "Client Lookup", "• Find client [name or number] — client lookup is being added to Admin Assistant", "• Help client — see current client-management guidance");
  lines.push("", "Help", "• Help — return to this menu", "• Menu — return to this menu", "• Cancel — cancel an active walk-in registration", "", "You can also tell me what you want to do in normal language. I’ll only show or perform actions your admin account is permitted to use.");
  return lines.join("\n");
}

function walkinHelp(admin) {
  if (!hasPermission(admin, "walkin:create")) return "Your admin account does not currently have permission to create walk-in clients.";
  return ["Walk-in Registration Help", "", "Send: Add walk-in", "", "Shiloh will then ask for:", "1. Client's full name", "2. Client's mobile number", "3. Client's date of birth — mandatory, DD/MM/YYYY", "", "Before creating the client, Shiloh checks the CRM for an existing mobile-number match and for a possible duplicate with the same name and date of birth.", "", "If no duplicate is found, Shiloh shows a summary. Reply YES to create the client or NO to cancel.", "", "The mobile number is stored as unverified until the client confirms it personally through WhatsApp."].join("\n");
}

function clientHelp(admin) {
  if (!hasPermission(admin, "client:lookup")) return "Your admin account does not currently have permission to look up client information.";
  return ["Client Management Help", "", "Current live admin capability:", "• Add walk-in — safely create a new walk-in client", "", "Duplicate protection is always applied before a new client is created.", "", "Client lookup and client-detail commands are part of the Admin Assistant roadmap and will appear in this guide when they are live."].join("\n");
}

function appointmentsHelp() {
  return ["Appointments Help", "", "Admin appointment commands are not live yet. The current Admin Assistant release focuses on safe walk-in client registration.", "", "When appointment administration is enabled, this menu will expose only the actions your admin account is permitted to use."].join("\n");
}

function getAdminHelpReply(admin, text) {
  if (!isHelpRequest(text)) return null;
  const value = normalizeHelpText(text);
  if (/^help\s+walk[- ]?in$/.test(value) || value === "help walkin") return walkinHelp(admin);
  if (value === "help client" || value === "help clients") return clientHelp(admin);
  if (value === "help appointment" || value === "help appointments") return appointmentsHelp(admin);
  return mainHelp(admin);
}

async function processAdminHelpMessage(sender, text) {
  if (!isHelpRequest(text)) return { handled: false };
  const result = await pool.query(
    `SELECT id, staff_id, display_name, role, permissions
       FROM staff_admin_accounts
      WHERE normalized_whatsapp = $1 AND active = TRUE`,
    [normalizePhone(sender)]
  );
  const admin = result.rows[0] || null;
  if (!admin) return { handled: false };
  return { handled: true, admin, reply: getAdminHelpReply(admin, text) };
}

module.exports = { processAdminHelpMessage, getAdminHelpReply, isHelpRequest };
