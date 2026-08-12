const { pool } = require("../db/pool");
const { registrationStatus, assertRegistrationComplete } = require("./clientRegistrationPolicy");

function normalizePhone(value = "") { return String(value).replace(/[^0-9]/g, ""); }
function isGreetingOnly(text = "") { return /^(hi|hello|hey|good morning|good afternoon|good evening|howzit|hiya)[!. ]*$/i.test(String(text).trim()); }
function isBookingRequest(text = "") { return /\b(book|booking|appointment|schedule|reserve)\b/i.test(String(text)); }
function isWalkinRegistrationRequest(text = "") { return /\b(register|registration|walk[- ]?in|visiting the clinic)\b/i.test(String(text)); }
function isYes(text = "") { return /^(yes|y|correct|confirm|confirmed|right|that's right|that is right|ok|okay)$/i.test(String(text).trim()); }
function isNo(text = "") { return /^(no|n|nope|different|another number)$/i.test(String(text).trim()); }
function cleanName(text = "") { const value=String(text).trim().replace(/^my name is\s+/i,"").replace(/^i am\s+/i,"").replace(/^i'm\s+/i,"").replace(/[.!?]+$/,"").trim(); if(!/^[A-Za-z][A-Za-z' -]{1,79}$/.test(value))return null; return value.replace(/\s+/g," "); }
function parseDateOfBirth(text = "") {
  const value=String(text).trim();
  let year,month,day;
  let m=value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(m){year=+m[1];month=+m[2];day=+m[3];}
  else{
    m=value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if(m){day=+m[1];month=+m[2];year=+m[3];}
    else{
      m=value.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/);
      if(!m)return null;
      const months={jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,oct:10,october:10,nov:11,november:11,dec:12,december:12};
      day=+m[1];month=months[m[2].toLowerCase()];year=+m[3];
      if(!month)return null;
    }
  }
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()+1!==month||date.getUTCDate()!==day)return null;
  const today=new Date();
  const oldest=new Date(Date.UTC(today.getUTCFullYear()-120,today.getUTCMonth(),today.getUTCDate()));
  if(date>today||date<oldest)return null;
  return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}
function maskedNumber(phone=""){const n=normalizePhone(phone);return n.length>=4?`ending in ${n.slice(-4)}`:"from this WhatsApp chat";}

const PREMIUM_GREETING = [
  "Hi 👋 Welcome to *Shiloh Massage Therapy & Aesthetic Clinic*. 🌿",
  "",
  "I’m *Shiloh*, your smart booking assistant.",
  "",
  "I can help you find the right treatment, check availability, make or manage a booking, and keep everything quick and easy.",
  "",
  "What can I help you with today?",
].join("\n");

async function resolveClientByWhatsApp(phone){const normalized=normalizePhone(phone);if(!normalized)return{status:"none",clients:[]};const r=await pool.query(`SELECT DISTINCT c.id,c.display_name,c.date_of_birth,c.status,cc.id AS contact_id,cc.contact_type,cc.normalized_value,cc.verified_at FROM clients c JOIN client_contacts cc ON cc.client_id=c.id WHERE cc.normalized_value=$1 AND cc.contact_type IN ('whatsapp','mobile') AND c.status='active' ORDER BY c.id`,[normalized]);const by=new Map();for(const row of r.rows){if(!by.has(String(row.id)))by.set(String(row.id),row);else if(row.contact_type==="whatsapp")by.set(String(row.id),row);}const clients=[...by.values()];if(!clients.length)return{status:"none",clients:[]};if(clients.length>1)return{status:"ambiguous",clients};return{status:"unique",client:clients[0],clients};}

function profileComplete(client){return registrationStatus({fullName:client?.display_name,mobileNumber:client?.normalized_value,dateOfBirth:client?.date_of_birth}).complete;}

