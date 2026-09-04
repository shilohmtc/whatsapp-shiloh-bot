const {
  resolveServiceFamily,
  renderServiceFamilyIcon,
  serviceFamilyAccentCss,
} = require('./calendarServiceFamilyVisuals');
const {
  allowsAppointmentTarget,
  allowsStaffTarget,
} = require('../services/calendarAuthorization');
const {
  workspaceShellStyles,
  renderWorkspaceNavigation,
} = require('./workspaceShell');

const BUSINESS_TIMEZONE = 'Africa/Johannesburg';

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
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDay(value, options = {}) {
  const date = new Date(`${value}T12:00:00+02:00`);
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: BUSINESS_TIMEZONE,
    weekday: options.weekday || 'short',
    day: '2-digit',
    month: options.month || 'short',
    year: options.year || undefined,
  }).format(date);
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

function formatRange(item) {
  if (item.allDay) return 'All day';
  if (item.startsAt && item.endsAt) return `${formatTime(item.startsAt)}–${formatTime(item.endsAt)}`;
  return '';
}

function formatClientMobile(value) {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (/^27\d{9}$/.test(digits)) return `+27 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return 'Contact unavailable';
}

function eventStaffIds(item) {
  if (Array.isArray(item?.staffIds)) return item.staffIds.map(Number).filter(Number.isSafeInteger);
  if (Number.isSafeInteger(Number(item?.staffId))) return [Number(item.staffId)];
  return [];
}

function staffMap(model) {
  return new Map((model.permittedStaff || []).map(person => [Number(person.id), person.displayName || `Staff ${person.id}`]));
}

function staffNamesFor(item, model) {
  if (Array.isArray(item.staff) && item.staff.length) {
    return item.staff.map(entry => entry.nameSnapshot || staffMap(model).get(Number(entry.staffId)) || `Staff ${entry.staffId}`);
  }
  const names = staffMap(model);
  return eventStaffIds(item).map(id => names.get(id) || `Staff ${id}`);
}

function eventTitle(item) {
  switch (item.kind) {
    case 'appointment': return item.clientName || 'Client';
    case 'calendar_block': return item.title || item.blockType || 'Blocked time';
    case 'approved_leave': return 'Approved leave';
    case 'operational_leave': return 'Operational leave';
    case 'clinic_closure': return item.reason ? `Closed — ${item.reason}` : 'Clinic closed';
    default: return String(item.kind || 'Calendar item').replace(/_/g, ' ');
  }
}

function eventKindLabel(item) {
  switch (item.kind) {
    case 'appointment': return 'Appointment';
    case 'calendar_block': return 'Block';
    case 'approved_leave': return 'Leave';
    case 'operational_leave': return 'Operational leave';
    case 'clinic_closure': return 'Closure';
    default: return String(item.kind || 'Calendar item').replace(/_/g, ' ');
  }
}

function eventDetailPieces(item, model) {
  const names = staffNamesFor(item, model);
  const pieces = [];
  if (names.length) pieces.push(names.join(' + '));
  if (item.kind === 'appointment' && item.status) pieces.push(String(item.status).replace(/_/g, ' '));
  if (item.kind === 'calendar_block' && item.blockType) pieces.push(String(item.blockType).replace(/_/g, ' '));
  if ((item.kind === 'approved_leave' || item.kind === 'operational_leave') && item.reason) pieces.push(item.reason);
  return pieces.join(' • ');
}

function renderEventMeta(item, model) {
  const details = eventDetailPieces(item, model);
  if (item.kind !== 'appointment') return details ? escapeHtml(details) : '';
  const contexts = Array.isArray(item.serviceContexts) ? item.serviceContexts : [];
  const families = [];
  const seen = new Set();
  for (const context of contexts) {
    const family = resolveServiceFamily(context);
    if (!family || seen.has(family.key)) continue;
    seen.add(family.key);
    families.push(family.key);
  }
  const icons = families.map((familyKey) => renderServiceFamilyIcon(familyKey)).join('');
  const service = item.serviceName
    ? `<span class="event-service-context">${icons}<span>${escapeHtml(item.serviceName)}</span></span>`
    : '';
  const separator = service && details ? '<span class="event-detail-separator" aria-hidden="true">•</span>' : '';
  return `${service}${separator}${details ? `<span>${escapeHtml(details)}</span>` : ''}`;
}

function renderProvenance(item) {
  return `<span class="provenance canonical">${item.kind === 'appointment' ? 'Shiloh appointment' : 'Shiloh scheduling authority'}</span>`;
}

function mutationEnabled(model) {
  return model?.mutationCapability?.enabled === true
    && Array.isArray(model.mutationCapability.operations)
    && model.mutationCapability.operations.length > 0;
}

function operationEnabled(model, operation) {
  return mutationEnabled(model) && model.mutationCapability.operations.includes(operation);
}

function appointmentOperationScope(item, model) {
  const serviceIds = (item.serviceContexts || [])
    .map((service) => Number(service.serviceId || service.service_id))
    .filter((id) => Number.isSafeInteger(id) && id > 0);
  return allowsAppointmentTarget(model?.mutationCapability, {
    staffIds: eventStaffIds(item),
    serviceIds,
  });
}

function appointmentOperations(item, model) {
  if (!appointmentOperationScope(item, model)) return [];
  return ['appointment:reschedule', 'appointment:cancel', 'appointment:reassign']
    .filter((operation) => operationEnabled(model, operation));
}

function staffOperationEnabled(model, operation, staffId) {
  return operationEnabled(model, operation) && allowsStaffTarget(model.mutationCapability, staffId);
}

function mutationAttributes(item, model) {
  if (!mutationEnabled(model)) return '';
  const revision = escapeHtml(item.revision || '');
  if (item.kind === 'appointment') {
    const operations = appointmentOperations(item, model);
    if (!operations.length) return '';
    const draggable = operations.includes('appointment:reschedule') ? ' draggable="true"' : '';
    return ` data-appointment-id="${escapeHtml(item.id)}" data-revision="${revision}" data-staff-ids="${escapeHtml(eventStaffIds(item).join(','))}" data-starts-at="${escapeHtml(item.startsAt || '')}" data-ends-at="${escapeHtml(item.endsAt || '')}" data-client-name="${escapeHtml(item.clientName || 'Client')}" data-service-name="${escapeHtml(item.serviceName || '')}" data-allowed-operations="${escapeHtml(operations.join(','))}"${draggable}`;
  }
  if (item.kind === 'calendar_block' && staffOperationEnabled(model, 'calendar_block:manage', eventStaffIds(item)[0])) {
    return ` data-block-id="${escapeHtml(item.id)}" data-revision="${revision}" data-staff-ids="${escapeHtml(eventStaffIds(item)[0] || '')}" data-location-id="${escapeHtml(item.locationId || '')}" data-starts-at="${escapeHtml(item.startsAt || '')}" data-ends-at="${escapeHtml(item.endsAt || '')}" data-block-type="${escapeHtml(item.blockType || 'other')}" data-title="${escapeHtml(item.title || 'Operational block')}"`;
  }
  if (item.kind === 'operational_leave' && staffOperationEnabled(model, 'operational_leave:manage', eventStaffIds(item)[0])) {
    return ` data-leave-id="${escapeHtml(item.id)}" data-revision="${revision}" data-staff-ids="${escapeHtml(eventStaffIds(item)[0] || '')}" data-location-id="${escapeHtml(item.locationId || '')}" data-date="${escapeHtml(dateKey(item.date || item.startsAt) || '')}" data-reason="${escapeHtml(item.reason || 'Operational leave')}"`;
  }
  return '';
}

function renderMutationButton(item, model) {
  if (!mutationEnabled(model)) return '';
  const action = item.kind === 'appointment' && appointmentOperations(item, model).length
    ? 'manage-appointment'
    : item.kind === 'calendar_block' && staffOperationEnabled(model, 'calendar_block:manage', eventStaffIds(item)[0])
      ? 'manage-block'
      : item.kind === 'operational_leave' && staffOperationEnabled(model, 'operational_leave:manage', eventStaffIds(item)[0])
        ? 'manage-leave'
        : null;
  if (!action) return '';
  return `<button class="event-operation" type="button" data-calendar-operation="${action}">Manage</button>`;
}

function renderEventCard(item, model) {
  const shared = item.kind === 'appointment' && eventStaffIds(item).length > 1;
  const id = `${item.kind || 'event'}-${item.id || 'unknown'}`;
  const meta = renderEventMeta(item, model);
  return `<article class="event-card event-canonical ${shared ? 'event-shared' : ''}" data-event-id="${escapeHtml(id)}" data-kind="${escapeHtml(item.kind || '')}" data-canonical="true"${mutationAttributes(item, model)}>
    <div class="event-card-top"><div class="event-time">${escapeHtml(formatRange(item))}</div><span class="kind-pill">${escapeHtml(eventKindLabel(item))}</span></div>
    <h4>${escapeHtml(eventTitle(item))}</h4>
    ${item.kind === 'appointment' ? `<p class="event-client-mobile">${escapeHtml(formatClientMobile(item.clientMobile))}</p>` : ''}
    ${meta ? `<p class="event-meta">${meta}</p>` : ''}
    ${item.kind === 'appointment' ? `<div class="appointment-reference">Appointment #${escapeHtml(item.id)}</div>` : ''}
    <div class="event-card-actions">${renderProvenance(item)}${renderMutationButton(item, model)}</div>
  </article>`;
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    const aKey = a.startsAt ? new Date(a.startsAt).getTime() : new Date(`${a.date || '9999-12-31'}T00:00:00+02:00`).getTime();
    const bKey = b.startsAt ? new Date(b.startsAt).getTime() : new Date(`${b.date || '9999-12-31'}T00:00:00+02:00`).getTime();
    return aKey - bKey || String(a.kind).localeCompare(String(b.kind));
  });
}

function eventsForDate(model, day) {
  return sortEvents((model.timeline.events || []).filter(item => item.canonical !== false && item.kind !== 'external_busy' && dateKey(item.startsAt || item.date) === day));
}

function workingContext(model, staffId, day) {
  const noon = new Date(`${day}T12:00:00+02:00`);
  const weekday = noon.getUTCDay();
  const exceptions = (model.timeline.scheduleExceptions || []).filter(item => Number(item.staffId) === Number(staffId) && dateKey(item.date) === day);
  if (exceptions.length) {
    return exceptions.map(item => {
      const label = String(item.exceptionType || 'exception').replace(/_/g, ' ');
      const hours = item.startsLocal && item.endsLocal ? ` ${String(item.startsLocal).slice(0, 5)}–${String(item.endsLocal).slice(0, 5)}` : '';
      return `${label}${hours}`;
    }).join(' • ');
  }
  const recurringClosed = (model.timeline.recurringClosures || []).some(item => Number(item.staffId) === Number(staffId) && Number(item.dayOfWeek) === weekday);
  if (recurringClosed) return 'Not scheduled';
  const windows = (model.timeline.workingWindows || []).filter(item => Number(item.staffId) === Number(staffId) && Number(item.dayOfWeek) === weekday);
  if (!windows.length) return 'No working window';
  return windows.map(item => `${String(item.startsLocal || '').slice(0, 5)}–${String(item.endsLocal || '').slice(0, 5)}`).join(' • ');
}

function visibleStaffIdsForModel(model) {
  if (Array.isArray(model?.visibleStaffIds)) return model.visibleStaffIds.map(Number).filter(Number.isSafeInteger);
  if (model?.selectedStaffId != null) return [Number(model.selectedStaffId)].filter(Number.isSafeInteger);
  return (model?.timeline?.staff || []).map(person => Number(person.id)).filter(Number.isSafeInteger);
}

function queryHref(basePath, view, date, staffIds) {
  const params = new URLSearchParams({ view, date });
  for (const staffId of staffIds || []) params.append('staff', String(staffId));
  return `${basePath}?${params.toString()}`;
}

function renderControls(model, basePath) {
  const today = dateKey(new Date());
  const permittedStaff = model.permittedStaff || [];
  const visibleStaffIds = visibleStaffIdsForModel(model);
  const visible = new Set(visibleStaffIds);
  const canSwitchPractitioner = permittedStaff.length > 1;
  const filterContent = canSwitchPractitioner
    ? `<details class="people-picker" data-people-picker><summary><span>People</span><strong>${visibleStaffIds.length}</strong></summary><form class="people-form" method="get" action="${escapeHtml(basePath)}" data-practitioner-visibility-form><input type="hidden" name="view" value="${escapeHtml(model.view)}"><input type="hidden" name="date" value="${escapeHtml(model.dateKey)}"><fieldset><legend class="sr-only">Visible practitioners</legend>${permittedStaff.map(person => `<label><input type="checkbox" name="staff" value="${escapeHtml(person.id)}"${visible.has(Number(person.id)) ? ' checked' : ''}><span>${escapeHtml(person.displayName)}</span></label>`).join('')}</fieldset><div class="people-actions"><button type="submit">Apply</button><a href="${escapeHtml(queryHref(basePath, model.view, model.dateKey, permittedStaff.map(person => person.id)))}">Show all</a></div><p data-people-selection-status>${visibleStaffIds.length} of ${permittedStaff.length} visible</p></form></details>`
    : `<span class="scope-pill">${escapeHtml(permittedStaff[0]?.displayName || 'Permitted practitioner')} • your permitted timeline</span>`;
  const viewLinks = ['day', 'week', 'agenda'].map(view => `<a class="view-tab ${model.view === view ? 'active' : ''}" ${model.view === view ? 'aria-current="page"' : ''} href="${escapeHtml(queryHref(basePath, view, model.dateKey, visibleStaffIds))}">${view[0].toUpperCase()}${view.slice(1)}</a>`).join('');
  return `<section class="controls" aria-label="Calendar controls">
    <div class="control-group"><span class="control-label">Date</span><div class="period-nav">
      <a class="nav-button" href="${escapeHtml(queryHref(basePath, model.view, model.period.previousAnchor, visibleStaffIds))}" aria-label="Previous period"><span aria-hidden="true">←</span><span class="nav-word">Previous</span></a>
      <a class="nav-button today" href="${escapeHtml(queryHref(basePath, model.view, today, visibleStaffIds))}">Today</a>
      <a class="nav-button" href="${escapeHtml(queryHref(basePath, model.view, model.period.nextAnchor, visibleStaffIds))}" aria-label="Next period"><span class="nav-word">Next</span><span aria-hidden="true">→</span></a>
    </div></div>
    <div class="control-group"><span class="control-label">View</span><nav class="view-tabs" aria-label="Calendar view">${viewLinks}</nav></div>
    <div class="control-group practitioner-control"><span class="control-label">Practitioners</span><div class="filters" style="overflow:visible" aria-label="Practitioner visibility">${filterContent}</div></div>
  </section>`;
}

function countFor(model, key) {
  return Array.isArray(model.timeline?.[key]) ? model.timeline[key].length : 0;
}

function renderOperationalSummary(model) {
  const unavailable = countFor(model, 'blocks') + countFor(model, 'leave');
  const items = [
    ['Appointments', countFor(model, 'appointments')],
    ['Blocks + leave', unavailable],
    ['Closures', countFor(model, 'closures')],
  ];
  return `<section class="scan-summary" aria-label="Visible period summary">
    <div class="summary-context"><span class="eyebrow">At a glance</span><strong>${model.timeline?.staff?.length || 0} practitioner${model.timeline?.staff?.length === 1 ? '' : 's'} in view</strong></div>
    <div class="summary-metrics">${items.map(([label, value]) => `<div class="summary-metric"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`).join('')}</div>
    <div class="provenance-key" aria-label="Scheduling authority"><span class="key-dot canonical"></span>Shiloh scheduling truth</div>
  </section>`;
}

function renderClosureStrip(model, day) {
  const closures = (model.timeline.closures || []).filter(item => dateKey(item.date) === day);
  if (!closures.length) return '';
  return `<div class="closure-strip">${closures.map(item => `<span>Closed • ${escapeHtml(item.reason || 'Clinic closure')}</span>`).join('')}</div>`;
}

const GRID_START_MINUTES = 7 * 60;
const GRID_END_MINUTES = 20 * 60;
const GRID_PIXELS_PER_HOUR = 72;

function localMinutes(value) {
  const time = formatTime(value);
  const [hour, minute] = time.split(':').map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? (hour * 60) + minute : GRID_START_MINUTES;
}

function renderTimeRail() {
  const ticks = [];
  for (let minute = GRID_START_MINUTES; minute <= GRID_END_MINUTES; minute += 60) {
    ticks.push(`<span style="--grid-top:${((minute - GRID_START_MINUTES) / 60) * GRID_PIXELS_PER_HOUR}px">${String(Math.floor(minute / 60)).padStart(2, '0')}:00</span>`);
  }
  return `<div class="time-rail" aria-hidden="true">${ticks.join('')}</div>`;
}

function renderPositionedEvent(item, model) {
  if (item.allDay || !item.startsAt || !item.endsAt) return renderEventCard(item, model);
  const start = Math.max(GRID_START_MINUTES, localMinutes(item.startsAt));
  const end = Math.min(GRID_END_MINUTES, Math.max(start + 15, localMinutes(item.endsAt)));
  const top = ((start - GRID_START_MINUTES) / 60) * GRID_PIXELS_PER_HOUR;
  const height = Math.max(34, ((end - start) / 60) * GRID_PIXELS_PER_HOUR - 3);
  return `<div class="positioned-event" style="--event-top:${top}px;--event-height:${height}px">${renderEventCard(item, model)}</div>`;
}

function renderDay(model) {
  const day = model.period.dateKeys[0];
  const sharedAppointments = (model.timeline.appointments || []).filter(item => dateKey(item.startsAt) === day && eventStaffIds(item).length > 1);
  const staff = model.timeline.staff || [];
  const visibleStaffIds = staff.map(person => Number(person.id));
  const lanes = staff.map((person, index) => {
    const items = eventsForDate(model, day).filter(item => {
      if (item.kind === 'clinic_closure') return false;
      if (item.kind === 'appointment' && eventStaffIds(item).length > 1) {
        const firstVisibleAssignedStaffId = visibleStaffIds.find(staffId => eventStaffIds(item).includes(staffId));
        return Number(person.id) === firstVisibleAssignedStaffId;
      }
      return eventStaffIds(item).includes(Number(person.id));
    });
    const context = workingContext(model, person.id, day);
    const unavailable = context === 'Not scheduled' || context === 'No working window';
    const laneOperations = [
      staffOperationEnabled(model, 'calendar_block:manage', person.id) ? `<button type="button" data-calendar-operation="add-block" data-staff-id="${escapeHtml(person.id)}" data-date="${escapeHtml(day)}">Add block</button>` : '',
      staffOperationEnabled(model, 'operational_leave:manage', person.id) ? `<button type="button" data-calendar-operation="add-leave" data-staff-id="${escapeHtml(person.id)}" data-date="${escapeHtml(day)}">Add leave</button>` : '',
      person.schedulingType !== 'regular' && staffOperationEnabled(model, 'working_schedule:manage', person.id) ? `<button type="button" data-calendar-operation="manage-schedule" data-staff-id="${escapeHtml(person.id)}" data-date="${escapeHtml(day)}">Schedule</button>` : '',
    ].filter(Boolean).join('');
    const mutationActions = laneOperations ? `<div class="lane-actions">${laneOperations}</div>` : '';
    return `<section class="lane" style="overflow:visible" data-staff-id="${escapeHtml(person.id)}" data-lane-index="${index}" data-date="${escapeHtml(day)}" ${operationEnabled(model, 'appointment:reschedule') ? 'data-calendar-drop-target="true"' : ''}>
      <header><div><h3>${escapeHtml(person.displayName)}</h3><p><span class="status-dot ${unavailable ? 'off' : ''}"></span>${escapeHtml(context)}</p></div><div class="lane-heading-actions"><span class="lane-count">${items.length} item${items.length === 1 ? '' : 's'}</span>${mutationActions}</div></header>
      <div class="time-column">${items.map(item => renderPositionedEvent(item, model)).join('')}</div>
    </section>`;
  }).join('');

  return `<main class="calendar-view day-view" data-view="day">
    <div class="view-heading"><div><span class="eyebrow">Day</span><h2>${escapeHtml(formatDay(day, { weekday: 'long', month: 'long', year: 'numeric' }))}</h2></div><span class="read-only-badge">${mutationEnabled(model) ? 'Canonical operations' : 'Read-only'}</span></div>
    ${renderClosureStrip(model, day)}
    ${sharedAppointments.length ? '<div class="shared-note">Shared appointments appear once as one canonical booking and retain all assigned practitioners.</div>' : ''}
    <div class="time-grid day-time-grid" data-visible-lane-count="${staff.length}">${renderTimeRail()}<div class="lanes" style="--lane-count:${Math.max(staff.length, 1)}">${lanes || '<div class="empty large">No permitted practitioner lanes</div>'}</div></div>
  </main>`;
}

function renderWeek(model) {
  const days = model.period.dateKeys.map(day => {
    const items = eventsForDate(model, day);
    return `<section class="week-day" data-date="${escapeHtml(day)}" ${operationEnabled(model, 'appointment:reschedule') ? 'data-calendar-drop-target="true"' : ''}>
      <header><span>${escapeHtml(formatDay(day))}</span><small>${items.length} item${items.length === 1 ? '' : 's'}</small></header>
      ${renderClosureStrip(model, day)}
      <div class="time-column">${items.map(item => renderPositionedEvent(item, model)).join('')}</div>
    </section>`;
  }).join('');
  return `<main class="calendar-view week-view" data-view="week">
    <div class="view-heading"><div><span class="eyebrow">Week</span><h2>${escapeHtml(formatDay(model.period.startKey, { weekday: 'short', month: 'long' }))} – ${escapeHtml(formatDay(model.period.dateKeys.at(-1), { weekday: 'short', month: 'long', year: 'numeric' }))}</h2></div><span class="read-only-badge">${mutationEnabled(model) ? 'Canonical operations' : 'Read-only'}</span></div>
    <div class="time-grid week-time-grid">${renderTimeRail()}<div class="week-grid">${days}</div></div>
  </main>`;
}

function renderAgenda(model) {
  const sections = model.period.dateKeys.map(day => {
    const items = eventsForDate(model, day);
    if (!items.length) return '';
    return `<section class="agenda-day"><header><h3>${escapeHtml(formatDay(day, { weekday: 'long', month: 'long' }))}</h3></header>${items.map(item => renderEventCard(item, model)).join('')}</section>`;
  }).filter(Boolean).join('');
  return `<main class="calendar-view agenda-view" data-view="agenda">
    <div class="view-heading"><div><span class="eyebrow">Agenda</span><h2>Next 7 days from ${escapeHtml(formatDay(model.dateKey, { weekday: 'long', month: 'long' }))}</h2></div><span class="read-only-badge">${mutationEnabled(model) ? 'Canonical operations' : 'Read-only'}</span></div>
    ${sections || '<div class="empty large">No scheduled items in this period</div>'}
  </main>`;
}

function renderOperationalActions(actions = []) {
  if (!Array.isArray(actions) || !actions.length) return '';
  return `<nav class="operational-actions" aria-label="Calendar actions">${actions.map(action => {
    const tone = action?.tone === 'primary' ? ' primary' : '';
    return `<a class="action-link${tone}" href="${escapeHtml(action?.href || '#')}">${escapeHtml(action?.label || 'Action')}</a>`;
  }).join('')}</nav>`;
}

function styles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#66776f;--paper:#f4f3ed;--panel:#fffdf9;--line:#dce3dd;--line-strong:#c9d4cc;--leaf:#3f6653;--leaf-deep:#294c3c;--leaf-soft:#e7eee9;--clay:#8b6f5f;--danger-soft:#f5ebe6;--shadow:0 8px 28px rgba(32,50,43,.07)}*{box-sizing:border-box}.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:1500px;margin:0 auto;padding:22px}.topbar{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:14px}.topbar-side{display:grid;gap:8px;justify-items:end}.brand h1{font-size:1.55rem;line-height:1.15;margin:0}.brand p{margin:5px 0 0;color:var(--muted);font-size:.9rem}.truth-note{font-size:.78rem;color:var(--muted);text-align:right}.access-controls,.operational-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.action-link,.signout-button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:999px;min-height:38px;padding:7px 12px;background:#fff;color:var(--ink);font:inherit;font-size:.78rem;font-weight:750}.action-link.primary{background:var(--leaf-deep);border-color:var(--leaf-deep);color:#fff}.action-link:hover,.signout-button:hover{border-color:var(--leaf)}.signout-button{cursor:pointer}.signout-button:disabled{opacity:.55;cursor:not-allowed}.access-status{font-size:.74rem;color:var(--muted);min-height:1em}.controls{display:grid;grid-template-columns:auto auto minmax(260px,1fr);gap:14px;align-items:end;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:11px 13px;margin-bottom:10px;box-shadow:0 4px 18px rgba(32,50,43,.04)}a{text-decoration:none;color:inherit}.control-group{display:grid;gap:5px;min-width:0}.control-label{font-size:.67rem;text-transform:uppercase;letter-spacing:.1em;font-weight:800;color:var(--muted);padding-left:3px}.period-nav,.view-tabs,.filters{display:flex;gap:6px;align-items:center}.filters{overflow:auto;justify-content:flex-end;scrollbar-width:thin}.nav-button,.view-tab,.filter,.scope-pill{display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;border:1px solid var(--line);border-radius:999px;min-height:38px;padding:7px 11px;font-size:.84rem;background:#fff;font-weight:700}.scope-pill{color:var(--muted);background:var(--leaf-soft)}.view-tab.active,.filter.active{background:var(--leaf);color:#fff;border-color:var(--leaf)}.nav-button:hover,.view-tab:hover,.filter:hover{border-color:var(--leaf)}.scan-summary{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;background:#eef2ee;border:1px solid var(--line);border-radius:14px;padding:10px 13px;margin-bottom:10px}.summary-context{display:grid;gap:2px;min-width:150px}.summary-context strong{font-size:.85rem}.summary-metrics{display:grid;grid-template-columns:repeat(3,minmax(92px,1fr));gap:6px}.summary-metric{display:flex;gap:7px;align-items:baseline;border-left:1px solid var(--line-strong);padding-left:10px}.summary-metric strong{font-size:1.05rem}.summary-metric span{font-size:.72rem;color:var(--muted)}.provenance-key{display:flex;align-items:center;gap:6px;white-space:nowrap;font-size:.72rem;color:var(--muted)}.key-dot,.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--leaf)}.calendar-view{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:15px;box-shadow:var(--shadow)}.view-heading{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:12px}.view-heading h2{margin:2px 0 0;font-size:1.25rem;line-height:1.2}.eyebrow{font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);font-weight:800}.read-only-badge{background:var(--leaf-soft);color:var(--leaf);border-radius:999px;padding:6px 10px;font-size:.76rem;font-weight:750}.closure-strip{display:flex;gap:8px;flex-wrap:wrap;background:var(--danger-soft);border:1px solid #ead6cc;border-radius:10px;padding:8px 10px;margin:0 0 10px;font-size:.82rem;font-weight:700}.shared-band{border:1px dashed var(--leaf);background:var(--leaf-soft);border-radius:14px;padding:10px;margin-bottom:10px}.section-label{font-size:.72rem;color:var(--leaf);font-weight:800;margin-bottom:7px;text-transform:uppercase;letter-spacing:.08em}.lanes{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:9px}.lane{border:1px solid var(--line);border-radius:14px;min-width:0;background:#fff;overflow:hidden}.lane>header{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;padding:10px 11px;border-bottom:1px solid var(--line);background:#fafbf8}.lane h3{margin:0;font-size:.98rem}.lane header p{display:flex;align-items:center;gap:5px;margin:3px 0 0;color:var(--muted);font-size:.76rem}.status-dot.off{background:#b79886}.lane-count{font-size:.68rem;color:var(--muted);white-space:nowrap}.lane-events,.week-events{padding:8px;display:grid;gap:7px}.event-card{border:1px solid var(--line);border-left:4px solid var(--leaf);border-radius:10px;padding:8px 9px;background:#fff;min-width:0}.event-card.event-shared{border-left-color:var(--clay)}.event-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.event-time{font-size:.75rem;color:var(--muted);font-weight:750}.kind-pill{font-size:.63rem;text-transform:uppercase;letter-spacing:.055em;font-weight:800;color:var(--muted)}.event-card h4{margin:2px 0 3px;font-size:.88rem;line-height:1.25}.event-card p{margin:0 0 5px;color:var(--muted);font-size:.76rem;line-height:1.35}.event-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap}.event-service-context{display:inline-flex;align-items:center;gap:5px;min-width:0}.service-family-icon{width:16px;height:16px;flex:0 0 16px}.event-detail-separator{color:var(--line-strong)}.appointment-reference{color:var(--muted);font-size:.68rem;margin:0 0 5px}.provenance{display:inline-block;font-size:.65rem;border-radius:999px;padding:3px 6px}.provenance.canonical{background:var(--leaf-soft);color:var(--leaf)}.week-grid{display:grid;grid-template-columns:repeat(7,minmax(168px,1fr));gap:7px;overflow:auto;padding-bottom:4px;scroll-snap-type:x proximity}.week-day{border:1px solid var(--line);border-radius:12px;min-width:168px;background:#fff;overflow:hidden;scroll-snap-align:start}.week-day>header{position:sticky;top:0;z-index:1;display:flex;justify-content:space-between;gap:6px;padding:8px 9px;border-bottom:1px solid var(--line);font-size:.8rem;font-weight:800;background:#fafbf8}.week-day>header small{font-size:.65rem;color:var(--muted);font-weight:650}.agenda-view{max-width:920px;margin:0 auto}.agenda-day{margin:0 0 16px}.agenda-day>header{position:sticky;top:0;background:var(--panel);padding:6px 0;z-index:2;border-bottom:1px solid var(--line)}.agenda-day h3{font-size:.9rem;margin:0;color:var(--muted)}.agenda-day .event-card{margin-top:7px}.empty{color:var(--muted);font-size:.8rem;padding:13px;text-align:center}.empty.large{padding:40px}.footer-note{margin-top:14px;color:var(--muted);font-size:.74rem;text-align:center;line-height:1.45}@media(max-width:1050px){.controls{grid-template-columns:auto auto}.practitioner-control{grid-column:1/-1}.filters{justify-content:flex-start}.scan-summary{grid-template-columns:1fr auto}.summary-context{display:none}.summary-metrics{grid-template-columns:repeat(3,minmax(80px,1fr))}}@media(max-width:700px){.shell{padding:10px 10px 28px}.topbar{align-items:start;flex-direction:column;margin-bottom:10px}.topbar-side{justify-items:start;width:100%}.truth-note{text-align:left}.access-controls,.operational-actions{justify-content:flex-start;width:100%}.action-link,.signout-button{min-height:44px}.operational-actions{display:grid;grid-template-columns:1fr}.action-link{width:100%}.controls{position:sticky;top:0;z-index:5;grid-template-columns:1fr 1fr;gap:9px;padding:9px}.practitioner-control{grid-column:1/-1}.control-label{font-size:.62rem}.nav-button,.view-tab,.filter,.scope-pill{min-height:44px;padding:8px 12px}.nav-word{display:none}.period-nav,.view-tabs{display:grid;grid-template-columns:repeat(3,1fr)}.scan-summary{grid-template-columns:1fr;margin-bottom:8px;padding:9px;overflow:auto}.summary-metrics{grid-template-columns:repeat(3,minmax(105px,1fr));min-width:350px}.provenance-key{display:none}.calendar-view{border-radius:14px;padding:12px}.view-heading{align-items:flex-start}.view-heading h2{font-size:1.08rem}.read-only-badge{font-size:.7rem}.lanes{grid-template-columns:1fr}.event-card{padding:10px;min-height:44px}.week-grid{grid-template-columns:repeat(7,minmax(82vw,1fr));margin:0 -2px}.week-day{min-width:82vw}.agenda-day>header{top:99px}.footer-note{text-align:left}}`;
}

