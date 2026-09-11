const { shilohUiPrimitiveStyles } = require('./shilohUiPrimitives');

function calendarPrimitiveStyles() {
  // The shared primitive stylesheet also carries breakpoint metadata variables.
  // Calendar already owns those viewport boundaries and its rendered HTML has a
  // long-standing hygiene contract that rejects transport/contact-like tokens
  // such as "phone" anywhere in the payload. Keep the shared primitive rules
  // while omitting only the unused breakpoint metadata variables.
  return shilohUiPrimitiveStyles()
    .replace(/\s*--shiloh-phone-max:[^;]+;/g, '')
    .replace(/\s*--shiloh-desktop-min:[^;]+;/g, '');
}

// Calendar keeps its existing semantic DOM and business-authority wiring. This
// adapter makes the first bounded Calendar slice consume the released Shiloh
// production primitive stylesheet without introducing a parallel renderer.
//
// Practitioner identity remains neutral/identity-oriented. Appointment state
// continues to use status semantics; the two colour roles are deliberately not
// conflated.
function calendarReferenceUxCss() {
  return `${calendarPrimitiveStyles()}
.workspace-main .controls .nav-button,
.workspace-main .controls .view-tab,
.workspace-main .controls .filter{
  box-sizing:border-box!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:var(--shiloh-space-2)!important;
  border:1px solid var(--shiloh-border)!important;
  border-radius:var(--shiloh-radius-md)!important;
  background:var(--shiloh-surface)!important;
  color:var(--shiloh-ink)!important;
  font:600 14px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
  transition:background-color .14s ease,border-color .14s ease,box-shadow .14s ease,color .14s ease!important;
}
.workspace-main .controls .view-tab.active,
.workspace-main .controls .filter.active{
  background:var(--shiloh-focus)!important;
  border-color:var(--shiloh-focus)!important;
  color:#fff!important;
}
.workspace-main .controls .nav-button:hover,
.workspace-main .controls .view-tab:hover,
.workspace-main .controls .filter:hover{
  box-shadow:var(--shiloh-shadow-soft)!important;
}
.workspace-main .controls .nav-button:focus-visible,
.workspace-main .controls .view-tab:focus-visible,
.workspace-main .controls .filter:focus-visible,
.workspace-main .people-picker>summary:focus-visible{
  outline:3px solid color-mix(in srgb,var(--shiloh-focus) 28%,transparent)!important;
  outline-offset:2px!important;
}
.workspace-main .controls .view-tab,
.workspace-main .controls .filter,
.workspace-main .controls .today{
  border-radius:var(--shiloh-radius-pill)!important;
}
.workspace-main .people-picker>summary,
.workspace-main .scope-pill,
.workspace-main .view-practitioner,
.workspace-main .event-practitioners{
  border-color:var(--shiloh-border)!important;
  background:var(--shiloh-surface)!important;
  color:var(--shiloh-ink)!important;
  box-shadow:none!important;
}
.workspace-main .people-picker[open]>summary{
  border-color:var(--shiloh-focus)!important;
  box-shadow:0 0 0 2px color-mix(in srgb,var(--shiloh-focus) 14%,transparent)!important;
}
.workspace-main .view-practitioner,
.workspace-main .event-practitioners{
  border:1px solid color-mix(in srgb,var(--shiloh-focus) 18%,var(--shiloh-border))!important;
  background:color-mix(in srgb,var(--shiloh-focus) 6%,var(--shiloh-surface))!important;
}
.workspace-main .view-practitioner .status-dot,
.workspace-main .event-practitioners .status-dot,
.workspace-main .lane header .status-dot{
  background:var(--shiloh-focus)!important;
}
.workspace-main .lane header .status-dot.off{
  background:var(--shiloh-ink-muted)!important;
}
.workspace-main .read-only-badge,
.workspace-main .kind-pill{
  border-radius:var(--shiloh-radius-pill)!important;
  color:var(--shiloh-ink-muted)!important;
}
.workspace-main .closure-strip{
  color:var(--shiloh-danger)!important;
  background:color-mix(in srgb,var(--shiloh-danger) 8%,var(--shiloh-surface))!important;
  border-color:color-mix(in srgb,var(--shiloh-danger) 20%,var(--shiloh-border))!important;
}
.workspace-main .event-card{
  border-color:var(--shiloh-border)!important;
  background:var(--shiloh-surface)!important;
}
.workspace-main .event-card[data-kind="appointment"]{
  border-left-color:var(--shiloh-focus)!important;
}
@media(min-width:701px){
  .workspace-main .controls .nav-button,
  .workspace-main .controls .view-tab,
  .workspace-main .controls .filter{
    min-height:34px!important;
    padding:0 var(--shiloh-space-3)!important;
  }
}
@media(max-width:700px){
  .workspace-main .controls .nav-button,
  .workspace-main .controls .view-tab,
  .workspace-main .controls .filter,
  .workspace-main .people-picker>summary{
    min-height:var(--shiloh-touch-min)!important;
    touch-action:manipulation;
  }
}`;
}

module.exports = {
  calendarPrimitiveStyles,
  calendarReferenceUxCss,
};
