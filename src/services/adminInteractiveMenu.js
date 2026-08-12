const { processAdminMobileMenuMessage } = require('./adminMobileMenu');
const { processAdminAppointmentFinalizationMessage } = require('./adminAppointmentFinalization');
const { processAdminClientTestModeControl } = require('./adminClientTestMode');
const { processJeanPierreControlPlaneMessage } = require('./jeanPierreAdminControlPlane');

const SECTION_ORDER = ['Appointments', 'Reports', 'Clients', 'Services', 'Schedule', 'More'];

const ACTIONS = [
  { key: 'today', labels: ["Today's clients", 'My clients today'], command: 'today', description: 'View today’s appointments' },
  { key: 'tomorrow', labels: ["Tomorrow's clients", 'My clients tomorrow'], command: 'tomorrow', description: 'View tomorrow’s appointments' },
  { key: 'availability', labels: ['Find an available time'], command: 'Find an available time', description: 'Check the authoritative diary' },
  { key: 'demo_client', labels: ['🧪 Demo Client', 'Demo Client'], command: 'Demo Client', description: 'Practise the controlled client journey' },
  { key: 'today_report', labels: ["Today's report", 'My report today'], command: "Today's report", description: 'View today’s scoped business report' },
  { key: 'christel_earnings', labels: ['💰 Christel earnings', 'Christel earnings'], command: 'Christel earnings', description: 'Completed-only earnings report' },
  { key: 'abigail_earnings', labels: ['💰 Abigail earnings', 'Abigail earnings'], command: 'Abigail earnings', description: 'Completed-only earnings report' },
  { key: 'booking', labels: ['Make a booking'], command: 'Make a booking', description: 'Create a guarded appointment' },
  { key: 'manage_booking', labels: ['Manage a booking'], command: 'Manage a booking', description: 'Change an existing appointment' },
  { key: 'client', labels: ['Find a client', 'Find my client'], command: 'Find a client', description: 'Search authorized CRM clients' },
  { key: 'walkin', labels: ['Add a walk-in'], command: 'Add a walk-in', description: 'Register a walk-in client' },
  { key: 'staff_services', labels: ['Staff services', 'My services'], command: 'Staff services', description: 'View authorized service mappings' },
  { key: 'pricing', labels: ['Services & pricing', 'My services & pricing'], command: 'Services & pricing', description: 'View or manage service pricing' },
  { key: 'schedule', labels: ['Schedule management', 'My schedule'], command: 'Schedule', description: 'Manage authorized diary settings' },
  { key: 'calendar_integrity', labels: ['🛡️ Calendar integrity', 'Calendar integrity'], command: 'Calendar integrity scan', description: 'Check booking/calendar integrity' },
  { key: 'client_test', labels: ['🧪 Client Test Mode', 'Client Test Mode'], command: 'Client Test Mode', description: 'Test the real first-client journey' },
  { key: 'help', labels: ['Help'], command: 'Help', description: 'Show admin help' },
];

function normalizeLabel(value = '') {
  return String(value)
    .replace(/[🧪💰🛡️]/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
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
  const sections = new Map();
  let currentSection = null;
  for (const line of String(body).split('\n')) {
    const sectionMatch = line.trim().match(/^\*(Appointments|Reports|Clients|Services|Schedule|More)\*$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!sections.has(currentSection)) sections.set(currentSection, []);
      continue;
    }
    const optionMatch = line.trim().match(/^\d+️⃣\s+(.+)$/u);
    if (!optionMatch || !currentSection) continue;
    const action = actionForLabel(optionMatch[1]);
    if (action) sections.get(currentSection).push({ action, title: optionMatch[1].trim() });
  }
  return sections;
}

function compactMenuBody(body = '') {
  const lines = String(body).split('\n');
  const compact = [];
  let insertedPrompt = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\*(Appointments|Reports|Clients|Services|Schedule|More)\*$/.test(trimmed)) continue;
    if (/^\d+️⃣\s+/u.test(trimmed)) continue;
    if (/^Use the real \*/.test(trimmed)) {
      if (!insertedPrompt) compact.push('Choose a section below.');
      insertedPrompt = true;
      continue;
    }
    compact.push(line);
  }
  while (compact.length && !compact[compact.length - 1].trim()) compact.pop();
  return compact.join('\n').replace(/\n{3,}/g, '\n\n');
}

