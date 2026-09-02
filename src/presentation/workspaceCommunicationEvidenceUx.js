const { escapeHtml } = require('./workspaceShell');
const { renderClientDetailPage } = require('./workspaceClientsUx');

const BUSINESS_TIMEZONE = 'Africa/Johannesburg';

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: 'Unknown date', time: '' };
  return {
    date: new Intl.DateTimeFormat('en-ZA', {
      timeZone: BUSINESS_TIMEZONE,
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat('en-ZA', {
      timeZone: BUSINESS_TIMEZONE,
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(date),
  };
}

function renderCommunicationSection(communications = []) {
  const rows = (Array.isArray(communications) ? communications : []).map(entry => {
    const when = formatDateTime(entry?.occurredAt);
    const context = entry?.appointmentId ? `Appointment #${entry.appointmentId}` : 'Client communication';
    return `<article class="history-row" data-communication-intent="${escapeHtml(entry?.intent || 'notification')}"><div class="history-time"><strong>${escapeHtml(when.date)}</strong><small>${escapeHtml(when.time)}</small></div><div class="history-service">${escapeHtml(entry?.label || 'Shiloh notification')}</div><div class="history-staff">${escapeHtml(context)}</div><span class="status-pill">${escapeHtml(entry?.statusLabel || 'Recorded')}</span></article>`;
  }).join('');

  return `<section class="history-panel" data-client-communications style="margin-bottom:12px"><header class="section-heading"><div><span class="eyebrow">Communications</span><h2>Shiloh notification history</h2></div><span class="truth-note">Evidence recorded by Shiloh</span></header><div class="history-list">${rows || '<div class="empty">No recorded Shiloh notifications yet.</div>'}</div></section>`;
}

function renderClientDetailPageWithCommunications(model, options = {}) {
  const base = renderClientDetailPage(model, options);
  const section = renderCommunicationSection(model?.communications || []);
  const marker = '<section class="history-panel">';
  if (!base.includes(marker)) return base;
  return base.replace(marker, `${section}${marker}`);
}

module.exports = {
  formatDateTime,
  renderCommunicationSection,
  renderClientDetailPageWithCommunications,
};
