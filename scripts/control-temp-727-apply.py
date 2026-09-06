from pathlib import Path
import re


def read(path):
    return Path(path).read_text()


def write(path, text):
    Path(path).write_text(text)


def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one exact match, found {count}: {old[:100]!r}')
    write(path, text.replace(old, new, 1))


def regex_once(path, pattern, replacement):
    text = read(path)
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f'{path}: expected one regex match, found {count}: {pattern[:100]!r}')
    write(path, updated)


# Calendar service: Week is the default user-facing view; Week/Month default to all
# server-permitted staff. Load the canonical ZA public-holiday month for informational
# date annotations without changing closure/availability authority.
replace_once(
    'src/services/calendarReadOnlyUx.js',
    "const view = String(value || 'day').trim().toLowerCase();",
    "const view = String(value || 'week').trim().toLowerCase();",
)
replace_once(
    'src/services/calendarReadOnlyUx.js',
    "function normalizeView(value) {",
    "async function listCanonicalPublicHolidays({ startKey, endKey } = {}) {\n"
    "  if (!DATE_KEY.test(String(startKey || '')) || !DATE_KEY.test(String(endKey || ''))) return [];\n"
    "  const result = await pool.query(`/* CalendarReadOnlyUx:public_holidays */\n"
    "    SELECT holiday_date, name, observed\n"
    "      FROM public_holidays\n"
    "     WHERE country_code='ZA'\n"
    "       AND holiday_date >= $1::date\n"
    "       AND holiday_date < $2::date\n"
    "     ORDER BY holiday_date`, [startKey, endKey]);\n"
    "  return (result.rows || []).map(row => ({\n"
    "    date: DATE_KEY.test(String(row.holiday_date || ''))\n"
    "      ? String(row.holiday_date)\n"
    "      : dateKeyFromDate(new Date(row.holiday_date)),\n"
    "    name: String(row.name || 'Public holiday'),\n"
    "    observed: row.observed === true,\n"
    "    source: 'public_holidays',\n"
    "  }));\n"
    "}\n\n"
    "function normalizeView(value) {",
)
replace_once(
    'src/services/calendarReadOnlyUx.js',
    "function createCalendarReadOnlyUxService({\n  listTimeline = schedulingEngine.listTimeline,\n  query = (text, params) => pool.query(text, params),\n} = {}) {",
    "function createCalendarReadOnlyUxService({\n  listTimeline = schedulingEngine.listTimeline,\n  query = (text, params) => pool.query(text, params),\n  listPublicHolidays = null,\n} = {}) {",
)
replace_once(
    'src/services/calendarReadOnlyUx.js',
    "    const visibleStaffSelection = normalizeVisibleStaffSelection(rawStaff);\n    const period = periodFor(view, dateKey);",
    "    const staffFilterMissing = rawStaff == null\n"
    "      || (Array.isArray(rawStaff) ? rawStaff.length === 0 : String(rawStaff).trim() === '');\n"
    "    const visibleStaffSelection = normalizeVisibleStaffSelection(\n"
    "      staffFilterMissing && (view === 'week' || view === 'month') ? 'all' : rawStaff,\n"
    "    );\n"
    "    const period = periodFor(view, dateKey);",
)
replace_once(
    'src/services/calendarReadOnlyUx.js',
    "    const timelineWithMobiles = await attachCanonicalClientMobiles(timeline, query);\n\n    const filtered = filterTimelineForVisibleStaff(timelineWithMobiles, visibleStaffSelection);",
    "    const timelineWithMobiles = await attachCanonicalClientMobiles(timeline, query);\n"
    "    const holidayFallback = (timelineWithMobiles.publicHolidays || timelineWithMobiles.closures || [])\n"
    "      .filter(item => item?.source === 'public_holidays' || item?.closureType === 'public_holiday')\n"
    "      .map(item => ({\n"
    "        date: String(item.date || item.holidayDate || '').slice(0, 10),\n"
    "        name: String(item.name || item.reason || 'Public holiday'),\n"
    "        observed: item.observed === true,\n"
    "        source: 'public_holidays',\n"
    "      }))\n"
    "      .filter(item => DATE_KEY.test(item.date));\n"
    "    let publicHolidays = holidayFallback;\n"
    "    if (typeof listPublicHolidays === 'function') {\n"
    "      try {\n"
    "        publicHolidays = await listPublicHolidays({\n"
    "          startKey: monthStartFor(dateKey),\n"
    "          endKey: addMonths(monthStartFor(dateKey), 1),\n"
    "        });\n"
    "      } catch (_holidayReadError) {\n"
    "        // Holiday annotation is informational. Canonical scheduling remains usable\n"
    "        // from the already-authorized SchedulingTimeline if this extra month read fails.\n"
    "      }\n"
    "    }\n\n"
    "    const filtered = filterTimelineForVisibleStaff(timelineWithMobiles, visibleStaffSelection);",
)
replace_once(
    'src/services/calendarReadOnlyUx.js',
    "      permittedStaff: filtered.permittedStaff,\n      authorizedTimeline: filtered.authorizedTimeline,",
    "      permittedStaff: filtered.permittedStaff,\n      publicHolidays,\n      authorizedTimeline: filtered.authorizedTimeline,",
)
replace_once(
    'src/services/calendarReadOnlyUx.js',
    "const service = createCalendarReadOnlyUxService();",
    "const service = createCalendarReadOnlyUxService({ listPublicHolidays: listCanonicalPublicHolidays });",
)
replace_once(
    'src/services/calendarReadOnlyUx.js',
    "  isSundayDateKey,\n};",
    "  isSundayDateKey,\n  listCanonicalPublicHolidays,\n};",
)

