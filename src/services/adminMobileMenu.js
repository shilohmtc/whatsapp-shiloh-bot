const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { processAdminServicePricingMessage } = require('./adminServicePricing');
const { processAdminStaffServicesMessage } = require('./adminStaffServices');
const { findClients, formatClientLookupReply } = require('./adminClientLookup');
const { filterClientsForAdminScope } = require('./staffAdminScope');

const moreSessions = new Map();
const CLIENT_LOOKUP_TTL_MS = 2 * 60 * 1000;

function normalizeMenuInput(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}
function senderKey(sender) { return normalizePhone(sender); }
function has(admin, permission) { return admin?.permissions?.[permission] === true; }
function isBusinessWide(admin) {
  return ['owner', 'business_admin'].includes(admin?.business_role)
    || admin?.calendar_scope === 'all_business';
}
function isTenant(admin) { return admin?.business_role === 'tenant_practitioner'; }
function isEmployeePractitioner(admin) { return admin?.business_role === 'employee_practitioner'; }
function isGreeting(text = '') {
  return /^(hi|hello|hey|howzit|hiya|good morning|good afternoon|good evening)[!. ]*$/i.test(String(text).trim());
}

async function getAdmin(sender, db = pool) {
  const result = await db.query(
    `SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope
       FROM staff_admin_accounts
      WHERE normalized_whatsapp=$1 AND active=TRUE
      ORDER BY id
      LIMIT 2`,
    [senderKey(sender)],
  );
  return result.rowCount === 1 ? result.rows[0] : null;
}

async function audit(adminId, action, metadata = {}, db = pool) {
  await db.query(
    `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata)
     VALUES ($1,$2,'admin_assistant',NULL,$3::jsonb)`,
    [adminId, action, JSON.stringify(metadata)],
  );
}

function getMenuOptions(admin) {
  const options = [{ key: 'open_calendar', label: 'Open Calendar', section: 'Primary' }];
  if (has(admin, 'appointment:view')) {
    options.push(
      { key: 'today', label: isBusinessWide(admin) ? 'Today' : 'My appointments today', section: 'Primary' },
      { key: 'tomorrow', label: isBusinessWide(admin) ? 'Tomorrow' : 'My appointments tomorrow', section: 'Primary' },
      { key: 'reports', label: 'Reports', section: 'Primary' },
      { key: 'earnings', label: 'Earnings', section: 'Primary' },
    );
  }
  options.push({ key: 'help', label: 'Help', section: 'Primary' });
  if (has(admin, 'client:lookup')) {
    options.push({ key: 'client', label: isBusinessWide(admin) ? 'Find client' : 'Find my client', section: 'Transitional' });
  }
  if (has(admin, 'walkin:create')) options.push({ key: 'walkin', label: 'Add walk-in', section: 'Transitional' });
  if (has(admin, 'staff:services:view') || has(admin, 'appointment:view')) {
    options.push({ key: 'staff_services', label: isBusinessWide(admin) ? 'Staff services' : 'My services', section: 'Transitional' });
  }
  if (has(admin, 'service:pricing')) {
    options.push({ key: 'pricing', label: isTenant(admin) ? 'My services & pricing' : 'Services & pricing', section: 'Transitional' });
  }
  return options.map((option, index) => ({ ...option, number: index + 1 }));
}

function menu(admin) {
  const roleLine = isTenant(admin)
    ? 'Tenant business access — your clients and assigned services only.'
    : isEmployeePractitioner(admin)
      ? 'Practitioner access — your diary and assigned client work only.'
      : '';
  const lines = ['*Shiloh Admin 🌿*', `Welcome back, ${admin.display_name} 👋`];
  if (roleLine) lines.push(roleLine);
  lines.push('', 'WhatsApp provides quick operational views. Calendar owns diary changes.');
  let section = null;
  for (const option of getMenuOptions(admin)) {
    if (option.section !== section) {
      section = option.section;
      lines.push('', `*${section}*`);
    }
    lines.push(`${option.number}. ${option.label}`);
  }
  return lines.join('\n');
}

function optionFor(admin, value) {
  const normalized = normalizeMenuInput(value);
  return getMenuOptions(admin).find((option) => (
    String(option.number) === normalized
    || normalizeMenuInput(option.label) === normalized
  )) || null;
}

function normalizeGuidedClientQuery(value = '') {
  return String(value)
    .trim()
    .replace(/^(?:find|lookup|search(?: for)?)\s+(?:client\s+)?/i, '')
    .replace(/^client\s+(?:find|lookup|search)\s+/i, '')
    .trim();
}

