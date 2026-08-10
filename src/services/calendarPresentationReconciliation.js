const { pool } = require('../db/pool');
const { updateBookingEvent } = require('./googleBookingCalendar');
const logger = require('../lib/logger');

async function runCalendarPresentationReconciliation(){
 if(process.env.RUN_CRM6_CALENDAR_PRESENTATION_RECONCILIATION!=='true')return {status:'disabled'};
 const r=await pool.query(`SELECT a.id,a.starts_at,a.ends_at,COALESCE(c.display_name,a.source_client_name,'Client') client_name,l.name location_name,ace.event_id,string_agg(DISTINCT COALESCE(s.name,aps.service_name_snapshot),' + ' ORDER BY COALESCE(s.name,aps.service_name_snapshot)) service_name,string_agg(DISTINCT COALESCE(st.display_name,ast.staff_name_snapshot),' + ' ORDER BY COALESCE(st.display_name,ast.staff_name_snapshot)) staff_name FROM appointments a LEFT JOIN clients c ON c.id=a.client_id LEFT JOIN locations l ON l.id=a.location_id JOIN appointment_calendar_events ace ON ace.appointment_id=a.id AND ace.provider='google_calendar' AND ace.sync_status='synced' LEFT JOIN appointment_services aps ON aps.appointment_id=a.id LEFT JOIN services s ON s.id=aps.service_id LEFT JOIN appointment_staff ast ON ast.appointment_id=a.id LEFT JOIN staff st ON st.id=ast.staff_id WHERE a.starts_at>NOW() AND a.status<>'cancelled' GROUP BY a.id,c.display_name,l.name,ace.event_id ORDER BY a.starts_at`);
 let updated=0,errors=0;const failed=[];
 for(const a of r.rows){try{await updateBookingEvent({eventId:a.event_id,appointmentId:a.id,startsAt:a.starts_at,endsAt:a.ends_at,clientName:a.client_name,serviceName:a.service_name||'Booking',staffName:a.staff_name||null,locationName:a.location_name||null});updated++;}catch(error){errors++;failed.push({appointmentId:a.id,message:String(error.message||error).slice(0,120)});}}
 const result={status:errors?'partial':'ok',appointments:r.rowCount,updated,errors,failed};logger.info(result,'CRM-6 calendar presentation reconciliation completed');return result;
}
module.exports={runCalendarPresentationReconciliation};