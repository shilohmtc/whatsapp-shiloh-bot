const { pool } = require('../db/pool');

function norm(v) {
  return String(v || '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function splitList(v) {
  return String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
}

function tokens(v) {
  return new Set(norm(v).replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean));
}

function jaccard(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

function compact(v) {
  return norm(v).replace(/[^a-z0-9]/g, '');
}

function similarity(a, b) {
  const na = norm(a), nb = norm(b);
  if (na === nb) return 1;
  if (compact(a) === compact(b)) return 0.99;
  const jac = jaccard(a, b);
  const ca = compact(a), cb = compact(b);
  let prefix = 0;
  const max = Math.min(ca.length, cb.length);
  while (prefix < max && ca[prefix] === cb[prefix]) prefix++;
  const prefixScore = max ? prefix / Math.max(ca.length, cb.length) : 0;
  return Math.max(jac, prefixScore * 0.8);
}

async function analyzeAppointmentServiceMismatches({ appointmentBatchId = '2' } = {}) {
  const [staged, services] = await Promise.all([
    pool.query(`SELECT external_id, source_payload FROM external_records WHERE import_batch_id=$1 AND source='goldie' AND entity_type='appointment' AND reconciliation_status='unmatched' ORDER BY id`, [appointmentBatchId]),
    pool.query(`SELECT id,name,status,duration_minutes,price FROM services ORDER BY name`),
  ]);

  const canonical = services.rows.map((r) => ({ id: String(r.id), name: r.name, status: r.status, durationMinutes: r.duration_minutes, price: r.price == null ? null : Number(r.price) }));
  const exact = new Map(canonical.map((r) => [norm(r.name), r]));
  const counts = new Map();

  for (const rec of staged.rows) {
    const p = rec.source_payload || {};
    if (norm(p.Type) !== 'appointment') continue;
    for (const name of splitList(p.Services)) {
      if (exact.has(norm(name))) continue;
      const key = name.trim();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  const items = [...counts.entries()].map(([sourceName, count]) => {
    const candidates = canonical
      .map((c) => ({ ...c, score: Number(similarity(sourceName, c.name).toFixed(3)) }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 5);
    return { sourceName, count, normalizedSourceName: norm(sourceName), candidates };
  }).sort((a, b) => b.count - a.count || a.sourceName.localeCompare(b.sourceName));

  return {
    appointmentBatchId: String(appointmentBatchId),
    unmatchedAppointmentRows: staged.rows.filter((r) => norm((r.source_payload || {}).Type) === 'appointment').length,
    distinctUnmatchedServiceNames: items.length,
    top: items.slice(0, 60),
    policy: { readOnly: true, noAliasesAutoApproved: true, candidateScoresAreHeuristicOnly: true },
  };
}

module.exports = { analyzeAppointmentServiceMismatches };
