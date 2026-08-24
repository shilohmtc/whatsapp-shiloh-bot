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
    case 'appointment':
      return eventStaffIds(item).length > 1 ? `Multi-practitioner appointment #${item.id}` : `Appointment #${item.id}`;
    case 'calendar_block': return item.title || item.blockType || 'Blocked time';
    case 'approved_leave': return 'Approved leave';
    case 'clinic_closure': return item.reason ? `Closed — ${item.reason}` : 'Clinic closed';
    case 'external_busy': return item.summary ? `Google-only busy — ${item.summary}` : 'Google-only busy';
    default: return String(item.kind || 'Calendar item').replace(/_/g, ' ');
  }
}

function eventMeta(item, model) {
  const names = staffNamesFor(item, model);
  const pieces = [];
  if (item.kind === 'appointment' && item.status) pieces.push(String(item.status).replace(/_/g, ' '));
  if (names.length) pieces.push(names.join(' + '));
  if (item.kind === 'calendar_block' && item.blockType) pieces.push(String(item.blockType).replace(/_/g, ' '));
  if (item.kind === 'approved_leave' && item.reason) pieces.push(item.reason);
  return pieces.join(' • ');
}

function renderProvenance(item) {
  if (item.canonical === false) {
    return '<span class="provenance external">Non-canonical • Google Calendar • PR #395 classification</span>';
  }
  return `<span class="provenance canonical">Canonical • ${escapeHtml(item.source || 'Shiloh')}</span>`;
}

