const { pool } = require('../db/pool');
const crmV2ClientService = require('./crmV2ClientService');
const {
  prepareCalendarV2Booking,
  acknowledgeCalendarV2Mobile,
  confirmCalendarV2Booking,
  cancelPendingBooking,
} = require('./adminBooking');
const { isEmergencyCalendarBookingEnabled } = require('./emergencyCalendarBootstrap');

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
  return {
    id: String(client.id),
    displayName: client.name || 'Unnamed client',
    status: client.status || 'unknown',
    profileStatus: client.profileStatus || null,
    contactHint: maskContact(client.normalizedMobile),
  };
}

function normalizeNewClientInput(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const name = String(value.name || value.fullName || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  const mobile = String(value.mobile || value.mobileNumber || '').trim().slice(0, 40);
  if (!name && !mobile) return null;
  return { name, mobile };
}

function crmV2OutcomeError(outcome) {
  if (outcome?.status === 'conflict') {
    return bookingError(
      'CALENDAR_BOOKING_CRM_V2_CONFLICT',
      'CRM V2 could not establish one active owner for that exact mobile. No booking was prepared.'
    );
  }
  if (!outcome?.client?.id || !['created', 'existing'].includes(outcome.status)) {
    return bookingError('CALENDAR_BOOKING_CRM_V2_UNAVAILABLE', 'Shiloh could not safely resolve this CRM V2 client.');
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
  crmV2Service = crmV2ClientService,
  prepareBooking = prepareCalendarV2Booking,
  acknowledgeBooking = acknowledgeCalendarV2Mobile,
  confirmBooking = confirmCalendarV2Booking,
  cancelBooking = cancelPendingBooking,
} = {}) {
  if (!db || typeof db.query !== 'function') throw new Error('Calendar Create Booking db is required');
  if (!crmV2Service || typeof crmV2Service.searchClients !== 'function' || typeof crmV2Service.getClientById !== 'function' || typeof crmV2Service.createClient !== 'function') {
    throw new Error('Calendar Create Booking CRM V2 service is required');
  }

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
    if (!admin || !scope || (!GOVERNED_PRACTITIONERS.has(normalizedAdminName(admin)) && normalizedAdminName(admin) !== 'jean-pierre')) {
      throw bookingError('CALENDAR_BOOKING_FORBIDDEN', 'Current canonical staff authority does not permit Calendar booking.');
    }
    const sourceStaffIds = scope.sourceStaffIds || await resolveJpUnionSourceStaffIds();
    return { ...admin, bookingScope: { key: scope.key, sourceStaffIds } };
  }

  async function listBookableOptions(adminId) {
    const admin = await resolveOperator(adminId);
    const result = await db.query(
      `SELECT st.id AS staff_id, st.display_name AS staff_name,
              sv.id AS service_id, sv.name AS service_name,
              sv.external_source, sv.external_id, sc.name AS category_name,
              sv.duration_minutes, sv.processing_time_minutes, sv.extra_time_minutes,
              sv.price, sv.variable_price
         FROM staff st
         JOIN staff_services ss ON ss.staff_id = st.id
         JOIN services sv ON sv.id = ss.service_id
         LEFT JOIN service_categories sc ON sc.id = sv.category_id
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
          categoryName: row.category_name || null,
          externalSource: row.external_source || null,
          externalId: row.external_id || null,
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
    const found = await crmV2Service.searchClients({ query: cleaned, status: 'active', limit: 10 });
    return {
      clients: found.map(serializeClient),
      requiresExplicitSelection: true,
      ambiguous: found.length > 1,
      identityModel: 'crm_v2_operator_search_only',
    };
  }

  async function resolveEligibleSelection(admin, staffId, serviceId) {
    const staff = positiveId(staffId);
    const service = positiveId(serviceId);
    if (!staff || !service) throw bookingError('CALENDAR_BOOKING_INVALID_SELECTION', 'Choose an eligible treatment and practitioner.');
    const result = await db.query(
      `SELECT st.id AS staff_id, st.display_name AS staff_name,
              sv.id AS service_id, sv.name AS service_name,
              sv.external_source, sv.external_id, sc.name AS category_name,
              sv.duration_minutes, sv.processing_time_minutes, sv.extra_time_minutes,
              sv.price, sv.variable_price
         FROM staff st
         JOIN staff_services ss ON ss.staff_id = st.id
         JOIN services sv ON sv.id = ss.service_id
         LEFT JOIN service_categories sc ON sc.id = sv.category_id
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

  async function pendingBooking(adminId) {
    const result = await db.query(
      `SELECT abs.crm_v2_client_id, abs.source_client_name, abs.client_mobile_snapshot,
              abs.acknowledged_mobile, abs.mobile_acknowledged_at,
              abs.staff_id, abs.service_id, abs.location_id,
              abs.starts_at, abs.ends_at, abs.state,
              client.name AS current_client_name,
              client.normalized_mobile AS current_client_mobile,
              client.status AS current_client_status
         FROM admin_booking_sessions abs
         JOIN crm_v2_clients client ON client.id = abs.crm_v2_client_id
        WHERE abs.admin_id = $1
          AND abs.client_id IS NULL
        LIMIT 1`,
      [adminId]
    );
    return result.rows[0] || null;
  }

  function validateClientChoice(clientId, newClient) {
    const rawClientId = String(clientId || '').trim();
    const clientIdProvided = rawClientId.length > 0;
    const validClientId = /^\d+$/.test(rawClientId) && Number(rawClientId) > 0;
    const newClientInput = normalizeNewClientInput(newClient);
    if (clientIdProvided && !validClientId) throw bookingError('CALENDAR_BOOKING_CLIENT_REQUIRED', 'Select exactly one CRM V2 client.');
    if (clientIdProvided && newClientInput) throw bookingError('CALENDAR_BOOKING_INVALID_CLIENT_SELECTION', 'Choose either one CRM V2 client or one new client, not both.');
    if (!validClientId && !newClientInput) throw bookingError('CALENDAR_BOOKING_CLIENT_REQUIRED', 'Select one CRM V2 client or enter one new client.');
    return { rawClientId, newClientInput };
  }

  async function resolvePreparedClient({ validatedChoice, actorAdminId }) {
    const { rawClientId, newClientInput } = validatedChoice;
    let client;
    let resolution = 'selected';
    if (newClientInput) {
      const outcome = await crmV2Service.createClient({
        name: newClientInput.name,
        mobile: newClientInput.mobile,
        actorReference: `calendar_admin:${actorAdminId}`,
      });
      const outcomeError = crmV2OutcomeError(outcome);
      if (outcomeError) throw outcomeError;
      resolution = outcome.status === 'created' ? 'created' : 'existing_exact_mobile';
      client = await crmV2Service.getClientById(outcome.client.id);
      const expectedMobile = crmV2ClientService.normalizeMobile(newClientInput.mobile);
      if (!expectedMobile || client.normalizedMobile !== expectedMobile) {
        throw bookingError('CALENDAR_BOOKING_CRM_V2_CONFLICT', 'The exact mobile no longer resolves to the expected CRM V2 client.');
      }
    } else {
      client = await crmV2Service.getClientById(rawClientId);
    }
    if (!client || client.status !== 'active' || !/^27[678][0-9]{8}$/.test(String(client.normalizedMobile || ''))) {
      throw bookingError('CALENDAR_BOOKING_CRM_V2_CLIENT_INACTIVE', 'The selected CRM V2 client is not active or has no valid mobile.');
    }
    return { client, resolution };
  }

  async function prepare({ adminId, clientId, newClient, staffId, serviceId, date, time } = {}) {
    const admin = await resolveOperator(adminId);
    const validatedChoice = validateClientChoice(clientId, newClient);
    const selected = await resolveEligibleSelection(admin, staffId, serviceId);
    const localDateTime = localDateTimeFromInputs(date, time);
    const resolved = await resolvePreparedClient({ validatedChoice, actorAdminId: Number(admin.id) });
    const result = await prepareBooking({
      adminId: Number(admin.id),
      crmV2Client: resolved.client,
      staffName: selected.staff_name,
      serviceName: selected.service_name,
      localDateTime,
    });
    if (result.status !== 'pending_confirmation') return result;

    const durationMinutes = Math.max(0, Math.round((new Date(result.endsAt).getTime() - new Date(result.startsAt).getTime()) / 60000));
    const price = result.service.variable_price
      ? (result.service.price == null ? 'Variable' : `From R${Number(result.service.price).toFixed(2)}`)
      : (result.service.price == null ? 'Not set' : `R${Number(result.service.price).toFixed(2)}`);
    return {
      status: result.status,
      review: {
        client: {
          id: String(result.client.id),
          displayName: result.client.name,
          created: resolved.resolution === 'created',
          matchedExisting: resolved.resolution === 'existing_exact_mobile',
          profileStatus: result.client.profileStatus,
          contactHint: maskContact(result.client.normalizedMobile),
        },
        service: {
          id: Number(result.service.id),
          name: result.service.name,
          categoryName: selected.category_name || null,
          externalSource: selected.external_source || null,
          externalId: selected.external_id || null,
        },
        practitioner: { id: Number(result.staff.id), displayName: result.staff.display_name },
        startsAt: result.startsAt,
        endsAt: result.endsAt,
        durationMinutes,
        price,
        mobileAcknowledgementRequired: true,
      },
    };
  }

  async function acknowledgeMobile({ adminId } = {}) {
    const admin = await resolveOperator(adminId);
    const pending = await pendingBooking(Number(admin.id));
    if (!pending) throw bookingError('CALENDAR_BOOKING_NO_PENDING', 'There is no pending CRM V2 Calendar booking to acknowledge.');
    await resolveEligibleSelection(admin, pending.staff_id, pending.service_id);
    const result = await acknowledgeBooking(Number(admin.id));
    if (result.status !== 'acknowledged') {
      throw bookingError(
        result.status === 'client_mobile_changed' ? 'CALENDAR_BOOKING_CLIENT_MOBILE_CHANGED' : 'CALENDAR_BOOKING_NO_PENDING',
        result.status === 'client_mobile_changed'
          ? 'The active CRM V2 client/mobile changed. Prepare the booking again.'
          : 'There is no pending CRM V2 Calendar booking to acknowledge.'
      );
    }
    if (String(result.client?.id) !== String(pending.crm_v2_client_id)) {
      throw bookingError('CALENDAR_BOOKING_CLIENT_MOBILE_CHANGED', 'The CRM V2 client changed during acknowledgement.');
    }
    return {
      status: 'acknowledged',
      clientId: String(result.client.id),
      clientName: result.client.name,
      mobileHint: maskContact(result.client.normalizedMobile),
      confirmationSafe: true,
    };
  }

  async function discard({ adminId } = {}) {
    const admin = await resolveOperator(adminId);
    const cancelled = await cancelBooking(Number(admin.id));
    return { status: cancelled ? 'discarded' : 'no_pending', crmV2ClientRemoved: false };
  }

  async function confirm({ adminId } = {}) {
    const admin = await resolveOperator(adminId);
    const pending = await pendingBooking(Number(admin.id));
    if (!pending) throw bookingError('CALENDAR_BOOKING_NO_PENDING', 'There is no pending CRM V2 Calendar booking to confirm.');
    await resolveEligibleSelection(admin, pending.staff_id, pending.service_id);
    if (
      !pending.mobile_acknowledged_at
      || !pending.acknowledged_mobile
      || pending.acknowledged_mobile !== pending.client_mobile_snapshot
    ) {
      throw bookingError('CALENDAR_BOOKING_CONFIRMATION_UNSAFE', 'Acknowledge the server-derived final CRM V2 mobile before creating this booking.');
    }
    return confirmBooking(admin, { source: 'shiloh_calendar' });
  }

  return {
    resolveOperator,
    listBookableOptions,
    searchClients,
    prepare,
    acknowledgeMobile,
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
  crmV2OutcomeError,
  staticScopeForAdmin,
  bookingError,
};
