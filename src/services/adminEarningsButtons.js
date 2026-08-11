const BUTTON_COMMANDS = Object.freeze({
  admin_abigail_earnings_today: 'Abigail earnings today',
  admin_abigail_earnings_week: 'Abigail earnings this week',
  admin_abigail_earnings_month: 'Abigail earnings this month',
});

function abigailEarningsButtons() {
  return {
    body: '*Abigail earnings*\nChoose the period you want to view.',
    buttons: [
      { id: 'admin_abigail_earnings_today', title: 'Today' },
      { id: 'admin_abigail_earnings_week', title: 'This Week' },
      { id: 'admin_abigail_earnings_month', title: 'This Month' },
    ],
  };
}

function commandForAdminButton(buttonId = '') {
  return BUTTON_COMMANDS[String(buttonId).trim()] || null;
}

module.exports = { abigailEarningsButtons, commandForAdminButton, BUTTON_COMMANDS };
