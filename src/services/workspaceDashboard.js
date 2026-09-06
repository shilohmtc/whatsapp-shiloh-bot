const { pool } = require('../db/pool');
const calendarReadOnlyUx = require('./calendarReadOnlyUx');
const workspaceMessages = require('./workspaceMessages');
const {
  CALENDAR_CAPABILITIES,
  hasCapability,
  resolveCalendarAuthority,
} = require('./calendarAuthorization');
const { finalizeAppointment } = require('./adminAppointmentFinalization');
const { canCertifyAppointment } = require('./attendanceFinalizationAuthority');
const { dateKeyInBusinessTimezone } = require('./operationalCalendar');

const FINAL_STATUSES = new Set(['completed', 'cancelled', 'no_show']);
const OWNER_ROLES = new Set(['owner', 'business_admin']);

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

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function viewerMatchesPrincipal(viewer, principal) {
  if (!validViewer(viewer) || !principal?.calendarAuthority) return false;
  const sessionScope = String(viewer.calendarScope || '').trim().toLowerCase();
  const authority = principal.calendarAuthority;
  if (authority.calendarScope === 'all_business' || authority.calendarScope === 'own_services') {
    return sessionScope === 'business_all_staff';
  }
  if (!['own', 'own_appointments'].includes(authority.calendarScope)) return false;
  return sessionScope === 'own_staff'
    && positiveId(viewer.staffId || viewer.staff_id) === positiveId(authority.linkedStaffId);
}

function dashboardAuthority(principal) {
  const authority = principal?.calendarAuthority;
  if (!authority || !hasCapability(authority, CALENDAR_CAPABILITIES.VIEW)) return null;
  const role = String(authority.businessRole || '').trim().toLowerCase();
  const isOwnerOverview = OWNER_ROLES.has(role) && authority.calendarScope === 'all_business';
  if (isOwnerOverview) {
    return {
      mode: 'owner_overview',
      linkedStaffId: positiveId(authority.linkedStaffId),
      canFinalize: principal.permissions?.['booking:update'] === true,
      timelineViewer: { calendarScope: 'all_business' },
    };
  }
  const linkedStaffId = positiveId(authority.linkedStaffId);
  if (!linkedStaffId) return null;
  return {
    mode: 'my_day',
    linkedStaffId,
    canFinalize: principal.permissions?.['booking:update'] === true,
    timelineViewer: { calendarScope: 'own_appointments', staffId: linkedStaffId },
  };
}

function appointmentIsPast(item, now) {
  const end = new Date(item?.endsAt).getTime();
  return Number.isFinite(end) && end <= now.getTime();
}

function appointmentNeedsFinalization(item, now) {
  return Boolean(item?.revision)
    && appointmentIsPast(item, now)
    && !FINAL_STATUSES.has(String(item.status || '').toLowerCase());
}

function appointmentCanBeFinalized(item, authority, now) {
  if (!authority?.canFinalize || !appointmentNeedsFinalization(item, now)) return false;
  const staffIds = [...new Set((item.staffIds || []).map(Number).filter(Number.isSafeInteger))];
  if (!staffIds.length) return false;
  if (authority.mode === 'owner_overview') return true;
  return staffIds.every(id => id === authority.linkedStaffId);
}

function projectAppointment(item, authority, now) {
  return {
    ...item,
    needsFinalization: appointmentNeedsFinalization(item, now),
    canFinalize: appointmentCanBeFinalized(item, authority, now),
  };
}

function groupOwnerAppointments(appointments, staff = []) {
  const staffNames = new Map(staff.map(person => [Number(person.id), person.displayName]));
  const groups = new Map();
  for (const appointment of appointments) {
    const staffIds = [...new Set((appointment.staffIds || []).map(Number).filter(Number.isSafeInteger))];
    const key = staffIds.length === 1 ? `staff:${staffIds[0]}` : 'shared';
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: staffIds.length === 1 ? (staffNames.get(staffIds[0]) || 'Practitioner') : 'Shared appointments',
        appointments: [],
      });
    }
    groups.get(key).appointments.push(appointment);
  }
  return [...groups.values()];
}

function addCalendarDay(dateKey) {
  const date = new Date(`${dateKey}T12:00:00+02:00`);
  date.setUTCDate(date.getUTCDate() + 1);
  return dateKeyInBusinessTimezone(date);
}

function operationalDayWindow(dateKey) {
  return {
    windowStart: new Date(`${dateKey}T00:00:00+02:00`).toISOString(),
    windowEnd: new Date(`${addCalendarDay(dateKey)}T00:00:00+02:00`).toISOString(),
  };
}

