const { pool } = require('../db/pool');
const { parseGoldieDateTime } = require('./appointmentReconciliationPlan');

function norm(v){return String(v||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');}
function splitList(v){return String(v||'').split(',').map(x=>x.trim()).filter(Boolean);}
function money(v){const n=Number(String(v||'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:null;}

async function getHistoricalServiceEvidence({appointmentBatchId='2'}={}){
  const [rows,services]=await Promise.all([
    pool.query(`SELECT external_id,source_payload FROM external_records WHERE import_batch_id=$1 AND source='goldie' AND entity_type='appointment' AND reconciliation_status='unmatched' ORDER BY id`,[appointmentBatchId]),
    pool.query(`SELECT id,name,status,duration_minutes,price FROM services ORDER BY id`),
  ]);
  const known=new Set(services.rows.map(r=>norm(r.name)));
  known.add('90 min full body swedish');
  const groups=new Map();
  for(const rec of rows.rows){
    const p=rec.source_payload||{};
    if(norm(p.Type)!=='appointment') continue;
    const names=splitList(p.Services);
    if(names.length!==1) continue;
    const sourceName=names[0];
    if(known.has(norm(sourceName))) continue;
    const start=parseGoldieDateTime(p.Date,p['Start Time']);
    const end=parseGoldieDateTime(p.Date,p['End Time']);
    const duration=start&&end&&end>start?Math.round((end-start)/60000):null;
    const price=money(p.Price);
    const key=norm(sourceName);
    if(!groups.has(key)) groups.set(key,{sourceName,count:0,durations:new Map(),prices:new Map(),staff:new Map(),clients:new Set(),samples:[]});
    const g=groups.get(key);g.count++;
    if(duration!=null)g.durations.set(duration,(g.durations.get(duration)||0)+1);
    if(price!=null)g.prices.set(price,(g.prices.get(price)||0)+1);
    for(const s of splitList(p.Staff))g.staff.set(s,(g.staff.get(s)||0)+1);
    if(p.Clients)g.clients.add(String(p.Clients).trim());
    if(g.samples.length<3)g.samples.push({externalId:rec.external_id,date:p.Date,start:p['Start Time'],end:p['End Time'],price:p.Price||null,staff:p.Staff||null,client:p.Clients||null});
  }
  const items=[...groups.values()].map(g=>({
    sourceName:g.sourceName,count:g.count,uniqueClientCount:g.clients.size,
    durationDistribution:[...g.durations.entries()].sort((a,b)=>b[1]-a[1]).map(([minutes,count])=>({minutes,count})),
    priceDistribution:[...g.prices.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([price,count])=>({price,count})),
    staffDistribution:[...g.staff.entries()].sort((a,b)=>b[1]-a[1]).map(([staff,count])=>({staff,count})),
    samples:g.samples,
    evidenceFlags:{
      repeated:g.count>=3,
      durationStable:g.durations.size===1&&g.count>=2,
      priceStable:g.prices.size===1&&g.count>=2,
      broadClientUsage:g.clients.size>=3,
    },
  })).sort((a,b)=>b.count-a.count||a.sourceName.localeCompare(b.sourceName));
  return {appointmentBatchId:String(appointmentBatchId),distinctNames:items.length,items,policy:{readOnly:true,requiresSingleServiceAppointment:true,noCatalogueWrites:true}};
}
module.exports={getHistoricalServiceEvidence};
