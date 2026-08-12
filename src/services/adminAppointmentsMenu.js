function has(admin, permission) {
  return admin?.permissions?.[permission] === true;
}

function isBusinessWide(admin) {
  return ['owner', 'business_admin'].includes(admin?.business_role) || admin?.calendar_scope === 'all_business';
}

function appointmentsInteractive(admin) {
  const rows = [];
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
      id: 'admin_appointment_last_week',
      title: isBusinessWide(admin) ? "Last week's clients" : 'My clients last week',
      description: 'View the previous Monday–Sunday',
    });
  }
  if (has(admin, 'appointment:create')) {
    rows.push({
      id: 'admin_appointment_availability',
      title: 'Find an available time',
      description: 'Check the authoritative diary',
    });
  }
  if (has(admin, 'appointment:create') && has(admin, 'appointment:view')) {
    rows.push({
      id: 'admin_appointment_booking',
      title: 'Make a booking',
      description: 'Book from your authorized services',
    });
  }
  if (has(admin, 'booking:update') && has(admin, 'appointment:view')) {
    rows.push({
      id: 'admin_appointment_manage',
      title: 'Manage a booking',
      description: 'Change an existing appointment',
    });
    rows.push({
      id: 'admin_appointment_finalize',
      title: 'Finalize past visits',
      description: 'Mark Completed or No-show explicitly',
    });
  }
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
