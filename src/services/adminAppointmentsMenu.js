function has(admin, permission) {
  return admin?.permissions?.[permission] === true;
}

function isBusinessWide(admin) {
  return ['owner', 'business_admin'].includes(admin?.business_role) || admin?.calendar_scope === 'all_business';
}

function appointmentsInteractive(admin) {
  const rows = [];

  // Daily operational actions come first so they are visible without scrolling.
  if (has(admin, 'booking:update') && has(admin, 'appointment:view')) {
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

  // Diary views remain available for staff who previously checked Calendar directly.
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
  }

  // Availability remains an internal booking capability. It is intentionally not
  // exposed as a separate menu task; Make/Manage booking must validate it in-flow.
  rows.push({ id: 'menu', title: '← Back to Admin', description: 'Return to the main menu' });

  return {
    type: 'list',
    body: '*Appointments*\nChoose what you want to do.',
    buttonText: 'Appointments',
    rows,
    sectionTitle: 'Appointments',
  };
}

module.exports = { appointmentsInteractive };
