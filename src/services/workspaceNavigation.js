const workspaceClients = require('./workspaceClients');
const workspaceStaff = require('./workspaceStaff');
const workspaceServices = require('./workspaceServices');
const workspaceReports = require('./workspaceReports');

const DESTINATIONS = Object.freeze({
  dashboard: '/calendar/workspace',
  calendar: '/calendar/read-only',
  clients: '/calendar/clients',
  messages: '/calendar/messages',
  staff: '/calendar/team',
  services: '/calendar/services',
  reports: '/calendar/reports',
});

function allowedDestination(allowed, key) {
  return allowed ? { allowed: true, href: DESTINATIONS[key] } : { allowed: false, href: null };
}

function createWorkspaceNavigationService({
  clientAccessService = workspaceClients,
  staffAccessService = workspaceStaff,
  servicesAccessService = workspaceServices,
  reportsAccessService = workspaceReports,
} = {}) {
  async function resolve({ session } = {}) {
    const adminId = session?.adminId;
    const calendarAllowed = Boolean(session?.viewer);
    const [clients, staff, services, reports] = await Promise.allSettled([
      clientAccessService.resolveAccess(adminId),
      staffAccessService.resolveAccess(adminId),
      servicesAccessService.resolveAccess(adminId),
      reportsAccessService.resolveAccess(adminId),
    ]);
    const clientsAllowed = clients.status === 'fulfilled' && Boolean(clients.value);
    return {
      dashboard: allowedDestination(calendarAllowed, 'dashboard'),
      calendar: allowedDestination(calendarAllowed, 'calendar'),
      clients: allowedDestination(clientsAllowed, 'clients'),
      messages: allowedDestination(clientsAllowed, 'messages'),
      staff: allowedDestination(staff.status === 'fulfilled' && Boolean(staff.value), 'staff'),
      services: allowedDestination(services.status === 'fulfilled' && Boolean(services.value), 'services'),
      reports: allowedDestination(reports.status === 'fulfilled' && Boolean(reports.value), 'reports'),
    };
  }

  return { resolve };
}

const service = createWorkspaceNavigationService();

module.exports = {
  DESTINATIONS,
  allowedDestination,
  createWorkspaceNavigationService,
  ...service,
};
