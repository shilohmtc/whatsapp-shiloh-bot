const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { listAvailableSlots } = require('./availabilityService');

function clean(v='') { return String(v).trim().replace(/\s+/g,' ').slice(0,120); }
function parseDate(v='') {
  const m=clean(v).match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/); if(!m) return null;
  const d=Number(m[1]), mo=Number(m[2]), y=Number(m[3]); const p=new Date(Date.UTC(y,mo-1,d));
  if(p.getUTCFullYear()!==y||p.getUTCMonth()+1!==mo||p.getUTCDate()!==d) return null;
  return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
async function resolve(table, nameColumn, query) {
  const q=clean(query); const r=await pool.query(`SELECT * FROM ${table} WHERE status='active' AND ${nameColumn} ILIKE $1 ORDER BY CASE WHEN LOWER(${nameColumn})=LOWER($2) THEN 0 ELSE 1 END, ${nameColumn}, id LIMIT 10`,[`%${q}%`,q]); return r.rows;
}
function fmtTime(v){return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v));}
async function processAdminAvailableSlotsMessage(sender,text){
  const m=String(text).trim().match(/^available\s+slots\s+(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/i);
  if(!m) return {handled:false};
  const a=await pool.query(`SELECT id,display_name,permissions FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,[normalizePhone(sender)]); const admin=a.rows[0];
  if(!admin) return {handled:false};
  if(admin.permissions?.['appointment:view']!==true) return {handled:true,admin,reply:'Your admin account does not currently have permission to view appointment availability.'};
  const date=parseDate(m[3]); if(!date) return {handled:true,admin,reply:'Use: Available slots STAFF | SERVICE | DD/MM/YYYY'};
  const staff=await resolve('staff','display_name',m[1]); if(!staff.length) return {handled:true,admin,reply:`I couldn't find an active staff member matching “${clean(m[1])}”.`};
  if(staff.length>1&&staff[0].display_name.toLowerCase()!==clean(m[1]).toLowerCase()) return {handled:true,admin,reply:`I found more than one staff match. Please use the exact name:\n${staff.map(x=>`• ${x.display_name} (#${x.id})`).join('\n')}`};
  const services=await resolve('services','name',m[2]); if(!services.length) return {handled:true,admin,reply:`I couldn't find an active service matching “${clean(m[2])}”.`};
  if(services.length>1&&services[0].name.toLowerCase()!==clean(m[2]).toLowerCase()) return {handled:true,admin,reply:`I found more than one service match. Please use the exact name:\n${services.map(x=>`• ${x.name} (#${x.id})`).join('\n')}`};
  const result=await listAvailableSlots({staffId:staff[0].id,serviceId:services[0].id,date,intervalMinutes:15});
  await pool.query(`INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata) VALUES ($1,'admin.available_slots_viewed','admin_assistant',NULL,$2::jsonb)`,[admin.id,JSON.stringify({staffId:staff[0].id,serviceId:services[0].id,date,status:result.status,slotCount:result.slots.length})]);
  if(result.status==='not_eligible') return {handled:true,admin,reply:`${staff[0].display_name} is not eligible for ${services[0].name}.`};
  if(result.status==='invalid_duration') return {handled:true,admin,reply:`${services[0].name} does not have a usable duration.`};
  if(!result.slots.length) return {handled:true,admin,reply:`Available slots — ${staff[0].display_name} — ${services[0].name}\nDate: ${date}\n\nNo authoritative bookable slots were found. Working hours, schedule exceptions, existing appointments and calendar blocks were all applied.`};
  const lines=[`Available slots — ${staff[0].display_name} — ${services[0].name}`,`Date: ${date}`,`Service window: ${result.totalMinutes} minutes`,''];
  for(const s of result.slots.slice(0,24)) lines.push(`• ${fmtTime(s.starts_at)}–${fmtTime(s.ends_at)}`); if(result.slots.length>24) lines.push(`…and ${result.slots.length-24} more.`);
  return {handled:true,admin,reply:lines.join('\n')};
}
module.exports={processAdminAvailableSlotsMessage};
