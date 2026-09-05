const express = require('express');
const { pool } = require('../db/pool');
const calendarReadOnlyUx = require('../services/calendarReadOnlyUx');
const { renderCalendarPage, renderUnavailablePage } = require('../presentation/calendarReadOnlyUx');
const { isCalendarBridgeEnabled } = require('../middleware/staffBrowserSession');
const { createCalendarCreateBookingService } = require('../services/calendarCreateBooking');
const { createCalendarOperationalMutationService } = require('../services/calendarOperationalMutations');
const workspaceClients = require('../services/workspaceClients');
const workspaceClientNotifications = require('../services/workspaceClientNotifications');

const CALENDAR_VIEWER_CONTEXT = Symbol.for('shiloh.calendar.server.viewer');
const CALENDAR_TIMEZONE = calendarReadOnlyUx.BUSINESS_TIMEZONE || 'Africa/Johannesburg';

function isFeatureEnabled(env = process.env) {
  return String(env.SHILOH_CALENDAR_READONLY_UX_ENABLED || '').trim().toLowerCase() === 'true';
}

function resolveServerViewer(req) {
  const context = req?.[CALENDAR_VIEWER_CONTEXT];
  if (!context || context.authenticated !== true || context.source !== 'server_staff_session') return null;
  if (!context.viewer || typeof context.viewer !== 'object') return null;
  return context.viewer;
}

function setCalendarSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
}

function statusForError(error) {
  if (error?.code === 'CALENDAR_UX_AUTH_REQUIRED' || error?.code === 'SCHEDULING_TIMELINE_FORBIDDEN') return 403;
  if (error?.code === 'CALENDAR_UX_STAFF_FILTER_FORBIDDEN') return 403;
  if (String(error?.code || '').startsWith('CALENDAR_UX_INVALID_') || String(error?.code || '').startsWith('SCHEDULING_TIMELINE_INVALID_')) return 400;
  return 503;
}

function safeUnavailableMessage(error) {
  if (error?.code === 'CALENDAR_UX_STAFF_FILTER_FORBIDDEN') return 'That practitioner is outside your authenticated Calendar scope.';
  if (statusForError(error) === 400) return 'The requested Calendar view or filter is invalid.';
  if (statusForError(error) === 403) return 'Your authenticated Shiloh access does not permit this Calendar view.';
  return 'SchedulingTimeline is unavailable, so Shiloh Calendar is failing closed.';
}

