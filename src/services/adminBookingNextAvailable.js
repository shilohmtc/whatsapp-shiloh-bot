const { pool } = require('../db/pool');
const { listAvailableSlots } = require('./availabilityService');
const { getNextOpenClinicDates } = require('./clinicDateChoices');

const PAGE_SIZE = 8;
const TIME_ZONE = 'Africa/Johannesburg';

function timeLabel(value) {
  return new Intl.DateTimeFormat('en-ZA', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}

function dayDateLabel(value) {
  return new Intl.DateTimeFormat('en-ZA', { timeZone: TIME_ZONE, weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(value));
}

function localIsoDate(value) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

async function loadContext(appointmentId) {
  const r = await pool.query(`
    SELECT a.id,a.location_id,a.starts_at,
           ast.staff_id,
           aps.service_id
      FROM appointments a
      JOIN appointment_staff ast ON ast.appointment_id=a.id
      JOIN appointment_services aps ON aps.appointment_id=a.id
     WHERE a.id=$1 AND a.status<>'cancelled'
  `, [appointmentId]);
  if (r.rowCount !== 1) return null;
  const row = r.rows[0];
  if (!row.staff_id || !row.service_id) return null;
  return row;
}

async function collectNextSlots(appointmentId) {
  const context = await loadContext(appointmentId);
  if (!context) return { context: null, slots: [] };
  const dates = await getNextOpenClinicDates({ locationId: context.location_id, count: 8, maxDays: 30 });
  const now = Date.now();
  const currentStart = new Date(context.starts_at).getTime();
  const slots = [];
  for (const date of dates) {
    const result = await listAvailableSlots({
      staffId: context.staff_id,
      serviceId: context.service_id,
      date: date.date,
      locationId: context.location_id,
      intervalMinutes: 15,
      excludeAppointmentId: context.id,
    });
    for (const slot of result.slots || []) {
      const startMs = new Date(slot.starts_at).getTime();
      if (!Number.isFinite(startMs) || startMs <= now || startMs === currentStart) continue;
      slots.push(slot);
    }
  }
  slots.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  return { context, slots };
}

async function nextAvailableInteractive(appointmentId, page = 1) {
  const { context, slots } = await collectNextSlots(appointmentId);
  if (!context) return null;
  const totalPages = Math.max(1, Math.ceil(slots.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;
  const pageSlots = slots.slice(offset, offset + PAGE_SIZE);
  const rows = pageSlots.map((slot) => ({
    id: `manage_quick_reschedule_slot_${appointmentId}_${new Date(slot.starts_at).getTime()}`,
    title: `${dayDateLabel(slot.starts_at)} · ${timeLabel(slot.starts_at)}`.slice(0, 24),
    description: `${timeLabel(slot.starts_at)}–${timeLabel(slot.ends_at)} · authoritative available slot`.slice(0, 72),
  }));
  if (safePage < totalPages) rows.push({
    id: `manage_quick_reschedule_page_${appointmentId}_${safePage + 1}`,
    title: 'More times →',
    description: 'Show later available appointments',
  });
  rows.push({
    id: `manage_quick_reschedule_other_${appointmentId}`,
    title: 'Choose another date',
    description: 'Enter a specific date instead',
  });
  if (!pageSlots.length) {
    return {
      type: 'button',
      body: '*No upcoming authoritative slots found*\n\nNo currently bookable replacement time was found in the next 30 days. Choose another date to search a specific day.',
      buttons: [{ id: `manage_quick_reschedule_other_${appointmentId}`, title: 'Choose date' }],
    };
  }
  return {
    type: 'list',
    body: `*Next available times*\nChoose a replacement slot. Shiloh has already applied clinic hours, practitioner schedule, CRM appointments and Google Calendar. Availability is checked again before saving.`,
    buttonText: 'Available times',
    sectionTitle: `Next available ${safePage}/${totalPages}`.slice(0, 24),
    rows,
  };
}

async function primeAppointment(sender, appointmentId, processAdminBookingUpdateMessage) {
  const opened = await processAdminBookingUpdateMessage(sender, 'Manage a booking');
  if (!opened?.handled) return opened;
  return processAdminBookingUpdateMessage(sender, `manage_booking_select_${appointmentId}`);
}

async function processImmediateTimeAction(sender, text, processAdminBookingUpdateMessage) {
  const raw = String(text || '').trim();
  let match = raw.match(/^manage_change_time_(\d+)$/i);
  if (match) {
    const appointmentId = Number(match[1]);
    const primed = await primeAppointment(sender, appointmentId, processAdminBookingUpdateMessage);
    if (!primed?.handled) return primed || { handled: false };
    const interactive = await nextAvailableInteractive(appointmentId, 1);
    return interactive ? { handled: true, admin: primed.admin, interactive } : { handled: false };
  }

  match = raw.match(/^manage_quick_reschedule_page_(\d+)_(\d+)$/i);
  if (match) {
    const appointmentId = Number(match[1]);
    const page = Number(match[2]);
    const primed = await primeAppointment(sender, appointmentId, processAdminBookingUpdateMessage);
    if (!primed?.handled) return primed || { handled: false };
    const interactive = await nextAvailableInteractive(appointmentId, page);
    return interactive ? { handled: true, admin: primed.admin, interactive } : { handled: false };
  }

  match = raw.match(/^manage_quick_reschedule_other_(\d+)$/i);
  if (match) {
    const appointmentId = Number(match[1]);
    const primed = await primeAppointment(sender, appointmentId, processAdminBookingUpdateMessage);
    if (!primed?.handled) return primed || { handled: false };
    const opened = await processAdminBookingUpdateMessage(sender, 'manage_change_time');
    if (!opened?.handled) return opened || { handled: false };
    return processAdminBookingUpdateMessage(sender, 'manage_reschedule_other');
  }

  match = raw.match(/^manage_quick_reschedule_slot_(\d+)_(\d+)$/i);
  if (match) {
    const appointmentId = Number(match[1]);
    const timestamp = Number(match[2]);
    const starts = new Date(timestamp);
    if (Number.isNaN(starts.getTime())) return { handled: true, reply: 'That slot is no longer valid. Please open Change date / time again.' };
    const primed = await primeAppointment(sender, appointmentId, processAdminBookingUpdateMessage);
    if (!primed?.handled) return primed || { handled: false };
    const opened = await processAdminBookingUpdateMessage(sender, 'manage_change_time');
    if (!opened?.handled) return opened || { handled: false };
    const dateOpened = await processAdminBookingUpdateMessage(sender, `manage_reschedule_date_${localIsoDate(starts)}`);
    if (!dateOpened?.handled) return dateOpened || { handled: false };
    return processAdminBookingUpdateMessage(sender, `manage_reschedule_slot_${timestamp}`);
  }

  return { handled: false };
}

function scopeImmediateTimeActions(result) {
  if (!result?.interactive) return result;
  const match = String(result.interactive.body || '').match(/Manage booking #(\d+)/i);
  const appointmentId = match ? Number(match[1]) : null;
  if (!appointmentId) return result;
  const scopeRows = (rows) => Array.isArray(rows) ? rows.map((row) => row.id === 'manage_change_time' ? { ...row, id: `manage_change_time_${appointmentId}` } : row) : rows;
  const interactive = { ...result.interactive };
  if (Array.isArray(interactive.rows)) interactive.rows = scopeRows(interactive.rows);
  if (Array.isArray(interactive.buttons)) interactive.buttons = scopeRows(interactive.buttons);
  if (Array.isArray(interactive.sections)) interactive.sections = interactive.sections.map((section) => ({ ...section, rows: scopeRows(section.rows) }));
  return { ...result, interactive };
}

module.exports = { nextAvailableInteractive, processImmediateTimeAction, scopeImmediateTimeActions };
