const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { findClients, getClientDetails } = require('./adminClientLookup');
const { filterClientsForAdminScope } = require('./staffAdminScope');
const {
  processAdminBookingUpdateMessage,
  getAppointmentForUpdate,
} = require('./adminBookingUpdate');
const { scopeAdminBookingInteractive } = require('./adminBookingUpdateStateless');
const {
  processAdminAppointmentCancellationMessage,
  hasPendingCancellationIntent,
} = require('./adminAppointmentCancellation');

const SESSION_TTL_MS = 30 * 60 * 1000;
const APPOINTMENT_LIMIT = 9;
let initialized = false;

function phoneKey(sender) {
  return normalizePhone(sender);
}

function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function formatDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

async function ensureTable() {
  if (initialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_manage_client_sessions (
      phone VARCHAR(32) PRIMARY KEY,
      client_id BIGINT,
      pending_cancellation_appointment_id BIGINT,
      step TEXT NOT NULL DEFAULT 'searching',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes')
    )
  `);
  initialized = true;
}

async function getAdmin(sender) {
  const result = await pool.query(
    `SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope
       FROM staff_admin_accounts
      WHERE normalized_whatsapp=$1 AND active=TRUE`,
    [phoneKey(sender)]
  );
  return result.rows[0] || null;
}

async function loadSession(sender) {
  await ensureTable();
  const phone = phoneKey(sender);
  const result = await pool.query(
    `SELECT phone,client_id,pending_cancellation_appointment_id,step,expires_at
       FROM admin_manage_client_sessions
      WHERE phone=$1`,
    [phone]
  );
  const session = result.rows[0] || null;
  if (!session) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await pool.query(`DELETE FROM admin_manage_client_sessions WHERE phone=$1`, [phone]);
    return null;
  }
  return session;
}

async function saveSession(sender, { clientId = null, pendingCancellationAppointmentId = null, step = 'searching' } = {}) {
  await ensureTable();
  const result = await pool.query(
    `INSERT INTO admin_manage_client_sessions
       (phone,client_id,pending_cancellation_appointment_id,step,updated_at,expires_at)
     VALUES ($1,$2,$3,$4,NOW(),NOW() + INTERVAL '30 minutes')
     ON CONFLICT (phone) DO UPDATE SET
       client_id=EXCLUDED.client_id,
       pending_cancellation_appointment_id=EXCLUDED.pending_cancellation_appointment_id,
       step=EXCLUDED.step,
       updated_at=NOW(),
       expires_at=NOW() + INTERVAL '30 minutes'
     RETURNING phone,client_id,pending_cancellation_appointment_id,step,expires_at`,
    [phoneKey(sender), clientId, pendingCancellationAppointmentId, step]
  );
  return result.rows[0];
}

async function clearSession(sender) {
  await ensureTable();
  await pool.query(`DELETE FROM admin_manage_client_sessions WHERE phone=$1`, [phoneKey(sender)]);
}

async function audit(adminId, action, metadata = {}) {
  await pool.query(
    `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata)
     VALUES ($1,$2,'admin_assistant',NULL,$3::jsonb)`,
    [adminId, action, JSON.stringify(metadata)]
  );
}

async function authorizedClient(admin, clientId) {
  if (!Number.isInteger(Number(clientId)) || Number(clientId) <= 0) return null;
  const client = await getClientDetails(Number(clientId));
  if (!client) return null;
  const scoped = await filterClientsForAdminScope(admin, [client]);
  return scoped.find((row) => Number(row.id) === Number(clientId)) || null;
}

async function authorizedAppointment(admin, clientId, appointmentId) {
  if (!Number.isInteger(Number(appointmentId)) || Number(appointmentId) <= 0) return null;
  const appointment = await getAppointmentForUpdate(admin, Number(appointmentId));
  if (!appointment || appointment.forbidden) return null;
  if (Number(appointment.client_id) !== Number(clientId)) return null;
  return appointment;
}

function manageClientInteractive(client, prefix = '') {
  const next = formatDateTime(client.next_appointment_at);
  const body = [
    prefix || null,
    '*Manage Client*',
    `👤 ${client.display_name || 'Unnamed client'} — CRM #${client.id}`,
    `Status: ${client.status || 'unknown'}`,
    `Appointments on record: ${client.appointment_count || 0}`,
    next ? `Next appointment: ${next}` : 'Next appointment: none currently recorded',
    '',
    'Client identity and contact records remain read-only here. Choose a booking action below.',
  ].filter(Boolean).join('\n');
  return {
    type: 'button',
    body,
    buttons: [
      { id: `manage_client_bookings_${client.id}`, title: 'Manage booking' },
      { id: 'manage_clients', title: 'Choose another' },
    ],
  };
}

