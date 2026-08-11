const { pool } = require('../db/pool');
const { reportData } = require('./adminReports');

function assert(condition,message){ if(!condition) throw new Error(message); }

async function loadAdmin(role){
  const r=await pool.query(`SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope FROM staff_admin_accounts WHERE business_role=$1 AND active=TRUE ORDER BY id LIMIT 1`,[role]);
  return r.rows[0]||null;
}

async function verifyPractitionerScope(admin,data){
  const ids=data.appointments.map(a=>Number(a.id)).filter(Number.isFinite);
  if(!ids.length) return {appointmentCount:0,crossStaffLeakCount:0};
  const r=await pool.query(`SELECT COUNT(*)::int leak_count FROM appointments a WHERE a.id=ANY($1::bigint[]) AND NOT EXISTS (SELECT 1 FROM appointment_staff ast WHERE ast.appointment_id=a.id AND ast.staff_id=$2)`,[ids,admin.staff_id]);
  return {appointmentCount:ids.length,crossStaffLeakCount:r.rows[0]?.leak_count||0};
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
  assert(Array.isArray(ownerData.staff),'Owner report missing clinic staff breakdown');
  assert(Array.isArray(businessData.staff),'Business-admin report missing clinic staff breakdown');
  assert(tenantData.staff.length===0,'Tenant report exposed all-staff breakdown');
  assert(employeeData.staff.length===0,'Employee report exposed all-staff breakdown');

  return {ok:true,readOnly:true,assertions:{ownerBusinessWide:true,businessAdminBusinessWide:true,tenantSelfScoped:true,employeeSelfScoped:true,noTenantCrossStaffLeak:true,noEmployeeCrossStaffLeak:true,noPractitionerStaffBreakdown:true},counts:{ownerAppointments:ownerData.appointments.length,businessAdminAppointments:businessData.appointments.length,tenantAppointments:tenantData.appointments.length,employeeAppointments:employeeData.appointments.length}};
}

module.exports={runAdminReportsSelfTest};
