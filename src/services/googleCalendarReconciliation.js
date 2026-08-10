const { pool } = require('../db/pool');
const { findBookingEventByAppointmentId, createBookingEvent } = require('./googleBookingCalendar');
const logger = require('../lib/logger');

async function reconcileFutureAppointmentsToGoogleCalendar({mode='dry-run'}={}) {
 const commit=mode==='commit';
 const db=await pool.connect();
 const summary={mode,appointments:0,alreadyTracked:0,foundInGoogle:0,createdEvents:0,missingStaff:0,skippedCancelled:0,errors:0};
 const issues=[];
 try {
  const r=await db.query(`
   SELECT a.id,a.starts_at,a.ends_at,a.status,a.source,a.source_client_name,c.display_name AS client_name,l.name AS location_name,
          string_agg(DISTINCT s.name,' + ' ORDER BY s.name) AS service_name,
          string_agg(DISTINCT ast.staff_name_snapshot,' + ' ORDER BY ast.staff_name_snapshot) AS staff_name,
          ace.event_id AS tracked_event_id
     FROM appointments a
     LEFT JOIN clients c ON c.id=a.client_id
     LEFT JOIN locations l ON l.id=a.location_id
     LEFT JOIN appointment_services aps ON aps.appointment_id=a.id
     LEFT JOIN services s ON s.id=aps.service_id
     LEFT JOIN appointment_staff ast ON ast.appointment_id=a.id
     LEFT JOIN appointment_calendar_events ace ON ace.appointment_id=a.id AND ace.provider='google_calendar' AND ace.sync_status='synced'
    WHERE a.starts_at>=NOW() AND a.status<>'cancelled'
    GROUP BY a.id,c.display_name,l.name,ace.event_id
    ORDER BY a.starts_at,a.id
  `);
  summary.appointments=r.rowCount;
  for(const a of r.rows){
   if(a.tracked_event_id){summary.alreadyTracked++;continue;}
   if(!a.staff_name){summary.missingStaff++;issues.push({appointmentId:a.id,type:'missing_staff'});continue;}
   try{
    const found=await findBookingEventByAppointmentId(a.id);
    if(found){summary.foundInGoogle++;if(commit)await db.query(`INSERT INTO appointment_calendar_events(appointment_id,provider,calendar_id,event_id,sync_status,updated_at) VALUES($1,'google_calendar',$2,$3,'synced',NOW()) ON CONFLICT(appointment_id,provider) DO UPDATE SET event_id=EXCLUDED.event_id,calendar_id=EXCLUDED.calendar_id,sync_status='synced',last_error=NULL,updated_at=NOW()`,[a.id,process.env.GOOGLE_BOOKING_CALENDAR_ID,found.id]);continue;}
    if(!commit){issues.push({appointmentId:a.id,type:'google_event_missing'});continue;}
    const ev=await createBookingEvent({appointmentId:a.id,clientName:a.client_name||a.source_client_name||'Client',serviceName:a.service_name||a.title||'Appointment',staffName:a.staff_name,locationName:a.location_name,startsAt:a.starts_at,endsAt:a.ends_at,source:a.source||'shiloh'});
    if(ev.enabled&&ev.event){await db.query(`INSERT INTO appointment_calendar_events(appointment_id,provider,calendar_id,event_id,sync_status,updated_at) VALUES($1,'google_calendar',$2,$3,'synced',NOW()) ON CONFLICT(appointment_id,provider) DO UPDATE SET event_id=EXCLUDED.event_id,calendar_id=EXCLUDED.calendar_id,sync_status='synced',last_error=NULL,updated_at=NOW()`,[a.id,process.env.GOOGLE_BOOKING_CALENDAR_ID,ev.event.id]);summary.createdEvents++;}
   }catch(e){summary.errors++;issues.push({appointmentId:a.id,type:'calendar_error',message:String(e.message||e).slice(0,160)});}
  }
  logger.info({summary,issues},`Google Calendar future reconciliation ${mode} completed`);return {summary,issues};
 }finally{db.release();}
}
async function runFromEnv(){if(process.env.RUN_GOOGLE_CALENDAR_RECONCILIATION!=='true')return {status:'disabled'};return reconcileFutureAppointmentsToGoogleCalendar({mode:process.env.GOOGLE_CALENDAR_RECONCILIATION_MODE==='commit'?'commit':'dry-run'});}
module.exports={reconcileFutureAppointmentsToGoogleCalendar,runFromEnv};
