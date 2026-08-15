const { processAdminMobileMenuMessage } = require('./adminMobileMenu');
const { processAdminAppointmentFinalizationMessage } = require('./adminAppointmentFinalization');
const { processAdminAppointmentsByDateMessage } = require('./adminAppointmentsByDate');
const { processAdminHelpMessage } = require('./adminHelp');
const { processAdminWalkinMessage } = require('./adminWalkin');
const { processJeanPierreControlPlaneMessage } = require('./jeanPierreAdminControlPlane');
const { processAdminMarietjieEarningsMessage } = require('./adminMarietjieEarnings');
const { processAdminTestClientResetMessage } = require('./adminTestClientReset');
const { processAdminPendingBookingApprovalsMessage } = require('./adminPendingBookingApprovals');
const { abigailEarningsButtons, christelEarningsButtons, marietjieEarningsButtons } = require('./adminEarningsButtons');

const SECTION_ORDER = ['Appointments', 'Reports', 'Clients', 'Services', 'Schedule', 'More'];

const ACTIONS = [
  { key: 'today', labels: ["Today's clients", 'My clients today'], command: 'today', description: 'View today’s appointments' },
  { key: 'tomorrow', labels: ["Tomorrow's clients", 'My clients tomorrow'], command: 'tomorrow', description: 'View tomorrow’s appointments' },
  { key: 'availability', labels: ['Find an available time'], command: 'Find an available time', description: 'Check the authoritative diary' },
  { key: 'demo_client', labels: ['🧪 Demo Client', 'Demo Client'], command: 'Demo Client', description: 'Controlled regression harness' },
  { key: 'today_report', labels: ["Today's report", 'My report today'], command: "Today's report", description: 'View today’s scoped business report' },
  { key: 'christel_earnings', labels: ['💰 Christel earnings', 'Christel earnings'], command: 'Christel earnings', description: 'Completed-only earnings report' },
  { key: 'abigail_earnings', labels: ['💰 Abigail earnings', 'Abigail earnings'], command: 'Abigail earnings', description: 'Completed-only earnings report' },
  { key: 'marietjie_earnings', labels: ['💰 Marietjie earnings', 'Marietjie earnings'], command: 'Marietjie earnings', description: 'Completed-only earnings report' },
  { key: 'booking', labels: ['Make a booking'], command: 'Make a booking', description: 'Create a guarded appointment' },
  { key: 'manage_booking', labels: ['Manage a booking'], command: 'Manage a booking', description: 'Change an existing appointment' },
  { key: 'pending_approvals', labels: ['Pending approvals', 'Pending booking approvals'], command: 'Pending approvals', description: 'Review held requests and safely resend approval' },
  { key: 'finalize', labels: ['Finalize past visits'], command: 'Finalize past appointments', description: 'Mark Completed or No-show explicitly' },
  { key: 'client', labels: ['Find a client', 'Find my client'], command: 'Find a client', description: 'Search authorized CRM clients' },
  { key: 'reset_chenique', labels: ['Reset Chenique profile'], command: 'Reset test client Chenique', description: 'Reset approved booking-test client' },
  { key: 'reset_juvan', labels: ['Reset Juvan profile'], command: 'Reset test client Juvan', description: 'Reset approved booking-test client' },
  { key: 'reset_dummy_test', labels: ['Reset Dummy Test profile'], command: 'Reset test client Dummy Test', description: 'Reset approved booking-test client' },
  { key: 'walkin', labels: ['Add a walk-in'], command: 'Add a walk-in', description: 'Register a walk-in client' },
  { key: 'staff_services', labels: ['Staff services', 'My services'], command: 'Staff services', description: 'View authorized service mappings' },
  { key: 'pricing', labels: ['Services & pricing', 'My services & pricing'], command: 'Services & pricing', description: 'View or manage service pricing' },
  { key: 'schedule', labels: ['Schedule management', 'My schedule'], command: 'Schedule', description: 'Manage authorized diary settings' },
  { key: 'calendar_integrity', labels: ['🛡️ Calendar integrity', 'Calendar integrity'], command: 'Calendar integrity scan', description: 'Check booking/calendar integrity' },
  { key: 'help', labels: ['Help'], command: 'Help', description: 'Show admin help' },
];

