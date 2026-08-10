const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

function normalize(text=''){return String(text||'').trim().toLowerCase().replace(/\s+/g,' ');}
function isRequest(text=''){const v=normalize(text);return ['staff services','services by staff','services per staff','all services per staff','practitioner services','who does what','my services'].includes(v);}
function has(admin,p){return admin?.permissions?.[p]===true;}
function businessWide(admin){return ['owner','business_admin'].includes(admin?.business_role)||admin?.service_scope==='all_services';}

async function processAdminStaffServicesMessage(sender,text){
  if(!isRequest(text)) return {handled:false};
  const a=await pool.query(`SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,[normalizePhone(sender)]);
  const admin=a.rows[0]||null;
  if(!admin) return {handled:false};
  if(!has(admin,'staff:services:view')&&!has(admin,'appointment:view')) return {handled:true,admin,reply:"You don't have permission to view practitioner services."};
  if(!businessWide(admin)&&!admin.staff_id) return {handled:true,admin,reply:'Your admin account is not linked to an active practitioner profile.'};

  const args=[];
  let scope='';
  if(!businessWide(admin)){args.push(admin.staff_id);scope=` AND st.id=$${args.length}`;}
  const r=await pool.query(`
    SELECT st.id, st.display_name, st.scheduling_type,
           COALESCE(json_agg(json_build_object('category',sc.name,'service',s.name,'price',s.price,'variable_price',s.variable_price) ORDER BY sc.name,s.name)
             FILTER (WHERE s.id IS NOT NULL),'[]'::json) AS services
      FROM staff st
      LEFT JOIN staff_services ss ON ss.staff_id=st.id
      LEFT JOIN services s ON s.id=ss.service_id AND s.status='active'
      LEFT JOIN service_categories sc ON sc.id=s.category_id
     WHERE st.status='active'
       AND (COALESCE(st.client_bookable,FALSE)=TRUE OR st.scheduling_type='freelance')
       ${scope}
     GROUP BY st.id,st.display_name,st.scheduling_type
     ORDER BY CASE WHEN st.scheduling_type='freelance' THEN 1 ELSE 0 END, st.display_name
  `,args);

  const lines=[businessWide(admin)?'*Services per staff member*':'*My Shiloh services*',''];
  for(const staff of r.rows){
    const suffix=staff.scheduling_type==='freelance'?' — internal overflow only':'';
    lines.push(`*${staff.display_name}${suffix}*`);
    const grouped=new Map();
    for(const item of staff.services||[]){if(!item?.service)continue;const category=item.category||'Other';if(!grouped.has(category))grouped.set(category,[]);grouped.get(category).push(item);}
    if(!grouped.size){lines.push('• No active services assigned','');continue;}
    for(const [category,services] of grouped){lines.push(`${category}:`);for(const item of services){let price='';if(item.price!=null)price=item.variable_price?` — from R${Number(item.price).toFixed(0)}`:` — R${Number(item.price).toFixed(0)}`;lines.push(`• ${item.service}${price}`);}}
    lines.push('');
  }
  if(businessWide(admin))lines.push('Freelancers are internal overflow only and are not available for direct client bookings.');
  else lines.push('This list is limited to services assigned to your practitioner profile.');
  return {handled:true,admin,reply:lines.join('\n').trim()};
}

module.exports={processAdminStaffServicesMessage,isRequest};