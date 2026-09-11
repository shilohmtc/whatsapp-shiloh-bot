const DESKTOP_COMPACT_LANE_MIN_PX = 180;

function calendarDesktopFitCanvasStyles() {
  return `@media(min-width:701px){
body[data-calendar-desktop-approved="true"] .day-time-grid .lanes{grid-template-columns:repeat(var(--lane-count),minmax(${DESKTOP_COMPACT_LANE_MIN_PX}px,1fr))!important;min-width:0!important;width:100%!important}
body[data-calendar-desktop-approved="true"] .day-time-grid .lane{min-width:${DESKTOP_COMPACT_LANE_MIN_PX}px!important;width:auto!important}
body[data-calendar-desktop-approved="true"] .day-time-grid{overflow-x:auto!important;overflow-y:auto!important}
}
`;
}

function calendarDesktopFitCanvasClientScript() {
  const css = JSON.stringify(calendarDesktopFitCanvasStyles());
  return `(()=>{'use strict';if(document.querySelector('style[data-calendar-desktop-fit-canvas]'))return;const style=document.createElement('style');style.dataset.calendarDesktopFitCanvas='true';style.textContent=${css};document.head.appendChild(style);})();`;
}

module.exports = {
  DESKTOP_COMPACT_LANE_MIN_PX,
  calendarDesktopFitCanvasStyles,
  calendarDesktopFitCanvasClientScript,
};
