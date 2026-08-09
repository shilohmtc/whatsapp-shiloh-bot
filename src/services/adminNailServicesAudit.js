const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
function hasPermission(admin,p){return admin?.permissions?.[p]===true;}
async function getAdmin(sender){const r=await pool.query(`SELECT id,staff_id,display_name,role,permissions FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,[normalizePhone(sender)]);return r.rows[0]||null;}
async function audit(adminId,metadata){await pool.query(`INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata) VALUES ($1,'admin.discontinued_services_audit','service',NULL,$2::jsonb)`,[adminId,JSON.stringify(metadata)]);}
async function processAdminNailServicesAuditMessage(sender,text){
 const value=String(text||'').trim(); if(!/^(nail\s+services|discontinued\s+services)\s+audit$/i.test(value))return {handled:false};
 const admin=await getAdmin(sender);if(!admin)return {handled:false};if(!hasPermission(admin,'schedule:manage'))return {handled:true,admin,reply:"You don't have permission to run catalogue audits."};
 const result=await pool.query(`SELECT s.id,s.name,s.status,COUNT(DISTINCT ss.staff_id)::int eligible_staff_count,COUNT(DISTINCT aps.appointment_id)::int appointment_count FROM services s LEFT JOIN staff_services ss ON ss.service_id=s.id LEFT JOIN appointment_services aps ON aps.service_id=s.id WHERE LOWER(s.name) ~ '(nail|gel|manicure|pedicure|medi[- ]?heel|wax|waxing|lash|lashes|eyelash)' GROUP BY s.id,s.name,s.status ORDER BY LOWER(s.name),s.id`);
 await audit(admin.id,{serviceIds:result.rows.map(r=>r.id),count:result.rows.length});
 if(!result.rows.length)return {handled:true,admin,reply:'*Discontinued services audit*\n\nNo matching canonical services were found.\n\nRead-only audit. Nothing was changed.'};
 const lines=['*Discontinued services audit*','',`${result.rows.length} matching canonical service${result.rows.length===1?'':'s'}:`,''];for(const row of result.rows){const protectedMedi=/medi[- ]?heel/i.test(row.name);lines.push(`- #${row.id} ${row.name}${protectedMedi?' — KEEP':''}`);lines.push(`  Status: ${row.status} · Staff: ${row.eligible_staff_count} · Appointments: ${row.appointment_count}`);}lines.push('','Medi-Heel services are explicitly marked KEEP.','Read-only audit. No services, clients, appointments or staff eligibility were changed.');return {handled:true,admin,reply:lines.join('\n')};
}
module.exports={processAdminNailServicesAuditMessage};
