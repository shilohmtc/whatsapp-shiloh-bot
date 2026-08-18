function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizedAdminName(admin) {
  return clean(admin?.display_name).toLowerCase();
}

function isJeanPierreBookingException(admin) {
  return normalizedAdminName(admin) === 'jean-pierre'
    && admin?.business_role === 'business_admin'
    && admin?.calendar_scope === 'all_business'
    && admin?.service_scope === 'all_services';
}

// Canonical application entitlement contract. Broad Admin permissions do not imply
// a clinic-wide practitioner catalogue; only the named business exception may be
// unlinked while retaining the deliberately narrow Christel + Abigail scope.
function adminBookingEntitlement(admin) {
  const name = normalizedAdminName(admin);
  if (name === 'marietjie') return { key: 'marietjie', staffNames: ['marietjie'], staffIds: null, label: 'Marietjie services' };
  if (name === 'christel' || name === 'abigail' || isJeanPierreBookingException(admin)) {
    return { key: 'christel_abigail', staffNames: ['christel', 'abigail'], staffIds: null, label: 'Christel & Abigail services' };
  }
  if (Number.isFinite(Number(admin?.staff_id)) && Number(admin.staff_id) > 0) {
    return { key: 'own_practitioner', staffNames: null, staffIds: [Number(admin.staff_id)], label: `${clean(admin.display_name)} services` };
  }
  return { key: 'no_practitioner_scope', staffNames: [], staffIds: [], label: 'No practitioner services' };
}

function canPresentAdminBooking(admin) {
  return admin?.permissions?.['appointment:create'] === true
    && admin?.permissions?.['appointment:view'] === true
    && adminBookingEntitlement(admin).key !== 'no_practitioner_scope';
}

module.exports = {
  adminBookingEntitlement,
  canPresentAdminBooking,
  isJeanPierreBookingException,
  normalizedAdminName,
};
