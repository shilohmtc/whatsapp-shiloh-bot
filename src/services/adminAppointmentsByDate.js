const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

function clean(v=''){ return String(v).trim().replace(/\s+/g,' '); }
function key(sender){ return normalizePhone(sender); }
function has(admin,p){ return admin?.permissions?.[p] === true; }

async function getAdmin(sender){
  const r = await pool.query(
    `SELECT id, staff_id, display_name, role, permissions, service_scope
       FROM staff_admin_accounts
      WHERE normalized_whatsapp=$1 AND active=TRUE`,
    [key(sender)]
  );
  return r.rows[0] || null;
}

function parseDate(v){
  const m = clean(v).match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if(!m) return null;
  const d=Number(m[1]), mo=Number(m[2]), y=Number(m[3]);
  const probe=new Date(Date.UTC(y,mo-1,d));
  if(probe.getUTCFullYear()!==y || probe.getUTCMonth()+1!==mo || probe.getUTCDate()!==d) return null;
  return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function clinicDate(offsetDays=0){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
  const base=new Date(`${p.year}-${p.month}-${p.day}T12:00:00+02:00`);
  base.setUTCDate(base.getUTCDate()+offsetDays);
  return base.toISOString().slice(0,10);
}

function lastWeekBounds(){
  const today=new Date(`${clinicDate()}T12:00:00+02:00`);
  const localDay=today.getUTCDay()===0?7:today.getUTCDay();
  const mondayOffset=1-localDay-7;
  const start=clinicDate(mondayOffset);
  const end=clinicDate(mondayOffset+7);
  return {start,end};
}

function fmtDate(v){
  return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(new Date(v));
}
function fmtTime(v){
  return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v));
}

function scopeClause(){
  return `(
    $3::text = 'all_services'
    OR (
      $4::bigint IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM appointment_staff ast_scope
         WHERE ast_scope.appointment_id = a.id AND ast_scope.staff_id = $4
      )
      AND EXISTS (
        SELECT 1
          FROM appointment_services aps_scope
          JOIN staff_services ss_scope
            ON ss_scope.service_id = aps_scope.service_id
           AND ss_scope.staff_id = $4
         WHERE aps_scope.appointment_id = a.id
      )
    )
  )`;
}

async function rowsForRange(startDate,endDate,admin){
  const r = await pool.query(`
    WITH bounds AS (
      SELECT ($1::date::timestamp AT TIME ZONE 'Africa/Johannesburg') AS start_utc,
             ($2::date::timestamp AT TIME ZONE 'Africa/Johannesburg') AS end_utc
    )
    SELECT a.id, a.starts_at, a.ends_at, a.status,
           COALESCE(c.display_name, a.source_client_name, 'Unknown client') AS client_name,
           COALESCE(string_agg(DISTINCT aps.service_name_snapshot, ', ') FILTER (WHERE aps.service_name_snapshot IS NOT NULL), '') AS services,
           COALESCE(string_agg(DISTINCT ast.staff_name_snapshot, ', ') FILTER (WHERE ast.staff_name_snapshot IS NOT NULL), '') AS staff
      FROM appointments a
      CROSS JOIN bounds b
      LEFT JOIN clients c ON c.id=a.client_id
      LEFT JOIN appointment_services aps ON aps.appointment_id=a.id
      LEFT JOIN appointment_staff ast ON ast.appointment_id=a.id
     WHERE a.starts_at >= b.start_utc
       AND a.starts_at < b.end_utc
       AND a.status <> 'cancelled'
       AND ${scopeClause()}
     GROUP BY a.id,a.starts_at,a.ends_at,a.status,c.display_name,a.source_client_name
     ORDER BY a.starts_at,a.id`, [startDate,endDate,admin.service_scope,admin.staff_id]);
  return r.rows;
}

async function rowsForDate(date,admin){ return rowsForRange(date,clinicDateFrom(date,1),admin); }
function clinicDateFrom(date,offset){ const d=new Date(`${date}T12:00:00+02:00`);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10); }

