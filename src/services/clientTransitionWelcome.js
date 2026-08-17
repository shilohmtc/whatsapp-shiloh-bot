const { pool } = require('../db/pool');
const { processClientIdentityMessage, REGISTRATION_START_PROMPT } = require('./clientIdentityOnboarding');

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

function buildNewClientPrompt() {
  return [
    '🌿 *It looks like you’re new to Shiloh.*',
    '',
    'Before I can make or manage appointments for you, I’ll help you complete a quick registration.',
    '',
    '*Let’s get you registered.*',
    '',
    REGISTRATION_START_PROMPT,
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

let welcomeSchemaPromise = null;
async function ensureWelcomeSchema() {
  if (!welcomeSchemaPromise) {
    welcomeSchemaPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS client_whatsapp_welcome_deliveries (
        phone TEXT NOT NULL,
        welcome_version TEXT NOT NULL,
        sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (phone, welcome_version)
      )
    `).catch((error) => {
      welcomeSchemaPromise = null;
      throw error;
    });
  }
  return welcomeSchemaPromise;
}

async function resolveClientState(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return { status: 'none', clients: [] };
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
  if (!result.rowCount) return { status: 'none', clients: [] };
  if (result.rowCount > 1) return { status: 'ambiguous', clients: result.rows };
  return { status: 'unique', client: result.rows[0], clients: result.rows };
}

async function welcomeAlreadyDelivered(phone) {
  await ensureWelcomeSchema();
  const result = await pool.query(
    `SELECT 1
       FROM client_whatsapp_welcome_deliveries
      WHERE phone = $1
        AND welcome_version = $2
      LIMIT 1`,
    [normalizePhone(phone), UNIVERSAL_WELCOME_VERSION]
  );
  return result.rowCount > 0;
}

async function pendingOnboardingSession(phone) {
  const result = await pool.query(
    `SELECT state
       FROM client_onboarding_sessions
      WHERE phone = $1
        AND state <> 'complete'
      LIMIT 1`,
    [normalizePhone(phone)]
  );
  return result.rowCount > 0;
}

async function markUniversalWelcomeSent(phone, clientId = null) {
  await ensureWelcomeSchema();
  const normalized = normalizePhone(phone);
  await pool.query(
    `INSERT INTO client_whatsapp_welcome_deliveries (phone, welcome_version, sent_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (phone, welcome_version) DO NOTHING`,
    [normalized, UNIVERSAL_WELCOME_VERSION]
  );
  if (clientId) {
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
}

async function processClientTransitionWelcome(phone, text) {
  if (!isGreetingOnly(text)) return { handled: false };

  const clientState = await resolveClientState(phone);
  if (clientState.status === 'ambiguous') return { handled: false };

  if (await welcomeAlreadyDelivered(phone)) {
    if (clientState.status === 'none' && await pendingOnboardingSession(phone)) {
      return {
        handled: true,
        reply: '🌿 We’ve already started your Shiloh registration. Please send your *first name, surname, date of birth and gender* so I can continue.',
      };
    }
    return { handled: false };
  }

  if (clientState.status === 'unique') {
    const client = clientState.client;
    if (!profileComplete(client)) return { handled: false };
    return {
      handled: true,
      interactive: registeredClientInteractive(),
      client,
      postSend: async () => markUniversalWelcomeSent(phone, client.id),
    };
  }

  const identity = await processClientIdentityMessage(phone, text);
  if (!identity.handled || identity.identityStatus !== 'unknown') return identity;
  return {
    handled: true,
    reply: `${buildUniversalWelcome()}\n\n${buildNewClientPrompt()}`,
    identityStatus: 'unknown',
    postSend: async () => markUniversalWelcomeSent(phone),
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
  buildNewClientPrompt,
  buildTransitionWelcome,
  registeredClientInteractive,
  processClientTransitionWelcome,
};
