const { pool } = require('../db/pool');
const logger = require('../lib/logger');
const { parseGoldieDateTime } = require('./appointmentReconciliationPlan');
const { findBookingEventByAppointmentId, createBookingEvent } = require('./googleBookingCalendar');

const EXEC_CONFIRMATION = 'EXECUTE_AUGUST_GOLDIE_RECOVERY';
const TARGET_APPOINTMENT_RECORD_IDS = new Set(['1725','1727','1734','1735','1736','1741','1755','1774','1775']);
const REAL_BOOKING_RECORD_IDS = new Set(['1725','1727','1734','1735','1736','1741','1755']);
const CLIENT_RECORD_BY_APPOINTMENT = new Map([
  ['1725','78'], ['1727','881'], ['1734','686'], ['1735','686'], ['1736','686'], ['1741','137'], ['1755','461'],
]);
const EXPECTED_CLIENT_NAMES = new Map([
  ['78','Temiah Booysen'], ['881','Lelénia de Beer'], ['686','Client - Drienie Kleinhans (Spa x 2)'], ['137','Aa My Liefste'], ['461','Graham Hayter (Khalil) Hayter'],
]);
const GWENDIE_RECORD_ID = '1774';
const GWENDIE_EXISTING_APPOINTMENT_ID = '552';
const PERSONAL_RECORD_ID = '1775';

function norm(value='') { return String(value||'').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF\u2060]/g,'').trim().toLowerCase().replace(/\s+/g,' '); }
function splitList(value='') { return String(value||'').split(',').map(v=>v.trim()).filter(Boolean); }
function statusFor(value='') { const s=norm(value); if(s==='confirmed') return 'confirmed'; if(['completed','complete'].includes(s)) return 'completed'; if(['cancelled','canceled'].includes(s)) return 'cancelled'; if(['no show','no-show','noshow'].includes(s)) return 'no_show'; return 'scheduled'; }
function money(value) { const n=Number(String(value||'').replace(/[^0-9.-]/g,'')); return Number.isFinite(n)?n:null; }
function normStaff(value='') { return norm(value).replace(/\s*\.\s*$/,''); }

async function getOrCreateRecoveryClient(db, externalClientRecordId) {
  const locked = await db.query(`
    SELECT er.id AS external_record_id,er.external_id,er.reconciliation_status,er.shiloh_entity_id,
           ecr.display_name,ecr.email,ecr.phone,ecr.normalized_phone,ecr.secondary_phone,ecr.normalized_secondary_phone,
           ecr.address,ecr.notes,ecr.has_photo,ecr.is_blocked,
           q.id AS queue_id,q.status AS queue_status,q.reason AS queue_reason
      FROM external_records er
      JOIN external_client_records ecr ON ecr.external_record_id=er.id
      LEFT JOIN client_reconciliation_queue q ON q.external_record_id=er.id
     WHERE er.id=$1 AND er.source='goldie' AND er.entity_type='client' AND er.import_batch_id='1'
     FOR UPDATE OF er,q`, [externalClientRecordId]);
  const row=locked.rows[0];
  if(!row) throw new Error(`Goldie client record ${externalClientRecordId} not found`);
  const expected=EXPECTED_CLIENT_NAMES.get(String(externalClientRecordId));
  if(!expected || norm(row.display_name)!==norm(expected)) throw new Error(`Goldie client record ${externalClientRecordId} identity changed`);
  if(row.shiloh_entity_id) return {clientId:String(row.shiloh_entity_id),created:false};
  if(row.reconciliation_status==='matched') throw new Error(`Goldie client record ${externalClientRecordId} is matched without a canonical client id`);
  if(row.queue_status!=='needs_review' || row.queue_reason!=='duplicate_goldie_primary_phone') throw new Error(`Goldie client record ${externalClientRecordId} is no longer in the expected guarded review state`);

  const existing=await db.query(`SELECT id FROM clients WHERE status='active' AND lower(trim(display_name))=lower(trim($1)) ORDER BY id FOR UPDATE`,[row.display_name]);
  if(existing.rowCount) throw new Error(`A canonical client named ${row.display_name} appeared after the recovery audit; refusing automatic duplicate creation`);

  const attrs={
    goldie_import_batch_id:'1', goldie_external_id:row.external_id,
    reconciliation_policy:'august_booking_recovery_distinct_identity',
    contact_unverified:true, outbound_contact_authorized:false,
    source_primary_phone:row.phone||null, source_normalized_phone:row.normalized_phone||null,
    source_secondary_phone:row.secondary_phone||null, source_normalized_secondary_phone:row.normalized_secondary_phone||null,
    source_email:row.email||null, address:row.address||null, notes:row.notes||null,
    has_photo:Boolean(row.has_photo), is_blocked:Boolean(row.is_blocked),
    source_contact_collision_reason:'duplicate_goldie_primary_phone',
  };
  const inserted=await db.query(`INSERT INTO clients(display_name,status,source,custom_attributes) VALUES($1,'active','goldie_import',$2::jsonb) RETURNING id`,[row.display_name,JSON.stringify(attrs)]);
  const clientId=String(inserted.rows[0].id);
  const evidence=JSON.stringify({policy:'august_booking_recovery_distinct_identity',source_record_id:String(row.external_record_id),contact_unverified:true,outbound_contact_authorized:false,reason:'preserve_booked_identity_without_merging_shared_phone'});
  await db.query(`UPDATE external_records SET shiloh_entity_type='client',shiloh_entity_id=$2,reconciliation_status='matched',match_method='august_booking_recovery_distinct_identity',match_confidence=1,reconciled_at=NOW(),updated_at=NOW() WHERE id=$1`,[row.external_record_id,clientId]);
  if(row.queue_id) await db.query(`UPDATE client_reconciliation_queue SET status='matched',resolution='august_booking_recovery_distinct_identity',resolved_client_id=$2,resolved_by='system:august_goldie_recovery',resolved_at=NOW(),candidate_score=1,evidence=evidence||$3::jsonb WHERE id=$1`,[row.queue_id,clientId,evidence]);
  await db.query(`INSERT INTO client_reconciliation_history(external_record_id,client_id,action,method,confidence,evidence,performed_by) VALUES($1,$2,'created','august_booking_recovery_distinct_identity',1,$3::jsonb,'system:august_goldie_recovery')`,[row.external_record_id,clientId,evidence]);
  return {clientId,created:true};
}

