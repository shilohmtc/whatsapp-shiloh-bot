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

function eventKindLabel(item) {
  switch (item.kind) {
    case 'appointment': return 'Appointment';
    case 'calendar_block': return 'Block';
    case 'approved_leave': return 'Leave';
    case 'clinic_closure': return 'Closure';
    case 'external_busy': return 'Google busy';
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
    return '<span class="provenance external">Google busy • non-canonical</span>';
  }
  return `<span class="provenance canonical">Shiloh truth<span class="sr-only"> • Canonical • ${escapeHtml(item.source || 'Shiloh')}</span></span>`;
}

function renderEventCard(item, model) {
  const external = item.canonical === false || item.kind === 'external_busy';
  const shared = item.kind === 'appointment' && eventStaffIds(item).length > 1;
  const id = `${item.kind || 'event'}-${item.id || 'unknown'}`;
  return `<article class="event-card ${external ? 'event-external' : 'event-canonical'} ${shared ? 'event-shared' : ''}" data-event-id="${escapeHtml(id)}" data-kind="${escapeHtml(item.kind || '')}" data-canonical="${item.canonical === false ? 'false' : 'true'}">
    <div class="event-card-top"><div class="event-time">${escapeHtml(formatRange(item))}</div><span class="kind-pill">${escapeHtml(eventKindLabel(item))}</span></div>
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
        `<a class="filter ${selected == null ? 'active' : ''}" ${selected == null ? 'aria-current="true"' : ''} href="${escapeHtml(queryHref(basePath, model.view, model.dateKey, null))}">All permitted</a>`,
        ...permittedStaff.map(person => `<a class="filter ${Number(selected) === Number(person.id) ? 'active' : ''}" ${Number(selected) === Number(person.id) ? 'aria-current="true"' : ''} href="${escapeHtml(queryHref(basePath, model.view, model.dateKey, person.id))}">${escapeHtml(person.displayName)}</a>`),
      ].join('')
    : `<span class="scope-pill">${escapeHtml(permittedStaff[0]?.displayName || 'Permitted practitioner')} • your permitted timeline</span>`;
  const viewLinks = ['day', 'week', 'agenda'].map(view => `<a class="view-tab ${model.view === view ? 'active' : ''}" ${model.view === view ? 'aria-current="page"' : ''} href="${escapeHtml(queryHref(basePath, view, model.dateKey, selected))}">${view[0].toUpperCase()}${view.slice(1)}</a>`).join('');
  return `<section class="controls" aria-label="Calendar controls">
    <div class="control-group"><span class="control-label">Date</span><div class="period-nav">
      <a class="nav-button" href="${escapeHtml(queryHref(basePath, model.view, model.period.previousAnchor, selected))}" aria-label="Previous period"><span aria-hidden="true">←</span><span class="nav-word">Previous</span></a>
      <a class="nav-button today" href="${escapeHtml(queryHref(basePath, model.view, today, selected))}">Today</a>
      <a class="nav-button" href="${escapeHtml(queryHref(basePath, model.view, model.period.nextAnchor, selected))}" aria-label="Next period"><span class="nav-word">Next</span><span aria-hidden="true">→</span></a>
    </div></div>
    <div class="control-group"><span class="control-label">View</span><nav class="view-tabs" aria-label="Calendar view">${viewLinks}</nav></div>
    <div class="control-group practitioner-control"><span class="control-label">Practitioner</span><div class="filters" aria-label="Practitioner scope">${filterContent}</div></div>
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
    ['Google only', countFor(model, 'externalBusy')],
  ];
  return `<section class="scan-summary" aria-label="Visible period summary">
    <div class="summary-context"><span class="eyebrow">At a glance</span><strong>${model.timeline?.staff?.length || 0} practitioner${model.timeline?.staff?.length === 1 ? '' : 's'} in view</strong></div>
    <div class="summary-metrics">${items.map(([label, value]) => `<div class="summary-metric"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`).join('')}</div>
    <div class="provenance-key" aria-label="Calendar provenance key"><span class="key-dot canonical"></span>Shiloh truth <span class="key-dot external"></span>Google only</div>
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
    const context = workingContext(model, person.id, day);
    const unavailable = context === 'Not scheduled' || context === 'No working window';
    return `<section class="lane" data-staff-id="${escapeHtml(person.id)}">
      <header><div><h3>${escapeHtml(person.displayName)}</h3><p><span class="status-dot ${unavailable ? 'off' : ''}"></span>${escapeHtml(context)}</p></div><span class="lane-count">${items.length} item${items.length === 1 ? '' : 's'}</span></header>
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
      <header><span>${escapeHtml(formatDay(day))}</span><small>${items.length} item${items.length === 1 ? '' : 's'}</small></header>
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