function renderEventCard(item, model) {
  const external = item.canonical === false || item.kind === 'external_busy';
  const shared = item.kind === 'appointment' && eventStaffIds(item).length > 1;
  const id = `${item.kind || 'event'}-${item.id || 'unknown'}`;
  return `<article class="event-card ${external ? 'event-external' : 'event-canonical'} ${shared ? 'event-shared' : ''}" data-event-id="${escapeHtml(id)}" data-kind="${escapeHtml(item.kind || '')}" data-canonical="${item.canonical === false ? 'false' : 'true'}">
    <div class="event-time">${escapeHtml(formatRange(item))}</div>
    <h4>${escapeHtml(eventTitle(item))}</h4>
    ${eventMeta(item, model) ? `<p>${escapeHtml(eventMeta(item, model))}</p>` : ''}
    ${renderProvenance(item)}
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
  return sortEvents((model.timeline.events || []).filter(item => dateKey(item.startsAt || item.date) === day));
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

function queryHref(basePath, view, date, staff) {
  const params = new URLSearchParams({ view, date });
  if (staff != null) params.set('staff', String(staff));
  return `${basePath}?${params.toString()}`;
}

function renderControls(model, basePath) {
  const today = dateKey(new Date());
  const selected = model.selectedStaffId;
  const permittedStaff = model.permittedStaff || [];
  const canSwitchPractitioner = permittedStaff.length > 1;
  const filterContent = canSwitchPractitioner
    ? [
        `<a class="filter ${selected == null ? 'active' : ''}" href="${escapeHtml(queryHref(basePath, model.view, model.dateKey, null))}">All permitted</a>`,
        ...permittedStaff.map(person => `<a class="filter ${Number(selected) === Number(person.id) ? 'active' : ''}" href="${escapeHtml(queryHref(basePath, model.view, model.dateKey, person.id))}">${escapeHtml(person.displayName)}</a>`),
      ].join('')
    : `<span class="scope-pill">${escapeHtml(permittedStaff[0]?.displayName || 'Permitted practitioner')} • your permitted timeline</span>`;
  const viewLinks = ['day', 'week', 'agenda'].map(view => `<a class="view-tab ${model.view === view ? 'active' : ''}" href="${escapeHtml(queryHref(basePath, view, model.dateKey, selected))}">${view[0].toUpperCase()}${view.slice(1)}</a>`).join('');
  return `<section class="controls" aria-label="Calendar controls">
    <div class="period-nav">
      <a class="nav-button" href="${escapeHtml(queryHref(basePath, model.view, model.period.previousAnchor, selected))}" aria-label="Previous period">←</a>
      <a class="nav-button today" href="${escapeHtml(queryHref(basePath, model.view, today, selected))}">Today</a>
      <a class="nav-button" href="${escapeHtml(queryHref(basePath, model.view, model.period.nextAnchor, selected))}" aria-label="Next period">→</a>
    </div>
    <nav class="view-tabs" aria-label="Calendar view">${viewLinks}</nav>
    <div class="filters" aria-label="Practitioner scope">${filterContent}</div>
  </section>`;
}

function renderClosureStrip(model, day) {
  const closures = (model.timeline.closures || []).filter(item => dateKey(item.date) === day);
  if (!closures.length) return '';
  return `<div class="closure-strip">${closures.map(item => `<span>Closed • ${escapeHtml(item.reason || 'Clinic closure')}</span>`).join('')}</div>`;
}

function renderDay(model) {
  const day = model.period.dateKeys[0];
  const sharedAppointments = (model.timeline.appointments || []).filter(item => dateKey(item.startsAt) === day && eventStaffIds(item).length > 1);
  const lanes = (model.timeline.staff || []).map(person => {
    const items = eventsForDate(model, day).filter(item => {
      if (item.kind === 'clinic_closure') return false;
      if (item.kind === 'appointment' && eventStaffIds(item).length > 1) return false;
      return eventStaffIds(item).includes(Number(person.id));
    });
    return `<section class="lane" data-staff-id="${escapeHtml(person.id)}">
      <header><div><h3>${escapeHtml(person.displayName)}</h3><p>${escapeHtml(workingContext(model, person.id, day))}</p></div></header>
      <div class="lane-events">${items.length ? items.map(item => renderEventCard(item, model)).join('') : '<div class="empty">No scheduled items</div>'}</div>
    </section>`;
  }).join('');

  return `<main class="calendar-view day-view" data-view="day">
    <div class="view-heading"><div><span class="eyebrow">Day</span><h2>${escapeHtml(formatDay(day, { weekday: 'long', month: 'long', year: 'numeric' }))}</h2></div><span class="read-only-badge">Read-only</span></div>
    ${renderClosureStrip(model, day)}
    ${sharedAppointments.length ? `<section class="shared-band"><div class="section-label">Shared appointments • one canonical booking</div>${sharedAppointments.map(item => renderEventCard(item, model)).join('')}</section>` : ''}
    <div class="lanes">${lanes || '<div class="empty large">No permitted practitioner lanes</div>'}</div>
  </main>`;
}

function renderWeek(model) {
  const days = model.period.dateKeys.map(day => {
    const items = eventsForDate(model, day);
    return `<section class="week-day" data-date="${escapeHtml(day)}">
      <header><span>${escapeHtml(formatDay(day))}</span></header>
      ${renderClosureStrip(model, day)}
      <div class="week-events">${items.length ? items.map(item => renderEventCard(item, model)).join('') : '<div class="empty">Clear</div>'}</div>
    </section>`;
  }).join('');
  return `<main class="calendar-view week-view" data-view="week">
    <div class="view-heading"><div><span class="eyebrow">Week</span><h2>${escapeHtml(formatDay(model.period.startKey, { weekday: 'short', month: 'long' }))} – ${escapeHtml(formatDay(model.period.dateKeys.at(-1), { weekday: 'short', month: 'long', year: 'numeric' }))}</h2></div><span class="read-only-badge">Read-only</span></div>
    <div class="week-grid">${days}</div>
  </main>`;
}

function renderAgenda(model) {
  const sections = model.period.dateKeys.map(day => {
    const items = eventsForDate(model, day);
    if (!items.length) return '';
    return `<section class="agenda-day"><header><h3>${escapeHtml(formatDay(day, { weekday: 'long', month: 'long' }))}</h3></header>${items.map(item => renderEventCard(item, model)).join('')}</section>`;
  }).filter(Boolean).join('');
  return `<main class="calendar-view agenda-view" data-view="agenda">
    <div class="view-heading"><div><span class="eyebrow">Agenda</span><h2>Next 7 days from ${escapeHtml(formatDay(model.dateKey, { weekday: 'long', month: 'long' }))}</h2></div><span class="read-only-badge">Read-only</span></div>
    ${sections || '<div class="empty large">No scheduled items in this period</div>'}
  </main>`;
}

function styles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#6c7d75;--paper:#f7f5ef;--panel:#fffdf9;--line:#dfe5df;--leaf:#496b5a;--leaf-soft:#e7eee9;--clay:#8b6f5f;--external:#655c7a;--external-soft:#f0edf5;--danger-soft:#f5ebe6}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:1500px;margin:0 auto;padding:22px}.topbar{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:18px}.topbar-side{display:grid;gap:8px;justify-items:end}.brand h1{font-size:1.45rem;margin:0}.brand p{margin:4px 0 0;color:var(--muted);font-size:.9rem}.truth-note{font-size:.8rem;color:var(--muted);text-align:right}.access-controls{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.signout-button{border:1px solid var(--line);border-radius:999px;padding:6px 10px;background:#fff;color:var(--ink);font:inherit;font-size:.78rem;font-weight:700;cursor:pointer}.signout-button:hover{border-color:var(--leaf)}.signout-button:disabled{opacity:.55;cursor:not-allowed}.access-status{font-size:.74rem;color:var(--muted);min-height:1em}.controls{display:grid;grid-template-columns:auto auto 1fr;gap:14px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin-bottom:16px;box-shadow:0 4px 18px rgba(32,50,43,.04)}a{text-decoration:none;color:inherit}.period-nav,.view-tabs,.filters{display:flex;gap:7px;align-items:center}.filters{overflow:auto;justify-content:flex-end}.nav-button,.view-tab,.filter,.scope-pill{white-space:nowrap;border:1px solid var(--line);border-radius:999px;padding:7px 11px;font-size:.86rem;background:#fff}.scope-pill{color:var(--muted);background:var(--leaf-soft)}.view-tab.active,.filter.active{background:var(--leaf);color:#fff;border-color:var(--leaf)}.nav-button:hover,.view-tab:hover,.filter:hover{border-color:var(--leaf)}.calendar-view{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:16px;box-shadow:0 4px 18px rgba(32,50,43,.04)}.view-heading{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:14px}.view-heading h2{margin:2px 0 0;font-size:1.2rem}.eyebrow{font-size:.75rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}.read-only-badge{background:var(--leaf-soft);color:var(--leaf);border-radius:999px;padding:6px 10px;font-size:.8rem;font-weight:650}.closure-strip{display:flex;gap:8px;flex-wrap:wrap;background:var(--danger-soft);border:1px solid #ead6cc;border-radius:10px;padding:8px 10px;margin:0 0 10px;font-size:.82rem}.shared-band{border:1px dashed var(--leaf);background:var(--leaf-soft);border-radius:14px;padding:10px;margin-bottom:12px}.section-label{font-size:.76rem;color:var(--leaf);font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em}.lanes{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}.lane{border:1px solid var(--line);border-radius:14px;min-width:0;background:#fff}.lane>header{padding:11px 12px;border-bottom:1px solid var(--line)}.lane h3{margin:0;font-size:1rem}.lane header p{margin:3px 0 0;color:var(--muted);font-size:.78rem}.lane-events,.week-events{padding:9px;display:grid;gap:8px}.event-card{border:1px solid var(--line);border-left:4px solid var(--leaf);border-radius:10px;padding:9px 10px;background:#fff;min-width:0}.event-card.event-external{border-left-color:var(--external);background:var(--external-soft)}.event-card.event-shared{border-left-color:var(--clay)}.event-time{font-size:.75rem;color:var(--muted);font-weight:650}.event-card h4{margin:2px 0 3px;font-size:.9rem}.event-card p{margin:0 0 5px;color:var(--muted);font-size:.78rem}.provenance{display:inline-block;font-size:.68rem;border-radius:999px;padding:3px 6px}.provenance.canonical{background:var(--leaf-soft);color:var(--leaf)}.provenance.external{background:#e2ddeb;color:var(--external)}.week-grid{display:grid;grid-template-columns:repeat(7,minmax(170px,1fr));gap:8px;overflow:auto}.week-day{border:1px solid var(--line);border-radius:12px;min-width:170px;background:#fff}.week-day>header{padding:8px 9px;border-bottom:1px solid var(--line);font-size:.82rem;font-weight:700}.agenda-view{max-width:920px;margin:0 auto}.agenda-day{margin:0 0 18px}.agenda-day>header{position:sticky;top:0;background:var(--panel);padding:5px 0;z-index:1}.agenda-day h3{font-size:.92rem;margin:0;color:var(--muted)}.agenda-day .event-card{margin-top:7px}.empty{color:var(--muted);font-size:.82rem;padding:14px;text-align:center}.empty.large{padding:40px}.footer-note{margin-top:14px;color:var(--muted);font-size:.76rem;text-align:center}@media(max-width:900px){.shell{padding:12px}.topbar{align-items:start;flex-direction:column}.topbar-side{justify-items:start}.truth-note{text-align:left}.access-controls{justify-content:flex-start}.controls{grid-template-columns:1fr}.filters{justify-content:flex-start}.week-grid{grid-template-columns:repeat(7,minmax(210px,1fr))}}`;
}

