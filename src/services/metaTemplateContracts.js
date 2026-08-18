const axios = require('axios');
const { discoverWabaId } = require('./birthdayTemplateProvisioning');
const { buildBirthdayTemplateDefinition } = require('./birthdayTemplateProvisioning');
const { buildStaffFinalizationTemplateDefinition, buildStaffFinalizationActionTemplateDefinition } = require('./staffFinalizationTemplateProvisioning');
const { buildBookingConfirmationTemplateDefinition } = require('./bookingConfirmationTemplateProvisioning');
const { buildReminderActionTemplateDefinition } = require('./reminderActionTemplateProvisioning');
const { DEFINITIONS, buildDefinition } = require('./clientLifecycleTemplateProvisioning');

const GRAPH_VERSION = 'v23.0';
const definition = (key) => buildDefinition(key);
const CONTRACTS = Object.freeze([
  ['booking_update','WHATSAPP_BOOKING_UPDATE_TEMPLATE',definition('booking_update'),true],
  ['staff_finalization_actions',null,buildStaffFinalizationActionTemplateDefinition(),true],
  ['appointment_followup_v2','WHATSAPP_FOLLOWUP_ACTIONS_TEMPLATE',definition('appointment_followup_actions'),true],
  ['booking_approval_outcome','WHATSAPP_BOOKING_APPROVAL_OUTCOME_TEMPLATE',definition('booking_approval_outcome'),true],
  ['booking_declined','WHATSAPP_BOOKING_DECLINED_TEMPLATE',definition('booking_declined'),true],
  ['booking_approval_request','WHATSAPP_BOOKING_APPROVAL_REQUEST_TEMPLATE',definition('booking_approval_request'),true],
  ['cancellation_confirmation','WHATSAPP_CANCELLATION_CONFIRMATION_TEMPLATE',definition('cancellation_confirmation'),true],
  ['reschedule_confirmation','WHATSAPP_RESCHEDULE_CONFIRMATION_TEMPLATE',definition('reschedule_confirmation'),true],
  ['appointment_reminder_actions','WHATSAPP_REMINDER_ACTIONS_TEMPLATE',buildReminderActionTemplateDefinition(),true],
  ['booking_confirmation','WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE',buildBookingConfirmationTemplateDefinition(),true],
  ['staff_finalization',null,buildStaffFinalizationTemplateDefinition(),true],
  ['birthday_v2','WHATSAPP_BIRTHDAY_TEMPLATE',buildBirthdayTemplateDefinition(),true],
  ['birthday_v1',null,{name:'shiloh_birthday_wish_v1',language:'en',category:'MARKETING',components:null},false],
  ['appointment_followup_legacy','WHATSAPP_FOLLOWUP_TEMPLATE',{name:'appointment_followup',language:'en',category:'UTILITY',components:null},false],
  ['appointment_reminder_legacy','WHATSAPP_REMINDER_TEMPLATE',{name:'appointment_reminder',language:'en',category:'UTILITY',components:null},false],
].map(([key,env,contract,sendable]) => Object.freeze({key,env,contract,sendable})));

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).filter(k => !['example'].includes(k)).sort().map(k => [k,canonical(value[k])]));
}
function componentsMatch(expected, actual) {
  if (!Array.isArray(expected)) return false;
  return JSON.stringify(canonical(expected)) === JSON.stringify(canonical(actual || []));
}
function compareContract(entry, provider) {
  const expected=entry.contract;
  const checks={name:provider?.name===expected.name,language:provider?.language===expected.language,category:provider?.category===expected.category,components:componentsMatch(expected.components,provider?.components)};
  checks.exact=Object.values(checks).every(Boolean);
  return checks;
}
async function fetchAllTemplates(wabaId) {
  let url=`https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/message_templates`;
  const templates=[]; let params={fields:'id,name,status,category,language,quality_score,components',limit:100};
  do { const response=await axios.get(url,{headers:{Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`},timeout:15000,params}); templates.push(...(response.data?.data||[])); url=response.data?.paging?.next||null; params=undefined; } while(url);
  return templates;
}
async function inspectMetaTemplateInventory() {
  const wabaId=await discoverWabaId();
  if(!wabaId)return {ok:false,reason:'waba_not_discovered',templates:[]};
  const providers=await fetchAllTemplates(wabaId);
  return {ok:true,templates:CONTRACTS.map(entry=>{const provider=providers.find(p=>p?.name===entry.contract.name)||null;const configuredName=entry.env?process.env[entry.env]||null:entry.contract.name;const contract=provider?compareContract(entry,provider):null;return {key:entry.key,expectedName:entry.contract.name,configuredName,defined:true,configured:configuredName===entry.contract.name,provider:{exists:Boolean(provider),status:provider?.status||null,quality:provider?.quality_score?.score||provider?.quality_score||null,category:provider?.category||null,language:provider?.language||null},contract,sendable:entry.sendable,ready:Boolean(entry.sendable&&configuredName===entry.contract.name&&provider?.status==='APPROVED'&&contract?.exact)};})};
}
let cache=null, cachedAt=0;
async function assertTemplateSendAllowed(name,language='en') {
  const entry=CONTRACTS.find(x=>x.contract.name===name);
  if(!entry||!entry.sendable)throw new Error(`WhatsApp template is not an approved Shiloh send contract: ${name}`);
  if(language!==entry.contract.language)throw new Error(`WhatsApp template language does not match contract: ${name}`);
  if(entry.env&&process.env[entry.env]!==entry.contract.name)throw new Error(`WhatsApp template configuration does not match contract: ${entry.env}`);
  if(entry.key==='booking_update'&&process.env.WHATSAPP_BOOKING_UPDATE_ENABLED!=='true')throw new Error('Booking-update delivery gate is disabled');
  if(!cache||Date.now()-cachedAt>60000){cache=await inspectMetaTemplateInventory();cachedAt=Date.now();}
  const state=cache.templates?.find(x=>x.key===entry.key);
  if(!state?.ready)throw new Error(`WhatsApp template is not exact, approved and configured: ${name}`);
  return state;
}
function resetTemplateInventoryCache(){cache=null;cachedAt=0;}
module.exports={CONTRACTS,compareContract,fetchAllTemplates,inspectMetaTemplateInventory,assertTemplateSendAllowed,resetTemplateInventoryCache};
