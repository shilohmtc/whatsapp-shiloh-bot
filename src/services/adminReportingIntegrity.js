const { pool } = require('../db/pool');

function periodDateSql(period = 'today', dateExpr = 'd') {
  const today = `(NOW() AT TIME ZONE 'Africa/Johannesburg')::date`;
  if (period === 'month') {
    return `${dateExpr} >= date_trunc('month', ${today})::date AND ${dateExpr} <= ${today}`;
  }
  if (period === 'week') {
    return `${dateExpr} >= date_trunc('week', ${today})::date AND ${dateExpr} <= ${today}`;
  }
  return `${dateExpr} = ${today}`;
}

function canonicalBounds(period = 'today') {
  if (period === 'month') {
    return `a.starts_at >= (date_trunc('month', NOW() AT TIME ZONE 'Africa/Johannesburg') AT TIME ZONE 'Africa/Johannesburg')
      AND a.starts_at < NOW()`;
  }
  if (period === 'week') {
    return `a.starts_at >= (date_trunc('week', NOW() AT TIME ZONE 'Africa/Johannesburg') AT TIME ZONE 'Africa/Johannesburg')
      AND a.starts_at < NOW()`;
  }
  return `a.starts_at >= (((NOW() AT TIME ZONE 'Africa/Johannesburg')::date)::timestamp AT TIME ZONE 'Africa/Johannesburg')
      AND a.starts_at < NOW()`;
}

async function pendingCanonicalStatuses(staffId, period = 'today') {
  const result = await pool.query(`
    SELECT a.id,a.starts_at,a.status,a.total_price
      FROM appointments a
      JOIN appointment_staff ast ON ast.appointment_id=a.id AND ast.staff_id=$1
     WHERE ${canonicalBounds(period)}
       AND a.status NOT IN ('completed','cancelled','no_show')
     ORDER BY a.starts_at,a.id`, [staffId]);
  return result.rows;
}

async function unresolvedGoldieAppointments(staffName, period = 'today') {
  const dateExpr = `to_date(er.source_payload->>'Date','DD/MM/YY')`;
  const result = await pool.query(`
    WITH latest_staged_appointments AS (
      SELECT id
        FROM import_batches
       WHERE source='goldie'
         AND status='completed'
         AND metadata->>'entity_type'='appointment'
       ORDER BY created_at DESC,id DESC
       LIMIT 1
    )
    SELECT er.id,er.external_id,er.reconciliation_status,
           er.source_payload->>'Date' AS source_date,
           er.source_payload->>'Clients' AS client_name,
           er.source_payload->>'Services' AS services,
           er.source_payload->>'Staff' AS staff,
           CASE WHEN COALESCE(er.source_payload->>'Price','') ~ '^\\d+(?:\\.\\d+)?$'
                THEN (er.source_payload->>'Price')::numeric ELSE NULL END AS price
      FROM external_records er
      JOIN latest_staged_appointments b ON b.id=er.import_batch_id
     WHERE er.source='goldie'
       AND er.entity_type='appointment'
       AND er.reconciliation_status NOT IN ('matched','ignored')
       AND COALESCE(er.source_payload->>'Date','') ~ '^\\d{2}/\\d{2}/\\d{2}$'
       AND ${periodDateSql(period, dateExpr)}
       AND ${dateExpr} <= (NOW() AT TIME ZONE 'Africa/Johannesburg')::date
       AND LOWER(COALESCE(er.source_payload->>'Staff','')) LIKE '%' || LOWER($1) || '%'
       AND LOWER(TRIM(COALESCE(er.source_payload->>'Services',''))) <> 'personal'
     ORDER BY ${dateExpr},er.id`, [staffName]);
  return result.rows;
}

async function earningsIntegrity({ staffId, staffName, period = 'today' }) {
  const [pendingStatus, unresolvedGoldie] = await Promise.all([
    pendingCanonicalStatuses(staffId, period),
    unresolvedGoldieAppointments(staffName, period),
  ]);
  const unresolvedGoldieValue = unresolvedGoldie.reduce((sum, row) => sum + Number(row.price || 0), 0);
  return {
    clean: pendingStatus.length === 0 && unresolvedGoldie.length === 0,
    pendingStatus,
    unresolvedGoldie,
    unresolvedGoldieValue,
  };
}

function integrityLines(integrity) {
  if (!integrity || integrity.clean) return [];
  const lines = [
    '⚠️ *REPORTING INTEGRITY — PROVISIONAL*',
    'This earnings total may be understated. Shiloh will not silently count uncertain appointments.',
  ];
  if (integrity.pendingStatus.length) {
    lines.push(`Past CRM appointments awaiting final completion status: *${integrity.pendingStatus.length}*`);
  }
  if (integrity.unresolvedGoldie.length) {
    lines.push(`Unresolved Goldie appointments in this period: *${integrity.unresolvedGoldie.length}*`);
    if (integrity.unresolvedGoldieValue > 0) {
      const money = new Intl.NumberFormat('en-ZA', { style:'currency', currency:'ZAR', maximumFractionDigits:0 }).format(integrity.unresolvedGoldieValue);
      lines.push(`Source value still under reconciliation: *${money}*`);
    }
  }
  lines.push('Resolve the underlying CRM/Goldie evidence before treating this figure as final.');
  return lines;
}

module.exports = {
  periodDateSql,
  canonicalBounds,
  pendingCanonicalStatuses,
  unresolvedGoldieAppointments,
  earningsIntegrity,
  integrityLines,
};
