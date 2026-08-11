const { pool } = require("../db/pool");
const logger = require("../lib/logger");

function formatPrice(row) {
  if (row.display_price) return row.display_price;
  if (row.price == null) return "Price on request";
  const amount = Number(row.price);
  return Number.isFinite(amount) ? `R${amount.toFixed(2).replace(/\.00$/, "")}` : "Price on request";
}

function formatDuration(row) {
  const minutes = Number(row.duration_minutes || 0) + Number(row.processing_time_minutes || 0) + Number(row.extra_time_minutes || 0);
  return minutes > 0 ? `${minutes} min` : "Duration on request";
}

async function getActiveCatalogueKnowledge() {
  try {
    const result = await pool.query(`
      SELECT s.name, s.duration_minutes, s.processing_time_minutes, s.extra_time_minutes,
             s.price, s.display_price, s.customer_description, s.booking_note,
             sc.name AS category_name
        FROM services s
        LEFT JOIN service_categories sc ON sc.id = s.category_id
       WHERE s.status = 'active'
       ORDER BY sc.display_order NULLS LAST, s.display_order, s.name
    `);
    const content = result.rows.map((row) => {
      const base = `${row.category_name || "Services"} | ${row.name} | ${formatDuration(row)} | ${formatPrice(row)}`;
      const description = row.customer_description ? ` | Description: ${row.customer_description}` : '';
      const note = row.booking_note ? ` | Booking note: ${row.booking_note}` : '';
      return `${base}${description}${note}`;
    }).join("\n");
    return { title: "Current active Shiloh service catalogue", source: "Shiloh CRM active catalogue", content, similarity: 1 };
  } catch (error) {
    logger.warn({ err: error }, "Could not load active CRM catalogue for AI context");
    return null;
  }
}

module.exports = { getActiveCatalogueKnowledge, formatPrice, formatDuration };
