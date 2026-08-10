const { pool } = require('../db/pool');

function isBusinessWide(admin){return ['owner','business_admin'].includes(admin?.business_role)||admin?.service_scope==='all_services'||admin?.calendar_scope==='all_business';}

async function filterClientsForAdminScope(admin,clients=[]){
  if(isBusinessWide(admin)) return clients;
  if(!admin?.staff_id||!clients.length) return [];
  const ids=clients.map(c=>Number(c.id)).filter(Number.isFinite);
  if(!ids.length) return [];
  const r=await pool.query(`
    SELECT DISTINCT a.client_id
      FROM appointments a
      JOIN appointment_staff ast ON ast.appointment_id=a.id AND ast.staff_id=$1
      JOIN appointment_services aps ON aps.appointment_id=a.id
      JOIN staff_services ss ON ss.staff_id=$1 AND ss.service_id=aps.service_id
     WHERE a.client_id=ANY($2::bigint[])
       AND a.status<>'cancelled'`,[admin.staff_id,ids]);
  const allowed=new Set(r.rows.map(x=>String(x.client_id)));
  return clients.filter(c=>allowed.has(String(c.id)));
}

module.exports={isBusinessWide,filterClientsForAdminScope};