function clientSearchPrompt() {
  return {
    type: 'button',
    body: '*Manage clients*\n\nSend the client name or mobile number. Shiloh will only show canonical CRM clients inside your authorized scope.\n\nNo client or appointment record is changed by searching.',
    buttons: [{ id: 'menu', title: '← Back to Admin' }],
  };
}

function clientChoicesInteractive(query, clients) {
  const rows = clients.slice(0, 9).map((client) => ({
    id: `manage_client_select_${client.id}`,
    title: String(client.display_name || `CRM #${client.id}`).slice(0, 24),
    description: `CRM #${client.id} · ${client.status || 'status unknown'}`.slice(0, 72),
  }));
  rows.push({ id: 'manage_clients', title: 'Search again', description: 'Enter a more specific name or mobile number' });
  return {
    type: 'list',
    body: `*Manage clients*\nI found ${clients.length} authorized matches for “${clean(query)}”. Choose the exact CRM client; Shiloh will not guess or merge identities.`,
    buttonText: 'Choose client',
    sectionTitle: 'Authorized clients',
    rows,
  };
}

function appointmentLabel(appointment) {
  const services = (appointment.services || []).map((row) => row.name || row.service_name_snapshot).filter(Boolean).join(' + ') || 'Service not recorded';
  const start = formatDateTime(appointment.starts_at) || 'Date unavailable';
  return { title: start.slice(0, 24), description: services.slice(0, 72) };
}

async function clientBookingsInteractive(admin, client) {
  const ids = await pool.query(
    `SELECT id
       FROM appointments
      WHERE client_id=$1 AND status<>'cancelled' AND starts_at>=NOW()
      ORDER BY starts_at,id
      LIMIT 20`,
    [Number(client.id)]
  );
  const appointments = [];
  for (const row of ids.rows) {
    const appointment = await authorizedAppointment(admin, client.id, row.id);
    if (appointment) appointments.push(appointment);
    if (appointments.length >= APPOINTMENT_LIMIT) break;
  }
  if (!appointments.length) {
    return {
      type: 'button',
      body: `*Manage booking — ${client.display_name || `CRM #${client.id}`}*\n\nThere are no upcoming active appointments in your authorized booking scope for this client.`,
      buttons: [{ id: `manage_client_return_${client.id}`, title: '← Manage Client' }],
    };
  }
  const rows = appointments.map((appointment) => {
    const label = appointmentLabel(appointment);
    return {
      id: `manage_client_booking_${client.id}_${appointment.id}`,
      title: label.title,
      description: label.description,
    };
  });
  rows.push({ id: `manage_client_return_${client.id}`, title: '← Manage Client', description: 'Return to this client' });
  return {
    type: 'list',
    body: `*Manage booking — ${client.display_name || `CRM #${client.id}`}*\nChoose the appointment you want to manage. Only active appointments inside your existing booking authority are shown.`,
    buttonText: 'Choose booking',
    sectionTitle: 'Client appointments',
    rows,
  };
}

function contextualizeManageBookingInteractive(result, clientId, appointmentId) {
  if (!result?.interactive) return result;
  const interactive = { ...result.interactive };
  const rewrite = (rows) => Array.isArray(rows) ? rows.map((row) => {
    if (String(row?.id) === `manage_cancel_booking_${appointmentId}`) {
      return { ...row, id: `manage_client_cancel_${clientId}_${appointmentId}` };
    }
    if (String(row?.id) === `manage_booking_back_${appointmentId}`) {
      return { ...row, id: `manage_client_return_${clientId}`, title: '← Manage Client', description: 'Return to this client' };
    }
    return row;
  }) : rows;
  if (Array.isArray(interactive.rows)) interactive.rows = rewrite(interactive.rows);
  if (Array.isArray(interactive.buttons)) interactive.buttons = rewrite(interactive.buttons);
  if (Array.isArray(interactive.sections)) interactive.sections = interactive.sections.map((section) => ({ ...section, rows: rewrite(section.rows) }));
  return { ...result, interactive };
}

