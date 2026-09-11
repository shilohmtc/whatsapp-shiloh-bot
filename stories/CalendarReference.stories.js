import primitives from '../src/presentation/shilohUiPrimitives.js';
import calendarReference from '../src/presentation/calendarUxReference.js';

const {
  renderButton,
  renderIconButton,
  renderChip,
  renderBadge,
} = primitives;
const { calendarReferenceUxCss } = calendarReference;

const frame = (body, width = '960px') => `
  <style>
    ${calendarReferenceUxCss()}
    body{margin:0;background:#f4f3ed;color:#20322b;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}
    .calendar-reference{box-sizing:border-box;width:${width};max-width:100%;padding:20px;display:grid;gap:18px;background:#fffdf9;border:1px solid var(--shiloh-border);border-radius:var(--shiloh-radius-lg);}
    .calendar-reference__toolbar,.calendar-reference__row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
    .calendar-reference__toolbar{justify-content:space-between;padding:10px;border:1px solid var(--shiloh-border);border-radius:var(--shiloh-radius-lg);background:var(--shiloh-surface);}
    .calendar-reference__group{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
    .calendar-reference__label{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--shiloh-ink-muted);}
    .calendar-reference__card{display:grid;gap:8px;padding:14px;border:1px solid var(--shiloh-border);border-left:4px solid var(--shiloh-focus);border-radius:var(--shiloh-radius-md);background:var(--shiloh-surface);}
    .calendar-reference__card strong{font-size:15px;}
    .calendar-reference__card small{color:var(--shiloh-ink-muted);}
    @media(max-width:700px){.calendar-reference{padding:12px}.calendar-reference__toolbar{display:grid;gap:10px}.calendar-reference__group{width:100%}.calendar-reference__group .shiloh-button{flex:1 1 auto}.calendar-reference__card{min-height:44px}}
  </style>
  <div class="calendar-reference">${body}</div>`;

export default {
  title: 'Calendar/Reference implementation',
  parameters: { layout: 'centered' },
};

export const DesktopToolbarAndIdentity = {
  render: () => frame(`
    <div class="calendar-reference__toolbar">
      <div class="calendar-reference__group">
        ${renderIconButton({ label: 'Previous period', icon: 'previous', density: 'compact' })}
        ${renderButton({ label: 'Today', icon: 'calendar', density: 'compact' })}
        ${renderIconButton({ label: 'Next period', icon: 'next', density: 'compact' })}
      </div>
      <div class="calendar-reference__group">
        ${renderChip({ label: 'Week', selected: true, density: 'compact' })}
        ${renderChip({ label: 'Month', density: 'compact' })}
      </div>
      <div class="calendar-reference__group">
        ${renderChip({ label: 'All practitioners', icon: 'people', density: 'compact' })}
      </div>
    </div>
    <div class="calendar-reference__row">
      <span class="calendar-reference__label">Practitioner identity</span>
      ${renderChip({ label: 'Practitioner A', icon: 'person', selected: true, density: 'compact' })}
      ${renderChip({ label: 'Practitioner B', icon: 'person', density: 'compact' })}
    </div>
    <div class="calendar-reference__row">
      <span class="calendar-reference__label">Appointment state</span>
      ${renderBadge({ label: 'Confirmed', tone: 'success', icon: 'confirm' })}
      ${renderBadge({ label: 'Needs attention', tone: 'warning', icon: 'alert' })}
      ${renderBadge({ label: 'Cancelled', tone: 'danger', icon: 'alert' })}
    </div>
    <article class="calendar-reference__card">
      <small>09:00–10:00</small><strong>Client name</strong><small>Service • Practitioner A</small>
      <div>${renderBadge({ label: 'Confirmed', tone: 'success', icon: 'confirm' })}</div>
    </article>
  `),
};

export const PhoneTouchToolbar = {
  render: () => frame(`
    <div class="calendar-reference__toolbar">
      <div class="calendar-reference__group">
        ${renderIconButton({ label: 'Previous period', icon: 'previous', density: 'touch' })}
        ${renderButton({ label: 'Today', icon: 'calendar', density: 'touch' })}
        ${renderIconButton({ label: 'Next period', icon: 'next', density: 'touch' })}
      </div>
      <div class="calendar-reference__group">
        ${renderChip({ label: 'Week', selected: true, density: 'touch' })}
        ${renderChip({ label: 'Month', density: 'touch' })}
      </div>
      <div class="calendar-reference__group">
        ${renderChip({ label: 'Practitioner A', icon: 'person', selected: true, density: 'touch' })}
      </div>
    </div>
    <article class="calendar-reference__card">
      <small>09:00</small><strong>Client name</strong><small>Treatment</small>
      <div>${renderBadge({ label: 'Confirmed', tone: 'success' })}</div>
    </article>
  `, '390px'),
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
