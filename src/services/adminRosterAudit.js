const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

async function getAdmin(sender){
  const r=await pool.query(`SELECT id,display_name,permissions FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,[normalizePhone(sender)]);
  return r.rows[0]||null;
}

async function processAdminRosterAuditMessage(sender,text){
  const value=String(text||'').trim().toLowerCase().replace(/\s+/g,' ');
  if(!['roster status','roster completeness','staff roster','check roster'].includes(value)) return {handled:false};
  const admin=await getAdmin(sender); if(!admin) return {handled:false};
  if(admin.permissions?.['schedule:manage']!==true) return {handled:true,admin,reply:"You don't have permission to review staff scheduling configuration."};

  const result=await pool.query(`
    WITH hours AS (
      SELECT staff_id,
             COUNT(*) FILTER (WHERE active) AS window_count,
             COUNT(DISTINCT day_of_week) FILTER (WHERE active) AS day_count
      FROM staff_working_hours
      GROUP BY staff_id
    ),
    svc AS (
      SELECT ss.staff_id, COUNT(*) AS service_count
      FROM staff_services ss
      JOIN services s ON s.id=ss.service_id AND s.status='active'
      GROUP BY ss.staff_id
    ),
    ex AS (
      SELECT staff_id, COUNT(*) FILTER (WHERE exception_date>=CURRENT_DATE) AS exception_count
      FROM staff_schedule_exceptions
      GROUP BY staff_id
    )
    SELECT st.id,st.display_name,st.resource_type,
           COALESCE(h.day_count,0)::int AS working_days,
           COALESCE(h.window_count,0)::int AS working_windows,
           COALESCE(svc.service_count,0)::int AS active_services,
           COALESCE(ex.exception_count,0)::int AS upcoming_exceptions
    FROM staff st
    LEFT JOIN hours h ON h.staff_id=st.id
    LEFT JOIN svc ON svc.staff_id=st.id
    LEFT JOIN ex ON ex.staff_id=st.id
    WHERE st.status='active'
    ORDER BY st.display_name,st.id`);

  await pool.query(`INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata) VALUES ($1,'admin.roster_completeness_viewed','admin_assistant',NULL,$2::jsonb)`,[admin.id,JSON.stringify({activeStaff:result.rows.length})]);

  if(!result.rows.length) return {handled:true,admin,reply:'No active staff records were found.'};
  const incomplete=result.rows.filter(r=>r.working_days===0||r.active_services===0);
  const lines=['*Roster completeness*','',`${result.rows.length} active staff record${result.rows.length===1?'':'s'}.`,`${incomplete.length} need attention.`,''];
  for(const r of result.rows){
    const flags=[];
    if(r.working_days===0) flags.push('no working hours');
    if(r.active_services===0) flags.push('no active services');
    const status=flags.length?`⚠️ ${flags.join(', ')}`:'✅ ready';
    lines.push(`• ${r.display_name} — ${r.working_days} day${r.working_days===1?'':'s'}, ${r.active_services} service${r.active_services===1?'':'s'} — ${status}`);
  }
  lines.push('','This is a read-only configuration audit. No staff, service or schedule data was changed.');
  return {handled:true,admin,reply:lines.join('\n')};
}

module.exports={processAdminRosterAuditMessage};
