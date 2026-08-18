const test=require('node:test');
const assert=require('node:assert/strict');
const axios=require('axios');
const {CONTRACTS,compareContract,fetchAllTemplates,inspectMetaTemplateInventory,assertTemplateSendAllowed,resetTemplateInventoryCache}=require('../src/services/metaTemplateContracts');
const originalGet=axios.get;
const env={...process.env};
test.afterEach(()=>{axios.get=originalGet;process.env={...env};resetTemplateInventoryCache();});

test('complete registry contains all 15 exact expected/current/legacy identities',()=>{
 assert.equal(CONTRACTS.length,15); assert.equal(new Set(CONTRACTS.map(x=>x.contract.name)).size,15);
 assert.equal(CONTRACTS.find(x=>x.key==='birthday_v2').contract.name,'shiloh_birthday_wish_v2');
 assert.equal(CONTRACTS.find(x=>x.key==='birthday_v1').sendable,false);
});
test('contract comparison detects copy, variable, button, and ordering drift',()=>{
 const entry=CONTRACTS.find(x=>x.key==='booking_approval_request');
 const exact={...entry.contract,components:structuredClone(entry.contract.components)};
 assert.equal(compareContract(entry,exact).exact,true);
 exact.components[1].buttons.reverse(); assert.equal(compareContract(entry,exact).components,false);
 exact.components=structuredClone(entry.contract.components);exact.components[0].text=exact.components[0].text.replace('{{5}}','{{6}}');
 assert.equal(compareContract(entry,exact).exact,false);
});
test('provider inventory follows pagination and never returns account/provider ids',async()=>{
 process.env.WHATSAPP_BUSINESS_ACCOUNT_ID='secret-waba';process.env.WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE='shiloh_booking_confirmation_v1';
 const entry=CONTRACTS.find(x=>x.key==='booking_confirmation');let calls=0;
 axios.get=async url=>{calls++;return {data:calls===1?{data:[],paging:{next:'https://next.invalid/page'}}:{data:[{id:'provider-id',status:'APPROVED',quality_score:{score:'GREEN'},...entry.contract}]}}};
 const report=await inspectMetaTemplateInventory();assert.equal(calls,2);const state=report.templates.find(x=>x.key==='booking_confirmation');assert.equal(state.ready,true);assert.equal(JSON.stringify(report).includes('secret-waba'),false);assert.equal(JSON.stringify(report).includes('provider-id'),false);
});
test('send gate rejects arbitrary names, disabled booking update and legacy identities',async()=>{
 await assert.rejects(()=>assertTemplateSendAllowed('arbitrary_env_name'),/not an approved Shiloh/);
 await assert.rejects(()=>assertTemplateSendAllowed('appointment_followup'),/not an approved Shiloh/);
 process.env.WHATSAPP_BOOKING_UPDATE_TEMPLATE='shiloh_booking_update_v1';
 await assert.rejects(()=>assertTemplateSendAllowed('shiloh_booking_update_v1'),/gate is disabled/);
});
test('fetchAllTemplates requests every provider page',async()=>{let n=0;axios.get=async()=>({data:n++?{data:[{name:'b'}]}:{data:[{name:'a'}],paging:{next:'next'}}});assert.deepEqual((await fetchAllTemplates('x')).map(x=>x.name),['a','b']);});
