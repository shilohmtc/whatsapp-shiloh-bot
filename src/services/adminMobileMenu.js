const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { processAdminHolidayHoursMessage, getHolidayReminder } = require('./adminHolidayHours');
const { processAdminFreelancerAvailabilityMessage } = require('./adminFreelancerAvailability');
const { processAdminMobileBookingFlowMessage } = require('./adminMobileBookingFlow');

const scheduleSessions = new Map();
function has(admin,p){return admin?.permissions?.[p]===true;}
function isGreeting(text=''){return /^(hi|hello|hey|howzit|hiya|good morning|good afternoon|good evening)[!. ]*$/i.test(String(text).trim());}
function senderKey(sender){return normalizePhone(sender);}
async function getAdmin(sender){const r=await pool.query(`SELECT id,staff_id,display_name,role,permissions FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,[senderKey(sender)]);return r.rows[0]||null;}
async function audit(id,action,metadata={}){await pool.query(`INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,'admin_assistant',NULL,$3::jsonb)`,[id,action,JSON.stringify(metadata)]);}

function menu(admin){
  const lines=['*Shiloh Admin 🌿*',`Hi ${admin.display_name} 👋`,'','What would you like to do?',''];
  let n=1;
  if(has(admin,'appointment:view')){lines.push('*Appointments*',`${n++}️⃣ Today`,`${n++}️⃣ Tomorrow`,`${n++}️⃣ Find an available time`);}
  if(has(admin,'appointment:create')) lines.push(`${n++}️⃣ Make a booking`);
  if(has(admin,'client:lookup')||has(admin,'walkin:create')){lines.push('','*Clients*');if(has(admin,'client:lookup'))lines.push(`${n++}️⃣ Find a client`);if(has(admin,'walkin:create'))lines.push(`${n++}️⃣ Add a walk-in`);}
  if(has(admin,'schedule:manage')){lines.push('','*More*',`${n++}️⃣ Staff schedule`,`${n++}️⃣ Holiday hours`);}
  lines.push(`${n}️⃣ Help`,'','Reply with a number or option name.');
  return lines.join('\n');
}

function clientGuide(){return ['*Find a client*','','Send the client name or mobile number after “Find client”.','','Example:','Find client Chenique'].join('\n');}
function scheduleMenu(){return ['*Staff schedule*','','1️⃣ View working hours','2️⃣ Change regular hours','3️⃣ Add leave / special hours','4️⃣ Remove an exception','5️⃣ Freelancer availability','','Reply with a number.','Reply MENU to return.'].join('\n');}
function scheduleGuide(choice){if(choice==='1')return ['*View working hours*','','Send: Working hours STAFF','','Example: Working hours Christel'].join('\n');if(choice==='2')return ['*Change regular hours*','','Send: Set working hours STAFF | DAY | HOURS','','Example: Set working hours Christel | Monday | 09:00-17:00','','Use CLOSED when the practitioner does not work that day.'].join('\n');if(choice==='3')return ['*Add leave / special hours*','','Leave:','Add schedule exception STAFF | YYYY-MM-DD | unavailable | ALL-DAY | REASON','','Special hours:','Add schedule exception STAFF | YYYY-MM-DD | available | HH:MM-HH:MM | REASON'].join('\n');return ['*Remove an exception*','','First send: Working hours STAFF','Then use the exception number shown:','Remove schedule exception STAFF | NUMBER'].join('\n');}

async function processAdminMobileMenuMessage(sender,text){
  const bookingFlow=await processAdminMobileBookingFlowMessage(sender,text);if(bookingFlow.handled)return bookingFlow;
  const holiday=await processAdminHolidayHoursMessage(sender,text);if(holiday.handled)return holiday;
  const freelancer=await processAdminFreelancerAvailabilityMessage(sender,text);if(freelancer.handled)return freelancer;
  const admin=await getAdmin(sender);if(!admin)return {handled:false};
  const raw=String(text||'').trim();const v=raw.toLowerCase().replace(/\s+/g,' ');const k=senderKey(sender);
  if(['menu','admin menu','home'].includes(v)||isGreeting(raw)){
    scheduleSessions.delete(k);
    await audit(admin.id,'admin.mobile_menu_viewed',{entry:isGreeting(raw)?'greeting':'menu'});
    const reminder=has(admin,'schedule:manage')?await getHolidayReminder():null;
    return {handled:true,admin,reply:reminder?`${menu(admin)}\n\n${reminder}`:menu(admin)};
  }
  const scheduleSession=scheduleSessions.get(k);
  if(scheduleSession?.step==='menu'){
    if(v==='0'){scheduleSessions.delete(k);return {handled:true,admin,reply:menu(admin)};}
    if(/^[1-4]$/.test(v)){scheduleSessions.delete(k);return {handled:true,admin,reply:scheduleGuide(v)};}
    if(v==='5'){scheduleSessions.delete(k);return processAdminFreelancerAvailabilityMessage(sender,'Freelancer availability');}
    return {handled:true,admin,reply:'Choose 1, 2, 3, 4, 5, or reply MENU.'};
  }
  if(v==='3'||v==='find an available time'||v==='find availability'){
    if(!has(admin,'appointment:view')||!has(admin,'appointment:create'))return {handled:false};
    await audit(admin.id,'admin.mobile_menu_selected',{option:'availability_booking_flow'});
    return processAdminMobileBookingFlowMessage(sender,'Find an available time');
  }
  if(v==='4'||v==='make a booking'||v==='new booking'){
    if(!has(admin,'appointment:create')||!has(admin,'appointment:view'))return {handled:false};
    await audit(admin.id,'admin.mobile_menu_selected',{option:'booking_flow'});
    return processAdminMobileBookingFlowMessage(sender,'Make a booking');
  }
  if(v==='5'||v==='find a client'){if(!has(admin,'client:lookup'))return {handled:false};await audit(admin.id,'admin.mobile_menu_selected',{option:'client'});return {handled:true,admin,reply:clientGuide()};}
  if(v==='6'||v==='add a walk-in'||v==='add walk-in'){if(!has(admin,'walkin:create'))return {handled:false};return {handled:false};}
  if(v==='7'||v==='staff schedule'||v==='schedule'){if(!has(admin,'schedule:manage'))return {handled:false};scheduleSessions.set(k,{step:'menu'});await audit(admin.id,'admin.mobile_menu_selected',{option:'schedule'});return {handled:true,admin,reply:scheduleMenu()};}
  if(v==='freelancer availability'||v==='freelancers'||v==='freelance schedule'){if(!has(admin,'schedule:manage'))return {handled:false};return processAdminFreelancerAvailabilityMessage(sender,'Freelancer availability');}
  return {handled:false};
}
module.exports={processAdminMobileMenuMessage,menu};
