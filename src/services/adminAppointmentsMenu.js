const { canPresentAdminBooking } = require('./adminBookingEntitlement');
const { canAccessOwnFinalization } = require('./attendanceFinalizationAuthority');
const { canPresentBlockTime } = require('./adminBlockTime');

function has(admin, permission) {
  return admin?.permissions?.[permission] === true;
}

function isBusinessWide(admin) {
  return ['owner', 'business_admin'].includes(admin?.business_role) || admin?.calendar_scope === 'all_business';
}

function canAccessFinalization(admin) {
  return canAccessOwnFinalization(admin);
}

function appointmentsInteractive(admin) {
  const rows = [];

  // Daily operational actions come first so they are visible without scrolling.
  // Finalization authority is deliberately narrow: each linked practitioner
  // Admin finalizes only their own visits. Jean-Pierre has no finalization.
  if (canAccessFinalization(admin) && has(admin, 'booking:update') && has(admin, 'appointment:view')) {
    rows.push({
      id: 'admin_appointment_finalize',
      title: 'Finalize past visits',
      description: 'Completed, No-show, Reschedule or leave unresolved',
    });
  }
  if (canPresentAdminBooking(admin)) {
    rows.push({
      id: 'admin_appointment_booking',
      title: 'Make a booking',
      description: 'Book using authoritative availability',
    });
  }
  if (canPresentBlockTime(admin)) {
    rows.push({
      id: 'admin_appointment_block_time',
      title: 'Block time',
      description: 'Make practitioner time unavailable for booking',
    });
    rows.push({
      id: 'admin_block_manage',
      title: 'Blocked time',
      description: 'View, edit or remove upcoming Shiloh blocks',
    });
  }
  if (has(admin, 'booking:update') && has(admin, 'appointment:view')) {
    rows.push({
      id: 'admin_appointment_manage',
      title: 'Manage a booking',
      description: 'Reschedule or cancel an existing appointment',
    });
  }

  if (has(admin, 'appointment:view')) {
    rows.push({
      id: 'admin_appointment_today',
      title: isBusinessWide(admin) ? "Today's clients" : 'My clients today',
      description: 'View today’s appointments',
    });
    rows.push({
      id: 'admin_appointment_tomorrow',
      title: isBusinessWide(admin) ? "Tomorrow's clients" : 'My clients tomorrow',
      description: 'View tomorrow’s appointments',
    });
    rows.push({
      id: 'admin_action_pending_approvals',
      title: 'Pending approvals',
      description: 'Review held requests and safely resend approval',
    });
  }

  // Availability remains internal to Make/Manage booking instead of a standalone task.
  rows.push({ id: 'menu', title: '← Back to Admin', description: 'Return to the main menu' });

  return {
    type: 'list',
    body: '*Appointments*\nChoose what you want to do.',
    buttonText: 'Appointments',
    rows,
    sectionTitle: 'Appointments',
  };
}

module.exports = { appointmentsInteractive, canAccessFinalization };