function createWorkspaceDashboardService({
  calendarService = calendarReadOnlyUx,
  messagesService = workspaceMessages,
  resolvePrincipal = adminId => resolveCalendarAuthority(pool, adminId),
  finalizeAppointmentFn = finalizeAppointment,
  canCertifyAppointmentFn = canCertifyAppointment,
} = {}) {
  if (!calendarService || typeof calendarService.buildModel !== 'function') {
    throw new Error('Workspace Dashboard requires canonical CalendarReadOnlyUx authority');
  }
  if (!messagesService || typeof messagesService.resolveAccess !== 'function' || typeof messagesService.buildModel !== 'function') {
    throw new Error('Workspace Dashboard requires canonical Messages composition');
  }
  if (typeof resolvePrincipal !== 'function') throw new Error('Workspace Dashboard requires current Calendar principal resolution');
  if (typeof finalizeAppointmentFn !== 'function') throw new Error('Workspace Dashboard requires the canonical appointment finalizer');
  if (typeof canCertifyAppointmentFn !== 'function') throw new Error('Workspace Dashboard requires canonical attendance-certification authority');

  async function resolveAuthority(adminId, viewer) {
    const principal = await resolvePrincipal(adminId);
    const authority = dashboardAuthority(principal);
    if (!authority || !viewerMatchesPrincipal(viewer, principal)) {
      throw new WorkspaceDashboardError(
        'WORKSPACE_DASHBOARD_FORBIDDEN',
        'Current staff authority does not permit the operational Dashboard.',
        403
      );
    }
    return { principal, authority };
  }

  async function buildModel({ adminId, viewer, now = new Date() } = {}) {
    const { principal, authority } = await resolveAuthority(adminId, viewer);
    const requestedDateKey = dateKeyInBusinessTimezone(now);
    const calendar = await calendarService.buildModel({
      view: 'day',
      date: requestedDateKey,
      staff: 'all',
      viewer: authority.timelineViewer,
      now,
    });
    const appointments = [...(calendar.timeline?.appointments || [])]
      .filter(item => item?.canonical !== false)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .map(item => projectAppointment(item, authority, now));
    await Promise.all(appointments.map(async (item) => {
      if (!item.canFinalize) return;
      item.canFinalize = await canCertifyAppointmentFn(principal, item.id, pool, {
        workspace: true,
        allowBusinessBackup: authority.mode === 'owner_overview',
      });
    }));
    const awaitingFinalization = appointments.filter(item => item.needsFinalization);
    const recentActivity = appointments
      .filter(item => ['completed', 'no_show'].includes(String(item.status || '').toLowerCase()))
      .sort((a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime())
      .slice(0, 6);

    let communications = null;
    let communicationsUnavailable = false;
    try {
      if (await messagesService.resolveAccess(adminId)) {
        communications = await messagesService.buildModel({ adminId, now, activityLimit: 4 });
      }
    } catch (_error) {
      communicationsUnavailable = true;
    }

    return {
      generatedAt: now.toISOString(),
      requestedDateKey,
      operationalDateKey: calendar.dateKey,
      displayName: String(principal.display_name || 'Shiloh practitioner').trim(),
      mode: authority.mode,
      linkedStaffId: authority.linkedStaffId,
      calendar,
      appointments,
      teamGroups: authority.mode === 'owner_overview'
        ? groupOwnerAppointments(appointments, calendar.timeline?.staff || [])
        : [],
      awaitingFinalization,
      recentActivity,
      closures: calendar.timeline?.closures || [],
      communications,
      communicationsUnavailable,
    };
  }

  async function finalizeVisit({ adminId, viewer, appointmentId, expectedRevision, outcome, now = new Date() } = {}) {
    const { principal, authority } = await resolveAuthority(adminId, viewer);
    const id = positiveId(appointmentId);
    const targetStatus = String(outcome || '').trim().toLowerCase();
    const revisionTime = new Date(expectedRevision).getTime();
    if (!id || !['completed', 'no_show'].includes(targetStatus) || !Number.isFinite(revisionTime) || !authority.canFinalize) {
      throw new WorkspaceDashboardError('WORKSPACE_DASHBOARD_FINALIZE_INVALID', 'This finalization request is invalid.', 400);
    }
    const result = await finalizeAppointmentFn(principal, id, targetStatus, {
      ...operationalDayWindow(dateKeyInBusinessTimezone(now)),
      expectedRevision: String(expectedRevision),
      workspace: true,
      allowBusinessBackup: authority.mode === 'owner_overview',
    });
    if (result?.status === 'updated') return { ok: true, appointmentId: id, outcome: targetStatus };
    if (result?.status === 'certification_forbidden') {
      throw new WorkspaceDashboardError('WORKSPACE_DASHBOARD_FINALIZE_FORBIDDEN', 'Current authority cannot finalize this appointment.', 403);
    }
    if (['stale_or_forbidden', 'stale_revision'].includes(result?.status)) {
      throw new WorkspaceDashboardError('WORKSPACE_DASHBOARD_FINALIZE_STALE', 'This appointment changed. Refresh the Dashboard before trying again.', 409);
    }
    throw new WorkspaceDashboardError('WORKSPACE_DASHBOARD_FINALIZE_INVALID', 'This appointment outcome cannot be recorded.', 400);
  }

  return { buildModel, finalizeVisit };
}

const service = createWorkspaceDashboardService();

module.exports = {
  WorkspaceDashboardError,
  validViewer,
  viewerMatchesPrincipal,
  dashboardAuthority,
  appointmentCanBeFinalized,
  appointmentNeedsFinalization,
  groupOwnerAppointments,
  operationalDayWindow,
  createWorkspaceDashboardService,
  ...service,
};
