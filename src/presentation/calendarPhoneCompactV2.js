const { allowsStaffTarget } = require('../services/calendarAuthorization');
const { normalizeOperationalDateKey } = require('../services/calendarReadOnlyUx');

const BUSINESS_TIMEZONE = 'Africa/Johannesburg';
const PHONE_GRID_PIXELS_PER_HOUR = 60;
const DESKTOP_GRID_PIXELS_PER_HOUR = 72;
const GRID_START_MINUTES = 7 * 60;
const GRID_END_MINUTES = 20 * 60;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function localDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
}

function dateKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function businessToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return normalizeOperationalDateKey(`${values.year}-${values.month}-${values.day}`);
}

function monthLabel(value, long = false) {
  const date = localDate(value);
  if (!date) return 'Calendar';
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: BUSINESS_TIMEZONE,
    month: long ? 'long' : 'short',
    year: 'numeric',
  }).format(date);
}

function operationalMonthAnchor(year, monthIndex) {
  const date = new Date(Date.UTC(year, monthIndex, 1, 12));
  if (date.getUTCDay() === 0) date.setUTCDate(2);
  return dateKey(date);
}

function calendarHref(basePath, { view = 'day', date = '', staffId = null } = {}) {
  const params = new URLSearchParams({ view, date });
  const id = positiveId(staffId);
  if (id) {
    params.set('staff', String(id));
    params.set('activeStaff', String(id));
  }
  return `${basePath}?${params.toString()}`;
}

function bookingHref(bookingPath, { date = '', staffId = null } = {}) {
  const params = new URLSearchParams();
  if (date) params.set('date', String(date));
  const id = positiveId(staffId);
  if (id) params.set('staff', String(id));
  const query = params.toString();
  return `${bookingPath}${query ? `?${query}` : ''}`;
}

function resolveActiveStaff(model) {
  const permitted = Array.isArray(model?.permittedStaff) ? model.permittedStaff : [];
  const requested = positiveId(model?.activeStaffId);
  return permitted.find(person => positiveId(person.id) === requested)
    || permitted.find(person => (model?.timeline?.staff || []).some(item => positiveId(item.id) === positiveId(person.id)))
    || permitted[0]
    || null;
}

function buildMonthCells({ date, activeStaffId, basePath }) {
  const target = localDate(date);
  if (!target) return '';
  const year = target.getUTCFullYear();
  const month = target.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  const cells = [];
  let started = false;
  for (let day = 1; day <= lastDay; day += 1) {
    const current = new Date(Date.UTC(year, month, day, 12));
    const weekday = current.getUTCDay();
    if (weekday === 0) continue;
    if (!started) {
      for (let blank = 1; blank < weekday; blank += 1) {
        cells.push('<span class="phone-date-blank" aria-hidden="true"></span>');
      }
      started = true;
    }
    const key = dateKey(current);
    const href = calendarHref(basePath, { view: 'day', date: key, staffId: activeStaffId });
    const currentClass = key === date ? ' current' : '';
    cells.push(`<a class="phone-date-cell${currentClass}" href="${escapeHtml(href)}"${key === date ? ' aria-current="date"' : ''}>${day}</a>`);
  }
  return cells.join('');
}

