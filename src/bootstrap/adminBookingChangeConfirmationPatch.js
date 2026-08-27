const { pool } = require('../db/pool');
const bookingUpdate = require('../services/adminBookingUpdate');
const stateless = require('../services/adminBookingUpdateStateless');
const nextAvailable = require('../services/adminBookingNextAvailable');
const { listAvailableSlots } = require('../services/availabilityService');
const { checkClinicHours } = require('../services/clinicHours');
const { checkAuthoritativeSchedule } = require('../services/adminAvailability');
const {
  loadAdminBookingTimeInputSession,
  clearAdminBookingTimeInputSession,
} = require('../services/adminBookingTimeInputSession');

const TIME_ZONE = 'Africa/Johannesburg';
const serviceCommitBySender = new Set();

function senderKey(sender) {
  return String(sender || '').replace(/\D/g, '');
}

function fmtDateTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function fmtTime(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function localIsoDate(value) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function parseDirectDateTime(text) {
  const raw = String(text || '').trim();
  const m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\s+(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)$/i);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(m[4]).padStart(2, '0')}:${m[5]}:00+02:00`;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  const check = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(dt);
  if (check !== `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`) return null;
  return dt;
}

async function resolveTypedTimestamp(appointmentId, text) {
  const direct = parseDirectDateTime(text);
  if (direct) return direct.getTime();
  const raw = String(text || '').trim();
  const m = raw.match(/^(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)$/i);
  if (!m) return null;
  const r = await pool.query(`SELECT starts_at FROM appointments WHERE id=$1 AND status<>'cancelled' LIMIT 1`, [appointmentId]);
  if (!r.rowCount) return null;
  const date = localIsoDate(r.rows[0].starts_at);
  const dt = new Date(`${date}T${String(m[1]).padStart(2, '0')}:${m[2]}:00+02:00`);
  return Number.isNaN(dt.getTime()) ? null : dt.getTime();
}

async function loadRescheduleContext(appointmentId) {
  const r = await pool.query(`
    SELECT a.id,a.location_id,a.starts_at,a.ends_at,a.status,
           COALESCE(c.display_name,a.source_client_name,'Client') AS client_name,
           ast.staff_id,COALESCE(st.display_name,ast.staff_name_snapshot) AS staff_name,
           aps.service_id,COALESCE(s.name,aps.service_name_snapshot) AS service_name,
           e.expires_at AS package_expires_at
      FROM appointments a
      LEFT JOIN clients c ON c.id=a.client_id
      JOIN appointment_staff ast ON ast.appointment_id=a.id
      LEFT JOIN staff st ON st.id=ast.staff_id
      JOIN appointment_services aps ON aps.appointment_id=a.id
      LEFT JOIN services s ON s.id=aps.service_id
      LEFT JOIN package_session_redemptions red
        ON red.appointment_id=a.id AND red.status IN ('reserved','redeemed')
      LEFT JOIN client_package_entitlements e ON e.id=red.entitlement_id
     WHERE a.id=$1 AND a.status<>'cancelled'`, [appointmentId]);
  return r.rowCount === 1 ? r.rows[0] : null;
}

async function validateRescheduleCandidate(context, timestamp) {
  const starts = new Date(Number(timestamp));
  if (!context || Number.isNaN(starts.getTime()) || starts.getTime() <= Date.now()) return { ok: false, reason: 'Choose a future date and time.' };
  const duration = new Date(context.ends_at).getTime() - new Date(context.starts_at).getTime();
  const ends = new Date(starts.getTime() + duration);
  if (context.package_expires_at && starts.getTime() >= new Date(context.package_expires_at).getTime()) {
    return { ok: false, reason: 'That time falls outside this package validity window.' };
  }
  const result = await listAvailableSlots({
    staffId: context.staff_id,
    serviceId: context.service_id,
    date: localIsoDate(starts),
    locationId: context.location_id,
    intervalMinutes: 15,
    excludeAppointmentId: context.id,
  });
  const exact = (result.slots || []).find((slot) => new Date(slot.starts_at).getTime() === starts.getTime());
  if (!exact) return { ok: false, reason: `${fmtTime(starts)} is not currently an authoritative available start time for this booking.` };
  return { ok: true, starts, ends: new Date(exact.ends_at || ends) };
}

async function rescheduleConfirmation(appointmentId, timestamp) {
  const context = await loadRescheduleContext(appointmentId);
  if (!context) return { handled: true, reply: 'That booking is no longer available to reschedule.' };
  const checked = await validateRescheduleCandidate(context, timestamp);
  if (!checked.ok) {
    return {
      handled: true,
      reply: `${checked.reason}\n\nNo change was saved. Open *Change date / time* to choose another available time.`,
    };
  }
  return {
    handled: true,
    interactive: {
      type: 'button',
      body: [
        '*Confirm date/time change*',
        '',
        `👤 ${context.client_name}`,
        `✨ ${context.service_name}`,
        `💆 ${context.staff_name}`,
        '',
        `*From:* ${fmtDateTime(context.starts_at)}–${fmtTime(context.ends_at)}`,
        `*To:* ${fmtDateTime(checked.starts)}–${fmtTime(checked.ends)}`,
        '',
        'Availability has been checked. Nothing changes until you confirm. Shiloh will re-check availability again immediately before saving.',
      ].join('\n'),
      buttons: [
        { id: `manage_quick_reschedule_confirm_${appointmentId}_${Number(timestamp)}`, title: 'Confirm change' },
        { id: `manage_change_time_${appointmentId}`, title: 'Choose another time' },
        { id: `manage_booking_menu_${appointmentId}`, title: 'Cancel' },
      ],
    },
  };
}

async function loadServiceContext(appointmentId, serviceId) {
  const a = await pool.query(`
    SELECT a.id,a.client_id,a.location_id,a.starts_at,a.ends_at,
           COALESCE(c.display_name,a.source_client_name,'Client') AS client_name,
           ast.staff_id,COALESCE(st.display_name,ast.staff_name_snapshot) AS staff_name,
           aps.service_id AS current_service_id,COALESCE(current_s.name,aps.service_name_snapshot) AS current_service_name,
           COALESCE(aps.duration_minutes_snapshot,current_s.duration_minutes,0) AS current_duration,
           COALESCE(aps.price_snapshot,a.total_price) AS current_price
      FROM appointments a
      LEFT JOIN clients c ON c.id=a.client_id
      JOIN appointment_staff ast ON ast.appointment_id=a.id
      LEFT JOIN staff st ON st.id=ast.staff_id
      JOIN appointment_services aps ON aps.appointment_id=a.id
      LEFT JOIN services current_s ON current_s.id=aps.service_id
     WHERE a.id=$1 AND a.status<>'cancelled'`, [appointmentId]);
  if (a.rowCount !== 1) return null;
  const target = await pool.query(`
    SELECT s.id,s.name,s.duration_minutes,s.processing_time_minutes,s.extra_time_minutes,s.price,s.variable_price,s.display_price,
           sp.id AS package_id,sp.name AS package_name
      FROM services s
      LEFT JOIN service_packages sp ON sp.session_service_id=s.id AND sp.status='active'
     WHERE s.id=$1 AND s.status='active'`, [serviceId]);
  if (target.rowCount !== 1) return null;
  return { ...a.rows[0], target: target.rows[0] };
}

async function validateServiceCandidate(context) {
  const target = context.target;
  if (Number(target.id) === Number(context.current_service_id)) return { ok: false, reason: 'That service is already booked.' };
  const mapped = await pool.query(`SELECT 1 FROM staff_services WHERE staff_id=$1 AND service_id=$2`, [context.staff_id, target.id]);
  if (!mapped.rowCount) return { ok: false, reason: `${context.staff_name} is not authorized for ${target.name}.` };

  if (target.package_id) {
    const packages = await stateless.activePackageChoices(context.id);
    if (!packages.some((row) => Number(row.id) === Number(target.id))) {
      return { ok: false, reason: 'This client does not currently have an active paid package credit valid for this booking.' };
    }
  } else {
    const hidden = await pool.query(`SELECT COALESCE(external_source,'') AS external_source FROM services WHERE id=$1`, [target.id]);
    if (hidden.rows[0]?.external_source === 'shiloh_package') return { ok: false, reason: 'That internal package session cannot be selected without a valid package entitlement.' };
  }

  const minutes = Number(target.duration_minutes || 0) + Number(target.processing_time_minutes || 0) + Number(target.extra_time_minutes || 0);
  const starts = new Date(context.starts_at);
  const ends = new Date(starts.getTime() + minutes * 60000);
  const clinic = await checkClinicHours({ locationId: context.location_id, startsAt: starts, endsAt: ends });
  if (!clinic.covered) return { ok: false, reason: 'The replacement service would fall outside clinic hours at the current start time.' };
  const schedule = await checkAuthoritativeSchedule({ staffId: context.staff_id, locationId: context.location_id, startsAt: starts, endsAt: ends });
  if (schedule.partialUnavailable || (schedule.allDayUnavailable && !schedule.insideAvailableException) || !schedule.covered) {
    return { ok: false, reason: 'The replacement service does not fit the practitioner schedule at the current start time.' };
  }
  const conflict = await pool.query(`SELECT a.id FROM appointments a JOIN appointment_staff ast ON ast.appointment_id=a.id WHERE ast.staff_id=$1 AND a.id<>$2 AND a.status<>'cancelled' AND a.starts_at<$4 AND a.ends_at>$3 LIMIT 1`, [context.staff_id, context.id, starts, ends]);
  if (conflict.rowCount) return { ok: false, reason: 'The replacement duration would overlap another CRM appointment.' };
  return { ok: true, minutes, ends };
}

function priceLabel(target) {
  if (target.package_id) return 'Package credit · R0 due';
  if (target.display_price) return target.display_price;
  if (target.variable_price) return 'Variable price';
  return Number.isFinite(Number(target.price)) ? `R${Number(target.price).toFixed(2)}` : 'Price on request';
}

async function serviceConfirmation(appointmentId, serviceId) {
  const context = await loadServiceContext(appointmentId, serviceId);
  if (!context) return { handled: true, reply: 'That booking or replacement service is no longer available.' };
  const checked = await validateServiceCandidate(context);
  if (!checked.ok) return { handled: true, reply: `${checked.reason}\n\nNo service change was saved.` };
  const target = context.target;
  return {
    handled: true,
    interactive: {
      type: 'button',
      body: [
        '*Confirm service change*',
        '',
        `👤 ${context.client_name}`,
        `💆 ${context.staff_name}`,
        '',
        `*From:* ${context.current_service_name}`,
        `*To:* ${target.name}`,
        `*New duration:* ${checked.minutes} min`,
        `*New price:* ${priceLabel(target)}`,
        '',
        'Eligibility, duration and availability have been checked. Nothing changes until you confirm. Shiloh will re-check the guarded change before saving.',
      ].join('\n'),
      buttons: [
        { id: `manage_service_confirm_${appointmentId}_${serviceId}`, title: 'Confirm change' },
        { id: `manage_change_service_${appointmentId}`, title: 'Choose another service' },
        { id: `manage_booking_menu_${appointmentId}`, title: 'Cancel' },
      ],
    },
  };
}

const originalStateless = stateless.processStatelessAdminBookingUpdateMessage;
stateless.processStatelessAdminBookingUpdateMessage = async function confirmedStatelessAdminBookingUpdate(sender, text, ...rest) {
  const raw = String(text || '').trim();
  let match = raw.match(/^manage_service_pick_(\d+)_(\d+)$/i);
  if (match) return serviceConfirmation(Number(match[1]), Number(match[2]));

  match = raw.match(/^manage_service_confirm_(\d+)_(\d+)$/i);
  if (match) {
    const key = senderKey(sender);
    serviceCommitBySender.add(key);
    try {
      return await originalStateless(sender, `manage_service_pick_${match[1]}_${match[2]}`, ...rest);
    } finally {
      serviceCommitBySender.delete(key);
    }
  }
  return originalStateless(sender, text, ...rest);
};

const originalImmediate = nextAvailable.processImmediateTimeAction;
nextAvailable.processImmediateTimeAction = async function confirmedImmediateTimeAction(sender, text, processAdminBookingUpdateMessage) {
  const raw = String(text || '').trim();
  let match = raw.match(/^manage_quick_reschedule_slot_(\d+)_(\d+)$/i);
  if (match) return rescheduleConfirmation(Number(match[1]), Number(match[2]));

  match = raw.match(/^manage_quick_reschedule_confirm_(\d+)_(\d+)$/i);
  if (match) {
    const result = await originalImmediate(sender, `manage_quick_reschedule_slot_${match[1]}_${match[2]}`, processAdminBookingUpdateMessage);
    if (result?.handled) await clearAdminBookingTimeInputSession(sender);
    return result;
  }

  const durable = await loadAdminBookingTimeInputSession(sender);
  const appointmentId = durable?.appointmentId || null;
  const isTimeOnly = /^(?:at\s+)?(?:[01]?\d|2[0-3]):[0-5]\d$/i.test(raw);
  const isDateTime = /^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\s+(?:at\s+)?(?:[01]?\d|2[0-3]):[0-5]\d$/i.test(raw);
  if (appointmentId && (isTimeOnly || isDateTime)) {
    const timestamp = await resolveTypedTimestamp(appointmentId, raw);
    if (timestamp) return rescheduleConfirmation(appointmentId, timestamp);
  }
  return originalImmediate(sender, text, processAdminBookingUpdateMessage);
};

const originalBookingUpdate = bookingUpdate.processAdminBookingUpdateMessage;
bookingUpdate.processAdminBookingUpdateMessage = async function confirmedBookingUpdate(sender, text, ...rest) {
  const raw = String(text || '').trim();
  const key = senderKey(sender);
  const servicePick = raw.match(/^manage_service_pick_(\d+)$/i);
  if (servicePick && !serviceCommitBySender.has(key)) {
    // Restart-safe scoped service picks are intercepted in the stateless layer. This
    // branch is deliberately left to the established in-session handler.
    return originalBookingUpdate(sender, text, ...rest);
  }

  const slot = raw.match(/^manage_reschedule_slot_(\d+)$/i);
  if (slot) {
    const durable = await loadAdminBookingTimeInputSession(sender);
    if (durable?.appointmentId) return rescheduleConfirmation(durable.appointmentId, Number(slot[1]));
  }
  return originalBookingUpdate(sender, text, ...rest);
};

module.exports = {
  rescheduleConfirmation,
  serviceConfirmation,
  validateRescheduleCandidate,
  validateServiceCandidate,
};
