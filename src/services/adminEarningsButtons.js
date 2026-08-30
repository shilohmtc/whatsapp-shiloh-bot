const BUTTON_COMMANDS = Object.freeze({
  admin_abigail_earnings_today: 'admin_retired_named_earnings',
  admin_abigail_earnings_week: 'admin_retired_named_earnings',
  admin_abigail_earnings_last_week: 'admin_retired_named_earnings',
  admin_abigail_earnings_month: 'admin_retired_named_earnings',
  admin_christel_earnings_today: 'admin_retired_named_earnings',
  admin_christel_earnings_week: 'admin_retired_named_earnings',
  admin_christel_earnings_last_week: 'admin_retired_named_earnings',
  admin_christel_earnings_month: 'admin_retired_named_earnings',
  admin_marietjie_earnings_today: 'admin_retired_named_earnings',
  admin_marietjie_earnings_week: 'admin_retired_named_earnings',
  admin_marietjie_earnings_last_week: 'admin_retired_named_earnings',
  admin_marietjie_earnings_month: 'admin_retired_named_earnings',
  admin_calendar_integrity_scan: 'admin_retired_internal_action',
  admin_calendar_integrity_issues: 'admin_retired_internal_action',
  admin_booking_confirm: 'admin_retired_calendar_action',
  admin_booking_cancel: 'admin_retired_calendar_action',
  admin_menu_appointments: 'admin_menu_appointments',
  admin_demo_client_start: 'admin_retired_internal_action',
  admin_appointment_today: 'Today',
  admin_appointment_tomorrow: 'Tomorrow',
  admin_appointment_last_week: 'admin_retired_last_week_appointments',
  admin_appointment_availability: 'admin_retired_calendar_action',
  admin_appointment_booking: 'admin_retired_calendar_action',
  admin_appointment_manage: 'admin_retired_calendar_action',
  admin_appointment_finalize: 'admin_retired_internal_action',
  admin_action_open_calendar: 'admin_open_calendar',
  admin_action_help: 'admin_retired_staff_action',
  admin_action_client: 'admin_retired_staff_action',
  admin_action_walkin: 'admin_retired_staff_action',
  admin_action_staff_services: 'admin_retired_staff_action',
  admin_action_pricing: 'admin_retired_staff_action',
  client_book_now: 'services',
});

function commandForAdminButton(id) {
  return BUTTON_COMMANDS[String(id || '').trim()] || null;
}

module.exports = { BUTTON_COMMANDS, commandForAdminButton };