async function upcomingRows(admin){
  const r = await pool.query(`
    SELECT a.id, a.starts_at, a.ends_at, a.status,
           COALESCE(c.display_name, a.source_client_name, 'Unknown client') AS client_name,
           COALESCE(string_agg(DISTINCT aps.service_name_snapshot, ', ') FILTER (WHERE aps.service_name_snapshot IS NOT NULL), '') AS services,
           COALESCE(string_agg(DISTINCT ast.staff_name_snapshot, ', ') FILTER (WHERE ast.staff_name_snapshot IS NOT NULL), '') AS staff
      FROM appointments a
      LEFT JOIN clients c ON c.id=a.client_id
      LEFT JOIN appointment_services aps ON aps.appointment_id=a.id
      LEFT JOIN appointment_staff ast ON ast.appointment_id=a.id
     WHERE a.starts_at >= NOW()
       AND a.status <> 'cancelled'
       AND (
         $1::text = 'all_services'
         OR (
           $2::bigint IS NOT NULL
           AND EXISTS (SELECT 1 FROM appointment_staff ast_scope WHERE ast_scope.appointment_id=a.id AND ast_scope.staff_id=$2)
           AND EXISTS (
             SELECT 1 FROM appointment_services aps_scope
             JOIN staff_services ss_scope ON ss_scope.service_id=aps_scope.service_id AND ss_scope.staff_id=$2
             WHERE aps_scope.appointment_id=a.id
           )
         )
       )
     GROUP BY a.id,a.starts_at,a.ends_at,a.status,c.display_name,a.source_client_name
     ORDER BY a.starts_at,a.id
     LIMIT 30`, [admin.service_scope, admin.staff_id]);
  return r.rows;
}

function renderRows(title, rows){
  if(!rows.length) return `${title}: there are no active appointments in your authorized service scope.`;
  const lines=[`*${title} — ${rows.length} appointment${rows.length===1?'':'s'}*`,''];
  for(const row of rows){
    lines.push(`${fmtDate(row.starts_at)} · ${fmtTime(row.starts_at)}–${fmtTime(row.ends_at)} · ${row.client_name}${row.services?` — ${row.services}`:''}${row.staff?` — ${row.staff}`:''} · #${row.id}`);
  }
  return lines.join('\n');
}

function relativeCommand(raw){
  const v=clean(raw).toLowerCase();
  if(['1','today',"today's clients",'todays clients','my clients today'].includes(v)) return 'today';
  if(['2','tomorrow',"tomorrow's clients",'tomorrows clients','my clients tomorrow'].includes(v)) return 'tomorrow';
  if(['last week',"last week's clients",'last weeks clients','my clients last week'].includes(v)) return 'last_week';
  return null;
}

async function processAdminAppointmentsByDateMessage(sender,text){
  const raw=clean(text);
  const relative=relativeCommand(raw);
  const dated=raw.match(/^appointments?\s+(.+)$/i);
  const upcoming=/^upcoming\s+appointments?$/i.test(raw);
  if(!relative && !dated && !upcoming) return {handled:false};

  const admin=await getAdmin(sender);
  if(!admin) return {handled:false};
  if(!has(admin,'appointment:view')) return {handled:true,admin,reply:'Your admin account does not currently have permission to view appointments.'};

  if(relative==='today'||relative==='tomorrow'){
    const date=clinicDate(relative==='tomorrow'?1:0);
    const rows=await rowsForDate(date,admin);
    const label=new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date(`${date}T12:00:00+02:00`));
    return {handled:true,admin,reply:renderRows(label,rows)};
  }
  if(relative==='last_week'){
    const {start,end}=lastWeekBounds();
    const rows=await rowsForRange(start,end,admin);
    const f=new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',day:'2-digit',month:'short',year:'numeric'});
    const endInclusive=clinicDateFrom(end,-1);
    return {handled:true,admin,reply:renderRows(`Last week · ${f.format(new Date(`${start}T12:00:00+02:00`))}–${f.format(new Date(`${endInclusive}T12:00:00+02:00`))}`,rows)};
  }
  if(upcoming){
    const rows=await upcomingRows(admin);
    return {handled:true,admin,reply:renderRows('Upcoming appointments',rows)};
  }

  const date=parseDate(dated[1]);
  if(!date) return {handled:true,admin,reply:'Use: Appointments DD/MM/YYYY\nExample: Appointments 17/08/2026'};
  const rows=await rowsForDate(date, admin);
  const label=new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date(`${date}T12:00:00+02:00`));
  return {handled:true,admin,reply:renderRows(label,rows)};
}

module.exports={processAdminAppointmentsByDateMessage,relativeCommand,lastWeekBounds,rowsForRange};