function operationalStyles() {
  return `.event-card-actions{display:flex;align-items:center;justify-content:space-between;gap:8px}.event-operation,.lane-actions button{border:1px solid var(--line-strong);background:#fff;color:var(--leaf-deep);border-radius:999px;min-height:32px;padding:5px 9px;font:inherit;font-size:.68rem;font-weight:800;cursor:pointer}.event-operation:hover,.lane-actions button:hover{border-color:var(--leaf);background:var(--leaf-soft)}.lane-heading-actions{display:grid;justify-items:end;gap:7px}.lane-actions{display:flex;justify-content:flex-end;gap:5px;flex-wrap:wrap}.lane[data-calendar-drop-target="true"],.week-day[data-calendar-drop-target="true"]{outline:2px solid transparent;outline-offset:-2px}.event-card[draggable="true"]{cursor:grab}.event-card[draggable="true"]:active{cursor:grabbing}.operation-status{display:block;min-height:1.2em;margin:5px 0 10px;color:var(--muted);font-size:.78rem}.operation-status[data-tone="working"]{color:var(--leaf-deep);font-weight:750}.operation-status[data-tone="error"]{color:#8a3128;font-weight:750}@media(max-width:700px){.event-operation,.lane-actions button{min-height:44px;padding:8px 11px}.lane-heading-actions{justify-items:stretch}.lane-actions{display:grid;grid-template-columns:repeat(3,1fr)}.lane-actions button{padding:5px;font-size:.63rem}.event-card-actions{margin-top:7px}}`;
}