async function getSession(phone){const r=await pool.query(`SELECT phone,client_id,state,pending_name,pending_contact,pending_date_of_birth,booking_requested,created_at,updated_at FROM client_onboarding_sessions WHERE phone=$1`,[normalizePhone(phone)]);return r.rows[0]||null;}
async function saveSession(phone,patch={}){const key=normalizePhone(phone);const c=(await getSession(key))||{};const r=await pool.query(`INSERT INTO client_onboarding_sessions (phone,client_id,state,pending_name,pending_contact,pending_date_of_birth,booking_requested,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) ON CONFLICT (phone) DO UPDATE SET client_id=EXCLUDED.client_id,state=EXCLUDED.state,pending_name=EXCLUDED.pending_name,pending_contact=EXCLUDED.pending_contact,pending_date_of_birth=EXCLUDED.pending_date_of_birth,booking_requested=EXCLUDED.booking_requested,updated_at=NOW() RETURNING *`,[key,patch.clientId??c.client_id??null,patch.state??c.state??"collect_name",patch.pendingName??c.pending_name??null,patch.pendingContact??c.pending_contact??key,patch.pendingDateOfBirth??c.pending_date_of_birth??null,patch.bookingRequested??c.booking_requested??false]);return r.rows[0];}
function nextStateForClient(client){if(!client?.display_name)return"collect_name";if(!client?.date_of_birth)return"collect_dob";return"complete";}
function promptForState(state,phone){if(state==="collect_name")return"Please tell me your full name.";if(state==="collect_dob")return"Thank you. Please send your date of birth, for example 20/10/1988 or 20 Sep 1988.";return null;}

async function completeOnboarding(phone,session){const key=normalizePhone(phone);const registrationPhone=normalizePhone(session.pending_contact)||key;assertRegistrationComplete({fullName:session.pending_name,mobileNumber:registrationPhone,dateOfBirth:session.pending_date_of_birth});const db=await pool.connect();try{await db.query("BEGIN");let clientId=session.client_id;if(clientId){await db.query(`UPDATE clients SET display_name=COALESCE($2,display_name),date_of_birth=COALESCE($3::date,date_of_birth),updated_at=NOW() WHERE id=$1`,[clientId,session.pending_name,session.pending_date_of_birth]);}else{const created=await db.query(`INSERT INTO clients (display_name,date_of_birth,source) VALUES ($1,$2::date,'whatsapp_onboarding') RETURNING id`,[session.pending_name,session.pending_date_of_birth]);clientId=created.rows[0].id;}const existing=await db.query(`SELECT id,client_id FROM client_contacts WHERE normalized_value=$1 AND contact_type IN ('whatsapp','mobile') LIMIT 1`,[key]);if(existing.rowCount&&String(existing.rows[0].client_id)!==String(clientId)){const e=new Error("WhatsApp number belongs to another canonical client");e.code="AMBIGUOUS_CONTACT";throw e;}if(existing.rowCount){await db.query(`UPDATE client_contacts SET verified_at=COALESCE(verified_at,NOW()),updated_at=NOW() WHERE id=$1`,[existing.rows[0].id]);}else{await db.query(`INSERT INTO client_contacts (client_id,contact_type,value,normalized_value,is_primary,verified_at) VALUES ($1,'whatsapp',$2,$3,TRUE,NOW())`,[clientId,phone,key]);}await db.query(`UPDATE client_onboarding_sessions SET client_id=$2,state='complete',updated_at=NOW() WHERE phone=$1`,[key,clientId]);await db.query("COMMIT");const client=await pool.query(`SELECT c.id,c.display_name,c.date_of_birth,cc.normalized_value,cc.verified_at FROM clients c JOIN client_contacts cc ON cc.client_id=c.id AND cc.normalized_value=$2 WHERE c.id=$1 LIMIT 1`,[clientId,key]);return client.rows[0];}catch(error){await db.query("ROLLBACK");throw error;}finally{db.release();}}