function renderOperationalActions(actions = []) {
  if (!Array.isArray(actions) || !actions.length) return '';
  return `<nav class="operational-actions" aria-label="Calendar actions">${actions.map(action => {
    const tone = action?.tone === 'primary' ? ' primary' : '';
    return `<a class="action-link${tone}" href="${escapeHtml(action?.href || '#')}">${escapeHtml(action?.label || 'Action')}</a>`;
  }).join('')}</nav>`;
}

function styles() {
  return `:root{color-scheme:light;--ink:#20322b;--muted:#66776f;--paper:#f4f3ed;--panel:#fffdf9;--line:#dce3dd;--line-strong:#c9d4cc;--leaf:#3f6653;--leaf-deep:#294c3c;--leaf-soft:#e7eee9;--clay:#8b6f5f;--external:#655c7a;--external-soft:#f0edf5;--danger-soft:#f5ebe6;--shadow:0 8px 28px rgba(32,50,43,.07)}*{box-sizing:border-box}.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{max-width:1500px;margin:0 auto;padding:22px}.topbar{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:14px}.topbar-side{display:grid;gap:8px;justify-items:end}.brand h1{font-size:1.55rem;line-height:1.15;margin:0}.brand p{margin:5px 0 0;color:var(--muted);font-size:.9rem}.truth-note{font-size:.78rem;color:var(--muted);text-align:right}.access-controls,.operational-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.action-link,.signout-button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:999px;min-height:38px;padding:7px 12px;background:#fff;color:var(--ink);font:inherit;font-size:.78rem;font-weight:750}.action-link.primary{background:var(--leaf-deep);border-color:var(--leaf-deep);color:#fff}.action-link:hover,.signout-button:hover{border-color:var(--leaf)}.signout-button{cursor:pointer}.signout-button:disabled{opacity:.55;cursor:not-allowed}.access-status{font-size:.74rem;color:var(--muted);min-height:1em}.controls{display:grid;grid-template-columns:auto auto minmax(260px,1fr);gap:14px;align-items:end;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:11px 13px;margin-bottom:10px;box-shadow:0 4px 18px rgba(32,50,43,.04)}a{text-decoration:none;color:inherit}.control-group{display:grid;gap:5px;min-width:0}.control-label{font-size:.67rem;text-transform:uppercase;letter-spacing:.1em;font-weight:800;color:var(--muted);padding-left:3px}.period-nav,.view-tabs,.filters{display:flex;gap:6px;align-items:center}.filters{overflow:auto;justify-content:flex-end;scrollbar-width:thin}.nav-button,.view-tab,.filter,.scope-pill{display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;border:1px solid var(--line);border-radius:999px;min-height:38px;padding:7px 11px;font-size:.84rem;background:#fff;font-weight:700}.scope-pill{color:var(--muted);background:var(--leaf-soft)}.view-tab.active,.filter.active{background:var(--leaf);color:#fff;border-color:var(--leaf)}.nav-button:hover,.view-tab:hover,.filter:hover{border-color:var(--leaf)}.scan-summary{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;background:#eef2ee;border:1px solid var(--line);border-radius:14px;padding:10px 13px;margin-bottom:10px}.summary-context{display:grid;gap:2px;min-width:150px}.summary-context strong{font-size:.85rem}.summary-metrics{display:grid;grid-template-columns:repeat(4,minmax(82px,1fr));gap:6px}.summary-metric{display:flex;gap:7px;align-items:baseline;border-left:1px solid var(--line-strong);padding-left:10px}.summary-metric strong{font-size:1.05rem}.summary-metric span{font-size:.72rem;color:var(--muted)}.provenance-key{display:flex;align-items:center;gap:6px;white-space:nowrap;font-size:.72rem;color:var(--muted)}.key-dot,.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--leaf)}.key-dot.external{background:var(--external);margin-left:5px}.calendar-view{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:15px;box-shadow:var(--shadow)}.view-heading{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:12px}.view-heading h2{margin:2px 0 0;font-size:1.25rem;line-height:1.2}.eyebrow{font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);font-weight:800}.read-only-badge{background:var(--leaf-soft);color:var(--leaf);border-radius:999px;padding:6px 10px;font-size:.76rem;font-weight:750}.closure-strip{display:flex;gap:8px;flex-wrap:wrap;background:var(--danger-soft);border:1px solid #ead6cc;border-radius:10px;padding:8px 10px;margin:0 0 10px;font-size:.82rem;font-weight:700}.shared-band{border:1px dashed var(--leaf);background:var(--leaf-soft);border-radius:14px;padding:10px;margin-bottom:10px}.section-label{font-size:.72rem;color:var(--leaf);font-weight:800;margin-bottom:7px;text-transform:uppercase;letter-spacing:.08em}.lanes{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:9px}.lane{border:1px solid var(--line);border-radius:14px;min-width:0;background:#fff;overflow:hidden}.lane>header{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;padding:10px 11px;border-bottom:1px solid var(--line);background:#fafbf8}.lane h3{margin:0;font-size:.98rem}.lane header p{display:flex;align-items:center;gap:5px;margin:3px 0 0;color:var(--muted);font-size:.76rem}.status-dot.off{background:#b79886}.lane-count{font-size:.68rem;color:var(--muted);white-space:nowrap}.lane-events,.week-events{padding:8px;display:grid;gap:7px}.event-card{border:1px solid var(--line);border-left:4px solid var(--leaf);border-radius:10px;padding:8px 9px;background:#fff;min-width:0}.event-card.event-external{border-left-color:var(--external);background:var(--external-soft)}.event-card.event-shared{border-left-color:var(--clay)}.event-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.event-time{font-size:.75rem;color:var(--muted);font-weight:750}.kind-pill{font-size:.63rem;text-transform:uppercase;letter-spacing:.055em;font-weight:800;color:var(--muted)}.event-card h4{margin:2px 0 3px;font-size:.88rem;line-height:1.25}.event-card p{margin:0 0 5px;color:var(--muted);font-size:.76rem;line-height:1.35}.provenance{display:inline-block;font-size:.65rem;border-radius:999px;padding:3px 6px}.provenance.canonical{background:var(--leaf-soft);color:var(--leaf)}.provenance.external{background:#e2ddeb;color:var(--external)}.week-grid{display:grid;grid-template-columns:repeat(7,minmax(168px,1fr));gap:7px;overflow:auto;padding-bottom:4px;scroll-snap-type:x proximity}.week-day{border:1px solid var(--line);border-radius:12px;min-width:168px;background:#fff;overflow:hidden;scroll-snap-align:start}.week-day>header{position:sticky;top:0;z-index:1;display:flex;justify-content:space-between;gap:6px;padding:8px 9px;border-bottom:1px solid var(--line);font-size:.8rem;font-weight:800;background:#fafbf8}.week-day>header small{font-size:.65rem;color:var(--muted);font-weight:650}.agenda-view{max-width:920px;margin:0 auto}.agenda-day{margin:0 0 16px}.agenda-day>header{position:sticky;top:0;background:var(--panel);padding:6px 0;z-index:2;border-bottom:1px solid var(--line)}.agenda-day h3{font-size:.9rem;margin:0;color:var(--muted)}.agenda-day .event-card{margin-top:7px}.empty{color:var(--muted);font-size:.8rem;padding:13px;text-align:center}.empty.large{padding:40px}.footer-note{margin-top:14px;color:var(--muted);font-size:.74rem;text-align:center;line-height:1.45}@media(max-width:1050px){.controls{grid-template-columns:auto auto}.practitioner-control{grid-column:1/-1}.filters{justify-content:flex-start}.scan-summary{grid-template-columns:1fr auto}.summary-context{display:none}.summary-metrics{grid-template-columns:repeat(4,minmax(70px,1fr))}}@media(max-width:700px){.shell{padding:10px 10px 28px}.topbar{align-items:start;flex-direction:column;margin-bottom:10px}.topbar-side{justify-items:start;width:100%}.truth-note{text-align:left}.access-controls,.operational-actions{justify-content:flex-start;width:100%}.action-link,.signout-button{min-height:44px}.operational-actions{display:grid;grid-template-columns:1fr}.action-link{width:100%}.controls{position:sticky;top:0;z-index:5;grid-template-columns:1fr 1fr;gap:9px;padding:9px}.practitioner-control{grid-column:1/-1}.control-label{font-size:.62rem}.nav-button,.view-tab,.filter,.scope-pill{min-height:44px;padding:8px 12px}.nav-word{display:none}.period-nav,.view-tabs{display:grid;grid-template-columns:repeat(3,1fr)}.scan-summary{grid-template-columns:1fr;margin-bottom:8px;padding:9px;overflow:auto}.summary-metrics{grid-template-columns:repeat(4,minmax(90px,1fr));min-width:390px}.provenance-key{display:none}.calendar-view{border-radius:14px;padding:12px}.view-heading{align-items:flex-start}.view-heading h2{font-size:1.08rem}.read-only-badge{font-size:.7rem}.lanes{grid-template-columns:1fr}.event-card{padding:10px;min-height:44px}.week-grid{grid-template-columns:repeat(7,minmax(82vw,1fr));margin:0 -2px}.week-day{min-width:82vw}.agenda-day>header{top:99px}.footer-note{text-align:left}}`;
}

