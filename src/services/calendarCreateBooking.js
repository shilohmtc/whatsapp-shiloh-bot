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
  isEmergencyCalendarBookingEnabled,
} = require('./emergencyCalendarBootstrap');
const {
  createOperatorContactAuthorityService,
} = require('./operatorContactAuthority');

const GOVERNED_PRACTITIONERS = new Set(['christel', 'abigail', 'marietjie']);
const JP_UNION_PRINCIPALS = Object.freeze(['christel', 'abigail']);
const BOOKING_BOUND_BUSINESS_ROLES = new Set(['employee_practitioner', 'tenant_practitioner']);

function bookingError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizedAdminName(admin = {}) {
  return clean(admin.display_name).toLowerCase();
}

function hasPermission(admin, permission) {
  return admin?.permissions && admin.permissions[permission] === true;
}

function positiveId(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
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

function staticScopeForAdmin(admin = {}) {
  if (admin.admin_active !== true || !hasPermission(admin, 'appointment:create') || !hasPermission(admin, 'client:lookup')) {
    return null;
  }
  const name = normalizedAdminName(admin);
  const staffId = positiveId(admin.staff_id);
  if (name === 'jean-pierre') {
    if (
      admin.business_role !== 'business_admin'
      || admin.calendar_scope !== 'all_business'
      || admin.service_scope !== 'all_services'
    ) return null;
    return { key: 'jp_christel_abigail_union', sourceStaffIds: null };
  }
  if (name === 'christel') {
    if (admin.business_role !== 'owner' || !staffId || admin.staff_status !== 'active') return null;
    return { key: 'christel_own_services', sourceStaffIds: [staffId] };
  }
  if (name === 'abigail' || name === 'marietjie') {
    if (
      !staffId
      || admin.staff_status !== 'active'
      || admin.service_scope !== 'own_services'
      || !BOOKING_BOUND_BUSINESS_ROLES.has(String(admin.business_role || '').toLowerCase())
    ) return null;
    return { key: `${name}_own_services`, sourceStaffIds: [staffId] };
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
  contactAuthorityService = null,
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Calendar Create Booking db is required');
  const clientAuthority = contactAuthorityService || createOperatorContactAuthorityService({ db });

  async function resolveJpUnionSourceStaffIds() {
    const result = await db.query(
      `SELECT st.id, LOWER(st.display_name) AS principal
         FROM staff st
        WHERE st.status = 'active'
          AND LOWER(st.display_name) = ANY($1::text[])
        ORDER BY LOWER(st.display_name), st.id`,
      [JP_UNION_PRINCIPALS]
    );
    const byPrincipal = new Map(JP_UNION_PRINCIPALS.map((name) => [name, []]));
    for (const row of result.rows) {
      const principal = String(row.principal || '').toLowerCase();
      if (byPrincipal.has(principal) && positiveId(row.id)) byPrincipal.get(principal).push(Number(row.id));
    }
    if (JP_UNION_PRINCIPALS.some((name) => byPrincipal.get(name).length !== 1)) {
      throw bookingError(
        'CALENDAR_BOOKING_SCOPE_UNRESOLVED',
        'JP booking authority cannot be resolved to exactly one active Christel and Abigail practitioner record.'
      );
    }
    return JP_UNION_PRINCIPALS.map((name) => byPrincipal.get(name)[0]);
  }

  async function resolveOperator(adminId) {
    if (!isEmergencyCalendarBookingEnabled(env)) {
      throw bookingError('CALENDAR_BOOKING_DISABLED', 'Calendar booking is not enabled.');
    }
    const id = positiveId(adminId);
    if (!id) throw bookingError('CALENDAR_BOOKING_FORBIDDEN', 'This browser session cannot create Calendar bookings.');
    const result = await db.query(
      `SELECT a.id, a.staff_id, a.display_name, a.role, a.business_role, a.calendar_scope,
              a.service_scope, a.permissions, a.active AS admin_active,
              s.status AS staff_status, s.client_bookable
         FROM staff_admin_accounts a
         LEFT JOIN staff s ON s.id = a.staff_id
        WHERE a.id = $1
          AND a.active = TRUE
        LIMIT 1`,
      [id]
    );
    const admin = result.rows[0] || null;
    const scope = staticScopeForAdmin(admin || {});
    if (!admin || !scope || !GOVERNED_PRACTITIONERS.has(normalizedAdminName(admin)) && normalizedAdminName(admin) !== 'jean-pierre') {
      throw bookingError('CALENDAR_BOOKING_FORBIDDEN', 'Current canonical staff authority does not permit Calendar booking.');
    }
    const sourceStaffIds = scope.sourceStaffIds || await resolveJpUnionSourceStaffIds();
    return {
      ...admin,
      bookingScope: {
        key: scope.key,
        sourceStaffIds,
      },
    };
  }

  async function listBookableOptions(adminId) {
    const admin = await resolveOperator(adminId);
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
          AND sv.status = 'active'
          AND EXISTS (
                SELECT 1
                  FROM staff_services authority_ss
                 WHERE authority_ss.service_id = sv.id
                   AND authority_ss.staff_id = ANY($1::bigint[])
              )
        ORDER BY sv.name, st.display_name, sv.id, st.id`,
      [admin.bookingScope.sourceStaffIds]
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
    return {
      staff: [...staffById.values()],
      services: [...servicesById.values()],
      authority: { operatorAdminId: Number(admin.id), serviceScope: admin.bookingScope.key },
    };
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

  async function resolveEligibleSelection(admin, staffId, serviceId) {
    const staff = positiveId(staffId);
    const service = positiveId(serviceId);
    if (!staff || !service) {
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
          AND sv.status = 'active'
          AND EXISTS (
                SELECT 1
                  FROM staff_services authority_ss
                 WHERE authority_ss.service_id = sv.id
                   AND authority_ss.staff_id = ANY($3::bigint[])
              )
        LIMIT 1`,
      [staff, service, admin.bookingScope.sourceStaffIds]
    );
    const row = result.rows[0];
    if (!row) {
      throw bookingError(
        'CALENDAR_BOOKING_INELIGIBLE_SELECTION',
        'That treatment/practitioner selection is outside the authenticated operator’s current service authority or is not bookable.'
      );
    }
    return row;
  }

  async function pendingBookingClient(adminId) {
    const result = await db.query(
      `SELECT c.id, c.source, abs.staff_id, abs.service_id, abs.location_id,
              abs.starts_at, abs.ends_at, abs.state
         FROM admin_booking_sessions abs
         JOIN clients c ON c.id = abs.client_id
        WHERE abs.admin_id = $1
        LIMIT 1`,
      [adminId]
    );
    return result.rows[0] || null;
  }

  async function resolvePreparedClientAuthority(admin, pending) {
    if (!pending?.id) throw bookingError('CALENDAR_BOOKING_NO_PENDING', 'There is no pending Calendar booking to authorize.');
    await resolveEligibleSelection(admin, pending.staff_id, pending.service_id);

    let bookingContext = null;
    try {
      const issued = await clientAuthority.issueBookingAuthorityContext({
        actorAdminId: Number(admin.id),
        clientId: Number(pending.id),
      });
      bookingContext = issued?.bookingContext || null;
    } catch (error) {
      if (error?.code !== 'OPERATOR_AUTHORITY_FORBIDDEN') throw error;
    }

    const authority = await clientAuthority.loadClientAuthorityState({
      actorAdminId: Number(admin.id),
      clientId: Number(pending.id),
      ...(bookingContext ? { bookingContext } : {}),
    });
    return {
      clientId: Number(pending.id),
      bookingContext,
      authority,
    };
  }

  async function prepare({ adminId, clientId, newClient, staffId, serviceId, date, time } = {}) {
    const admin = await resolveOperator(adminId);

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

    const selected = await resolveEligibleSelection(admin, staffId, serviceId);
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
        adminId: Number(admin.id),
        reason,
      });
    }

    try {
      if (newClientInput) {
        const outcome = await provisionalClientCreator({
          fullName: newClientInput.fullName,
          mobileNumber: newClientInput.mobileNumber,
          adminId: Number(admin.id),
        });
        const outcomeError = provisionalOutcomeError(outcome);
        if (outcomeError) throw outcomeError;
        resolvedClientId = Number(outcome.client.id);
        clientResolution = outcome.status;
        if (outcome.status === 'created') provisionalCreatedId = resolvedClientId;
      }

      const result = await prepareBooking({
        adminId: Number(admin.id),
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

  async function preparedAuthority({ adminId } = {}) {
    const admin = await resolveOperator(adminId);
    const pending = await pendingBookingClient(Number(admin.id));
    return resolvePreparedClientAuthority(admin, pending);
  }

  async function discard({ adminId } = {}) {
    const admin = await resolveOperator(adminId);
    const pending = await pendingBookingClient(Number(admin.id));
    if (!pending) return { status: 'no_pending', provisionalClientRemoved: false };

    const cancelled = await cancelBooking(Number(admin.id));
    if (!cancelled) return { status: 'no_pending', provisionalClientRemoved: false };

    let cleanupStatus = null;
    if (pending.source === 'admin_provisional_booking') {
      const cleanup = await provisionalClientCleanup({
        clientId: Number(pending.id),
        adminId: Number(admin.id),
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
    const pending = await pendingBookingClient(Number(admin.id));
    const recipientAuthority = await resolvePreparedClientAuthority(admin, pending);
    if (recipientAuthority.authority?.confirmationSafe !== true) {
      throw bookingError(
        'CALENDAR_BOOKING_CONFIRMATION_UNSAFE',
        'This booking cannot be finalized until the selected client has authoritative contact and client-facing name evidence.'
      );
    }

    const result = await confirmBooking(admin, { source: 'shiloh_calendar' });

    if (result.status !== 'created' && pending?.source === 'admin_provisional_booking') {
      const remaining = await db.query(
        `SELECT 1
           FROM admin_booking_sessions
          WHERE admin_id = $1
            AND client_id = $2
          LIMIT 1`,
        [Number(admin.id), pending.id]
      );
      if (!remaining.rowCount) {
        await provisionalClientCleanup({
          clientId: Number(pending.id),
          adminId: Number(admin.id),
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
    preparedAuthority,
    discard,
    confirm,
  };
}

module.exports = {
  GOVERNED_PRACTITIONERS,
  JP_UNION_PRINCIPALS,
  BOOKING_BOUND_BUSINESS_ROLES,
  createCalendarCreateBookingService,
  localDateTimeFromInputs,
  serializeClient,
  normalizeNewClientInput,
  staticScopeForAdmin,
  bookingError,
};