function renderPhoneCalendarControls(model, { basePath = '/calendar/read-only' } = {}) {
  const active = resolveActiveStaff(model);
  const activeStaffId = positiveId(active?.id);
  const date = String(model?.dateKey || '');
  const view = ['day', 'week', 'month'].includes(model?.view) ? model.view : 'day';
  const target = localDate(date) || new Date();
  const previousMonth = operationalMonthAnchor(target.getUTCFullYear(), target.getUTCMonth() - 1);
  const nextMonth = operationalMonthAnchor(target.getUTCFullYear(), target.getUTCMonth() + 1);
  const viewOptions = ['day', 'week', 'month'].map(option => {
    const label = option[0].toUpperCase() + option.slice(1);
    const href = calendarHref(basePath, { view: option, date, staffId: activeStaffId });
    return `<a class="phone-view-option${view === option ? ' active' : ''}" data-phone-calendar-view="${option}" href="${escapeHtml(href)}"${view === option ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('');
  const staffOptions = (model?.permittedStaff || []).map(person => {
    const id = positiveId(person.id);
    if (!id) return '';
    const href = calendarHref(basePath, { view, date, staffId: id });
    return `<a class="phone-staff-option${id === activeStaffId ? ' active' : ''}" data-phone-staff-id="${id}" href="${escapeHtml(href)}"${id === activeStaffId ? ' aria-current="true"' : ''}>${escapeHtml(person.displayName || `Staff ${id}`)}</a>`;
  }).join('');
  const previousHref = calendarHref(basePath, { view, date: previousMonth, staffId: activeStaffId });
  const nextHref = calendarHref(basePath, { view, date: nextMonth, staffId: activeStaffId });
  const monthCells = buildMonthCells({ date, activeStaffId, basePath });
  return `<section class="phone-calendar-v2-controls" data-phone-calendar-v2-controls aria-label="Phone Calendar controls">
    <details class="phone-date-menu" data-phone-calendar-menu>
      <summary aria-label="Choose date"><strong>${escapeHtml(monthLabel(date))}</strong><span aria-hidden="true">⌄</span></summary>
      <div class="phone-date-popover"><header><a href="${escapeHtml(previousHref)}" aria-label="Previous month">‹</a><strong>${escapeHtml(monthLabel(date, true))}</strong><a href="${escapeHtml(nextHref)}" aria-label="Next month">›</a></header><div class="phone-date-weekdays" aria-hidden="true"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div class="phone-date-grid">${monthCells}</div></div>
    </details>
    <details class="phone-view-menu" data-phone-calendar-menu><summary aria-label="Choose Calendar view"><strong>${escapeHtml(view[0].toUpperCase() + view.slice(1))}</strong><span aria-hidden="true">⌄</span></summary><nav>${viewOptions}</nav></details>
    ${active ? `<details class="phone-staff-menu" data-phone-calendar-menu><summary aria-label="Choose practitioner"><span class="status-dot" aria-hidden="true"></span><strong data-phone-active-staff="${activeStaffId}">${escapeHtml(active.displayName || `Staff ${activeStaffId}`)}</strong><span aria-hidden="true">⌄</span></summary><nav>${staffOptions}</nav></details>` : ''}
  </section>`;
}

function mutationEnabled(model) {
  return model?.mutationCapability?.enabled === true
    && Array.isArray(model.mutationCapability.operations);
}

function staffOperationEnabled(model, operation, staffId) {
  return mutationEnabled(model)
    && model.mutationCapability.operations.includes(operation)
    && allowsStaffTarget(model.mutationCapability, staffId);
}

function renderPhoneCalendarDock(model, {
  basePath = '/calendar/read-only',
  bookingPath = '/calendar/book',
  bookingAllowed = false,
} = {}) {
  const active = resolveActiveStaff(model);
  const staffId = positiveId(active?.id);
  const date = String(model?.dateKey || '');
  const todayHref = calendarHref(basePath, { view: ['day', 'week', 'month'].includes(model?.view) ? model.view : 'day', date: businessToday(), staffId });
  const actions = [];
  if (bookingAllowed) {
    actions.push(`<a href="${escapeHtml(bookingHref(bookingPath, { date, staffId }))}" aria-label="Create appointment">Appointment</a>`);
  }
  if (staffId && staffOperationEnabled(model, 'calendar_block:manage', staffId)) {
    actions.push(`<span class="phone-plus-lane-context lane"><h3 class="sr-only">${escapeHtml(active.displayName || `Staff ${staffId}`)}</h3><button type="button" data-calendar-operation="add-block" data-staff-id="${staffId}" data-date="${escapeHtml(date)}">Block time</button></span>`);
  }
  if (staffId && staffOperationEnabled(model, 'operational_leave:manage', staffId)) {
    actions.push(`<span class="phone-plus-lane-context lane"><h3 class="sr-only">${escapeHtml(active.displayName || `Staff ${staffId}`)}</h3><button type="button" data-calendar-operation="add-leave" data-staff-id="${staffId}" data-date="${escapeHtml(date)}">Time off</button></span>`);
  }
  return `<div class="phone-calendar-v2-dock" data-phone-calendar-v2-dock>
    <a class="phone-today-fab" href="${escapeHtml(todayHref)}">Today</a>
    ${actions.length ? `<details class="phone-plus-menu" data-phone-calendar-menu><summary aria-label="Calendar actions">+</summary><div class="phone-plus-popover">${actions.join('')}</div></details>` : ''}
  </div>`;
}

function phoneCalendarV2Styles() {
  const gridHeight = ((GRID_END_MINUTES - GRID_START_MINUTES) / 60) * PHONE_GRID_PIXELS_PER_HOUR;
  const halfHour = PHONE_GRID_PIXELS_PER_HOUR / 2;
  return `.phone-calendar-v2-controls,.phone-calendar-v2-dock,.phone-week-practitioner-strip{display:none}
@media(max-width:700px){
body[data-phone-calendar-v2="true"] .workspace-main .topbar,body[data-phone-calendar-v2="true"] .workspace-main .controls,body[data-phone-calendar-v2="true"] .workspace-main .scan-summary,body[data-phone-calendar-v2="true"] .workspace-main .operation-status,body[data-phone-calendar-v2="true"] .workspace-main .footer-note,body[data-phone-calendar-v2="true"] .workspace-main .calendar-booking-hint,body[data-phone-calendar-v2="true"] .workspace-main .view-practitioner-context{display:none!important}
body[data-phone-calendar-v2="true"] .workspace-main>.shell{padding:5px 4px 7px!important}
.phone-calendar-v2-controls{position:relative;z-index:55;display:grid;grid-template-columns:minmax(76px,.8fr) minmax(68px,.65fr) minmax(0,1.4fr);align-items:center;gap:4px;min-height:44px;margin:0 0 4px 49px}
.phone-calendar-v2-controls details{position:relative;min-width:0}
.phone-calendar-v2-controls summary{display:flex;align-items:center;justify-content:center;gap:4px;min-width:0;min-height:40px;padding:5px 7px;border:1px solid var(--line);border-radius:9px;background:#fff;list-style:none;font-size:.69rem;font-weight:800;cursor:pointer;box-shadow:0 2px 7px rgba(32,50,43,.05)}
.phone-calendar-v2-controls summary::-webkit-details-marker,.phone-plus-menu>summary::-webkit-details-marker{display:none}
.phone-calendar-v2-controls summary strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.phone-calendar-v2-controls nav,.phone-date-popover{position:absolute;top:calc(100% + 4px);z-index:80;display:grid;gap:3px;padding:6px;border:1px solid var(--line);border-radius:11px;background:#fff;box-shadow:0 14px 32px rgba(20,45,35,.2)}
.phone-view-menu nav{left:0;width:146px}.phone-staff-menu nav{right:0;width:min(230px,calc(100vw - 12px));max-height:55vh;overflow:auto}
.phone-view-option,.phone-staff-option{display:flex;align-items:center;min-height:44px;padding:8px 10px;border-radius:8px;font-size:.76rem;font-weight:750}.phone-view-option.active,.phone-staff-option.active{background:var(--leaf-soft);color:var(--leaf-deep)}
.phone-date-popover{left:-50px;width:min(326px,calc(100vw - 10px));gap:6px;padding:7px}.phone-date-popover header{display:grid;grid-template-columns:42px 1fr 42px;align-items:center;text-align:center}.phone-date-popover header a{display:grid;place-items:center;min-height:40px;border-radius:8px;font-size:1.2rem}.phone-date-weekdays,.phone-date-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:2px}.phone-date-weekdays span{padding:2px 0;text-align:center;color:var(--muted);font-size:.56rem;font-weight:800}.phone-date-cell,.phone-date-blank{display:grid;place-items:center;min-height:40px;border-radius:8px;font-size:.72rem}.phone-date-cell.current{background:var(--leaf-deep);color:#fff;font-weight:850}
body[data-phone-calendar-v2="true"] .calendar-view{padding:0!important;border-radius:7px!important;box-shadow:none!important;overflow:hidden!important}
body[data-phone-calendar-v2="true"] .view-heading{display:none!important}
body[data-phone-calendar-v2="true"] .day-time-grid{margin:0!important;max-height:calc(100dvh - 53px)!important;border:0!important;border-radius:0!important}
body[data-phone-calendar-v2="true"] .week-time-grid{margin:0!important;max-height:calc(100dvh - 81px)!important;border:0!important;border-radius:0!important}
body[data-phone-calendar-v2="true"] .day-time-grid{grid-template-columns:34px minmax(0,1fr)!important;overflow:auto!important}
body[data-phone-calendar-v2="true"] .day-time-grid .time-rail{width:34px!important;margin-top:32px!important}
body[data-phone-calendar-v2="true"] .time-rail{height:${gridHeight}px!important}
body[data-phone-calendar-v2="true"] .time-rail span{top:var(--phone-grid-top,var(--grid-top))!important;right:3px!important;font-size:.49rem!important}
body[data-phone-calendar-v2="true"] .time-column{height:${gridHeight}px!important;min-height:${gridHeight}px!important;background:repeating-linear-gradient(to bottom,transparent 0,transparent ${halfHour - 1}px,var(--line) ${halfHour - 1}px,var(--line) ${halfHour}px)!important}
body[data-phone-calendar-v2="true"] .calendar-booking-slots{pointer-events:none!important}body[data-phone-calendar-v2="true"] .calendar-booking-slot{pointer-events:none!important}body[data-phone-calendar-v2="true"] .calendar-booking-slot>span{display:none!important}
body[data-phone-calendar-v2="true"] .day-time-grid .lanes{display:block!important;min-width:0!important;width:100%!important}
body[data-phone-calendar-v2="true"] .day-view .lane{display:none!important;min-width:0!important;width:100%!important;border:0!important;border-radius:0!important}
body[data-phone-calendar-v2="true"] .day-view .lane[data-phone-active-practitioner="true"]{display:block!important}
body[data-phone-calendar-v2="true"] .day-view .lane>header{height:32px!important;min-height:32px!important;padding:3px 7px!important;align-items:center!important}
body[data-phone-calendar-v2="true"] .day-view .lane h3{font-size:.72rem!important}body[data-phone-calendar-v2="true"] .day-view .lane header p,body[data-phone-calendar-v2="true"] .day-view .lane-count{display:none!important}
body[data-phone-calendar-v2="true"] .day-view .lane-actions{position:absolute!important;width:1px!important;height:44px!important;overflow:hidden!important;clip-path:inset(50%)!important;visibility:hidden!important;pointer-events:none!important}
.phone-week-practitioner-strip{display:flex;align-items:center;gap:5px;min-height:28px;padding:4px 7px;border-bottom:1px solid var(--line);background:#fafbf8;font-size:.66rem;font-weight:800}.phone-week-practitioner-strip .status-dot{flex:0 0 7px;width:7px;height:7px}
body[data-phone-calendar-v2="true"] .week-time-grid{grid-template-columns:32px minmax(0,1fr)!important;overflow:auto!important}
body[data-phone-calendar-v2="true"] .week-time-grid .time-rail{width:32px!important;margin-top:38px!important}
body[data-phone-calendar-v2="true"] .week-grid{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;min-width:0!important;width:100%!important;gap:0!important}
body[data-phone-calendar-v2="true"] .week-practitioner-lane[data-active-practitioner="false"]{display:none!important}
body[data-phone-calendar-v2="true"] .week-day{display:block!important;min-width:0!important;width:auto!important;border:0!important;border-right:1px solid var(--line)!important;border-radius:0!important}
body[data-phone-calendar-v2="true"] .week-day:last-child{border-right:0!important}
body[data-phone-calendar-v2="true"] .week-day>header{height:38px!important;min-height:38px!important;padding:3px 1px!important;display:grid!important;place-items:center!important}
body[data-phone-calendar-v2="true"] .week-practitioner-name,body[data-phone-calendar-v2="true"] .week-practitioner-hours,body[data-phone-calendar-v2="true"] .week-day>header small,body[data-phone-calendar-v2="true"] .week-day-month{display:none!important}
body[data-phone-calendar-v2="true"] .week-day-date{display:grid!important;place-items:center!important;gap:0!important;line-height:1!important}body[data-phone-calendar-v2="true"] .week-day-weekday{font-size:.45rem!important}body[data-phone-calendar-v2="true"] .week-day-number{font-size:.68rem!important}
body[data-phone-calendar-v2="true"] .positioned-event{top:var(--phone-event-top,var(--event-top))!important;height:var(--phone-event-height,var(--event-height))!important;min-height:28px!important;overflow:visible!important}
body[data-phone-calendar-v2="true"] .day-view .positioned-event{left:2px!important;right:2px!important;width:auto!important}
body[data-phone-calendar-v2="true"] .positioned-event .event-card{height:100%!important;min-height:28px!important;padding:2px 4px!important;border-left-width:2px!important;border-radius:4px!important;box-shadow:none!important}
body[data-phone-calendar-v2="true"] .positioned-event .event-card-top{min-height:0!important;padding:0!important}body[data-phone-calendar-v2="true"] .positioned-event .event-time{font-size:.5rem!important;line-height:1!important}body[data-phone-calendar-v2="true"] .positioned-event .event-time-range{display:none!important}body[data-phone-calendar-v2="true"] .positioned-event .event-time-start{display:inline!important}
body[data-phone-calendar-v2="true"] .positioned-event .event-card h4{margin:1px 0 0!important;padding:0!important;font-size:.61rem!important;line-height:1.02!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
body[data-phone-calendar-v2="true"] .positioned-event .kind-pill,body[data-phone-calendar-v2="true"] .positioned-event .event-client-mobile,body[data-phone-calendar-v2="true"] .positioned-event .appointment-reference,body[data-phone-calendar-v2="true"] .positioned-event .provenance{display:none!important}
body[data-phone-calendar-v2="true"] .positioned-event .event-meta{margin:1px 0 0!important;padding:0!important;font-size:.48rem!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
body[data-phone-calendar-v2="true"] .positioned-event .event-card-actions{position:static!important;margin:0!important}body[data-phone-calendar-v2="true"] .positioned-event .event-operation{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;opacity:0!important}
body[data-phone-calendar-v2="true"] .lane-actions,body[data-phone-calendar-v2="true"] .availability-menu{position:absolute!important;width:1px!important;height:44px!important;overflow:hidden!important;clip-path:inset(50%)!important;visibility:hidden!important;pointer-events:none!important}
body[data-phone-calendar-v2="true"] .month-events,body[data-phone-calendar-v2="true"] .month-more,body[data-phone-calendar-v2="true"] .month-day-owners{display:none!important}
body[data-phone-calendar-v2="true"] .month-grid{border:0!important;border-radius:0!important;overflow:hidden!important}body[data-phone-calendar-v2="true"] .month-weekdays span{padding:6px 1px!important;text-align:center!important;font-size:.56rem!important}body[data-phone-calendar-v2="true"] .month-day{position:relative;min-height:64px!important;padding:0!important}body[data-phone-calendar-v2="true"] .month-day-link{display:grid!important;grid-template-rows:auto 1fr;align-items:start;justify-items:center;gap:5px;min-height:64px!important;padding:7px 2px!important;font-size:.74rem!important}body[data-phone-calendar-v2="true"] .month-day-link>small{display:none!important}.phone-month-density{display:flex;align-items:center;justify-content:center;gap:2px;min-height:12px}.phone-month-density i{display:block;width:4px;height:4px;border-radius:50%;background:var(--leaf)}.phone-month-density strong{margin-left:2px;font-size:.5rem;color:var(--muted)}
.phone-calendar-v2-dock{position:fixed;left:0;right:0;bottom:max(10px,env(safe-area-inset-bottom));z-index:65;display:flex;align-items:flex-end;justify-content:center;pointer-events:none}.phone-today-fab,.phone-plus-menu{pointer-events:auto}.phone-today-fab{display:grid;place-items:center;min-height:36px;padding:5px 13px;border:1px solid var(--line-strong);border-radius:999px;background:rgba(255,255,255,.96);box-shadow:0 6px 18px rgba(20,45,35,.16);font-size:.69rem;font-weight:800}.phone-plus-menu{position:absolute;right:12px;bottom:0}.phone-plus-menu>summary{display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:var(--leaf-deep);color:#fff;box-shadow:0 8px 20px rgba(20,45,35,.24);font-size:1.45rem;font-weight:500;list-style:none;cursor:pointer}.phone-plus-popover{position:absolute;right:0;bottom:54px;display:grid;gap:3px;width:154px;padding:5px;border:1px solid var(--line);border-radius:11px;background:#fff;box-shadow:0 14px 30px rgba(20,45,35,.22)}.phone-plus-popover>a,.phone-plus-popover button{display:flex!important;align-items:center!important;justify-content:flex-start!important;width:100%!important;min-height:44px!important;padding:8px 10px!important;border:0!important;border-radius:8px!important;background:transparent!important;color:var(--ink)!important;font:inherit!important;font-size:.74rem!important;font-weight:800!important;text-align:left!important}.phone-plus-popover>a:hover,.phone-plus-popover button:hover{background:var(--leaf-soft)!important}.phone-plus-lane-context{display:contents!important}
@container (max-height:44px){body[data-phone-calendar-v2="true"] .positioned-event .event-meta{display:none!important}body[data-phone-calendar-v2="true"] .positioned-event .event-time{display:none!important}body[data-phone-calendar-v2="true"] .positioned-event .event-card h4{margin:0!important}}
}
`;
}

function calendarPhoneCompactV2ClientScript() {
  const scale = PHONE_GRID_PIXELS_PER_HOUR / DESKTOP_GRID_PIXELS_PER_HOUR;
  return `(()=>{'use strict';
if(innerWidth>700)return;
const body=document.body;
const active=String(body.dataset.phoneActiveStaffId||'');
const bookingPath=String(body.dataset.phoneBookingPath||'');
const gridStart=${GRID_START_MINUTES},gridEnd=${GRID_END_MINUTES},pxPerHour=${PHONE_GRID_PIXELS_PER_HOUR},scale=${scale};
const all=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
function px(node,name){const raw=node.style.getPropertyValue(name);const value=parseFloat(raw);return Number.isFinite(value)?value:null;}
all('.time-rail span').forEach(node=>{const value=px(node,'--grid-top');if(value!=null)node.style.setProperty('--phone-grid-top',(value*scale)+'px');});
all('.positioned-event').forEach(node=>{const top=px(node,'--event-top'),height=px(node,'--event-height');if(top!=null)node.style.setProperty('--phone-event-top',(top*scale)+'px');if(height!=null)node.style.setProperty('--phone-event-height',Math.max(28,height*scale)+'px');});
const dayLanes=all('.day-view .lane[data-staff-id]');
let activeLane=dayLanes.find(node=>String(node.dataset.staffId)===active)||dayLanes[0]||null;
dayLanes.forEach(node=>node.dataset.phoneActivePractitioner=String(node===activeLane));
all('.month-day[data-item-count]').forEach(day=>{const link=day.querySelector('.month-day-link');if(!link||link.querySelector('.phone-month-density'))return;const count=Math.max(0,Number(day.dataset.itemCount)||0);const density=document.createElement('span');density.className='phone-month-density';density.setAttribute('aria-hidden','true');for(let i=0;i<Math.min(3,count);i+=1)density.appendChild(document.createElement('i'));if(count>3){const more=document.createElement('strong');more.textContent=String(count);density.appendChild(more);}link.appendChild(density);});
document.addEventListener('toggle',event=>{const opened=event.target;if(!opened?.matches?.('[data-phone-calendar-menu]')||!opened.open)return;all('[data-phone-calendar-menu][open]').forEach(menu=>{if(menu!==opened)menu.open=false;});},true);
function laneContext(column){const lane=column.closest('[data-staff-id][data-date]');if(!lane)return null;const staffId=Number(lane.dataset.staffId),date=lane.dataset.date;if(!Number.isSafeInteger(staffId)||staffId<1||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(date||'')))return null;return{staffId,date};}
function formatTime(minutes){const h=Math.floor(minutes/60),m=minutes%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');}
if(bookingPath){all('.day-view .time-column,.week-view .time-column').forEach(column=>{column.addEventListener('click',event=>{if(event.defaultPrevented||event.button>0||event.target.closest('a,button,.positioned-event,.event-card'))return;const context=laneContext(column);if(!context)return;const rect=column.getBoundingClientRect();if(rect.height<=0)return;const y=Math.max(0,Math.min(rect.height-1,event.clientY-rect.top));const raw=gridStart+(y/pxPerHour)*60;const snapped=Math.max(gridStart,Math.min(gridEnd-30,Math.round(raw/30)*30));const params=new URLSearchParams({date:context.date,time:formatTime(snapped),staff:String(context.staffId)});location.assign(bookingPath+'?'+params.toString());});});}
})();`;
}

function decoratePhoneCalendarV2(html, {
  model = {},
  basePath = '/calendar/read-only',
  bookingPath = '/calendar/book',
  bookingAllowed = false,
} = {}) {
  let output = String(html || '');
  if (!output.includes('<body') || !output.includes('<head')) return output;
  const active = resolveActiveStaff(model);
  const activeStaffId = positiveId(active?.id);
  const controls = renderPhoneCalendarControls(model, { basePath });
  const dock = renderPhoneCalendarDock(model, { basePath, bookingPath, bookingAllowed });
  const scriptPath = `${String(basePath || '/calendar/read-only').replace(/\/$/, '')}/phone-v2.js`;
  const bodyAttrs = ` data-phone-calendar-v2="true"${activeStaffId ? ` data-phone-active-staff-id="${activeStaffId}"` : ''}${bookingAllowed ? ` data-phone-booking-path="${escapeHtml(bookingPath)}"` : ''}`;
  output = output.replace('<body ', `<body${bodyAttrs} `);
  output = output.replace('</head>', `<style>${phoneCalendarV2Styles()}</style><script src="${escapeHtml(scriptPath)}" defer></script></head>`);
  output = output.replace('<div class="shell">', `<div class="shell">${controls}`);
  if (model?.view === 'week' && active) {
    const strip = `<div class="phone-week-practitioner-strip" data-phone-week-practitioner="${activeStaffId}"><span class="status-dot" aria-hidden="true"></span><strong>${escapeHtml(active.displayName || `Staff ${activeStaffId}`)}</strong></div>`;
    output = output.replace('<div class="time-grid week-time-grid">', `${strip}<div class="time-grid week-time-grid">`);
  }
  output = output.replace('<div class="footer-note">', `${dock}<div class="footer-note">`);
  return output;
}

module.exports = {
  PHONE_GRID_PIXELS_PER_HOUR,
  calendarHref,
  calendarPhoneCompactV2ClientScript,
  decoratePhoneCalendarV2,
  phoneCalendarV2Styles,
  renderPhoneCalendarControls,
  renderPhoneCalendarDock,
  resolveActiveStaff,
};