async function resolveService(db, sourceName) {
  const clean=norm(sourceName).replace(/[.:]+$/,'');
  const r=await db.query(`SELECT id,name,duration_minutes,price,status,external_source FROM services ORDER BY id`);
  const match=r.rows.find(s=>norm(s.name).replace(/[.:]+$/,'')===clean);
  return match||null;
}
async function resolveStaff(db, sourceName) {
  const key=normStaff(sourceName);
  const r=await db.query(`SELECT id,display_name,source_name,status,resource_type FROM staff ORDER BY id`);
  return r.rows.find(s=>normStaff(s.display_name)===key || normStaff(s.source_name)===key)||null;
}

async function createRecoveredAppointment(db, rec, clientId, locationId) {
  const p=rec.source_payload||{};
  const start=parseGoldieDateTime(p.Date,p['Start Time']);
  const end=parseGoldieDateTime(p.Date,p['End Time']);
  if(!(start&&end&&end>start)) throw new Error(`Invalid recovery time range for Goldie appointment record ${rec.id}`);
  const existing=await db.query(`SELECT id FROM appointments WHERE source='goldie' AND external_id=$1 FOR UPDATE`,[rec.external_id]);
  if(existing.rowCount) return {appointmentId:String(existing.rows[0].id),created:false};
  const inserted=await db.query(`
    INSERT INTO appointments(client_id,location_id,starts_at,ends_at,status,title,notes,total_price,currency,source,external_id,external_key,source_client_name,source_recurrence)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,'ZAR','goldie',$9,$9,$10,$11) RETURNING id`,
    [clientId,locationId,start.toISOString(),end.toISOString(),statusFor(p.Status),p.Title||null,p.Notes||null,money(p.Price),rec.external_id,p.Clients||null,p.Recurrence||null]);
  const appointmentId=String(inserted.rows[0].id);

  const serviceNames=splitList(p.Services);
  for(let i=0;i<serviceNames.length;i++){
    const service=await resolveService(db,serviceNames[i]);
    await db.query(`INSERT INTO appointment_services(appointment_id,service_id,position,service_name_snapshot,price_snapshot,duration_minutes_snapshot) VALUES($1,$2,$3,$4,$5,$6)`,[appointmentId,service?.id||null,i+1,service?.name||serviceNames[i],serviceNames.length===1?money(p.Price):service?.price||null,service?.duration_minutes||null]);
  }
  const staffNames=splitList(p.Staff);
  for(let i=0;i<staffNames.length;i++){
    const staff=await resolveStaff(db,staffNames[i]);
    if(!staff) throw new Error(`Unresolved historical staff '${staffNames[i]}' for Goldie appointment record ${rec.id}`);
    await db.query(`INSERT INTO appointment_staff(appointment_id,staff_id,position,staff_name_snapshot) VALUES($1,$2,$3,$4)`,[appointmentId,staff.id,i+1,staff.display_name]);
  }
  await db.query(`INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason) VALUES($1,NULL,$2,'system:august_goldie_recovery','Recovered from verified Goldie August export; no customer confirmation sent')`,[appointmentId,statusFor(p.Status)]);
  await db.query(`UPDATE external_records SET shiloh_entity_type='appointment',shiloh_entity_id=$2,reconciliation_status='matched',match_method='august_goldie_recovery',match_confidence=1,reconciled_at=NOW(),updated_at=NOW() WHERE id=$1`,[rec.id,appointmentId]);
  return {appointmentId,created:true};
}

