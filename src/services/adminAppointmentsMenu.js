function has(admin, permission) {
  return admin?.permissions?.[permission] === true;
}

function isBusinessWide(admin) {
  return ['owner', 'business_admin'].includes(admin?.business_role) || admin?.calendar_scope === 'all_business';
}

function normalizedAdminName(admin) {
  return String(admin?.display_name || '').trim().toLowerCase();
}

function canAccessFinalization(admin) {
  return ['christel', 'marietjie'].includes(normalizedAdminName(admin));
}

function appointmentsInteractive(admin) {
  const rows = [];

  // Daily operational actions come first so they are visible without scrolling.
  // Finalization authority is deliberately narrow: Christel finalizes Christel
  // and Abigail visits; Marietjie finalizes only her own visits.
  if (canAccessFinalization(admin) && has(admin, 'booking:update') && has(admin, 'appointment:view')) {
    rows.push({
      id: 'admin_appointment_finalize',
      title: 'Finalize past visits',
      description: 'Completed, No-show, Reschedule or leave unresolved',
    });
  }
  if (has(admin, 'appointment:create') && has(admin, 'appointment:view')) {
    rows.push({
      id: 'admin_appointment_booking',
      title: 'Make a booking',
      description: 'Book using authoritative availability',
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
