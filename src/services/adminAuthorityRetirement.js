const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');

const CALENDAR_EXACT = new Set([
  'appointments',
  'find an available time',
  'find availability',
  'availability',
  'make a booking',
  'make booking',
  'new booking',
  'book client',
  'book a client',
  'book appointment',
  'confirm booking',
  'cancel booking',
  'manage a booking',
  'manage booking',
  'update booking',
  'edit booking',
  'reschedule',
  'reschedule appointment',
  'reassign',
  'reassign appointment',
  'cancel appointment',
  'block time',
  'blocked time',
  'manage blocked time',
  'schedule',
  'schedule management',
  'manage schedule',
  'my schedule',
  'staff schedule',
  'working hours',
  'set working hours',
  'staff hours',
  'regular staff hours',
  'my regular hours',
  'leave',
  'leave / special availability',
  'my leave / special availability',
  'leave and special availability',
  'special availability',
  'freelancer availability',
  'freelancers',
  'freelance schedule',
  'holiday hours',
  'public holiday hours',
]);

const RETIRED_STAFF_EXACT = new Set([
  'help',
  'find a client',
  'find client',
  'find my client',
  'client details',
  'my client details',
  'add a walk-in',
  'add walk-in',
  'new walk-in',
  'create walk-in',
  'staff services',
  'my services',
  'services by staff',
  'services per staff',
  'all services per staff',
  'practitioner services',
  'who does what',
  'services & pricing',
  'my services & pricing',
  'manage services & pricing',
  'service pricing',
  'manage pricing',
  'pricing',
]);

