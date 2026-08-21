function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function displayServiceName(name = '') {
  return clean(name).replace(/^\d+\.\s*/, '').replace(/^[-–—]\s*/, '');
}

const BODY_TREATMENT_NAMES = new Set([
  'neo pelvic therapy',
  'vaginal tightening & rejuvenation',
  'ozone & far infrared',
]);

function isRequestedBodyTreatment(service) {
  return BODY_TREATMENT_NAMES.has(displayServiceName(service?.name).toLowerCase());
}

function dedupeServices(services = []) {
  const seen = new Set();
  return services.filter((service) => {
    const key = service?.id != null ? `id:${service.id}` : `name:${displayServiceName(service?.name).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function removeRequestedBodyTreatments(category) {
  const services = (category?.services || []).filter((service) => !isRequestedBodyTreatment(service));
  const groups = (category?.groups || [])
    .map((group) => ({ ...group, services: (group.services || []).filter((service) => !isRequestedBodyTreatment(service)) }))
    .filter((group) => group.services.length > 0);
  return { ...category, services, groups };
}

function standardizeBookingCategories(categories = []) {
  const source = Array.isArray(categories) ? categories : [];
  const requested = dedupeServices(source.flatMap((category) => (category.services || []).filter(isRequestedBodyTreatment)));
  const massage = source.find((category) => category?.name === 'Massage & Body');
  const existingBody = source.find((category) => category?.name === 'Body Treatments');
  const base = massage || existingBody || { name: 'Body Treatments', services: [], groups: [] };
  const baseServices = (base.services || []).filter((service) => !isRequestedBodyTreatment(service));
  const bodyServices = dedupeServices([...baseServices, ...requested]);

  const preservedGroups = (base.groups || [])
    .map((group) => ({
      ...group,
      name: group.name === 'Other Massage & Body' ? 'Other Body Treatments' : group.name,
      services: (group.services || []).filter((service) => !isRequestedBodyTreatment(service)),
    }))
    .filter((group) => group.services.length > 0);

  if (requested.length) {
    const technologyIndex = preservedGroups.findIndex((group) => group.name === 'Body Technology');
    if (technologyIndex >= 0) {
      preservedGroups[technologyIndex] = {
        ...preservedGroups[technologyIndex],
        services: dedupeServices([...preservedGroups[technologyIndex].services, ...requested]),
      };
    } else {
      preservedGroups.push({ name: 'Body Technology', services: requested });
    }
  }

  const bodyCategory = { ...base, name: 'Body Treatments', services: bodyServices, groups: preservedGroups };
  const output = [];
  let insertedBody = false;
  for (const category of source) {
    if (category?.name === 'Massage & Body' || category?.name === 'Body Treatments') {
      if (!insertedBody && bodyServices.length) {
        output.push(bodyCategory);
        insertedBody = true;
      }
      continue;
    }
    const cleaned = removeRequestedBodyTreatments(category);
    if (cleaned.services.length) output.push(cleaned);
  }
  if (!insertedBody && bodyServices.length) output.unshift(bodyCategory);
  return output;
}

const SECTION_DESCRIPTIONS = {
  admin_section_appointments: 'Bookings, visits and availability',
  admin_section_reports: 'Clinic and earnings reports',
  admin_section_clients: 'Client details and client actions',
  admin_section_services: 'Services and pricing',
  admin_section_schedule: 'Working hours and time off',
  admin_section_more: 'Additional Admin tools',
};

const ACTION_COPY = {
  admin_action_today: ['Today’s appointments', 'View today’s appointments'],
  admin_action_tomorrow: ['Tomorrow’s appointments', 'View tomorrow’s appointments'],
  admin_action_availability: ['Find availability', 'Check the authoritative diary'],
  admin_action_booking: ['New booking', 'Create a new booking'],
  admin_action_manage_booking: ['Manage booking', 'View, reschedule or cancel a booking'],
  admin_action_finalize: ['Finalize visits', 'Complete or update past appointments'],
  admin_action_client: ['Client details', 'View authorized CRM client details'],
  admin_action_staff_services: ['Staff services', 'View authorized service mappings'],
  admin_action_pricing: ['Services & pricing', 'View or manage service pricing'],
  admin_action_schedule: ['Manage schedule', 'Working hours, leave and closures'],
  admin_action_calendar_integrity: ['Calendar integrity', 'Check booking and Calendar integrity'],
  admin_action_help: ['Help', 'View Admin help'],
  admin_action_reset_juvan: ['Reset Juvan', 'Choose booking cleanup or identity-only reset'],
  admin_appointment_block_time: ['Block time', 'Make practitioner time unavailable'],
  admin_block_manage: ['Blocked time', 'View or manage upcoming blocks'],
};

function standardizeRow(row = {}) {
  const next = { ...row };
  if (SECTION_DESCRIPTIONS[next.id]) next.description = SECTION_DESCRIPTIONS[next.id];
  if (ACTION_COPY[next.id]) {
    next.title = ACTION_COPY[next.id][0];
    next.description = ACTION_COPY[next.id][1];
  }

  if (next.id === 'menu') {
    next.title = '← Back to Admin';
    next.description = 'Return to the main Admin menu';
  } else if (/^admin_section_/.test(next.id || '') && /^← Back to /.test(next.title || '')) {
    next.description = `Return to ${clean(next.title).replace(/^← Back to /, '')}`;
  }

  if (next.title === 'Massage & Body') next.title = 'Body Treatments';
  if (next.title === 'Other Massage & Body') next.title = 'Other Body Treatments';

  if (next.id === 'admin_booking_cancel_flow' || (next.title === 'Cancel booking' && /^Exit without creating/i.test(next.description || ''))) {
    next.title = 'Cancel new booking';
    next.description = 'Exit without creating a booking';
  }

  return next;
}

function isBookingCategoryInteractive(interactive) {
  return interactive?.type === 'list'
    && Array.isArray(interactive.rows)
    && interactive.rows.some((row) => /^admin_booking_category:\d+$/.test(String(row?.id || '')));
}

function standardizeAdminWelcomeBody(body = '') {
  const value = String(body || '');
  if (!/^\*Shiloh Admin 🌿\*\n/u.test(value)) return value;
  return value.replace(
    /\n\nWhat would you like to do today\?\n\nChoose a section below\.\s*$/u,
    '\n\nWhat would you like to manage today?'
  );
}

function standardizeInteractive(interactive) {
  if (!interactive || typeof interactive !== 'object') return interactive;
  const next = { ...interactive };
  if (Array.isArray(interactive.rows)) next.rows = interactive.rows.map(standardizeRow);
  if (Array.isArray(interactive.buttons)) {
    next.buttons = interactive.buttons.map((button) => {
      if (['admin_booking_cancel_flow', 'admin_booking_cancel'].includes(button?.id)) return { ...button, title: 'Cancel new booking' };
      return { ...button };
    });
  }
  if (typeof next.body === 'string') {
    next.body = standardizeAdminWelcomeBody(next.body)
      .replace(/^\*Find & book an appointment\*/u, '*New booking*')
      .replace(/Choose what you want to do\./g, 'Choose an action.');
  }
  if (next.sectionTitle === 'Massage & Body') next.sectionTitle = 'Body Treatments';
  return next;
}

function standardizeAdminUxResult(result) {
  if (!result?.handled || !result?.interactive) return result;
  return { ...result, interactive: standardizeInteractive(result.interactive) };
}

module.exports = {
  ACTION_COPY,
  BODY_TREATMENT_NAMES,
  SECTION_DESCRIPTIONS,
  displayServiceName,
  isBookingCategoryInteractive,
  isRequestedBodyTreatment,
  standardizeAdminUxResult,
  standardizeAdminWelcomeBody,
  standardizeBookingCategories,
  standardizeInteractive,
  standardizeRow,
};