function workspaceV1Styles() {
  return `.time-grid{display:grid;grid-template-columns:58px minmax(0,1fr);overflow:auto;border:1px solid var(--line);border-radius:13px;background:#fff}.time-rail{position:relative;height:${((GRID_END_MINUTES - GRID_START_MINUTES) / 60) * GRID_PIXELS_PER_HOUR}px;border-right:1px solid var(--line);background:#fafbf8}.time-rail span{position:absolute;top:var(--grid-top);right:8px;transform:translateY(-50%);font-size:.66rem;color:var(--muted)}.time-column{position:relative;height:${((GRID_END_MINUTES - GRID_START_MINUTES) / 60) * GRID_PIXELS_PER_HOUR}px;background:repeating-linear-gradient(to bottom,transparent 0,transparent ${GRID_PIXELS_PER_HOUR - 1}px,var(--line) ${GRID_PIXELS_PER_HOUR - 1}px,var(--line) ${GRID_PIXELS_PER_HOUR}px)}.positioned-event{position:absolute;z-index:2;top:var(--event-top);height:var(--event-height);left:4px;right:4px;min-height:44px}.positioned-event .event-card{position:relative;height:100%;overflow:hidden;padding:6px 7px;box-shadow:0 2px 7px rgba(32,50,43,.08)}.positioned-event .appointment-reference,.positioned-event .provenance{display:none}.positioned-event .event-card-actions{position:absolute;right:3px;bottom:3px}.positioned-event .event-operation{min-width:44px;min-height:44px;background:rgba(255,255,255,.94)}.positioned-event .event-card h4{font-size:.78rem;padding-right:48px}.positioned-event .event-card p{font-size:.68rem;padding-right:48px}.day-time-grid .lanes{display:grid;grid-template-columns:repeat(var(--lane-count),minmax(210px,1fr));gap:0;min-width:max-content}.day-time-grid .lane{border:0;border-right:1px solid var(--line);border-radius:0;min-width:230px}.day-time-grid .lane>header{height:73px;position:sticky;top:0;z-index:4}.day-time-grid .time-rail{margin-top:73px}.week-grid{display:grid;grid-template-columns:repeat(7,minmax(154px,1fr));gap:0;overflow:visible;padding:0;min-width:1078px}.week-day{border:0;border-right:1px solid var(--line);border-radius:0;min-width:154px}.week-day>header{height:45px}.week-time-grid .time-rail{margin-top:45px}.week-events{padding:0}.shared-note{margin:-3px 0 10px;color:var(--muted);font-size:.73rem}.management-panel{border:0;padding:0;background:transparent;max-width:none;max-height:none;width:100%;height:100%;margin:0}.management-panel::backdrop{background:rgba(13,31,24,.42)}.management-card{position:absolute;right:0;top:0;height:100%;width:min(430px,100%);overflow:auto;background:var(--panel);padding:22px;box-shadow:-12px 0 40px rgba(20,45,35,.2)}.panel-head{display:flex;justify-content:space-between;gap:12px;align-items:start;border-bottom:1px solid var(--line);padding-bottom:14px}.panel-head h2{margin:3px 0;font-size:1.25rem}.panel-close{border:1px solid var(--line);background:#fff;border-radius:999px;width:44px;height:44px;font-size:1.15rem}.panel-summary{margin:16px 0;padding:12px;border-radius:12px;background:var(--leaf-soft);display:grid;gap:4px}.panel-actions{display:grid;gap:14px}.panel-action{display:none;border-top:1px solid var(--line);padding-top:14px}.panel-action.visible{display:grid;gap:9px}.panel-action label{display:grid;gap:5px;font-size:.76rem;font-weight:750}.panel-action input,.panel-action select,.panel-action textarea{width:100%;min-height:44px;border:1px solid var(--line-strong);border-radius:9px;padding:9px;font:inherit;background:#fff}.panel-action button{min-height:44px;border:0;border-radius:9px;padding:10px 13px;background:var(--leaf-deep);color:#fff;font:inherit;font-weight:800}.panel-action.danger button{background:#843f35}.panel-hint{font-size:.72rem;color:var(--muted)}@media(max-width:900px){.shell{padding-top:12px}}@media(max-width:700px){.time-grid{margin-left:-6px;margin-right:-6px;grid-template-columns:48px minmax(0,1fr)}.day-time-grid .lanes{grid-template-columns:repeat(var(--lane-count),minmax(78vw,1fr))}.day-time-grid .lane{min-width:78vw}.week-grid{grid-template-columns:repeat(7,minmax(78vw,1fr));min-width:max-content}.week-day{min-width:78vw}.positioned-event .event-card{min-height:44px}.management-card{padding:16px}}`;
}