async function processActiveSession(phone,text,session){if(session.state==="collect_name"){const name=cleanName(text);if(!name)return{handled:true,reply:"Please send your full name, for example: Christel Botha."};const updated=await saveSession(phone,{pendingName:name,state:"collect_dob"});return{handled:true,reply:promptForState(updated.state,phone)};}if(session.state==="collect_dob"){const dob=parseDateOfBirth(text);if(!dob)return{handled:true,reply:"Please send a valid date of birth, for example 14/05/1985 or 14 May 1985."};session=await saveSession(phone,{pendingDateOfBirth:dob,pendingContact:normalizePhone(phone)});}try{const client=await completeOnboarding(phone,session);return{handled:true,onboardingComplete:true,resumeBooking:Boolean(session.booking_requested),client,reply:session.booking_requested?`Thank you, ${client.display_name}. Your Shiloh client registration is complete. We can continue with your appointment booking now.`:`Thank you, ${client.display_name}. 🌿 Your Shiloh client registration is complete. You're all set.`};}catch(error){if(error.code==="AMBIGUOUS_CONTACT"||error.code==="23505")return{handled:true,reply:"I found an identity conflict with that contact number, so I won't merge any client records automatically. Please contact the clinic team so we can verify the correct profile safely."};throw error;}}

async function processClientIdentityMessage(phone,text){const existingSession=await getSession(phone);if(existingSession&&existingSession.state!=="complete")return processActiveSession(phone,text,existingSession);const identity=await resolveClientByWhatsApp(phone);const bookingRequest=isBookingRequest(text);const walkinRequest=isWalkinRegistrationRequest(text);if(identity.status==="ambiguous"){if(bookingRequest||walkinRequest)return{handled:true,reply:"Welcome back to Shiloh. I found more than one possible client profile for this number, so I need the clinic team to verify the correct profile before continuing. I won't merge or select a profile automatically."};return{handled:false,identityStatus:"ambiguous"};}if(identity.status==="unique"&&profileComplete(identity.client)){if(walkinRequest)return{handled:true,identityStatus:"matched_complete",client:identity.client,reply:`Welcome back, ${identity.client.display_name} 👋 You're already registered with Shiloh. 🌿 How can I help you today?`};if(isGreetingOnly(text))return{handled:true,identityStatus:"matched_complete",client:identity.client,reply:`Welcome back, ${identity.client.display_name} 👋 How can I help you today?`};return{handled:false,identityStatus:"matched_complete",client:identity.client};}if(!bookingRequest&&!walkinRequest){if(identity.status!=="unique"&&isGreetingOnly(text))return{handled:true,identityStatus:"unknown",reply:PREMIUM_GREETING};return{handled:false,identityStatus:identity.status==="unique"?"matched_incomplete":"unknown",client:identity.client};}const known=identity.status==="unique"?identity.client:null;const state=known?nextStateForClient(known):"collect_name";const session=await saveSession(phone,{clientId:known?.id||null,state,pendingName:known?.display_name||null,pendingContact:normalizePhone(phone),pendingDateOfBirth:known?.date_of_birth||null,bookingRequested:bookingRequest});if(walkinRequest){const privacy="We’ll use your details to manage your clinic profile, appointments and customer care.";return{handled:true,identityStatus:known?"matched_incomplete":"unknown",client:known,reply:known?.display_name?`Welcome back, ${known.display_name}. 🌿 I just need to complete your client registration. ${privacy}\n\n${promptForState(session.state,phone)}`:`Welcome to Shiloh. 🌿 Let’s get you registered quickly. ${privacy}\n\n${promptForState(session.state,phone)}`};}return{handled:true,identityStatus:known?"matched_incomplete":"unknown",client:known,reply:known?.display_name?`Welcome back, ${known.display_name}. Before I can continue with the booking, I need to complete your client registration. ${promptForState(session.state,phone)}`:`Welcome to Shiloh. Before I can make your first booking, I need to register you as a client. Every registration requires your full name, mobile number and date of birth. ${promptForState(session.state,phone)}`};}

module.exports={normalizePhone,parseDateOfBirth,resolveClientByWhatsApp,profileComplete,processClientIdentityMessage,PREMIUM_GREETING};
