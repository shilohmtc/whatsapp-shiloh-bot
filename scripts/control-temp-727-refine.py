from pathlib import Path


def read(path):
    return Path(path).read_text()


def write(path, text):
    Path(path).write_text(text)


def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old[:120]!r}')
    write(path, text.replace(old, new, 1))


def replace_section(path, start, end, new):
    text = read(path)
    start_at = text.find(start)
    if start_at < 0:
        raise RuntimeError(f'{path}: missing section start {start[:120]!r}')
    end_at = text.find(end, start_at)
    if end_at < 0:
        raise RuntimeError(f'{path}: missing section end {end[:120]!r}')
    write(path, text[:start_at] + new + text[end_at:])


presentation = 'src/presentation/calendarPhoneCompactV2.js'
replace_once(
    presentation,
    "  function reloadWith(ids){const url=new URL(location.href);url.searchParams.set('view','week');url.searchParams.set('date',activeDay);url.searchParams.delete('staff');ids.forEach(id=>url.searchParams.append('staff',id));location.assign(url.pathname+'?'+url.searchParams.toString());}",
    "  function reloadWith(ids,activeOverride){const url=new URL(location.href);url.searchParams.set('view','week');url.searchParams.set('date',activeDay);url.searchParams.delete('staff');ids.forEach(id=>url.searchParams.append('staff',id));if(activeOverride)url.searchParams.set('activeStaff',String(activeOverride));location.assign(url.pathname+'?'+url.searchParams.toString());}",
)
replace_once(
    presentation,
    "  staffButtons.forEach(button=>button.addEventListener('click',()=>{const id=String(button.dataset.phoneWeekStaffId||'');if(!id)return;if(!renderedStaff.has(id)){reloadWith([...new Set([...selectedIds(),id])]);return;}if(visibleStaff.has(id)){if(visibleStaff.size<=1)return;visibleStaff.delete(id);}else visibleStaff.add(id);applyPlanner();}));",
    "  staffButtons.forEach(button=>button.addEventListener('click',()=>{const id=String(button.dataset.phoneWeekStaffId||'');if(!id)return;if(!renderedStaff.has(id)){reloadWith([...new Set([...selectedIds(),id])]);return;}if(visibleStaff.has(id)){if(visibleStaff.size<=1)return;visibleStaff.delete(id);if(String(body.dataset.phoneActiveStaffId||'')===id){const next=selectedIds()[0]||'';reloadWith(selectedIds(),next);return;}}else visibleStaff.add(id);applyPlanner();}));",
)
replace_once(
    presentation,
    'body[data-phone-calendar-v2="true"] .workspace-main .week-day-date{display:grid!important;place-items:center!important;gap:0!important;line-height:1!important}body[data-phone-calendar-v2="true"] .workspace-main .week-day-weekday{font-size:.45rem!important}body[data-phone-calendar-v2="true"] .workspace-main .week-day-number{font-size:.68rem!important}\n',
    '',
)

unit_test = 'tests/calendar-phone-week-planner-v3.test.js'
replace_once(
    unit_test,
    "  assert.match(script, /if\\(visibleStaff\\.size<=1\\)return/);\n  assert.doesNotMatch(script, /fetch\\(/);",
    "  assert.match(script, /if\\(visibleStaff\\.size<=1\\)return/);\n  assert.match(script, /body\\.dataset\\.phoneActiveStaffId/);\n  assert.match(script, /reloadWith\\(selectedIds\\(\\),next\\)/);\n  assert.doesNotMatch(script, /fetch\\(/);",
)
replace_once(
    unit_test,
    "  assert.match(css, /phone-week-staff-toggle/);\n  const shellCss = workspaceShellStyles();",
    "  assert.match(css, /phone-week-staff-toggle/);\n  assert.doesNotMatch(css, /\\.week-day-date\\{display:grid!important/);\n  const shellCss = workspaceShellStyles();",
)

