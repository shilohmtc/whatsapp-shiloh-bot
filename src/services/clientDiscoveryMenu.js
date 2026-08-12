const { pool } = require('../db/pool');
const { formatPrice, formatDuration } = require('./serviceCatalogue');
const { listClientBookableStaff } = require('./clientBookingStaffGuard');
const { processBookingMessage, getIntent } = require('./bookingIntent');
const { decorateClientBookingResult } = require('./clientBookingInteractive');

const SERVICE_PAGE_SIZE = 9;

function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function isGreeting(text = '') {
  return /^(hi|hello|hey|howzit|hiya|good morning|good afternoon|good evening)[!. ]*$/i.test(clean(text));
}

function isHomeCommand(text = '') {
  const value = clean(text).toLowerCase();
  return isGreeting(text) || ['menu', 'home', 'client menu', 'main menu'].includes(value);
}

function clientHomeInteractive() {
  return {
    type: 'button',
    body: '*Shiloh 🌿*\nHow can I help you today?',
    buttons: [
      { id: 'client_browse_services', title: 'Browse services' },
      { id: 'client_practitioners', title: 'Our practitioners' },
      { id: 'client_book_now', title: 'Book now' },
    ],
  };
}

async function listClientBookableServices() {
  const result = await pool.query(`
    SELECT DISTINCT s.id, s.name, s.duration_minutes, s.processing_time_minutes,
           s.extra_time_minutes, s.price, s.display_price,
           COALESCE(sc.name, 'Services') AS category_name,
           sc.display_order AS category_order, s.display_order
      FROM services s
      JOIN staff_services ss ON ss.service_id = s.id
      JOIN staff st ON st.id = ss.staff_id
      LEFT JOIN service_categories sc ON sc.id = s.category_id
     WHERE s.status = 'active'
       AND st.status = 'active'
       AND st.resource_type = 'practitioner'
       AND st.client_bookable = TRUE
     ORDER BY category_order NULLS LAST, s.display_order NULLS LAST, s.name, s.id
  `);
  return result.rows;
}

async function listServicesForPractitioner(practitionerId) {
  const result = await pool.query(`
    SELECT DISTINCT s.id, s.name, s.duration_minutes, s.processing_time_minutes,
           s.extra_time_minutes, s.price, s.display_price,
           COALESCE(sc.name, 'Services') AS category_name,
           sc.display_order AS category_order, s.display_order
      FROM services s
      JOIN staff_services ss ON ss.service_id = s.id
      JOIN staff st ON st.id = ss.staff_id
      LEFT JOIN service_categories sc ON sc.id = s.category_id
     WHERE st.id = $1
       AND s.status = 'active'
       AND st.status = 'active'
       AND st.resource_type = 'practitioner'
       AND st.client_bookable = TRUE
     ORDER BY category_order NULLS LAST, s.display_order NULLS LAST, s.name, s.id
  `, [Number(practitionerId)]);
  return result.rows;
}

async function listEligiblePractitionersForService(serviceId) {
  const result = await pool.query(`
    SELECT DISTINCT st.id, st.display_name
      FROM staff st
      JOIN staff_services ss ON ss.staff_id = st.id
      JOIN services s ON s.id = ss.service_id
     WHERE s.id = $1
       AND s.status = 'active'
       AND st.status = 'active'
       AND st.resource_type = 'practitioner'
       AND st.client_bookable = TRUE
     ORDER BY CASE LOWER(st.display_name)
       WHEN 'christel' THEN 1
       WHEN 'abigail' THEN 2
       WHEN 'marietjie' THEN 3
       ELSE 9 END,
       st.display_name,
       st.id
  `, [Number(serviceId)]);
  return result.rows;
}

function serviceDescription(row) {
  const parts = [formatDuration(row), formatPrice(row)].filter(Boolean);
  return parts.join(' • ').slice(0, 72);
}

function serviceTitle(name = '') {
  const value = clean(name);
  return value.length <= 24 ? value : `${value.slice(0, 21)}…`;
}

function servicePageInteractive(rows = [], page = 1) {
  const totalPages = Math.max(1, Math.ceil(rows.length / SERVICE_PAGE_SIZE));
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (safePage - 1) * SERVICE_PAGE_SIZE;
  const pageRows = rows.slice(start, start + SERVICE_PAGE_SIZE).map((row) => ({
    id: `client_service_${row.id}`,
    title: serviceTitle(row.name),
    description: serviceDescription(row),
  }));

  if (safePage < totalPages) {
    pageRows.push({
      id: `client_services_page_${safePage + 1}`,
      title: 'More services →',
      description: `Page ${safePage + 1} of ${totalPages}`,
    });
  } else if (safePage > 1) {
    pageRows.push({
      id: 'client_services_page_1',
      title: '← First page',
      description: `Page 1 of ${totalPages}`,
    });
  }

  return {
    type: 'list',
    body: `*Browse Shiloh services*\nChoose a treatment to start a booking. Showing page ${safePage} of ${totalPages}.`,
    buttonText: 'View services',
    rows: pageRows,
    sectionTitle: 'Client-bookable services',
  };
}

