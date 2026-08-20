const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

const TZ_OFFSET = '+02:00';
const SESSION_TTL_MS = 15 * 60 * 1000;
const MAX_BLOCK_MINUTES = 8 * 60;
const sessions = new Map();

function clean(value = '') { return String(value || '').trim().replace(/\s+/g, ' '); }
function normalizeName(value = '') { return clean(value).toLowerCase(); }
function senderKey(sender) { return normalizePhone(sender); }
function hasExpired(session) { return !session || Number(session.expiresAt || 0) <= Date.now(); }
function isChristelAdmin(admin) { return normalizeName(admin?.display_name) === 'christel' && Boolean(admin?.staff_id) && ['owner', 'business_admin'].includes(admin?.business_role) && admin?.calendar_scope === 'all_business'; }
function isAbigailAdmin(admin) { return normalizeName(admin?.display_name) === 'abigail' && Boolean(admin?.staff_id) && admin?.business_role === 'employee_practitioner'; }
function isMarietjieAdmin(admin) { return normalizeName(admin?.display_name) === 'marietjie' && Boolean(admin?.staff_id) && admin?.business_role === 'tenant_practitioner'; }
function canPresentBlockTime(admin) { return isChristelAdmin(admin) || isAbigailAdmin(admin) || isMarietjieAdmin(admin); }

async function getAdmin(sender, db = pool) {
  const result = await db.query(
    `SELECT id, staff_id, display_name, role, permissions, service_scope, business_role, calendar_scope
       FROM staff_admin_accounts
      WHERE normalized_whatsapp = $1 AND active = TRUE`,
    [senderKey(sender)]
  );
  return result.rows[0] || null;
}

async function activePractitioner(staffId, db = pool) {
  const result = await db.query(
    `SELECT id, display_name
       FROM staff
      WHERE id = $1 AND status = 'active' AND resource_type = 'practitioner'
      LIMIT 1`,
    [staffId]
  );
  return result.rows[0] || null;
}

async function resolveBlockTimeTargets(admin, db = pool) {
  if (!canPresentBlockTime(admin)) return [];
  const own = await activePractitioner(admin.staff_id, db);
  if (!own) return [];
  if (!isChristelAdmin(admin)) return [own];
  const abigail = await db.query(
    `SELECT id, display_name
       FROM staff
      WHERE status = 'active'
        AND resource_type = 'practitioner'
        AND LOWER(TRIM(display_name)) = 'abigail'
      ORDER BY id
      LIMIT 2`
  );
  if (abigail.rows.length !== 1) return [own];
  if (Number(abigail.rows[0].id) === Number(own.id)) return [own];
  return [own, abigail.rows[0]];
}

async function requireAuthorizedTarget(admin, staffId, db = pool) {
  const targets = await resolveBlockTimeTargets(admin, db);
  const target = targets.find((row) => Number(row.id) === Number(staffId));
  if (!target) {
    const error = new Error('You are not authorized to block time for that practitioner.');
    error.code = 'BLOCK_TIME_FORBIDDEN';
    throw error;
  }
  return target;
}

function localDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(date);
}
function addDays(dateKey, days) {
  const noon = new Date(`${dateKey}T12:00:00${TZ_OFFSET}`);
  noon.setUTCDate(noon.getUTCDate() + Number(days));
  return localDateKey(noon);
}
function parseDate(value, now = new Date()) {
  const raw = clean(value).toLowerCase();
  const today = localDateKey(now);
  let date = null;
  if (['today', 'admin_block_date_today'].includes(raw)) date = today;
  else if (['tomorrow', 'admin_block_date_tomorrow'].includes(raw)) date = addDays(today, 1);
  else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = raw;
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00${TZ_OFFSET}`);
  if (Number.isNaN(parsed.getTime()) || localDateKey(parsed) !== date) return null;
  if (date < today || date > addDays(today, 365)) return null;
  return date;
}
function parseTime(value) {
  let raw = clean(value).toLowerCase();
  let hour; let minute;
  let match = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (match) {
    hour = Number(match[1]); minute = Number(match[2]);
    if (match[3]) {
      if (hour < 1 || hour > 12) return null;
      if (match[3] === 'pm' && hour !== 12) hour += 12;
      if (match[3] === 'am' && hour === 12) hour = 0;
    }
  } else {
    match = raw.match(/^(\d{1,2})\s*(am|pm)$/);
    if (!match) return null;
    hour = Number(match[1]); minute = 0;
    if (hour < 1 || hour > 12) return null;
    if (match[2] === 'pm' && hour !== 12) hour += 12;
    if (match[2] === 'am' && hour === 12) hour = 0;
  }
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59 || minute % 15 !== 0) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
function parseDuration(value) {
  const raw = clean(value).toLowerCase();
  const fixed = { admin_block_duration_30: 30, admin_block_duration_60: 60, '30': 30, '30 min': 30, '30 minutes': 30, '60': 60, '60 min': 60, '60 minutes': 60, '1 hour': 60, '1h': 60 };
  if (fixed[raw]) return fixed[raw];
  const match = raw.match(/^(\d{1,3})(?:\s*(?:min|mins|minutes))?$/);
  const minutes = match ? Number(match[1]) : null;
  if (!minutes || minutes < 15 || minutes > MAX_BLOCK_MINUTES || minutes % 15 !== 0) return null;
  return minutes;
}
function toInterval(date, startTime, durationMinutes) {
  const startsAt = new Date(`${date}T${startTime}:00${TZ_OFFSET}`);
  if (Number.isNaN(startsAt.getTime())) return null;
  const endsAt = new Date(startsAt.getTime() + Number(durationMinutes) * 60000);
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}
function formatLocalDateTime(value) {
  return new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}
function reasonFromAction(value) {
  const raw = clean(value).toLowerCase();
  const map = {
    admin_block_reason_personal: 'Personal',
    admin_block_reason_lunch: 'Lunch',
    admin_block_reason_admin: 'Admin',
    admin_block_reason_meeting: 'Meeting',
    personal: 'Personal', lunch: 'Lunch', admin: 'Admin', meeting: 'Meeting',
  };
  return map[raw] || null;
}
function blockTypeForReason(reason) { return normalizeName(reason) === 'personal' ? 'personal_event' : 'other'; }

function datePrompt() {
  return { type: 'button', body: '*Block time — Date*\nChoose the date, or choose Other and type YYYY-MM-DD.', buttons: [
    { id: 'admin_block_date_today', title: 'Today' },
    { id: 'admin_block_date_tomorrow', title: 'Tomorrow' },
    { id: 'admin_block_date_other', title: 'Other' },
  ] };
}
function durationPrompt() {
  return { type: 'button', body: '*Block time — Duration*\nChoose a duration, or choose Other and type minutes in 15-minute increments.', buttons: [
    { id: 'admin_block_duration_30', title: '30 min' },
    { id: 'admin_block_duration_60', title: '1 hour' },
    { id: 'admin_block_duration_other', title: 'Other' },
  ] };
}
function reasonPrompt() {
  return { type: 'list', body: '*Block time — Reason*\nChoose a short reason. This is an internal availability label; no client message is sent.', buttonText: 'Choose reason', sectionTitle: 'Reason', rows: [
    { id: 'admin_block_reason_personal', title: 'Personal', description: 'Personal unavailable time' },
    { id: 'admin_block_reason_lunch', title: 'Lunch', description: 'Lunch break' },
    { id: 'admin_block_reason_admin', title: 'Admin', description: 'Administrative work' },
    { id: 'admin_block_reason_meeting', title: 'Meeting', description: 'Internal or external meeting' },
    { id: 'admin_block_reason_other', title: 'Other', description: 'Type a short custom label' },
  ] };
}
function reviewPrompt(session) {
  const interval = toInterval(session.date, session.startTime, session.durationMinutes);
  const end = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(interval.endsAt));
  const verb = session.editingBlockId ? 'Update' : 'Block';
  return { type: 'button', body: [
    `*${verb} time — Review*`,
    `Practitioner: *${session.targetName}*`,
    `Date: ${session.date}`,
    `Time: ${session.startTime}–${end}`,
    `Duration: ${session.durationMinutes} minutes`,
    `Reason: ${session.reason}`,
    '',
    'This will make the time unavailable for client and Admin bookings. It does not create a client appointment.',
  ].join('\n'), buttons: [
    { id: 'admin_block_confirm', title: session.editingBlockId ? 'Confirm update' : 'Confirm block' },
    { id: 'admin_block_cancel', title: 'Cancel' },
  ] };
}

async function audit(db, adminId, action, blockId, metadata) {
  await db.query(
    `INSERT INTO crm_audit_events (actor_admin_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, 'calendar_block', $3, $4::jsonb)`,
    [adminId, action, blockId, JSON.stringify(metadata || {})]
  );
}

async function assertNoOverlap(db, staffId, startsAt, endsAt, excludeBlockId = null) {
  const appointment = await db.query(
    `SELECT a.id
       FROM appointment_staff ast
       JOIN appointments a ON a.id = ast.appointment_id
      WHERE ast.staff_id = $1
        AND a.status <> 'cancelled'
        AND a.starts_at < $3::timestamptz
        AND a.ends_at > $2::timestamptz
      ORDER BY a.starts_at, a.id
      LIMIT 1`,
    [staffId, startsAt, endsAt]
  );
  if (appointment.rowCount) {
    const error = new Error('That time overlaps an existing appointment. Nothing was changed.');
    error.code = 'BLOCK_TIME_APPOINTMENT_CONFLICT';
    throw error;
  }
  const block = await db.query(
    `SELECT id
       FROM calendar_blocks
      WHERE staff_id = $1
        AND ($4::bigint IS NULL OR id <> $4::bigint)
        AND starts_at < $3::timestamptz
        AND ends_at > $2::timestamptz
      ORDER BY starts_at, id
      LIMIT 1`,
    [staffId, startsAt, endsAt, excludeBlockId]
  );
  if (block.rowCount) {
    const error = new Error('That time is already blocked. Nothing was changed.');
    error.code = 'BLOCK_TIME_BLOCK_CONFLICT';
    throw error;
  }
}

async function saveBlock(admin, session) {
  const interval = toInterval(session.date, session.startTime, session.durationMinutes);
  if (!interval || new Date(interval.startsAt).getTime() <= Date.now()) {
    const error = new Error('Block time must start in the future. Nothing was changed.');
    error.code = 'BLOCK_TIME_NOT_FUTURE';
    throw error;
  }
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const target = await requireAuthorizedTarget(admin, session.targetStaffId, db);
    await assertNoOverlap(db, target.id, interval.startsAt, interval.endsAt, session.editingBlockId || null);
    let block;
    if (session.editingBlockId) {
      const existing = await db.query(
        `SELECT id, staff_id FROM calendar_blocks WHERE id = $1 AND source = 'shiloh' FOR UPDATE`,
        [session.editingBlockId]
      );
      if (existing.rows.length !== 1 || Number(existing.rows[0].staff_id) !== Number(target.id)) {
        const error = new Error('That Shiloh block is no longer editable or is outside your authority. Nothing was changed.');
        error.code = 'BLOCK_TIME_EDIT_FORBIDDEN';
        throw error;
      }
      const updated = await db.query(
        `UPDATE calendar_blocks
            SET block_type = $2, starts_at = $3, ends_at = $4, title = $5, notes = NULL, recurrence_text = NULL, updated_at = NOW()
          WHERE id = $1
        RETURNING id, staff_id, block_type, starts_at, ends_at, title`,
        [session.editingBlockId, blockTypeForReason(session.reason), interval.startsAt, interval.endsAt, session.reason]
      );
      block = updated.rows[0];
      await audit(db, admin.id, 'schedule.block_time_updated', block.id, { staffId: Number(target.id), startsAt: interval.startsAt, endsAt: interval.endsAt, reason: session.reason, delegated: Number(target.id) !== Number(admin.staff_id) });
    } else {
      const inserted = await db.query(
        `INSERT INTO calendar_blocks (staff_id, block_type, starts_at, ends_at, title, source)
         VALUES ($1, $2, $3, $4, $5, 'shiloh')
         RETURNING id, staff_id, block_type, starts_at, ends_at, title`,
        [target.id, blockTypeForReason(session.reason), interval.startsAt, interval.endsAt, session.reason]
      );
      block = inserted.rows[0];
      await audit(db, admin.id, 'schedule.block_time_created', block.id, { staffId: Number(target.id), startsAt: interval.startsAt, endsAt: interval.endsAt, reason: session.reason, delegated: Number(target.id) !== Number(admin.staff_id) });
    }
    await db.query('COMMIT');
    return { ...block, staff_name: target.display_name };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

async function listEditableBlocks(admin, db = pool) {
  const targets = await resolveBlockTimeTargets(admin, db);
  if (!targets.length) return [];
  const ids = targets.map((row) => Number(row.id));
  const result = await db.query(
    `SELECT cb.id, cb.staff_id, cb.starts_at, cb.ends_at, cb.title, st.display_name AS staff_name
       FROM calendar_blocks cb
       JOIN staff st ON st.id = cb.staff_id
      WHERE cb.source = 'shiloh'
        AND cb.staff_id = ANY($1::bigint[])
        AND cb.ends_at > NOW()
      ORDER BY cb.starts_at, cb.id
      LIMIT 30`,
    [ids]
  );
  return result.rows;
}
function blocksInteractive(blocks) {
  if (!blocks.length) return null;
  return { type: 'list', body: '*Blocked time*\nChoose a Shiloh-created block to view, edit or remove it.', buttonText: 'Blocked time', sectionTitle: 'Upcoming blocks', rows: blocks.map((block) => ({
    id: `admin_block_open_${block.id}`,
    title: formatLocalDateTime(block.starts_at).slice(0, 24),
    description: `${block.staff_name} · ${block.title || 'Unavailable'}`.slice(0, 72),
  })).concat([{ id: 'admin_appointment_block_time', title: '+ Block time', description: 'Create another availability block' }]) };
}
async function loadAuthorizedBlock(admin, blockId, db = pool) {
  const targets = await resolveBlockTimeTargets(admin, db);
  const ids = targets.map((row) => Number(row.id));
  if (!ids.length) return null;
  const result = await db.query(
    `SELECT cb.id, cb.staff_id, cb.starts_at, cb.ends_at, cb.title, st.display_name AS staff_name
       FROM calendar_blocks cb
       JOIN staff st ON st.id = cb.staff_id
      WHERE cb.id = $1 AND cb.source = 'shiloh' AND cb.staff_id = ANY($2::bigint[])
      LIMIT 1`,
    [blockId, ids]
  );
  return result.rows[0] || null;
}
function blockDetailInteractive(block) {
  return { type: 'button', body: [
    '*Blocked time*',
    `Practitioner: *${block.staff_name}*`,
    `Start: ${formatLocalDateTime(block.starts_at)}`,
    `End: ${formatLocalDateTime(block.ends_at)}`,
    `Reason: ${block.title || 'Unavailable'}`,
  ].join('\n'), buttons: [
    { id: `admin_block_edit_${block.id}`, title: 'Edit' },
    { id: `admin_block_remove_${block.id}`, title: 'Remove' },
    { id: 'admin_block_manage', title: 'Back' },
  ] };
}
async function removeBlock(admin, blockId) {
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const block = await loadAuthorizedBlock(admin, blockId, db);
    if (!block) {
      const error = new Error('That Shiloh block is no longer available or is outside your authority. Nothing was changed.');
      error.code = 'BLOCK_TIME_REMOVE_FORBIDDEN';
      throw error;
    }
    await db.query(`DELETE FROM calendar_blocks WHERE id = $1 AND source = 'shiloh'`, [block.id]);
    await audit(db, admin.id, 'schedule.block_time_removed', block.id, { staffId: Number(block.staff_id), startsAt: block.starts_at, endsAt: block.ends_at, reason: block.title || null, delegated: Number(block.staff_id) !== Number(admin.staff_id) });
    await db.query('COMMIT');
    return block;
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally { db.release(); }
}

function sessionFor(sender) {
  const key = senderKey(sender);
  const session = sessions.get(key);
  if (hasExpired(session)) { sessions.delete(key); return null; }
  return session;
}
function setSession(sender, session) { sessions.set(senderKey(sender), { ...session, expiresAt: Date.now() + SESSION_TTL_MS }); }
function clearSession(sender) { sessions.delete(senderKey(sender)); }

async function startCreate(sender, admin) {
  const targets = await resolveBlockTimeTargets(admin);
  if (!targets.length) return { handled: true, admin, reply: 'Block time is not available for your account.' };
  if (targets.length === 1) {
    setSession(sender, { step: 'date', targetStaffId: Number(targets[0].id), targetName: targets[0].display_name });
    return { handled: true, admin, interactive: datePrompt() };
  }
  setSession(sender, { step: 'target' });
  return { handled: true, admin, interactive: { type: 'button', body: '*Block time — Choose practitioner*\nWho should this availability block apply to?', buttons: [
    { id: 'admin_block_target_self', title: 'Myself' },
    { id: `admin_block_target_${targets[1].id}`, title: targets[1].display_name.slice(0, 20) },
  ] } };
}

async function startEdit(sender, admin, blockId) {
  const block = await loadAuthorizedBlock(admin, blockId);
  if (!block) return { handled: true, admin, reply: 'That Shiloh block is no longer editable or is outside your authority. Nothing was changed.' };
  setSession(sender, { step: 'date', editingBlockId: Number(block.id), targetStaffId: Number(block.staff_id), targetName: block.staff_name });
  return { handled: true, admin, interactive: datePrompt() };
}

async function processAdminBlockTimeMessage(sender, text) {
  const raw = clean(text); const value = raw.toLowerCase();
  const recognized = value === 'admin_appointment_block_time' || value === 'block time' || value === 'admin_block_manage' || value === 'blocked time' || value === 'my blocked time' || /^admin_block_(?:target_|date_|duration_|reason_|open_|edit_|remove_|confirm$|cancel$)/i.test(raw);
  const active = sessionFor(sender);
  if (!recognized && !active) return { handled: false };
  const admin = await getAdmin(sender);
  if (!admin) { clearSession(sender); return { handled: false }; }
  if (!canPresentBlockTime(admin)) { clearSession(sender); return { handled: true, admin, reply: 'Block time is not available for your account.' }; }

  if (['menu', 'admin', 'admin menu', 'home'].includes(value)) { clearSession(sender); return { handled: false }; }
  if (value === 'admin_block_cancel' || value === 'cancel') { clearSession(sender); return { handled: true, admin, reply: 'Block time cancelled. Nothing was changed. Send *Appointments* to continue.' }; }
  if (value === 'admin_appointment_block_time' || value === 'block time') { clearSession(sender); return startCreate(sender, admin); }
  if (value === 'admin_block_manage' || value === 'blocked time' || value === 'my blocked time') {
    clearSession(sender); const blocks = await listEditableBlocks(admin); const interactive = blocksInteractive(blocks);
    return interactive ? { handled: true, admin, interactive } : { handled: true, admin, reply: 'There are no upcoming Shiloh-created blocks in your authorized scope. Send *Block time* to create one.' };
  }
  let match = raw.match(/^admin_block_open_(\d+)$/i);
  if (match) {
    clearSession(sender); const block = await loadAuthorizedBlock(admin, Number(match[1]));
    return block ? { handled: true, admin, interactive: blockDetailInteractive(block) } : { handled: true, admin, reply: 'That Shiloh block is no longer available or is outside your authority.' };
  }
  match = raw.match(/^admin_block_edit_(\d+)$/i);
  if (match) { clearSession(sender); return startEdit(sender, admin, Number(match[1])); }
  match = raw.match(/^admin_block_remove_(\d+)$/i);
  if (match) {
    clearSession(sender);
    try { const removed = await removeBlock(admin, Number(match[1])); return { handled: true, admin, reply: `Removed the ${removed.title || 'Unavailable'} block for *${removed.staff_name}* starting ${formatLocalDateTime(removed.starts_at)}. The time can be offered again if all other availability checks pass.` }; }
    catch (error) { return { handled: true, admin, reply: error.message || 'That block could not be removed safely. Nothing was changed.' }; }
  }

  const session = sessionFor(sender);
  if (!session) return { handled: true, admin, reply: 'That Block time step has expired. Nothing was changed. Send *Block time* to start again.' };
  if (session.step === 'target') {
    const targets = await resolveBlockTimeTargets(admin);
    let target = null;
    if (value === 'admin_block_target_self' || value === 'myself') target = targets.find((row) => Number(row.id) === Number(admin.staff_id));
    else {
      const targetMatch = raw.match(/^admin_block_target_(\d+)$/i);
      if (targetMatch) target = targets.find((row) => Number(row.id) === Number(targetMatch[1]));
    }
    if (!target) return { handled: true, admin, reply: 'That practitioner is not in your Block time authority. Nothing was changed.' };
    setSession(sender, { ...session, step: 'date', targetStaffId: Number(target.id), targetName: target.display_name });
    return { handled: true, admin, interactive: datePrompt() };
  }
  if (session.step === 'date') {
    if (value === 'admin_block_date_other') { setSession(sender, { ...session, step: 'date_typed' }); return { handled: true, admin, reply: 'Type the date as *YYYY-MM-DD*, for example *2026-08-24*.' }; }
    const date = parseDate(raw);
    if (!date) return { handled: true, admin, reply: 'Choose Today or Tomorrow, or type a future date as *YYYY-MM-DD*. Nothing has been changed.' };
    setSession(sender, { ...session, step: 'start', date });
    return { handled: true, admin, reply: `*Block time — Start*\nType the start time for ${session.targetName}, for example *14:00* or *2pm*. Use 15-minute increments.` };
  }
  if (session.step === 'date_typed') {
    const date = parseDate(raw);
    if (!date) return { handled: true, admin, reply: 'Please type a valid future date as *YYYY-MM-DD* (within the next 12 months).' };
    setSession(sender, { ...session, step: 'start', date });
    return { handled: true, admin, reply: `*Block time — Start*\nType the start time for ${session.targetName}, for example *14:00* or *2pm*. Use 15-minute increments.` };
  }
  if (session.step === 'start') {
    const startTime = parseTime(raw);
    if (!startTime) return { handled: true, admin, reply: 'Please type a valid start time in 15-minute increments, for example *14:00*, *14:15* or *2pm*.' };
    setSession(sender, { ...session, step: 'duration', startTime });
    return { handled: true, admin, interactive: durationPrompt() };
  }
  if (session.step === 'duration') {
    if (value === 'admin_block_duration_other') { setSession(sender, { ...session, step: 'duration_typed' }); return { handled: true, admin, reply: 'Type the duration in minutes, using 15-minute increments (15–480).' }; }
    const durationMinutes = parseDuration(raw);
    if (!durationMinutes) return { handled: true, admin, reply: 'Choose 30 min or 1 hour, or choose Other and type 15–480 minutes in 15-minute increments.' };
    setSession(sender, { ...session, step: 'reason', durationMinutes });
    return { handled: true, admin, interactive: reasonPrompt() };
  }
  if (session.step === 'duration_typed') {
    const durationMinutes = parseDuration(raw);
    if (!durationMinutes) return { handled: true, admin, reply: 'Please type 15–480 minutes in 15-minute increments.' };
    setSession(sender, { ...session, step: 'reason', durationMinutes });
    return { handled: true, admin, interactive: reasonPrompt() };
  }
  if (session.step === 'reason') {
    if (value === 'admin_block_reason_other' || value === 'other') { setSession(sender, { ...session, step: 'reason_typed' }); return { handled: true, admin, reply: 'Type a short internal reason (maximum 40 characters). No client will receive it.' }; }
    const reason = reasonFromAction(raw);
    if (!reason) return { handled: true, admin, interactive: reasonPrompt() };
    const next = { ...session, step: 'confirm', reason }; setSession(sender, next);
    return { handled: true, admin, interactive: reviewPrompt(next) };
  }
  if (session.step === 'reason_typed') {
    const reason = clean(raw);
    if (!reason || reason.length > 40 || /^admin_/i.test(reason)) return { handled: true, admin, reply: 'Please type a short internal reason of 1–40 characters.' };
    const next = { ...session, step: 'confirm', reason }; setSession(sender, next);
    return { handled: true, admin, interactive: reviewPrompt(next) };
  }
  if (session.step === 'confirm') {
    if (value !== 'admin_block_confirm' && value !== 'confirm block' && value !== 'confirm update') return { handled: true, admin, interactive: reviewPrompt(session) };
    try {
      const block = await saveBlock(admin, session); clearSession(sender);
      return { handled: true, admin, reply: `${session.editingBlockId ? 'Updated' : 'Blocked'} time for *${block.staff_name}*: ${formatLocalDateTime(block.starts_at)} to ${formatLocalDateTime(block.ends_at)} (${block.title}). Clients and Admin booking availability will exclude this period. No client appointment or client WhatsApp message was created.` };
    } catch (error) {
      clearSession(sender);
      return { handled: true, admin, reply: `${error.message || 'The time could not be blocked safely.'} Send *Block time* to try again.` };
    }
  }
  clearSession(sender);
  return { handled: true, admin, reply: 'That Block time step could not be continued safely. Nothing was changed. Send *Block time* to start again.' };
}

function resetBlockTimeSessions() { sessions.clear(); }

module.exports = {
  canPresentBlockTime,
  resolveBlockTimeTargets,
  requireAuthorizedTarget,
  parseDate,
  parseTime,
  parseDuration,
  toInterval,
  blockTypeForReason,
  processAdminBlockTimeMessage,
  resetBlockTimeSessions,
  listEditableBlocks,
  assertNoOverlap,
};
