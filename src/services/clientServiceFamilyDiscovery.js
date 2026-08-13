const { pool } = require('../db/pool');
const { formatPrice, formatDuration } = require('./serviceCatalogue');
const { processBookingMessage } = require('./bookingIntent');
const { decorateClientBookingResult } = require('./clientBookingInteractive');

const FAMILY_PAGE_SIZE = 9;
const FAMILY_RULES = Object.freeze({
  beauty: { title: 'Beauty & Aesthetics', practitioner: 'Marietjie' },
  massage: { title: 'Massage', practitioner: null },
  lymphatic: { title: 'Lymphatic Drainage', practitioner: 'Abigail' },
});

function clean(value = '') { return String(value || '').trim().replace(/\s+/g, ' '); }
function short(value = '') { const text = clean(value); return text.length <= 24 ? text : `${text.slice(0, 21)}…`; }
function serviceDescription(row) { return [formatDuration(row), formatPrice(row)].filter(Boolean).join(' • ').slice(0, 72); }

function familyFilterSql(family) {
  if (family === 'beauty') {
    return `LOWER(st.display_name) = 'marietjie'
      AND LOWER(COALESCE(sc.name, '')) <> 'massage'
      AND LOWER(s.name) NOT LIKE '%lymphatic%'`;
  }
  if (family === 'massage') {
    return `LOWER(COALESCE(sc.name, '')) = 'massage'
      AND LOWER(s.name) NOT LIKE '%lymphatic%'
      AND LOWER(st.display_name) IN ('christel', 'abigail')`;
  }
  if (family === 'lymphatic') {
    return `LOWER(s.name) LIKE '%lymphatic%'
      AND LOWER(st.display_name) = 'abigail'`;
  }
  return null;
}

async function listFamilyServices(family) {
  const filter = familyFilterSql(family);
  if (!filter) return [];
  const result = await pool.query(`
    SELECT DISTINCT s.id, s.name, s.duration_minutes, s.processing_time_minutes,
           s.extra_time_minutes, s.price, s.display_price, s.display_order
      FROM services s
      JOIN staff_services ss ON ss.service_id = s.id
      JOIN staff st ON st.id = ss.staff_id
      LEFT JOIN service_categories sc ON sc.id = s.category_id
     WHERE s.status = 'active'
       AND st.status = 'active'
       AND st.resource_type = 'practitioner'
       AND st.client_bookable = TRUE
       AND ${filter}
     ORDER BY s.display_order NULLS LAST, s.name, s.id
  `);
  return result.rows;
}

async function findFamilyService(family, serviceId) {
  const filter = familyFilterSql(family);
  if (!filter) return null;
  const result = await pool.query(`
    SELECT DISTINCT s.id, s.name
      FROM services s
      JOIN staff_services ss ON ss.service_id = s.id
      JOIN staff st ON st.id = ss.staff_id
      LEFT JOIN service_categories sc ON sc.id = s.category_id
     WHERE s.id = $1
       AND s.status = 'active'
       AND st.status = 'active'
       AND st.resource_type = 'practitioner'
       AND st.client_bookable = TRUE
       AND ${filter}
     LIMIT 1
  `, [Number(serviceId)]);
  return result.rows[0] || null;
}

