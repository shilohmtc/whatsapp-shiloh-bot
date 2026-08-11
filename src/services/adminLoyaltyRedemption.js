const { pool } = require('../db/pool');
const { normalizePhone } = require('./clientIdentityOnboarding');
const {
  prepareLoyaltyRedemption,
  confirmLoyaltyRedemption,
  cancelLoyaltyRedemption,
} = require('./loyaltyRedemption');

async function getAdmin(sender) {
  const result = await pool.query(
    `SELECT id,staff_id,display_name,role,business_role,permissions,service_scope
       FROM staff_admin_accounts
      WHERE normalized_whatsapp=$1 AND active=TRUE`,
    [normalizePhone(sender)]
  );
  return result.rows[0] || null;
}

function formatPercent(value) {
  return Number(value || 0).toFixed(0);
}

async function processAdminLoyaltyRedemptionMessage(sender, text) {
  const value = String(text || '').trim();
  const isLoyaltyCommand = /^(redeem\s+loyalty|confirm\s+loyalty|cancel\s+loyalty)\b/i.test(value);
  if (!isLoyaltyCommand) return { handled: false };

  const admin = await getAdmin(sender);
  if (!admin) return { handled: false };
  if (admin.permissions?.['loyalty:redeem'] !== true || admin.service_scope !== 'all_services') {
    return { handled: true, admin, reply: 'Your admin account does not have loyalty redemption permission.' };
  }

  let match = value.match(/^redeem\s+loyalty\s+(?:crm\s*#?\s*)?(\d+)\s*\|\s*(?:appointment\s*#?\s*)?(\d+)$/i);
  if (match) {
    const result = await prepareLoyaltyRedemption(admin, match[1], match[2]);
    if (result.status !== 'pending') return { handled: true, admin, reply: result.reply || 'Loyalty redemption could not be prepared.' };
    return {
      handled: true,
      admin,
      reply: [
        `🎁 Loyalty redemption #${result.redemptionId} prepared${result.idempotent ? ' (already pending)' : ''}.`,
        `Client: ${result.appointment.client_name} (CRM #${match[1]})`,
        `Appointment: #${match[2]}`,
        `Reward: ${formatPercent(result.rewardPercent)}%`,
        '',
        `Reply *CONFIRM LOYALTY ${result.redemptionId}* to commit this reward, or *CANCEL LOYALTY ${result.redemptionId}* to release it.`,
        'No payment status or appointment price has been changed.',
      ].join('\n'),
    };
  }

  match = value.match(/^confirm\s+loyalty\s+(\d+)$/i);
  if (match) {
    const result = await confirmLoyaltyRedemption(admin, match[1]);
    if (result.status !== 'committed') return { handled: true, admin, reply: result.reply || 'Loyalty redemption could not be confirmed.' };
    return {
      handled: true,
      admin,
      reply: `✅ Loyalty redemption #${match[1]} ${result.idempotent ? 'was already committed' : 'is committed'}. The reward entitlement is now recorded as redeemed for appointment #${result.redemption.appointment_id}. No payment status was changed.`,
    };
  }

  match = value.match(/^cancel\s+loyalty\s+(\d+)$/i);
  if (match) {
    const result = await cancelLoyaltyRedemption(admin, match[1]);
    if (result.status !== 'cancelled') return { handled: true, admin, reply: result.reply || 'Loyalty redemption could not be cancelled.' };
    return {
      handled: true,
      admin,
      reply: result.idempotent
        ? `Loyalty redemption #${match[1]} was already cancelled.`
        : `Loyalty redemption #${match[1]} cancelled. The reserved reward is available again.`,
    };
  }

  return {
    handled: true,
    admin,
    reply: [
      'Loyalty redemption commands:',
      '• Redeem loyalty CRM_ID | APPOINTMENT_ID',
      '• Confirm loyalty REDEMPTION_ID',
      '• Cancel loyalty REDEMPTION_ID',
      '',
      'A reward is only committed after the explicit CONFIRM LOYALTY step.',
    ].join('\n'),
  };
}

module.exports = { processAdminLoyaltyRedemptionMessage };