# User-facing Calendar hierarchy: remove Day from normal view selection and drill Month
# into Week focused on the selected date. Underlying Day rendering remains compatibility-only.
replace_once(
    'src/presentation/calendarReadOnlyUx.js',
    "const viewLinks = ['day', 'week', 'agenda', 'month'].map(view =>",
    "const viewLinks = ['week', 'agenda', 'month'].map(view =>",
)
replace_once(
    'src/presentation/calendarReadOnlyUx.js',
    "const dayHref = queryHref(basePath, 'day', day, visibleStaffIds, { activeStaffId: model.activeStaffId });",
    "const dayHref = queryHref(basePath, 'week', day, visibleStaffIds, { activeStaffId: model.activeStaffId });",
)

# Phone drawer: remain touch-safe but reveal more of the operating calendar behind it.
replace_once(
    'src/presentation/workspaceShell.js',
    "@media(max-width:700px){.workspace-nav{width:min(68vw,260px)}",
    "@media(max-width:700px){.workspace-nav{width:clamp(204px,56vw,220px)}",
)

# Phone Calendar V3: reuse #725's accepted presentation layer, but invert Week from
# six days × one active practitioner to one selected day × visible practitioners.
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    "function calendarHref(basePath, { view = 'day', date = '', staffId = null } = {}) {",
    "function calendarHref(basePath, { view = 'week', date = '', staffId = null } = {}) {",
)

