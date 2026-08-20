const { pool } = require('../db/pool');
const adminAvailability = require('../services/adminAvailability');
const {
  featureEnabled,
  isClientConfirmation,
  pendingRescheduleConflicts,
  createPendingRescheduleRequest,
  processRescheduleApprovalDecision,
  supersedePendingRescheduleForAppointment,
} = require('../services/clientRescheduleApproval');

const originalGetConflicts = adminAvailability.getConflicts;
adminAvailability.getConflicts = async function getConflictsWithRescheduleHolds(args = {}) {
  const conflicts = await originalGetConflicts(args);
  if (!featureEnabled()) return conflicts;
  const holds = await pendingRescheduleConflicts({
    db: args.db || pool,
    staffId: args.staffId,
    startsAt: args.startsAt,
    endsAt: args.endsAt,
    excludeRequestId: args.excludeRescheduleRequestId || null,
  });
  return [...conflicts, ...holds].sort((a, b) => {
    const byStart = new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    return byStart || Number(a.id) - Number(b.id);
  });
};

const originalCheckAvailability = adminAvailability.checkAvailability;
adminAvailability.checkAvailability = async function checkAvailabilityWithRescheduleHolds(args = {}) {
  const result = await originalCheckAvailability(args);
  if (!featureEnabled() || result?.status !== 'available' || !result?.staff?.id) return result;
  const holds = await pendingRescheduleConflicts({
    staffId: result.staff.id,
    startsAt: result.startsAt,
    endsAt: result.endsAt,
  });
  if (!holds.length) return result;
  return { ...result, status: 'conflict', conflicts: holds };
};

// Load downstream services only after adminAvailability exports have been wrapped.
const appointmentChange = require('../services/appointmentChange');
const bookingApproval = require('../services/clientBookingApproval');

const originalProcessAppointmentChangeMessage = appointmentChange.processAppointmentChangeMessage;
appointmentChange.processAppointmentChangeMessage = async function practitionerApprovedClientReschedule(phone, text, ...rest) {
  if (!featureEnabled()) return originalProcessAppointmentChangeMessage(phone, text, ...rest);
  const priorIntent = await appointmentChange.getIntent(phone);
  if (
    priorIntent?.action === 'reschedule'
    && priorIntent?.status === 'awaiting_confirmation'
    && isClientConfirmation(text)
  ) {
    const result = await createPendingRescheduleRequest(phone, priorIntent);
    await appointmentChange.clearIntent(phone);
    return { handled: true, ...result };
  }

  const result = await originalProcessAppointmentChangeMessage(phone, text, ...rest);
  if (
    priorIntent?.action === 'cancel'
    && priorIntent?.appointment_id
    && priorIntent?.status === 'awaiting_confirmation'
    && isClientConfirmation(text)
  ) {
    const status = await pool.query('SELECT status FROM appointments WHERE id=$1', [Number(priorIntent.appointment_id)]);
    if (status.rows[0]?.status === 'cancelled') {
      await supersedePendingRescheduleForAppointment(priorIntent.appointment_id, 'client cancelled the original appointment');
    }
  }
  return result;
};

const originalProcessBookingApprovalMessage = bookingApproval.processClientBookingApprovalMessage;
bookingApproval.processClientBookingApprovalMessage = async function bookingOrRescheduleApproval(sender, text, ...rest) {
  const reschedule = await processRescheduleApprovalDecision(sender, text);
  if (reschedule.handled) return reschedule;
  return originalProcessBookingApprovalMessage(sender, text, ...rest);
};
