const { pool } = require('../db/pool');
const logger = require('../lib/logger');
const { getMenuOptions } = require('./adminMobileMenu');

async function runP2StaffRolloutSmokeTest(){
  if(process.env.RUN_P2_STAFF_ROLLOUT_SMOKE_TEST!=='true') return {status:'disabled'};
  const names=['Christel','Jean-Pierre','Marietjie','Abigail'];
  const result=await pool.query(`SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope,active FROM staff_admin_accounts WHERE LOWER(display_name)=ANY($1::text[]) ORDER BY display_name`,[names.map(n=>n.toLowerCase())]);
  const rows=result.rows;
  const byName=new Map(rows.map(r=>[String(r.display_name).toLowerCase(),r]));
  const expected={
    'christel':{business_role:'owner',calendar_scope:'all_business',service_scope:'all_services'},
    'jean-pierre':{business_role:'business_admin',calendar_scope:'all_business',service_scope:'all_services'},
    'marietjie':{business_role:'tenant_practitioner',calendar_scope:'own_services',service_scope:'own_services'},
    'abigail':{business_role:'employee_practitioner',calendar_scope:'own_appointments',service_scope:'own_services'},
  };
  const checks=[];
  for(const [name,want] of Object.entries(expected)){
    const row=byName.get(name);
    if(!row) throw new Error(`P2 smoke: missing active/admin account row for ${name}`);
    for(const [field,value] of Object.entries(want)) if(row[field]!==value) throw new Error(`P2 smoke: ${name} ${field}=${row[field]} expected ${value}`);
    const options=getMenuOptions(row).map(o=>o.key);
    if(name==='marietjie' && (!options.includes('pricing')||!options.includes('schedule')||options.includes('help')===false)) throw new Error('P2 smoke: Marietjie menu is missing tenant controls');
    if(name==='abigail' && (options.includes('pricing')||options.includes('schedule')||options.includes('walkin'))) throw new Error('P2 smoke: Abigail menu exposes management controls');
    checks.push({name,businessRole:row.business_role,calendarScope:row.calendar_scope,serviceScope:row.service_scope,menu:options});
  }
  const staff=await pool.query(`SELECT st.display_name,COUNT(ss.service_id)::int AS service_count FROM staff st LEFT JOIN staff_services ss ON ss.staff_id=st.id LEFT JOIN services s ON s.id=ss.service_id AND s.status='active' WHERE LOWER(st.display_name) IN ('marietjie','abigail') GROUP BY st.id,st.display_name ORDER BY st.display_name`);
  for(const r of staff.rows) if(r.service_count<1) throw new Error(`P2 smoke: ${r.display_name} has no service mappings`);
  const summary={status:'passed',checks,serviceMappings:staff.rows,mutations:0,whatsappMessages:0};
  logger.info(summary,'P2 staff rollout smoke test passed');
  return summary;
}

module.exports={runP2StaffRolloutSmokeTest};