proof = 'scripts/calendar-spatial-phone-week-browser-proof.js'
replace_once(proof, "const OUT_DIR = path.join(process.cwd(), 'artifacts', 'calendar-goldie-density-phone-shell-p1');", "const OUT_DIR = path.join(process.cwd(), 'artifacts', 'calendar-phone-week-planner-v3');")
replace_once(proof, "throw new Error('CI must provide Chrome for authenticated Phone Calendar V2 proof');", "throw new Error('CI must provide Chrome for authenticated Phone Week Planner V3 proof');")
replace_once(proof, "console.log('Chrome not installed; authenticated Phone Calendar V2 proof is CI-only.');", "console.log('Chrome not installed; authenticated Phone Week Planner V3 proof is CI-only.');")
replace_once(proof, "throw new Error('Timed out waiting for authenticated Phone Calendar V2 proof');", "throw new Error('Timed out waiting for authenticated Phone Week Planner V3 proof');")
replace_once(
    proof,
    "    async query(_text, params) {\n      return { rows: (params?.[0] || []).map(id => ({ appointment_id: id, client_mobile: '27820000000' })) };\n    },\n  });",
    "    async query(_text, params) {\n      return { rows: (params?.[0] || []).map(id => ({ appointment_id: id, client_mobile: '27820000000' })) };\n    },\n    async listPublicHolidays() {\n      return [{ date: '2026-09-24', name: 'Heritage Day', observed: false, source: 'public_holidays' }];\n    },\n  });",
)

# Retire the old Phone Day acceptance block; Day remains compatibility-only and is no longer a normal surface.
day_start = "    await navigate(`${origin}/calendar/read-only?view=day&date=${DATE_KEY}&staff=52&activeStaff=52`, '.day-time-grid');\n"
week_start = "    await navigate(`${origin}/calendar/read-only?view=week&date=${DATE_KEY}&staff=51&staff=52&staff=53&activeStaff=51`, '.week-grid');\n"
replace_section(proof, day_start, week_start, '')

