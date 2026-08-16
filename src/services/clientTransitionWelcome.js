const { pool } = require('../db/pool');

function normalizePhone(value = '') {
  return String(value).replace(/[^0-9]/g, '');
}

function isGreetingOnly(text = '') {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|howzit|hiya)[!. ]*$/i.test(String(text).trim());
}

function firstName(name = '') {
  return String(name).trim().split(/\s+/)[0] || 'there';
}

function profileComplete(client = {}) {
  return Boolean(
    String(client.display_name || '').trim().split(/\s+/).filter(Boolean).length >= 2 &&
    client.date_of_birth &&
    client.gender
  );
}

function buildTransitionWelcome(displayName = '') {
  const name = firstName(displayName);
  return [
    '🌿 *Welcome to Shiloh*',
    '',
    `Hello, *${name}*! You’ve reached *Shiloh Massage Therapy & Aesthetic Clinic*.` ,
    '',
    'If you’ve contacted us on this WhatsApp number before, *you’re in the right place*. 😊',
    '',
    'We’ve simply made a few changes to the way we assist our clients. This WhatsApp is now looked after by *Shiloh, our AI assistant*, designed to make booking and getting assistance quicker and easier.',
    '',
    '*I’m Shiloh 👋 and I can help you with:*',
    '',
    '✨ *Choosing the right treatment* — tell me what you need, choose a treatment, or ask me for guidance.',
    '',
    '📅 *Checking availability* — I’ll check the clinic’s live booking schedule and available appointments for you.',
    '',
    '✅ *Making or managing your booking* — book an appointment and receive your confirmation right here on WhatsApp.',
    '',
    '*And don’t worry — Christel and the Shiloh team are still here. 🌿*',
    'If you need personal assistance or would prefer to speak to someone directly, you’re welcome to contact the clinic on:',
    '',
    '📞 *Calls & SMS: 066 239 9138*',
    '',
    'Otherwise, simply continue chatting with me *right here on WhatsApp*, and I’ll be happy to assist you.',
    '',
    '*What can I help you with today? 🌿*',
  ].join('\n');
}

async function resolveExistingClient(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const result = await pool.query(
    `SELECT DISTINCT c.id,
            c.display_name,
            c.date_of_birth,
            c.custom_attributes->>'gender' AS gender,
            c.custom_attributes->>'whatsapp_transition_welcome_sent_at' AS transition_welcome_sent_at
       FROM clients c
       JOIN client_contacts cc ON cc.client_id = c.id
      WHERE cc.normalized_value = $1
        AND cc.contact_type IN ('whatsapp','mobile')
        AND c.status = 'active'
      ORDER BY c.id`,
    [normalized]
  );
  if (result.rowCount !== 1) return null;
  return result.rows[0];
}

async function markTransitionWelcomeSent(clientId) {
  await pool.query(
    `UPDATE clients
        SET custom_attributes = COALESCE(custom_attributes, '{}'::jsonb)
            || jsonb_build_object('whatsapp_transition_welcome_sent_at', NOW()::text),
            updated_at = NOW()
      WHERE id = $1
        AND COALESCE(custom_attributes->>'whatsapp_transition_welcome_sent_at', '') = ''`,
    [clientId]
  );
}

async function processClientTransitionWelcome(phone, text) {
  if (!isGreetingOnly(text)) return { handled: false };
  const client = await resolveExistingClient(phone);
  if (!client || !profileComplete(client) || client.transition_welcome_sent_at) return { handled: false };
  return {
    handled: true,
    reply: buildTransitionWelcome(client.display_name),
    client,
    postSend: async () => markTransitionWelcomeSent(client.id),
  };
}

module.exports = {
  normalizePhone,
  isGreetingOnly,
  profileComplete,
  buildTransitionWelcome,
  processClientTransitionWelcome,
};
