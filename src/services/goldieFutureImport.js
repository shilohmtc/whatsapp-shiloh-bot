const crypto = require('crypto');
const zlib = require('zlib');
const { pool } = require('../db/pool');
const { checkCalendarAvailability, createBookingEvent } = require('./googleBookingCalendar');
const logger = require('../lib/logger');

function norm(v=''){return String(v||'').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').trim().toLowerCase().replace(/\s+/g,' ');}
function phone(v=''){return String(v||'').replace(/\D/g,'');}
function splitCsv(v=''){return String(v||'').split(',').map(x=>x.trim()).filter(Boolean);}
function rowKey(row){return crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex');}
function parseLocal(date,time){const m=String(date).match(/^(\d{2})\/(\d{2})\/(\d{2})$/);if(!m)throw new Error(`Invalid Goldie date ${date}`);const iso=`20${m[3]}-${m[2]}-${m[1]}T${time}+02:00`;return new Date(iso);}
function classify(row){if(!row.Services||norm(row.Services)==='personal')return 'calendar_block';return 'appointment';}
function statusFor(v){return norm(v)==='confirmed'?'confirmed':'scheduled';}

function decodePayload(){const encoded=process.env.GOLDIE_FUTURE_IMPORT_PAYLOAD_B64;if(!encoded)return null;const bytes=Buffer.from(encoded,'base64');const raw=bytes[0]===0x1f&&bytes[1]===0x8b?zlib.gunzipSync(bytes):bytes;return JSON.parse(raw.toString('utf8'));}

async function loadReferenceData(db){
 const [staffR,serviceR,locationR]=await Promise.all([
  db.query(`SELECT id,display_name,source_name,resource_type,status FROM staff`),
  db.query(`SELECT id,name,duration_minutes,status FROM services`),
  db.query(`SELECT id,name FROM locations WHERE status='active' ORDER BY id LIMIT 2`)
 ]);
 if(locationR.rowCount!==1)throw new Error('Goldie import requires exactly one active location');
 return {staff:staffR.rows,services:serviceR.rows,location:locationR.rows[0]};
}
function resolveStaff(name,rows){const n=norm(name).replace(/\s*\.\s*$/,'');return rows.find(r=>norm(r.source_name).replace(/\s*\.\s*$/,'')===n)||rows.find(r=>norm(r.display_name)===n)||null;}
function resolveService(name,rows){const n=norm(name).replace(/[.:]+$/,'');return rows.find(r=>norm(r.name).replace(/[.:]+$/,'')===n)||null;}
function clientCandidates(payload,name){return (payload.clients||[]).filter(c=>norm(c.name)===norm(name));}
async function resolveClient(db,payload,name,commit){
 const goldie=clientCandidates(payload,name);const uniquePhones=[...new Set(goldie.map(c=>phone(c.phone)).filter(Boolean))];
 if(uniquePhones.length===1){const r=await db.query(`SELECT DISTINCT c.id,c.display_name FROM clients c JOIN client_contacts cc ON cc.client_id=c.id WHERE cc.normalized_value=$1 AND c.status='active'`,[uniquePhones[0]]);if(r.rowCount===1)return {client:r.rows[0],method:'phone'};if(r.rowCount>1)return {ambiguous:true,reason:'phone_multiple'};}
 const byName=await db.query(`SELECT id,display_name FROM clients WHERE status='active' AND LOWER(TRIM(display_name))=LOWER(TRIM($1))`,[name]);if(byName.rowCount===1)return {client:byName.rows[0],method:'name'};if(byName.rowCount>1)return {ambiguous:true,reason:'name_multiple'};
 if(!commit)return {create:true,method:'new'};
 const c=await db.query(`INSERT INTO clients(display_name,status,source,custom_attributes) VALUES($1,'active','goldie_import',$2::jsonb) RETURNING id,display_name`,[name,JSON.stringify({goldieImported:true})]);
 const client=c.rows[0];
 if(uniquePhones.length===1){const p=uniquePhones[0];const collision=await db.query(`SELECT client_id FROM client_contacts WHERE normalized_value=$1 LIMIT 1`,[p]);if(!collision.rowCount)await db.query(`INSERT INTO client_contacts(client_id,contact_type,value,normalized_value,is_primary) VALUES($1,'whatsapp',$2,$2,TRUE)`,[client.id,p]);}
 const email=[...new Set(goldie.map(c=>String(c.email||'').trim().toLowerCase()).filter(Boolean))];if(email.length===1){const e=email[0];const collision=await db.query(`SELECT client_id FROM client_contacts WHERE contact_type='email' AND normalized_value=$1 LIMIT 1`,[e]);if(!collision.rowCount)await db.query(`INSERT INTO client_contacts(client_id,contact_type,value,normalized_value,is_primary) VALUES($1,'email',$2,$2,TRUE)`,[client.id,e]);}
 return {client,method:'created'};
}
async function existingAppointment(db,{clientId,startsAt,endsAt}){const r=await db.query(`SELECT id FROM appointments WHERE client_id=$1 AND starts_at=$2 AND ends_at=$3 AND status<>'cancelled' LIMIT 1`,[clientId,startsAt,endsAt]);return r.rows[0]||null;}

async function runGoldieFutureImport({mode='dry-run'}={}){
 const payload=decodePayload();if(!payload)return {status:'disabled'};const commit=mode==='commit';const db=await pool.connect();const summary={mode,rows:(payload.rows||[]).length,appointments:0,blocks:0,createdAppointments:0,createdBlocks:0,existingAppointments:0,createdClients:0,unresolved:0,calendarSynced:0,calendarExistingConflict:0,calendarSkippedMultiStaff:0};const issues=[];let batchId=null;
 try{
  const ref=await loadReferenceData(db);
  if(commit){const checksum=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');const b=await db.query(`INSERT INTO import_batches(source,source_file,source_exported_at,checksum,status,metadata) VALUES('goldie',$1,$2,$3,'processing',$4::jsonb) RETURNING id`,[payload.sourceFile||null,payload.exportedAt||null,checksum,JSON.stringify({cutoffDate:payload.cutoffDate,mode})]);batchId=b.rows[0].id;}
  for(const row of payload.rows||[]){
   const kind=classify(row);if(kind==='appointment')summary.appointments++;else summary.blocks++;
   let starts=parseLocal(row.Date,row['Start Time']);let ends=parseLocal(row.Date,row['End Time']);if(ends<=starts)ends=new Date(ends.getTime()+24*3600*1000);
   const ext=rowKey(row);
   const rawStaff=splitCsv(row.Staff);const staffResolved=[];let badStaff=false;
   for(const s of rawStaff){const st=resolveStaff(s,ref.staff);if(!st){badStaff=true;issues.push({externalKey:ext,type:'staff_unresolved'});}else if(!staffResolved.some(x=>x.id===st.id))staffResolved.push(st);}
   if(kind==='calendar_block'){
    if(badStaff||!staffResolved.length){summary.unresolved++;continue;}
    if(!commit)continue;
    for(const st of staffResolved){const key=`goldie:${ext}:${st.id}`;const exists=await db.query(`SELECT id FROM calendar_blocks WHERE source='goldie_import' AND external_key=$1`,[key]);if(exists.rowCount)continue;await db.query(`INSERT INTO calendar_blocks(staff_id,location_id,block_type,starts_at,ends_at,title,notes,recurrence_text,source,external_key,source_staff_name) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'goldie_import',$9,$10)`,[st.id,ref.location.id,norm(row.Services)==='personal'?'personal_event':'time_off',starts,ends,row.Title||row.Services||'Goldie calendar block',row.Notes||null,row.Recurrence||null,key,row.Staff||null]);summary.createdBlocks++;}
    continue;
   }
   const services=splitCsv(row.Services).map(s=>resolveService(s,ref.services));if(services.some(x=>!x)){summary.unresolved++;issues.push({externalKey:ext,type:'service_unresolved'});continue;}
   if(badStaff||!staffResolved.length||staffResolved.some(s=>s.resource_type!=='practitioner')){summary.unresolved++;issues.push({externalKey:ext,type:'practitioner_unresolved'});continue;}
   const rc=await resolveClient(db,payload,row.Clients,commit);if(rc.ambiguous){summary.unresolved++;issues.push({externalKey:ext,type:'client_ambiguous'});continue;}if(rc.create&&!commit){}else if(rc.method==='created')summary.createdClients++;
   if(!commit)continue;
   const dup=await existingAppointment(db,{clientId:rc.client.id,startsAt:starts,endsAt:ends});if(dup){summary.existingAppointments++;continue;}
   const a=await db.query(`INSERT INTO appointments(client_id,location_id,starts_at,ends_at,status,title,notes,total_price,currency,source,external_key,source_client_name,source_recurrence) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'ZAR','goldie_import',$9,$10,$11) RETURNING id`,[rc.client.id,ref.location.id,starts,ends,statusFor(row.Status),row.Title||services.map(s=>s.name).join(', '),row.Notes||null,row.Price==null?null:Number(row.Price),`goldie:${ext}`,row.Clients||null,row.Recurrence||null]);const appointmentId=a.rows[0].id;
   for(let i=0;i<services.length;i++){const s=services[i];await db.query(`INSERT INTO appointment_services(appointment_id,service_id,position,service_name_snapshot,price_snapshot,duration_minutes_snapshot) VALUES($1,$2,$3,$4,$5,$6)`,[appointmentId,s.id,i+1,s.name,services.length===1&&row.Price!=null?Number(row.Price):null,s.duration_minutes]);}
   for(let i=0;i<staffResolved.length;i++){const st=staffResolved[i];await db.query(`INSERT INTO appointment_staff(appointment_id,staff_id,position,staff_name_snapshot) VALUES($1,$2,$3,$4)`,[appointmentId,st.id,i+1,st.display_name]);}
   await db.query(`INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason) VALUES($1,NULL,$2,'system:goldie_import','Imported existing future Goldie booking; no customer confirmation sent')`,[appointmentId,statusFor(row.Status)]);
   if(batchId)await db.query(`INSERT INTO external_records(import_batch_id,source,entity_type,external_id,shiloh_entity_type,shiloh_entity_id,reconciliation_status,match_method,match_confidence,source_payload,reconciled_at) VALUES($1,'goldie','appointment',$2,'appointment',$3,'matched','future_booking_import',1,$4::jsonb,NOW()) ON CONFLICT(source,entity_type,external_id) DO UPDATE SET shiloh_entity_type='appointment',shiloh_entity_id=EXCLUDED.shiloh_entity_id,reconciliation_status='matched',reconciled_at=NOW(),updated_at=NOW()`,[batchId,ext,appointmentId,JSON.stringify(row)]);
   summary.createdAppointments++;
   try{if(staffResolved.length===1){const cal=await checkCalendarAvailability({startsAt:starts,endsAt:ends,staffName:staffResolved[0].display_name});if(cal.enabled&&cal.available){const ev=await createBookingEvent({appointmentId,clientName:row.Clients,serviceName:services.map(s=>s.name).join(' + '),staffName:staffResolved[0].display_name,locationName:ref.location.name,startsAt:starts,endsAt:ends,source:'goldie_import'});if(ev.enabled&&ev.event){await db.query(`INSERT INTO appointment_calendar_events(appointment_id,provider,calendar_id,event_id,sync_status,updated_at) VALUES($1,'google_calendar',$2,$3,'synced',NOW()) ON CONFLICT(appointment_id,provider) DO UPDATE SET calendar_id=EXCLUDED.calendar_id,event_id=EXCLUDED.event_id,sync_status='synced',last_error=NULL,updated_at=NOW()`,[appointmentId,process.env.GOOGLE_BOOKING_CALENDAR_ID,ev.event.id]);summary.calendarSynced++;}}else if(cal.enabled&&!cal.available)summary.calendarExistingConflict++;}else summary.calendarSkippedMultiStaff++;}catch(e){issues.push({externalKey:ext,type:'google_calendar_sync_failed'});}
  }
  if(commit&&batchId)await db.query(`UPDATE import_batches SET status='completed',completed_at=NOW(),metadata=metadata||$2::jsonb WHERE id=$1`,[batchId,JSON.stringify({summary,issues})]);
  logger.info({summary,issueTypes:issues.reduce((m,i)=>(m[i.type]=(m[i.type]||0)+1,m),{})},`Goldie future import ${mode} completed`);return {status:'ok',summary,issues};
 }catch(error){if(commit&&batchId){try{await db.query(`UPDATE import_batches SET status='failed',completed_at=NOW(),metadata=metadata||$2::jsonb WHERE id=$1`,[batchId,JSON.stringify({error:String(error.message||error)})]);}catch(_){}}logger.error({err:error},'Goldie future import failed');throw error;}finally{db.release();}
}
async function runGoldieFutureImportFromEnv(){if(process.env.RUN_GOLDIE_FUTURE_IMPORT!=='true')return {status:'disabled'};return runGoldieFutureImport({mode:process.env.GOLDIE_FUTURE_IMPORT_MODE==='commit'?'commit':'dry-run'});}
module.exports={runGoldieFutureImport,runGoldieFutureImportFromEnv};
