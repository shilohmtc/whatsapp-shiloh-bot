const WHATSAPP_LIST_LIMITS = Object.freeze({
  rowTitle: 24,
  rowDescription: 72,
  buttonTitle: 20,
  sectionTitle: 24,
});

function cleanListText(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function truncateListText(value = '', max = WHATSAPP_LIST_LIMITS.rowDescription) {
  const text = cleanListText(value);
  const limit = Math.max(1, Number(max) || 1);
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(1, limit - 1)).trimEnd()}…`.slice(0, limit);
}

function compactListTitle(value = '', fallback = 'Option') {
  const text = cleanListText(value) || cleanListText(fallback) || 'Option';
  return truncateListText(text, WHATSAPP_LIST_LIMITS.rowTitle);
}

function fullLabelDescription(label = '', details = '') {
  const fullLabel = cleanListText(label);
  const detailText = cleanListText(details);
  if (!fullLabel) return truncateListText(detailText, WHATSAPP_LIST_LIMITS.rowDescription);
  if (fullLabel.length > WHATSAPP_LIST_LIMITS.rowDescription) {
    return truncateListText(fullLabel, WHATSAPP_LIST_LIMITS.rowDescription);
  }
  if (!detailText) return fullLabel;
  const combined = `${fullLabel} • ${detailText}`;
  return combined.length <= WHATSAPP_LIST_LIMITS.rowDescription ? combined : fullLabel;
}

function presentNamedListRow({ id, name, title = '', details = '' } = {}) {
  return {
    id,
    title: compactListTitle(title || name),
    description: fullLabelDescription(name, details),
  };
}

module.exports = {
  WHATSAPP_LIST_LIMITS,
  cleanListText,
  compactListTitle,
  fullLabelDescription,
  presentNamedListRow,
  truncateListText,
};