# Replace the superseded six-days/one-practitioner Phone proof with the V3 one-day/all-practitioners planner proof.
plus_open = "    await evaluate(cdp, `document.querySelector('.phone-plus-menu>summary').click();true`);\n"
new_week = r'''    await navigate(`${origin}/calendar/read-only?date=${DATE_KEY}`, '.week-grid');
    await poll(() => evaluate(cdp, `document.body.dataset.phoneActiveDate`), value => value === DATE_KEY);
    const weekMetrics = await evaluate(cdp, `(() => {
      const visible=node=>{if(!node)return false;const style=getComputedStyle(node),rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;};
      const scroller=document.querySelector('.week-time-grid');
      const grid=document.querySelector('.week-grid');
      const lanes=Array.from(document.querySelectorAll('[data-week-practitioner-lane]'));
      const visibleLanes=lanes.filter(visible);
      const visibleColumns=visibleLanes.map(node=>node.querySelector('.time-column')).filter(Boolean);
      const dateButtons=Array.from(document.querySelectorAll('[data-phone-week-date]'));
      const staffButtons=Array.from(document.querySelectorAll('[data-phone-week-staff-id]'));
      const allButton=document.querySelector('[data-phone-week-staff-all]');
      const plus=document.querySelector('.phone-plus-menu>summary');
      const today=document.querySelector('.phone-today-fab');
      const menuToggle=document.querySelector('[data-workspace-drawer-toggle]');
      const calendar=document.querySelector('.week-time-grid');
      const frame=document.querySelector('.workspace-frame');
      const columnTops=visibleColumns.map(node=>node.getBoundingClientRect().top);
      const columnHeights=visibleColumns.map(node=>node.getBoundingClientRect().height);
      return {
        viewport:{width:innerWidth,height:innerHeight,screenWidth:screen.width,screenHeight:screen.height},
        rootScrollWidth:document.documentElement.scrollWidth,
        weekColumns:getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
        weekScrollerClientWidth:scroller?.clientWidth||0,
        weekScrollerScrollWidth:scroller?.scrollWidth||0,
        firstColumnWidth:visibleLanes[0]?.getBoundingClientRect().width||0,
        visibleColumns:visibleLanes.length,
        visibleStaffIds:Array.from(new Set(visibleLanes.map(node=>node.dataset.staffId))),
        visibleDates:Array.from(new Set(visibleLanes.map(node=>node.dataset.date))),
        allStaffIds:Array.from(new Set(lanes.map(node=>node.dataset.staffId))),
        sundayColumns:Array.from(document.querySelectorAll('.week-day')).filter(node=>new Date(node.dataset.date+'T12:00:00Z').getUTCDay()===0).length,
        plannerVisible:visible(document.querySelector('[data-phone-week-planner]')),
        dateButtonCount:dateButtons.length,
        activeDateButtons:dateButtons.filter(node=>node.classList.contains('active')).map(node=>node.dataset.phoneWeekDate),
        staffNames:visibleLanes.map(node=>node.querySelector('.week-practitioner-name')?.textContent.trim()||''),
        visibleRepeatedDateHeaders:visibleLanes.flatMap(node=>Array.from(node.querySelectorAll('.week-day-date'))).filter(visible).length,
        allSelected:allButton?.classList.contains('active')||false,
        minStaffToggleHeight:Math.min(...[allButton,...staffButtons].filter(Boolean).map(node=>node.getBoundingClientRect().height)),
        actionStaffId:document.body.dataset.phoneActiveStaffId||'',
        activeStaffName:document.querySelector('[data-phone-active-staff]')?.textContent.trim()||'',
        currentView:document.querySelector('.phone-view-menu>summary strong')?.textContent.trim()||'',
        normalPhoneViews:Array.from(document.querySelectorAll('[data-phone-calendar-view]')).map(node=>node.dataset.phoneCalendarView),
        maxColumnTopDelta:columnTops.length?Math.max(...columnTops)-Math.min(...columnTops):0,
        minColumnHeight:columnHeights.length?Math.min(...columnHeights):0,
        maxColumnHeight:columnHeights.length?Math.max(...columnHeights):0,
        plusVisible:visible(plus),
        plusWidth:plus?.getBoundingClientRect().width||0,
        plusHeight:plus?.getBoundingClientRect().height||0,
        todayVisible:visible(today),
        todayHeight:today?.getBoundingClientRect().height||0,
        drawerRight:document.querySelector('[data-workspace-navigation-drawer]')?.getBoundingClientRect().right||0,
        menuToggleHeight:menuToggle?.getBoundingClientRect().height||0,
        framePaddingBottom:frame?parseFloat(getComputedStyle(frame).paddingBottom)||0:0,
        calendarViewportShare:calendar?Number(((innerHeight-calendar.getBoundingClientRect().top)/innerHeight).toFixed(3)):0,
      };
    })()`);
    assert.deepEqual(weekMetrics.viewport, { width: 390, height: 844, screenWidth: 390, screenHeight: 844 });
    assert.ok(weekMetrics.rootScrollWidth <= 391, 'Phone Week Planner leaked horizontal overflow');
    assert.equal(weekMetrics.weekColumns, 3);
    assert.equal(weekMetrics.visibleColumns, 3);
    assert.deepEqual(weekMetrics.visibleStaffIds, ['51', '52', '53']);
    assert.deepEqual(weekMetrics.visibleDates, [DATE_KEY]);
    assert.deepEqual(weekMetrics.allStaffIds, ['51', '52', '53']);
    assert.deepEqual(weekMetrics.staffNames, ['Amber Room', 'Birch Room', 'Cedar Room']);
    assert.ok(weekMetrics.firstColumnWidth >= 88, `Phone Week practitioner column is too narrow: ${weekMetrics.firstColumnWidth}px`);
    assert.ok(weekMetrics.weekScrollerScrollWidth <= weekMetrics.weekScrollerClientWidth + 2, 'Phone Week Planner requires horizontal panning');
    assert.equal(weekMetrics.sundayColumns, 0);
    assert.equal(weekMetrics.plannerVisible, true);
    assert.equal(weekMetrics.dateButtonCount, 6);
    assert.deepEqual(weekMetrics.activeDateButtons, [DATE_KEY]);
    assert.equal(weekMetrics.visibleRepeatedDateHeaders, 0);
    assert.equal(weekMetrics.allSelected, true);
    assert.ok(weekMetrics.minStaffToggleHeight >= 44, 'Phone Week practitioner toggle is below 44px');
    assert.equal(weekMetrics.actionStaffId, '51');
    assert.equal(weekMetrics.activeStaffName, 'Amber Room');
    assert.equal(weekMetrics.currentView, 'Week');
    assert.deepEqual(weekMetrics.normalPhoneViews, ['week', 'month']);
    assert.ok(weekMetrics.maxColumnTopDelta <= 1, 'Phone Week practitioner time columns are not vertically aligned');
    assert.ok(weekMetrics.minColumnHeight >= 778 && weekMetrics.maxColumnHeight <= 782, 'Phone Week does not use the 60px/hour compact grid');
    assert.equal(weekMetrics.plusVisible, true);
    assert.ok(weekMetrics.plusWidth >= 44 && weekMetrics.plusHeight >= 44, 'Phone + launcher is below 44px');
    assert.equal(weekMetrics.todayVisible, true);
    assert.ok(weekMetrics.todayHeight >= 44, 'Phone Today control is below 44px');
    assert.ok(weekMetrics.drawerRight <= 1, 'Closed Phone drawer remains on-screen');
    assert.ok(weekMetrics.menuToggleHeight >= 44, 'Phone menu toggle is below 44px');
    assert.equal(weekMetrics.framePaddingBottom, 0, 'Phone shell still reserves persistent bottom-navigation space');
    assert.ok(weekMetrics.calendarViewportShare >= 0.76, `Phone Week calendar receives only ${weekMetrics.calendarViewportShare * 100}% of the viewport`);
    screenshots.push({ ...(await capture('phone-week-planner-all-practitioners')), viewport: weekMetrics.viewport, metrics: weekMetrics });

'''
replace_section(proof, week_start, plus_open, new_week)

