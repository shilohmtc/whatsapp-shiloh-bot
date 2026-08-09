const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

function clean(v=''){return String(v).trim().replace(/\s+/g,' ');}
async function getAdmin(sender){const r=await pool.query(`SELECT id,display_name,permissions FROM staff_admin_accounts WHERE normalized_whatsapp=$1 AND active=TRUE`,[normalizePhone(sender)]);return r.rows[0]||null;}
function has(admin,p){return admin?.permissions?.[p]===true;}
async function getLocation(){const r=await pool.query(`SELECT id,name FROM locations WHERE status='active' ORDER BY id LIMIT 2`);return r.rowCount===1?r.rows[0]:null;}
function fmtDate(v){return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(`${v}T12:00:00+02:00`));}
function fmtTime(v){return String(v||'').slice(0,5);}

async function holidayOverview(locationId){
  const r=await pool.query(`
    SELECT ph.holiday_date::text,ph.name,ph.observed,
           lhe.exception_type,lhe.starts_local,lhe.ends_local
      FROM public_holidays ph
      LEFT JOIN location_hours_exceptions lhe
        ON lhe.location_id=$1 AND lhe.exception_date=ph.holiday_date
     WHERE ph.country_code='ZA'
       AND ph.holiday_date >= (NOW() AT TIME ZONE 'Africa/Johannesburg')::date
       AND ph.holiday_date < ((NOW() AT TIME ZONE 'Africa/Johannesburg')::date + INTERVAL '180 days')
     ORDER BY ph.holiday_date
     LIMIT 8`,[locationId]);
  return r.rows;
}

function overviewReply(rows){
  const lines=['*Holiday hours*','','Public holidays are closed by default until hours are confirmed.',''];
  if(!rows.length){lines.push('No upcoming South African public holidays are loaded in the next 180 days.');return lines.join('\n');}
  for(const row of rows){
    let status='⚠️ CLOSED by default · hours not confirmed';
    if(row.exception_type==='closed') status='✅ Closed confirmed';
    if(row.exception_type==='open') status=`✅ Open ${fmtTime(row.starts_local)}–${fmtTime(row.ends_local)}`;
    lines.push(`• ${fmtDate(row.holiday_date)} — ${row.name}${row.observed?' (observed)':''}`);
    lines.push(`  ${status}`);
  }
  lines.push('','To update a holiday:','Set holiday hours YYYY-MM-DD | CLOSED','or','Set holiday hours YYYY-MM-DD | HH:MM-HH:MM','','Reply MENU to return.');
  return lines.join('\n');
}

async function setHolidayHours(admin,location,date,value){
  const holiday=await pool.query(`SELECT holiday_date::text,name FROM public_holidays WHERE country_code='ZA' AND holiday_date=$1::date`,[date]);
  if(!holiday.rowCount) return `I couldn't find ${date} in the South African public-holiday calendar.`;
  let type='closed',start=null,end=null;
  if(!/^(closed|close)$/i.test(value)){
    const m=clean(value).match(/^([0-2]\d:[0-5]\d)\s*-\s*([0-2]\d:[0-5]\d)$/);
    if(!m) return 'Use CLOSED or HH:MM-HH:MM, for example 08:00-14:00.';
    if(m[2]<=m[1]) return 'Holiday closing time must be later than opening time.';
    type='open';start=m[1];end=m[2];
  }
  await pool.query(`INSERT INTO location_hours_exceptions(location_id,exception_date,exception_type,starts_local,ends_local,reason,actor_admin_id,updated_at)
    VALUES($1,$2::date,$3,$4::time,$5::time,$6,$7,NOW())
    ON CONFLICT(location_id,exception_date) DO UPDATE SET exception_type=EXCLUDED.exception_type,starts_local=EXCLUDED.starts_local,ends_local=EXCLUDED.ends_local,reason=EXCLUDED.reason,actor_admin_id=EXCLUDED.actor_admin_id,updated_at=NOW()`,
    [location.id,date,type,start,end,`Public holiday: ${holiday.rows[0].name}`,admin.id]);
  await pool.query(`INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata) VALUES($1,'admin.holiday_hours_updated','location',$2,$3::jsonb)`,[admin.id,location.id,JSON.stringify({date,holiday:holiday.rows[0].name,type,start,end})]);
  return type==='closed' ? `Holiday hours updated — ${holiday.rows[0].name} (${date}) is CLOSED.` : `Holiday hours updated — ${holiday.rows[0].name} (${date}) is open ${start}–${end}.`;
}

async function processAdminHolidayHoursMessage(sender,text){
  const raw=clean(text),v=raw.toLowerCase();
  if(!['holiday hours','public holiday hours','8'].includes(v)&&!/^set\s+holiday\s+hours\b/i.test(raw)) return {handled:false};
  const admin=await getAdmin(sender);if(!admin)return {handled:false};
  if(!has(admin,'schedule:manage'))return {handled:true,admin,reply:"You don't have permission to manage clinic hours."};
  const location=await getLocation();if(!location)return {handled:true,admin,reply:'I cannot safely manage holiday hours because the CRM does not resolve to exactly one active clinic location.'};
  const m=raw.match(/^set\s+holiday\s+hours\s+(\d{4}-\d{2}-\d{2})\s*\|\s*(.+)$/i);
  if(m)return {handled:true,admin,reply:await setHolidayHours(admin,location,m[1],m[2])};
  if(/^set\s+holiday\s+hours\b/i.test(raw))return {handled:true,admin,reply:'Use: Set holiday hours YYYY-MM-DD | CLOSED\nor: Set holiday hours YYYY-MM-DD | HH:MM-HH:MM'};
  const rows=await holidayOverview(location.id);
  await pool.query(`INSERT INTO crm_audit_events(actor_admin_id,action,entity_type,entity_id,metadata) VALUES($1,'admin.holiday_hours_viewed','location',$2,$3::jsonb)`,[admin.id,location.id,JSON.stringify({upcoming:rows.length,unconfigured:rows.filter(r=>!r.exception_type).length})]);
  return {handled:true,admin,reply:overviewReply(rows)};
}
module.exports={processAdminHolidayHoursMessage};