function desktopSpatialLaneStyles() {
  return `.people-picker{position:relative;margin-left:auto}.people-picker>summary{list-style:none;display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:.82rem;font-weight:800;cursor:pointer}.people-picker>summary::-webkit-details-marker{display:none}.people-picker>summary strong{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:var(--leaf-soft);color:var(--leaf);font-size:.7rem}.people-picker[open]>summary{border-color:var(--leaf);box-shadow:0 0 0 2px var(--leaf-soft)}.people-form{position:absolute;right:0;top:calc(100% + 7px);z-index:12;display:grid;gap:8px;width:min(260px,calc(100vw - 28px));padding:9px;border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:0 16px 34px rgba(32,50,43,.18)}.people-form fieldset{display:grid;gap:2px;max-height:260px;overflow:auto;margin:0;padding:0;border:0}.people-form label{display:flex;align-items:center;gap:9px;min-height:39px;padding:7px 8px;border-radius:8px;font-size:.78rem;font-weight:720;cursor:pointer}.people-form label:hover{background:var(--leaf-soft)}.people-form input[type="checkbox"]{width:17px;height:17px;accent-color:var(--leaf)}.people-actions{display:flex;align-items:center;gap:6px;padding-top:4px;border-top:1px solid var(--line)}.people-actions button,.people-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--ink);font:inherit;font-size:.72rem;font-weight:800;cursor:pointer}.people-actions button{background:var(--leaf-deep);border-color:var(--leaf-deep);color:#fff}.people-form p{margin:0;color:var(--muted);font-size:.68rem}@media(min-width:701px){.workspace-main .shell{max-width:none}.day-time-grid{max-height:max(520px,calc(100vh - 330px));overscroll-behavior:contain;scrollbar-gutter:stable}.day-time-grid .lanes{grid-template-columns:repeat(var(--lane-count),minmax(300px,1fr));min-width:max-content;width:100%}.day-time-grid .lane{min-width:300px}.day-time-grid .lane>header{position:sticky;top:0;z-index:4;box-shadow:0 1px 0 var(--line)}}@media(max-width:700px){.people-picker{margin-left:0}.people-form{position:static;width:100%;margin-top:7px;box-shadow:none}.people-picker>summary{min-height:44px}.people-form label{min-height:44px}}`;
}

