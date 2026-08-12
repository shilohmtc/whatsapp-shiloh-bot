const BUTTON_COMMANDS = Object.freeze({
  admin_abigail_earnings_today: 'Abigail earnings today',
  admin_abigail_earnings_week: 'Abigail earnings this week',
  admin_abigail_earnings_last_week: 'Abigail earnings last week',
  admin_abigail_earnings_month: 'Abigail earnings this month',
  admin_christel_earnings_today: 'Christel earnings today',
  admin_christel_earnings_week: 'Christel earnings this week',
  admin_christel_earnings_last_week: 'Christel earnings last week',
  admin_christel_earnings_month: 'Christel earnings this month',
  admin_calendar_integrity_scan: 'Calendar integrity scan',
  admin_calendar_integrity_issues: 'Calendar integrity issues',
  admin_booking_confirm: 'Confirm booking',
  admin_booking_cancel: 'Cancel booking',
  admin_menu_appointments: 'Appointments',
  admin_demo_client_start: 'Demo Client',
});

function earningsPeriodList(kind) {
  const name = kind === 'christel' ? 'Christel' : 'Abigail';
  return {
    type: 'list',
    body: `*${name} earnings*\nChoose the period you want to view.`,
    button: 'Choose period',
    sections: [{
      title: 'Earnings period',
      rows: [
        { id: `admin_${kind}_earnings_today`, title: 'Today' },
        { id: `admin_${kind}_earnings_week`, title: 'This Week' },
        { id: `admin_${kind}_earnings_last_week`, title: 'Last Week' },
        { id: `admin_${kind}_earnings_month`, title: 'This Month' },
      ],
    }],
  };
}

function abigailEarningsButtons() { return earningsPeriodList('abigail'); }
function christelEarningsButtons() { return earningsPeriodList('christel'); }

function calendarIntegrityButtons() {
  return {
    body: '*Calendar integrity*\nShiloh never auto-imports manual Google Calendar events as CRM bookings. Choose an integrity check.',
    buttons: [
      { id: 'admin_calendar_integrity_scan', title: 'Scan Now' },
      { id: 'admin_calendar_integrity_issues', title: 'Open Issues' },
    ],
  };
}

function commandForAdminButton(buttonId = '') {
  return BUTTON_COMMANDS[String(buttonId).trim()] || null;
}

module.exports = {
  abigailEarningsButtons,
  christelEarningsButtons,
  calendarIntegrityButtons,
  commandForAdminButton,
  BUTTON_COMMANDS,
};
