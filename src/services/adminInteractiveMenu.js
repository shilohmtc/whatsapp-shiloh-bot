const {
  getMenuOptions,
  processAdminMobileMenuMessage,
} = require('./adminMobileMenu');
const { processAdminAppointmentsByDateMessage } = require('./adminAppointmentsByDate');
const { processAdminHelpMessage } = require('./adminHelp');
const { processAdminWalkinMessage } = require('./adminWalkin');
const { processAdminStaffServicesMessage } = require('./adminStaffServices');
const { processAdminLoyaltyRedemptionMessage } = require('./adminLoyaltyRedemption');
const { processAdminReportsMessage } = require('./adminReports');
const { processAdminServiceTrendsMessage } = require('./adminServiceTrends');
const { processAdminChristelEarningsMessage } = require('./adminChristelEarnings');
const { processAdminMarietjieEarningsMessage } = require('./adminMarietjieEarnings');
const {
  hasPendingForAdmin,
  processAdminPendingBookingApprovalsMessage,
} = require('./adminPendingBookingApprovals');
const {
  processRetiredAdminAuthorityMessage,
} = require('./adminAuthorityRetirement');
const {
  buildCalendarHandoffUrl,
  calendarHandoffPublicOrigin,
  createStaffCalendarHandoffService,
} = require('./staffCalendarHandoff');

const calendarHandoffService = createStaffCalendarHandoffService();

const ACTIONS = [
  { key: 'open_calendar', command: 'Open Calendar', description: 'Open the authoritative Calendar securely' },
  { key: 'today', command: 'Today', description: 'View today’s authorized appointments' },
  { key: 'tomorrow', command: 'Tomorrow', description: 'View tomorrow’s authorized appointments' },
  { key: 'reports', command: 'Reports', description: 'Open operational and service reports' },
  { key: 'earnings', command: 'Earnings', description: 'Open role-authorized earnings reports' },
  { key: 'help', command: 'Help', description: 'Show retained WhatsApp staff help' },
  { key: 'pending_approvals', command: 'Pending approvals', description: 'Review pending practitioner decisions' },
  { key: 'client', command: 'Find a client', description: 'Find an authorized CRM client' },
  { key: 'walkin', command: 'Add a walk-in', description: 'Register a walk-in client' },
  { key: 'staff_services', command: 'Staff services', description: 'View authorized staff/service mappings' },
  { key: 'pricing', command: 'Services & pricing', description: 'View or manage authorized service pricing' },
];

const ACTION_BY_KEY = new Map(ACTIONS.map((action) => [action.key, action]));
const REPORT_COMMANDS = {
  admin_report_today: "Today's report",
  admin_report_week: 'This week report',
  admin_report_last_week: 'Last week report',
  admin_report_month: 'This month report',
  admin_report_service_trends: 'Service trends',
};
const EARNINGS_PERIODS = ['today', 'week', 'last_week', 'month'];

