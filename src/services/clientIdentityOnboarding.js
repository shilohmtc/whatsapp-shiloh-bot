const { pool } = require("../db/pool");
const { registrationStatus, assertRegistrationComplete } = require("./clientRegistrationPolicy");

function normalizePhone(value = "") { return String(value).replace(/[^0-9]/g, ""); }
function normalizeRegistrationMobile(value = "") {
  const digits = normalizePhone(value);
  if (/^0\d{9}$/.test(digits)) return `27${digits.slice(1)}`;
  if (/^27\d{9}$/.test(digits)) return digits;
  if (/^0027\d{9}$/.test(digits)) return digits.slice(2);
  return null;
}
function looksLikeRegistrationMobileInput(value = "") {
  return /^(?:\+?27|0027|0)[\d\s-]+$/.test(String(value).trim());
}
function isGreetingOnly(text = "") { return /^(hi|hello|hey|good morning|good afternoon|good evening|howzit|hiya)[!. ]*$/i.test(String(text).trim()); }
function isBookingRequest(text = "") { return /\b(book|booking|appointment|schedule|reserve)\b/i.test(String(text)); }
function isWalkinRegistrationRequest(text = "") { return /\b(register|registration|walk[- ]?in|visiting the clinic)\b/i.test(String(text)); }
function cleanName(text = "") {
  const value = String(text).trim()
    .replace(/^my name is\s+/i, "")
    .replace(/^i am\s+/i, "")
    .replace(/^i'm\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim();
  if (!/^[A-Za-z][A-Za-z' -]{0,79}$/.test(value)) return null;
  return value.replace(/\s+/g, " ");
}
function parseDateOfBirth(text = "") {
  const value = String(text).trim();
  let year, month, day;
  let m = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) { year = +m[1]; month = +m[2]; day = +m[3]; }
  else {
    m = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (m) { day = +m[1]; month = +m[2]; year = +m[3]; }
    else {
      m = value.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/);
      if (!m) return null;
      const months = { jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,oct:10,october:10,nov:11,november:11,dec:12,december:12 };
      day = +m[1]; month = months[m[2].toLowerCase()]; year = +m[3];
      if (!month) return null;
    }
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  const today = new Date();
  const oldest = new Date(Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate()));
  if (date > today || date < oldest) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function normalizeGender(value = "") {
  const raw = String(value).trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (["female", "woman"].includes(raw)) return "female";
  if (["male", "man"].includes(raw)) return "male";
  if (["non binary", "nonbinary"].includes(raw)) return "non-binary";
  if (raw === "other") return "other";
  if (["prefer not to say", "prefer not to answer"].includes(raw)) return "prefer_not_to_say";
  return null;
}
function extractWhatsAppRegistration(text = "") {
  const source = String(text || "").trim();
  if (!source) return {};
  const result = {};
  const dobMatch = source.match(/\b\d{4}-\d{1,2}-\d{1,2}\b|\b\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\b|\b\d{1,2}\s+[A-Za-z]+,?\s+\d{4}\b/);
  if (dobMatch) {
    const dob = parseDateOfBirth(dobMatch[0]);
    if (dob) result.dateOfBirth = dob;
  }
  const genderMatch = source.match(/\b(prefer not to (?:say|answer)|non[- ]?binary|female|woman|male|man|other)\b/i);
  if (genderMatch) {
    const gender = normalizeGender(genderMatch[0]);
    if (gender) result.gender = gender;
  }
  let nameText = source;
  if (dobMatch) nameText = nameText.replace(dobMatch[0], " ");
  if (genderMatch) nameText = nameText.replace(genderMatch[0], " ");
  nameText = nameText
    .replace(/\b(?:my\s+name\s+is|full\s+name|first\s+name|surname|name|dob|date\s+of\s+birth|gender)\b\s*[:=-]?/gi, " ")
    .replace(/[\n\r,;|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const fullName = nameText ? cleanName(nameText) : null;
  if (fullName) result.fullName = fullName;
  return result;
}
function extractBundledRegistration(text = "") {
  const parsed = extractWhatsAppRegistration(text);
  if (!parsed.fullName || !parsed.dateOfBirth) return null;
  return { fullName: parsed.fullName, mobileNumber: null, dateOfBirth: parsed.dateOfBirth, gender: parsed.gender || null };
}
function hasSurname(name = "") { return String(name).trim().split(/\s+/).filter(Boolean).length >= 2; }
function mergeName(existing, incoming) {
  const current = cleanName(existing || "");
  const next = cleanName(incoming || "");
  if (!next) return current;
  if (!current) return next;
  if (hasSurname(next)) return next;
  if (!hasSurname(current) && current.toLowerCase() !== next.toLowerCase()) return `${current} ${next}`;
  return current;
}
function firstName(name = "") { return String(name).trim().split(/\s+/)[0] || "there"; }

const PREMIUM_GREETING = [
  "Hi 👋 Welcome to *Shiloh Massage Therapy & Aesthetic Clinic*. 🌿",
  "",
  "I’m *Shiloh*, your smart booking assistant.",
  "",
  "I can help you find the right treatment, check availability, make or manage a booking, and keep everything quick and easy.",
].join("\n");

const REGISTRATION_START_PROMPT = [
  "It looks like you’re not registered with us yet. 🌿",
  "Let’s get you registered first — it will only take a moment.",
  "",
  "Please send me your *first name, surname, date of birth and gender*.",
  "You can send everything in one message, for example:",
  "*Sarah Smith, 14 May 1990, Female*",
].join("\n");

let onboardingSchemaPromise = null;
async function ensureOnboardingSchema() {
  if (!onboardingSchemaPromise) {
    onboardingSchemaPromise = (async () => {
      await pool.query(`ALTER TABLE client_onboarding_sessions ADD COLUMN IF NOT EXISTS pending_gender TEXT`);
      await pool.query(`ALTER TABLE client_onboarding_sessions DROP CONSTRAINT IF EXISTS client_onboarding_state_check`);
      await pool.query(`ALTER TABLE client_onboarding_sessions ADD CONSTRAINT client_onboarding_state_check CHECK (state IN ('collect_name','confirm_whatsapp','collect_contact','collect_dob','collect_gender','complete'))`);
    })().catch((error) => { onboardingSchemaPromise = null; throw error; });
  }
  return onboardingSchemaPromise;
}

async function resolveClientByWhatsApp(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return { status: "none", clients: [] };
  const r = await pool.query(`SELECT DISTINCT c.id,c.display_name,c.date_of_birth,c.status,c.custom_attributes->>'gender' AS gender,cc.id AS contact_id,cc.contact_type,cc.normalized_value,cc.verified_at FROM clients c JOIN client_contacts cc ON cc.client_id=c.id WHERE cc.normalized_value=$1 AND cc.contact_type IN ('whatsapp','mobile') AND c.status='active' ORDER BY c.id`, [normalized]);
  const by = new Map();
  for (const row of r.rows) {
    if (!by.has(String(row.id))) by.set(String(row.id), row);
    else if (row.contact_type === "whatsapp") by.set(String(row.id), row);
  }
  const clients = [...by.values()];
  if (!clients.length) return { status: "none", clients: [] };
  if (clients.length > 1) return { status: "ambiguous", clients };
  return { status: "unique", client: clients[0], clients };
}
function profileComplete(client) {
  return registrationStatus({ fullName: client?.display_name, mobileNumber: client?.normalized_value, dateOfBirth: client?.date_of_birth }).complete;
}

async function getSession(phone) {
  await ensureOnboardingSchema();
  const r = await pool.query(`SELECT phone,client_id,state,pending_name,pending_contact,pending_date_of_birth,pending_gender,booking_requested,created_at,updated_at FROM client_onboarding_sessions WHERE phone=$1`, [normalizePhone(phone)]);
  return r.rows[0] || null;
}
async function saveSession(phone, patch = {}) {
  await ensureOnboardingSchema();
  const key = normalizePhone(phone);
  const c = (await getSession(key)) || {};
  const r = await pool.query(`INSERT INTO client_onboarding_sessions (phone,client_id,state,pending_name,pending_contact,pending_date_of_birth,pending_gender,booking_requested,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) ON CONFLICT (phone) DO UPDATE SET client_id=EXCLUDED.client_id,state=EXCLUDED.state,pending_name=EXCLUDED.pending_name,pending_contact=EXCLUDED.pending_contact,pending_date_of_birth=EXCLUDED.pending_date_of_birth,pending_gender=EXCLUDED.pending_gender,booking_requested=EXCLUDED.booking_requested,updated_at=NOW() RETURNING *`, [key,patch.clientId??c.client_id??null,patch.state??c.state??"collect_name",patch.pendingName??c.pending_name??null,patch.pendingContact??c.pending_contact??key,patch.pendingDateOfBirth??c.pending_date_of_birth??null,patch.pendingGender??c.pending_gender??null,patch.bookingRequested??c.booking_requested??false]);
  return r.rows[0];
}
function nextState(session = {}) {
  if (!session.pending_name || !hasSurname(session.pending_name)) return "collect_name";
  if (!session.pending_date_of_birth) return "collect_dob";
  if (!session.pending_gender) return "collect_gender";
  return "complete";
}
function promptForMissing(session = {}) {
  const name = session.pending_name || "";
  const missing = [];
  if (!name) missing.push("your first name and surname");
  else if (!hasSurname(name)) missing.push("your surname");
  if (!session.pending_date_of_birth) missing.push("your date of birth");
  if (!session.pending_gender) missing.push("your gender");
  if (!missing.length) return null;
  const prefix = name ? `Thanks, ${firstName(name)}. ` : "";
  return `${prefix}Please send ${missing.join(missing.length > 1 ? ", " : "")}. You can send the remaining details together in one message.`;
}

async function completeOnboarding(phone, session) {
  const key = normalizePhone(phone);
  if (!session.pending_gender) {
    const e = new Error("Client registration is incomplete: missing gender");
    e.code = "CLIENT_REGISTRATION_INCOMPLETE";
    throw e;
  }
  assertRegistrationComplete({ fullName: session.pending_name, mobileNumber: key, dateOfBirth: session.pending_date_of_birth });
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    let clientId = session.client_id;
    if (clientId) {
      await db.query(`UPDATE clients SET display_name=COALESCE($2,display_name),date_of_birth=COALESCE($3::date,date_of_birth),custom_attributes=COALESCE(custom_attributes,'{}'::jsonb) || jsonb_build_object('gender',$4::text),updated_at=NOW() WHERE id=$1`, [clientId, session.pending_name, session.pending_date_of_birth, session.pending_gender]);
    } else {
      const created = await db.query(`INSERT INTO clients (display_name,date_of_birth,custom_attributes,source) VALUES ($1,$2::date,jsonb_build_object('gender',$3::text),'whatsapp_onboarding') RETURNING id`, [session.pending_name, session.pending_date_of_birth, session.pending_gender]);
      clientId = created.rows[0].id;
    }
    const existing = await db.query(`SELECT id,client_id FROM client_contacts WHERE normalized_value=$1 AND contact_type IN ('whatsapp','mobile') LIMIT 1`, [key]);
    if (existing.rowCount && String(existing.rows[0].client_id) !== String(clientId)) {
      const e = new Error("WhatsApp number belongs to another canonical client"); e.code = "AMBIGUOUS_CONTACT"; throw e;
    }
    if (existing.rowCount) {
      await db.query(`UPDATE client_contacts SET verified_at=COALESCE(verified_at,NOW()),updated_at=NOW() WHERE id=$1`, [existing.rows[0].id]);
    } else {
      await db.query(`INSERT INTO client_contacts (client_id,contact_type,value,normalized_value,is_primary,verified_at) VALUES ($1,'whatsapp',$2,$3,TRUE,NOW())`, [clientId, phone, key]);
    }
    await db.query(`UPDATE client_onboarding_sessions SET client_id=$2,state='complete',updated_at=NOW() WHERE phone=$1`, [key, clientId]);
    await db.query("COMMIT");
    const client = await pool.query(`SELECT c.id,c.display_name,c.date_of_birth,c.custom_attributes->>'gender' AS gender,cc.normalized_value,cc.verified_at FROM clients c JOIN client_contacts cc ON cc.client_id=c.id AND cc.normalized_value=$2 WHERE c.id=$1 LIMIT 1`, [clientId, key]);
    return client.rows[0];
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally { db.release(); }
}

async function processActiveSession(phone, text, session) {
  const parsed = extractWhatsAppRegistration(text);
  const pendingName = mergeName(session.pending_name, parsed.fullName);
  const pendingDateOfBirth = parsed.dateOfBirth || session.pending_date_of_birth || null;
  const pendingGender = parsed.gender || session.pending_gender || null;
  const candidate = { ...session, pending_name: pendingName, pending_date_of_birth: pendingDateOfBirth, pending_gender: pendingGender };
  const state = nextState(candidate);
  session = await saveSession(phone, { pendingName, pendingDateOfBirth, pendingGender, state });
  if (state !== "complete") return { handled: true, reply: promptForMissing(session) };
  try {
    const client = await completeOnboarding(phone, session);
    return { handled: true, onboardingComplete: true, resumeBooking: true, client, reply: `Thank you, ${client.display_name}. 🌿 Your Shiloh client registration is complete.` };
  } catch (error) {
    if (error.code === "AMBIGUOUS_CONTACT" || error.code === "23505") return { handled: true, reply: "I found an identity conflict with this WhatsApp number, so I won’t merge any client records automatically. Please contact the clinic team so we can verify the correct profile safely." };
    throw error;
  }
}

async function processClientIdentityMessage(phone, text) {
  const existingSession = await getSession(phone);
  if (existingSession && existingSession.state !== "complete") return processActiveSession(phone, text, existingSession);

  const identity = await resolveClientByWhatsApp(phone);
  const bookingRequest = isBookingRequest(text);
  const walkinRequest = isWalkinRegistrationRequest(text);

  if (identity.status === "ambiguous") {
    return { handled: true, identityStatus: "ambiguous", reply: "I found more than one possible Shiloh client profile for this WhatsApp number, so the clinic team needs to verify the correct profile before we continue. I won’t merge or select a profile automatically." };
  }

  if (identity.status === "unique" && profileComplete(identity.client)) {
    if (isGreetingOnly(text) || walkinRequest) {
      return { handled: true, identityStatus: "matched_complete", onboardingComplete: true, resumeBooking: true, client: identity.client, reply: `${PREMIUM_GREETING}\n\nWelcome back, *${firstName(identity.client.display_name)}* 🌿` };
    }
    return { handled: false, identityStatus: "matched_complete", client: identity.client };
  }

  const known = identity.status === "unique" ? identity.client : null;
  const sessionSeed = {
    clientId: known?.id || null,
    state: "collect_name",
    pendingName: known?.display_name || null,
    pendingContact: normalizePhone(phone),
    pendingDateOfBirth: known?.date_of_birth || null,
    pendingGender: known?.gender || null,
    bookingRequested: true,
  };
  sessionSeed.state = nextState({ pending_name: sessionSeed.pendingName, pending_date_of_birth: sessionSeed.pendingDateOfBirth, pending_gender: sessionSeed.pendingGender });
  const session = await saveSession(phone, sessionSeed);

  const parsed = extractWhatsAppRegistration(text);
  if (!isGreetingOnly(text) && !bookingRequest && !walkinRequest && (parsed.dateOfBirth || parsed.gender)) {
    return processActiveSession(phone, text, session);
  }

  if (known) {
    return { handled: true, identityStatus: "matched_incomplete", client: known, reply: `Welcome back, *${firstName(known.display_name)}*. 🌿 I just need to complete your Shiloh client registration.\n\n${promptForMissing(session)}` };
  }
  return { handled: true, identityStatus: "unknown", reply: `${PREMIUM_GREETING}\n\n${REGISTRATION_START_PROMPT}` };
}

module.exports = {
  normalizePhone,
  normalizeRegistrationMobile,
  looksLikeRegistrationMobileInput,
  parseDateOfBirth,
  normalizeGender,
  extractWhatsAppRegistration,
  extractBundledRegistration,
  resolveClientByWhatsApp,
  profileComplete,
  processClientIdentityMessage,
  PREMIUM_GREETING,
  REGISTRATION_START_PROMPT,
};