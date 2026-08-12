const { pool } = require('../db/pool');
const { earningsIntegrity } = require('./adminReportingIntegrity');

const AUDITED_STAFF = Object.freeze(['Christel', 'Abigail']);
const AUDITED_PERIODS = Object.freeze(['today', 'week', 'last_week', 'month']);

async function resolveAuditedStaff() {
  const result = await pool.query(`
    SELECT id, display_name
      FROM staff
     WHERE status='active'
       AND resource_type='practitioner'
       AND client_bookable=TRUE
       AND display_name = ANY($1::text[])
     ORDER BY display_name
  `, [AUDITED_STAFF]);

  const byName = new Map(result.rows.map((row) => [row.display_name, row]));
  return AUDITED_STAFF.map((name) => byName.get(name) || null);
}

async function getReportingIntegrityAudit() {
  const staff = await resolveAuditedStaff();
  const results = [];

  for (let index = 0; index < AUDITED_STAFF.length; index += 1) {
    const expectedName = AUDITED_STAFF[index];
    const practitioner = staff[index];
    if (!practitioner) {
      results.push({
        practitioner: expectedName,
        resolved: false,
        periods: {},
      });
      continue;
    }

    const periods = {};
    for (const period of AUDITED_PERIODS) {
      const integrity = await earningsIntegrity({
        staffId: practitioner.id,
        staffName: practitioner.display_name,
        period,
      });
      periods[period] = {
        clean: integrity.clean === true,
        pendingFinalStatusCount: integrity.pendingStatus.length,
        unresolvedLegacyCount: integrity.unresolvedGoldie.length,
      };
    }

    results.push({
      practitioner: practitioner.display_name,
      resolved: true,
      periods,
    });
  }

  const allResolved = results.every((item) => item.resolved);
  const allPeriodsClean = allResolved && results.every((item) =>
    AUDITED_PERIODS.every((period) => item.periods[period]?.clean === true)
  );

  return {
    safety: 'read_only_sanitized_counts_no_client_identity_no_earnings_amounts',
    appointmentViews: {
      today: true,
      tomorrow: true,
      lastWeek: true,
    },
    earningsPeriods: [...AUDITED_PERIODS],
    practitioners: results,
    allResolved,
    allPeriodsClean,
  };
}

module.exports = {
  AUDITED_STAFF,
  AUDITED_PERIODS,
  getReportingIntegrityAudit,
};