helpers = r'''function visibleStaffIdsForPhone(model) {
  const ids = Array.isArray(model?.visibleStaffIds)
    ? model.visibleStaffIds.map(positiveId).filter(Boolean)
    : [];
  if (ids.length) return [...new Set(ids)];
  return [...new Set((model?.timeline?.staff || []).map(person => positiveId(person.id)).filter(Boolean))];
}

function calendarStaffHref(basePath, { view = 'week', date = '', staffIds = [], activeStaffId = null } = {}) {
  const params = new URLSearchParams({ view, date });
  for (const id of [...new Set((staffIds || []).map(positiveId).filter(Boolean))]) params.append('staff', String(id));
  const active = positiveId(activeStaffId);
  if (active) params.set('activeStaff', String(active));
  return `${basePath}?${params.toString()}`;
}

function publicHolidayCalendar(model) {
  const direct = Array.isArray(model?.publicHolidays) ? model.publicHolidays : [];
  const fallback = (model?.timeline?.closures || [])
    .filter(item => item?.source === 'public_holidays' || item?.closureType === 'public_holiday')
    .map(item => ({ date: item.date, name: item.reason, observed: item.observed }));
  const holidays = direct.length ? direct : fallback;
  const map = new Map();
  for (const holiday of holidays) {
    const key = String(holiday?.date || holiday?.holidayDate || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    map.set(key, {
      name: String(holiday?.name || holiday?.reason || 'Public holiday'),
      observed: holiday?.observed === true,
    });
  }
  return map;
}

function activePlannerDate(model) {
  const days = (model?.period?.dateKeys || []).filter(day => localDate(day)?.getUTCDay() !== 0);
  const requested = String(model?.dateKey || '');
  return days.includes(requested) ? requested : (days[0] || requested);
}

function phoneWeekDayLabel(value) {
  const date = localDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: BUSINESS_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
  }).format(date).replace(',', '');
}

function renderPhoneWeekPlannerHeader(model, { basePath = '/calendar/read-only' } = {}) {
  const days = (model?.period?.dateKeys || []).filter(day => localDate(day)?.getUTCDay() !== 0);
  const activeDate = activePlannerDate(model);
  const visibleIds = visibleStaffIdsForPhone(model);
  const active = positiveId(model?.activeStaffId) || visibleIds[0] || null;
  const rendered = new Set(visibleIds);
  const permitted = Array.isArray(model?.permittedStaff) ? model.permittedStaff : (model?.timeline?.staff || []);
  const dayLinks = days.map(day => `<a class="phone-week-date${day === activeDate ? ' active' : ''}" data-phone-week-date="${escapeHtml(day)}" href="${escapeHtml(calendarStaffHref(basePath, { view: 'week', date: day, staffIds: visibleIds, activeStaffId: active }))}"${day === activeDate ? ' aria-current="date"' : ''}>${escapeHtml(phoneWeekDayLabel(day))}</a>`).join('');
  const allActive = permitted.length > 0 && permitted.every(person => rendered.has(positiveId(person.id)));
  const staffButtons = permitted.map(person => {
    const id = positiveId(person.id);
    if (!id) return '';
    const isRendered = rendered.has(id);
    return `<button type="button" class="phone-week-staff-toggle${isRendered ? ' active' : ''}" data-phone-week-staff-id="${id}" data-phone-week-staff-rendered="${isRendered ? 'true' : 'false'}" aria-pressed="${isRendered ? 'true' : 'false'}">${escapeHtml(person.displayName || `Staff ${id}`)}</button>`;
  }).join('');
  return `<section class="phone-week-planner-header" data-phone-week-planner aria-label="Week planner"><nav class="phone-week-date-strip" aria-label="Week dates">${dayLinks}</nav><div class="phone-week-staff-strip" aria-label="Visible practitioners"><button type="button" class="phone-week-staff-toggle phone-week-staff-all${allActive ? ' active' : ''}" data-phone-week-staff-all aria-pressed="${allActive ? 'true' : 'false'}">All</button>${staffButtons}</div></section>`;
}

function clockMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value || ''));
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return Number.isFinite(minutes) ? minutes : null;
}

function instantDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function instantMinutes(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return Number(values.hour) * 60 + Number(values.minute);
}

function mergeIntervals(intervals) {
  const sorted = intervals
    .filter(interval => Array.isArray(interval) && Number.isFinite(interval[0]) && Number.isFinite(interval[1]) && interval[1] > interval[0])
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const interval of sorted) {
    const last = merged.at(-1);
    if (!last || interval[0] > last[1]) merged.push([...interval]);
    else last[1] = Math.max(last[1], interval[1]);
  }
  return merged;
}

function subtractInterval(intervals, removed) {
  if (!removed || removed[1] <= removed[0]) return intervals;
  const next = [];
  for (const interval of intervals) {
    if (removed[1] <= interval[0] || removed[0] >= interval[1]) {
      next.push(interval);
      continue;
    }
    if (removed[0] > interval[0]) next.push([interval[0], Math.min(removed[0], interval[1])]);
    if (removed[1] < interval[1]) next.push([Math.max(removed[1], interval[0]), interval[1]]);
  }
  return next;
}

function overlapMinutes(a, b) {
  return Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
}

function itemStaffIds(item) {
  if (Array.isArray(item?.staffIds)) return item.staffIds.map(positiveId).filter(Boolean);
  const id = positiveId(item?.staffId);
  return id ? [id] : [];
}

function phoneDayCapacity(model, day) {
  const timeline = model?.timeline || {};
  const staff = timeline.staff || [];
  const weekday = localDate(day)?.getUTCDay();
  const closed = (timeline.closures || []).some(item => String(item?.date || '').slice(0, 10) === day);
  if (closed || !Number.isInteger(weekday)) return { band: 'closed', ratio: null, label: 'Closed' };

  let nominalMinutes = 0;
  let freeMinutes = 0;
  for (const person of staff) {
    const staffId = positiveId(person.id);
    if (!staffId) continue;
    const base = (timeline.workingWindows || [])
      .filter(item => positiveId(item.staffId) === staffId && Number(item.dayOfWeek) === weekday)
      .map(item => [clockMinutes(item.startsLocal), clockMinutes(item.endsLocal)]);
    const exceptions = (timeline.scheduleExceptions || [])
      .filter(item => positiveId(item.staffId) === staffId && String(item.date || '').slice(0, 10) === day);
    const available = exceptions
      .filter(item => item.exceptionType === 'available' && item.startsLocal && item.endsLocal)
      .map(item => [clockMinutes(item.startsLocal), clockMinutes(item.endsLocal)]);
    let nominal = mergeIntervals([...base, ...available]);
    if (!nominal.length) continue;
    nominalMinutes += nominal.reduce((sum, interval) => sum + interval[1] - interval[0], 0);

    const allDayUnavailable = exceptions.some(item => item.exceptionType === 'unavailable' && !item.startsLocal && !item.endsLocal);
    let usable = allDayUnavailable ? mergeIntervals(available) : nominal.map(interval => [...interval]);
    for (const item of exceptions.filter(item => item.exceptionType === 'unavailable' && item.startsLocal && item.endsLocal)) {
      usable = subtractInterval(usable, [clockMinutes(item.startsLocal), clockMinutes(item.endsLocal)]);
    }
    for (const block of (timeline.blocks || []).filter(item => itemStaffIds(item).includes(staffId) && instantDateKey(item.startsAt) === day)) {
      usable = subtractInterval(usable, [instantMinutes(block.startsAt), instantMinutes(block.endsAt)]);
    }
    usable = mergeIntervals(usable);
    const usableMinutes = usable.reduce((sum, interval) => sum + interval[1] - interval[0], 0);
    let booked = 0;
    for (const appointment of (timeline.appointments || []).filter(item => itemStaffIds(item).includes(staffId) && instantDateKey(item.startsAt) === day)) {
      const appointmentInterval = [instantMinutes(appointment.startsAt), instantMinutes(appointment.endsAt)];
      booked += usable.reduce((sum, interval) => sum + overlapMinutes(interval, appointmentInterval), 0);
    }
    freeMinutes += Math.max(0, usableMinutes - booked);
  }

  if (nominalMinutes <= 0) return { band: 'closed', ratio: null, label: 'No scheduled capacity' };
  const ratio = Math.max(0, Math.min(1, 1 - (freeMinutes / nominalMinutes)));
  const band = ratio < 0.35 ? 'light' : ratio < 0.7 ? 'medium' : 'busy';
  const label = `${Math.round(ratio * 100)}% capacity used or unavailable`;
  return { band, ratio, label };
}

function decoratePhoneMonthCapacity(html, model) {
  if (model?.view !== 'month') return String(html || '');
  let output = String(html || '');
  const holidays = publicHolidayCalendar(model);
  for (const day of model?.period?.dateKeys || []) {
    const capacity = phoneDayCapacity(model, day);
    const holiday = holidays.get(day);
    const marker = `data-date="${escapeHtml(day)}" data-item-count="`;
    const holidayAttrs = holiday
      ? ` data-phone-public-holiday="${escapeHtml(holiday.name)}" data-phone-public-holiday-observed="${holiday.observed ? 'true' : 'false'}"`
      : '';
    output = output.replace(marker, `data-date="${escapeHtml(day)}" data-phone-capacity-band="${capacity.band}" data-phone-capacity-label="${escapeHtml(capacity.label)}"${holidayAttrs} data-item-count="`);
  }
  return output;
}

'''
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    "function buildMonthCells({ date, activeStaffId, basePath }) {",
    helpers + "function buildMonthCells({ model, date, activeStaffId, basePath }) {",
)
regex_once(
    'src/presentation/calendarPhoneCompactV2.js',
    r"function buildMonthCells\(\{ model, date, activeStaffId, basePath \}\) \{.*?\n\}\n\nfunction renderPhoneCalendarControls",
    r'''function buildMonthCells({ model, date, activeStaffId, basePath }) {
  const target = localDate(date);
  if (!target) return '';
  const year = target.getUTCFullYear();
  const month = target.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  const visibleIds = visibleStaffIdsForPhone(model);
  const holidays = publicHolidayCalendar(model);
  const cells = [];
  let started = false;
  for (let day = 1; day <= lastDay; day += 1) {
    const current = new Date(Date.UTC(year, month, day, 12));
    const weekday = current.getUTCDay();
    if (weekday === 0) continue;
    if (!started) {
      for (let blank = 1; blank < weekday; blank += 1) cells.push('<span class="phone-date-blank" aria-hidden="true"></span>');
      started = true;
    }
    const key = dateKey(current);
    const holiday = holidays.get(key);
    const href = calendarStaffHref(basePath, { view: 'week', date: key, staffIds: visibleIds, activeStaffId });
    const currentClass = key === date ? ' current' : '';
    const holidayLabel = holiday ? `, ${holiday.name}${holiday.observed ? ' observed' : ''}, public holiday` : '';
    cells.push(`<a class="phone-date-cell${currentClass}" href="${escapeHtml(href)}" aria-label="${escapeHtml(`${day}${holidayLabel}`)}"${key === date ? ' aria-current="date"' : ''}><span>${day}</span>${holiday ? `<span class="phone-date-holiday-dot" title="${escapeHtml(`Public holiday — ${holiday.name}${holiday.observed ? ' observed' : ''}`)}" aria-hidden="true"></span>` : ''}</a>`);
  }
  return cells.join('');
}

function renderPhoneCalendarControls''',
)
regex_once(
    'src/presentation/calendarPhoneCompactV2.js',
    r"function renderPhoneCalendarControls\(model, \{ basePath = '/calendar/read-only' \} = \{\}\) \{.*?\n\}\n\nfunction mutationEnabled",
    r'''function renderPhoneCalendarControls(model, { basePath = '/calendar/read-only' } = {}) {
  const active = resolveActiveStaff(model);
  const activeStaffId = positiveId(active?.id);
  const date = String(model?.dateKey || '');
  const view = model?.view === 'month' ? 'month' : 'week';
  const visibleIds = visibleStaffIdsForPhone(model);
  const target = localDate(date) || new Date();
  const previousMonth = operationalMonthAnchor(target.getUTCFullYear(), target.getUTCMonth() - 1);
  const nextMonth = operationalMonthAnchor(target.getUTCFullYear(), target.getUTCMonth() + 1);
  const viewOptions = ['week', 'month'].map(option => {
    const label = option[0].toUpperCase() + option.slice(1);
    const href = calendarStaffHref(basePath, { view: option, date, staffIds: visibleIds, activeStaffId });
    return `<a class="phone-view-option${view === option ? ' active' : ''}" data-phone-calendar-view="${option}" href="${escapeHtml(href)}"${view === option ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('');
  const staffOptions = (model?.permittedStaff || []).map(person => {
    const id = positiveId(person.id);
    if (!id) return '';
    const href = calendarStaffHref(basePath, { view, date, staffIds: visibleIds, activeStaffId: id });
    return `<a class="phone-staff-option${id === activeStaffId ? ' active' : ''}" data-phone-staff-id="${id}" href="${escapeHtml(href)}"${id === activeStaffId ? ' aria-current="true"' : ''}>${escapeHtml(person.displayName || `Staff ${id}`)}</a>`;
  }).join('');
  const previousHref = calendarStaffHref(basePath, { view, date: previousMonth, staffIds: visibleIds, activeStaffId });
  const nextHref = calendarStaffHref(basePath, { view, date: nextMonth, staffIds: visibleIds, activeStaffId });
  const monthCells = buildMonthCells({ model, date, activeStaffId, basePath });
  return `<section class="phone-calendar-v2-controls" data-phone-calendar-v2-controls aria-label="Phone Calendar controls">
    <details class="phone-date-menu" data-phone-calendar-menu>
      <summary aria-label="Choose date"><strong>${escapeHtml(monthLabel(date))}</strong><span aria-hidden="true">⌄</span></summary>
      <div class="phone-date-popover"><header><a href="${escapeHtml(previousHref)}" aria-label="Previous month">‹</a><strong>${escapeHtml(monthLabel(date, true))}</strong><a href="${escapeHtml(nextHref)}" aria-label="Next month">›</a></header><div class="phone-date-weekdays" aria-hidden="true"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div class="phone-date-grid">${monthCells}</div></div>
    </details>
    <details class="phone-view-menu" data-phone-calendar-menu><summary aria-label="Choose Calendar view"><strong>${escapeHtml(view[0].toUpperCase() + view.slice(1))}</strong><span aria-hidden="true">⌄</span></summary><nav>${viewOptions}</nav></details>
    ${active ? `<details class="phone-staff-menu" data-phone-calendar-menu><summary aria-label="Choose action practitioner"><span class="status-dot" aria-hidden="true"></span><strong data-phone-active-staff="${activeStaffId}">${escapeHtml(active.displayName || `Staff ${activeStaffId}`)}</strong><span aria-hidden="true">⌄</span></summary><nav>${staffOptions}</nav></details>` : ''}
  </section>`;
}

function mutationEnabled''',
)
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    "  const todayHref = calendarHref(basePath, { view: ['day', 'week', 'month'].includes(model?.view) ? model.view : 'day', date: businessToday(), staffId });",
    "  const todayHref = calendarStaffHref(basePath, { view: model?.view === 'month' ? 'month' : 'week', date: businessToday(), staffIds: visibleStaffIdsForPhone(model), activeStaffId: staffId });",
)

replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    ".phone-calendar-v2-controls,.phone-calendar-v2-dock,.phone-week-practitioner-strip{display:none}",
    ".phone-calendar-v2-controls,.phone-calendar-v2-dock,.phone-week-planner-header{display:none}",
)
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    "body[data-phone-calendar-v2=\"true\"] .workspace-main .week-time-grid{margin:0!important;max-height:calc(100dvh - 81px)!important;border:0!important;border-radius:0!important}",
    "body[data-phone-calendar-v2=\"true\"] .workspace-main .week-time-grid{margin:0!important;max-height:calc(100dvh - 137px)!important;border:0!important;border-radius:0!important}",
)
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    ".phone-week-practitioner-strip{display:flex;align-items:center;gap:5px;min-height:28px;padding:4px 7px;border-bottom:1px solid var(--line);background:#fafbf8;font-size:.66rem;font-weight:800}.phone-week-practitioner-strip .status-dot{flex:0 0 7px;width:7px;height:7px}",
    ".phone-week-planner-header{display:grid;gap:2px;border-bottom:1px solid var(--line);background:#fafbf8}.phone-week-date-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:2px;padding:2px}.phone-week-date{display:grid;place-items:center;min-width:0;min-height:44px;padding:3px 1px;border-radius:8px;color:var(--muted);font-size:.62rem;font-weight:800}.phone-week-date.active{background:var(--leaf-deep);color:#fff}.phone-week-staff-strip{display:flex;gap:3px;min-height:46px;padding:1px 3px 3px;overflow-x:auto;scrollbar-width:none}.phone-week-staff-strip::-webkit-scrollbar{display:none}.phone-week-staff-toggle{flex:0 0 auto;min-height:44px;padding:6px 9px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--muted);font:inherit;font-size:.66rem;font-weight:800;cursor:pointer}.phone-week-staff-toggle.active{border-color:var(--leaf);background:var(--leaf-soft);color:var(--leaf-deep)}",
)
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    "body[data-phone-calendar-v2=\"true\"] .workspace-main .week-time-grid .time-rail{width:32px!important;margin-top:38px!important}",
    "body[data-phone-calendar-v2=\"true\"] .workspace-main .week-time-grid .time-rail{width:32px!important;margin-top:44px!important}",
)
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    "body[data-phone-calendar-v2=\"true\"] .workspace-main .week-grid{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;min-width:0!important;width:100%!important;gap:0!important}",
    "body[data-phone-calendar-v2=\"true\"] .workspace-main .week-grid{display:grid!important;grid-template-columns:repeat(var(--phone-visible-staff-count,1),minmax(88px,1fr))!important;min-width:max(100%,calc(var(--phone-visible-staff-count,1) * 88px))!important;width:100%!important;gap:0!important}",
)
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    "body[data-phone-calendar-v2=\"true\"] .workspace-main .week-practitioner-lane[data-active-practitioner=\"false\"]{display:none!important}",
    "body[data-phone-calendar-v2=\"true\"] .workspace-main .week-day.week-practitioner-lane{display:none!important}body[data-phone-calendar-v2=\"true\"] .workspace-main .week-day.week-practitioner-lane[data-phone-active-day=\"true\"][data-phone-staff-visible=\"true\"]{display:block!important}",
)
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    "body[data-phone-calendar-v2=\"true\"] .workspace-main .week-day>header{height:38px!important;min-height:38px!important;padding:3px 1px!important;display:grid!important;place-items:center!important}",
    "body[data-phone-calendar-v2=\"true\"] .workspace-main .week-day>header{height:44px!important;min-height:44px!important;padding:3px 2px!important;display:grid!important;place-items:center!important}",
)
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    "body[data-phone-calendar-v2=\"true\"] .workspace-main .week-practitioner-name,body[data-phone-calendar-v2=\"true\"] .workspace-main .week-practitioner-hours,body[data-phone-calendar-v2=\"true\"] .workspace-main .week-day>header small,body[data-phone-calendar-v2=\"true\"] .workspace-main .week-day-month{display:none!important}",
    "body[data-phone-calendar-v2=\"true\"] .workspace-main .week-practitioner-hours,body[data-phone-calendar-v2=\"true\"] .workspace-main .week-day-date,body[data-phone-calendar-v2=\"true\"] .workspace-main .week-day>header small,body[data-phone-calendar-v2=\"true\"] .workspace-main .week-day-month{display:none!important}body[data-phone-calendar-v2=\"true\"] .workspace-main .week-practitioner-name{display:block!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;text-align:center!important;font-size:.64rem!important;line-height:1.05!important}",
)
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    ".phone-date-cell,.phone-date-blank{display:grid;place-items:center;min-height:44px;border-radius:8px;font-size:.72rem}.phone-date-cell.current{background:var(--leaf-deep);color:#fff;font-weight:850}",
    ".phone-date-cell,.phone-date-blank{display:grid;place-items:center;min-height:44px;border-radius:8px;font-size:.72rem}.phone-date-cell{position:relative}.phone-date-holiday-dot{position:absolute;left:50%;bottom:4px;width:5px;height:5px;border-radius:50%;background:#b6554f;transform:translateX(-50%)}.phone-date-cell.current{background:var(--leaf-deep);color:#fff;font-weight:850}.phone-date-cell.current .phone-date-holiday-dot{background:#fff}",
)
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    ".phone-month-density{display:flex;align-items:center;justify-content:center;gap:2px;min-height:12px}.phone-month-density i{display:block;width:4px;height:4px;border-radius:50%;background:var(--leaf)}.phone-month-density strong{margin-left:2px;font-size:.5rem;color:var(--muted)}",
    ".phone-month-density{display:flex;align-items:center;justify-content:center;min-height:12px}.phone-month-density i{display:block;width:7px;height:7px;border-radius:50%;background:#4f8b62}.phone-month-density[data-band=\"medium\"] i{background:#c28b3c}.phone-month-density[data-band=\"busy\"] i{background:#b6554f}.phone-month-density[data-band=\"closed\"] i{background:#8a918d}",
)

