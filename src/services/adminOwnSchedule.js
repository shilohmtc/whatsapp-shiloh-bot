const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { getWorkingHours, replaceWorkingHoursDay, clearWorkingHoursDayOverride, addScheduleException, formatWorkingHours } = require('./staffScheduleService');

const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function clean(v=''){return String(v||'').trim().replace(/\s+/g,' ');}
function dayIndex(v=''){const n=clean(v).toLowerCase();return DAYS.findIndex(d=>d.toLowerCase()===n);}
function hours(v=''){const m=clean(v).match(/^([0-2]\d:[0-5]\d)-([0-2]\d:[0-5]\d)$/);return m&&m[2]>m[1]?{start:m[1],end:m[2]}:null;}
async function adminFor(sender){const r=await pool.query(`SELECT id,staff_id,display_name,permissions,business_role FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,[normalizePhone(sender)]);return r.rows[0]||null;}
function allowed(admin){return admin?.business_role==='tenant_practitioner'&&admin?.staff_id&&admin?.permissions?.['schedule:manage']===true;}
async function processAdminOwnScheduleMessage(sender,text){
 const admin=await adminFor(sender);if(!allowed(admin))return{handled:false};const raw=clean(text),v=raw.toLowerCase();
 if(['my schedule','my regular hours','staff hours','regular staff hours'].includes(v)){
  const data=await getWorkingHours(admin.staff_id);
  return{handled:true,admin,reply:[`*${admin.display_name} — My schedule*`,'',formatWorkingHours(data),'','To change a day:','Set my hours DAY | HH:MM-HH:MM','Set my hours DAY | CLINIC','Set my hours DAY | CLOSED','','For leave/special availability, send *My leave*.'].join('\n')};
 }
 if(['my leave','my leave / special availability','leave','leave / special availability','special availability'].includes(v)){
  return{handled:true,admin,reply:['*My leave / special availability*','','Use one of:','Add my leave YYYY-MM-DD | REASON','Add my unavailable YYYY-MM-DD | HH:MM-HH:MM | REASON','Add my available YYYY-MM-DD | HH:MM-HH:MM | REASON','','These commands can only change your own practitioner schedule.'].join('\n')};
 }
 let m=raw.match(/^set my hours\s+([^|]+)\|\s*(.+)$/i);
 if(m){const day=dayIndex(m[1]);if(day<0)return{handled:true,admin,reply:'Use a full weekday name, for example Monday.'};const mode=clean(m[2]);let result;if(/^clinic$/i.test(mode))result=await clearWorkingHoursDayOverride({staffId:admin.staff_id,dayOfWeek:day,actorAdminId:admin.id});else if(/^closed$/i.test(mode))result=await replaceWorkingHoursDay({staffId:admin.staff_id,dayOfWeek:day,windows:[],actorAdminId:admin.id});else{const h=hours(mode);if(!h)return{handled:true,admin,reply:'Use HH:MM-HH:MM, CLINIC, or CLOSED.'};result=await replaceWorkingHoursDay({staffId:admin.staff_id,dayOfWeek:day,windows:[{startsLocal:h.start,endsLocal:h.end}],actorAdminId:admin.id});}const data=await getWorkingHours(admin.staff_id);return{handled:true,admin,reply:`✅ ${DAYS[day]} updated for ${admin.display_name}.\n\n${formatWorkingHours(data)}`};}
 m=raw.match(/^add my leave\s+(\d{4}-\d{2}-\d{2})\s*\|\s*(.+)$/i);
 if(m){const r=await addScheduleException({staffId:admin.staff_id,date:m[1],type:'unavailable',startsLocal:null,endsLocal:null,reason:m[2],actorAdminId:admin.id});return{handled:true,admin,reply:r.status==='created'?`✅ Full-day leave added for ${m[1]}.`:(r.reply||'Leave update rejected.')};}
 m=raw.match(/^add my (unavailable|available)\s+(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+)\s*\|\s*(.+)$/i);
 if(m){const h=hours(m[3]);if(!h)return{handled:true,admin,reply:'Use the time range as HH:MM-HH:MM.'};const r=await addScheduleException({staffId:admin.staff_id,date:m[2],type:m[1].toLowerCase(),startsLocal:h.start,endsLocal:h.end,reason:m[4],actorAdminId:admin.id});return{handled:true,admin,reply:r.status==='created'?`✅ ${m[1].toLowerCase()} time added for ${m[2]} ${h.start}–${h.end}.`:(r.reply||'Schedule update rejected.')};}
 if(/^(working hours|set working hours|add schedule exception|remove schedule exception)\b/i.test(raw))return{handled:true,admin,reply:'For privacy and safety, your tenant account can only change your own schedule. Send *My schedule* for the scoped commands.'};
 return{handled:false};
}
module.exports={processAdminOwnScheduleMessage};
