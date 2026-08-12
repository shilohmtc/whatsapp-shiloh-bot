const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ensureDemoClientPermissions } = require('../src/services/demoClientAccessBootstrap');

const appSource = fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');

test('bootstrap grants only the three exact named role combinations and revokes stray permission copies',async()=>{
  const sql=[];
  const fakeDb={
    async query(text){sql.push(text);return{rowCount:sql.length===1?3:0};}
  };
  const result=await ensureDemoClientPermissions(fakeDb);
  assert.deepEqual(result,{granted:3,revoked:0});
  assert.equal(sql.length,2);
  for(const name of ['christel','abigail','marietjie']) assert.match(sql[0],new RegExp(`LOWER\\(display_name\\) = '${name}'`));
  assert.match(sql[0],/business_role = 'owner'/);
  assert.match(sql[0],/business_role = 'employee_practitioner'/);
  assert.match(sql[0],/business_role = 'tenant_practitioner'/);
  assert.doesNotMatch(sql[0],/jean-pierre/);
  assert.match(sql[1],/permissions \? 'demo:client'/);
  assert.match(sql[1],/- 'demo:client'/);
});

test('new production instance verifies demo access before opening the HTTP listener',()=>{
  const bootstrap=appSource.indexOf('await ensureDemoClientPermissions()');
  const listen=appSource.indexOf('server = app.listen');
  assert.ok(bootstrap>=0 && listen>=0 && bootstrap<listen);
  assert.match(appSource,/Controlled demo client access verified/);
  assert.match(appSource,/Shiloh failed during startup/);
});
