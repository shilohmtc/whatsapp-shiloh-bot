const { PostgresCrmV2ClientRepository } = require('../repositories/crmV2ClientRepository');

function maskContact(value = '') {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 4 ? `ending in ${digits.slice(-4)}` : null;
}

function createCalendarBookingClientDirectory({
  repository = new PostgresCrmV2ClientRepository(),
} = {}) {
  if (!repository || typeof repository.searchClients !== 'function') {
    throw new Error('Calendar booking client directory repository is required');
  }

  async function listActiveClients(limit = 10) {
    const safeLimit = Math.min(25, Math.max(1, Number.parseInt(limit, 10) || 10));
    const rows = await repository.searchClients({
      query: '',
      mobileSearch: '',
      exactMobile: null,
      status: 'active',
      limit: safeLimit,
    });
    const clients = (Array.isArray(rows) ? rows : []).map((row) => ({
      id: String(row.id),
      displayName: row.name || 'Unnamed client',
      status: row.status || 'active',
      profileStatus: row.profile_status || null,
      contactHint: maskContact(row.normalized_mobile),
    }));
    return {
      clients,
      requiresExplicitSelection: true,
      ambiguous: clients.length > 1,
      identityModel: 'crm_v2_operator_browse_only',
    };
  }

  return { listActiveClients };
}

module.exports = {
  createCalendarBookingClientDirectory,
  maskContact,
};
