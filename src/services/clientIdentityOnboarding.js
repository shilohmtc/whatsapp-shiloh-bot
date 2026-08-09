const { pool } = require("../db/pool");

function normalizePhone(value = "") {
  return String(value).replace(/[^0-9]/g, "");
}

function isGreetingOnly(text = "") {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|howzit|hiya)[!. ]*$/i.test(String(text).trim());
}

function isBookingRequest(text = "") {
  return /\b(book|booking|appointment|schedule|reserve)\b/i.test(String(text));
}

function isYes(text = "") {
  return /^(yes|y|correct|confirm|confirmed|right|that's right|that is right|ok|okay)$/i.test(String(text).trim());
}

function isNo(text = "") {
  return /^(no|n|nope|different|another number)$/i.test(String(text).trim());
}

function cleanName(text = "") {
  const value = String(text)
    .trim()
    .replace(/^my name is\s+/i, "")
    .replace(/^i am\s+/i, "")
    .replace(/^i'm\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim();
  if (!/^[A-Za-z][A-Za-z' -]{1,79}$/.test(value)) return null;
  return value.replace(/\s+/g, " ");
}

function parseDateOfBirth(text = "") {
  const value = String(text).trim();
  let year;
  let month;
  let day;

  let match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    year = Number(match[1]); month = Number(match[2]); day = Number(match[3]);
  } else {
    match = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (!match) return null;
    day = Number(match[1]); month = Number(match[2]); year = Number(match[3]);
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;

  const today = new Date();
  const oldest = new Date(Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate()));
  if (date > today || date < oldest) return null;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function maskedNumber(phone = "") {
  const normalized = normalizePhone(phone);
  return normalized.length >= 4 ? `ending in ${normalized.slice(-4)}` : "from this WhatsApp chat";
}

async function resolveClientByWhatsApp(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return { status: "none", clients: [] };

  const result = await pool.query(
    `SELECT DISTINCT c.id, c.display_name, c.date_of_birth, c.status,
            cc.id AS contact_id, cc.contact_type, cc.verified_at
       FROM clients c
       JOIN client_contacts cc ON cc.client_id = c.id
      WHERE cc.normalized_value = $1
        AND cc.contact_type IN ('whatsapp', 'mobile')
        AND c.status = 'active'
      ORDER BY c.id`,
    [normalized]
  );

  const byClient = new Map();
  for (const row of result.rows) {
    if (!byClient.has(String(row.id))) byClient.set(String(row.id), row);
    else if (row.contact_type === "whatsapp") byClient.set(String(row.id), row);
  }
  const clients = [...byClient.values()];
  if (clients.length === 0) return { status: "none", clients: [] };
  if (clients.length > 1) return { status: "ambiguous", clients };
  return { status: "unique", client: clients[0], clients };
}

function profileComplete(client) {
  return Boolean(client?.display_name && client?.date_of_birth && client?.verified_at);
}

async function getSession(phone) {
  const result = await pool.query(
    `SELECT phone, client_id, state, pending_name, pending_contact, pending_date_of_birth,
            booking_requested, created_at, updated_at
       FROM client_onboarding_sessions
      WHERE phone = $1`,
    [normalizePhone(phone)]
  );
  return result.rows[0] || null;
}

async function saveSession(phone, patch = {}) {
  const key = normalizePhone(phone);
  const current = (await getSession(key)) || {};
  const result = await pool.query(
    `INSERT INTO client_onboarding_sessions
       (phone, client_id, state, pending_name, pending_contact, pending_date_of_birth, booking_requested, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
     ON CONFLICT (phone) DO UPDATE SET
       client_id = EXCLUDED.client_id,
       state = EXCLUDED.state,
       pending_name = EXCLUDED.pending_name,
       pending_contact = EXCLUDED.pending_contact,
       pending_date_of_birth = EXCLUDED.pending_date_of_birth,
       booking_requested = EXCLUDED.booking_requested,
       updated_at = NOW()
     RETURNING *`,
    [
      key,
      patch.clientId ?? current.client_id ?? null,
      patch.state ?? current.state ?? "collect_name",
      patch.pendingName ?? current.pending_name ?? null,
      patch.pendingContact ?? current.pending_contact ?? key,
      patch.pendingDateOfBirth ?? current.pending_date_of_birth ?? null,
      patch.bookingRequested ?? current.booking_requested ?? false,
    ]
  );
  return result.rows[0];
}

function nextStateForClient(client) {
  if (!client?.display_name) return "collect_name";
  if (!client?.verified_at) return "confirm_whatsapp";
  if (!client?.date_of_birth) return "collect_dob";
  return "complete";
}

function promptForState(state, phone) {
  if (state === "collect_name") return "Before I can continue with your booking, please tell me your full name.";
  if (state === "confirm_whatsapp") return `I have your WhatsApp number ${maskedNumber(phone)}. Is this the best number for your bookings? Please reply yes or no.`;
  if (state === "collect_contact") return "Please send the best mobile number to use for your bookings, including the country code if applicable.";
  if (state === "collect_dob") return "Thank you. Please send your date of birth in DD/MM/YYYY format.";
  return null;
}

async function completeOnboarding(phone, session) {
  const key = normalizePhone(phone);
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    let clientId = session.client_id;

    if (clientId) {
      await db.query(
        `UPDATE clients
            SET display_name = COALESCE($2, display_name),
                date_of_birth = COALESCE($3::date, date_of_birth),
                updated_at = NOW()
          WHERE id = $1`,
        [clientId, session.pending_name, session.pending_date_of_birth]
      );
    } else {
      const created = await db.query(
        `INSERT INTO clients (display_name, date_of_birth, source)
         VALUES ($1, $2::date, 'whatsapp_onboarding')
         RETURNING id`,
        [session.pending_name, session.pending_date_of_birth]
      );
      clientId = created.rows[0].id;
    }

    const existingWhatsApp = await db.query(
      `SELECT id, client_id FROM client_contacts
        WHERE contact_type = 'whatsapp' AND normalized_value = $1`,
      [key]
    );

    if (existingWhatsApp.rowCount && String(existingWhatsApp.rows[0].client_id) !== String(clientId)) {
      const error = new Error("WhatsApp number belongs to another canonical client");
      error.code = "AMBIGUOUS_CONTACT";
      throw error;
    }

    if (existingWhatsApp.rowCount) {
      await db.query(
        `UPDATE client_contacts
            SET verified_at = COALESCE(verified_at, NOW()), updated_at = NOW()
          WHERE id = $1`,
        [existingWhatsApp.rows[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO client_contacts
          (client_id, contact_type, value, normalized_value, is_primary, verified_at)
         VALUES ($1, 'whatsapp', $2, $3, TRUE, NOW())`,
        [clientId, phone, key]
      );
    }

    const alternate = normalizePhone(session.pending_contact);
    if (alternate && alternate !== key) {
      const existingAlternate = await db.query(
        `SELECT client_id FROM client_contacts
          WHERE normalized_value = $1 AND contact_type IN ('mobile','whatsapp')
          LIMIT 1`,
        [alternate]
      );
      if (existingAlternate.rowCount && String(existingAlternate.rows[0].client_id) !== String(clientId)) {
        const error = new Error("Alternate number belongs to another canonical client");
        error.code = "AMBIGUOUS_CONTACT";
        throw error;
      }
      if (!existingAlternate.rowCount) {
        await db.query(
          `INSERT INTO client_contacts
            (client_id, contact_type, value, normalized_value, is_primary)
           VALUES ($1, 'mobile', $2, $3, TRUE)`,
          [clientId, session.pending_contact, alternate]
        );
      }
    }

    await db.query(
      `UPDATE client_onboarding_sessions
          SET client_id = $2, state = 'complete', updated_at = NOW()
        WHERE phone = $1`,
      [key, clientId]
    );
    await db.query("COMMIT");

    const client = await pool.query(
      `SELECT id, display_name, date_of_birth FROM clients WHERE id = $1`,
      [clientId]
    );
    return client.rows[0];
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}

async function processActiveSession(phone, text, session) {
  if (session.state === "collect_name") {
    const name = cleanName(text);
    if (!name) return { handled: true, reply: "Please send your full name, for example: Christel Botha." };
    const next = session.client_id ? "confirm_whatsapp" : "confirm_whatsapp";
    const updated = await saveSession(phone, { pendingName: name, state: next });
    return { handled: true, reply: promptForState(updated.state, phone) };
  }

  if (session.state === "confirm_whatsapp") {
    if (isNo(text)) {
      await saveSession(phone, { state: "collect_contact" });
      return { handled: true, reply: promptForState("collect_contact", phone) };
    }
    if (!isYes(text)) return { handled: true, reply: "Please reply yes if this WhatsApp number is the best booking number, or no if you want to provide another number." };

    const identity = await resolveClientByWhatsApp(phone);
    const known = identity.status === "unique" ? identity.client : null;
    const needsDob = !(session.pending_date_of_birth || known?.date_of_birth);
    if (needsDob) {
      await saveSession(phone, { state: "collect_dob", pendingContact: normalizePhone(phone) });
      return { handled: true, reply: promptForState("collect_dob", phone) };
    }
  }

  if (session.state === "collect_contact") {
    const contact = normalizePhone(text);
    if (contact.length < 8 || contact.length > 15) {
      return { handled: true, reply: "That number doesn't look valid. Please send the full mobile number, including the country code if applicable." };
    }
    await saveSession(phone, { pendingContact: contact, state: "collect_dob" });
    return { handled: true, reply: promptForState("collect_dob", phone) };
  }

  if (session.state === "collect_dob") {
    const dob = parseDateOfBirth(text);
    if (!dob) return { handled: true, reply: "Please send a valid date of birth in DD/MM/YYYY format, for example 14/05/1985." };
    session = await saveSession(phone, { pendingDateOfBirth: dob });
  }

  try {
    const client = await completeOnboarding(phone, session);
    return {
      handled: true,
      onboardingComplete: true,
      resumeBooking: Boolean(session.booking_requested),
      client,
      reply: `Thank you, ${client.display_name}. Your Shiloh client profile is ready. We can continue with your appointment booking now.`,
    };
  } catch (error) {
    if (error.code === "AMBIGUOUS_CONTACT" || error.code === "23505") {
      return {
        handled: true,
        reply: "I found an identity conflict with that contact number, so I won't merge any client records automatically. Please contact the clinic team so we can verify the correct profile safely.",
      };
    }
    throw error;
  }
}

async function processClientIdentityMessage(phone, text) {
  const existingSession = await getSession(phone);
  if (existingSession && existingSession.state !== "complete") {
    return processActiveSession(phone, text, existingSession);
  }

  const identity = await resolveClientByWhatsApp(phone);
  if (identity.status === "ambiguous") {
    if (isBookingRequest(text)) {
      return {
        handled: true,
        reply: "Welcome back to Shiloh. I found more than one possible client profile for this number, so I need to verify who I'm speaking with before making a booking. Please contact the clinic team for identity verification; I won't merge or select a profile automatically.",
      };
    }
    return { handled: false, identityStatus: "ambiguous" };
  }

  if (identity.status === "unique" && profileComplete(identity.client)) {
    if (isGreetingOnly(text)) {
      return {
        handled: true,
        identityStatus: "matched_complete",
        client: identity.client,
        reply: `Welcome back, ${identity.client.display_name} 👋 How can I help you today?`,
      };
    }
    return { handled: false, identityStatus: "matched_complete", client: identity.client };
  }

  if (!isBookingRequest(text)) {
    return {
      handled: false,
      identityStatus: identity.status === "unique" ? "matched_incomplete" : "unknown",
      client: identity.client,
    };
  }

  const known = identity.status === "unique" ? identity.client : null;
  const state = known ? nextStateForClient(known) : "collect_name";
  const session = await saveSession(phone, {
    clientId: known?.id || null,
    state,
    pendingName: known?.display_name || null,
    pendingContact: normalizePhone(phone),
    pendingDateOfBirth: known?.date_of_birth || null,
    bookingRequested: true,
  });

  return {
    handled: true,
    identityStatus: known ? "matched_incomplete" : "unknown",
    client: known,
    reply: known?.display_name
      ? `Welcome back, ${known.display_name}. Before I can continue with the booking, I need to complete your client profile. ${promptForState(session.state, phone)}`
      : `Welcome to Shiloh. Before I can make your first booking, I need to create your client profile. ${promptForState(session.state, phone)}`,
  };
}

module.exports = {
  normalizePhone,
  parseDateOfBirth,
  resolveClientByWhatsApp,
  profileComplete,
  processClientIdentityMessage,
};