function normalizeAuthorityInput(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function classifyRetiredAdminAction(value = '') {
  const raw = String(value).trim();
  const normalized = normalizeAuthorityInput(raw);
  if (!normalized) return null;

  if (
    normalized === 'admin_retired_named_earnings'
    || /^(?:christel|abigail|marietjie)(?:'s)? earnings(?:\s|$)/i.test(raw)
    || /^admin_(?:christel|abigail|marietjie)_earnings_/i.test(raw)
    || /^admin_action_(?:christel|abigail|marietjie)_earnings$/i.test(raw)
  ) return { kind: 'generic_earnings', reason: 'named_earnings_shortcut' };

  if (
    normalized === 'admin_retired_last_week_appointments'
    || /^(?:appointments?|show appointments?) last week$/i.test(raw)
    || /^admin_appointment_last_week$/i.test(raw)
  ) return { kind: 'calendar', reason: 'last_week_appointments' };

  if (
    normalized === 'admin_retired_staff_action'
    || RETIRED_STAFF_EXACT.has(normalized)
    || /^admin_action_(?:help|client|walkin|staff_services|pricing)$/i.test(raw)
    || /^(?:find|lookup|search(?: for)?)\s+client\b/i.test(raw)
    || /^client\s+(?:find|lookup|search)\b/i.test(raw)
    || /^(?:add|new|create)\s+walk[- ]?in\b/i.test(raw)
    || /^pricing_(?:service_\d+|more_\d+|change|back_services|confirm|keep)$/i.test(raw)
  ) return { kind: 'retired', reason: 'ordinary_staff_surface_removed' };

  if (
    normalized === 'admin_retired_internal_action'
    || /^admin_(?:demo|controlled_demo|test_client_reset|calendar_integrity|appointment_finalize|appointment_(?:price|service)_|service_change_|roster|nail|legacy_orphan)/i.test(raw)
    || /^finalize_/i.test(raw)
    || /^(?:demo client|client demo|start client demo|start demo client|delete demo booking|remove demo booking|purge demo booking|confirm delete demo booking|confirm demo deletion)$/i.test(raw)
    || /^(?:reset (?:test client )?juvan|calendar integrity(?: scan| issues)?|finali[sz]e past (?:appointments|visits)|review final statuses)$/i.test(raw)
    || /^(?:roster audit|roster status|roster completeness|staff roster|check roster|nail audit|nail services audit|discontinued services audit|legacy orphan audit|legacy-orphan audit)$/i.test(raw)
    || /^(?:historical finalization|historical booking|manual booking repair|appointment (?:service|price) correction repair)\b/i.test(raw)
    || /^delete client\b/i.test(raw)
    || /^(?:engineering|emergency|test) command\b/i.test(raw)
  ) return { kind: 'internal_only', reason: 'internal_control_plane' };

  if (
    normalized === 'admin_retired_calendar_action'
    || CALENDAR_EXACT.has(normalized)
    || /^(?:admin_menu_appointments|admin_section_(?:appointments|schedule))$/i.test(raw)
    || /^admin_action_(?:availability|booking|manage_booking|schedule)$/i.test(raw)
    || /^admin_appointment_(?:availability|booking|manage|block_time)$/i.test(raw)
    || /^(?:admin_booking_|admin_block_|schedule_(?:date_|leave_|own_|request_|slot|slots)|booking_(?:back|menu|select_))/i.test(raw)
    || /^(?:manage_|cancel_(?:back|confirm)$)/i.test(raw)
    || /^(?:check availability|available slots|next available|book client)\b/i.test(raw)
    || /^(?:reschedule|reassign|cancel) appointment\b/i.test(raw)
    || /^(?:block|blocked) time\b/i.test(raw)
    || /^(?:working hours|set working hours|add schedule exception|remove schedule exception)\b/i.test(raw)
    || /^(?:leave|special availability|freelancer availability|holiday hours|public holiday hours)\b/i.test(raw)
  ) return { kind: 'calendar', reason: 'calendar_authority' };

  return null;
}

async function uniqueActiveAdmin(sender, db = pool) {
  const result = await db.query(
    `SELECT id,staff_id,display_name,role,permissions,service_scope,business_role,calendar_scope
       FROM staff_admin_accounts
      WHERE normalized_whatsapp=$1 AND active=TRUE
      ORDER BY id
      LIMIT 2`,
    [normalizePhone(sender)],
  );
  if (result.rowCount === 0) return { status: 'not_admin', admin: null };
  if (result.rowCount !== 1) return { status: 'ambiguous', admin: null };
  return { status: 'ok', admin: result.rows[0] };
}

async function auditRetirement(admin, disposition, db = pool) {
  await db.query(
    `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata)
     VALUES ($1,'admin.whatsapp_authority_retired','admin',NULL,$2::jsonb)`,
    [admin.id, JSON.stringify({
      contract: 'whatsapp_admin_authority_retirement_v1',
      disposition: disposition.kind,
      reason: disposition.reason,
      mutationAttempted: false,
    })],
  );
}

async function processRetiredAdminAuthorityMessage(sender, text, db = pool) {
  const disposition = classifyRetiredAdminAction(text);
  if (!disposition) return { handled: false };

  const authority = await uniqueActiveAdmin(sender, db);
  if (authority.status === 'not_admin') return { handled: false };
  if (authority.status !== 'ok') {
    return {
      handled: true,
      disposition,
      reply: 'This staff action could not be authorized from the current WhatsApp identity. No action was taken.',
    };
  }

  await auditRetirement(authority.admin, disposition, db);

  if (disposition.kind === 'retired') {
    return {
      handled: true,
      admin: authority.admin,
      disposition,
      reply: 'That WhatsApp staff action has been retired. No action was taken. Send *Menu* for the current Shiloh options.',
    };
  }

  if (disposition.kind === 'internal_only') {
    return {
      handled: true,
      admin: authority.admin,
      disposition,
      reply: 'That command is internal-only and is not exposed through the ordinary staff WhatsApp webhook. No action was taken.',
    };
  }

  return { handled: true, admin: authority.admin, disposition };
}

module.exports = {
  CALENDAR_EXACT,
  RETIRED_STAFF_EXACT,
  auditRetirement,
  classifyRetiredAdminAction,
  normalizeAuthorityInput,
  processRetiredAdminAuthorityMessage,
  uniqueActiveAdmin,
};