function practitionerServicePageInteractive(rows = [], practitioner, page = 1) {
  const totalPages = Math.max(1, Math.ceil(rows.length / SERVICE_PAGE_SIZE));
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (safePage - 1) * SERVICE_PAGE_SIZE;
  const pageRows = rows.slice(start, start + SERVICE_PAGE_SIZE).map((row) => ({
    id: `client_service_${row.id}`,
    title: serviceTitle(row.name),
    description: serviceDescription(row),
  }));

  if (safePage < totalPages) {
    pageRows.push({
      id: `client_practitioner_services_${practitioner.id}_page_${safePage + 1}`,
      title: 'More services →',
      description: `Page ${safePage + 1} of ${totalPages}`,
    });
  } else if (safePage > 1) {
    pageRows.push({
      id: `client_practitioner_services_${practitioner.id}_page_1`,
      title: '← First page',
      description: `Page 1 of ${totalPages}`,
    });
  }

  return {
    type: 'list',
    body: `*Services with ${practitioner.display_name}*\nChoose an active service mapped to this practitioner. Showing page ${safePage} of ${totalPages}.`,
    buttonText: 'View services',
    rows: pageRows,
    sectionTitle: `${serviceTitle(practitioner.display_name)} services`,
  };
}

function eligiblePractitionersInteractive(service, staff = []) {
  const rows = [
    {
      id: 'client_practitioner_any',
      title: 'Any available',
      description: 'Use any eligible practitioner for this service',
    },
    ...staff.slice(0, 9).map((row) => ({
      id: `client_practitioner_${row.id}`,
      title: serviceTitle(row.display_name),
      description: `Eligible for ${serviceTitle(service.name)}`.slice(0, 72),
    })),
  ].slice(0, 10);

  return {
    type: 'list',
    body: `*${service.name}*\nChoose an eligible practitioner, or choose Any available.`,
    buttonText: 'Practitioners',
    rows,
    sectionTitle: 'Eligible practitioners',
  };
}

async function practitionersInteractive() {
  const staff = await listClientBookableStaff();
  const rows = staff.slice(0, 9).map((row) => ({
    id: `client_practitioner_${row.id}`,
    title: serviceTitle(row.display_name),
    description: 'Client-bookable Shiloh practitioner',
  }));
  rows.push({ id: 'client_book_now', title: 'Book now', description: 'Start with a service or preference' });
  return {
    type: 'list',
    body: '*Our practitioners*\nChoose a practitioner to see the active services currently mapped to them.',
    buttonText: 'Practitioners',
    rows,
    sectionTitle: 'Shiloh practitioners',
  };
}

async function findClientBookableService(id) {
  const result = await pool.query(`
    SELECT DISTINCT s.id, s.name
      FROM services s
      JOIN staff_services ss ON ss.service_id = s.id
      JOIN staff st ON st.id = ss.staff_id
     WHERE s.id = $1
       AND s.status = 'active'
       AND st.status = 'active'
       AND st.resource_type = 'practitioner'
       AND st.client_bookable = TRUE
     LIMIT 1
  `, [Number(id)]);
  return result.rows[0] || null;
}

async function findClientBookablePractitioner(id) {
  const result = await pool.query(`
    SELECT id, display_name
      FROM staff
     WHERE id = $1
       AND status = 'active'
       AND resource_type = 'practitioner'
       AND client_bookable = TRUE
     LIMIT 1
  `, [Number(id)]);
  return result.rows[0] || null;
}

async function practitionerEligibleForService(practitionerId, serviceName) {
  const result = await pool.query(`
    SELECT st.id, st.display_name
      FROM staff st
      JOIN staff_services ss ON ss.staff_id = st.id
      JOIN services s ON s.id = ss.service_id
     WHERE st.id = $1
       AND LOWER(s.name) = LOWER($2)
       AND s.status = 'active'
       AND st.status = 'active'
       AND st.resource_type = 'practitioner'
       AND st.client_bookable = TRUE
     LIMIT 1
  `, [Number(practitionerId), clean(serviceName)]);
  return result.rows[0] || null;
}

async function serviceEligibleForPractitioner(serviceId, practitionerName) {
  const result = await pool.query(`
    SELECT s.id, s.name
      FROM services s
      JOIN staff_services ss ON ss.service_id = s.id
      JOIN staff st ON st.id = ss.staff_id
     WHERE s.id = $1
       AND LOWER(st.display_name) = LOWER($2)
       AND s.status = 'active'
       AND st.status = 'active'
       AND st.resource_type = 'practitioner'
       AND st.client_bookable = TRUE
     LIMIT 1
  `, [Number(serviceId), clean(practitionerName)]);
  return result.rows[0] || null;
}