function topLevelInteractive(body) {
  const sections = parseVisibleMenu(body);
  const rows = SECTION_ORDER
    .filter((section) => (sections.get(section) || []).length > 0)
    .map((section) => ({
      id: `admin_section_${section.toLowerCase()}`,
      title: section,
      description: `Open ${section.toLowerCase()} admin actions`,
    }));
  return {
    type: 'list',
    body: compactMenuBody(body),
    buttonText: 'Admin menu',
    rows,
    sectionTitle: 'Shiloh Admin',
  };
}

function sectionInteractive(section, body) {
  const sections = parseVisibleMenu(body);
  const entries = sections.get(section) || [];
  if (!entries.length) return null;
  const rows = entries.map(({ action, title }) => ({
    id: `admin_action_${action.key}`,
    title: title.length <= 24 ? title : title.slice(0, 24),
    description: action.description,
  }));
  rows.push({ id: 'menu', title: '← Back to Admin', description: 'Return to the main admin menu' });
  return {
    type: 'list',
    body: `*${section}*\nChoose what you want to do.`,
    buttonText: section.length <= 20 ? section : 'Open options',
    rows,
    sectionTitle: section,
  };
}

function isJeanPierreBusinessAdmin(admin) {
  return String(admin?.display_name || '').trim().toLowerCase() === 'jean-pierre'
    && admin?.business_role === 'business_admin'
    && admin?.calendar_scope === 'all_business'
    && admin?.service_scope === 'all_services';
}

function enrichJeanPierreMenu(result) {
  if (!result?.handled || !result?.interactive?.body || !isJeanPierreBusinessAdmin(result.admin)) return result;
  let body = String(result.interactive.body);
  if (!/Christel earnings/i.test(body)) body += '\n\n*Reports*\n98️⃣ 💰 Christel earnings';
  if (!/Calendar integrity/i.test(body) || !/Client Test Mode/i.test(body)) {
    body += '\n\n*More*';
    if (!/Calendar integrity/i.test(body)) body += '\n97️⃣ 🛡️ Calendar integrity';
    if (!/Client Test Mode/i.test(body)) body += '\n96️⃣ 🧪 Client Test Mode';
  }
  return { ...result, interactive: { ...result.interactive, body } };
}

async function getRoleScopedMenu(sender) {
  const result = await processAdminMobileMenuMessage(sender, 'Menu');
  if (!result?.handled || !result?.interactive?.body) return result;
  return enrichJeanPierreMenu(result);
}

async function processAdminInteractiveMenuMessage(sender, text) {
  const finalization = await processAdminAppointmentFinalizationMessage(sender, text);
  if (finalization.handled) return finalization;

  const jeanPierreControl = await processJeanPierreControlPlaneMessage(sender, text);
  if (jeanPierreControl.handled) return jeanPierreControl;

  const raw = String(text || '').trim();
  const sectionMatch = raw.match(/^admin_section_(appointments|reports|clients|services|schedule|more)$/i);
  if (sectionMatch) {
    const menuResult = await getRoleScopedMenu(sender);
    if (!menuResult?.handled) return menuResult || { handled: false };
    const section = SECTION_ORDER.find((value) => value.toLowerCase() === sectionMatch[1].toLowerCase());
    const interactive = sectionInteractive(section, menuResult.interactive.body);
    if (!interactive) {
      return { handled: true, admin: menuResult.admin, reply: 'That admin section is not available for your account. Send *Menu* to refresh your options.' };
    }
    return { handled: true, admin: menuResult.admin, interactive };
  }

  const action = actionForId(raw);
  if (action) {
    if (action.key === 'client_test') return processAdminClientTestModeControl(sender, 'Client Test Mode');
    const privileged = await processJeanPierreControlPlaneMessage(sender, action.command);
    if (privileged.handled) return privileged;
    return processAdminMobileMenuMessage(sender, action.command);
  }
  if (/^admin_action_/i.test(raw)) {
    return { handled: true, reply: 'That admin action is no longer available. Send *Menu* to refresh your options.' };
  }

  const result = enrichJeanPierreMenu(await processAdminMobileMenuMessage(sender, text));
  if (result?.handled && result?.interactive?.type === 'button' && /^\*Shiloh Admin 🌿\*/.test(result.interactive.body || '')) {
    return { ...result, interactive: topLevelInteractive(result.interactive.body) };
  }
  return result;
}

module.exports = {
  ACTIONS,
  actionForId,
  actionForLabel,
  compactMenuBody,
  enrichJeanPierreMenu,
  parseVisibleMenu,
  processAdminInteractiveMenuMessage,
  sectionInteractive,
  topLevelInteractive,
};
