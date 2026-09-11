const { shilohUxTokenCss } = require('./shilohUxTokens');
const { renderShilohIcon } = require('./shilohIcon');

const BUTTON_VARIANTS = new Set(['primary', 'secondary', 'ghost', 'danger']);
const BADGE_TONES = new Set(['neutral', 'success', 'warning', 'danger', 'info']);
const DENSITIES = new Set(['compact', 'touch']);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function safeClassName(value) {
  return String(value ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => /^[A-Za-z0-9_-]+$/.test(token))
    .join(' ');
}

function normalizeVariant(value) {
  return BUTTON_VARIANTS.has(value) ? value : 'secondary';
}

function normalizeTone(value) {
  return BADGE_TONES.has(value) ? value : 'neutral';
}

function normalizeDensity(value) {
  return DENSITIES.has(value) ? value : 'touch';
}

function navigationAttributes({ href, ariaCurrent, disabled = false } = {}) {
  const cleanHref = String(href ?? '').trim();
  if (!cleanHref) return null;
  const hrefAttribute = disabled ? '' : ` href="${escapeHtml(cleanHref)}"`;
  const current = ariaCurrent === 'page' || ariaCurrent === 'true' ? ` aria-current="${ariaCurrent}"` : '';
  return `${hrefAttribute}${current}`;
}

function renderButton({
  label,
  icon,
  variant = 'secondary',
  density = 'touch',
  disabled = false,
  className = '',
  type = 'button',
  href,
  ariaCurrent,
} = {}) {
  const text = String(label ?? '').trim();
  if (!text) throw new Error('Shiloh button requires a label');
  const safeType = ['button', 'submit', 'reset'].includes(type) ? type : 'button';
  const classes = [
    'shiloh-button',
    `shiloh-button--${normalizeVariant(variant)}`,
    `shiloh-control--${normalizeDensity(density)}`,
    safeClassName(className),
  ].filter(Boolean).join(' ');
  const iconHtml = icon ? renderShilohIcon(icon, { size: 18, className: 'shiloh-button__icon' }) : '';
  const nav = navigationAttributes({ href, ariaCurrent, disabled });
  if (nav !== null) {
    return `<a${nav} class="${classes}"${disabled ? ' aria-disabled="true" tabindex="-1"' : ''}>${iconHtml}<span>${escapeHtml(text)}</span></a>`;
  }
  return `<button type="${safeType}" class="${classes}"${disabled ? ' disabled aria-disabled="true"' : ''}>${iconHtml}<span>${escapeHtml(text)}</span></button>`;
}

function renderIconButton({
  label,
  icon,
  variant = 'ghost',
  density = 'touch',
  disabled = false,
  className = '',
  href,
  ariaCurrent,
} = {}) {
  const accessibleLabel = String(label ?? '').trim();
  if (!accessibleLabel) throw new Error('Shiloh icon button requires an accessible label');
  if (!icon) throw new Error('Shiloh icon button requires an icon');
  const classes = [
    'shiloh-icon-button',
    `shiloh-button--${normalizeVariant(variant)}`,
    `shiloh-control--${normalizeDensity(density)}`,
    safeClassName(className),
  ].filter(Boolean).join(' ');
  const nav = navigationAttributes({ href, ariaCurrent, disabled });
  if (nav !== null) {
    return `<a${nav} class="${classes}" aria-label="${escapeHtml(accessibleLabel)}"${disabled ? ' aria-disabled="true" tabindex="-1"' : ''}>${renderShilohIcon(icon, { size: 18 })}</a>`;
  }
  return `<button type="button" class="${classes}" aria-label="${escapeHtml(accessibleLabel)}"${disabled ? ' disabled aria-disabled="true"' : ''}>${renderShilohIcon(icon, { size: 18 })}</button>`;
}

function renderChip({
  label,
  selected = false,
  disabled = false,
  density = 'touch',
  icon,
  className = '',
  href,
  ariaCurrent,
} = {}) {
  const text = String(label ?? '').trim();
  if (!text) throw new Error('Shiloh chip requires a label');
  const classes = [
    'shiloh-chip',
    selected ? 'is-selected' : '',
    `shiloh-control--${normalizeDensity(density)}`,
    safeClassName(className),
  ].filter(Boolean).join(' ');
  const iconHtml = icon ? renderShilohIcon(icon, { size: 16, className: 'shiloh-chip__icon' }) : '';
  const nav = navigationAttributes({ href, ariaCurrent, disabled });
  if (nav !== null) {
    return `<a${nav} class="${classes}"${disabled ? ' aria-disabled="true" tabindex="-1"' : ''}>${iconHtml}<span>${escapeHtml(text)}</span></a>`;
  }
  return `<button type="button" class="${classes}" aria-pressed="${selected ? 'true' : 'false'}"${disabled ? ' disabled aria-disabled="true"' : ''}>${iconHtml}<span>${escapeHtml(text)}</span></button>`;
}

