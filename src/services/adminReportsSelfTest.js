const { pool } = require('../db/pool');
const { reportData, render } = require('./adminReports');

function assert(condition,message){ if(!condition) throw new Error(message); }

async function loadAdmin(role){
  const r=await pool.query(`SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope FROM staff_admin_accounts WHERE business_role=$1 AND active=TRUE ORDER BY id LIMIT 1`,[role]);
  return r.rows[0]||null;
}

async function verifyPractitionerScope(admin,data){
  const ids=data.appointments.map(a=>Number(a.id)).filter(Number.isFinite);
  let crossStaffLeakCount=0;
  if(ids.length){
    const r=await pool.query(`SELECT COUNT(*)::int leak_count FROM appointments a WHERE a.id=ANY($1::bigint[]) AND NOT EXISTS (SELECT 1 FROM appointment_staff ast WHERE ast.appointment_id=a.id AND ast.staff_id=$2)`,[ids,admin.staff_id]);
    crossStaffLeakCount=r.rows[0]?.leak_count||0;
  }
  const names=data.services.map(s=>String(s.service||'')).filter(Boolean);
  let crossServiceLeakCount=0;
  if(names.length){
    const r=await pool.query(`SELECT COUNT(*)::int leak_count FROM unnest($1::text[]) AS requested(name) WHERE NOT EXISTS (SELECT 1 FROM services s JOIN staff_services ss ON ss.service_id=s.id AND ss.staff_id=$2 WHERE s.name=requested.name)`,[names,admin.staff_id]);
    crossServiceLeakCount=r.rows[0]?.leak_count||0;
  }
  return {appointmentCount:ids.length,crossStaffLeakCount,crossServiceLeakCount};
}

async function runAdminReportsSelfTest(){
  const owner=await loadAdmin('owner');
  const businessAdmin=await loadAdmin('business_admin');
  const tenant=await loadAdmin('tenant_practitioner');
  const employee=await loadAdmin('employee_practitioner');
  assert(owner,'No active owner admin found');
  assert(businessAdmin,'No active business_admin found');
  assert(tenant,'No active tenant_practitioner found');
  assert(employee,'No active employee_practitioner found');
  assert(owner.calendar_scope==='all_business' || owner.service_scope==='all_services','Owner is not business-wide');
  assert(businessAdmin.calendar_scope==='all_business' || businessAdmin.service_scope==='all_services','Business admin is not business-wide');
  assert(tenant.staff_id,'Tenant practitioner has no staff_id');
  assert(employee.staff_id,'Employee practitioner has no staff_id');

  const ownerData=await reportData(owner);
  const businessData=await reportData(businessAdmin);
  const tenantData=await reportData(tenant);
  const employeeData=await reportData(employee);
  const tenantScope=await verifyPractitionerScope(tenant,tenantData);
  const employeeScope=await verifyPractitionerScope(employee,employeeData);
  assert(tenantScope.crossStaffLeakCount===0,'Tenant report leaked appointments not assigned to tenant staff_id');
  assert(employeeScope.crossStaffLeakCount===0,'Employee report leaked appointments not assigned to employee staff_id');
  assert(tenantScope.crossServiceLeakCount===0,'Tenant report leaked services outside tenant staff service scope');
  assert(employeeScope.crossServiceLeakCount===0,'Employee report leaked services outside employee staff service scope');
  assert(Array.isArray(ownerData.staff),'Owner report missing clinic staff breakdown');
  assert(Array.isArray(businessData.staff),'Business-admin report missing clinic staff breakdown');
  assert(tenantData.staff.length===0,'Tenant report exposed all-staff breakdown');
  assert(employeeData.staff.length===0,'Employee report exposed all-staff breakdown');
  assert(/Clinic booked value:/i.test(render(owner,ownerData)) || ownerData.appointments.length===0,'Owner report does not expose clinic booked value when data exists');
  assert(!/booked value:/i.test(render(tenant,tenantData)),'Tenant report exposed revenue/value');
  assert(!/booked value:/i.test(render(employee,employeeData)),'Employee report exposed revenue/value');

  return {ok:true,readOnly:true,assertions:{ownerBusinessWide:true,businessAdminBusinessWide:true,tenantSelfScoped:true,employeeSelfScoped:true,noTenantCrossStaffLeak:true,noEmployeeCrossStaffLeak:true,noTenantCrossServiceLeak:true,noEmployeeCrossServiceLeak:true,noPractitionerStaffBreakdown:true,noPractitionerRevenueExposure:true},counts:{ownerAppointments:ownerData.appointments.length,businessAdminAppointments:businessData.appointments.length,tenantAppointments:tenantData.appointments.length,employeeAppointments:employeeData.appointments.length}};
}

module.exports={runAdminReportsSelfTest};
