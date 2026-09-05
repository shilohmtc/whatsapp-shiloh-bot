const calendarReadOnlyUx = require('./calendarReadOnlyUx');
const workspaceMessages = require('./workspaceMessages');
const {
  dateKeyInBusinessTimezone,
} = require('./operationalCalendar');

class WorkspaceDashboardError extends Error {
  constructor(code, message, httpStatus) {
    super(message);
    this.name = 'WorkspaceDashboardError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

function validViewer(viewer) {
  return Boolean(viewer && typeof viewer === 'object' && String(viewer.calendarScope || '').trim());
}

function createWorkspaceDashboardService({
  calendarService = calendarReadOnlyUx,
  messagesService = workspaceMessages,
} = {}) {
  if (!calendarService || typeof calendarService.buildModel !== 'function') {
    throw new Error('Workspace Dashboard requires canonical CalendarReadOnlyUx authority');
  }
  if (!messagesService || typeof messagesService.resolveAccess !== 'function' || typeof messagesService.buildModel !== 'function') {
    throw new Error('Workspace Dashboard requires canonical Messages composition');
  }

  async function buildModel({ adminId, viewer, now = new Date() } = {}) {
    if (!validViewer(viewer)) {
      throw new WorkspaceDashboardError(
        'WORKSPACE_DASHBOARD_FORBIDDEN',
        'Current staff authority does not permit the operational Dashboard.',
        403
      );
    }
    const requestedDateKey = dateKeyInBusinessTimezone(now);
    const calendar = await calendarService.buildModel({
      view: 'day',
      date: requestedDateKey,
      staff: 'all',
      viewer,
      now,
    });
    const appointments = [...(calendar.timeline?.appointments || [])]
      .filter(item => item?.canonical !== false)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    let communications = null;
    let communicationsUnavailable = false;
    try {
      if (await messagesService.resolveAccess(adminId)) {
        communications = await messagesService.buildModel({ adminId, now, activityLimit: 6 });
      }
    } catch (_error) {
      communicationsUnavailable = true;
    }

    return {
      generatedAt: now.toISOString(),
      requestedDateKey,
      operationalDateKey: calendar.dateKey,
      calendar,
      appointments,
      closures: calendar.timeline?.closures || [],
      communications,
      communicationsUnavailable,
    };
  }

  return { buildModel };
}

const service = createWorkspaceDashboardService();

module.exports = {
  WorkspaceDashboardError,
  validViewer,
  createWorkspaceDashboardService,
  ...service,
};