function clientGuide(admin) {
  const scope = isBusinessWide(admin) ? 'the authorized CRM' : 'your authorized client scope';
  return [
    '*Find client*',
    `Search ${scope} by exact mobile or name.`,
    '',
    'You can type the name directly, for example *Juvan Botha* or *Find Juvan*, or send the mobile number.',
    'Send *Back* to exit without changing anything.',
  ].join('\n');
}

async function scopedClientLookup(admin, query) {
  const found = await findClients(query);
  const clients = await filterClientsForAdminScope(admin, found.clients);
  await audit(admin.id, 'admin.client_lookup', {
    queryType: found.queryType,
    resultCount: clients.length,
    resultClientIds: clients.map((client) => client.id),
    scoped: !isBusinessWide(admin),
  });
  return formatClientLookupReply(query, clients);
}

function startClientLookup(sender, admin) {
  moreSessions.set(senderKey(sender), {
    step: 'client_lookup',
    expiresAt: Date.now() + CLIENT_LOOKUP_TTL_MS,
  });
  return { handled: true, isAdmin: true, admin, reply: clientGuide(admin) };
}

async function processAdminMobileMenuMessage(sender, text) {
  const admin = await getAdmin(sender);
  if (!admin) return { handled: false, isAdmin: false };

  const key = senderKey(sender);
  const raw = String(text || '').trim();
  const value = normalizeMenuInput(raw);
  const guided = moreSessions.get(key);

  if (guided?.step === 'client_lookup') {
    if (Number(guided.expiresAt || 0) <= Date.now()) {
      moreSessions.delete(key);
    } else if (['menu', 'home'].includes(value)) {
      moreSessions.delete(key);
      return { handled: true, isAdmin: true, admin, view: 'workspace' };
    } else if (['admin', 'admin menu'].includes(value)) {
      moreSessions.delete(key);
      return { handled: true, isAdmin: true, admin, view: 'admin_menu' };
    } else if (value === '0' || value === 'back' || value === 'cancel') {
      moreSessions.delete(key);
      return { handled: true, isAdmin: true, admin, view: 'admin_menu' };
    } else {
      const query = normalizeGuidedClientQuery(raw);
      if (!query) return { handled: true, isAdmin: true, admin, reply: clientGuide(admin) };
      moreSessions.delete(key);
      return { handled: true, isAdmin: true, admin, reply: await scopedClientLookup(admin, query) };
    }
  }

  const pricing = await processAdminServicePricingMessage(sender, text);
  if (pricing.handled) return { ...pricing, isAdmin: true };

  const clientCommand = raw.match(/^(?:find|lookup|search(?: for)?)\s+client\s+(.+)$/i)
    || raw.match(/^client\s+(?:find|lookup|search)\s+(.+)$/i);
  if (clientCommand && has(admin, 'client:lookup')) {
    return {
      handled: true,
      isAdmin: true,
      admin,
      reply: await scopedClientLookup(admin, clientCommand[1].trim()),
    };
  }

  if (['menu', 'home'].includes(value) || isGreeting(raw)) {
    moreSessions.delete(key);
    await audit(admin.id, 'admin.mobile_menu_viewed', { entry: isGreeting(raw) ? 'greeting' : 'menu' });
    return { handled: true, isAdmin: true, admin, view: 'workspace' };
  }
  if (['admin', 'admin menu', 'admin_open_menu'].includes(value)) {
    moreSessions.delete(key);
    await audit(admin.id, 'admin.mobile_menu_viewed', { entry: 'admin' });
    return { handled: true, isAdmin: true, admin, view: 'admin_menu' };
  }

  const selected = optionFor(admin, value);
  if (selected) {
    await audit(admin.id, 'admin.mobile_menu_selected', { option: selected.key });
    if (selected.key === 'client') return startClientLookup(sender, admin);
    if (selected.key === 'staff_services') {
      return { ...(await processAdminStaffServicesMessage(sender, 'Staff services')), isAdmin: true };
    }
    if (selected.key === 'pricing') {
      return { ...(await processAdminServicePricingMessage(sender, 'Services & pricing')), isAdmin: true };
    }
    return { handled: false, isAdmin: true, admin, action: selected.key };
  }

  if (value === 'find a client' || value === 'find my client') {
    if (!has(admin, 'client:lookup')) return { handled: true, isAdmin: true, admin, reply: 'That action is not available for your staff role.' };
    return startClientLookup(sender, admin);
  }

  return { handled: false, isAdmin: true, admin };
}

module.exports = {
  CLIENT_LOOKUP_TTL_MS,
  getAdmin,
  getMenuOptions,
  menu,
  normalizeGuidedClientQuery,
  normalizeMenuInput,
  processAdminMobileMenuMessage,
};
