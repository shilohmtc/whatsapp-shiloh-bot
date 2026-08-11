const { pool } = require('../db/pool');
const { resolveServiceImageUrl } = require('./serviceImageMap');

function formatPrice(row) {
  if (row.display_price) return String(row.display_price).trim();
  if (row.price == null) return 'Price on request';
  const n = Number(row.price);
  return Number.isFinite(n) ? `R${n.toFixed(2).replace(/\.00$/, '')}` : 'Price on request';
}

function formatDuration(row) {
  const n = Number(row.duration_minutes || 0) + Number(row.processing_time_minutes || 0) + Number(row.extra_time_minutes || 0);
  return n > 0 ? `${n} min` : 'Duration on request';
}

async function listPublicServices() {
  const result = await pool.query(`
    SELECT s.id, s.name, s.duration_minutes, s.processing_time_minutes, s.extra_time_minutes,
           s.price, s.display_price, s.customer_description, s.image_url, s.booking_note,
           sc.name AS category_name
      FROM services s
      LEFT JOIN service_categories sc ON sc.id = s.category_id
     WHERE s.status = 'active'
     ORDER BY sc.display_order NULLS LAST, s.display_order, s.name
  `);
  return result.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    category: row.category_name || 'Services',
    duration: formatDuration(row),
    price: formatPrice(row),
    description: row.customer_description || null,
    imageUrl: row.image_url || resolveServiceImageUrl(row.name),
    bookingNote: row.booking_note || null,
  }));
}

async function getPublicService(id) {
  return (await listPublicServices()).find((service) => service.id === Number(id)) || null;
}

module.exports = { listPublicServices, getPublicService, formatPrice, formatDuration };
