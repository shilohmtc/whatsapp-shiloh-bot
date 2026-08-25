const crypto = require('crypto');
const { pool } = require('../db/pool');
const {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  sendWhatsAppCtaUrl,
  sendWhatsAppReplyButtons,
} = require('./whatsapp');
const { postConfirmationButtons, bookingConfirmationV2QuickReplyPayloads } = require('./clientBookingInteractive');
const { createAppointment: enrollAppointmentLifecycle } = require('./appointmentLifecycle');
const { resolveClientFacingName } = require('./clientFacingNameAuthority');
const logger = require('../lib/logger');

const LIVE_BOOKING_CONFIRMATION_V1 = 'shiloh_booking_confirmation_v1';
const LIVE_BOOKING_CONFIRMATION_V2 = 'shiloh_booking_confirmation_v2';
const CURRENT_BOOKING_CONFIRMATION_TEMPLATES = new Set([LIVE_BOOKING_CONFIRMATION_V1, LIVE_BOOKING_CONFIRMATION_V2]);
let deliveryTableReady = false;

function fmtDate(v){return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date(v));}
function fmtTime(v){return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v));}
function googleStamp(v){return new Date(v).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');}
function baseUrl(){return String(process.env.SHILOH_PUBLIC_BASE_URL||process.env.RENDER_EXTERNAL_URL||'').replace(/\/$/,'');}
function shouldSendLegacyConfirmationSupplements(template){return !CURRENT_BOOKING_CONFIRMATION_TEMPLATES.has(String(template||'').trim());}
function bookingConfirmationTemplatePayload({template,appointmentId,clientName,serviceName,staffName,date,time,google,ics}){
  if(String(template||'').trim()===LIVE_BOOKING_CONFIRMATION_V2){
    return {
      bodyParameters:[clientName||'there',serviceName,staffName,date,time],
      quickReplyPayloads:bookingConfirmationV2QuickReplyPayloads(appointmentId),
    };
  }
  return {
    bodyParameters:[clientName||'there',serviceName,staffName,date,time,google,ics||google],
    quickReplyPayloads:[],
  };
}
function providerMessageId(response){return response?.messages?.[0]?.id||null;}

async function ensureDeliveryTable(){
  if(deliveryTableReady)return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_message_deliveries (
      appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
      message_kind TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('sending','sent')),
      claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      template_name TEXT,
      provider_message_id TEXT,
      PRIMARY KEY (appointment_id,message_kind)
    )
  `);
  await pool.query(`
    ALTER TABLE customer_message_deliveries
      ADD COLUMN IF NOT EXISTS template_name TEXT,
      ADD COLUMN IF NOT EXISTS provider_message_id TEXT
  `);
  deliveryTableReady=true;
}

async function claimBookingConfirmation(appointmentId){
  await ensureDeliveryTable();
  const legacy=await pool.query(`SELECT 1 FROM crm_audit_events WHERE action='customer.booking_confirmation_sent' AND entity_type='appointment' AND entity_id=$1 LIMIT 1`,[appointmentId]);
  if(legacy.rowCount)return false;
  const claimed=await pool.query(`
    INSERT INTO customer_message_deliveries (appointment_id,message_kind,status)
    VALUES ($1,'booking_confirmation','sending')
    ON CONFLICT (appointment_id,message_kind) DO NOTHING
    RETURNING appointment_id
  `,[appointmentId]);
  return claimed.rowCount===1;
}

async function releaseBookingConfirmationClaim(appointmentId){
  await pool.query(`DELETE FROM customer_message_deliveries WHERE appointment_id=$1 AND message_kind='booking_confirmation' AND status='sending'`,[appointmentId]);
}

async function markBookingConfirmationSent(appointmentId,{templateName=null,providerMessageId=null}={}){
  await pool.query(`UPDATE customer_message_deliveries SET status='sent',sent_at=NOW(),updated_at=NOW(),template_name=$2,provider_message_id=$3 WHERE appointment_id=$1 AND message_kind='booking_confirmation' AND status='sending'`,[appointmentId,templateName,providerMessageId]);
}

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

async function sendOptionalConfirmationAction(label, sendAction, context){
  try{
    await sendAction();
    return true;
  }catch(error){
    logger.error({err:error,...context,action:label},'Booking confirmation supplemental action failed');
    return false;
  }
}

async function sendCustomerBookingConfirmation(data){
  const {appointmentId,clientId,clientName:_suppliedClientName,serviceName,staffName,locationName,startsAt,endsAt,source='shiloh'}=data;
  let claimed=false;
  let providerAccepted=false;
  let acceptedProviderMessageId=null;
  try{
    const nameResolution=await resolveClientFacingName(clientId);
    const clientName=nameResolution.name;
    const contact=await pool.query(`SELECT normalized_value FROM client_contacts WHERE client_id=$1 AND contact_type IN ('whatsapp','phone','mobile') AND normalized_value IS NOT NULL ORDER BY is_primary DESC, id LIMIT 1`,[clientId]);
    const phone=contact.rows[0]?.normalized_value;if(!phone)return {sent:false,reason:'no_phone'};
    const token=await ensureToken(appointmentId);const root=baseUrl();
    const ics=root?`${root}/calendar/${token}.ics`:'';
    const google=googleCalendarUrl({serviceName,staffName,locationName,startsAt,endsAt});
    const date=fmtDate(startsAt),time=`${fmtTime(startsAt)}–${fmtTime(endsAt)}`;
    const template=process.env.WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE;

    await enrollAppointmentLifecycle({appointmentId,clientId,phone,service:serviceName,appointmentAt:startsAt,appointmentEndsAt:endsAt,therapist:staffName,source});

    claimed=await claimBookingConfirmation(appointmentId);
    if(!claimed)return {sent:false,reason:'already_sent_or_in_progress'};

    let confirmationActions={googleCalendar:false,appleOutlook:false,changeButtons:false,postConfirmationMenu:false};
    if(template){
      const payload=bookingConfirmationTemplatePayload({template,appointmentId,clientName,serviceName,staffName,date,time,google,ics});
      const response=await sendWhatsAppTemplate(phone,template,payload.bodyParameters,process.env.WHATSAPP_TEMPLATE_LANGUAGE||'en',payload.quickReplyPayloads);
      acceptedProviderMessageId=providerMessageId(response);
      providerAccepted=true;
    }else{
      const greeting=clientName?`Hi ${clientName}, your appointment is confirmed.`:'Your appointment is confirmed.';
      const lines=['*Booking confirmed 🌿*','',greeting,'',`✨ *Service:* ${serviceName}`,`👤 *With:* ${staffName}`,`📅 *Date:* ${date}`,`🕙 *Time:* ${time}`];
      if(locationName)lines.push(`📍 *Location:* ${locationName}`);
      lines.push('','We look forward to seeing you. 🌿');
      const response=await sendWhatsAppMessage(phone,lines.join('\n'));
      acceptedProviderMessageId=providerMessageId(response);
      providerAccepted=true;
    }

    const supplementalActionsSuppressed=!shouldSendLegacyConfirmationSupplements(template);
    if(!supplementalActionsSuppressed){
      const actionContext={appointmentId,clientId};
      confirmationActions.googleCalendar=await sendOptionalConfirmationAction('google_calendar',()=>sendWhatsAppCtaUrl(phone,'Add to Google Calendar','Google Calendar',google),actionContext);
      if(ics){
        confirmationActions.appleOutlook=await sendOptionalConfirmationAction('apple_outlook_calendar',()=>sendWhatsAppCtaUrl(phone,'Add to Apple / Outlook','Apple / Outlook',ics),actionContext);
      }
      confirmationActions.changeButtons=await sendOptionalConfirmationAction('booking_change_buttons',()=>sendWhatsAppReplyButtons(phone,'*Need to make a change?*\nUse a button below, or type *RESCHEDULE* or *CANCEL*.',[
        {id:'client_reschedule_booking',title:'Reschedule'},
        {id:'client_cancel_booking',title:'Cancel booking'},
      ]),actionContext);
      confirmationActions.postConfirmationMenu=await sendOptionalConfirmationAction('post_confirmation_menu',()=>sendWhatsAppReplyButtons(phone,'*What would you like to do next?*\nYou can also type *BOOK ANOTHER TREATMENT*, *MY APPOINTMENTS*, or *MAIN MENU*.',postConfirmationButtons()),actionContext);
    }

    await markBookingConfirmationSent(appointmentId,{templateName:template||null,providerMessageId:acceptedProviderMessageId});
    await pool.query(`INSERT INTO crm_audit_events (action,entity_type,entity_id,metadata) VALUES ('customer.booking_confirmation_sent','appointment',$1,$2::jsonb)`,[appointmentId,JSON.stringify({clientId,calendarLinks:true,template:Boolean(template),templateName:template||null,providerMessageId:acceptedProviderMessageId,lifecycleEnrolled:true,idempotentDelivery:true,supplementalActionsSuppressed,confirmationActions,nameAuthorityId:nameResolution.authorityId||null})]);
    return {sent:true,phone,templateName:template||null,providerMessageId:acceptedProviderMessageId,supplementalActionsSuppressed,confirmationActions};
  }catch(error){
    if(claimed&&!providerAccepted){
      try{await releaseBookingConfirmationClaim(appointmentId);}catch(releaseError){logger.error({err:releaseError,appointmentId},'Booking confirmation claim release failed');}
    }
    logger.error({err:error,appointmentId,providerAccepted},'Customer booking confirmation failed');
    return {sent:false,reason:providerAccepted?'delivery_state_uncertain':'error'};
  }
}

async function practitionerApprovalStatus(appointmentId){
  const table=await pool.query(`SELECT to_regclass('public.appointment_booking_approvals') AS table_name`);
  if(!table.rows[0]?.table_name)return null;
  const result=await pool.query(`SELECT status FROM appointment_booking_approvals WHERE appointment_id=$1`,[appointmentId]);
  return result.rows[0]?.status||null;
}

async function sendCustomerBookingConfirmationForAppointment(appointmentId){
  const r=await pool.query(`
    SELECT a.id,a.client_id,a.starts_at,a.ends_at,a.source,l.name AS location_name,
           COALESCE((SELECT string_agg(service_name_snapshot,' + ' ORDER BY position) FROM appointment_services WHERE appointment_id=a.id),a.title,'Shiloh appointment') AS service_name,
           COALESCE((SELECT string_agg(staff_name_snapshot,' + ' ORDER BY position) FROM appointment_staff WHERE appointment_id=a.id),'Shiloh practitioner') AS staff_name
      FROM appointments a LEFT JOIN locations l ON l.id=a.location_id
     WHERE a.id=$1 AND a.status<>'cancelled'`,[appointmentId]);
  const a=r.rows[0];if(!a)return {sent:false,reason:'appointment_not_found'};
  if(a.source==='shiloh_client_whatsapp'){
    const approval=await practitionerApprovalStatus(appointmentId);
    if(approval!=='approved')return {sent:false,reason:'practitioner_approval_required'};
  }
  const already=await pool.query(`SELECT 1 FROM crm_audit_events WHERE action='customer.booking_confirmation_sent' AND entity_type='appointment' AND entity_id=$1 LIMIT 1`,[appointmentId]);
  if(already.rowCount)return {sent:false,reason:'already_sent'};
  return sendCustomerBookingConfirmation({appointmentId:a.id,clientId:a.client_id,serviceName:a.service_name,staffName:a.staff_name,locationName:a.location_name,startsAt:a.starts_at,endsAt:a.ends_at,source:a.source||'shiloh'});
}

module.exports={sendCustomerBookingConfirmation,sendCustomerBookingConfirmationForAppointment,googleCalendarUrl,claimBookingConfirmation,releaseBookingConfirmationClaim,markBookingConfirmationSent,ensureDeliveryTable,ensureToken,practitionerApprovalStatus,shouldSendLegacyConfirmationSupplements,bookingConfirmationTemplatePayload,providerMessageId,LIVE_BOOKING_CONFIRMATION_V1,LIVE_BOOKING_CONFIRMATION_V2};