function renderCalendarPage(model, {
  basePath = '/calendar/read-only',
  staffAccessScriptPath = '/calendar/staff/client.js',
} = {}) {
  const content = model.view === 'week' ? renderWeek(model) : model.view === 'agenda' ? renderAgenda(model) : renderDay(model);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shiloh Calendar</title><style>${styles()}</style><script src="${escapeHtml(staffAccessScriptPath)}" defer></script></head><body data-calendar-readonly="true"><div class="shell">
    <header class="topbar"><div class="brand"><h1>Shiloh Calendar</h1><p>Canonical scheduling truth, calmly presented.</p></div><div class="topbar-side"><div class="truth-note">Africa/Johannesburg • Read-only • Google-only busy is non-canonical</div><div class="access-controls"><button class="signout-button" type="button" data-shiloh-logout>Sign out</button><span class="access-status" role="status" aria-live="polite" data-shiloh-calendar-access-status></span></div></div></header>
    ${renderControls(model, basePath)}${content}
    <div class="footer-note">Read-only operational view. Booking, reschedule, cancellation, block, leave and schedule mutations are not available here.</div>
  </div></body></html>`;
}

function renderUnavailablePage({ code = 'CALENDAR_UNAVAILABLE', message = 'Calendar is temporarily unavailable.' } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shiloh Calendar unavailable</title><style>${styles()}</style></head><body data-calendar-readonly="true"><div class="shell"><header class="topbar"><div class="brand"><h1>Shiloh Calendar</h1><p>Read-only operational Calendar</p></div></header><main class="calendar-view"><div class="view-heading"><div><span class="eyebrow">Unavailable</span><h2>Calendar unavailable</h2></div><span class="read-only-badge">Fail closed</span></div><p>${escapeHtml(message)}</p><p class="footer-note">Reference: ${escapeHtml(code)}</p></main></div></body></html>`;
}

module.exports = {
  escapeHtml,
  renderCalendarPage,
  renderUnavailablePage,
  renderEventCard,
  eventsForDate,
  workingContext,
};