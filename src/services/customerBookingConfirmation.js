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
const { exactPhoneCandidates } = require('./clientVerifiedIdentity');
const logger = require('../lib/logger');

const LIVE_BOOKING_CONFIRMATION_V1 = 'shiloh_booking_confirmation_v1';
const LIVE_BOOKING_CONFIRMATION_V2 = 'shiloh_booking_confirmation_v2';
const CURRENT_BOOKING_CONFIRMATION_TEMPLATES = new Set([LIVE_BOOKING_CONFIRMATION_V1, LIVE_BOOKING_CONFIRMATION_V2]);
const BOOKING_CONFIRMATION_RETRY_MS = 5 * 60 * 1000;
let deliveryTableReady = false;
let deliveryScheduler = null;

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
      status TEXT NOT NULL CHECK (status IN ('pending','sending','sent','failed','uncertain')),
      claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      template_name TEXT,
      provider_message_id TEXT,
      client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
      contact_id BIGINT REFERENCES client_contacts(id) ON DELETE SET NULL,
      name_authority_id BIGINT REFERENCES client_facing_name_authorities(id) ON DELETE SET NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
      last_attempt_at TIMESTAMPTZ,
      next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_error TEXT,
      PRIMARY KEY (appointment_id,message_kind)
    )
  `);
  await pool.query(`
    ALTER TABLE customer_message_deliveries
      ADD COLUMN IF NOT EXISTS template_name TEXT,
      ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
      ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS contact_id BIGINT REFERENCES client_contacts(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS name_authority_id BIGINT REFERENCES client_facing_name_authorities(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS last_error TEXT
  `);
  await pool.query(`
    UPDATE customer_message_deliveries delivery
       SET client_id=appointment.client_id
      FROM appointments appointment
     WHERE delivery.appointment_id=appointment.id
       AND delivery.client_id IS NULL
  `);
  await pool.query(`
    DO $$
    DECLARE status_constraint TEXT;
    BEGIN
      SELECT pg_get_constraintdef(oid)
        INTO status_constraint
        FROM pg_constraint
       WHERE conrelid='customer_message_deliveries'::regclass
         AND conname='customer_message_deliveries_status_check';
      IF status_constraint IS NULL OR POSITION('pending' IN status_constraint)=0 OR POSITION('failed' IN status_constraint)=0 OR POSITION('uncertain' IN status_constraint)=0 THEN
        ALTER TABLE customer_message_deliveries DROP CONSTRAINT IF EXISTS customer_message_deliveries_status_check;
        ALTER TABLE customer_message_deliveries ADD CONSTRAINT customer_message_deliveries_status_check
          CHECK (status IN ('pending','sending','sent','failed','uncertain'));
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid='customer_message_deliveries'::regclass
           AND conname='customer_message_deliveries_attempt_count_check'
      ) THEN
        ALTER TABLE customer_message_deliveries ADD CONSTRAINT customer_message_deliveries_attempt_count_check
          CHECK (attempt_count >= 0);
      END IF;
    END $$
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_customer_message_deliveries_retry
      ON customer_message_deliveries(next_attempt_at,appointment_id)
      WHERE message_kind='booking_confirmation' AND status IN ('pending','failed')
  `);
  deliveryTableReady=true;
}

async function loadBookingConfirmationAuthority(appointmentId,db=pool){
  const result=await db.query(`
    SELECT a.id AS appointment_id,a.client_id,c.status AS client_status,
           contact.id AS contact_id,contact.normalized_value AS client_phone,
           contact.contact_verified,contact.identity_verification_id,
           contact.verification_client_id,contact.verification_contact_id,
           name_authority.id AS name_authority_id
      FROM appointments a
      JOIN clients c ON c.id=a.client_id
      LEFT JOIN LATERAL (
        SELECT cc.id,cc.normalized_value,
               (cc.verified_at IS NOT NULL) AS contact_verified,
               verification.id AS identity_verification_id,
               verification.client_id AS verification_client_id,
               verification.client_contact_id AS verification_contact_id
          FROM client_contacts cc
          LEFT JOIN LATERAL (
            SELECT v.id,v.client_id,v.client_contact_id
              FROM client_identity_verifications v
             WHERE v.client_id=c.id
               AND v.client_contact_id=cc.id
               AND v.status='active'
             ORDER BY v.verified_at DESC,v.id DESC
             LIMIT 1
          ) verification ON TRUE
         WHERE cc.client_id=c.id
           AND LOWER(cc.contact_type) IN ('whatsapp','mobile')
           AND cc.normalized_value ~ '^[0-9]{10,15}$'
         ORDER BY CASE WHEN cc.verified_at IS NOT NULL AND verification.id IS NOT NULL THEN 0 ELSE 1 END,
                  cc.is_primary DESC,cc.verified_at DESC NULLS LAST,
                  CASE LOWER(cc.contact_type) WHEN 'whatsapp' THEN 0 ELSE 1 END,
                  cc.id
         LIMIT 1
      ) contact ON TRUE
      LEFT JOIN LATERAL (
        SELECT authority.id
          FROM client_facing_name_authorities authority
         WHERE authority.client_id=c.id AND authority.revoked_at IS NULL
         ORDER BY authority.promoted_at DESC,authority.id DESC
         LIMIT 1
      ) name_authority ON TRUE
     WHERE a.id=$1`,[appointmentId]);
  return result.rows[0]||null;
}

function initialDeliveryFailure(authority){
  if(!authority)return 'appointment_not_found';
  if(authority.client_status!=='active')return 'canonical_client_inactive';
  if(!authority.contact_id||!authority.client_phone)return 'client_contact_not_found';
  if(authority.contact_verified!==true||!authority.identity_verification_id
    ||String(authority.verification_client_id)!==String(authority.client_id)
    ||String(authority.verification_contact_id)!==String(authority.contact_id))return 'client_contact_unverified';
  if(!authority.name_authority_id)return 'client_name_authority_not_found';
  return null;
}

async function contactOwnershipFailure(authority,db=pool){
  const candidates=await exactPhoneCandidates(authority.client_phone,db);
  const candidate=candidates[0];
  const contactIds=candidate?.contact_ids||[];
  if(candidates.length!==1
    ||String(candidate.id)!==String(authority.client_id)
    ||!contactIds.some((contactId)=>String(contactId)===String(authority.contact_id))){
    return 'client_contact_ambiguous';
  }
  return null;
}

async function queueCustomerBookingConfirmation(appointmentId,{db=pool}={}){
  if(db===pool)await ensureDeliveryTable();
  const legacy=await db.query(`SELECT 1 FROM crm_audit_events WHERE action='customer.booking_confirmation_sent' AND entity_type='appointment' AND entity_id=$1 LIMIT 1`,[appointmentId]);
  if(legacy.rowCount)return {queued:false,status:'sent',reason:'already_sent'};
  const authority=await loadBookingConfirmationAuthority(appointmentId,db);
  if(!authority)return {queued:false,status:'failed',reason:'appointment_not_found'};
  const initialFailure=initialDeliveryFailure(authority);
  const failure=initialFailure||await contactOwnershipFailure(authority,db);
  const inserted=await db.query(`
    INSERT INTO customer_message_deliveries
      (appointment_id,message_kind,status,client_id,contact_id,name_authority_id,next_attempt_at,last_error)
    VALUES ($1,'booking_confirmation',$2,$3,$4,$5,NOW(),$6)
    ON CONFLICT (appointment_id,message_kind) DO NOTHING
    RETURNING appointment_id,status
  `,[appointmentId,failure?'failed':'pending',authority.client_id,authority.contact_id,authority.name_authority_id,failure]);
  if(!inserted.rowCount){
    const existing=await db.query(`SELECT status,last_error FROM customer_message_deliveries WHERE appointment_id=$1 AND message_kind='booking_confirmation'`,[appointmentId]);
    return {queued:false,status:existing.rows[0]?.status||'unknown',reason:existing.rows[0]?.last_error||'already_queued'};
  }
  const auditMetadata=failure==='client_contact_ambiguous'
    ? {initialStatus:'failed',reason:failure}
    : {clientId:Number(authority.client_id),contactId:authority.contact_id?Number(authority.contact_id):null,identityVerificationId:authority.identity_verification_id?Number(authority.identity_verification_id):null,nameAuthorityId:authority.name_authority_id?Number(authority.name_authority_id):null,initialStatus:failure?'failed':'pending',reason:failure};
  await db.query(`
    INSERT INTO crm_audit_events(action,entity_type,entity_id,metadata)
    VALUES('customer.booking_confirmation_queued','appointment',$1,$2::jsonb)`,[
    String(appointmentId),
    JSON.stringify(auditMetadata),
  ]);
  return {queued:true,status:failure?'failed':'pending',reason:failure,clientId:Number(authority.client_id),contactId:authority.contact_id?Number(authority.contact_id):null,identityVerificationId:authority.identity_verification_id?Number(authority.identity_verification_id):null,nameAuthorityId:authority.name_authority_id?Number(authority.name_authority_id):null};
}

async function claimBookingConfirmation(appointmentId,{clientId=null,contactId=null,nameAuthorityId=null,db=pool}={}){
  if(db===pool)await ensureDeliveryTable();
  const legacy=await db.query(`SELECT 1 FROM crm_audit_events WHERE action='customer.booking_confirmation_sent' AND entity_type='appointment' AND entity_id=$1 LIMIT 1`,[appointmentId]);
  if(legacy.rowCount){
    await db.query(`UPDATE customer_message_deliveries SET status='sent',sent_at=COALESCE(sent_at,NOW()),updated_at=NOW(),last_error=NULL WHERE appointment_id=$1 AND message_kind='booking_confirmation'`,[appointmentId]);
    return false;
  }
  const claimed=await db.query(`
    UPDATE customer_message_deliveries
       SET status='sending',claimed_at=NOW(),updated_at=NOW(),last_attempt_at=NOW(),
           attempt_count=attempt_count+1,last_error=NULL,
           client_id=COALESCE($2,client_id),contact_id=COALESCE($3,contact_id),name_authority_id=COALESCE($4,name_authority_id)
     WHERE appointment_id=$1 AND message_kind='booking_confirmation'
       AND status IN ('pending','failed') AND next_attempt_at<=NOW()
     RETURNING appointment_id
  `,[appointmentId,clientId,contactId,nameAuthorityId]);
  return claimed.rowCount===1;
}

async function releaseBookingConfirmationClaim(appointmentId,reason='send_failed',db=pool){
  await db.query(`
    UPDATE customer_message_deliveries
       SET status='failed',updated_at=NOW(),next_attempt_at=NOW()+INTERVAL '5 minutes',last_error=$2
     WHERE appointment_id=$1 AND message_kind='booking_confirmation' AND status='sending'`,[appointmentId,String(reason||'send_failed').slice(0,1000)]);
}

async function markBookingConfirmationSent(appointmentId,{templateName=null,providerMessageId=null}={},db=pool){
  const marked=await db.query(`UPDATE customer_message_deliveries SET status='sent',sent_at=NOW(),updated_at=NOW(),next_attempt_at=NOW(),last_error=NULL,template_name=$2,provider_message_id=$3 WHERE appointment_id=$1 AND message_kind='booking_confirmation' AND status='sending'`,[appointmentId,templateName,providerMessageId]);
  if(marked.rowCount!==1)throw new Error('Booking confirmation accepted but durable sent transition failed');
}

async function markBookingConfirmationFailure(appointmentId,reason,{clientId=null,contactId=null,nameAuthorityId=null,db=pool}={}){
  await db.query(`
    UPDATE customer_message_deliveries
       SET status='failed',updated_at=NOW(),last_attempt_at=NOW(),attempt_count=attempt_count+1,
           next_attempt_at=NOW()+INTERVAL '5 minutes',last_error=$2,
           client_id=COALESCE($3,client_id),contact_id=$4,name_authority_id=$5
     WHERE appointment_id=$1 AND message_kind='booking_confirmation' AND status IN ('pending','failed')`,[
    appointmentId,String(reason||'delivery_unavailable').slice(0,1000),clientId,contactId,nameAuthorityId,
  ]);
}

async function markBookingConfirmationUncertain(appointmentId,db=pool){
  await db.query(`
    UPDATE customer_message_deliveries
       SET status='uncertain',updated_at=NOW(),next_attempt_at=NOW(),last_error='provider_delivery_unknown'
     WHERE appointment_id=$1 AND message_kind='booking_confirmation' AND status='sending'`,[appointmentId]);
}

async function ensureToken(appointmentId,db=pool){
  const existing=await db.query(`SELECT token FROM appointment_calendar_share_tokens WHERE appointment_id=$1`,[appointmentId]);
  if(existing.rows[0]?.token)return existing.rows[0].token;
  const token=crypto.randomBytes(24).toString('base64url');
  const created=await db.query(`INSERT INTO appointment_calendar_share_tokens (appointment_id,token) VALUES ($1,$2) ON CONFLICT (appointment_id) DO UPDATE SET appointment_id=EXCLUDED.appointment_id RETURNING token`,[appointmentId,token]);
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

async function sendCustomerBookingConfirmation(data,{
  db=pool,
  sendMessage=sendWhatsAppMessage,
  sendTemplate=sendWhatsAppTemplate,
  sendCta=sendWhatsAppCtaUrl,
  sendButtons=sendWhatsAppReplyButtons,
  enrollLifecycle=enrollAppointmentLifecycle,
  resolveName=resolveClientFacingName,
  env=process.env,
}={}){
  const {appointmentId,clientId,clientName:_suppliedClientName,serviceName,staffName,locationName,startsAt,endsAt,source='shiloh'}=data;
  let claimed=false;
  let providerAttempted=false;
  let providerAccepted=false;
  let acceptedProviderMessageId=null;
  try{
    await queueCustomerBookingConfirmation(appointmentId,{db});
    const authority=await loadBookingConfirmationAuthority(appointmentId,db);
    const authorityFailure=initialDeliveryFailure(authority);
    if(authorityFailure){
      await markBookingConfirmationFailure(appointmentId,authorityFailure,{clientId:authority?.client_id||clientId,contactId:authority?.contact_id||null,nameAuthorityId:authority?.name_authority_id||null,db});
      return {sent:false,reason:authorityFailure,deliveryStatus:'manual_action_required',retryable:true};
    }
    const nameResolution=await resolveName(authority.client_id,db);
    if(!nameResolution?.name||!nameResolution?.authorityId){
      await markBookingConfirmationFailure(appointmentId,'client_name_authority_not_found',{clientId:authority.client_id,contactId:authority.contact_id,nameAuthorityId:null,db});
      return {sent:false,reason:'client_name_authority_not_found',deliveryStatus:'manual_action_required',retryable:true};
    }
    const clientName=nameResolution.name;
    const phone=authority.client_phone;
    const ownershipFailure=await contactOwnershipFailure(authority,db);
    if(ownershipFailure){
      await markBookingConfirmationFailure(appointmentId,ownershipFailure,{clientId:authority.client_id,contactId:authority.contact_id,nameAuthorityId:nameResolution.authorityId||authority.name_authority_id,db});
      return {sent:false,reason:ownershipFailure,deliveryStatus:'manual_action_required',retryable:true};
    }
    claimed=await claimBookingConfirmation(appointmentId,{clientId:authority.client_id,contactId:authority.contact_id,nameAuthorityId:nameResolution.authorityId||authority.name_authority_id,db});
    if(!claimed){
      const existing=await db.query(`SELECT status,last_error FROM customer_message_deliveries WHERE appointment_id=$1 AND message_kind='booking_confirmation'`,[appointmentId]);
      const state=existing.rows[0];
      return {sent:false,reason:state?.status==='sent'?'already_sent':state?.last_error||'already_sent_or_in_progress',deliveryStatus:state?.status||'unknown'};
    }
    const token=await ensureToken(appointmentId,db);const root=baseUrl();
    const ics=root?`${root}/calendar/${token}.ics`:'';
    const google=googleCalendarUrl({serviceName,staffName,locationName,startsAt,endsAt});
    const date=fmtDate(startsAt),time=`${fmtTime(startsAt)}–${fmtTime(endsAt)}`;
    const template=env.WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE;

    await enrollLifecycle({appointmentId,clientId:authority.client_id,phone,service:serviceName,appointmentAt:startsAt,appointmentEndsAt:endsAt,therapist:staffName,source});

    let confirmationActions={googleCalendar:false,appleOutlook:false,changeButtons:false,postConfirmationMenu:false};
    if(template){
      const payload=bookingConfirmationTemplatePayload({template,appointmentId,clientName,serviceName,staffName,date,time,google,ics});
      providerAttempted=true;
      const response=await sendTemplate(phone,template,payload.bodyParameters,env.WHATSAPP_TEMPLATE_LANGUAGE||'en',payload.quickReplyPayloads);
      acceptedProviderMessageId=providerMessageId(response);
      providerAccepted=true;
    }else{
      const greeting=clientName?`Hi ${clientName}, your appointment is confirmed.`:'Your appointment is confirmed.';
      const lines=['*Booking confirmed 🌿*','',greeting,'',`✨ *Service:* ${serviceName}`,`👤 *With:* ${staffName}`,`📅 *Date:* ${date}`,`🕙 *Time:* ${time}`];
      if(locationName)lines.push(`📍 *Location:* ${locationName}`);
      lines.push('','We look forward to seeing you. 🌿');
      providerAttempted=true;
      const response=await sendMessage(phone,lines.join('\n'));
      acceptedProviderMessageId=providerMessageId(response);
      providerAccepted=true;
    }

    await markBookingConfirmationSent(appointmentId,{templateName:template||null,providerMessageId:acceptedProviderMessageId},db);

    const supplementalActionsSuppressed=!shouldSendLegacyConfirmationSupplements(template);
    if(!supplementalActionsSuppressed){
      const actionContext={appointmentId,clientId:Number(authority.client_id)};
      confirmationActions.googleCalendar=await sendOptionalConfirmationAction('google_calendar',()=>sendCta(phone,'Add to Google Calendar','Google Calendar',google),actionContext);
      if(ics){
        confirmationActions.appleOutlook=await sendOptionalConfirmationAction('apple_outlook_calendar',()=>sendCta(phone,'Add to Apple / Outlook','Apple / Outlook',ics),actionContext);
      }
      confirmationActions.changeButtons=await sendOptionalConfirmationAction('booking_change_buttons',()=>sendButtons(phone,'*Need to make a change?*\nUse a button below, or type *RESCHEDULE* or *CANCEL*.',[
        {id:'client_reschedule_booking',title:'Reschedule'},
        {id:'client_cancel_booking',title:'Cancel booking'},
      ]),actionContext);
      confirmationActions.postConfirmationMenu=await sendOptionalConfirmationAction('post_confirmation_menu',()=>sendButtons(phone,'*What would you like to do next?*\nYou can also type *BOOK ANOTHER TREATMENT*, *MY APPOINTMENTS*, or *MAIN MENU*.',postConfirmationButtons()),actionContext);
    }

    await db.query(`INSERT INTO crm_audit_events (action,entity_type,entity_id,metadata) VALUES ('customer.booking_confirmation_sent','appointment',$1,$2::jsonb)`,[appointmentId,JSON.stringify({clientId:Number(authority.client_id),contactId:Number(authority.contact_id),identityVerificationId:Number(authority.identity_verification_id),calendarLinks:true,template:Boolean(template),templateName:template||null,providerMessageId:acceptedProviderMessageId,lifecycleEnrolled:true,idempotentDelivery:true,supplementalActionsSuppressed,confirmationActions,nameAuthorityId:Number(nameResolution.authorityId)})]);
    return {sent:true,deliveryStatus:'sent',templateName:template||null,providerMessageId:acceptedProviderMessageId,supplementalActionsSuppressed,confirmationActions};
  }catch(error){
    if(claimed&&!providerAccepted){
      try{
        if(providerAttempted&&!error.response)await markBookingConfirmationUncertain(appointmentId,db);
        else await releaseBookingConfirmationClaim(appointmentId,providerAttempted?'provider_rejected':'pre_send_failure',db);
      }catch(releaseError){logger.error({err:releaseError,appointmentId},'Booking confirmation claim release failed');}
    }
    logger.error({err:error,appointmentId,providerAccepted},'Customer booking confirmation failed');
    const uncertain=providerAccepted||(providerAttempted&&!error.response);
    return {sent:false,reason:uncertain?'delivery_state_uncertain':'send_failed',deliveryStatus:uncertain?'uncertain':'retry_pending',retryable:!uncertain};
  }
}

async function practitionerApprovalStatus(appointmentId,db=pool){
  const table=await db.query(`SELECT to_regclass('public.appointment_booking_approvals') AS table_name`);
  if(!table.rows[0]?.table_name)return null;
  const result=await db.query(`SELECT status FROM appointment_booking_approvals WHERE appointment_id=$1`,[appointmentId]);
  return result.rows[0]?.status||null;
}

async function sendCustomerBookingConfirmationForAppointment(appointmentId,options={}){
  const db=options.db||pool;
  const r=await db.query(`
    SELECT a.id,a.client_id,a.starts_at,a.ends_at,a.source,l.name AS location_name,
           COALESCE((SELECT string_agg(service_name_snapshot,' + ' ORDER BY position) FROM appointment_services WHERE appointment_id=a.id),a.title,'Shiloh appointment') AS service_name,
           COALESCE((SELECT string_agg(staff_name_snapshot,' + ' ORDER BY position) FROM appointment_staff WHERE appointment_id=a.id),'Shiloh practitioner') AS staff_name
      FROM appointments a LEFT JOIN locations l ON l.id=a.location_id
     WHERE a.id=$1 AND a.status<>'cancelled'`,[appointmentId]);
  const a=r.rows[0];if(!a)return {sent:false,reason:'appointment_not_found'};
  if(a.source==='shiloh_client_whatsapp'){
    const approval=await practitionerApprovalStatus(appointmentId,db);
    if(approval!=='approved')return {sent:false,reason:'practitioner_approval_required'};
  }
  const already=await db.query(`SELECT 1 FROM crm_audit_events WHERE action='customer.booking_confirmation_sent' AND entity_type='appointment' AND entity_id=$1 LIMIT 1`,[appointmentId]);
  if(already.rowCount)return {sent:false,reason:'already_sent'};
  const queued=await queueCustomerBookingConfirmation(appointmentId,{db});
  if(queued.status==='sent')return {sent:false,reason:'already_sent',deliveryStatus:'sent'};
  return sendCustomerBookingConfirmation({appointmentId:a.id,clientId:a.client_id,serviceName:a.service_name,staffName:a.staff_name,locationName:a.location_name,startsAt:a.starts_at,endsAt:a.ends_at,source:a.source||'shiloh'},{...options,db});
}

async function flushCustomerBookingConfirmations(){
  await ensureDeliveryTable();
  const due=await pool.query(`
    SELECT appointment_id
      FROM customer_message_deliveries
     WHERE message_kind='booking_confirmation'
       AND status IN ('pending','failed')
       AND next_attempt_at<=NOW()
     ORDER BY next_attempt_at,appointment_id
     LIMIT 25`);
  const results=[];
  for(const row of due.rows){
    results.push({appointmentId:Number(row.appointment_id),result:await sendCustomerBookingConfirmationForAppointment(row.appointment_id)});
  }
  return {attempted:results.length,results};
}

function startCustomerBookingConfirmationScheduler(){
  if(deliveryScheduler)return;
  setImmediate(()=>flushCustomerBookingConfirmations().catch((error)=>logger.error({err:error},'Initial booking confirmation retry scan failed')));
  deliveryScheduler=setInterval(()=>{
    flushCustomerBookingConfirmations().catch((error)=>logger.error({err:error},'Initial booking confirmation retry scan failed'));
  },BOOKING_CONFIRMATION_RETRY_MS);
  deliveryScheduler.unref?.();
  logger.info({retryMinutes:BOOKING_CONFIRMATION_RETRY_MS/60000},'Initial booking confirmation scheduler started');
}

module.exports={sendCustomerBookingConfirmation,sendCustomerBookingConfirmationForAppointment,queueCustomerBookingConfirmation,loadBookingConfirmationAuthority,initialDeliveryFailure,flushCustomerBookingConfirmations,startCustomerBookingConfirmationScheduler,googleCalendarUrl,claimBookingConfirmation,releaseBookingConfirmationClaim,markBookingConfirmationSent,markBookingConfirmationFailure,markBookingConfirmationUncertain,ensureDeliveryTable,ensureToken,practitionerApprovalStatus,shouldSendLegacyConfirmationSupplements,bookingConfirmationTemplatePayload,providerMessageId,LIVE_BOOKING_CONFIRMATION_V1,LIVE_BOOKING_CONFIRMATION_V2,BOOKING_CONFIRMATION_RETRY_MS};