function bookingOperationalActions(dateKey, bookingPath = '/calendar/book') {
  const href = `${bookingPath}?date=${encodeURIComponent(String(dateKey || ''))}`;
  return [{ label: 'Create booking', href, tone: 'primary' }];
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function dateKey(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CALENDAR_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: CALENDAR_TIMEZONE,
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

function eventStaffIds(item) {
  if (Array.isArray(item?.staffIds)) return item.staffIds.map(Number).filter(Number.isSafeInteger);
  if (Number.isSafeInteger(Number(item?.staffId))) return [Number(item.staffId)];
  return [];
}

function eventsForStaffOnDay(model, staffId, day) {
  return (model?.timeline?.events || [])
    .filter(item => item?.canonical !== false && item?.kind !== 'external_busy')
    .filter(item => dateKey(item.startsAt || item.date) === day)
    .filter(item => eventStaffIds(item).includes(Number(staffId)))
    .sort((a, b) => {
      const aTime = a.startsAt ? new Date(a.startsAt).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.startsAt ? new Date(b.startsAt).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime || String(a.kind || '').localeCompare(String(b.kind || ''));
    });
}

function staffWorkingContext(model, staffId, day) {
  const noon = new Date(`${day}T12:00:00+02:00`);
  const weekday = noon.getUTCDay();
  const exceptions = (model?.timeline?.scheduleExceptions || [])
    .filter(item => Number(item.staffId) === Number(staffId) && dateKey(item.date) === day);
  if (exceptions.length) {
    return exceptions.map(item => {
      const label = String(item.exceptionType || 'exception').replace(/_/g, ' ');
      const hours = item.startsLocal && item.endsLocal
        ? ` ${String(item.startsLocal).slice(0, 5)}–${String(item.endsLocal).slice(0, 5)}`
        : '';
      return `${label}${hours}`;
    }).join(' • ');
  }
  const recurringClosed = (model?.timeline?.recurringClosures || [])
    .some(item => Number(item.staffId) === Number(staffId) && Number(item.dayOfWeek) === weekday);
  if (recurringClosed) return 'Not scheduled';
  const windows = (model?.timeline?.workingWindows || [])
    .filter(item => Number(item.staffId) === Number(staffId) && Number(item.dayOfWeek) === weekday);
  if (!windows.length) return 'No working window';
  return windows
    .map(item => `${String(item.startsLocal || '').slice(0, 5)}–${String(item.endsLocal || '').slice(0, 5)}`)
    .join(' • ');
}

function mobileEventSummary(item) {
  if (!item) return { primary: 'No visible items', secondary: 'Clear in this Calendar view' };
  const time = item.startsAt ? formatTime(item.startsAt) : '';
  if (item.kind === 'appointment') {
    return {
      primary: `${time ? `${time} • ` : ''}${item.clientName || 'Client'}`,
      secondary: item.serviceName || 'Appointment',
    };
  }
  if (item.kind === 'calendar_block') {
    return {
      primary: `${time ? `${time} • ` : ''}${item.title || item.blockType || 'Blocked time'}`,
      secondary: 'Calendar block',
    };
  }
  if (item.kind === 'approved_leave' || item.kind === 'operational_leave') {
    return { primary: 'Leave', secondary: item.reason || 'Unavailable' };
  }
  return {
    primary: `${time ? `${time} • ` : ''}${String(item.kind || 'Calendar item').replace(/_/g, ' ')}`,
    secondary: 'Shiloh scheduling item',
  };
}

function staffFilterHref(basePath, model, staffId) {
  const params = new URLSearchParams({ view: 'day', date: String(model?.dateKey || '') });
  params.set('staff', String(staffId));
  return `${basePath}?${params.toString()}`;
}

function renderMobileStaffOverview(model, basePath = '/calendar/read-only') {
  if (model?.view !== 'day') return '';
  const usesImplicitDesktopFocus = model?.visibleStaffSelectionExplicit === false;
  if (!usesImplicitDesktopFocus && model?.selectedStaffId != null) return '';
  const sourceTimeline = usesImplicitDesktopFocus && model?.authorizedTimeline
    ? model.authorizedTimeline
    : model?.timeline;
  const staff = Array.isArray(sourceTimeline?.staff) ? sourceTimeline.staff : [];
  if (staff.length <= 1) return '';
  const mobileModel = { ...model, timeline: sourceTimeline };
  const day = model.period?.dateKeys?.[0] || model.dateKey;
  const cards = staff.map(person => {
    const items = eventsForStaffOnDay(mobileModel, person.id, day);
    const context = staffWorkingContext(mobileModel, person.id, day);
    const unavailable = context === 'Not scheduled' || context === 'No working window';
    const next = mobileEventSummary(items[0]);
    const countLabel = `${items.length} item${items.length === 1 ? '' : 's'}`;
    return `<a class="mobile-staff-card" data-mobile-staff-id="${escapeHtml(person.id)}" href="${escapeHtml(staffFilterHref(basePath, model, person.id))}">
      <div class="mobile-staff-card-head"><strong>${escapeHtml(person.displayName || `Staff ${person.id}`)}</strong><span class="mobile-staff-count">${escapeHtml(items.length)}</span></div>
      <div class="mobile-staff-schedule"><span class="status-dot${unavailable ? ' off' : ''}"></span><span>${escapeHtml(context)}</span></div>
      <div class="mobile-staff-next"><span class="mobile-staff-next-label">${escapeHtml(countLabel)} • next</span><strong>${escapeHtml(next.primary)}</strong><small>${escapeHtml(next.secondary)}</small></div>
    </a>`;
  }).join('');
  return `<section class="mobile-staff-overview" data-mobile-staff-overview aria-label="Staff day overview">
    <header class="mobile-staff-overview-head"><div><span class="eyebrow">Team overview</span><h3>All staff today</h3></div><span>Tap a person for the full timeline</span></header>
    <div class="mobile-staff-grid">${cards}</div>
  </section>`;
}

function mobileStaffOverviewStyles() {
  return `.mobile-staff-overview{display:none}@media(max-width:700px){body[data-calendar-mobile-overview="true"] .practitioner-control{display:none}.mobile-staff-overview{display:grid;gap:9px;margin-top:2px}.mobile-staff-overview-head{display:flex;align-items:end;justify-content:space-between;gap:10px}.mobile-staff-overview-head h3{margin:2px 0 0;font-size:1rem}.mobile-staff-overview-head>span{max-width:130px;text-align:right;color:var(--muted);font-size:.68rem;line-height:1.25}.mobile-staff-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mobile-staff-card{display:grid;align-content:start;gap:7px;min-width:0;min-height:118px;padding:11px;border:1px solid var(--line);border-radius:13px;background:#fff;box-shadow:0 3px 12px rgba(32,50,43,.04)}.mobile-staff-card:active{background:var(--leaf-soft)}.mobile-staff-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;min-width:0}.mobile-staff-card-head strong{min-width:0;font-size:.88rem;line-height:1.2;overflow-wrap:anywhere}.mobile-staff-count{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;min-width:27px;height:27px;border-radius:999px;background:var(--leaf-soft);color:var(--leaf);font-size:.72rem;font-weight:850}.mobile-staff-schedule{display:flex;align-items:flex-start;gap:6px;min-width:0;color:var(--muted);font-size:.68rem;line-height:1.3}.mobile-staff-schedule .status-dot{flex:0 0 8px;margin-top:2px}.mobile-staff-next{display:grid;gap:2px;min-width:0;padding-top:7px;border-top:1px solid var(--line)}.mobile-staff-next-label{color:var(--muted);font-size:.62rem;text-transform:uppercase;letter-spacing:.06em;font-weight:800}.mobile-staff-next strong{min-width:0;font-size:.74rem;line-height:1.28;overflow-wrap:anywhere}.mobile-staff-next small{min-width:0;color:var(--muted);font-size:.66rem;line-height:1.25;overflow-wrap:anywhere}.day-view.mobile-all-staff-overview .day-time-grid{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip-path:inset(50%)!important;visibility:hidden!important;pointer-events:none!important}.day-view:not(.mobile-all-staff-overview) .day-time-grid{overflow:hidden}.day-view:not(.mobile-all-staff-overview) .day-time-grid .lanes{grid-template-columns:minmax(0,1fr)!important;min-width:0!important;width:100%}.day-view:not(.mobile-all-staff-overview) .day-time-grid .lane{min-width:0!important;width:100%;border-right:0}}`;
}

function applyCalendarResponsivePolish(html, model = null, basePath = '/calendar/read-only') {
  let output = String(html).replace(
    '.controls{position:sticky;top:0;z-index:5;grid-template-columns:1fr 1fr;',
    '.controls{position:sticky;top:0;z-index:5;grid-template-columns:1fr;',
  );

  if (!output.includes('.mobile-staff-overview{display:none}')) {
    output = output.replace('</style>', `${mobileStaffOverviewStyles()}</style>`);
  }

  const overview = renderMobileStaffOverview(model, basePath);
  if (overview) {
    output = output
      .replace('<body data-calendar-view=', '<body data-calendar-mobile-overview="true" data-calendar-view=')
      .replace('<main class="calendar-view day-view" data-view="day">', '<main class="calendar-view day-view mobile-all-staff-overview" data-view="day">')
      .replace('<div class="time-grid day-time-grid"', `${overview}<div class="time-grid day-time-grid"`);
  }
  return output;
}

// Compatibility fallback for renderers that do not yet consume operationalActions.
// Authority is resolved server-side before this decoration is ever used.
function decorateBookingEntry(html, dateKey, bookingPath = '/calendar/book') {
  const href = `${bookingPath}?date=${encodeURIComponent(String(dateKey || ''))}`;
  return String(html)
    .replace('<div class="access-controls">', `<div class="access-controls"><a class="nav-button" href="${href}">Create booking</a>`)
    .replace('Read-only operational view. Booking, reschedule, cancellation, block, leave and schedule mutations are not available here.', 'Timeline remains read-only. Use Create booking to add an appointment. Reschedule, cancellation, drag/drop, reassignment, block, leave and schedule changes are not available here.');
}

function createCalendarReadOnlyHandler({
  env = process.env,
  buildModel = calendarReadOnlyUx.buildModel,
  renderPage = renderCalendarPage,
  renderUnavailable = renderUnavailablePage,
  resolveViewer = resolveServerViewer,
  staffAccessPath = '/calendar/staff',
  bookingPath = '/calendar/book',
  bookingService = createCalendarCreateBookingService({ db: pool, env }),
  mutationService = createCalendarOperationalMutationService({ db: pool }),
  clientAccessService = workspaceClients,
  notificationService = workspaceClientNotifications,
  clientsPath = '/calendar/clients',
  operationalMutationsScriptPath = '/calendar/operations/client.js',
} = {}) {
  return async function calendarReadOnlyHandler(req, res, next) {
    try {
      setCalendarSecurityHeaders(res);
      if (!isFeatureEnabled(env)) return res.status(404).type('text/plain').send('Not Found');

      const viewer = resolveViewer(req);
      if (!viewer) {
        if (isCalendarBridgeEnabled(env)) {
          res.setHeader('Location', `${staffAccessPath}?reason=session`);
          return res.status(302).type('text/plain').send('Staff sign-in required');
        }
        return res.status(503).type('html').send(renderUnavailable({
          code: 'CALENDAR_SECURE_ACCESS_NOT_CONFIGURED',
          message: 'Secure browser staff sign-in is not configured for this Calendar surface yet.',
        }));
      }

      const model = await buildModel({
        view: req.query?.view,
        date: req.query?.date,
        staff: req.query?.staff,
        viewer,
      });

      let bookingAllowed = false;
      try {
        await bookingService.resolveOperator(req.staffBrowserSession?.adminId);
        bookingAllowed = true;
      } catch (_bookingAuthorityError) {
        // Timeline remains safe. Booking entry fails closed while /calendar/book
        // independently revalidates current operator capability and scope.
      }

      let mutationCapability = null;
      if (req.staffBrowserSession?.adminId != null) {
        try {
          const operator = await mutationService.resolveOperator(req.staffBrowserSession.adminId);
          mutationCapability = operator.mutationCapability || null;
        } catch (_mutationAuthorityError) {
          // The timeline remains readable within its existing viewer scope. Mutation
          // controls fail closed and the operations endpoints revalidate independently.
        }
      }

      let clientNavigationAllowed = false;
      if (req.staffBrowserSession?.adminId != null) {
        try {
          clientNavigationAllowed = Boolean(await clientAccessService.resolveAccess(req.staffBrowserSession.adminId));
        } catch (_clientAuthorityError) {
          // Calendar remains available under its own authority. Clients navigation
          // fails closed unless current canonical client:lookup authority resolves.
        }
      }

      let notificationAllowed = false;
      if (req.staffBrowserSession?.adminId != null) {
        try {
          notificationAllowed = Boolean(await notificationService.resolveAccess(req.staffBrowserSession.adminId));
        } catch (_notificationAuthorityError) {
          // Exception recovery remains hidden unless current client:notify authority resolves.
        }
      }

      const renderedModel = {
        ...model,
        mutationCapability: mutationCapability ? { ...mutationCapability, enabled: true } : { enabled: false },
      };
      const basePath = req.baseUrl || '/calendar/read-only';

      let html = renderPage(renderedModel, {
        basePath,
        staffAccessPath,
        staffAccessScriptPath: `${staffAccessPath}/client.js`,
        operationalMutationsScriptPath,
        clientNavigationAllowed,
        clientsPath,
        operationalActions: [
          ...(bookingAllowed ? bookingOperationalActions(model.dateKey, bookingPath) : []),
          ...(notificationAllowed ? [{ label: 'Confirmation exceptions', href: '/calendar/operations/booking-confirmation-exceptions' }] : []),
        ],
        timelineReadOnlyMessage: mutationCapability
          ? 'Calendar operations update Shiloh canonical state only. Every save revalidates current authority, revision, schedules and conflicts; no client message is sent by these controls.'
          : bookingAllowed
            ? 'Timeline remains read-only. Use Create booking to add an appointment. Reschedule, cancellation, drag/drop, reassignment, block, leave and schedule changes are not available here.'
            : 'Read-only operational view. Booking, reschedule, cancellation, block, leave and schedule mutations are not available here.',
      });
      html = applyCalendarResponsivePolish(html, renderedModel, basePath);

      if (bookingAllowed && !String(html).includes('aria-label="Calendar actions"')) {
        html = decorateBookingEntry(html, model.dateKey, bookingPath);
      }
      return res.status(200).type('html').send(html);
    } catch (error) {
      if (res.headersSent) return next(error);
      const status = statusForError(error);
      return res.status(status).type('html').send(renderUnavailable({
        code: error?.code || 'CALENDAR_UNAVAILABLE',
        message: safeUnavailableMessage(error),
      }));
    }
  };
}

function createCalendarReadOnlyRouter(options = {}) {
  const router = express.Router();
  router.get('/', createCalendarReadOnlyHandler(options));
  return router;
}

module.exports = createCalendarReadOnlyRouter();
module.exports.CALENDAR_VIEWER_CONTEXT = CALENDAR_VIEWER_CONTEXT;
module.exports.createCalendarReadOnlyHandler = createCalendarReadOnlyHandler;
module.exports.createCalendarReadOnlyRouter = createCalendarReadOnlyRouter;
module.exports.isFeatureEnabled = isFeatureEnabled;
module.exports.resolveServerViewer = resolveServerViewer;
module.exports.setCalendarSecurityHeaders = setCalendarSecurityHeaders;
module.exports.decorateBookingEntry = decorateBookingEntry;
module.exports.bookingOperationalActions = bookingOperationalActions;
module.exports.renderMobileStaffOverview = renderMobileStaffOverview;
module.exports.mobileStaffOverviewStyles = mobileStaffOverviewStyles;
module.exports.applyCalendarResponsivePolish = applyCalendarResponsivePolish;
