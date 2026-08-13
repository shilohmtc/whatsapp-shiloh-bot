function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function formatMoneyNumber(value) {
  const number = Number(String(value).replace(/,/g, ''));
  if (!Number.isFinite(number)) return null;
  const hasDecimals = !Number.isInteger(number);
  const fixed = number.toFixed(hasDecimals ? 2 : 0);
  const [whole, decimal] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal ? `${grouped}.${decimal}` : grouped;
}

function formatClientTreatmentPrice(row = {}) {
  const raw = clean(row.display_price);
  if (raw) {
    const simpleRange = raw.match(/^R?\s*([\d,]+(?:\.\d{1,2})?)\s*[-–—]\s*R?\s*([\d,]+(?:\.\d{1,2})?)$/i);
    if (simpleRange) {
      const low = formatMoneyNumber(simpleRange[1]);
      const high = formatMoneyNumber(simpleRange[2]);
      if (low && high) return `R${low}–R${high}`;
    }
    const simpleAmount = raw.match(/^R?\s*([\d,]+(?:\.\d{1,2})?)$/i);
    if (simpleAmount) {
      const amount = formatMoneyNumber(simpleAmount[1]);
      if (amount) return `R${amount}`;
    }
    return raw;
  }

  if (row.price == null) return 'Price on request';
  const amount = formatMoneyNumber(row.price);
  return amount ? `R${amount}` : 'Price on request';
}

function treatmentDuration(row = {}) {
  const minutes = Number(row.duration_minutes || 0) + Number(row.processing_time_minutes || 0) + Number(row.extra_time_minutes || 0);
  return minutes > 0 ? `${minutes} min` : 'Duration on request';
}

function treatmentTitle(name = '') {
  const value = clean(name);
  return value.length <= 24 ? value : `${value.slice(0, 21)}…`;
}

function treatmentDescription(row = {}) {
  const name = clean(row.name);
  const details = `${treatmentDuration(row)} • ${formatClientTreatmentPrice(row)}`;
  if (!name) return details.slice(0, 72);
  const full = `${name} • ${details}`;
  if (full.length <= 72) return full;
  const available = Math.max(1, 72 - details.length - 5);
  return `${name.slice(0, available).trimEnd()}… • ${details}`.slice(0, 72);
}

function presentTreatmentRow(row = {}, id) {
  return {
    id,
    title: treatmentTitle(row.name),
    description: treatmentDescription(row),
  };
}

function treatmentPageNavigationRow(id, destinationPage, totalPages) {
  return {
    id,
    title: 'Next treatments →',
    description: `Go to page ${destinationPage} of ${totalPages}`,
  };
}

module.exports = {
  formatClientTreatmentPrice,
  presentTreatmentRow,
  treatmentPageNavigationRow,
  treatmentDescription,
  treatmentTitle,
};
