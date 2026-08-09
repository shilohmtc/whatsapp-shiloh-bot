const { pool } = require("../db/pool");

function clampLimit(value, fallback = 50, max = 200) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function parseOffset(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

async function listClients({ q, status, limit, offset }) {
  const values = [];
  const where = [];
  if (status) { values.push(status); where.push(`c.status = $${values.length}`); }
  if (q) {
    values.push(`%${q.trim()}%`);
    const p = `$${values.length}`;
    where.push(`(c.display_name ILIKE ${p} OR EXISTS (SELECT 1 FROM client_contacts ccq WHERE ccq.client_id = c.id AND ccq.value ILIKE ${p}))`);
  }
  values.push(clampLimit(limit)); const limitParam = `$${values.length}`;
  values.push(parseOffset(offset)); const offsetParam = `$${values.length}`;
  const result = await pool.query(`
    SELECT c.id, c.display_name, c.preferred_language, c.status, c.preferences, c.tags,
           c.custom_attributes, c.source, c.created_at, c.updated_at,
           COALESCE(jsonb_agg(jsonb_build_object('id', cc.id, 'type', cc.contact_type, 'value', cc.value,
             'isPrimary', cc.is_primary, 'verifiedAt', cc.verified_at) ORDER BY cc.is_primary DESC, cc.id)
             FILTER (WHERE cc.id IS NOT NULL), '[]'::jsonb) AS contacts
    FROM clients c LEFT JOIN client_contacts cc ON cc.client_id = c.id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    GROUP BY c.id ORDER BY c.display_name NULLS LAST, c.id
    LIMIT ${limitParam} OFFSET ${offsetParam}`, values);
  return result.rows;
}

async function getClient(id) {
  const result = await pool.query(`
    SELECT c.id, c.display_name, c.preferred_language, c.status, c.preferences, c.tags,
           c.custom_attributes, c.source, c.created_at, c.updated_at,
           COALESCE(jsonb_agg(jsonb_build_object('id', cc.id, 'type', cc.contact_type, 'value', cc.value,
             'isPrimary', cc.is_primary, 'verifiedAt', cc.verified_at) ORDER BY cc.is_primary DESC, cc.id)
             FILTER (WHERE cc.id IS NOT NULL), '[]'::jsonb) AS contacts
    FROM clients c LEFT JOIN client_contacts cc ON cc.client_id = c.id
    WHERE c.id = $1 GROUP BY c.id`, [id]);
  return result.rows[0] || null;
}

async function getClientAppointments(id, { limit, offset }) {
  const result = await pool.query(`
    SELECT a.id, a.starts_at, a.ends_at, a.status, a.title, a.notes, a.total_price, a.currency,
           a.source, a.created_at, a.updated_at, l.id AS location_id, l.name AS location_name,
           COALESCE((SELECT jsonb_agg(jsonb_build_object('id', aps.id, 'serviceId', aps.service_id,
             'name', aps.service_name_snapshot, 'price', aps.price_snapshot, 'durationMinutes', aps.duration_minutes_snapshot)
             ORDER BY aps.position) FROM appointment_services aps WHERE aps.appointment_id = a.id), '[]'::jsonb) AS services,
           COALESCE((SELECT jsonb_agg(jsonb_build_object('id', ast.id, 'staffId', ast.staff_id,
             'name', ast.staff_name_snapshot) ORDER BY ast.position) FROM appointment_staff ast WHERE ast.appointment_id = a.id), '[]'::jsonb) AS staff
    FROM appointments a LEFT JOIN locations l ON l.id = a.location_id
    WHERE a.client_id = $1 ORDER BY a.starts_at DESC
    LIMIT $2 OFFSET $3`, [id, clampLimit(limit), parseOffset(offset)]);
  return result.rows;
}

async function listServices({ status, categoryId, limit, offset }) {
  const values = []; const where = [];
  if (status) { values.push(status); where.push(`s.status = $${values.length}`); }
  if (categoryId) { values.push(categoryId); where.push(`s.category_id = $${values.length}`); }
  values.push(clampLimit(limit, 100)); const lp = `$${values.length}`;
  values.push(parseOffset(offset)); const op = `$${values.length}`;
  const result = await pool.query(`
    SELECT s.id, s.name, s.duration_minutes, s.processing_time_minutes, s.extra_time_minutes,
           s.variable_price, s.price, s.display_price, s.display_order, s.is_default, s.status,
           s.external_source, s.external_id, s.created_at, s.updated_at,
           sc.id AS category_id, sc.name AS category_name
    FROM services s LEFT JOIN service_categories sc ON sc.id = s.category_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY sc.display_order NULLS LAST, s.display_order, s.name LIMIT ${lp} OFFSET ${op}`, values);
  return result.rows;
}

async function listStaff({ status, limit, offset }) {
  const values = []; const where = [];
  if (status) { values.push(status); where.push(`st.status = $${values.length}`); }
  values.push(clampLimit(limit, 100)); const lp = `$${values.length}`;
  values.push(parseOffset(offset)); const op = `$${values.length}`;
  const result = await pool.query(`
    SELECT st.id, st.display_name, st.resource_type, st.status, st.source_name, st.created_at, st.updated_at,
           COALESCE((SELECT jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'status', s.status)
             ORDER BY s.name) FROM staff_services ss JOIN services s ON s.id = ss.service_id WHERE ss.staff_id = st.id), '[]'::jsonb) AS services
    FROM staff st ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY st.display_name LIMIT ${lp} OFFSET ${op}`, values);
  return result.rows;
}

async function listAppointments({ status, clientId, from, to, limit, offset }) {
  const values = []; const where = [];
  for (const [value, sql] of [[status, "a.status"], [clientId, "a.client_id"]]) {
    if (value) { values.push(value); where.push(`${sql} = $${values.length}`); }
  }
  if (from) { values.push(from); where.push(`a.starts_at >= $${values.length}`); }
  if (to) { values.push(to); where.push(`a.starts_at < $${values.length}`); }
  values.push(clampLimit(limit)); const lp = `$${values.length}`;
  values.push(parseOffset(offset)); const op = `$${values.length}`;
  const result = await pool.query(`
    SELECT a.id, a.client_id, c.display_name AS client_name, a.location_id, l.name AS location_name,
           a.starts_at, a.ends_at, a.status, a.title, a.total_price, a.currency, a.source, a.created_at, a.updated_at
    FROM appointments a LEFT JOIN clients c ON c.id = a.client_id LEFT JOIN locations l ON l.id = a.location_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY a.starts_at DESC LIMIT ${lp} OFFSET ${op}`, values);
  return result.rows;
}

async function getAppointment(id) {
  const result = await pool.query(`
    SELECT a.*, c.display_name AS client_name, l.name AS location_name,
           COALESCE((SELECT jsonb_agg(to_jsonb(aps) ORDER BY aps.position) FROM appointment_services aps WHERE aps.appointment_id = a.id), '[]'::jsonb) AS services,
           COALESCE((SELECT jsonb_agg(to_jsonb(ast) ORDER BY ast.position) FROM appointment_staff ast WHERE ast.appointment_id = a.id), '[]'::jsonb) AS staff,
           COALESCE((SELECT jsonb_agg(to_jsonb(ash) ORDER BY ash.changed_at) FROM appointment_status_history ash WHERE ash.appointment_id = a.id), '[]'::jsonb) AS status_history
    FROM appointments a LEFT JOIN clients c ON c.id = a.client_id LEFT JOIN locations l ON l.id = a.location_id
    WHERE a.id = $1`, [id]);
  return result.rows[0] || null;
}

module.exports = { listClients, getClient, getClientAppointments, listServices, listStaff, listAppointments, getAppointment };