async function linkGwendieDuplicate(db, rec) {
  const p=rec.source_payload||{};
  const a=await db.query(`SELECT a.id,a.client_id,a.starts_at,a.ends_at,c.display_name FROM appointments a LEFT JOIN clients c ON c.id=a.client_id WHERE a.id=$1 FOR UPDATE OF a`,[GWENDIE_EXISTING_APPOINTMENT_ID]);
  const row=a.rows[0];
  const start=parseGoldieDateTime(p.Date,p['Start Time']),end=parseGoldieDateTime(p.Date,p['End Time']);
  if(!row || !start || !end || new Date(row.starts_at).getTime()!==start.getTime() || new Date(row.ends_at).getTime()!==end.getTime() || norm(row.display_name)!==norm('Gwendie T (Willemien Lezar, Skoonsussie')) throw new Error('Gwendie duplicate evidence changed; refusing automatic link');
  await db.query(`UPDATE external_records SET shiloh_entity_type='appointment',shiloh_entity_id=$2,reconciliation_status='matched',match_method='august_goldie_duplicate_link',match_confidence=1,reconciled_at=NOW(),updated_at=NOW() WHERE id=$1`,[rec.id,GWENDIE_EXISTING_APPOINTMENT_ID]);
  return {appointmentId:GWENDIE_EXISTING_APPOINTMENT_ID};
}

async function promotePersonalBlock(db, rec, locationId) {
  const p=rec.source_payload||{};
  if(norm(p.Services)!=='personal') throw new Error('Expected Personal service for August block recovery');
  const start=parseGoldieDateTime(p.Date,p['Start Time']),end=parseGoldieDateTime(p.Date,p['End Time']);
  const staff=await resolveStaff(db,p.Staff);
  if(!(start&&end&&end>start&&staff)) throw new Error('Personal block recovery evidence changed');
  const existing=await db.query(`SELECT id FROM calendar_blocks WHERE source='goldie' AND external_id=$1 FOR UPDATE`,[rec.external_id]);
  let id=existing.rows[0]?.id;
  if(!id){const r=await db.query(`INSERT INTO calendar_blocks(staff_id,location_id,block_type,starts_at,ends_at,title,notes,recurrence_text,source,external_id,external_key,source_staff_name) VALUES($1,$2,'personal_event',$3,$4,$5,$6,$7,'goldie',$8,$8,$9) RETURNING id`,[staff.id,locationId,start.toISOString(),end.toISOString(),p.Title||'Personal',p.Notes||null,p.Recurrence||null,rec.external_id,p.Staff||null]);id=r.rows[0].id;}
  await db.query(`UPDATE external_records SET shiloh_entity_type='calendar_block',shiloh_entity_id=$2,reconciliation_status='matched',match_method='august_goldie_personal_block_recovery',match_confidence=1,reconciled_at=NOW(),updated_at=NOW() WHERE id=$1`,[rec.id,id]);
  return {blockId:String(id)};
}