replace_once(proof, "    assert.ok(drawerMetrics.width <= 261, `Phone drawer is wider than the compact #725 contract: ${drawerMetrics.width}px`);", "    assert.ok(drawerMetrics.width >= 203 && drawerMetrics.width <= 221, `Phone drawer missed the #727 204–220px target: ${drawerMetrics.width}px`);")
replace_once(proof, "screenshots.push({ ...(await capture('phone-compact-direct-drawer')), viewport: { width: 390, height: 844 }, metrics: drawerMetrics });", "screenshots.push({ ...(await capture('phone-narrow-direct-drawer')), viewport: { width: 390, height: 844 }, metrics: drawerMetrics });")

switch_start = "    await evaluate(cdp, `document.querySelector('.phone-staff-menu>summary').click();true`);\n"
empty_click = "    await evaluate(cdp, `(() => {\n      const column=document.querySelector('[data-week-practitioner-lane][data-date=\"2026-09-07\"][data-staff-id=\"52\"] .time-column');\n"
new_switch = r'''    await evaluate(cdp, `document.querySelector('[data-phone-week-staff-id="53"]').click();true`);
    await poll(() => evaluate(cdp, `Array.from(document.querySelectorAll('[data-week-practitioner-lane]')).filter(node=>getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0).length`), value => value === 2);
    const hiddenMetrics = await evaluate(cdp, `(() => {
      const visible=node=>getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0;
      const lanes=Array.from(document.querySelectorAll('[data-week-practitioner-lane]')).filter(visible);
      return {
        visibleStaffIds:lanes.map(node=>node.dataset.staffId),
        minWidth:Math.min(...lanes.map(node=>node.getBoundingClientRect().width)),
        allSelected:document.querySelector('[data-phone-week-staff-all]')?.classList.contains('active')||false,
      };
    })()`);
    assert.deepEqual(hiddenMetrics.visibleStaffIds, ['51', '52']);
    assert.ok(hiddenMetrics.minWidth > weekMetrics.firstColumnWidth, 'Remaining practitioner columns did not expand after hiding a colleague');
    assert.equal(hiddenMetrics.allSelected, false);
    screenshots.push({ ...(await capture('phone-week-hide-practitioner')), viewport: { width: 390, height: 844 }, metrics: hiddenMetrics });

    await evaluate(cdp, `document.querySelector('[data-phone-week-staff-id="51"]').click();true`);
    await poll(() => evaluate(cdp, `document.body.dataset.phoneActiveStaffId`), value => value === '52');
    await poll(() => evaluate(cdp, `Array.from(document.querySelectorAll('[data-week-practitioner-lane]')).filter(node=>getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0).length`), value => value === 1);
    const safeTargetMetrics = await evaluate(cdp, `(() => {
      const visible=node=>getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0;
      const lanes=Array.from(document.querySelectorAll('[data-week-practitioner-lane]')).filter(visible);
      const operationStaff=Array.from(document.querySelectorAll('.phone-plus-popover [data-staff-id]')).map(node=>node.dataset.staffId);
      const appointmentHref=document.querySelector('.phone-plus-popover a')?.getAttribute('href')||'';
      return {
        activeStaff:document.body.dataset.phoneActiveStaffId||'',
        activeStaffName:document.querySelector('[data-phone-active-staff]')?.textContent.trim()||'',
        visibleStaffIds:lanes.map(node=>node.dataset.staffId),
        operationStaff,
        appointmentHref,
      };
    })()`);
    assert.equal(safeTargetMetrics.activeStaff, '52');
    assert.equal(safeTargetMetrics.activeStaffName, 'Birch Room');
    assert.deepEqual(safeTargetMetrics.visibleStaffIds, ['52']);
    assert.ok(safeTargetMetrics.operationStaff.length >= 2 && safeTargetMetrics.operationStaff.every(id => id === '52'), 'Phone mutation actions still target a hidden practitioner');
    assert.match(safeTargetMetrics.appointmentHref, /staff=52/);
    screenshots.push({ ...(await capture('phone-week-action-target-follows-visible')), viewport: { width: 390, height: 844 }, metrics: safeTargetMetrics });

    await evaluate(cdp, `document.querySelector('[data-phone-week-staff-all]').click();true`);
    await poll(() => evaluate(cdp, `Array.from(document.querySelectorAll('[data-week-practitioner-lane]')).filter(node=>getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0).length`), value => value === 3);
    const restoredMetrics = await evaluate(cdp, `(() => ({
      activeStaff:document.body.dataset.phoneActiveStaffId||'',
      visibleStaffIds:Array.from(document.querySelectorAll('[data-week-practitioner-lane]')).filter(node=>getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0).map(node=>node.dataset.staffId),
      allSelected:document.querySelector('[data-phone-week-staff-all]')?.classList.contains('active')||false,
    }))()`);
    assert.equal(restoredMetrics.activeStaff, '52');
    assert.deepEqual(restoredMetrics.visibleStaffIds, ['51', '52', '53']);
    assert.equal(restoredMetrics.allSelected, true);
    screenshots.push({ ...(await capture('phone-week-all-restored')), viewport: { width: 390, height: 844 }, metrics: restoredMetrics });

    await evaluate(cdp, `document.querySelector('[data-phone-week-date="2026-09-07"]').click();true`);
    await poll(() => evaluate(cdp, `document.body.dataset.phoneActiveDate`), value => value === '2026-09-07');
    await poll(() => evaluate(cdp, `Array.from(document.querySelectorAll('[data-week-practitioner-lane]')).filter(node=>getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0).length`), value => value === 3);
    screenshots.push({ ...(await capture('phone-week-active-monday')), viewport: { width: 390, height: 844 } });

'''
replace_section(proof, switch_start, empty_click, new_switch)

