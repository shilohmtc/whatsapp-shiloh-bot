const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

function clean(v=''){ return String(v).trim().replace(/\s+/g,' '); }
function key(sender){ return normalizePhone(sender); }
function has(admin,p){ return admin?.permissions?.[p] === true; }

async function getAdmin(sender){
  const r = await pool.query(
    `SELECT id, display_name, permissions
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

function fmtDate(v){
  return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(new Date(v));
}
function fmtTime(v){
  return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v));
}

async function rowsForDate(date){
  const r = await pool.query(`
    WITH bounds AS (
      SELECT ($1::date::timestamp AT TIME ZONE 'Africa/Johannesburg') AS start_utc,
             (($1::date + 1)::timestamp AT TIME ZONE 'Africa/Johannesburg') AS end_utc
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
     GROUP BY a.id,a.starts_at,a.ends_at,a.status,c.display_name,a.source_client_name
     ORDER BY a.starts_at,a.id`, [date]);
  return r.rows;
}

async function upcomingRows(){
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
     GROUP BY a.id,a.starts_at,a.ends_at,a.status,c.display_name,a.source_client_name
     ORDER BY a.starts_at,a.id
     LIMIT 30`);
  return r.rows;
}

function renderRows(title, rows){
  if(!rows.length) return `${title}: there are no active appointments in the CRM.`;
  const lines=[`*${title} — ${rows.length} appointment${rows.length===1?'':'s'}*`,''];
  for(const row of rows){
    lines.push(`${fmtDate(row.starts_at)} · ${fmtTime(row.starts_at)}–${fmtTime(row.ends_at)} · ${row.client_name}${row.services?` — ${row.services}`:''}${row.staff?` — ${row.staff}`:''} · #${row.id}`);
  }
  return lines.join('\n');
}

async function processAdminAppointmentsByDateMessage(sender,text){
  const raw=clean(text);
  const dated=raw.match(/^appointments?\s+(.+)$/i);
  const upcoming=/^upcoming\s+appointments?$/i.test(raw);
  if(!dated && !upcoming) return {handled:false};

  const admin=await getAdmin(sender);
  if(!admin) return {handled:false};
  if(!has(admin,'appointment:view')) return {handled:true,admin,reply:'Your admin account does not currently have permission to view appointments.'};

  if(upcoming){
    const rows=await upcomingRows();
    return {handled:true,admin,reply:renderRows('Upcoming appointments',rows)};
  }

  const date=parseDate(dated[1]);
  if(!date) return {handled:true,admin,reply:'Use: Appointments DD/MM/YYYY\nExample: Appointments 17/08/2026'};
  const rows=await rowsForDate(date);
  const label=new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date(`${date}T12:00:00+02:00`));
  return {handled:true,admin,reply:renderRows(label,rows)};
}

module.exports={processAdminAppointmentsByDateMessage};