function renderCalendarPage(model, {
  basePath = '/calendar/read-only',
  staffAccessScriptPath = '/calendar/staff/client.js',
  operationalActions = [],
  timelineReadOnlyMessage = 'Read-only operational view. Booking, reschedule, cancellation, block, leave and schedule mutations are not available here.',
} = {}) {
  const content = model.view === 'week' ? renderWeek(model) : model.view === 'agenda' ? renderAgenda(model) : renderDay(model);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shiloh Calendar</title><style>${styles()}</style><script src="${escapeHtml(staffAccessScriptPath)}" defer></script></head><body data-calendar-readonly="true"><div class="shell">
    <header class="topbar"><div class="brand"><h1>Shiloh Calendar</h1><p>Canonical scheduling truth, calmly presented.</p></div><div class="topbar-side">${renderOperationalActions(operationalActions)}<div class="truth-note">Africa/Johannesburg • Read-only • Google-only busy is non-canonical</div><div class="access-controls"><button class="signout-button" type="button" data-shiloh-logout>Sign out</button><span class="access-status" role="status" aria-live="polite" data-shiloh-calendar-access-status></span></div></div></header>
    ${renderControls(model, basePath)}${renderOperationalSummary(model)}${content}
    <div class="footer-note">${escapeHtml(timelineReadOnlyMessage)}</div>
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
  renderOperationalActions,
};
