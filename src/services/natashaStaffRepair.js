const { pool } = require('../db/pool');
const logger = require('../lib/logger');

async function repairNatashaStaffAssignment(){
 if(process.env.RUN_NATASHA_STAFF_REPAIR!=='true') return {status:'disabled'};
 const db=await pool.connect();
 try{
  await db.query('BEGIN');
  const a=await db.query(`SELECT id,starts_at,ends_at,source_client_name FROM appointments WHERE id=369 AND starts_at='2026-09-02T09:00:00+02:00' AND lower(coalesce(source_client_name,'')) LIKE '%natasha%' FOR UPDATE`);
  if(a.rowCount!==1) throw new Error('Natasha appointment #369 guard did not match exactly one appointment');
  const s=await db.query(`SELECT id,display_name FROM staff WHERE lower(trim(display_name))='christel' AND status='active'`);
  if(s.rowCount!==1) throw new Error('Christel staff guard did not match exactly one active staff record');
  const staff=s.rows[0];
  const current=await db.query(`SELECT id,staff_id,staff_name_snapshot FROM appointment_staff WHERE appointment_id=369 ORDER BY position FOR UPDATE`);
  if(current.rowCount!==1) throw new Error(`Expected exactly one current staff assignment for appointment #369; found ${current.rowCount}`);
  await db.query(`UPDATE appointment_staff SET staff_id=$1,staff_name_snapshot=$2,position=1 WHERE id=$3`,[staff.id,staff.display_name,current.rows[0].id]);
  await db.query(`INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,reason) SELECT id,status,status,'system:natasha_staff_repair','Corrected migrated Goldie practitioner from SHILOH MTC to Christel per owner/admin confirmation' FROM appointments WHERE id=369`);
  await db.query('COMMIT');
  const result={status:'repaired',appointmentId:369,staffId:staff.id,staffName:staff.display_name,previousStaff:current.rows[0].staff_name_snapshot};
  logger.info(result,'Natasha practitioner assignment repaired');
  return result;
 }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}
module.exports={repairNatashaStaffAssignment};
