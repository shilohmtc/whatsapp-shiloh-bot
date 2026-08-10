const crypto = require('crypto');
const { pool } = require('../db/pool');
const { sendWhatsAppMessage } = require('./whatsapp');
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

async function sendCustomerBookingConfirmation({appointmentId,clientId,clientName,serviceName,staffName,locationName,startsAt,endsAt}){
  try{
    const contact=await pool.query(`SELECT normalized_value FROM client_contacts WHERE client_id=$1 AND contact_type IN ('whatsapp','phone','mobile') AND normalized_value IS NOT NULL ORDER BY is_primary DESC, id LIMIT 1`,[clientId]);
    const phone=contact.rows[0]?.normalized_value;if(!phone)return {sent:false,reason:'no_phone'};
    const token=await ensureToken(appointmentId);const root=baseUrl();
    const ics=root?`${root}/calendar/${token}.ics`:null;
    const google=googleCalendarUrl({serviceName,staffName,locationName,startsAt,endsAt});
    const lines=['*Booking confirmed 🌿*','',`Hi ${clientName||'there'}, your appointment is confirmed.`,'',`✨ *Service:* ${serviceName}`,`👤 *With:* ${staffName}`,`📅 *Date:* ${fmtDate(startsAt)}`,`🕙 *Time:* ${fmtTime(startsAt)}–${fmtTime(endsAt)}`];
    if(locationName)lines.push(`📍 *Location:* ${locationName}`);
    lines.push('','*Add to calendar*',`📅 Google Calendar: ${google}`);
    if(ics)lines.push(`📱 Apple / Outlook / phone calendar: ${ics}`);
    lines.push('','Need to make a change? Reply *RESCHEDULE* or *CANCEL*.','We look forward to seeing you. 🌿');
    await sendWhatsAppMessage(phone,lines.join('\n'));
    await pool.query(`INSERT INTO crm_audit_events (action,entity_type,entity_id,metadata) VALUES ('customer.booking_confirmation_sent','appointment',$1,$2::jsonb)`,[appointmentId,JSON.stringify({clientId,calendarLinks:true})]);
    return {sent:true,phone};
  }catch(error){logger.error({err:error,appointmentId},'Customer booking confirmation failed');return {sent:false,reason:'error'};}
}

module.exports={sendCustomerBookingConfirmation,googleCalendarUrl};