function renderBadge({ label, tone = 'neutral', icon, className = '' } = {}) {
  const text = String(label ?? '').trim();
  if (!text) throw new Error('Shiloh badge requires a label');
  const classes = [
    'shiloh-badge',
    `shiloh-badge--${normalizeTone(tone)}`,
    safeClassName(className),
  ].filter(Boolean).join(' ');
  const iconHtml = icon ? renderShilohIcon(icon, { size: 14, className: 'shiloh-badge__icon' }) : '';
  return `<span class="${classes}">${iconHtml}<span>${escapeHtml(text)}</span></span>`;
}

function shilohUiPrimitiveStyles() {
  return `${shilohUxTokenCss()}\n` +
    `.shiloh-button,.shiloh-icon-button,.shiloh-chip{font:600 14px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;border:1px solid transparent;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:var(--shiloh-space-2);cursor:pointer;text-decoration:none;transition:background-color .14s ease,border-color .14s ease,box-shadow .14s ease,color .14s ease;}` +
    `.shiloh-control--touch{min-height:var(--shiloh-touch-min);padding:0 var(--shiloh-space-4);}` +
    `.shiloh-control--compact{min-height:34px;padding:0 var(--shiloh-space-3);}` +
    `.shiloh-button{border-radius:var(--shiloh-radius-md);}` +
    `.shiloh-icon-button{border-radius:var(--shiloh-radius-md);aspect-ratio:1;padding:0;min-width:34px;}` +
    `.shiloh-icon-button.shiloh-control--touch{min-width:var(--shiloh-touch-min);}` +
    `.shiloh-button--primary{background:var(--shiloh-focus);color:#fff;border-color:var(--shiloh-focus);}` +
    `.shiloh-button--secondary{background:var(--shiloh-surface);color:var(--shiloh-ink);border-color:var(--shiloh-border);}` +
    `.shiloh-button--ghost{background:transparent;color:var(--shiloh-ink);border-color:transparent;}` +
    `.shiloh-button--danger{background:var(--shiloh-danger);color:#fff;border-color:var(--shiloh-danger);}` +
    `.shiloh-button:hover:not(:disabled):not([aria-disabled="true"]),.shiloh-icon-button:hover:not(:disabled):not([aria-disabled="true"]),.shiloh-chip:hover:not(:disabled):not([aria-disabled="true"]){box-shadow:var(--shiloh-shadow-soft);}` +
    `.shiloh-button:focus-visible,.shiloh-icon-button:focus-visible,.shiloh-chip:focus-visible{outline:3px solid color-mix(in srgb,var(--shiloh-focus) 28%,transparent);outline-offset:2px;}` +
    `.shiloh-button:disabled,.shiloh-icon-button:disabled,.shiloh-chip:disabled,.shiloh-button[aria-disabled="true"],.shiloh-icon-button[aria-disabled="true"],.shiloh-chip[aria-disabled="true"]{opacity:.5;cursor:not-allowed;box-shadow:none;}` +
    `.shiloh-chip{border-radius:var(--shiloh-radius-pill);background:var(--shiloh-surface);color:var(--shiloh-ink);border-color:var(--shiloh-border);}` +
    `.shiloh-chip.is-selected{background:var(--shiloh-focus);color:#fff;border-color:var(--shiloh-focus);box-shadow:var(--shiloh-shadow-soft);}` +
    `.shiloh-badge{font:700 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:inline-flex;align-items:center;gap:6px;border-radius:var(--shiloh-radius-pill);padding:6px 9px;border:1px solid var(--shiloh-border);background:var(--shiloh-surface-subtle);color:var(--shiloh-ink-muted);}` +
    `.shiloh-badge--success{color:var(--shiloh-success);background:color-mix(in srgb,var(--shiloh-success) 10%,white);border-color:color-mix(in srgb,var(--shiloh-success) 22%,white);}` +
    `.shiloh-badge--warning{color:var(--shiloh-warning);background:color-mix(in srgb,var(--shiloh-warning) 10%,white);border-color:color-mix(in srgb,var(--shiloh-warning) 22%,white);}` +
    `.shiloh-badge--danger{color:var(--shiloh-danger);background:color-mix(in srgb,var(--shiloh-danger) 10%,white);border-color:color-mix(in srgb,var(--shiloh-danger) 22%,white);}` +
    `.shiloh-badge--info{color:var(--shiloh-info);background:color-mix(in srgb,var(--shiloh-info) 10%,white);border-color:color-mix(in srgb,var(--shiloh-info) 22%,white);}` +
    `.shiloh-icon{flex:none;}`;
}

module.exports = {
  renderButton,
  renderIconButton,
  renderChip,
  renderBadge,
  shilohUiPrimitiveStyles,
};