planner_script = r'''const weekLanes=all('[data-week-practitioner-lane]');
if(weekLanes.length){
  const activeDay=String(body.dataset.phoneActiveDate||weekLanes[0]?.dataset.date||'');
  const renderedStaff=new Set(weekLanes.map(node=>String(node.dataset.staffId||'')).filter(Boolean));
  let visibleStaff=new Set(renderedStaff);
  const grid=document.querySelector('.week-grid');
  const staffButtons=all('[data-phone-week-staff-id]');
  const allButton=document.querySelector('[data-phone-week-staff-all]');
  const permittedIds=staffButtons.map(button=>String(button.dataset.phoneWeekStaffId||'')).filter(Boolean);
  const selectedIds=()=>Array.from(visibleStaff);
  function withStaff(href,ids,activeOverride){const url=new URL(href,location.origin);url.searchParams.delete('staff');ids.forEach(id=>url.searchParams.append('staff',id));if(activeOverride)url.searchParams.set('activeStaff',String(activeOverride));return url.pathname+'?'+url.searchParams.toString();}
  function syncPlannerLinks(){const ids=selectedIds();all('[data-phone-week-date],.phone-view-option,.phone-date-cell,.phone-today-fab').forEach(node=>node.setAttribute('href',withStaff(node.getAttribute('href')||location.href,ids)));all('.phone-staff-option').forEach(node=>node.setAttribute('href',withStaff(node.getAttribute('href')||location.href,ids,node.dataset.phoneStaffId)));}
  function syncUrl(){const url=new URL(location.href);url.searchParams.delete('staff');selectedIds().forEach(id=>url.searchParams.append('staff',id));history.replaceState(null,'',url.pathname+'?'+url.searchParams.toString());}
  function applyPlanner(){weekLanes.forEach(node=>{node.dataset.phoneActiveDay=String(node.dataset.date===activeDay);node.dataset.phoneStaffVisible=String(visibleStaff.has(String(node.dataset.staffId)));});if(grid)grid.style.setProperty('--phone-visible-staff-count',String(Math.max(1,visibleStaff.size)));staffButtons.forEach(button=>{const selected=visibleStaff.has(String(button.dataset.phoneWeekStaffId));button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});if(allButton){const allSelected=permittedIds.length>0&&permittedIds.every(id=>visibleStaff.has(id));allButton.classList.toggle('active',allSelected);allButton.setAttribute('aria-pressed',String(allSelected));}syncUrl();syncPlannerLinks();}
  function reloadWith(ids){const url=new URL(location.href);url.searchParams.set('view','week');url.searchParams.set('date',activeDay);url.searchParams.delete('staff');ids.forEach(id=>url.searchParams.append('staff',id));location.assign(url.pathname+'?'+url.searchParams.toString());}
  staffButtons.forEach(button=>button.addEventListener('click',()=>{const id=String(button.dataset.phoneWeekStaffId||'');if(!id)return;if(!renderedStaff.has(id)){reloadWith([...new Set([...selectedIds(),id])]);return;}if(visibleStaff.has(id)){if(visibleStaff.size<=1)return;visibleStaff.delete(id);}else visibleStaff.add(id);applyPlanner();}));
  if(allButton)allButton.addEventListener('click',()=>{if(permittedIds.some(id=>!renderedStaff.has(id))){reloadWith(permittedIds);return;}visibleStaff=new Set(renderedStaff);applyPlanner();});
  applyPlanner();
}
'''
replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    "dayLanes.forEach(node=>node.dataset.phoneActivePractitioner=String(node===activeLane));\nall('.month-day[data-item-count]').forEach(day=>{const link=day.querySelector('.month-day-link');if(!link||link.querySelector('.phone-month-density'))return;const count=Math.max(0,Number(day.dataset.itemCount)||0);const density=document.createElement('span');density.className='phone-month-density';density.setAttribute('aria-hidden','true');for(let i=0;i<Math.min(3,count);i+=1)density.appendChild(document.createElement('i'));if(count>3){const more=document.createElement('strong');more.textContent=String(count);density.appendChild(more);}link.appendChild(density);});",
    "dayLanes.forEach(node=>node.dataset.phoneActivePractitioner=String(node===activeLane));\n" + planner_script + "all('.month-day[data-phone-capacity-band]').forEach(day=>{const link=day.querySelector('.month-day-link');if(!link||link.querySelector('.phone-month-density'))return;const density=document.createElement('span');density.className='phone-month-density';density.dataset.band=String(day.dataset.phoneCapacityBand||'light');density.title=String(day.dataset.phoneCapacityLabel||'Capacity');density.setAttribute('aria-hidden','true');density.appendChild(document.createElement('i'));link.appendChild(density);});",
)

