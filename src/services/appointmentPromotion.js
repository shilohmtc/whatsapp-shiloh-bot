const { pool } = require('../db/pool');
const { parseGoldieDateTime } = require('./appointmentReconciliationPlan');

const EXEC_CONFIRMATION = 'EXECUTE_SAFE_GOLDIE_APPOINTMENTS';
function norm(v){return String(v||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');}
function splitList(v){return String(v||'').split(',').map(x=>x.trim()).filter(Boolean);}
function statusMap(v){const s=norm(v); if(['upcoming','scheduled'].includes(s)) return 'scheduled'; if(['confirmed'].includes(s)) return 'confirmed'; if(['completed','complete'].includes(s)) return 'completed'; if(['cancelled','canceled'].includes(s)) return 'cancelled'; if(['no show','no-show','noshow'].includes(s)) return 'no_show'; return 'unknown';}
function price(v){const n=Number(String(v||'').replace(/[^0-9.-]/g,'')); return Number.isFinite(n)?n:null;}

async function loadMaps(client, clientBatchId){
  const [clientLinks,services,staff]=await Promise.all([
    client.query(`SELECT ecr.display_name,er.shiloh_entity_id AS client_id FROM external_records er JOIN external_client_records ecr ON ecr.external_record_id=er.id WHERE er.import_batch_id=$1 AND er.source='goldie' AND er.entity_type='client' AND er.reconciliation_status='matched' AND er.shiloh_entity_id IS NOT NULL`,[clientBatchId]),
    client.query(`SELECT id,name,duration_minutes,price FROM services WHERE status='active'`),
    client.query(`SELECT id,display_name FROM staff WHERE status='active'`),
  ]);
  const cm=new Map(); for(const r of clientLinks.rows){const k=norm(r.display_name);if(!cm.has(k))cm.set(k,new Set());cm.get(k).add(String(r.client_id));}
  const sm=new Map(services.rows.map(r=>[norm(r.name),r])); const stm=new Map(staff.rows.map(r=>[norm(r.display_name),r]));
  return {cm,sm,stm};
}

async function executeSafeAppointmentPromotion({appointmentBatchId='2',clientBatchId='1',confirmation}={}){
  if(confirmation!==EXEC_CONFIRMATION){const e=new Error(`Execution requires confirmation value: ${EXEC_CONFIRMATION}`);e.code='CONFIRMATION_REQUIRED';throw e;}
  const db=await pool.connect();
  try{
    await db.query('BEGIN');
    const {cm,sm,stm}=await loadMaps(db,clientBatchId);
    const staged=await db.query(`SELECT id,external_id,source_payload FROM external_records WHERE import_batch_id=$1 AND source='goldie' AND entity_type='appointment' AND reconciliation_status='unmatched' ORDER BY id FOR UPDATE`,[appointmentBatchId]);
    let created=0,skipped=0; const skippedReasons=new Map();
    for(const rec of staged.rows){
      const p=rec.source_payload||{}; const reasons=[];
      if(norm(p.Type)!=='appointment') reasons.push('not_appointment_type');
      const start=parseGoldieDateTime(p.Date,p['Start Time']), end=parseGoldieDateTime(p.Date,p['End Time']); if(!(start&&end&&end>start)) reasons.push('invalid_time_range');
      const cn=splitList(p.Clients); let clientId=null; if(cn.length!==1) reasons.push(cn.length?'multiple_named_clients':'client_blank'); else {const ids=cm.get(norm(cn[0])); if(!ids||ids.size!==1) reasons.push(!ids||!ids.size?'client_unresolved':'client_ambiguous'); else clientId=[...ids][0];}
      const sn=splitList(p.Services); const svc=sn.map(n=>({name:n,row:sm.get(norm(n))||null})); if(!sn.length||svc.some(x=>!x.row)) reasons.push(!sn.length?'services_blank':'services_not_all_exact');
      const stn=splitList(p.Staff); const sta=stn.map(n=>({name:n,row:stm.get(norm(n.replace(/\s+\.$/,'')))||stm.get(norm(n))||null})); if(!stn.length||sta.some(x=>!x.row)) reasons.push(!stn.length?'staff_blank':'staff_not_all_exact');
      if(reasons.length){skipped++;for(const r of reasons)skippedReasons.set(r,(skippedReasons.get(r)||0)+1);continue;}
      const ins=await db.query(`INSERT INTO appointments (client_id,starts_at,ends_at,status,title,notes,total_price,currency,source,external_id,external_key,source_client_name,source_recurrence) VALUES ($1,$2,$3,$4,$5,$6,$7,'ZAR','goldie',$8,$8,$9,$10) ON CONFLICT (source,external_id) DO NOTHING RETURNING id`,[clientId,start.toISOString(),end.toISOString(),statusMap(p.Status),p.Title||null,p.Notes||null,price(p.Price),rec.external_id,p.Clients||null,p.Recurrence||null]);
      let appointmentId=ins.rows[0]?.id;
      if(!appointmentId){const existing=await db.query(`SELECT id FROM appointments WHERE source='goldie' AND external_id=$1`,[rec.external_id]);appointmentId=existing.rows[0]?.id;}
      if(!appointmentId){throw new Error(`Could not resolve appointment id for ${rec.external_id}`);}
      if(ins.rowCount){
        for(let i=0;i<svc.length;i++) await db.query(`INSERT INTO appointment_services (appointment_id,service_id,position,service_name_snapshot,price_snapshot,duration_minutes_snapshot) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (appointment_id,position) DO NOTHING`,[appointmentId,svc[i].row.id,i+1,svc[i].name,svc[i].row.price,svc[i].row.duration_minutes]);
        for(let i=0;i<sta.length;i++) await db.query(`INSERT INTO appointment_staff (appointment_id,staff_id,position,staff_name_snapshot) VALUES ($1,$2,$3,$4) ON CONFLICT (appointment_id,position) DO NOTHING`,[appointmentId,sta[i].row.id,i+1,sta[i].name]);
        await db.query(`INSERT INTO appointment_status_history (appointment_id,from_status,to_status,changed_by,reason) VALUES ($1,NULL,$2,'system:goldie_appointment_promotion','initial Goldie import')`,[appointmentId,statusMap(p.Status)]);
        created++;
      }
      await db.query(`UPDATE external_records SET shiloh_entity_type='appointment',shiloh_entity_id=$2,reconciliation_status='matched',match_method='safe_exact_appointment_promotion',match_confidence=1.0,reconciled_at=NOW(),updated_at=NOW() WHERE id=$1`,[rec.id,appointmentId]);
    }
    await db.query('COMMIT');
    return {mode:'execute',writesPerformed:true,appointmentBatchId:String(appointmentBatchId),created,skipped,skippedReasons:[...skippedReasons.entries()].sort((a,b)=>b[1]-a[1]).map(([reason,count])=>({reason,count}))};
  }catch(error){try{await db.query('ROLLBACK');}catch(_){}throw error;}finally{db.release();}
}

async function runConfiguredSafeAppointmentPromotion(logger=console){const confirmation=process.env.GOLDIE_APPOINTMENT_PROMOTION_CONFIRMATION;if(!confirmation)return {skipped:true,reason:'confirmation_not_configured'};const result=await executeSafeAppointmentPromotion({confirmation});logger.info({goldieAppointmentPromotion:result},'Goldie safe appointment promotion completed');return result;}
module.exports={executeSafeAppointmentPromotion,runConfiguredSafeAppointmentPromotion,EXEC_CONFIRMATION};
