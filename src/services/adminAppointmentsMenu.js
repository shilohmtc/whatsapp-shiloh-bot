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
      id: 'today',
      title: isBusinessWide(admin) ? "Today's clients" : 'My clients today',
      description: 'View today’s appointments',
    });
    rows.push({
      id: 'tomorrow',
      title: isBusinessWide(admin) ? "Tomorrow's clients" : 'My clients tomorrow',
      description: 'View tomorrow’s appointments',
    });
  }
  if (has(admin, 'appointment:create')) {
    rows.push({
      id: 'find an available time',
      title: 'Find an available time',
      description: 'Check the authoritative diary',
    });
  }
  if (has(admin, 'appointment:create') && has(admin, 'appointment:view')) {
    rows.push({
      id: 'make a booking',
      title: 'Make a booking',
      description: 'Book from your authorized services',
    });
  }
  if (has(admin, 'booking:update') && has(admin, 'appointment:view')) {
    rows.push({
      id: 'manage booking',
      title: 'Manage a booking',
      description: 'Change an existing appointment',
    });
  }
  if (has(admin, 'demo:client')) {
    rows.push({
      id: 'demo client',
      title: '🧪 Demo Client',
      description: 'Practise the controlled client journey',
    });
  }
  rows.push({ id: 'menu', title: '← Back to Admin', description: 'Return to the main menu' });

  return {
    type: 'list',
    body: '*Appointments*\nChoose what you want to do. Demo Client is isolated training data and follows your real service/practitioner scope.',
    buttonText: 'Appointments',
    rows,
    sectionTitle: 'Appointments',
  };
}

module.exports = { appointmentsInteractive };