replace_once(
    'src/presentation/calendarPhoneCompactV2.js',
    "  const bodyAttrs = ` data-phone-calendar-v2=\"true\"${activeStaffId ? ` data-phone-active-staff-id=\"${activeStaffId}\"` : ''}${bookingAllowed ? ` data-phone-booking-path=\"${escapeHtml(bookingPath)}\"` : ''}`;",
    "  const plannerDate = activePlannerDate(model);\n  const bodyAttrs = ` data-phone-calendar-v2=\"true\"${activeStaffId ? ` data-phone-active-staff-id=\"${activeStaffId}\"` : ''}${plannerDate ? ` data-phone-active-date=\"${escapeHtml(plannerDate)}\"` : ''}${bookingAllowed ? ` data-phone-booking-path=\"${escapeHtml(bookingPath)}\"` : ''}`;",
)
regex_once(
    'src/presentation/calendarPhoneCompactV2.js',
    r"  if \(model\?\.view === 'week' && active\) \{.*?\n  \}\n  output = output\.replace\('<div class=\"footer-note\">',",
    r'''  if (model?.view === 'week') {
    const plannerHeader = renderPhoneWeekPlannerHeader(model, { basePath });
    output = output.replace('<div class="time-grid week-time-grid">', `${plannerHeader}<div class="time-grid week-time-grid">`);
  }
  output = decoratePhoneMonthCapacity(output, model);
  output = output.replace('<div class="footer-note">',''',
)