function normalizeLabel(value = '') {
  return String(value).replace(/[🧪💰🛡️]/gu, '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function actionForLabel(label) {
  const normalized = normalizeLabel(label);
  return ACTIONS.find((action) => action.labels.some((candidate) => normalizeLabel(candidate) === normalized)) || null;
}
function actionForId(id) {
  const match = String(id || '').trim().match(/^admin_action_([a-z0-9_]+)$/);
  return match ? ACTIONS.find((action) => action.key === match[1]) || null : null;
}
function parseVisibleMenu(body = '') {
  const sections = new Map(); let currentSection = null;
  for (const line of String(body).split('\n')) {
    const sectionMatch = line.trim().match(/^\*(Appointments|Reports|Clients|Services|Schedule|More)\*$/);
    if (sectionMatch) { currentSection = sectionMatch[1]; if (!sections.has(currentSection)) sections.set(currentSection, []); continue; }
    const optionMatch = line.trim().match(/^\d+️⃣\s+(.+)$/u);
    if (!optionMatch || !currentSection) continue;
    const action = actionForLabel(optionMatch[1]);
    if (action) sections.get(currentSection).push({ action, title: optionMatch[1].trim() });
  }
  return sections;
}
function isActionVisibleInMenu(action, body = '') {
  if (!action?.key) return false;
  for (const entries of parseVisibleMenu(body).values()) {
    if (entries.some((entry) => entry.action.key === action.key)) return true;
  }
  return false;
}
function compactMenuBody(body = '') {
  const compact = []; let insertedPrompt = false;
  for (const line of String(body).split('\n')) {
    const trimmed = line.trim();
    if (/^\*(Appointments|Reports|Clients|Services|Schedule|More)\*$/.test(trimmed) || /^\d+️⃣\s+/u.test(trimmed)) continue;
    if (/^Use the real \*/.test(trimmed)) { if (!insertedPrompt) compact.push('Choose a section below.'); insertedPrompt = true; continue; }
    compact.push(line);
  }
  while (compact.length && !compact[compact.length - 1].trim()) compact.pop();
  return compact.join('\n').replace(/\n{3,}/g, '\n\n');
}
function topLevelInteractive(body) {
  const sections = parseVisibleMenu(body);
  return { type: 'list', body: compactMenuBody(body), buttonText: 'Admin menu', rows: SECTION_ORDER.filter((section) => (sections.get(section) || []).length > 0).map((section) => ({ id: `admin_section_${section.toLowerCase()}`, title: section, description: `Open ${section.toLowerCase()} admin actions` })), sectionTitle: 'Shiloh Admin' };
}
function sectionInteractive(section, body) {
  const entries = parseVisibleMenu(body).get(section) || [];
  if (!entries.length) return null;
  const rows = entries.map(({ action, title }) => ({ id: `admin_action_${action.key}`, title: title.length <= 24 ? title : title.slice(0, 24), description: action.description }));
  rows.push({ id: 'menu', title: '← Back to Admin', description: 'Return to the main admin menu' });
  return { type: 'list', body: `*${section}*\nChoose what you want to do.`, buttonText: section.length <= 20 ? section : 'Open options', rows, sectionTitle: section };
}
function normalizedAdminName(admin) { return String(admin?.display_name || '').trim().toLowerCase(); }
function isJeanPierreBusinessAdmin(admin) {
  return normalizedAdminName(admin) === 'jean-pierre' && admin?.business_role === 'business_admin' && admin?.calendar_scope === 'all_business' && admin?.service_scope === 'all_services';
}
function isChristelOwnerAdmin(admin) {
  return normalizedAdminName(admin) === 'christel' && ['owner', 'business_admin'].includes(admin?.business_role) && admin?.calendar_scope === 'all_business';
}
function isMarietjieAdmin(admin) {
  return normalizedAdminName(admin) === 'marietjie' && Boolean(admin?.staff_id);
}
function enrichPrivilegedReportsMenu(result) {
  if (!result?.handled || !result?.interactive?.body) return result;
  const jeanPierre = isJeanPierreBusinessAdmin(result.admin);
  const christel = isChristelOwnerAdmin(result.admin);
  const marietjie = isMarietjieAdmin(result.admin);
  let body = String(result.interactive.body);
  if (result.admin?.permissions?.['appointment:view'] === true && !/Pending approvals/i.test(body)) body += '\n\n*Appointments*\n92️⃣ Pending approvals';
  if (result.admin?.permissions?.['booking:update'] === true && result.admin?.permissions?.['appointment:view'] === true && !/Finalize past visits/i.test(body)) body += '\n\n*Appointments*\n93️⃣ Finalize past visits';
  if (!jeanPierre && !christel && !marietjie) return { ...result, interactive: { ...result.interactive, body } };
  if (jeanPierre && !/Christel earnings/i.test(body)) body += '\n\n*Reports*\n98️⃣ 💰 Christel earnings';
  if (!/Marietjie earnings/i.test(body)) body += '\n\n*Reports*\n99️⃣ 💰 Marietjie earnings';
  if ((jeanPierre || christel) && !/Reset Chenique profile/i.test(body)) body += '\n\n*Clients*\n96️⃣ Reset Chenique profile\n95️⃣ Reset Juvan profile\n94️⃣ Reset Dummy Test profile';
  if (jeanPierre && !/Calendar integrity/i.test(body)) body += '\n\n*More*\n97️⃣ 🛡️ Calendar integrity';
  return { ...result, interactive: { ...result.interactive, body } };
}
function enrichJeanPierreMenu(result) { return enrichPrivilegedReportsMenu(result); }
async function getRoleScopedMenu(sender) {
  const result = await processAdminMobileMenuMessage(sender, 'Menu');
  if (!result?.handled || !result?.interactive?.body) return result;
  return enrichPrivilegedReportsMenu(result);
}
async function dispatchStableAction(sender, action) {
  if (action.key === 'today' || action.key === 'tomorrow') return processAdminAppointmentsByDateMessage(sender, action.command);
  if (action.key === 'walkin') return processAdminWalkinMessage(sender, action.command);
  if (action.key === 'help') return processAdminHelpMessage(sender, action.command);
  if (action.key === 'pending_approvals') return processAdminPendingBookingApprovalsMessage(sender, action.command);
  if (action.key === 'finalize') return processAdminAppointmentFinalizationMessage(sender, action.command);
  if (action.key === 'abigail_earnings') return { handled: true, interactive: abigailEarningsButtons() };
  if (action.key === 'christel_earnings') return { handled: true, interactive: christelEarningsButtons() };
  if (action.key === 'marietjie_earnings') return { handled: true, interactive: marietjieEarningsButtons() };
  if (action.key === 'reset_chenique' || action.key === 'reset_juvan' || action.key === 'reset_dummy_test') return processAdminTestClientResetMessage(sender, action.command);

  const privileged = await processJeanPierreControlPlaneMessage(sender, action.command);
  if (privileged.handled) return privileged;
  return processAdminMobileMenuMessage(sender, action.command);
}
async function processAdminInteractiveMenuMessage(sender, text) {
  const pendingApprovals = await processAdminPendingBookingApprovalsMessage(sender, text);
  if (pendingApprovals.handled) return pendingApprovals;
  const finalization = await processAdminAppointmentFinalizationMessage(sender, text);
  if (finalization.handled) return finalization;
  const testClientReset = await processAdminTestClientResetMessage(sender, text);
  if (testClientReset.handled) return testClientReset;
  const marietjieEarnings = await processAdminMarietjieEarningsMessage(sender, text);
  if (marietjieEarnings.handled) return marietjieEarnings;
  const jeanPierreControl = await processJeanPierreControlPlaneMessage(sender, text);
  if (jeanPierreControl.handled) return jeanPierreControl;
  const raw = String(text || '').trim();
  const sectionMatch = raw.match(/^admin_section_(appointments|reports|clients|services|schedule|more)$/i);
  if (sectionMatch) {
    const menuResult = await getRoleScopedMenu(sender);
    if (!menuResult?.handled || !menuResult?.interactive?.body) return { handled: true, admin: menuResult?.admin, reply: 'Admin menu could not be refreshed safely. Send *Menu* to restart Admin.' };
    const section = SECTION_ORDER.find((value) => value.toLowerCase() === sectionMatch[1].toLowerCase());
    const interactive = sectionInteractive(section, menuResult.interactive.body);
    if (!interactive) return { handled: true, admin: menuResult.admin, reply: 'That admin section is not available for your account. Send *Menu* to refresh your options.' };
    return { handled: true, admin: menuResult.admin, interactive };
  }
  const action = actionForId(raw);
  if (action) {
    const menuResult = await getRoleScopedMenu(sender);
    if (!menuResult?.handled || !menuResult?.interactive?.body) return { handled: true, admin: menuResult?.admin, reply: 'Admin menu could not be refreshed safely. Send *Menu* to restart Admin.' };
    if (!isActionVisibleInMenu(action, menuResult.interactive.body)) return { handled: true, admin: menuResult.admin, reply: 'That admin action is not available for your account. Send *Menu* to refresh your options.' };
    return dispatchStableAction(sender, action);
  }
  if (/^admin_action_/i.test(raw)) return { handled: true, reply: 'That admin action is no longer available. Send *Menu* to refresh your options.' };
  const result = enrichPrivilegedReportsMenu(await processAdminMobileMenuMessage(sender, text));
  if (result?.handled && result?.interactive?.type === 'button' && /^\*Shiloh Admin 🌿\*/.test(result.interactive.body || '')) return { ...result, interactive: topLevelInteractive(result.interactive.body) };
  return result;
}

module.exports = { ACTIONS, actionForId, actionForLabel, compactMenuBody, dispatchStableAction, enrichJeanPierreMenu, enrichPrivilegedReportsMenu, isActionVisibleInMenu, parseVisibleMenu, processAdminInteractiveMenuMessage, sectionInteractive, topLevelInteractive };
