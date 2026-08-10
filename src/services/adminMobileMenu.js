const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { processAdminHolidayHoursMessage, getHolidayReminder } = require('./adminHolidayHours');
const { processAdminFreelancerAvailabilityMessage } = require('./adminFreelancerAvailability');
const { processAdminMobileBookingFlowMessage } = require('./adminMobileBookingFlow');
const { processAdminStaffScheduleFlowMessage } = require('./adminStaffScheduleFlow');
const { processAdminAppointmentCancellationMessage } = require('./adminAppointmentCancellation');
const { processAdminStaffServicesMessage } = require('./adminStaffServices');
const { processAdminServicePricingMessage } = require('./adminServicePricing');
const { processAdminBookingUpdateMessage } = require('./adminBookingUpdate');

const moreSessions = new Map();
function has(admin,p){return admin?.permissions?.[p]===true;}
function isGreeting(text=''){return /^(hi|hello|hey|howzit|hiya|good morning|good afternoon|good evening)[!. ]*$/i.test(String(text).trim());}
function senderKey(sender){return normalizePhone(sender);}
async function getAdmin(sender){const r=await pool.query(`SELECT id,staff_id,display_name,role,permissions FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,[senderKey(sender)]);return r.rows[0]||null;}
async function audit(id,action,metadata={}){await pool.query(`INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,'admin_assistant',NULL,$3::jsonb)`,[id,action,JSON.stringify(metadata)]);}

function getMenuOptions(admin){
  const options=[];
  if(has(admin,'appointment:view')){
    options.push({key:'today',label:"Today's clients",section:'Appointments'});
    options.push({key:'tomorrow',label:"Tomorrow's clients",section:'Appointments'});
    if(has(admin,'appointment:create')) options.push({key:'availability',label:'Find an available time',section:'Appointments'});
  }
  if(has(admin,'appointment:create')&&has(admin,'appointment:view')){
    options.push({key:'booking',label:'Make a booking',section:'Appointments'});
    options.push({key:'manage_booking',label:'Manage a booking',section:'Appointments'});
  }
  if(has(admin,'client:lookup')) options.push({key:'client',label:'Find a client',section:'Clients'});
  if(has(admin,'walkin:create')) options.push({key:'walkin',label:'Add a walk-in',section:'Clients'});
  if(has(admin,'appointment:view')) options.push({key:'staff_services',label:'Staff services',section:'Staff'});
  if(has(admin,'appointment:create')) options.push({key:'pricing',label:'Services & pricing',section:'Staff'});
  if(has(admin,'schedule:manage')) options.push({key:'schedule',label:'Schedule management',section:'Staff'});
  options.push({key:'help',label:'Help',section:'More'});
  return options.map((o,i)=>({...o,number:i+1}));
}
function menu(admin){
  const options=getMenuOptions(admin);const lines=['*Shiloh Admin 🌿*',`Welcome back, ${admin.display_name} 👋`,'','What would you like to do?'];let section=null;
  for(const o of options){if(o.section!==section){section=o.section;lines.push('',`*${section}*`);}lines.push(`${o.number}️⃣ ${o.label}`);}
  lines.push('','Reply with the number or option name.');return lines.join('\n');
}
function optionFor(admin,v){const options=getMenuOptions(admin);if(/^\d+$/.test(v))return options.find(o=>o.number===Number(v))||null;return options.find(o=>o.label.toLowerCase()===v)||null;}
function clientGuide(){return ['*Find a client*','','Send the client name or mobile number after “Find client”.','','Example:','Find client Chenique'].join('\n');}
function moreMenu(){return ['*Schedule management*','','1️⃣ Staff hours','2️⃣ Leave / special availability','3️⃣ Freelancer availability','4️⃣ Holiday hours','','0️⃣ Back','','Reply with a number or option name.'].join('\n');}
function returnedToMore(reply=''){return /\*(?:More — )?Schedule management\*/i.test(String(reply));}

async function processAdminMobileMenuMessage(sender,text){
  const k=senderKey(sender);const admin=await getAdmin(sender);if(!admin)return {handled:false};const raw=String(text||'').trim();const v=raw.toLowerCase().replace(/\s+/g,' ');
  const bookingUpdateFlow=await processAdminBookingUpdateMessage(sender,text);if(bookingUpdateFlow.handled){moreSessions.delete(k);return bookingUpdateFlow;}
  const pricingFlow=await processAdminServicePricingMessage(sender,text);if(pricingFlow.handled){moreSessions.delete(k);return pricingFlow;}
  const cancellationFlow=await processAdminAppointmentCancellationMessage(sender,text);if(cancellationFlow.handled){moreSessions.delete(k);return cancellationFlow;}
  const bookingFlow=await processAdminMobileBookingFlowMessage(sender,text);if(bookingFlow.handled){moreSessions.delete(k);return bookingFlow;}
  const more=moreSessions.get(k);
  if(more?.step==='menu'){
    if(v==='0'||v==='back'){moreSessions.delete(k);return {handled:true,admin,reply:menu(admin)};}
    if(v==='1'||v==='staff hours'){moreSessions.delete(k);return processAdminStaffScheduleFlowMessage(sender,'Staff hours');}
    if(v==='2'||v==='leave / special availability'||v==='leave'||v==='special availability'){moreSessions.delete(k);return processAdminStaffScheduleFlowMessage(sender,'Leave / special availability');}
    if(v==='3'||v==='freelancer availability'){moreSessions.delete(k);return processAdminFreelancerAvailabilityMessage(sender,'Freelancer availability');}
    if(v==='4'||v==='holiday hours'){moreSessions.delete(k);return processAdminHolidayHoursMessage(sender,'Holiday hours');}
    return {handled:true,admin,reply:'Choose 1, 2, 3, 4, or 0.'};
  }
  const staffFlow=await processAdminStaffScheduleFlowMessage(sender,text);if(staffFlow.handled){if(staffFlow.returnToMore||returnedToMore(staffFlow.reply)){moreSessions.set(k,{step:'menu'});return {handled:true,admin:staffFlow.admin,reply:moreMenu()};}return staffFlow;}
  const holiday=await processAdminHolidayHoursMessage(sender,text);if(holiday.handled){if(returnedToMore(holiday.reply))moreSessions.set(k,{step:'menu'});return holiday;}
  const freelancer=await processAdminFreelancerAvailabilityMessage(sender,text);if(freelancer.handled){if(returnedToMore(freelancer.reply))moreSessions.set(k,{step:'menu'});return freelancer;}
  if(['menu','admin menu','home'].includes(v)||isGreeting(raw)){moreSessions.delete(k);await audit(admin.id,'admin.mobile_menu_viewed',{entry:isGreeting(raw)?'greeting':'menu'});const reminder=has(admin,'schedule:manage')?await getHolidayReminder():null;return {handled:true,admin,reply:reminder?`${menu(admin)}\n\n${reminder}`:menu(admin)};}
  const selected=optionFor(admin,v);
  if(selected){
    await audit(admin.id,'admin.mobile_menu_selected',{option:selected.key});
    if(selected.key==='today')return {handled:false};
    if(selected.key==='tomorrow')return {handled:false};
    if(selected.key==='availability')return processAdminMobileBookingFlowMessage(sender,'Find an available time');
    if(selected.key==='booking')return processAdminMobileBookingFlowMessage(sender,'Make a booking');
    if(selected.key==='manage_booking')return processAdminBookingUpdateMessage(sender,'Manage booking');
    if(selected.key==='client')return {handled:true,admin,reply:clientGuide()};
    if(selected.key==='walkin')return {handled:false};
    if(selected.key==='staff_services')return processAdminStaffServicesMessage(sender,'Staff services');
    if(selected.key==='pricing')return processAdminServicePricingMessage(sender,'Manage services & pricing');
    if(selected.key==='schedule'){moreSessions.set(k,{step:'menu'});return {handled:true,admin,reply:moreMenu()};}
    if(selected.key==='help')return {handled:false};
  }
  if(v==='today'||v==="today's clients"||v==='todays clients'||v==='tomorrow'||v==="tomorrow's clients"||v==='tomorrows clients')return {handled:false};
  if(v==='find an available time'||v==='find availability')return processAdminMobileBookingFlowMessage(sender,'Find an available time');
  if(['make a booking','new booking','book client','book a client','book appointment'].includes(v))return processAdminMobileBookingFlowMessage(sender,'Make a booking');
  if(['manage a booking','manage booking','update booking','edit booking'].includes(v))return processAdminBookingUpdateMessage(sender,'Manage booking');
  if(v==='find a client'){if(!has(admin,'client:lookup'))return {handled:false};return {handled:true,admin,reply:clientGuide()};}
  if(v==='add a walk-in'||v==='add walk-in')return {handled:false};
  if(v==='staff services'||v==='services by staff'||v==='services per staff')return processAdminStaffServicesMessage(sender,'Staff services');
  if(['services & pricing','manage services & pricing','service pricing','pricing'].includes(v))return processAdminServicePricingMessage(sender,'Manage services & pricing');
  if(['schedule management','staff schedule','schedule'].includes(v)){if(!has(admin,'schedule:manage'))return {handled:false};moreSessions.set(k,{step:'menu'});return {handled:true,admin,reply:moreMenu()};}
  if(v==='staff hours'||v==='regular staff hours')return processAdminStaffScheduleFlowMessage(sender,'Staff hours');
  if(['leave','leave / special availability','leave and special availability','special availability'].includes(v))return processAdminStaffScheduleFlowMessage(sender,'Leave / special availability');
  if(['freelancer availability','freelancers','freelance schedule'].includes(v))return processAdminFreelancerAvailabilityMessage(sender,'Freelancer availability');
  if(v==='holiday hours'||v==='public holiday hours')return processAdminHolidayHoursMessage(sender,'Holiday hours');
  if(v==='help')return {handled:false};
  return {handled:false};
}
module.exports={processAdminMobileMenuMessage,menu,getMenuOptions};