replace_once(
    proof,
    "    await navigate(`${origin}/calendar/read-only?view=month&date=${DATE_KEY}&staff=51&activeStaff=51`, '.month-grid');",
    "    await navigate(`${origin}/calendar/read-only?view=month&date=${DATE_KEY}&staff=51&staff=52&staff=53&activeStaff=51`, '.month-grid');",
)
replace_once(
    proof,
    "        links:dayLinks.map(node=>node.getAttribute('href')),",
    "        linksPreserveAll:dayLinks.every(node=>{const url=new URL(node.getAttribute('href'),location.origin);return url.searchParams.getAll('staff').join(',')==='51,52,53'&&url.searchParams.get('activeStaff')==='51';}),\n        holidayAnnotated:Boolean(document.querySelector('[data-phone-public-holiday=\"Heritage Day\"]')),\n        holidayShownAsClosure:Array.from(document.querySelectorAll('.closure-strip')).some(node=>/Heritage Day/.test(node.textContent)),\n        bands:Array.from(document.querySelectorAll('[data-phone-capacity-band]')).map(node=>node.dataset.phoneCapacityBand),",
)
replace_once(
    proof,
    "    assert.ok(monthMetrics.links.every(href => href.includes('staff=51') && href.includes('activeStaff=51')), 'Phone Month date navigation did not preserve active practitioner context');\n    screenshots.push({ ...(await capture('phone-month-readable-density')), viewport: monthMetrics.viewport, metrics: monthMetrics });",
    "    assert.equal(monthMetrics.linksPreserveAll, true, 'Phone Month date navigation did not preserve all selected practitioners');\n    assert.equal(monthMetrics.holidayAnnotated, true, 'Phone Month did not annotate Heritage Day');\n    assert.equal(monthMetrics.holidayShownAsClosure, false, 'Public-holiday annotation was incorrectly promoted to closure authority');\n    assert.ok(monthMetrics.bands.every(band => ['light','medium','busy','closed'].includes(band)), 'Phone Month emitted an unknown capacity band');\n    screenshots.push({ ...(await capture('phone-month-capacity-overview')), viewport: monthMetrics.viewport, metrics: monthMetrics });\n\n    await evaluate(cdp, `document.querySelector('.month-day[data-date=\"2026-09-24\"] .month-day-link').click();true`);\n    await poll(() => evaluate(cdp, `document.body.dataset.phoneActiveDate`), value => value === '2026-09-24');\n    await poll(() => evaluate(cdp, `document.querySelector('.phone-view-menu>summary strong')?.textContent.trim()`), value => value === 'Week');\n    await evaluate(cdp, `document.querySelector('.phone-date-menu>summary').click();true`);\n    await poll(() => evaluate(cdp, `document.querySelector('.phone-date-menu')?.open`), Boolean);\n    const holidayPickerMetrics = await evaluate(cdp, `(() => ({\n      holidayDotVisible:Array.from(document.querySelectorAll('.phone-date-holiday-dot')).some(node=>getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0),\n      holidayTitle:Array.from(document.querySelectorAll('.phone-date-holiday-dot')).map(node=>node.getAttribute('title')).find(Boolean)||'',\n      activeDate:document.body.dataset.phoneActiveDate||'',\n    }))()`);\n    assert.equal(holidayPickerMetrics.holidayDotVisible, true);\n    assert.match(holidayPickerMetrics.holidayTitle, /Heritage Day/);\n    assert.equal(holidayPickerMetrics.activeDate, '2026-09-24');\n    screenshots.push({ ...(await capture('phone-public-holiday-date-picker')), viewport: { width: 390, height: 844 }, metrics: holidayPickerMetrics });",
)
replace_once(proof, "authority: 'Existing CalendarReadOnlyUx and canonical booking/manage authority with #725 Phone Calendar V2 presentation only',", "authority: 'Existing CalendarReadOnlyUx, permitted-staff filtering, canonical booking/manage authority and #725 Phone presentation extended by #727 Week Planner/Month composition',")
replace_once(proof, "console.log(`Authenticated Phone Calendar V2 proof passed: ${screenshots.length} screenshots at ${exactHead}`);", "console.log(`Authenticated Phone Week Planner V3 proof passed: ${screenshots.length} screenshots at ${exactHead}`);")

