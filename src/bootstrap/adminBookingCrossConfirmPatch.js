const Module = require('node:module');
const { pool } = require('../db/pool');

const CROSS_CONFIRM_NAMES = new Set(['christel', 'abigail']);

function firstName(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, '')
    .split(/\s+/)[0] || '';
}

function canCreateAppointments(admin) {
  return admin?.permissions?.['appointment:create'] === true;
}

function isChristelOrAbigail(admin) {
  return CROSS_CONFIRM_NAMES.has(firstName(admin?.display_name));
}

async function eligiblePendingSessions(admin, db = pool) {
  if (!admin?.id || !canCreateAppointments(admin) || !isChristelOrAbigail(admin)) return [];

  const result = await db.query(
    `SELECT abs.admin_id,
            abs.client_id,
            abs.staff_id,
            abs.service_id,
            abs.starts_at,
            abs.ends_at,
            saa.display_name AS preparer_name,
            saa.permissions AS preparer_permissions
       FROM admin_booking_sessions abs
       JOIN staff_admin_accounts saa
         ON saa.id = abs.admin_id
        AND saa.active = TRUE
      WHERE abs.state = 'confirm'
        AND (
          abs.admin_id = $1
          OR LOWER(SPLIT_PART(TRIM(saa.display_name), ' ', 1)) IN ('christel', 'abigail')
        )
      ORDER BY abs.updated_at DESC, abs.admin_id`,
    [admin.id]
  );

  return result.rows.filter((row) => {
    const preparerCanCreate = row.preparer_permissions?.['appointment:create'] === true;
    return preparerCanCreate && CROSS_CONFIRM_NAMES.has(firstName(row.preparer_name));
  });
}

async function claimCrossConfirmSession(admin, session, db = pool) {
  if (!session || Number(session.admin_id) === Number(admin.id)) {
    return { status: 'own', preparerAdminId: Number(admin.id), preparerName: admin.display_name };
  }

  const preparerAdminId = Number(session.admin_id);
  const preparerName = session.preparer_name;
  try {
    const claimed = await db.query(
      `UPDATE admin_booking_sessions
          SET admin_id = $1,
              updated_at = NOW()
        WHERE admin_id = $2
          AND state = 'confirm'
          AND NOT EXISTS (
            SELECT 1 FROM admin_booking_sessions own WHERE own.admin_id = $1
          )
      RETURNING admin_id`,
      [admin.id, preparerAdminId]
    );

    if (claimed.rowCount !== 1) return { status: 'ambiguous_or_changed' };

    await db.query(
      `INSERT INTO crm_audit_events
         (actor_admin_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'admin.booking_cross_confirmation_claimed', 'admin_booking_session', NULL, $2::jsonb)`,
      [admin.id, JSON.stringify({
        preparedByAdminId: preparerAdminId,
        preparedBy: preparerName,
        confirmedByAdminId: Number(admin.id),
        confirmedBy: admin.display_name,
        clientId: session.client_id,
        staffId: session.staff_id,
        serviceId: session.service_id,
        startsAt: session.starts_at,
        endsAt: session.ends_at,
      })]
    );

    return { status: 'claimed', preparerAdminId, preparerName };
  } catch (error) {
    if (error?.code === '23505') return { status: 'ambiguous_or_changed' };
    throw error;
  }
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  const exported = originalLoad.apply(this, arguments);
  if (
    typeof request === 'string' &&
    /(?:^|\/)adminBooking(?:\.js)?$/.test(request) &&
    exported &&
    typeof exported.confirmAdminBooking === 'function' &&
    !exported.__crossConfirmPatched
  ) {
    const originalConfirm = exported.confirmAdminBooking;

    exported.confirmAdminBooking = async function confirmWithChristelAbigailHandoff(admin, options = {}) {
      if (!canCreateAppointments(admin) || !isChristelOrAbigail(admin)) {
        return originalConfirm(admin, options);
      }

      const sessions = await eligiblePendingSessions(admin);
      if (sessions.length === 0) return originalConfirm(admin, options);

      if (sessions.length > 1) {
        return {
          status: 'ambiguous_pending',
          reply: 'There is more than one pending Christel/Abigail booking awaiting confirmation, so I will not guess which one you mean. Please have the preparing admin cancel or confirm one pending booking first.',
        };
      }

      const session = sessions[0];
      if (Number(session.admin_id) === Number(admin.id)) return originalConfirm(admin, options);

      const claim = await claimCrossConfirmSession(admin, session);
      if (claim.status !== 'claimed') {
        return {
          status: 'pending_changed',
          reply: 'That pending booking changed while I was checking it, so I did not confirm anything. Please open the booking again and review it before confirming.',
        };
      }

      const result = await originalConfirm(admin, {
        ...options,
        source: options.source || 'shiloh_admin_whatsapp_cross_confirm',
      });

      if (result?.status === 'created') {
        const suffix = `\n\nCross-confirmed by ${admin.display_name}; prepared by ${claim.preparerName}.`;
        return { ...result, reply: `${result.reply || 'Booking created.'}${suffix}` };
      }

      return result;
    };

    Object.defineProperty(exported, '__crossConfirmPatched', { value: true });
  }
  return exported;
};

module.exports = {
  firstName,
  canCreateAppointments,
  isChristelOrAbigail,
  eligiblePendingSessions,
  claimCrossConfirmSession,
};
