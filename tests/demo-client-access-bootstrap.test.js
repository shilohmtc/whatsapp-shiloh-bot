const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ensureDemoClientPermissions } = require('../src/services/demoClientAccessBootstrap');

const appSource = fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');

test('production bootstrap revokes Demo Client permission from all active admin accounts',async()=>{
  const sql=[];
  const fakeDb={ async query(text){sql.push(text);return{rowCount:3};} };
  const result=await ensureDemoClientPermissions(fakeDb);
  assert.deepEqual(result,{granted:0,revoked:3,productionUiEnabled:false});
  assert.equal(sql.length,1);
  assert.match(sql[0],/permissions \? 'demo:client'/);
  assert.match(sql[0],/- 'demo:client'/);
  assert.doesNotMatch(sql[0],/\|\| '\{"demo:client":true\}'/);
});

test('ordinary production startup does not repair Demo Client permissions',()=>{
  const authority=appSource.indexOf('await verifyMigrationState()');
  const listen=appSource.indexOf('server = app.listen');
  assert.ok(authority>=0 && listen>authority);
  assert.doesNotMatch(appSource,/ensureDemoClientPermissions/);
  assert.match(appSource,/startMandatoryDemoCleanupScheduler\(\)/);
  assert.match(appSource,/Shiloh failed during startup/);
});
