const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

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
  const options = [];
  if (has(admin, 'appointment:view')) {
    options.push(
      { key: 'today', label: isBusinessWide(admin) ? 'Today' : 'My appointments today', section: 'Primary' },
      { key: 'tomorrow', label: isBusinessWide(admin) ? 'Tomorrow' : 'My appointments tomorrow', section: 'Primary' },
      { key: 'reports', label: 'Reports', section: 'Primary' },
      { key: 'earnings', label: 'Earnings', section: 'Primary' },
    );
  }
  return options.map((option, index) => ({ ...option, number: index + 1 }));
}

function menu(admin) {
  const roleLine = isTenant(admin)
    ? 'Tenant business access — quick authorized views only.'
    : isEmployeePractitioner(admin)
      ? 'Practitioner access — quick authorized views only.'
      : '';
  const lines = ['*Shiloh Admin 🌿*', `Welcome back, ${admin.display_name} 👋`];
  if (roleLine) lines.push(roleLine);
  lines.push('', 'WhatsApp provides quick operational views. Calendar remains available from the Workspace launcher.');
  for (const option of getMenuOptions(admin)) lines.push(`${option.number}. ${option.label}`);
  return lines.join('\n');
}

function optionFor(admin, value) {
  const normalized = normalizeMenuInput(value);
  return getMenuOptions(admin).find((option) => (
    String(option.number) === normalized
    || normalizeMenuInput(option.label) === normalized
  )) || null;
}

async function processAdminMobileMenuMessage(sender, text) {
  const admin = await getAdmin(sender);
  if (!admin) return { handled: false, isAdmin: false };

  const raw = String(text || '').trim();
  const value = normalizeMenuInput(raw);

  if (['menu', 'home'].includes(value) || isGreeting(raw)) {
    await audit(admin.id, 'admin.mobile_menu_viewed', { entry: isGreeting(raw) ? 'greeting' : 'menu' });
    return { handled: true, isAdmin: true, admin, view: 'workspace' };
  }
  if (['admin', 'admin menu', 'admin_open_menu'].includes(value)) {
    await audit(admin.id, 'admin.mobile_menu_viewed', { entry: 'admin' });
    return { handled: true, isAdmin: true, admin, view: 'admin_menu' };
  }

  const selected = optionFor(admin, value);
  if (selected) {
    await audit(admin.id, 'admin.mobile_menu_selected', { option: selected.key });
    return { handled: false, isAdmin: true, admin, action: selected.key };
  }

  return { handled: false, isAdmin: true, admin };
}

module.exports = {
  getAdmin,
  getMenuOptions,
  menu,
  normalizeMenuInput,
  processAdminMobileMenuMessage,
};
