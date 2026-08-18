const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { compactListTitle, fullLabelDescription } = require('../presentation/whatsappListRowPresentation');

const sessions = new Map();
const PAGE_SIZE = 8;
function key(sender){return normalizePhone(sender);}
function norm(v=''){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');}
function canManagePricing(admin){return admin?.permissions?.['service:pricing']===true;}
function adminName(admin){return norm(admin?.display_name);}
function isJeanPierreBusinessAdmin(admin){return adminName(admin)==='jean-pierre'&&admin?.business_role==='business_admin'&&admin?.calendar_scope==='all_business'&&admin?.service_scope==='all_services';}
function pricingOwner(admin){const name=adminName(admin);if(name.startsWith('christel')||isJeanPierreBusinessAdmin(admin))return'christel';if(name.startsWith('marietjie'))return'marietjie';return null;}
async function adminFor(sender){const r=await pool.query(`SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,[key(sender)]);return r.rows[0]||null;}
async function allowedServices(admin){const owner=pricingOwner(admin);if(!owner)return[];const practitionerNames=owner==='christel'?['christel','abigail']:['marietjie'];const r=await pool.query(`
 SELECT DISTINCT s.id,s.name,s.price,s.variable_price,sc.name category
 FROM services s
 LEFT JOIN service_categories sc ON sc.id=s.category_id
 WHERE s.status='active'
   AND EXISTS(
     SELECT 1 FROM staff_services ss
     JOIN staff st ON st.id=ss.staff_id
     WHERE ss.service_id=s.id
       AND st.status='active'
       AND LOWER(st.display_name)=ANY($1::text[])
   )
 ORDER BY s.name
 `,[practitionerNames]);return r.rows;}
function priceLabel(service){if(service.price==null)return'Not set';return service.variable_price?`From R${Number(service.price).toFixed(0)}`:`R${Number(service.price).toFixed(0)}`;}
function serviceList(services,offset=0){const slice=services.slice(offset,offset+PAGE_SIZE);const rows=slice.map(s=>({id:`pricing_service_${s.id}`,title:compactListTitle(s.name,'Service'),description:fullLabelDescription(s.name,`Current price: ${priceLabel(s)}`)}));if(offset+PAGE_SIZE<services.length)rows.push({id:`pricing_more_${offset+PAGE_SIZE}`,title:'More services',description:'Show more active services'});if(offset>0)rows.push({id:`pricing_more_${Math.max(0,offset-PAGE_SIZE)}`,title:'Previous services',description:'Go back one page'});return{type:'list',body:'*Services & pricing*\nChoose a service to view or update its price.',buttonText:'Choose service',rows,sectionTitle:'Active services'};}
function serviceActions(service){return{type:'button',body:`*${service.name}*\nCurrent price: *${priceLabel(service)}*\n\nChoose what you want to do.`,buttons:[{id:'pricing_change',title:'Change price'},{id:'pricing_back_services',title:'Back to services'}]};}
function confirmation(service,pending){const next=pending.price==null?'Not set':pending.variable?`From R${pending.price.toFixed(2)}`:`R${pending.price.toFixed(2)}`;return{type:'button',body:`*Confirm price change*\n\n${service.name}\nCurrent: *${priceLabel(service)}*\nNew: *${next}*\n\nNothing has changed yet.`,buttons:[{id:'pricing_confirm',title:'Confirm change'},{id:'pricing_keep',title:'Keep current'}]};}
function parsePrice(input){const n=norm(input);if(n==='unset')return{ok:true,price:null,variable:false};const m=n.match(/^(variable\s+)?r?\s*(\d+(?:\.\d{1,2})?)$/i);if(!m)return{ok:false};const price=Number(m[2]);if(!Number.isFinite(price)||price<0||price>100000)return{ok:false};return{ok:true,price,variable:!!m[1]};}

async function processAdminServicePricingMessage(sender,text){
 const admin=await adminFor(sender);if(!admin)return{handled:false};
 const raw=String(text||'').trim(),n=norm(raw),k=key(sender);let session=sessions.get(k);
 const start=['manage services & pricing','service pricing','manage pricing','pricing','my services & pricing','services & pricing'].includes(n);
 if(start){
   if(!canManagePricing(admin)||!pricingOwner(admin))return{handled:true,admin,reply:'Pricing changes are restricted to Christel/Jean-Pierre for the shared Christel/Abigail catalogue and Marietjie for her own services.'};
   const services=await allowedServices(admin);if(!services.length)return{handled:true,admin,reply:'No active services are available in your authorized pricing catalogue.'};
   sessions.set(k,{step:'service_list',services,offset:0});return{handled:true,admin,interactive:serviceList(services,0)};
 }
 if(!session)return{handled:false};
 if(!canManagePricing(admin)||!pricingOwner(admin)){sessions.delete(k);return{handled:true,admin,reply:'Your Shiloh role does not include pricing-write authority.'};}
 if(['0','back','cancel'].includes(n)){sessions.delete(k);return{handled:true,admin,reply:'Pricing update cancelled. Send *Menu* to return to Admin.'};}
 if(/^pricing_more_\d+$/.test(n)){const offset=Number(n.split('_').pop());session.offset=offset;sessions.set(k,session);return{handled:true,admin,interactive:serviceList(session.services,offset)};}
 if(/^pricing_service_\d+$/.test(n)){const id=Number(n.split('_').pop());const live=await allowedServices(admin);const service=live.find(s=>Number(s.id)===id);if(!service){sessions.delete(k);return{handled:true,admin,reply:'That service is no longer available in your authorized catalogue. No price was changed.'};}sessions.set(k,{step:'service_selected',services:live,offset:session.offset||0,service});return{handled:true,admin,interactive:serviceActions(service)};}
 if(n==='pricing_back_services'){const services=await allowedServices(admin);sessions.set(k,{step:'service_list',services,offset:session.offset||0});return{handled:true,admin,interactive:serviceList(services,session.offset||0)};}
 if(n==='pricing_change'&&session.service){sessions.set(k,{...session,step:'price_entry'});return{handled:true,admin,reply:`*${session.service.name}*\nCurrent price: *${priceLabel(session.service)}*\n\nSend the new amount, for example *650* or *R650*.\nFor a from-price, send *variable 650*.\nSend *unset* to remove the price.`};}
 if(session.step==='price_entry'){
   const parsed=parsePrice(raw);if(!parsed.ok)return{handled:true,admin,reply:'Please send a valid amount, e.g. *650*, *R650*, *variable 650*, or *unset*.'};
   sessions.set(k,{...session,step:'confirm',pending:parsed});return{handled:true,admin,interactive:confirmation(session.service,parsed)};
 }
 if(n==='pricing_keep'&&session.service){const services=await allowedServices(admin);sessions.set(k,{step:'service_list',services,offset:session.offset||0});return{handled:true,admin,interactive:serviceList(services,session.offset||0)};}
 if(n==='pricing_confirm'&&session.step==='confirm'&&session.service&&session.pending){
   const live=await allowedServices(admin);const service=live.find(s=>Number(s.id)===Number(session.service.id));if(!service){sessions.delete(k);return{handled:true,admin,reply:'That service is no longer available in your authorized catalogue. No price was changed.'};}
   const before=service.price==null?null:Number(service.price),pending=session.pending;
   await pool.query('BEGIN');
   try{
     const updated=await pool.query(`UPDATE services SET price=$1,variable_price=$2,updated_at=NOW() WHERE id=$3 AND status='active' RETURNING id`,[pending.price,pending.variable,service.id]);
     if(updated.rowCount!==1)throw new Error('service_update_failed');
     await pool.query(`INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata) VALUES($1,'service.price_updated','service',$2,$3::jsonb)`,[admin.id,String(service.id),JSON.stringify({service:service.name,pricingOwner:pricingOwner(admin),beforePrice:before,beforeVariable:!!service.variable_price,afterPrice:pending.price,afterVariable:pending.variable})]);
     await pool.query('COMMIT');
   }catch(error){await pool.query('ROLLBACK');sessions.delete(k);return{handled:true,admin,reply:'I could not save that price safely. No pricing change was committed.'};}
   sessions.delete(k);const display=pending.price==null?'not set':pending.variable?`from R${pending.price.toFixed(2)}`:`R${pending.price.toFixed(2)}`;return{handled:true,admin,reply:`✅ ${service.name} pricing updated to *${display}*. Existing confirmed bookings keep their booked price.`};
 }
 return{handled:true,admin,reply:'Choose one of the pricing options shown above, or send *Back* to exit.'};
}

module.exports={processAdminServicePricingMessage,allowedServices,pricingOwner,isJeanPierreBusinessAdmin,parsePrice,serviceList,serviceActions,confirmation};