async function openManageBooking(sender, admin, clientId, appointmentId) {
  const client = await authorizedClient(admin, clientId);
  if (!client) return { handled: true, admin, reply: 'That client is no longer available in your authorized scope. No booking was changed.' };
  const appointment = await authorizedAppointment(admin, clientId, appointmentId);
  if (!appointment) return { handled: true, admin, reply: 'That appointment does not belong to this authorized client context, or is no longer manageable. No booking was changed.' };
  const opened = await processAdminBookingUpdateMessage(sender, 'Manage a booking');
  if (!opened?.handled) return opened || { handled: false };
  const selected = await processAdminBookingUpdateMessage(sender, `manage_booking_select_${Number(appointmentId)}`);
  if (!selected?.handled) return selected || { handled: false };
  return contextualizeManageBookingInteractive(scopeAdminBookingInteractive(selected), Number(clientId), Number(appointmentId));
}

async function renderManageClient(sender, admin, clientId, prefix = '') {
  const client = await authorizedClient(admin, clientId);
  if (!client) {
    await clearSession(sender);
    return { handled: true, admin, reply: 'That client is no longer available in your authorized scope. Send *Manage clients* to search again.' };
  }
  await saveSession(sender, { clientId: Number(client.id), step: 'selected' });
  return { handled: true, admin, interactive: manageClientInteractive(client, prefix) };
}

async function beginClientCancellation(sender, admin, clientId, appointmentId) {
  const client = await authorizedClient(admin, clientId);
  const appointment = client ? await authorizedAppointment(admin, clientId, appointmentId) : null;
  if (!client || !appointment) {
    return { handled: true, admin, reply: 'The client/appointment context could not be revalidated. No cancellation was started.' };
  }
  await saveSession(sender, {
    clientId: Number(clientId),
    pendingCancellationAppointmentId: Number(appointmentId),
    step: 'pending_cancellation',
  });
  const result = await processAdminAppointmentCancellationMessage(sender, `cancel appointment #${Number(appointmentId)}`);
  if (!result?.handled) {
    await saveSession(sender, { clientId: Number(clientId), step: 'selected' });
    return { handled: true, admin, reply: 'Cancellation could not be started safely. No appointment was changed.' };
  }
  return { ...result, admin: result.admin || admin };
}

async function continueClientCancellation(sender, admin, session, raw) {
  const clientId = Number(session.client_id);
  const appointmentId = Number(session.pending_cancellation_appointment_id);
  if (!clientId || !appointmentId) {
    await clearSession(sender);
    return { handled: false };
  }
  if (/^(menu|admin|admin menu|home)$/i.test(clean(raw))) {
    if (await hasPendingCancellationIntent(sender)) await processAdminAppointmentCancellationMessage(sender, 'cancel_back');
    await clearSession(sender);
    return { handled: false };
  }
  const result = await processAdminAppointmentCancellationMessage(sender, raw);
  if (!result?.handled) {
    await saveSession(sender, { clientId, step: 'selected' });
    return renderManageClient(sender, admin, clientId, 'The cancellation request is no longer active. Review the current booking state before trying again.');
  }
  if (Number(result.cancelledAppointmentId) === appointmentId) {
    await saveSession(sender, { clientId, step: 'selected' });
    if (/needs attention/i.test(String(result.reply || ''))) return { ...result, admin: result.admin || admin };
    return renderManageClient(sender, admin, clientId, result.reply || `✅ Appointment #${appointmentId} cancelled.`);
  }
  if (/Cancellation stopped/i.test(String(result.reply || ''))) {
    await saveSession(sender, { clientId, step: 'selected' });
    return renderManageClient(sender, admin, clientId, result.reply);
  }
  if (/already cancelled|changed before cancellation|could not be found/i.test(String(result.reply || ''))) {
    await saveSession(sender, { clientId, step: 'selected' });
  } else {
    await saveSession(sender, { clientId, pendingCancellationAppointmentId: appointmentId, step: 'pending_cancellation' });
  }
  return { ...result, admin: result.admin || admin };
}