function renderManagementPanel(model) {
  if (!mutationEnabled(model)) return '';
  const options = (model.permittedStaff || []).map(person => `<option value="${escapeHtml(person.id)}">${escapeHtml(person.displayName)}</option>`).join('');
  return `<dialog class="management-panel" data-calendar-management-panel aria-labelledby="management-title"><section class="management-card"><header class="panel-head"><div><span class="eyebrow">Appointment</span><h2 id="management-title" data-panel-title>Manage appointment</h2><span class="panel-hint">Every change is revalidated by canonical Calendar authority.</span></div><button class="panel-close" type="button" data-panel-close aria-label="Close">×</button></header><div class="panel-summary"><strong data-panel-client></strong><span data-panel-service></span><span data-panel-time></span></div><div class="panel-actions"><form class="panel-action" data-panel-action="appointment:reschedule"><label>Date<input name="date" type="date" required></label><label>Start time<input name="time" type="time" required></label><button type="submit">Save new time</button></form><form class="panel-action" data-panel-action="appointment:reassign"><label>Practitioner<select name="destinationStaffId" required>${options}</select></label><button type="submit">Reassign</button></form><form class="panel-action danger" data-panel-action="appointment:cancel"><label><input name="confirmed" type="checkbox" required> I confirm this exact appointment should be cancelled.</label><button type="submit">Cancel appointment</button></form></div></section></dialog>`;
}