async function processClientDiscoveryMessage(sender, text) {
  const raw = clean(text);
  const value = raw.toLowerCase();

  if (isHomeCommand(raw)) return { handled: true, interactive: clientHomeInteractive() };

  if (['client_browse_services', 'browse services', 'services'].includes(value)) {
    const services = await listClientBookableServices();
    if (!services.length) {
      return { handled: true, reply: 'I can’t safely load Shiloh’s client-bookable services right now. Please try again shortly.' };
    }
    return { handled: true, interactive: servicePageInteractive(services, 1) };
  }

  const pageMatch = value.match(/^client_services_page_(\d+)$/);
  if (pageMatch) {
    const services = await listClientBookableServices();
    if (!services.length) return { handled: true, reply: 'No client-bookable services are available to display right now.' };
    return { handled: true, interactive: servicePageInteractive(services, Number(pageMatch[1])) };
  }

  const practitionerPageMatch = value.match(/^client_practitioner_services_(\d+)_page_(\d+)$/);
  if (practitionerPageMatch) {
    const practitioner = await findClientBookablePractitioner(practitionerPageMatch[1]);
    if (!practitioner) {
      return { handled: true, reply: 'That practitioner is no longer available for direct client booking. Send *Our practitioners* to refresh the current list.' };
    }
    const services = await listServicesForPractitioner(practitioner.id);
    if (!services.length) {
      return { handled: true, reply: `${practitioner.display_name} has no active client-bookable services mapped right now.` };
    }
    return { handled: true, interactive: practitionerServicePageInteractive(services, practitioner, Number(practitionerPageMatch[2])) };
  }

  if (['client_practitioners', 'our practitioners', 'practitioners'].includes(value)) {
    return { handled: true, interactive: await practitionersInteractive() };
  }

  if (['client_book_now', 'book now'].includes(value)) {
    return decorateClientBookingResult(await processBookingMessage(sender, 'booking'));
  }

  const serviceMatch = value.match(/^client_service_(\d+)$/);
  if (serviceMatch) {
    let service = await findClientBookableService(serviceMatch[1]);
    if (!service) {
      return { handled: true, reply: 'That service is no longer available for direct client booking. Send *Services* to refresh the current list.' };
    }

    const existing = await getIntent(sender);
    const chosenPractitioner = clean(existing?.therapist_text);
    if (chosenPractitioner && chosenPractitioner !== 'Any available therapist') {
      service = await serviceEligibleForPractitioner(service.id, chosenPractitioner);
      if (!service) {
        return {
          handled: true,
          reply: `That service is not currently mapped to ${chosenPractitioner}. Send *Our practitioners* to refresh the current practitioner/service options.`,
        };
      }
    }

    const staged = await processBookingMessage(sender, `Book ${service.name}`);
    if (chosenPractitioner) return decorateClientBookingResult(staged);

    const eligible = await listEligiblePractitionersForService(service.id);
    if (!eligible.length) {
      return { handled: true, reply: 'No client-bookable practitioner is currently mapped to that service. Nothing has been booked.' };
    }
    return { handled: true, intent: staged.intent, interactive: eligiblePractitionersInteractive(service, eligible) };
  }

  if (value === 'client_practitioner_any') {
    const existing = await getIntent(sender);
    if (!existing?.service_text) {
      const staged = await processBookingMessage(sender, 'booking with any therapist');
      const services = await listClientBookableServices();
      if (!services.length) return decorateClientBookingResult(staged);
      return { handled: true, intent: staged.intent, interactive: servicePageInteractive(services, 1) };
    }
    return decorateClientBookingResult(await processBookingMessage(sender, 'booking with any therapist'));
  }

  const practitionerMatch = value.match(/^client_practitioner_(\d+)$/);
  if (practitionerMatch) {
    let practitioner = await findClientBookablePractitioner(practitionerMatch[1]);
    if (!practitioner) {
      return { handled: true, reply: 'That practitioner is no longer available for direct client booking. Send *Our practitioners* to refresh the current list.' };
    }

    const existing = await getIntent(sender);
    if (existing?.service_text) {
      practitioner = await practitionerEligibleForService(practitioner.id, existing.service_text);
      if (!practitioner) {
        return {
          handled: true,
          reply: 'That practitioner is not currently eligible for the selected service. Send *Services* to refresh the current service/practitioner options.',
        };
      }
      return decorateClientBookingResult(await processBookingMessage(sender, `booking with ${practitioner.display_name}`));
    }

    const staged = await processBookingMessage(sender, `booking with ${practitioner.display_name}`);
    const services = await listServicesForPractitioner(practitioner.id);
    if (!services.length) {
      return { handled: true, reply: `${practitioner.display_name} has no active client-bookable services mapped right now. Nothing has been booked.` };
    }
    return { handled: true, intent: staged.intent, interactive: practitionerServicePageInteractive(services, practitioner, 1) };
  }

  return { handled: false };
}

module.exports = {
  SERVICE_PAGE_SIZE,
  clientHomeInteractive,
  eligiblePractitionersInteractive,
  isHomeCommand,
  listClientBookableServices,
  listEligiblePractitionersForService,
  listServicesForPractitioner,
  practitionerServicePageInteractive,
  practitionersInteractive,
  processClientDiscoveryMessage,
  servicePageInteractive,
};
