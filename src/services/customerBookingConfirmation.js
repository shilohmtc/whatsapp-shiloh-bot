const crypto = require('crypto');
const { pool } = require('../db/pool');
const { sendWhatsAppMessage, sendWhatsAppTemplate } = require('./whatsapp');
const logger = require('../lib/logger');

function fmtDate(v){return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date(v));}
function fmtTime(v){return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v));}
function googleStamp(v){return new Date(v).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');}
function baseUrl(){return String(process.env.SHILOH_PUBLIC_BASE_URL||process.env.RENDER_EXTERNAL_URL||'').replace(/\/$/,'');}

async function ensureToken(appointmentId){
  const existing=await pool.query(`SELECT token FROM appointment_calendar_share_tokens WHERE appointment_id=$1`,[appointmentId]);
  if(existing.rows[0]?.token)return existing.rows[0].token;
  const token=crypto.randomBytes(24).toString('base64url');
  const created=await pool.query(`INSERT INTO appointment_calendar_share_tokens (appointment_id,token) VALUES ($1,$2) ON CONFLICT (appointment_id) DO UPDATE SET appointment_id=EXCLUDED.appointment_id RETURNING token`,[appointmentId,token]);
  return created.rows[0].token;
}

function googleCalendarUrl({serviceName,staffName,locationName,startsAt,endsAt}){
  const p=new URLSearchParams({action:'TEMPLATE',text:`Shiloh — ${serviceName}`,dates:`${googleStamp(startsAt)}/${googleStamp(endsAt)}`,details:`Appointment with ${staffName} at Shiloh.`,location:locationName||'Shiloh'});
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

async function sendCustomerBookingConfirmation(data){
  const {appointmentId,clientId,clientName,serviceName,staffName,locationName,startsAt,endsAt}=data;
  try{
    const contact=await pool.query(`SELECT normalized_value FROM client_contacts WHERE client_id=$1 AND contact_type IN ('whatsapp','phone','mobile') AND normalized_value IS NOT NULL ORDER BY is_primary DESC, id LIMIT 1`,[clientId]);
    const phone=contact.rows[0]?.normalized_value;if(!phone)return {sent:false,reason:'no_phone'};
    const token=await ensureToken(appointmentId);const root=baseUrl();
    const ics=root?`${root}/calendar/${token}.ics`:'';
    const google=googleCalendarUrl({serviceName,staffName,locationName,startsAt,endsAt});
    const date=fmtDate(startsAt),time=`${fmtTime(startsAt)}–${fmtTime(endsAt)}`;
    const template=process.env.WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE;
    if(template){
      await sendWhatsAppTemplate(phone,template,[clientName||'there',serviceName,staffName,date,time,google,ics||google],process.env.WHATSAPP_TEMPLATE_LANGUAGE||'en');
    }else{
      const lines=['*Booking confirmed 🌿*','',`Hi ${clientName||'there'}, your appointment is confirmed.`,'',`✨ *Service:* ${serviceName}`,`👤 *With:* ${staffName}`,`📅 *Date:* ${date}`,`🕙 *Time:* ${time}`];
      if(locationName)lines.push(`📍 *Location:* ${locationName}`);
      lines.push('','*Add to calendar*',`📅 Google Calendar: ${google}`);
      if(ics)lines.push(`📱 Apple / Outlook / phone calendar: ${ics}`);
      lines.push('','Need to make a change? Reply *RESCHEDULE* or *CANCEL*.','We look forward to seeing you. 🌿');
      await sendWhatsAppMessage(phone,lines.join('\n'));
    }
    await pool.query(`INSERT INTO crm_audit_events (action,entity_type,entity_id,metadata) VALUES ('customer.booking_confirmation_sent','appointment',$1,$2::jsonb)`,[appointmentId,JSON.stringify({clientId,calendarLinks:true,template:Boolean(template)})]);
    return {sent:true,phone};
  }catch(error){logger.error({err:error,appointmentId},'Customer booking confirmation failed');return {sent:false,reason:'error'};}
}

async function sendCustomerBookingConfirmationForAppointment(appointmentId){
  const r=await pool.query(`
    SELECT a.id,a.client_id,a.starts_at,a.ends_at,c.display_name AS client_name,l.name AS location_name,
           COALESCE((SELECT service_name_snapshot FROM appointment_services WHERE appointment_id=a.id ORDER BY position LIMIT 1),a.title,'Shiloh appointment') AS service_name,
           COALESCE((SELECT staff_name_snapshot FROM appointment_staff WHERE appointment_id=a.id ORDER BY position LIMIT 1),'Shiloh practitioner') AS staff_name
      FROM appointments a JOIN clients c ON c.id=a.client_id LEFT JOIN locations l ON l.id=a.location_id
     WHERE a.id=$1 AND a.status<>'cancelled'`,[appointmentId]);
  const a=r.rows[0];if(!a)return {sent:false,reason:'appointment_not_found'};
  const already=await pool.query(`SELECT 1 FROM crm_audit_events WHERE action='customer.booking_confirmation_sent' AND entity_type='appointment' AND entity_id=$1 LIMIT 1`,[appointmentId]);
  if(already.rowCount)return {sent:false,reason:'already_sent'};
  return sendCustomerBookingConfirmation({appointmentId:a.id,clientId:a.client_id,clientName:a.client_name,serviceName:a.service_name,staffName:a.staff_name,locationName:a.location_name,startsAt:a.starts_at,endsAt:a.ends_at});
}

module.exports={sendCustomerBookingConfirmation,sendCustomerBookingConfirmationForAppointment,googleCalendarUrl};
