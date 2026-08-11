const { pool } = require('../db/pool');

const LEGACY_PATTERNS = [
  /\bmasage\b/i,
  /\btargated\b/i,
  /\bquick relieve\b/i,
  /\bsculp delux\b/i,
  /\bpermanant\b/i,
  /\bmikroneedling\b/i,
  /\bboimicroneedling\b/i,
  /hydrationw/i,
  /black heads/i,
  /white heads/i,
  /break out/i,
];

function publicService(row) {
  const price = row.price == null ? null : Number(row.price);
  return {
    name: row.name,
    category: row.category_name || null,
    durationMinutes: row.duration_minutes == null ? null : Number(row.duration_minutes),
    processingTimeMinutes: row.processing_time_minutes == null ? null : Number(row.processing_time_minutes),
    extraTimeMinutes: row.extra_time_minutes == null ? null : Number(row.extra_time_minutes),
    price,
    variablePrice: row.variable_price === true,
    displayPrice: row.display_price || null,
    status: row.status,
  };
}

async function getCatalogueParityAudit() {
  const services = await pool.query(`
    SELECT s.name, s.duration_minutes, s.processing_time_minutes, s.extra_time_minutes,
           s.variable_price, s.price, s.display_price, s.status,
           sc.name AS category_name
      FROM services s
      LEFT JOIN service_categories sc ON sc.id = s.category_id
     WHERE s.status = 'active'
     ORDER BY sc.display_order NULLS LAST, s.display_order, s.name
  `);

  const categories = await pool.query(`
    SELECT sc.name, COUNT(s.id)::int AS active_services
      FROM service_categories sc
      LEFT JOIN services s ON s.category_id = sc.id AND s.status = 'active'
     GROUP BY sc.id, sc.name, sc.display_order
    HAVING COUNT(s.id) > 0
     ORDER BY sc.display_order NULLS LAST, sc.name
  `);

  const rows = services.rows.map(publicService);
  const legacyNameFindings = rows
    .filter((service) => LEGACY_PATTERNS.some((pattern) => pattern.test(service.name)))
    .map((service) => service.name);
  const missingPrice = rows.filter((service) => service.price == null && !service.displayPrice).map((service) => service.name);
  const missingDuration = rows.filter((service) => !Number.isFinite(service.durationMinutes) || service.durationMinutes <= 0).map((service) => service.name);

  return {
    generatedAt: new Date().toISOString(),
    activeServiceCount: rows.length,
    activeCategoryCount: categories.rowCount,
    checks: {
      legacyServiceNamesClear: legacyNameFindings.length === 0,
      allActiveServicesHavePricePresentation: missingPrice.length === 0,
      allActiveServicesHaveDuration: missingDuration.length === 0,
    },
    findings: {
      legacyServiceNames: legacyNameFindings,
      missingPricePresentation: missingPrice,
      missingDuration,
    },
    categories: categories.rows.map((row) => ({ name: row.name, activeServices: Number(row.active_services) })),
    services: rows,
  };
}

module.exports = { getCatalogueParityAudit, LEGACY_PATTERNS };
