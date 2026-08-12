const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const { cancelPendingBooking } = require('./adminBooking');

const ADMIN_MENU_ESCAPE = /^(menu|admin menu|home)$/i;

function isAdminMenuEscape(text = '') {
  return ADMIN_MENU_ESCAPE.test(String(text).trim().replace(/\s+/g, ' '));
}

async function escapeActiveDemoToAdminMenu(sender, text) {
  if (!isAdminMenuEscape(text)) return { escaped: false };

  const adminResult = await pool.query(
    `SELECT id, display_name
       FROM staff_admin_accounts
      WHERE normalized_whatsapp=$1 AND active=TRUE`,
    [normalizePhone(sender)]
  );
  const admin = adminResult.rows[0] || null;
  if (!admin) return { escaped: false };

  const sessionResult = await pool.query(
    `SELECT admin_id,virtual_phone,demo_client_id,demo_appointment_id,active,state
       FROM admin_client_demo_sessions
      WHERE admin_id=$1`,
    [admin.id]
  );
  const session = sessionResult.rows[0] || null;
  if (!session?.active) return { escaped: false, admin };

  // Never use the menu escape to delete or bypass cleanup of a created booking.
  if (session.demo_appointment_id) {
    return { escaped: false, blocked: true, admin, reason: 'created_demo_booking_requires_cleanup' };
  }

  await cancelPendingBooking(admin.id);
  if (session.virtual_phone) {
    await pool.query(`DELETE FROM booking_intents WHERE phone=$1`, [session.virtual_phone]);
    await pool.query(`DELETE FROM client_onboarding_sessions WHERE phone=$1`, [session.virtual_phone]);
    await pool.query(`DELETE FROM booking_policy_acceptances WHERE phone=$1`, [session.virtual_phone]);
  }

  if (session.demo_client_id) {
    await pool.query(
      `UPDATE clients
          SET status='inactive',updated_at=NOW(),
              custom_attributes=COALESCE(custom_attributes,'{}'::jsonb) ||
                jsonb_build_object('demo_cleanup','admin_menu_escape','demo_cleanup_at',NOW()::text)
        WHERE id=$1
          AND source='whatsapp_demo'
          AND NOT EXISTS (SELECT 1 FROM appointments WHERE client_id=$1)`,
      [session.demo_client_id]
    );
  }

  await pool.query(`DELETE FROM admin_client_demo_sessions WHERE admin_id=$1`, [admin.id]);
  await pool.query(
    `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,metadata)
     VALUES ($1,'admin.client_demo_abandoned_to_menu','admin_demo',$2::jsonb)`,
    [admin.id, JSON.stringify({
      priorState: session.state,
      demoClientId: session.demo_client_id || null,
      hadCreatedAppointment: false,
      temporaryArtifactsCleared: true,
    })]
  );

  return { escaped: true, admin };
}

module.exports = { isAdminMenuEscape, escapeActiveDemoToAdminMenu };