async function listFamilyEligiblePractitioners(family, serviceId) {
  const names = family === 'massage' ? ['christel', 'abigail'] : family === 'beauty' ? ['marietjie'] : family === 'lymphatic' ? ['abigail'] : [];
  if (!names.length) return [];
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
       AND LOWER(st.display_name) = ANY($2::text[])
     ORDER BY CASE LOWER(st.display_name) WHEN 'christel' THEN 1 WHEN 'abigail' THEN 2 WHEN 'marietjie' THEN 3 ELSE 9 END,
              st.display_name, st.id
  `, [Number(serviceId), names]);
  return result.rows;
}

function familyServicesInteractive(family, rows = [], page = 1) {
  const config = FAMILY_RULES[family];
  const totalPages = Math.max(1, Math.ceil(rows.length / FAMILY_PAGE_SIZE));
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (safePage - 1) * FAMILY_PAGE_SIZE;
  const pageRows = rows.slice(start, start + FAMILY_PAGE_SIZE).map((row) => ({
    id: `client_family_${family}_service_${row.id}`,
    title: short(row.name),
    description: serviceDescription(row),
  }));
  if (safePage < totalPages) {
    pageRows.push({ id: `client_family_${family}_page_${safePage + 1}`, title: 'More treatments →', description: `Page ${safePage + 1} of ${totalPages}` });
  } else if (safePage > 1) {
    pageRows.push({ id: `client_family_${family}_page_1`, title: '← First page', description: `Page 1 of ${totalPages}` });
  }
  const owner = config.practitioner ? ` • ${config.practitioner}` : ' • Christel or Abigail';
  return {
    type: 'list',
    body: `*${config.title}${owner}*\nChoose an active treatment. Shiloh will only offer practitioners currently eligible in CRM.`,
    buttonText: 'Treatments',
    rows: pageRows,
    sectionTitle: config.title,
  };
}

function massagePractitionersInteractive(service, staff) {
  const rows = [
    { id: 'client_practitioner_any', title: 'Any available', description: 'Christel or Abigail, based on availability' },
    ...staff.map((row) => ({ id: `client_practitioner_${row.id}`, title: short(row.display_name), description: `Eligible for ${short(service.name)}`.slice(0, 72) })),
  ].slice(0, 10);
  return {
    type: 'list',
    body: `*${service.name}*\nChoose Christel, Abigail, or Any available where both are currently eligible.`,
    buttonText: 'Practitioner',
    rows,
    sectionTitle: 'Massage practitioner',
  };
}

async function processClientServiceFamilyMessage(sender, text) {
  const value = clean(text).toLowerCase();
  const familyMatch = value.match(/^client_family_(beauty|massage|lymphatic)$/);
  if (familyMatch) {
    const family = familyMatch[1];
    const services = await listFamilyServices(family);
    if (!services.length) return { handled: true, reply: `I can’t safely find any active ${FAMILY_RULES[family].title} treatments in Shiloh CRM right now. Please choose another service family or contact the clinic.` };
    return { handled: true, interactive: familyServicesInteractive(family, services, 1) };
  }

  const pageMatch = value.match(/^client_family_(beauty|massage|lymphatic)_page_(\d+)$/);
  if (pageMatch) {
    const family = pageMatch[1];
    const services = await listFamilyServices(family);
    if (!services.length) return { handled: true, reply: `No active ${FAMILY_RULES[family].title} treatments are available right now.` };
    return { handled: true, interactive: familyServicesInteractive(family, services, Number(pageMatch[2])) };
  }

  const serviceMatch = value.match(/^client_family_(beauty|massage|lymphatic)_service_(\d+)$/);
  if (!serviceMatch) return { handled: false };
  const family = serviceMatch[1];
  const service = await findFamilyService(family, serviceMatch[2]);
  if (!service) return { handled: true, reply: 'That treatment is no longer available in this service family. Please reopen the booking menu to refresh the current CRM options.' };

  const staff = await listFamilyEligiblePractitioners(family, service.id);
  if (!staff.length) return { handled: true, reply: 'No eligible client-bookable practitioner is currently mapped to that treatment. Nothing has been booked.' };

  const staged = await processBookingMessage(sender, `Book ${service.name}`);
  if (family === 'massage' && staff.length > 1) {
    return { handled: true, intent: staged.intent, interactive: massagePractitionersInteractive(service, staff) };
  }

  const chosen = staff[0];
  return decorateClientBookingResult(await processBookingMessage(sender, `booking with ${chosen.display_name}`));
}

module.exports = {
  FAMILY_PAGE_SIZE,
  FAMILY_RULES,
  familyFilterSql,
  familyServicesInteractive,
  listFamilyEligiblePractitioners,
  listFamilyServices,
  massagePractitionersInteractive,
  processClientServiceFamilyMessage,
};