function normalizedAdminName(admin) {
  return String(admin?.display_name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function isBusinessWide(admin) {
  return ['owner', 'business_admin'].includes(admin?.business_role)
    || admin?.calendar_scope === 'all_business';
}
function has(admin, permission) { return admin?.permissions?.[permission] === true; }

function actionForId(id) {
  const match = String(id || '').trim().match(/^admin_action_([a-z0-9_]+)$/i);
  return match ? ACTION_BY_KEY.get(match[1].toLowerCase()) || null : null;
}

function isActionVisibleForAdmin(action, admin) {
  if (!action || !admin) return false;
  if (action.key === 'pending_approvals') return has(admin, 'appointment:view');
  return getMenuOptions(admin).some((option) => option.key === action.key);
}

function workspaceLauncherInteractive(admin, pendingApprovals = false) {
  const name = String(admin?.display_name || 'Shiloh staff').trim();
  const buttons = [
    { id: 'admin_open_calendar', title: 'Open Calendar' },
    { id: 'admin_open_menu', title: 'Admin' },
  ];
  if (pendingApprovals) buttons.push({ id: 'admin_action_pending_approvals', title: 'Pending approvals' });
  return {
    type: 'button',
    body: `*Shiloh Workspace 🌿*\n\nHello ${name}. Choose where you want to go.`,
    buttons,
  };
}

function menuDescription(key) {
  return ACTION_BY_KEY.get(key)?.description || 'Open authorized staff action';
}

function topLevelInteractive(admin) {
  const options = getMenuOptions(admin);
  return {
    type: 'list',
    body: '*Shiloh Admin 🌿*\nWhatsApp provides quick operational views. Calendar owns diary changes.',
    buttonText: 'Admin menu',
    sectionTitle: 'Staff actions',
    rows: options.map((option) => ({
      id: `admin_action_${option.key}`,
      title: option.label.slice(0, 24),
      description: menuDescription(option.key),
    })),
  };
}

function reportsInteractive() {
  return {
    type: 'list',
    body: '*Reports*\nChoose an operational report. Service trends remain under Reports.',
    buttonText: 'Reports',
    sectionTitle: 'Reports',
    rows: [
      { id: 'admin_report_today', title: 'Today', description: 'Today’s authorized activity' },
      { id: 'admin_report_week', title: 'This week', description: 'Current calendar week' },
      { id: 'admin_report_last_week', title: 'Last week', description: 'Previous completed week' },
      { id: 'admin_report_month', title: 'This month', description: 'Current calendar month' },
      { id: 'admin_report_service_trends', title: 'Service trends', description: 'Last 30 days vs previous 30' },
      { id: 'admin_open_menu', title: '← Back to Admin', description: 'Return to staff actions' },
    ],
  };
}

function earningsSubjects(admin) {
  if (!has(admin, 'appointment:view')) return [];
  const name = normalizedAdminName(admin);
  if (name === 'christel' && isBusinessWide(admin)) return ['christel', 'abigail', 'marietjie'];
  if (name === 'jean-pierre' && isBusinessWide(admin)) return ['christel', 'abigail', 'marietjie'];
  if (name === 'marietjie' && admin?.staff_id) return ['marietjie'];
  if (name === 'abigail' && admin?.staff_id) return ['abigail'];
  return [];
}

function earningsPeriodInteractive(subject) {
  const title = subject.charAt(0).toUpperCase() + subject.slice(1);
  const rows = [
    ['today', 'Today'],
    ['week', 'This week'],
    ['last_week', 'Last week'],
    ['month', 'This month'],
  ].map(([period, label]) => ({
    id: `admin_earnings_period_${subject}_${period}`,
    title: label,
    description: `${title} completed-treatment earnings`,
  }));
  rows.push({ id: 'admin_action_earnings', title: '← Back to Earnings', description: 'Choose earnings scope' });
  return {
    type: 'list',
    body: `*Earnings*\n${title} — choose a reporting period.`,
    buttonText: 'Earnings period',
    sectionTitle: 'Reporting period',
    rows,
  };
}

function earningsInteractive(admin) {
  const subjects = earningsSubjects(admin);
  if (!subjects.length) return null;
  if (subjects.length === 1) return earningsPeriodInteractive(subjects[0]);
  return {
    type: 'list',
    body: '*Earnings*\nChoose an authorized earnings scope.',
    buttonText: 'Earnings',
    sectionTitle: 'Earnings scope',
    rows: [
      ...subjects.map((subject) => ({
        id: `admin_earnings_subject_${subject}`,
        title: subject.charAt(0).toUpperCase() + subject.slice(1),
        description: 'Open completed-treatment earnings',
      })),
      { id: 'admin_open_menu', title: '← Back to Admin', description: 'Return to staff actions' },
    ],
  };
}

function periodCommand(subject, period) {
  const periodText = period === 'last_week'
    ? 'last week'
    : period === 'week'
      ? 'this week'
      : period === 'month'
        ? 'this month'
        : 'today';
  return `${subject.charAt(0).toUpperCase() + subject.slice(1)} earnings ${periodText}`;
}

async function dispatchEarningsPeriod(sender, admin, subject, period) {
  if (!earningsSubjects(admin).includes(subject) || !EARNINGS_PERIODS.includes(period)) {
    return { handled: true, admin, reply: 'That earnings action is not available for your staff role.' };
  }
  const command = periodCommand(subject, period);
  if (subject === 'christel') return processAdminChristelEarningsMessage(sender, command);
  if (subject === 'marietjie') return processAdminMarietjieEarningsMessage(sender, command);
  return processAdminReportsMessage(sender, command);
}

async function issueCalendarHandoffForSender(sender, admin = null) {
  if (!calendarHandoffPublicOrigin(process.env)) {
    return { handled: true, admin, reply: 'Calendar access is not available right now. No WhatsApp mutation was attempted.' };
  }
  const issued = await calendarHandoffService.issueForWhatsapp({ whatsapp: sender });
  if (!issued?.ok) {
    return { handled: true, admin, reply: 'Calendar access is not available for this staff account. No WhatsApp mutation was attempted.' };
  }
  const url = buildCalendarHandoffUrl(issued.token, process.env);
  if (!url) return { handled: true, admin, reply: 'Calendar access is not available right now. No WhatsApp mutation was attempted.' };
  return {
    handled: true,
    admin,
    reply: `*Open Calendar*\n\nThis diary action now lives in Shiloh Calendar. Tap this secure one-time link:\n${url}\n\nIt expires shortly and can only be used once. No WhatsApp diary mutation was attempted.`,
  };
}

async function processAdminRetiredAuthorityMessage(sender, text) {
  const retired = await processRetiredAdminAuthorityMessage(sender, text);
  if (!retired.handled || retired.reply) return retired;
  if (retired.disposition?.kind === 'generic_earnings') {
    const interactive = earningsInteractive(retired.admin);
    return interactive
      ? { handled: true, admin: retired.admin, interactive }
      : { handled: true, admin: retired.admin, reply: 'No earnings reports are available for your staff role.' };
  }
  return issueCalendarHandoffForSender(sender, retired.admin);
}

async function dispatchStableAction(sender, action, admin) {
  if (!isActionVisibleForAdmin(action, admin)) {
    return { handled: true, admin, reply: 'That staff action is not available for your role. No action was taken.' };
  }
  if (action.key === 'open_calendar') return issueCalendarHandoffForSender(sender, admin);
  if (action.key === 'today' || action.key === 'tomorrow') {
    return processAdminAppointmentsByDateMessage(sender, action.command);
  }
  if (action.key === 'reports') return { handled: true, admin, interactive: reportsInteractive() };
  if (action.key === 'earnings') {
    const interactive = earningsInteractive(admin);
    return interactive
      ? { handled: true, admin, interactive }
      : { handled: true, admin, reply: 'No earnings reports are available for your staff role.' };
  }
  if (action.key === 'help') return processAdminHelpMessage(sender, action.command);
  if (action.key === 'pending_approvals') return processAdminPendingBookingApprovalsMessage(sender, action.command);
  if (action.key === 'walkin') return processAdminWalkinMessage(sender, action.command);
  return processAdminMobileMenuMessage(sender, action.command);
}

function isWorkspaceLauncherTerm(raw = '') {
  return /^(?:menu|home|start|hi|hello|hey|howzit|hiya|good morning|good afternoon|good evening)[!. ]*$/i.test(String(raw).trim());
}

async function renderMobileResult(sender, result) {
  if (result?.view === 'workspace') {
    const pending = has(result.admin, 'appointment:view')
      ? await hasPendingForAdmin(result.admin)
      : false;
    return { handled: true, admin: result.admin, interactive: workspaceLauncherInteractive(result.admin, pending) };
  }
  if (result?.view === 'admin_menu') {
    return { handled: true, admin: result.admin, interactive: topLevelInteractive(result.admin) };
  }
  if (result?.handled) return result;
  if (result?.action) return dispatchStableAction(sender, ACTION_BY_KEY.get(result.action), result.admin);
  return result;
}

async function processAdminInteractiveMenuMessage(sender, text) {
  const mobile = await processAdminMobileMenuMessage(sender, text);
  const renderedMobile = await renderMobileResult(sender, mobile);
  if (renderedMobile?.handled) return renderedMobile;
  if (!mobile?.isAdmin || !mobile.admin) return { handled: false };

  const admin = mobile.admin;
  const raw = String(text || '').trim();

  const retired = await processAdminRetiredAuthorityMessage(sender, text);
  if (retired.handled) return retired;

  const pendingApproval = await processAdminPendingBookingApprovalsMessage(sender, text);
  if (pendingApproval.handled) return pendingApproval;

  const report = await processAdminReportsMessage(sender, text);
  if (report.handled) return report;
  const trends = await processAdminServiceTrendsMessage(sender, text);
  if (trends.handled) return trends;
  const staffServices = await processAdminStaffServicesMessage(sender, text);
  if (staffServices.handled) return staffServices;
  const walkin = await processAdminWalkinMessage(sender, text);
  if (walkin.handled) return walkin;
  const loyalty = await processAdminLoyaltyRedemptionMessage(sender, text);
  if (loyalty.handled) return loyalty;

  if (/^(?:admin_open_calendar|open calendar|calendar)$/i.test(raw)) {
    return dispatchStableAction(sender, ACTION_BY_KEY.get('open_calendar'), admin);
  }
  if (/^(?:admin_open_menu|admin|admin menu)$/i.test(raw)) {
    return { handled: true, admin, interactive: topLevelInteractive(admin) };
  }

  const reportCommand = REPORT_COMMANDS[raw.toLowerCase()];
  if (reportCommand) {
    return raw.toLowerCase() === 'admin_report_service_trends'
      ? processAdminServiceTrendsMessage(sender, reportCommand)
      : processAdminReportsMessage(sender, reportCommand);
  }

  const subjectMatch = raw.match(/^admin_earnings_subject_(christel|abigail|marietjie)$/i);
  if (subjectMatch) {
    const subject = subjectMatch[1].toLowerCase();
    if (!earningsSubjects(admin).includes(subject)) {
      return { handled: true, admin, reply: 'That earnings scope is not available for your staff role.' };
    }
    return { handled: true, admin, interactive: earningsPeriodInteractive(subject) };
  }

  const periodMatch = raw.match(/^admin_earnings_period_(christel|abigail|marietjie)_(today|week|last_week|month)$/i);
  if (periodMatch) return dispatchEarningsPeriod(sender, admin, periodMatch[1].toLowerCase(), periodMatch[2].toLowerCase());

  const action = actionForId(raw);
  if (action) return dispatchStableAction(sender, action, admin);

  if (/^(?:today|today's clients|todays clients|appointments today)$/i.test(raw)) {
    return dispatchStableAction(sender, ACTION_BY_KEY.get('today'), admin);
  }
  if (/^(?:tomorrow|tomorrow's clients|tomorrows clients|appointments tomorrow)$/i.test(raw)) {
    return dispatchStableAction(sender, ACTION_BY_KEY.get('tomorrow'), admin);
  }
  if (/^reports?$/i.test(raw)) return dispatchStableAction(sender, ACTION_BY_KEY.get('reports'), admin);
  if (/^(?:earnings|my earnings)$/i.test(raw)) return dispatchStableAction(sender, ACTION_BY_KEY.get('earnings'), admin);
  if (/^help\b/i.test(raw)) return dispatchStableAction(sender, ACTION_BY_KEY.get('help'), admin);

  return {
    handled: true,
    isAdmin: true,
    admin,
    reply: 'That staff WhatsApp action is unavailable. No action was taken. Send *Menu* for the retained options or *Open Calendar* for diary work.',
  };
}

function enrichPrivilegedReportsMenu(result) { return result; }
function enrichJeanPierreMenu(result) { return result; }

module.exports = {
  ACTIONS,
  actionForId,
  dispatchEarningsPeriod,
  dispatchStableAction,
  earningsInteractive,
  earningsPeriodInteractive,
  earningsSubjects,
  enrichJeanPierreMenu,
  enrichPrivilegedReportsMenu,
  isActionVisibleForAdmin,
  isWorkspaceLauncherTerm,
  issueCalendarHandoffForSender,
  processAdminInteractiveMenuMessage,
  processAdminRetiredAuthorityMessage,
  reportsInteractive,
  topLevelInteractive,
  workspaceLauncherInteractive,
};
