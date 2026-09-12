const DESKTOP_COMPACT_LANE_MIN_PX = 180;
const DESKTOP_BASE_GRID_HEIGHT_PX = 792;
const DESKTOP_GRID_HOURS = 11;

function calendarDesktopFitCanvasStyles() {
  return `@media(min-width:701px){
body[data-calendar-desktop-approved="true"] .day-time-grid .lanes{grid-template-columns:repeat(var(--lane-count),minmax(${DESKTOP_COMPACT_LANE_MIN_PX}px,1fr))!important;min-width:0!important;width:100%!important}
body[data-calendar-desktop-approved="true"] .day-time-grid .lane{min-width:${DESKTOP_COMPACT_LANE_MIN_PX}px!important;width:auto!important}
body[data-calendar-desktop-approved="true"] .day-time-grid{overflow-x:auto!important;overflow-y:auto!important}
body[data-calendar-desktop-approved="true"] .week-time-grid>.time-rail{height:var(--desktop-grid-height,${DESKTOP_BASE_GRID_HEIGHT_PX}px)!important}
body[data-calendar-desktop-approved="true"] .week-time-grid>.time-rail span{top:var(--desktop-grid-top,var(--grid-top))!important}
body[data-calendar-desktop-approved="true"] .desktop-practitioner-lane .time-column{height:var(--desktop-grid-height,${DESKTOP_BASE_GRID_HEIGHT_PX}px)!important;min-height:var(--desktop-grid-height,${DESKTOP_BASE_GRID_HEIGHT_PX}px)!important;background:repeating-linear-gradient(to bottom,transparent 0,transparent calc(var(--desktop-hour-height,72px) - 1px),var(--line) calc(var(--desktop-hour-height,72px) - 1px),var(--line) var(--desktop-hour-height,72px))!important}
body[data-calendar-desktop-approved="true"] .desktop-practitioner-lane .positioned-event{top:var(--desktop-event-top,var(--event-top))!important;height:var(--desktop-event-height,var(--event-height))!important}
body[data-calendar-desktop-approved="true"] .desktop-practitioner-lane .calendar-booking-slot{top:var(--desktop-slot-top,var(--slot-top))!important;height:var(--desktop-slot-height,var(--slot-height))!important}
}
`;
}

function calendarDesktopFitCanvasClientScript() {
  const css = JSON.stringify(calendarDesktopFitCanvasStyles());
  return `(()=>{'use strict';if(document.querySelector('style[data-calendar-desktop-fit-canvas]'))return;const style=document.createElement('style');style.dataset.calendarDesktopFitCanvas='true';style.textContent=${css};document.head.appendChild(style);if(!window.matchMedia('(min-width:701px)').matches)return;const BASE_HEIGHT=${DESKTOP_BASE_GRID_HEIGHT_PX};const GRID_HOURS=${DESKTOP_GRID_HOURS};const readPx=(node,name)=>{const value=parseFloat(node.style.getPropertyValue(name));return Number.isFinite(value)?value:null;};const remember=(node,key,name)=>{if(node.dataset[key]==null){const value=readPx(node,name);if(value!=null)node.dataset[key]=String(value);}const value=parseFloat(node.dataset[key]);return Number.isFinite(value)?value:null;};function fitVerticalCanvas(){const grid=document.querySelector('.week-time-grid');const planner=document.querySelector('.desktop-practitioner-grid');if(!grid||!planner)return;const footer=document.querySelector('.footer-note');const top=grid.getBoundingClientRect().top;const footerHeight=footer?footer.getBoundingClientRect().height:0;const available=Math.floor(window.innerHeight-top-footerHeight-24-54);const height=Math.max(BASE_HEIGHT,Math.min(BASE_HEIGHT*1.6,available));const ratio=height/BASE_HEIGHT;grid.style.setProperty('--desktop-grid-height',height+'px');grid.style.setProperty('--desktop-hour-height',(height/GRID_HOURS)+'px');document.querySelectorAll('.week-time-grid>.time-rail span').forEach(node=>{const base=remember(node,'desktopBaseGridTop','--grid-top');if(base!=null)node.style.setProperty('--desktop-grid-top',(base*ratio)+'px');});planner.querySelectorAll('.positioned-event').forEach(node=>{const topValue=remember(node,'desktopBaseEventTop','--event-top');const eventHeight=remember(node,'desktopBaseEventHeight','--event-height');if(topValue!=null)node.style.setProperty('--desktop-event-top',(topValue*ratio)+'px');if(eventHeight!=null)node.style.setProperty('--desktop-event-height',Math.max(32,eventHeight*ratio)+'px');});planner.querySelectorAll('.calendar-booking-slot').forEach(node=>{const slotTop=remember(node,'desktopBaseSlotTop','--slot-top');const slotHeight=remember(node,'desktopBaseSlotHeight','--slot-height');if(slotTop!=null)node.style.setProperty('--desktop-slot-top',(slotTop*ratio)+'px');if(slotHeight!=null)node.style.setProperty('--desktop-slot-height',Math.max(36,slotHeight*ratio)+'px');});document.body.dataset.calendarDesktopVerticalFit='true';}fitVerticalCanvas();let frame=0;window.addEventListener('resize',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(fitVerticalCanvas);},{passive:true});})();`;
}

module.exports = {
  DESKTOP_COMPACT_LANE_MIN_PX,
  DESKTOP_BASE_GRID_HEIGHT_PX,
  DESKTOP_GRID_HOURS,
  calendarDesktopFitCanvasStyles,
  calendarDesktopFitCanvasClientScript,
};