# Focused V3 tests. These exercise the new hierarchy while retaining #725's safety contract.
Path('tests/calendar-phone-week-planner-v3.test.js').write_text(r'''const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createCalendarReadOnlyUxService,
  normalizeView,
} = require('../src/services/calendarReadOnlyUx');
const {
  decoratePhoneCalendarV2,
  renderPhoneCalendarControls,
  phoneCalendarV2Styles,
  calendarPhoneCompactV2ClientScript,
} = require('../src/presentation/calendarPhoneCompactV2');
const { renderCalendarPage } = require('../src/presentation/calendarReadOnlyUx');
const { workspaceShellStyles } = require('../src/presentation/workspaceShell');

const STAFF = [
  { id: 51, displayName: 'Amber Room', schedulingType: 'regular' },
  { id: 52, displayName: 'Birch Room', schedulingType: 'regular' },
  { id: 53, displayName: 'Cedar Room', schedulingType: 'regular' },
];

function timeline() {
  const appointments = [{
    id: 1, kind: 'appointment', canonical: true, staffIds: [51],
    startsAt: '2026-09-11T08:00:00.000Z', endsAt: '2026-09-11T09:00:00.000Z',
    clientName: 'Client', serviceName: 'Treatment', status: 'scheduled',
  }];
  return {
    staff: STAFF,
    workingWindows: STAFF.flatMap(person => [1,2,3,4,5,6].map(dayOfWeek => ({
      staffId: person.id, dayOfWeek, startsLocal: '08:00:00', endsLocal: '17:00:00',
    }))),
    scheduleExceptions: [], recurringClosures: [], closures: [], appointments,
    blocks: [], leave: [], externalBusy: [], events: appointments,
  };
}

function model(view = 'week') {
  return {
    view,
    dateKey: '2026-09-11',
    period: view === 'month'
      ? { dateKeys: ['2026-09-11', '2026-09-24'], startKey: '2026-09-01' }
      : { dateKeys: ['2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-12'] },
    activeStaffId: 51,
    visibleStaffIds: [51,52,53],
    permittedStaff: STAFF,
    publicHolidays: [{ date: '2026-09-24', name: 'Heritage Day', observed: false, source: 'public_holidays' }],
    timeline: timeline(),
    mutationCapability: { enabled: true, operations: ['calendar_block:manage','operational_leave:manage'], calendarScope: 'all_business' },
  };
}

test('Week is the default view and Week/Month default to all server-permitted practitioners', async () => {
  assert.equal(normalizeView(), 'week');
  const service = createCalendarReadOnlyUxService({
    listTimeline: async () => timeline(),
    query: async (_text, params) => ({ rows: Array.isArray(params?.[0]) ? params[0].map(id => ({ appointment_id: id, client_mobile: '27820000000' })) : [] }),
    listPublicHolidays: async () => [{ date: '2026-09-24', name: 'Heritage Day', observed: false, source: 'public_holidays' }],
  });
  const week = await service.buildModel({ date: '2026-09-11', viewer: { calendarScope: 'all_business' } });
  assert.equal(week.view, 'week');
  assert.deepEqual(week.visibleStaffIds, [51,52,53]);
  assert.equal(week.publicHolidays[0].name, 'Heritage Day');
  const month = await service.buildModel({ view: 'month', date: '2026-09-11', viewer: { calendarScope: 'all_business' } });
  assert.deepEqual(month.visibleStaffIds, [51,52,53]);
});

test('normal Calendar selectors retire Day while compatibility rendering remains available', () => {
  const weekHtml = renderCalendarPage({ ...model('week'), readOnly: true, timezone: 'Africa/Johannesburg' }, { basePath: '/calendar/read-only' });
  assert.doesNotMatch(weekHtml, /data-calendar-view-option="day"/);
  assert.match(weekHtml, /data-calendar-view-option="week"/);
  assert.match(weekHtml, /data-calendar-view-option="month"/);
  const dayHtml = renderCalendarPage({ ...model('day'), period: { dateKeys: ['2026-09-11'], startKey: '2026-09-11', previousAnchor: '2026-09-10', nextAnchor: '2026-09-12' }, readOnly: true, timezone: 'Africa/Johannesburg' }, { basePath: '/calendar/read-only' });
  assert.match(dayHtml, /data-view="day"/);
});

test('Phone controls expose Week and Month only, preserve all visible staff, and annotate canonical public holidays', () => {
  const html = renderPhoneCalendarControls(model('week'), { basePath: '/calendar/read-only' });
  assert.doesNotMatch(html, /data-phone-calendar-view="day"/);
  assert.match(html, /data-phone-calendar-view="week"/);
  assert.match(html, /data-phone-calendar-view="month"/);
  assert.match(html, /staff=51&amp;staff=52&amp;staff=53&amp;activeStaff=52/);
  assert.match(html, /Public holiday — Heritage Day/);
  assert.match(html, /view=week&amp;date=2026-09-24/);
});

test('Phone Week Planner renders Mon-Sat strip and all permitted practitioner toggles without creating scheduling authority', () => {
  const source = '<!doctype html><html><head></head><body data-calendar-view="week"><div class="shell"><main class="calendar-view week-view"><div class="time-grid week-time-grid"><div class="week-grid"></div></div></main><div class="footer-note">footer</div></div></body></html>';
  const html = decoratePhoneCalendarV2(source, { model: model('week'), basePath: '/calendar/read-only', bookingAllowed: false });
  assert.match(html, /data-phone-week-planner/);
  assert.equal((html.match(/data-phone-week-date=/g) || []).length, 6);
  assert.equal((html.match(/data-phone-week-staff-id=/g) || []).length, 3);
  assert.match(html, /data-phone-active-date="2026-09-11"/);
  assert.match(html, /data-phone-week-staff-all/);
  const script = calendarPhoneCompactV2ClientScript();
  assert.match(script, /phoneVisibleStaffCount|--phone-visible-staff-count/);
  assert.match(script, /if\(visibleStaff\.size<=1\)return/);
  assert.doesNotMatch(script, /fetch\(/);
});

test('Phone Month receives one capacity band per date and retains public-holiday annotation separately from closure authority', () => {
  const source = '<!doctype html><html><head></head><body data-calendar-view="month"><div class="shell"><main class="calendar-view month-view"><section class="month-day" data-date="2026-09-11" data-item-count="1"><a class="month-day-link"></a></section><section class="month-day" data-date="2026-09-24" data-item-count="0"><a class="month-day-link"></a></section></main><div class="footer-note">footer</div></div></body></html>';
  const html = decoratePhoneCalendarV2(source, { model: model('month'), basePath: '/calendar/read-only', bookingAllowed: false });
  assert.match(html, /data-phone-capacity-band="(?:light|medium|busy|closed)"/);
  assert.match(html, /data-phone-public-holiday="Heritage Day"/);
  assert.doesNotMatch(html, /data-phone-public-holiday="Heritage Day"[^>]*data-kind="clinic_closure"/);
});

test('Phone Week layout is practitioner-column based and drawer is materially narrower than #725', () => {
  const css = phoneCalendarV2Styles();
  assert.match(css, /--phone-visible-staff-count/);
  assert.match(css, /data-phone-active-day="true"\]\[data-phone-staff-visible="true"\]/);
  assert.match(css, /phone-week-date-strip/);
  assert.match(css, /phone-week-staff-toggle/);
  const shellCss = workspaceShellStyles();
  assert.match(shellCss, /width:clamp\(204px,56vw,220px\)/);
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'presentation', 'calendarReadOnlyUx.js'), 'utf8');
  assert.match(source, /queryHref\(basePath, 'week', day, visibleStaffIds/);
});
''')

