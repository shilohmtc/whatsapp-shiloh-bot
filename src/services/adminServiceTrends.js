const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { isBusinessWide } = require('./staffAdminScope');

function has(admin, permission) { return admin?.permissions?.[permission] === true; }

async function getAdmin(sender) {
  const result = await pool.query(
    `SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope
       FROM staff_admin_accounts
      WHERE normalized_whatsapp=$1 AND active=TRUE`,
    [normalizePhone(sender)]
  );
  return result.rows[0] || null;
}

function scopeClause(admin) {
  if (isBusinessWide(admin)) return { sql: 'TRUE', params: [] };
  return {
    sql: `EXISTS (
      SELECT 1 FROM appointment_staff ast_scope
       WHERE ast_scope.appointment_id=a.id AND ast_scope.staff_id=$1
    ) AND EXISTS (
      SELECT 1 FROM staff_services ss_scope
       WHERE ss_scope.staff_id=$1 AND ss_scope.service_id=aps.service_id
    )`,
    params: [admin.staff_id],
  };
}

async function serviceTrendData(admin) {
  if (!isBusinessWide(admin) && !admin.staff_id) return [];
  const scope = scopeClause(admin);
  const result = await pool.query(
    `WITH service_counts AS (
       SELECT aps.service_name_snapshot AS service,
              COUNT(DISTINCT a.id) FILTER (
                WHERE a.starts_at >= NOW() - INTERVAL '30 days'
                  AND a.starts_at < NOW()
              )::int AS current_count,
              COUNT(DISTINCT a.id) FILTER (
                WHERE a.starts_at >= NOW() - INTERVAL '60 days'
                  AND a.starts_at < NOW() - INTERVAL '30 days'
              )::int AS previous_count
         FROM appointments a
         JOIN appointment_services aps ON aps.appointment_id=a.id
        WHERE a.status <> 'cancelled'
          AND a.starts_at >= NOW() - INTERVAL '60 days'
          AND ${scope.sql}
        GROUP BY aps.service_name_snapshot
     )
     SELECT service,current_count,previous_count,
            (current_count - previous_count)::int AS change_count
       FROM service_counts
      WHERE current_count > 0 OR previous_count > 0
      ORDER BY current_count DESC, change_count DESC, service`,
    scope.params
  );
  return result.rows;
}

function trendLabel(row) {
  const current = Number(row.current_count || 0);
  const previous = Number(row.previous_count || 0);
  if (previous === 0 && current > 0) return 'new';
  if (previous === 0) return '—';
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return `↑ ${pct}%`;
  if (pct < 0) return `↓ ${Math.abs(pct)}%`;
  return '→ 0%';
}

function renderServiceTrends(admin, rows) {
  const own = !isBusinessWide(admin);
  const title = own ? `*YOUR SERVICE TRENDS — ${admin.display_name.toUpperCase()}*` : '*SHILOH — SERVICE TRENDS*';
  if (!rows.length) return `${title}\n\nNo non-cancelled service bookings were found in your authorized scope for the last 60 days.`;

  const currentTotal = rows.reduce((sum, row) => sum + Number(row.current_count || 0), 0);
  const previousTotal = rows.reduce((sum, row) => sum + Number(row.previous_count || 0), 0);
  const lines = [title, 'Last 30 days vs previous 30 days', '', `Current service bookings: *${currentTotal}* · Previous: *${previousTotal}*`, '', '*Top services*'];
  for (const row of rows.slice(0, 10)) {
    lines.push(`${row.current_count} × ${row.service} · ${trendLabel(row)} (was ${row.previous_count})`);
  }
  lines.push('', 'Counts use non-cancelled Shiloh CRM appointments and respect your authorized staff/service scope. Trends describe booking volume, not revenue or clinical outcomes.');
  return lines.join('\n');
}

async function audit(admin, rows) {
  await pool.query(
    `INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata)
     VALUES($1,'admin.report.service_trends','admin_report',NULL,$2::jsonb)`,
    [admin.id, JSON.stringify({ scope: isBusinessWide(admin) ? 'all_business' : 'practitioner_self', serviceCount: rows.length })]
  );
}

async function processAdminServiceTrendsMessage(sender, text) {
  const raw = String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!['service trends','services trends','services report','service report','top services'].includes(raw)) return { handled: false };
  const admin = await getAdmin(sender);
  if (!admin) return { handled: false };
  if (!has(admin, 'appointment:view')) return { handled: true, admin, reply: 'Your admin account does not currently have permission to view service reports.' };
  const rows = await serviceTrendData(admin);
  await audit(admin, rows);
  return { handled: true, admin, reply: renderServiceTrends(admin, rows) };
}

module.exports = { processAdminServiceTrendsMessage, serviceTrendData, renderServiceTrends, trendLabel };
