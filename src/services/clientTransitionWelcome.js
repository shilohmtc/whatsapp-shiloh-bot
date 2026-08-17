const { pool } = require('../db/pool');

const UNIVERSAL_WELCOME_VERSION = 'v2';
const UNIVERSAL_WELCOME_ATTRIBUTE = 'whatsapp_universal_welcome_v2_sent_at';

function normalizePhone(value = '') {
  return String(value).replace(/[^0-9]/g, '');
}

function isGreetingOnly(text = '') {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|howzit|hiya)[!. ]*$/i.test(String(text).trim());
}

function profileComplete(client = {}) {
  return Boolean(
    String(client.display_name || '').trim().split(/\s+/).filter(Boolean).length >= 2 &&
    client.date_of_birth &&
    client.gender
  );
}

function buildUniversalWelcome() {
  return [
    '🌿 *Welcome to Shiloh*',
    '',
    'Hello! You’ve reached *Shiloh Massage Therapy & Aesthetic Clinic*.',
    '',
    'If you’ve contacted us on this WhatsApp number before, *you’re in the right place*. 😊',
    '',
    'We’ve made a few changes to the way we assist our clients. This WhatsApp is now looked after by *Shiloh, our AI Assistant*, designed to make booking and getting assistance quicker and easier.',
    '',
    '*I’m Shiloh 👋 and I can help you with:*',
    '',
    '✨ *Choosing the right treatment* — tell me what you need, choose a treatment, or ask me for guidance.',
    '',
    '📅 *Checking availability* — I’ll check the clinic’s live schedule and available appointments for you.',
    '',
    '✅ *Making or managing your appointment* — book an appointment, manage an existing booking, and receive your appointment details right here on WhatsApp.',
    '',
    '*And don’t worry — Christel and the Shiloh team are still here. 🌿*',
    'If you need personal assistance or would prefer to speak to someone directly:',
    '',
    '📞 *Calls & SMS: 066 239 9138*',
    '',
    'Otherwise, simply continue chatting with me *right here on WhatsApp*, and I’ll be happy to assist you.',
  ].join('\n');
}

function buildRegisteredClientPrompt() {
  return [
    '✅ *You’re already registered with Shiloh.*',
    '',
    'There’s no need to register again. 😊',
    '',
    '*How would you like to proceed?*',
  ].join('\n');
}

function buildTransitionWelcome() {
  return `${buildUniversalWelcome()}\n\n${buildRegisteredClientPrompt()}`;
}

function registeredClientInteractive() {
  return {
    type: 'list',
    body: buildTransitionWelcome(),
    buttonText: 'Choose an option',
    rows: [
      { id: 'client_book_now', title: 'Book appointment', description: 'Start a new appointment booking' },
      { id: 'client_browse_services', title: 'Browse treatments', description: 'View Shiloh treatments and services' },
      { id: 'client_practitioners', title: 'Our practitioners', description: 'View client-bookable practitioners' },
      { id: 'main menu', title: 'Main menu', description: 'Open the standard Shiloh client menu' },
    ],
    sectionTitle: 'How would you like to proceed?',
  };
}

async function resolveExistingClient(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const result = await pool.query(
    `SELECT DISTINCT c.id,
            c.display_name,
            c.date_of_birth,
            c.custom_attributes->>'gender' AS gender,
            c.custom_attributes->>'${UNIVERSAL_WELCOME_ATTRIBUTE}' AS universal_welcome_sent_at
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

async function markUniversalWelcomeSent(clientId) {
  await pool.query(
    `UPDATE clients
        SET custom_attributes = COALESCE(custom_attributes, '{}'::jsonb)
            || jsonb_build_object('${UNIVERSAL_WELCOME_ATTRIBUTE}', NOW()::text),
            updated_at = NOW()
      WHERE id = $1
        AND COALESCE(custom_attributes->>'${UNIVERSAL_WELCOME_ATTRIBUTE}', '') = ''`,
    [clientId]
  );
}

async function processClientTransitionWelcome(phone, text) {
  if (!isGreetingOnly(text)) return { handled: false };
  const client = await resolveExistingClient(phone);
  if (!client || !profileComplete(client) || client.universal_welcome_sent_at) return { handled: false };
  return {
    handled: true,
    interactive: registeredClientInteractive(),
    client,
    postSend: async () => markUniversalWelcomeSent(client.id),
  };
}

module.exports = {
  UNIVERSAL_WELCOME_VERSION,
  UNIVERSAL_WELCOME_ATTRIBUTE,
  normalizePhone,
  isGreetingOnly,
  profileComplete,
  buildUniversalWelcome,
  buildRegisteredClientPrompt,
  buildTransitionWelcome,
  registeredClientInteractive,
  processClientTransitionWelcome,
};
