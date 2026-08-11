const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { isBusinessWide } = require('./staffAdminScope');

function senderKey(sender){ return normalizePhone(sender); }
function has(admin,p){ return admin?.permissions?.[p] === true; }
function money(v){ return new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(Number(v||0)); }
function todayLabel(){ return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',weekday:'long',day:'2-digit',month:'long'}).format(new Date()); }

async function getAdmin(sender){
  const r=await pool.query(`SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,[senderKey(sender)]);
  return r.rows[0]||null;
}
async function audit(admin,metadata){
  await pool.query(`INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata) VALUES ($1,'admin.report.today','admin_report',NULL,$2::jsonb)`,[admin.id,JSON.stringify(metadata)]);
}
function clinicBounds(){
  return `a.starts_at >= (((NOW() AT TIME ZONE 'Africa/Johannesburg')::date)::timestamp AT TIME ZONE 'Africa/Johannesburg')
      AND a.starts_at < ((((NOW() AT TIME ZONE 'Africa/Johannesburg')::date + 1)::timestamp) AT TIME ZONE 'Africa/Johannesburg')`;
}
function scopeSql(admin,paramOffset=1){
  if(isBusinessWide(admin)) return {sql:'TRUE',params:[]};
  return {sql:`EXISTS (SELECT 1 FROM appointment_staff report_scope WHERE report_scope.appointment_id=a.id AND report_scope.staff_id=$${paramOffset})`,params:[admin.staff_id]};
}
async function reportData(admin){
  const wide=isBusinessWide(admin);
  if(!wide&&!admin.staff_id) return {appointments:[],services:[],staff:[]};
  const scope=scopeSql(admin,1);
  const params=scope.params;
  const bounds=clinicBounds();
  const serviceJoin=wide
    ? `LEFT JOIN appointment_services aps ON aps.appointment_id=a.id`
    : `LEFT JOIN appointment_services aps ON aps.appointment_id=a.id AND EXISTS (SELECT 1 FROM staff_services report_ss WHERE report_ss.staff_id=$1 AND report_ss.service_id=aps.service_id)`;
  const appointments=(await pool.query(`SELECT a.id,a.status,a.starts_at,a.total_price,COALESCE(c.display_name,a.source_client_name,'Unknown client') client_name,COALESCE(string_agg(DISTINCT aps.service_name_snapshot,', ') FILTER (WHERE aps.service_name_snapshot IS NOT NULL),'') services FROM appointments a LEFT JOIN clients c ON c.id=a.client_id ${serviceJoin} WHERE ${bounds} AND a.status<>'cancelled' AND ${scope.sql} GROUP BY a.id,c.display_name,a.source_client_name ORDER BY a.starts_at,a.id`,params)).rows;
  const services=wide
    ? (await pool.query(`SELECT aps.service_name_snapshot service,COUNT(DISTINCT a.id)::int appointments FROM appointments a JOIN appointment_services aps ON aps.appointment_id=a.id WHERE ${bounds} AND a.status<>'cancelled' GROUP BY aps.service_name_snapshot ORDER BY appointments DESC,aps.service_name_snapshot`)).rows
    : (await pool.query(`SELECT aps.service_name_snapshot service,COUNT(DISTINCT a.id)::int appointments FROM appointments a JOIN appointment_services aps ON aps.appointment_id=a.id JOIN staff_services ss ON ss.staff_id=$1 AND ss.service_id=aps.service_id WHERE ${bounds} AND a.status<>'cancelled' AND ${scope.sql} GROUP BY aps.service_name_snapshot ORDER BY appointments DESC,aps.service_name_snapshot`,params)).rows;
  const staff=wide?(await pool.query(`SELECT ast.staff_name_snapshot staff,COUNT(DISTINCT a.id)::int appointments FROM appointments a JOIN appointment_staff ast ON ast.appointment_id=a.id WHERE ${bounds} AND a.status<>'cancelled' GROUP BY ast.staff_name_snapshot ORDER BY appointments DESC,ast.staff_name_snapshot`)).rows:[];
  return {appointments,services,staff};
}
function render(admin,data){
  const own=!isBusinessWide(admin);
  const active=data.appointments;
  const status={completed:0,upcoming:0,no_show:0,other:0};
  const now=Date.now();
  for(const a of active){ if(a.status==='completed') status.completed++; else if(a.status==='no_show') status.no_show++; else if(new Date(a.starts_at).getTime()>=now) status.upcoming++; else status.other++; }
  const total=active.reduce((s,a)=>s+Number(a.total_price||0),0);
  const lines=[own?`*YOUR DAY — ${admin.display_name.toUpperCase()}*`:'*SHILOH — TODAY*',todayLabel(),''];
  lines.push(`*${active.length} appointment${active.length===1?'':'s'}*`);
  const pieces=[];if(status.completed)pieces.push(`${status.completed} completed`);if(status.upcoming)pieces.push(`${status.upcoming} upcoming`);if(status.no_show)pieces.push(`${status.no_show} no-show${status.no_show===1?'':'s'}`);if(status.other)pieces.push(`${status.other} in progress / awaiting status`);if(pieces.length)lines.push(pieces.join(' · '));
  if(data.services.length){lines.push('','*Services booked*');for(const s of data.services.slice(0,8))lines.push(`${s.appointments} × ${s.service}`);}
  if(!own&&data.staff.length){lines.push('','*Staff*');for(const s of data.staff)lines.push(`${s.staff} — ${s.appointments}`);}
  if(!own&&total>0)lines.push('',`Clinic booked value: *${money(total)}*`);
  if(own&&active.length){const next=active.find(a=>new Date(a.starts_at).getTime()>=now);if(next){const time=new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(next.starts_at));lines.push('','*Next appointment*',`${time} — ${next.client_name}${next.services?` — ${next.services}`:''}`);}}
  lines.push('','Figures come from Shiloh CRM and respect your authorized staff scope.');return lines.join('\n');
}
async function processAdminReportsMessage(sender,text){
  const raw=String(text||'').trim().toLowerCase().replace(/\s+/g,' ');
  if(!['today report',"today's report",'todays report','daily report','my report today','my today report'].includes(raw)) return {handled:false};
  const admin=await getAdmin(sender);if(!admin)return {handled:false};
  if(!has(admin,'appointment:view'))return {handled:true,admin,reply:'Your admin account does not currently have permission to view appointment reports.'};
  const data=await reportData(admin);await audit(admin,{scope:isBusinessWide(admin)?'all_business':'practitioner_self',appointmentCount:data.appointments.length});return {handled:true,admin,reply:render(admin,data)};
}
module.exports={processAdminReportsMessage,reportData,render};
