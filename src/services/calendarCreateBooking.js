const { pool } = require('../db/pool');
const { findClients } = require('./adminClientLookup');
const {
  prepareAdminBooking,
  confirmAdminBooking,
  cancelPendingBooking,
} = require('./adminBooking');
const {
  createProvisionalClient,
  cleanupUnusedProvisionalClient,
} = require('./adminProvisionalClient');
const {
  EMERGENCY_ADMIN_ID,
  isEmergencyCalendarBookingEnabled,
  isEmergencyChristelAuthority,
} = require('./emergencyCalendarBootstrap');

function bookingError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function localDateTimeFromInputs(date, time) {
  const dateMatch = String(date || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(time || '').trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!dateMatch || !timeMatch) throw bookingError('CALENDAR_BOOKING_INVALID_SLOT', 'Choose a valid date and start time.');
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const probe = new Date(Date.UTC(year, month - 1, day, 12));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() + 1 !== month || probe.getUTCDate() !== day) {
    throw bookingError('CALENDAR_BOOKING_INVALID_SLOT', 'Choose a valid date and start time.');
  }
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} ${timeMatch[1]}:${timeMatch[2]}`;
}

function maskContact(value = '') {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 4 ? `ending in ${digits.slice(-4)}` : null;
}

function serializeClient(client) {
  const primary = (client.contacts || []).find((item) => item.isPrimary) || (client.contacts || [])[0];
  return {
    id: Number(client.id),
    displayName: client.display_name || 'Unnamed client',
    status: client.status || 'unknown',
    dateOfBirth: client.date_of_birth || null,
    contactHint: primary ? maskContact(primary.normalizedValue || primary.value) : null,
  };
}

function normalizeNewClientInput(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const fullName = String(value.fullName || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  const mobileNumber = String(value.mobileNumber || '').trim().slice(0, 40);
  if (!fullName && !mobileNumber) return null;
  return { fullName, mobileNumber };
}

function provisionalOutcomeError(outcome) {
  if (outcome?.status === 'invalid_name') {
    return bookingError('CALENDAR_BOOKING_NEW_CLIENT_INVALID_NAME', 'Enter the new client’s first name and surname.');
  }
  if (outcome?.status === 'invalid_mobile') {
    return bookingError('CALENDAR_BOOKING_NEW_CLIENT_INVALID_MOBILE', 'Enter a valid South African mobile number for the new client.');
  }
  if (outcome?.status === 'ambiguous') {
    return bookingError('CALENDAR_BOOKING_NEW_CLIENT_AMBIGUOUS', 'That mobile number is linked to more than one canonical CRM client, so Shiloh will not guess or create another record.');
  }
  if (!outcome?.client?.id || !['created', 'existing'].includes(outcome.status)) {
    return bookingError('CALENDAR_BOOKING_NEW_CLIENT_UNAVAILABLE', 'Shiloh could not safely resolve this new client. No booking was prepared.');
  }
  return null;
}

function createCalendarCreateBookingService({
  db = pool,
  env = process.env,
  clientFinder = findClients,
  prepareBooking = prepareAdminBooking,
  confirmBooking = confirmAdminBooking,
  cancelBooking = cancelPendingBooking,
  provisionalClientCreator = createProvisionalClient,
  provisionalClientCleanup = cleanupUnusedProvisionalClient,
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Calendar Create Booking db is required');

  async function resolveOperator(adminId) {
    if (!isEmergencyCalendarBookingEnabled(env)) {
      throw bookingError('CALENDAR_BOOKING_DISABLED', 'Emergency Calendar booking is not enabled.');
    }
    if (Number(adminId) !== EMERGENCY_ADMIN_ID) {
      throw bookingError('CALENDAR_BOOKING_FORBIDDEN', 'This browser session cannot create Calendar bookings.');
    }
    const result = await db.query(
      `SELECT a.id, a.staff_id, a.display_name, a.role, a.business_role, a.calendar_scope,
              a.service_scope, a.permissions, a.active AS admin_active,
              s.status AS staff_status, s.client_bookable
         FROM staff_admin_accounts a
         LEFT JOIN staff s ON s.id = a.staff_id
        WHERE a.id = $1
        LIMIT 1`,
      [EMERGENCY_ADMIN_ID]
    );
    const admin = result.rows[0] || null;
    if (!isEmergencyChristelAuthority(admin, env)) {
      throw bookingError('CALENDAR_BOOKING_FORBIDDEN', 'Current canonical Admin authority no longer permits emergency Calendar booking.');
    }
    return admin;
  }

  async function listBookableOptions(adminId) {
    await resolveOperator(adminId);
    const result = await db.query(
      `SELECT st.id AS staff_id, st.display_name AS staff_name,
              sv.id AS service_id, sv.name AS service_name,
              sv.duration_minutes, sv.processing_time_minutes, sv.extra_time_minutes,
              sv.price, sv.variable_price
         FROM staff st
         JOIN staff_services ss ON ss.staff_id = st.id
         JOIN services sv ON sv.id = ss.service_id
        WHERE st.status = 'active'
          AND st.client_bookable = TRUE
          AND LOWER(st.display_name) IN ('christel', 'abigail')
          AND sv.status = 'active'
        ORDER BY sv.name, st.display_name, sv.id, st.id`
    );
    const staffById = new Map();
    const servicesById = new Map();
    for (const row of result.rows) {
      const staffId = Number(row.staff_id);
      const serviceId = Number(row.service_id);
      if (!staffById.has(staffId)) staffById.set(staffId, { id: staffId, displayName: row.staff_name, serviceIds: [] });
      staffById.get(staffId).serviceIds.push(serviceId);
      if (!servicesById.has(serviceId)) {
        servicesById.set(serviceId, {
          id: serviceId,
          name: row.service_name,
          durationMinutes: Number(row.duration_minutes || 0) + Number(row.processing_time_minutes || 0) + Number(row.extra_time_minutes || 0),
          price: row.price == null ? null : Number(row.price),
          variablePrice: row.variable_price === true,
          staffIds: [],
        });
      }
      servicesById.get(serviceId).staffIds.push(staffId);
    }
    return { staff: [...staffById.values()], services: [...servicesById.values()] };
  }

  async function searchClients(adminId, query) {
    await resolveOperator(adminId);
    const cleaned = String(query || '').trim().replace(/\s+/g, ' ').slice(0, 120);
    if (cleaned.length < 2) return { clients: [], requiresExplicitSelection: true };
    const found = await clientFinder(cleaned, 10);
    return {
      clients: (found.clients || []).map(serializeClient),
      requiresExplicitSelection: true,
      ambiguous: (found.clients || []).length > 1,
    };
  }

  async function resolveEligibleSelection(staffId, serviceId) {
    const staff = Number(staffId);
    const service = Number(serviceId);
    if (!Number.isSafeInteger(staff) || staff <= 0 || !Number.isSafeInteger(service) || service <= 0) {
      throw bookingError('CALENDAR_BOOKING_INVALID_SELECTION', 'Choose an eligible treatment and practitioner.');
    }
    const result = await db.query(
      `SELECT st.id AS staff_id, st.display_name AS staff_name,
              sv.id AS service_id, sv.name AS service_name,
              sv.duration_minutes, sv.processing_time_minutes, sv.extra_time_minutes,
              sv.price, sv.variable_price
         FROM staff st
         JOIN staff_services ss ON ss.staff_id = st.id
         JOIN services sv ON sv.id = ss.service_id
        WHERE st.id = $1
          AND sv.id = $2
          AND st.status = 'active'
          AND st.client_bookable = TRUE
          AND LOWER(st.display_name) IN ('christel', 'abigail')
          AND sv.status = 'active'
        LIMIT 1`,
      [staff, service]
    );
    const row = result.rows[0];
    if (!row) throw bookingError('CALENDAR_BOOKING_INELIGIBLE_SELECTION', 'That treatment/practitioner combination is not currently bookable.');
    return row;
  }

  async function pendingBookingClient(adminId) {
    const result = await db.query(
      `SELECT c.id, c.source
         FROM admin_booking_sessions abs
         JOIN clients c ON c.id = abs.client_id
        WHERE abs.admin_id = $1
        LIMIT 1`,
      [adminId]
    );
    return result.rows[0] || null;
  }

  async function prepare({ adminId, clientId, newClient, staffId, serviceId, date, time } = {}) {
    await resolveOperator(adminId);

    const rawClientId = String(clientId || '').trim();
    const clientIdProvided = rawClientId.length > 0;
    const validClientId = /^\d+$/.test(rawClientId) && Number(rawClientId) > 0;
    const newClientInput = normalizeNewClientInput(newClient);

    if (clientIdProvided && !validClientId) {
      throw bookingError('CALENDAR_BOOKING_CLIENT_REQUIRED', 'Select exactly one canonical CRM client.');
    }
    if (clientIdProvided && newClientInput) {
      throw bookingError('CALENDAR_BOOKING_INVALID_CLIENT_SELECTION', 'Choose either one canonical CRM client or one new client, not both.');
    }
    if (!validClientId && !newClientInput) {
      throw bookingError('CALENDAR_BOOKING_CLIENT_REQUIRED', 'Select one canonical CRM client or enter one new client.');
    }

    const selected = await resolveEligibleSelection(staffId, serviceId);
    const localDateTime = localDateTimeFromInputs(date, time);

    let resolvedClientId = validClientId ? Number(rawClientId) : null;
    let clientResolution = 'canonical';
    let provisionalCreatedId = null;

    async function cleanupCreated(reason) {
      if (!provisionalCreatedId) return;
      const cleanupId = provisionalCreatedId;
      provisionalCreatedId = null;
      await provisionalClientCleanup({
        clientId: cleanupId,
        adminId: EMERGENCY_ADMIN_ID,
        reason,
      });
    }

    try {
      if (newClientInput) {
        const outcome = await provisionalClientCreator({
          fullName: newClientInput.fullName,
          mobileNumber: newClientInput.mobileNumber,
          adminId: EMERGENCY_ADMIN_ID,
        });
        const outcomeError = provisionalOutcomeError(outcome);
        if (outcomeError) throw outcomeError;
        resolvedClientId = Number(outcome.client.id);
        clientResolution = outcome.status;
        if (outcome.status === 'created') provisionalCreatedId = resolvedClientId;
      }

      const result = await prepareBooking({
        adminId: EMERGENCY_ADMIN_ID,
        clientId: resolvedClientId,
        staffName: selected.staff_name,
        serviceName: selected.service_name,
        localDateTime,
      });

      if (result.status !== 'pending_confirmation') {
        await cleanupCreated('calendar_booking_prepare_failed');
        return result;
      }

      const durationMinutes = Math.max(0, Math.round((new Date(result.endsAt).getTime() - new Date(result.startsAt).getTime()) / 60000));
      const price = result.service.variable_price
        ? (result.service.price == null ? 'Variable' : `From R${Number(result.service.price).toFixed(2)}`)
        : (result.service.price == null ? 'Not set' : `R${Number(result.service.price).toFixed(2)}`);
      return {
        status: result.status,
        review: {
          client: {
            id: Number(result.client.id),
            displayName: result.client.display_name || 'Unnamed client',
            provisional: clientResolution === 'created',
            matchedExisting: clientResolution === 'existing',
            profileIncomplete: clientResolution === 'created',
            contactHint: newClientInput ? maskContact(newClientInput.mobileNumber) : null,
          },
          service: { id: Number(result.service.id), name: result.service.name },
          practitioner: { id: Number(result.staff.id), displayName: result.staff.display_name },
          startsAt: result.startsAt,
          endsAt: result.endsAt,
          durationMinutes,
          price,
        },
      };
    } catch (error) {
      await cleanupCreated('calendar_booking_prepare_error');
      throw error;
    }
  }

  async function discard({ adminId } = {}) {
    await resolveOperator(adminId);
    const pending = await pendingBookingClient(EMERGENCY_ADMIN_ID);
    if (!pending) return { status: 'no_pending', provisionalClientRemoved: false };

    const cancelled = await cancelBooking(EMERGENCY_ADMIN_ID);
    if (!cancelled) return { status: 'no_pending', provisionalClientRemoved: false };

    let cleanupStatus = null;
    if (pending.source === 'admin_provisional_booking') {
      const cleanup = await provisionalClientCleanup({
        clientId: Number(pending.id),
        adminId: EMERGENCY_ADMIN_ID,
        reason: 'calendar_booking_cancelled',
      });
      cleanupStatus = cleanup?.status || null;
    }

    return {
      status: 'discarded',
      provisionalClientRemoved: cleanupStatus === 'removed',
      cleanupStatus,
    };
  }

  async function confirm({ adminId } = {}) {
    const admin = await resolveOperator(adminId);
    const pending = await pendingBookingClient(EMERGENCY_ADMIN_ID);
    const result = await confirmBooking(admin, { source: 'shiloh_calendar' });

    if (result.status !== 'created' && pending?.source === 'admin_provisional_booking') {
      const remaining = await db.query(
        `SELECT 1
           FROM admin_booking_sessions
          WHERE admin_id = $1
            AND client_id = $2
          LIMIT 1`,
        [EMERGENCY_ADMIN_ID, pending.id]
      );
      if (!remaining.rowCount) {
        await provisionalClientCleanup({
          clientId: Number(pending.id),
          adminId: EMERGENCY_ADMIN_ID,
          reason: `calendar_booking_confirm_${String(result.status || 'failed')}`,
        });
      }
    }

    return result;
  }

  return {
    resolveOperator,
    listBookableOptions,
    searchClients,
    prepare,
    discard,
    confirm,
  };
}

module.exports = {
  createCalendarCreateBookingService,
  localDateTimeFromInputs,
  serializeClient,
  normalizeNewClientInput,
  bookingError,
};
