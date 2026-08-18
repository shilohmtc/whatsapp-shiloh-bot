const axios = require('axios');
const { discoverWabaId } = require('./birthdayTemplateProvisioning');
const { buildBirthdayTemplateDefinition } = require('./birthdayTemplateProvisioning');
const { buildStaffFinalizationTemplateDefinition, buildStaffFinalizationActionTemplateDefinition } = require('./staffFinalizationTemplateProvisioning');
const { buildBookingConfirmationTemplateDefinition } = require('./bookingConfirmationTemplateProvisioning');
const { buildReminderActionTemplateDefinition } = require('./reminderActionTemplateProvisioning');
const { buildDefinition } = require('./clientLifecycleTemplateProvisioning');

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
  ['staff_finalization','WHATSAPP_STAFF_FINALIZATION_TEMPLATE',buildStaffFinalizationTemplateDefinition(),true,true],
  ['birthday_v2','WHATSAPP_BIRTHDAY_TEMPLATE',buildBirthdayTemplateDefinition(),true],
  ['birthday_v1',null,{name:'shiloh_birthday_wish_v1',language:'en',category:'MARKETING',components:null},false],
  ['appointment_followup_legacy','WHATSAPP_FOLLOWUP_TEMPLATE',{name:'appointment_followup',language:'en',category:'UTILITY',components:null},false],
  ['appointment_reminder_legacy','WHATSAPP_REMINDER_TEMPLATE',{name:'appointment_reminder',language:'en',category:'UTILITY',components:null},false],
].map(([key,env,contract,sendable,defaultWhenUnset=false]) => Object.freeze({key,env,contract,sendable,defaultWhenUnset})));

function semanticButton(button = {}) {
  const normalized = { type: String(button.type || '').toUpperCase(), text: button.text ?? null };
  if (button.url != null) normalized.url = button.url;
  if (button.phone_number != null) normalized.phone_number = button.phone_number;
  return normalized;
}
function semanticComponents(components = []) {
  return (Array.isArray(components) ? components : []).map((component) => {
    const normalized = { type: String(component.type || '').toUpperCase() };
    if (component.format != null) normalized.format = String(component.format).toUpperCase();
    if (component.text != null) normalized.text = component.text;
    if (Array.isArray(component.buttons)) normalized.buttons = component.buttons.map(semanticButton);
    return normalized;
  });
}
function componentsMatch(expected, actual) {
  if (!Array.isArray(expected)) return false;
  return JSON.stringify(semanticComponents(expected)) === JSON.stringify(semanticComponents(actual));
}
function compareContract(entry, provider) {
  const expected=entry.contract;
  const checks={name:provider?.name===expected.name,language:provider?.language===expected.language,category:String(provider?.category||'').toUpperCase()===expected.category,components:componentsMatch(expected.components,provider?.components)};
  checks.exact=Object.values(checks).every(Boolean);
  return checks;
}
function selectProviderVariant(providers, entry) {
  const variants=providers.filter(provider=>provider?.name===entry.contract.name&&provider?.language===entry.contract.language);
  variants.sort((a,b)=>String(a.id||'').localeCompare(String(b.id||'')));
  return { provider: variants[0] || null, duplicateCount: Math.max(variants.length-1,0) };
}
async function fetchAllTemplates(wabaId) {
  let url=`https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/message_templates`;
  const templates=[]; let params={fields:'id,name,status,category,language,quality_score,components',limit:100};
  do { const response=await axios.get(url,{headers:{Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`},timeout:15000,params}); templates.push(...(response.data?.data||[])); url=response.data?.paging?.next||null; params=undefined; } while(url);
  return templates;
}
function configuredTemplateName(entry, environment = process.env) {
  if (!entry.env) return entry.contract.name;
  const override = environment[entry.env];
  if (override == null || String(override).trim() === '') return entry.defaultWhenUnset ? entry.contract.name : null;
  return String(override).trim();
}
async function inspectMetaTemplateInventory() {
  const wabaId=await discoverWabaId();
  if(!wabaId)return {ok:false,reason:'waba_not_discovered',templates:[]};
  const providers=await fetchAllTemplates(wabaId);
  return {ok:true,templates:CONTRACTS.map(entry=>{const {provider,duplicateCount}=selectProviderVariant(providers,entry);const configuredName=configuredTemplateName(entry);const contract=provider?compareContract(entry,provider):null;return {key:entry.key,expectedName:entry.contract.name,configuredName,defined:true,configured:configuredName===entry.contract.name,provider:{exists:Boolean(provider),status:provider?.status||null,quality:provider?.quality_score?.score||provider?.quality_score||null,category:provider?.category||null,language:provider?.language||null,duplicateCount},contract,sendable:entry.sendable,ready:Boolean(entry.sendable&&configuredName===entry.contract.name&&duplicateCount===0&&provider?.status==='APPROVED'&&contract?.exact)};})};
}
let cache=null, cachedAt=0;
async function assertTemplateSendAllowed(name,language='en') {
  const entry=CONTRACTS.find(x=>x.contract.name===name);
  if(!entry||!entry.sendable)throw new Error(`WhatsApp template is not an approved Shiloh send contract: ${name}`);
  if(language!==entry.contract.language)throw new Error(`WhatsApp template language does not match contract: ${name}`);
  if(configuredTemplateName(entry)!==entry.contract.name)throw new Error(`WhatsApp template configuration does not match contract: ${entry.env}`);
  if(entry.key==='booking_update'&&process.env.WHATSAPP_BOOKING_UPDATE_ENABLED!=='true')throw new Error('Booking-update delivery gate is disabled');
  if(!cache||Date.now()-cachedAt>60000){cache=await inspectMetaTemplateInventory();cachedAt=Date.now();}
  const state=cache.templates?.find(x=>x.key===entry.key);
  if(!state?.ready)throw new Error(`WhatsApp template is not exact, approved and configured: ${name}`);
  return state;
}
function resetTemplateInventoryCache(){cache=null;cachedAt=0;}
module.exports={CONTRACTS,configuredTemplateName,semanticComponents,compareContract,selectProviderVariant,fetchAllTemplates,inspectMetaTemplateInventory,assertTemplateSendAllowed,resetTemplateInventoryCache};