# Desktop acceptance: explicitly prove Day is absent from normal selectors and Month remains operational.
insert_after = "    screenshots.push({ ...(await capture('desktop-week-authority-preserved')), viewport: desktopMetrics.viewport, metrics: desktopMetrics });\n"
desktop_extra = r'''    const desktopViewOptions = await evaluate(cdp, `Array.from(document.querySelectorAll('[data-calendar-view-option]')).map(node=>node.dataset.calendarViewOption)`);
    assert.deepEqual(desktopViewOptions, ['week', 'agenda', 'month']);
    await navigate(`${origin}/calendar/read-only?view=month&date=${DATE_KEY}&staff=51&staff=52&staff=53&activeStaff=51`, '.month-grid');
    const desktopMonthMetrics = await evaluate(cdp, `(() => ({
      view:document.body.dataset.calendarView||'',
      rootScrollWidth:document.documentElement.scrollWidth,
      dayOption:Boolean(document.querySelector('[data-calendar-view-option="day"]')),
      monthGrid:Boolean(document.querySelector('.month-grid')),
    }))()`);
    assert.equal(desktopMonthMetrics.view, 'month');
    assert.equal(desktopMonthMetrics.dayOption, false);
    assert.equal(desktopMonthMetrics.monthGrid, true);
    assert.ok(desktopMonthMetrics.rootScrollWidth <= 1440);
    screenshots.push({ ...(await capture('desktop-month-day-retired')), viewport: { width: 1440, height: 1000 }, metrics: desktopMonthMetrics });

'''
replace_once(proof, insert_after, insert_after + desktop_extra)

ci = '.github/workflows/ci.yml'
replace_once(ci, '      - name: Run authenticated Goldie-density Phone Calendar shell browser proof\n        run: node scripts/calendar-spatial-phone-week-browser-proof.js\n      - name: Upload authenticated Goldie-density Phone Calendar shell browser proof\n        uses: actions/upload-artifact@v4\n        with:\n          name: calendar-goldie-density-phone-shell-p1\n          path: artifacts/calendar-goldie-density-phone-shell-p1', '      - name: Run authenticated Phone Week Planner V3 browser proof\n        run: node scripts/calendar-spatial-phone-week-browser-proof.js\n      - name: Upload authenticated Phone Week Planner V3 browser proof\n        uses: actions/upload-artifact@v4\n        with:\n          name: calendar-phone-week-planner-v3\n          path: artifacts/calendar-phone-week-planner-v3')

# Temporary execution artifacts must not survive the implementation commit.
Path('scripts/control-temp-727-refine.py').unlink(missing_ok=True)
Path('.github/workflows/control-temp-727-refine.yml').unlink(missing_ok=True)