# Supersede only the #725 assertions whose user-facing behavior is intentionally replaced.
replace_once(
    'tests/calendar-phone-compact-v2-p1.test.js',
    "  assert.match(html, /data-phone-calendar-view=\"day\"/);",
    "  assert.doesNotMatch(html, /data-phone-calendar-view=\"day\"/);",
)
replace_once(
    'tests/calendar-phone-compact-v2-p1.test.js',
    "  assert.match(html, /data-phone-active-staff=\"22\">Christel/);\n  assert.match(html, /view=week&amp;date=2026-09-05&amp;staff=11&amp;activeStaff=11/);",
    "  assert.match(html, /data-phone-active-staff=\"22\">Christel/);\n  assert.match(html, /view=week&amp;date=2026-09-05&amp;staff=11&amp;staff=22&amp;activeStaff=11/);",
)
replace_once(
    'tests/calendar-phone-compact-v2-p1.test.js',
    "  assert.match(html, /data-phone-week-practitioner=\"22\"[\\s\\S]*Christel/);",
    "  assert.match(html, /data-phone-week-planner/);\n  assert.match(html, /data-phone-week-staff-id=\"22\"/);",
)
replace_once(
    'tests/calendar-view-parity-month-v1.test.js',
    "  assert.match(html, /view=day&amp;date=2026-09-18&amp;staff=21&amp;staff=22&amp;staff=23/);",
    "  assert.match(html, /view=week&amp;date=2026-09-18&amp;staff=21&amp;staff=22&amp;staff=23/);",
)
replace_once(
    'tests/calendar-readonly-ux.test.js',
    "  assert.match(html, />Day<|>Week<|>Agenda</);",
    "  assert.doesNotMatch(html, /data-calendar-view-option=\"day\"/);\n  assert.match(html, />Week<|>Agenda</);",
)

# Keep the existing CI proof script for now; exact-head CI will identify any remaining
# superseded browser assumptions, which will then be corrected against real rendered geometry.

# Temporary execution artifacts must not survive the implementation commit.
Path('scripts/control-temp-727-apply.py').unlink(missing_ok=True)
Path('.github/workflows/control-temp-727-apply.yml').unlink(missing_ok=True)