async function processAdminManageClientsMessage(sender, text) {
  const admin = await getAdmin(sender);
  if (!admin) return { handled: false };
  if (admin.permissions?.['client:lookup'] !== true) return { handled: false };
  const raw = clean(text);
  const lower = raw.toLowerCase();
  let session = await loadSession(sender);

  if (session?.step === 'pending_cancellation') {
    return continueClientCancellation(sender, admin, session, raw);
  }

  if (/^(menu|admin|admin menu|home)$/i.test(raw)) {
    if (session) await clearSession(sender);
    return { handled: false };
  }

  if (['manage clients', 'manage client', 'find a client', 'find my client', 'manage_clients'].includes(lower)) {
    await saveSession(sender, { step: 'searching' });
    await audit(admin.id, 'admin.manage_clients_opened', { scoped: !['owner', 'business_admin'].includes(admin.business_role) });
    return { handled: true, admin, interactive: clientSearchPrompt() };
  }

  let match = raw.match(/^manage_client_select_(\d+)$/i);
  if (match) {
    const client = await authorizedClient(admin, Number(match[1]));
    if (!client) return { handled: true, admin, reply: 'That client is not available in your authorized scope. No record was changed.' };
    await audit(admin.id, 'admin.manage_client_selected', { clientId: Number(client.id) });
    return renderManageClient(sender, admin, client.id);
  }

  match = raw.match(/^manage_client_return_(\d+)$/i);
  if (match) return renderManageClient(sender, admin, Number(match[1]));

  match = raw.match(/^manage_client_bookings_(\d+)$/i);
  if (match) {
    const clientId = Number(match[1]);
    const client = await authorizedClient(admin, clientId);
    if (!client) return { handled: true, admin, reply: 'That client is no longer available in your authorized scope. No booking was changed.' };
    await saveSession(sender, { clientId, step: 'selected' });
    return { handled: true, admin, interactive: await clientBookingsInteractive(admin, client) };
  }

  match = raw.match(/^manage_client_booking_(\d+)_(\d+)$/i);
  if (match) {
    const clientId = Number(match[1]);
    const appointmentId = Number(match[2]);
    await saveSession(sender, { clientId, step: 'selected' });
    return openManageBooking(sender, admin, clientId, appointmentId);
  }

  match = raw.match(/^manage_client_cancel_(\d+)_(\d+)$/i);
  if (match) return beginClientCancellation(sender, admin, Number(match[1]), Number(match[2]));

  if (session?.step === 'searching') {
    if (/^(0|back|cancel)$/i.test(raw)) {
      await clearSession(sender);
      return { handled: true, admin, reply: 'Manage clients closed. No client or appointment record was changed. Send *Menu* to return to Admin.' };
    }
    if (!raw) return { handled: true, admin, interactive: clientSearchPrompt() };
    const found = await findClients(raw);
    const clients = await filterClientsForAdminScope(admin, found.clients);
    await audit(admin.id, 'admin.manage_clients_search', { queryType: found.queryType, resultCount: clients.length, resultClientIds: clients.map((client) => Number(client.id)) });
    if (!clients.length) return { handled: true, admin, reply: `I couldn't find an authorized canonical CRM client matching “${raw}”. No record was changed. Send another name/mobile number or *Back*.` };
    if (clients.length === 1) return renderManageClient(sender, admin, clients[0].id);
    await saveSession(sender, { step: 'choosing' });
    return { handled: true, admin, interactive: clientChoicesInteractive(raw, clients) };
  }

  if (session?.step === 'choosing') {
    if (/^(0|back|cancel)$/i.test(raw)) {
      await saveSession(sender, { step: 'searching' });
      return { handled: true, admin, interactive: clientSearchPrompt() };
    }
    return { handled: true, admin, reply: 'Choose the exact client from the list, or send *Back* to search again.' };
  }

  return { handled: false };
}

function decorateAdminMenuResult(result) {
  if (!result?.handled || !result?.interactive?.body) return result;
  const body = String(result.interactive.body)
    .replace(/Find a client/g, 'Manage clients')
    .replace(/Find my client/g, 'Manage clients');
  return { ...result, interactive: { ...result.interactive, body } };
}

module.exports = {
  SESSION_TTL_MS,
  ensureTable,
  processAdminManageClientsMessage,
  decorateAdminMenuResult,
  contextualizeManageBookingInteractive,
  manageClientInteractive,
  clientChoicesInteractive,
};
