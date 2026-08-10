const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { processAdminHolidayHoursMessage, getHolidayReminder } = require('./adminHolidayHours');
const { processAdminFreelancerAvailabilityMessage } = require('./adminFreelancerAvailability');
const { processAdminMobileBookingFlowMessage } = require('./adminMobileBookingFlow');
const { processAdminStaffScheduleFlowMessage } = require('./adminStaffScheduleFlow');
const { processAdminAppointmentCancellationMessage } = require('./adminAppointmentCancellation');

const moreSessions = new Map();
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
  if(has(admin,'schedule:manage')){lines.push('','*More*',`${n++}️⃣ Schedule management`);}
  lines.push(`${n}️⃣ Help`,'','Reply with a number or option name.');
  return lines.join('\n');
}
function clientGuide(){return ['*Find a client*','','Send the client name or mobile number after “Find client”.','','Example:','Find client Chenique'].join('\n');}
function moreMenu(){return ['*More — Schedule management*','','1️⃣ Staff hours','2️⃣ Leave / special availability','3️⃣ Freelancer availability','4️⃣ Holiday hours','','0️⃣ Back','','Reply with a number.'].join('\n');}
function returnedToMore(reply=''){return /\*More — Schedule management\*/i.test(String(reply));}

async function processAdminMobileMenuMessage(sender,text){
  const k=senderKey(sender);
  const admin=await getAdmin(sender);if(!admin)return {handled:false};
  const raw=String(text||'').trim();const v=raw.toLowerCase().replace(/\s+/g,' ');

  // Appointment cancellation must get first refusal on explicit cancellation commands
  // so a stale mobile menu or booking session cannot consume the message.
  const cancellationFlow=await processAdminAppointmentCancellationMessage(sender,text);if(cancellationFlow.handled){
    moreSessions.delete(k);
    return cancellationFlow;
  }

  // Always give an explicit guided-booking command a chance to start/resume
  // before a stale parent More-menu session can consume the message.
  const bookingFlow=await processAdminMobileBookingFlowMessage(sender,text);if(bookingFlow.handled){
    moreSessions.delete(k);
    return bookingFlow;
  }

  // The More menu owns numeric options 0-4 while active. Keep this parent
  // marker alive when child schedule flows return to More so the next `0`
  // is handled by this menu rather than falling through to another flow.
  const more=moreSessions.get(k);
  if(more?.step==='menu'){
    if(v==='0'){moreSessions.delete(k);return {handled:true,admin,reply:menu(admin)};}
    if(v==='1'){moreSessions.delete(k);return processAdminStaffScheduleFlowMessage(sender,'Staff hours');}
    if(v==='2'){moreSessions.delete(k);return processAdminStaffScheduleFlowMessage(sender,'Leave / special availability');}
    if(v==='3'){moreSessions.delete(k);return processAdminFreelancerAvailabilityMessage(sender,'Freelancer availability');}
    if(v==='4'){moreSessions.delete(k);return processAdminHolidayHoursMessage(sender,'Holiday hours');}
    return {handled:true,admin,reply:'Choose 1, 2, 3, 4, or 0.'};
  }

  const staffFlow=await processAdminStaffScheduleFlowMessage(sender,text);if(staffFlow.handled){
    if(staffFlow.returnToMore || returnedToMore(staffFlow.reply)){moreSessions.set(k,{step:'menu'});return {handled:true,admin:staffFlow.admin,reply:moreMenu()};}
    return staffFlow;
  }
  const holiday=await processAdminHolidayHoursMessage(sender,text);if(holiday.handled){
    if(returnedToMore(holiday.reply))moreSessions.set(k,{step:'menu'});
    return holiday;
  }
  const freelancer=await processAdminFreelancerAvailabilityMessage(sender,text);if(freelancer.handled){
    if(returnedToMore(freelancer.reply))moreSessions.set(k,{step:'menu'});
    return freelancer;
  }

  if(['menu','admin menu','home'].includes(v)||isGreeting(raw)){
    moreSessions.delete(k);
    await audit(admin.id,'admin.mobile_menu_viewed',{entry:isGreeting(raw)?'greeting':'menu'});
    const reminder=has(admin,'schedule:manage')?await getHolidayReminder():null;
    return {handled:true,admin,reply:reminder?`${menu(admin)}\n\n${reminder}`:menu(admin)};
  }
  if(v==='3'||v==='find an available time'||v==='find availability'){
    if(!has(admin,'appointment:view')||!has(admin,'appointment:create'))return {handled:false};
    await audit(admin.id,'admin.mobile_menu_selected',{option:'availability_booking_flow'});
    return processAdminMobileBookingFlowMessage(sender,'Find an available time');
  }
  if(v==='4'||v==='make a booking'||v==='new booking'||v==='book client'||v==='book a client'||v==='book appointment'){
    if(!has(admin,'appointment:create')||!has(admin,'appointment:view'))return {handled:false};
    await audit(admin.id,'admin.mobile_menu_selected',{option:'booking_flow'});
    return processAdminMobileBookingFlowMessage(sender,'Make a booking');
  }
  if(v==='5'||v==='find a client'){if(!has(admin,'client:lookup'))return {handled:false};await audit(admin.id,'admin.mobile_menu_selected',{option:'client'});return {handled:true,admin,reply:clientGuide()};}
  if(v==='6'||v==='add a walk-in'||v==='add walk-in'){if(!has(admin,'walkin:create'))return {handled:false};return {handled:false};}
  if(v==='7'||v==='more'||v==='schedule management'||v==='staff schedule'||v==='schedule'){
    if(!has(admin,'schedule:manage'))return {handled:false};moreSessions.set(k,{step:'menu'});await audit(admin.id,'admin.mobile_menu_selected',{option:'schedule_management'});return {handled:true,admin,reply:moreMenu()};
  }
  if(v==='staff hours'||v==='regular staff hours')return processAdminStaffScheduleFlowMessage(sender,'Staff hours');
  if(v==='leave'||v==='leave / special availability'||v==='leave and special availability'||v==='special availability')return processAdminStaffScheduleFlowMessage(sender,'Leave / special availability');
  if(v==='freelancer availability'||v==='freelancers'||v==='freelance schedule')return processAdminFreelancerAvailabilityMessage(sender,'Freelancer availability');
  if(v==='holiday hours'||v==='public holiday hours')return processAdminHolidayHoursMessage(sender,'Holiday hours');
  if(v==='8'||v==='help'){return {handled:false};}
  return {handled:false};
}
module.exports={processAdminMobileMenuMessage,menu};