async function syncAugustAppointmentsToGoogleCalendar() {
  const db=await pool.connect();
  const summary={appointments:0,alreadyTracked:0,foundInGoogle:0,createdEvents:0,errors:0};
  const issues=[];
  try{
    const r=await db.query(`
      SELECT a.id,a.starts_at,a.ends_at,a.status,a.source,COALESCE(c.display_name,a.source_client_name,'Client') AS client_name,
             l.name AS location_name,
             string_agg(DISTINCT aps.service_name_snapshot,' + ' ORDER BY aps.service_name_snapshot) AS service_name,
             string_agg(DISTINCT ast.staff_name_snapshot,' + ' ORDER BY ast.staff_name_snapshot) AS staff_name,
             ace.event_id AS tracked_event_id
      FROM appointments a
      LEFT JOIN clients c ON c.id=a.client_id LEFT JOIN locations l ON l.id=a.location_id
      LEFT JOIN appointment_services aps ON aps.appointment_id=a.id LEFT JOIN appointment_staff ast ON ast.appointment_id=a.id
      LEFT JOIN appointment_calendar_events ace ON ace.appointment_id=a.id AND ace.provider='google_calendar' AND ace.sync_status='synced'
      WHERE a.starts_at>='2026-08-01T00:00:00+02:00'::timestamptz AND a.starts_at<'2026-09-01T00:00:00+02:00'::timestamptz AND a.status<>'cancelled'
      GROUP BY a.id,c.display_name,l.name,ace.event_id ORDER BY a.starts_at,a.id`);
    summary.appointments=r.rowCount;
    for(const a of r.rows){
      if(a.tracked_event_id){summary.alreadyTracked++;continue;}
      try{
        const found=await findBookingEventByAppointmentId(a.id);
        let event=found;
        if(found) summary.foundInGoogle++;
        else {const created=await createBookingEvent({appointmentId:a.id,clientName:a.client_name,serviceName:a.service_name||'Appointment',staffName:a.staff_name||null,locationName:a.location_name||'Shiloh Massage Therapy and Aesthetic Clinic',startsAt:a.starts_at,endsAt:a.ends_at,source:a.source||'goldie'});event=created.event;if(event)summary.createdEvents++;}
        if(event) await db.query(`INSERT INTO appointment_calendar_events(appointment_id,provider,calendar_id,event_id,sync_status,updated_at) VALUES($1,'google_calendar',$2,$3,'synced',NOW()) ON CONFLICT(appointment_id,provider) DO UPDATE SET calendar_id=EXCLUDED.calendar_id,event_id=EXCLUDED.event_id,sync_status='synced',last_error=NULL,updated_at=NOW()`,[a.id,process.env.GOOGLE_BOOKING_CALENDAR_ID,event.id]);
      }catch(error){summary.errors++;issues.push({appointmentId:String(a.id),message:String(error.message||error).slice(0,180)});}
    }
    logger.info({augustGoogleCalendarRecovery:{summary,issues}},'August Google Calendar recovery completed');
    return {summary,issues};
  } finally { db.release(); }
}

async function executeAugustGoldieRecovery({confirmation}={}) {
  if(confirmation!==EXEC_CONFIRMATION){const e=new Error(`Execution requires confirmation value: ${EXEC_CONFIRMATION}`);e.code='CONFIRMATION_REQUIRED';throw e;}
  const db=await pool.connect();
  const result={createdClients:0,createdAppointments:0,linkedExistingAppointments:0,createdPersonalBlocks:0,appointmentIds:[]};
  try{
    await db.query('BEGIN');
    const staged=await db.query(`SELECT id,external_id,reconciliation_status,shiloh_entity_id,source_payload FROM external_records WHERE source='goldie' AND entity_type='appointment' AND import_batch_id='2' AND id=ANY($1::bigint[]) ORDER BY id FOR UPDATE`,[[...TARGET_APPOINTMENT_RECORD_IDS]]);
    if(staged.rowCount!==TARGET_APPOINTMENT_RECORD_IDS.size) throw new Error(`Expected ${TARGET_APPOINTMENT_RECORD_IDS.size} audited August Goldie rows, found ${staged.rowCount}`);
    const location=await db.query(`SELECT id FROM locations WHERE status='active' ORDER BY id LIMIT 1`);const locationId=location.rows[0]?.id||null;
    const clientCache=new Map();
    for(const rec of staged.rows){
      const id=String(rec.id);
      if(rec.shiloh_entity_id){continue;}
      if(id===GWENDIE_RECORD_ID){await linkGwendieDuplicate(db,rec);result.linkedExistingAppointments++;continue;}
      if(id===PERSONAL_RECORD_ID){await promotePersonalBlock(db,rec,locationId);result.createdPersonalBlocks++;continue;}
      if(!REAL_BOOKING_RECORD_IDS.has(id)) throw new Error(`Unexpected August recovery row ${id}`);
      const externalClientId=CLIENT_RECORD_BY_APPOINTMENT.get(id);if(!externalClientId)throw new Error(`No audited client mapping for August recovery row ${id}`);
      let clientRecovery=clientCache.get(externalClientId);if(!clientRecovery){clientRecovery=await getOrCreateRecoveryClient(db,externalClientId);clientCache.set(externalClientId,clientRecovery);if(clientRecovery.created)result.createdClients++;}
      const appt=await createRecoveredAppointment(db,rec,clientRecovery.clientId,locationId);if(appt.created)result.createdAppointments++;result.appointmentIds.push(appt.appointmentId);
    }
    await db.query('COMMIT');
  }catch(error){try{await db.query('ROLLBACK');}catch(_){}throw error;}finally{db.release();}
  const calendar=await syncAugustAppointmentsToGoogleCalendar();
  logger.info({augustGoldieRecovery:{...result,calendar:calendar.summary}},'August Goldie recovery completed');
  return {...result,calendar};
}

module.exports={executeAugustGoldieRecovery,syncAugustAppointmentsToGoogleCalendar,EXEC_CONFIRMATION,TARGET_APPOINTMENT_RECORD_IDS,REAL_BOOKING_RECORD_IDS};
