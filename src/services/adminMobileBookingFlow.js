const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { listAvailableSlots } = require('./availabilityService');
const { findClients } = require('./adminClientLookup');
const { prepareAdminBooking, confirmAdminBooking, cancelPendingBooking } = require('./adminBooking');

const sessions = new Map();
function key(sender){return normalizePhone(sender);}
function clean(v=''){return String(v||'').trim().replace(/\s+/g,' ');}
function has(admin,p){return admin?.permissions?.[p]===true;}
async function getAdmin(sender){const r=await pool.query(`SELECT id,display_name,permissions FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,[key(sender)]);return r.rows[0]||null;}
async function audit(id,action,metadata={}){await pool.query(`INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,'admin_mobile_booking',NULL,$3::jsonb)`,[id,action,JSON.stringify(metadata)]);}
function fmtDate(v){return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${v}T12:00:00+02:00`));}
function fmtTime(v){return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v));}
function parseDate(v){const s=clean(v);const m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(!m)return null;const d=Number(m[1]),mo=Number(m[2]),y=Number(m[3]);const p=new Date(Date.UTC(y,mo-1,d));if(p.getUTCFullYear()!==y||p.getUTCMonth()+1!==mo||p.getUTCDate()!==d)return null;return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
function localDateTime(date,instant){return `${date.split('-').reverse().join('/')} ${fmtTime(instant)}`;}
async function staffRows(){const r=await pool.query(`SELECT st.id,st.display_name,st.scheduling_type FROM staff st WHERE st.status='active' AND EXISTS (SELECT 1 FROM staff_services ss WHERE ss.staff_id=st.id) ORDER BY st.display_name,st.id`);return r.rows;}
async function serviceRows(staffId){const r=await pool.query(`SELECT s.id,s.name,s.duration_minutes,s.processing_time_minutes,s.extra_time_minutes FROM staff_services ss JOIN services s ON s.id=ss.service_id WHERE ss.staff_id=$1 AND s.status='active' ORDER BY s.name,s.id`,[staffId]);return r.rows;}
function numbered(title,rows,label,extra=[]){return [`*${title}*`,'',...rows.map((r,i)=>`${i+1}️⃣ ${label(r)}`),...extra,'','0️⃣ Cancel'].join('\n');}
function clientLabel(c){const contact=(c.contacts||[]).find(x=>x.isPrimary)||(c.contacts||[])[0];const digits=normalizePhone(contact?.normalizedValue||contact?.value||'');return `${c.display_name||'Unnamed client'} — CRM #${c.id}${digits.length>=4?` · …${digits.slice(-4)}`:''}`;}
async function begin(sender,admin){const staff=await staffRows();if(!staff.length)return{handled:true,admin,reply:'No active practitioners with eligible services are configured.'};sessions.set(key(sender),{step:'staff',staffRows:staff});await audit(admin.id,'mobile_booking.started');return{handled:true,admin,reply:['*Find & book an appointment*','','Choose a practitioner to begin.','',numbered('Practitioner',staff,r=>r.display_name)].join('\n')};}

async function processAdminMobileBookingFlowMessage(sender,text){
  const raw=clean(text),v=raw.toLowerCase(),k=key(sender),session=sessions.get(k);
  const direct=/^(find an available time|find availability|make a booking|new booking|find & book|find and book)$/i.test(raw);
  if(!session&&!direct)return{handled:false};
  const admin=await getAdmin(sender);if(!admin)return{handled:false};
  if(!has(admin,'appointment:view')||!has(admin,'appointment:create'))return{handled:true,admin,reply:'Your admin account needs both appointment view and create permission for the guided booking flow.'};
  if(v==='menu'||v==='home'){
    if(session?.step==='confirm')await cancelPendingBooking(admin.id);
    sessions.delete(k);return{handled:false};
  }
  if(!session)return begin(sender,admin);

  if(session.step==='confirm'){
    if(v==='1'||v==='confirm booking'){
      const result=await confirmAdminBooking(admin);sessions.delete(k);await audit(admin.id,'mobile_booking.confirmed',{status:result.status,appointmentId:result.appointmentId||null});return{handled:true,admin,reply:result.reply};
    }
    if(v==='2'||v==='0'||v==='cancel booking'){
      const cancelled=await cancelPendingBooking(admin.id);sessions.delete(k);await audit(admin.id,'mobile_booking.cancelled',{step:'confirm',hadPendingBooking:cancelled});return{handled:true,admin,reply:cancelled?'Booking cancelled. Nothing was written.':'There is no pending booking to cancel.'};
    }
    return{handled:true,admin,reply:'Choose 1 to confirm the booking, 2 to cancel, or reply MENU.'};
  }

  if(v==='0'){sessions.delete(k);await audit(admin.id,'mobile_booking.cancelled',{step:session.step});return{handled:true,admin,reply:'Booking flow cancelled. Nothing was written. Reply MENU to return to Shiloh Admin.'};}

  if(session.step==='staff'){
    const n=Number(v);if(!Number.isInteger(n)||n<1||n>session.staffRows.length)return{handled:true,admin,reply:'Choose the practitioner number shown, or 0 to cancel.'};
    const staff=session.staffRows[n-1],services=await serviceRows(staff.id);if(!services.length)return{handled:true,admin,reply:`${staff.display_name} has no active eligible services configured.`};
    sessions.set(k,{step:'service',staff,serviceRows:services});return{handled:true,admin,reply:numbered(`${staff.display_name} — Service`,services,r=>r.name)};
  }
  if(session.step==='service'){
    const n=Number(v);if(!Number.isInteger(n)||n<1||n>session.serviceRows.length)return{handled:true,admin,reply:'Choose the service number shown, or 0 to cancel.'};
    const service=session.serviceRows[n-1];sessions.set(k,{step:'date',staff:session.staff,service});return{handled:true,admin,reply:[`*${session.staff.display_name} — ${service.name}*`,'','What date should I check?','Send DD/MM/YYYY, for example 18/08/2026.','','0️⃣ Cancel'].join('\n')};
  }
  if(session.step==='date'){
    const date=parseDate(raw);if(!date)return{handled:true,admin,reply:'Send a valid date as DD/MM/YYYY, for example 18/08/2026, or 0 to cancel.'};
    const result=await listAvailableSlots({staffId:session.staff.id,serviceId:session.service.id,date,intervalMinutes:15});
    if(!result.slots.length){sessions.set(k,{...session,date});return{handled:true,admin,reply:[`*No slots — ${fmtDate(date)}*`,'',`No authoritative bookable slots were found for ${session.staff.display_name} — ${session.service.name}.`,'','Send another date as DD/MM/YYYY, or 0 to cancel.'].join('\n')};}
    const slots=result.slots.slice(0,10);sessions.set(k,{step:'slot',staff:session.staff,service:session.service,date,slots});return{handled:true,admin,reply:numbered(`${fmtDate(date)} — Choose a time`,slots,s=>`${fmtTime(s.starts_at)}–${fmtTime(s.ends_at)}`,result.slots.length>10?[`…${result.slots.length-10} more slots are available. Choose from the first 10 or cancel and try another date.`]:[])};
  }
  if(session.step==='slot'){
    const n=Number(v);if(!Number.isInteger(n)||n<1||n>session.slots.length)return{handled:true,admin,reply:'Choose the slot number shown, or 0 to cancel.'};
    const slot=session.slots[n-1];sessions.set(k,{step:'client-query',staff:session.staff,service:session.service,date:session.date,slot});return{handled:true,admin,reply:[`*Selected: ${fmtDate(session.date)} · ${fmtTime(slot.starts_at)}–${fmtTime(slot.ends_at)}*`,'',`Practitioner: ${session.staff.display_name}`,`Service: ${session.service.name}`,'','Who is the client?','Send a client name or mobile number.','','0️⃣ Cancel'].join('\n')};
  }
  if(session.step==='client-query'){
    const found=await findClients(raw,10);if(!found.clients.length)return{handled:true,admin,reply:`I couldn't find a canonical CRM client matching “${raw}”. Send another name/mobile number, or 0 to cancel.`};
    if(found.clients.length===1){sessions.set(k,{step:'prepare',...session,client:found.clients[0]});}
    else {sessions.set(k,{step:'client-pick',...session,clientRows:found.clients});return{handled:true,admin,reply:numbered('Choose client',found.clients,clientLabel)};}
  }
  let current=sessions.get(k);
  if(current?.step==='client-pick'){
    const n=Number(v);if(!Number.isInteger(n)||n<1||n>current.clientRows.length)return{handled:true,admin,reply:'Choose the client number shown, or 0 to cancel.'};
    current={...current,step:'prepare',client:current.clientRows[n-1]};sessions.set(k,current);
  }
  if(current?.step==='prepare'){
    const result=await prepareAdminBooking({adminId:admin.id,clientId:current.client.id,staffName:current.staff.display_name,serviceName:current.service.name,localDateTime:localDateTime(current.date,current.slot.starts_at)});
    await audit(admin.id,'mobile_booking.prepared',{status:result.status,clientId:current.client.id,staffId:current.staff.id,serviceId:current.service.id,startsAt:current.slot.starts_at});
    if(result.status!=='pending_confirmation'){sessions.delete(k);return{handled:true,admin,reply:`That slot changed before the booking could be prepared. Nothing was written.\n\n${result.reply}`};}
    sessions.set(k,{step:'confirm'});
    return{handled:true,admin,reply:[result.reply,'','*Ready to finish*','1️⃣ Confirm booking','2️⃣ Cancel booking','','Nothing is written until you confirm.'].join('\n')};
  }
  return{handled:false};
}
module.exports={processAdminMobileBookingFlowMessage};
