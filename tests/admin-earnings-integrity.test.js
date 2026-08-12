const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const integrityPath=path.join(__dirname,'..','src','services','adminReportingIntegrity.js');
const abigailPath=path.join(__dirname,'..','src','services','adminReports.js');
const christelPath=path.join(__dirname,'..','src','services','adminChristelEarnings.js');
const integrity=fs.readFileSync(integrityPath,'utf8');
const abigail=fs.readFileSync(abigailPath,'utf8');
const christel=fs.readFileSync(christelPath,'utf8');
const { integrityLines }=require(integrityPath);

test('earnings integrity checks past canonical status gaps and latest staged Goldie exceptions',()=>{
  assert.match(integrity,/a\.status NOT IN \('completed','cancelled','no_show'\)/);
  assert.match(integrity,/metadata->>'entity_type'='appointment'/);
  assert.match(integrity,/reconciliation_status NOT IN \('matched','ignored'\)/);
  assert.match(integrity,/source_payload->>'Staff'/);
  assert.match(integrity,/source_payload->>'Services'/);
  assert.match(integrity,/<> 'personal'/);
});

test('integrity warning is explicit and never silently adds uncertain appointments to earnings',()=>{
  const lines=integrityLines({clean:false,pendingStatus:[{id:1}],unresolvedGoldie:[{id:2}],unresolvedGoldieValue:750});
  const text=lines.join('\n');
  assert.match(text,/PROVISIONAL/);
  assert.match(text,/may be understated/);
  assert.match(text,/will not silently count uncertain appointments/);
  assert.match(text,/Past CRM appointments awaiting final completion status: \*1\*/);
  assert.match(text,/Unresolved Goldie appointments in this period: \*1\*/);
});

test('Abigail and Christel earnings both attach the integrity result and audit it',()=>{
  assert.match(abigail,/earningsIntegrity\(\{staffId:abigail\.id,staffName:abigail\.display_name,period\}\)/);
  assert.match(abigail,/integrityClean:data\.integrity\.clean/);
  assert.match(abigail,/— provisional/);
  assert.match(christel,/earningsIntegrity\(\{ staffId:christel\.id, staffName:christel\.display_name, period \}\)/);
  assert.match(christel,/integrityClean: data\.integrity\.clean/);
  assert.match(christel,/— provisional/);
});

test('earnings calculation itself remains completed-only',()=>{
  assert.match(abigail,/a\.status='completed'/);
  assert.match(christel,/a\.status = 'completed'/);
  assert.doesNotMatch(integrity,/UPDATE appointments/);
  assert.doesNotMatch(integrity,/INSERT INTO appointments/);
});
