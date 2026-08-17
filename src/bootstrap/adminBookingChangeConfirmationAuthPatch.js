const { pool } = require('../db/pool');
const stateless = require('../services/adminBookingUpdateStateless');

function phoneKey(sender) {
  return String(sender || '').replace(/\D/g, '');
}

function norm(value = '') {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function appointmentIdFromAction(text) {
  const raw = String(text || '').trim();
  const patterns = [
    /^manage_service_(?:pick|confirm)_(\d+)_\d+$/i,
    /^manage_quick_reschedule_(?:slot|confirm|page|other)_(\d+)(?:_|$)/i,
    /^manage_change_(?:service|time)_(\d+)$/i,
    /^manage_booking_(?:menu|back)_(\d+)$/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

async function authorizeScopedBookingAction(sender, appointmentId) {
  const adminResult = await pool.query(
    `SELECT id,staff_id,display_name,role FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,
    [phoneKey(sender)]
  );
  const admin = adminResult.rows[0];
  if (!admin) return { authorized: false, admin: null };
  const privileged = ['jean-pierre', 'christel'].includes(norm(admin.display_name)) || ['owner', 'admin'].includes(norm(admin.role));
  if (privileged) return { authorized: true, admin };
  if (!admin.staff_id) return { authorized: false, admin };
  const scoped = await pool.query(
    `SELECT 1 FROM appointments a JOIN appointment_staff ast ON ast.appointment_id=a.id WHERE a.id=$1 AND a.status<>'cancelled' AND ast.staff_id=$2 LIMIT 1`,
    [appointmentId, admin.staff_id]
  );
  return { authorized: scoped.rowCount > 0, admin };
}

const original = stateless.processStatelessAdminBookingUpdateMessage;
stateless.processStatelessAdminBookingUpdateMessage = async function authorizedBookingConfirmationAction(sender, text, ...rest) {
  const appointmentId = appointmentIdFromAction(text);
  if (!appointmentId) return original(sender, text, ...rest);
  const access = await authorizeScopedBookingAction(sender, appointmentId);
  if (!access.admin) return { handled: false };
  if (!access.authorized) return { handled: true, admin: access.admin, reply: "You don't have permission to manage that booking." };
  return original(sender, text, ...rest);
};

module.exports = { appointmentIdFromAction, authorizeScopedBookingAction };