function renderCalendarPage(model, {
  basePath = '/calendar/read-only',
  staffAccessScriptPath = '/calendar/staff/client.js',
  operationalMutationsScriptPath = '/calendar/operations/client.js',
  operationalActions = [],
  clientNavigationAllowed = false,
  clientsPath = '/calendar/clients',
  timelineReadOnlyMessage = 'Read-only operational view. Booking, reschedule, cancellation, block, leave and schedule mutations are not available here.',
} = {}) {
  const content = model.view === 'week' ? renderWeek(model) : model.view === 'agenda' ? renderAgenda(model) : renderDay(model);
  const canMutate = mutationEnabled(model);
  const operationScript = canMutate ? `<script src="${escapeHtml(operationalMutationsScriptPath)}" defer></script>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Calendar — Shiloh Workspace</title><style>${serviceFamilyAccentCss()}${styles()}${workspaceShellStyles()}${workspaceV1Styles()}${desktopSpatialLaneStyles()}${canMutate ? operationalStyles() : ''}</style><script src="${escapeHtml(staffAccessScriptPath)}" defer></script>${operationScript}</head><body data-calendar-readonly="${canMutate ? 'false' : 'true'}"><div class="workspace-frame">${renderWorkspaceNavigation({ active: 'calendar', clientsHref: clientNavigationAllowed ? clientsPath : null })}<div class="workspace-main"><div class="shell">
    <header class="topbar"><div class="brand"><h1>Calendar</h1><p>Your clinic day, at a glance.</p></div><div class="topbar-side">${renderOperationalActions(operationalActions)}<div class="truth-note">Africa/Johannesburg • Shiloh is the scheduling authority</div><div class="access-controls"><button class="signout-button" type="button" data-shiloh-logout>Sign out</button><span class="access-status" role="status" aria-live="polite" data-shiloh-calendar-access-status></span></div></div></header>
    ${renderControls(model, basePath)}${renderOperationalSummary(model)}${canMutate ? '<span class="operation-status" role="status" aria-live="polite" data-calendar-operation-status>Canonical changes are revalidated when saved.</span>' : ''}${content}
    <div class="footer-note">${escapeHtml(timelineReadOnlyMessage)}</div>${renderManagementPanel(model)}
  </div></div></div></body></html>`;
}

function renderUnavailablePage({ code = 'CALENDAR_UNAVAILABLE', message = 'Calendar is temporarily unavailable.' } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shiloh Calendar unavailable</title><style>${serviceFamilyAccentCss()}${styles()}</style></head><body data-calendar-readonly="true"><div class="shell"><header class="topbar"><div class="brand"><h1>Shiloh Calendar</h1><p>Read-only operational Calendar</p></div></header><main class="calendar-view"><div class="view-heading"><div><span class="eyebrow">Unavailable</span><h2>Calendar unavailable</h2></div><span class="read-only-badge">Fail closed</span></div><p>${escapeHtml(message)}</p><p class="footer-note">Reference: ${escapeHtml(code)}</p></main></div></body></html>`;
}

module.exports = {
  escapeHtml,
  renderCalendarPage,
  renderUnavailablePage,
  renderEventCard,
  renderOperationalActions,
  renderOperationalSummary,
  mutationEnabled,
  operationEnabled,
  appointmentOperations,
  staffOperationEnabled,
  eventsForDate,
  workingContext,
  formatClientMobile,
  visibleStaffIdsForModel,
  queryHref,
  desktopSpatialLaneStyles,
};
