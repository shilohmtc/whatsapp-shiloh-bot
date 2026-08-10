const { pool } = require('../db/pool');
const { getMenuOptions } = require('./adminMobileMenu');
const { bookingSummary } = require('./googleBookingCalendar');
const logger = require('../lib/logger');

async function runCrm6ProductionSmokeTest(){
 if(process.env.RUN_CRM6_SMOKE_TEST!=='true')return {status:'disabled'};
 const admins=await pool.query(`SELECT id,staff_id,display_name,role,permissions FROM staff_admin_accounts WHERE active=TRUE AND LOWER(display_name) IN ('christel','jean-pierre') ORDER BY display_name`);
 if(admins.rowCount!==2)throw new Error(`CRM-6 smoke test expected Christel and Jean-Pierre active admin accounts; found ${admins.rowCount}`);
 const menuChecks=admins.rows.map(admin=>{const keys=getMenuOptions(admin).map(x=>x.key);return{displayName:admin.display_name,manageBooking:keys.includes('manage_booking'),pricing:keys.includes('pricing'),staffId:admin.staff_id||null,role:admin.role};});
 for(const check of menuChecks){if(!check.manageBooking||!check.pricing)throw new Error(`CRM-6 menu permissions missing for ${check.displayName}: ${JSON.stringify(check)}`);}
 const future=await pool.query(`SELECT a.id,a.starts_at,a.ends_at,COALESCE(c.display_name,a.source_client_name,'Client') client_name,COUNT(DISTINCT ast.id)::int staff_count,COUNT(DISTINCT aps.id)::int service_count FROM appointments a LEFT JOIN clients c ON c.id=a.client_id LEFT JOIN appointment_staff ast ON ast.appointment_id=a.id LEFT JOIN appointment_services aps ON aps.appointment_id=a.id WHERE a.starts_at>NOW() AND a.status<>'cancelled' GROUP BY a.id,c.display_name ORDER BY a.starts_at LIMIT 1`);
 if(!future.rowCount)throw new Error('CRM-6 smoke test found no future appointment to validate read paths.');
 const sampleTitle=bookingSummary({clientName:'Test Client',serviceName:'Full Body Swedish',staffName:'Christel'});
 if(sampleTitle!=='💆 Full Body Swedish — Test Client — Christel')throw new Error(`Unexpected CRM-6 calendar title format: ${sampleTitle}`);
 const result={status:'ok',adminMenuChecks:menuChecks,futureAppointmentRead:{id:future.rows[0].id,staffCount:future.rows[0].staff_count,serviceCount:future.rows[0].service_count},sampleCalendarTitle:sampleTitle,mutations:0,customerMessages:0};
 logger.info(result,'CRM-6 production smoke test passed');return result;
}
module.exports={runCrm6ProductionSmokeTest};