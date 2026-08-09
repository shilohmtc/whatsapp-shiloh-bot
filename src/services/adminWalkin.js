const { pool } = require("../db/pool");
const { normalizePhone, parseDateOfBirth } = require("./clientIdentityOnboarding");
const { assertRegistrationComplete } = require("./clientRegistrationPolicy");

function isWalkinStart(text = "") { return /^(add|new|create)\s+walk[- ]?in\b/i.test(String(text).trim()); }
function isCancel(text = "") { return /^(cancel|stop|abort|never mind|nevermind)$/i.test(String(text).trim()); }
function isYes(text = "") { return /^(yes|y|confirm|confirmed|ok|okay|create|add)$/i.test(String(text).trim()); }
function isNo(text = "") { return /^(no|n|change|edit)$/i.test(String(text).trim()); }
function cleanName(text = "") { const value=String(text).trim().replace(/[.!?]+$/,"").replace(/\s+/g," "); return /^[A-Za-z][A-Za-z' -]{1,79}$/.test(value)?value:null; }
function displayPhone(phone = "") { const p=normalizePhone(phone); return p.length>=4?`ending in ${p.slice(-4)}`:"provided mobile"; }

async function getAdmin(sender) { const r=await pool.query(`SELECT id, staff_id, display_name, role, permissions FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,[normalizePhone(sender)]); return r.rows[0]||null; }
async function getSession(adminId) { const r=await pool.query(`SELECT admin_id,state,pending_name,pending_phone,pending_date_of_birth FROM walkin_registration_sessions WHERE admin_id=$1`,[adminId]); return r.rows[0]||null; }
async function saveSession(adminId,patch={}) { const c=(await getSession(adminId))||{}; const r=await pool.query(`INSERT INTO walkin_registration_sessions (admin_id,state,pending_name,pending_phone,pending_date_of_birth,updated_at) VALUES ($1,$2,$3,$4,$5,NOW()) ON CONFLICT (admin_id) DO UPDATE SET state=EXCLUDED.state,pending_name=EXCLUDED.pending_name,pending_phone=EXCLUDED.pending_phone,pending_date_of_birth=EXCLUDED.pending_date_of_birth,updated_at=NOW() RETURNING *`,[adminId,patch.state??c.state??"collect_name",patch.pendingName??c.pending_name??null,patch.pendingPhone??c.pending_phone??null,patch.pendingDateOfBirth??c.pending_date_of_birth??null]); return r.rows[0]; }
async function clearSession(adminId) { await pool.query(`DELETE FROM walkin_registration_sessions WHERE admin_id=$1`,[adminId]); }
async function exactPhoneMatch(phone) { const r=await pool.query(`SELECT DISTINCT c.id,c.display_name,c.date_of_birth,c.status FROM clients c JOIN client_contacts cc ON cc.client_id=c.id WHERE cc.normalized_value=$1 AND cc.contact_type IN ('mobile','whatsapp') AND c.status='active' ORDER BY c.id`,[normalizePhone(phone)]); return r.rows; }
async function possibleIdentityMatch(name,dob) { const r=await pool.query(`SELECT id,display_name,date_of_birth FROM clients WHERE status='active' AND LOWER(display_name)=LOWER($1) AND date_of_birth=$2::date ORDER BY id`,[name,dob]); return r.rows; }
async function audit(adminId,action,entityType,entityId,metadata={}) { await pool.query(`INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,$3,$4,$5::jsonb)`,[adminId,action,entityType,entityId||null,JSON.stringify(metadata)]); }

async function createWalkin(admin,session) {
  const phone=normalizePhone(session.pending_phone);
  assertRegistrationComplete({ fullName:session.pending_name, mobileNumber:phone, dateOfBirth:session.pending_date_of_birth });
  const db=await pool.connect();
  try {
    await db.query("BEGIN");
    const existing=await db.query(`SELECT DISTINCT c.id,c.display_name,c.date_of_birth FROM clients c JOIN client_contacts cc ON cc.client_id=c.id WHERE cc.normalized_value=$1 AND cc.contact_type IN ('mobile','whatsapp') AND c.status='active' ORDER BY c.id FOR UPDATE OF c`,[phone]);
    if(existing.rowCount>0){await db.query("ROLLBACK");return{duplicate:true,client:existing.rows[0]};}
    const created=await db.query(`INSERT INTO clients (display_name,date_of_birth,source,custom_attributes) VALUES ($1,$2::date,'walk_in_whatsapp_admin',jsonb_build_object('walk_in',true)) RETURNING id,display_name,date_of_birth`,[session.pending_name,session.pending_date_of_birth]);
    const client=created.rows[0];
    await db.query(`INSERT INTO client_contacts (client_id,contact_type,value,normalized_value,is_primary) VALUES ($1,'mobile',$2,$3,TRUE)`,[client.id,session.pending_phone,phone]);
    await db.query(`INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata) VALUES ($1,'walkin.client_created','client',$2,$3::jsonb)`,[admin.id,client.id,JSON.stringify({source:"whatsapp_admin",contactSuffix:phone.slice(-4),registrationComplete:true,contactVerified:false})]);
    await db.query(`DELETE FROM walkin_registration_sessions WHERE admin_id=$1`,[admin.id]);
    await db.query("COMMIT"); return{duplicate:false,client};
  } catch(error){await db.query("ROLLBACK");throw error;} finally{db.release();}
}

async function processAdminWalkinMessage(sender,text) {
  const admin=await getAdmin(sender); if(!admin)return{handled:false,isAdmin:false};
  let session=await getSession(admin.id); if(!session&&!isWalkinStart(text))return{handled:false,isAdmin:true,admin};
  if(!session){session=await saveSession(admin.id,{state:"collect_name",pendingName:null,pendingPhone:null,pendingDateOfBirth:null});return{handled:true,isAdmin:true,admin,reply:"Admin mode: add walk-in. Every new client registration requires full name, mobile number, and date of birth. Please send the client's full name."};}
  if(isCancel(text)){await clearSession(admin.id);return{handled:true,isAdmin:true,admin,reply:"Walk-in registration cancelled. No client record was created."};}
  if(session.state==="collect_name"){const name=cleanName(text);if(!name)return{handled:true,isAdmin:true,admin,reply:"Please send the client's full name, for example: Sarah Jacobs."};await saveSession(admin.id,{state:"collect_phone",pendingName:name});return{handled:true,isAdmin:true,admin,reply:`Thanks. Please send ${name}'s mobile number.`};}
  if(session.state==="collect_phone"){const phone=normalizePhone(text);if(phone.length<10||phone.length>15)return{handled:true,isAdmin:true,admin,reply:"That mobile number doesn't look valid. Please send the full number, including country code if applicable."};const matches=await exactPhoneMatch(phone);if(matches.length){const client=matches[0];await audit(admin.id,"walkin.existing_client_found","client",client.id,{contactSuffix:phone.slice(-4)});await clearSession(admin.id);return{handled:true,isAdmin:true,admin,reply:`${client.display_name||"This client"} already exists in the CRM as client #${client.id}. I won't create a duplicate. You can use the existing profile for today's walk-in.`};}await saveSession(admin.id,{state:"collect_dob",pendingPhone:phone});return{handled:true,isAdmin:true,admin,reply:"Please send the client's date of birth in DD/MM/YYYY format."};}
  if(session.state==="collect_dob"){const dob=parseDateOfBirth(text);if(!dob)return{handled:true,isAdmin:true,admin,reply:"A valid date of birth is required for every new client registration. Please send it in DD/MM/YYYY format, for example 14/05/1985."};session=await saveSession(admin.id,{state:"confirm",pendingDateOfBirth:dob});const candidates=await possibleIdentityMatch(session.pending_name,dob);if(candidates.length){await audit(admin.id,"walkin.possible_duplicate_blocked","client",candidates[0].id,{reason:"same_name_and_dob"});await clearSession(admin.id);return{handled:true,isAdmin:true,admin,reply:`I found an existing client with the same name and date of birth: ${candidates[0].display_name} (client #${candidates[0].id}). I won't create a possible duplicate automatically. Please use or verify that existing profile.`};}return{handled:true,isAdmin:true,admin,reply:`Please confirm the new walk-in client:\n\nName: ${session.pending_name}\nMobile: ${displayPhone(session.pending_phone)}\nDate of birth: ${dob.split("-").reverse().join("/")}\n\nReply YES to create the client, or NO to cancel and start again.`};}
  if(session.state==="confirm"){if(isNo(text)){await clearSession(admin.id);return{handled:true,isAdmin:true,admin,reply:"Cancelled. No client record was created. Send 'add walk-in' when you're ready to start again."};}if(!isYes(text))return{handled:true,isAdmin:true,admin,reply:"Please reply YES to create this walk-in client, or NO to cancel."};const result=await createWalkin(admin,session);if(result.duplicate)return{handled:true,isAdmin:true,admin,reply:`${result.client.display_name||"This client"} already exists in the CRM. I did not create a duplicate.`};return{handled:true,isAdmin:true,admin,reply:`Done. ${result.client.display_name} has been added as walk-in client #${result.client.id}. Registration is complete because name, mobile and DOB are recorded. The mobile number remains unverified until the client confirms it personally.`};}
  await clearSession(admin.id);return{handled:true,isAdmin:true,admin,reply:"I reset the walk-in registration. Send 'add walk-in' to start again."};
}

module.exports={processAdminWalkinMessage};
