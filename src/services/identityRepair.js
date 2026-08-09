const { pool } = require("../db/pool");

async function repairJeanPierreIdentity() {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");

    const contacts = await db.query(`
      SELECT cc.id AS contact_id, cc.client_id, cc.value, cc.normalized_value,
             cc.contact_type, cc.verified_at, c.display_name, c.date_of_birth
        FROM client_contacts cc
        JOIN clients c ON c.id = cc.client_id
       WHERE RIGHT(cc.normalized_value, 4) = '8605'
         AND cc.contact_type IN ('mobile', 'whatsapp')
       ORDER BY cc.id
       FOR UPDATE
    `);

    if (contacts.rowCount !== 1) {
      throw new Error(`Expected exactly one canonical contact ending 8605, found ${contacts.rowCount}`);
    }

    const contact = contacts.rows[0];
    if (String(contact.display_name || "").toLowerCase() !== "christel") {
      throw new Error(`Expected 8605 contact to be linked to Christel, found ${contact.display_name || "unknown"}`);
    }

    const sessionResult = await db.query(`
      SELECT phone, client_id, pending_date_of_birth, state
        FROM client_onboarding_sessions
       WHERE phone = $1
       FOR UPDATE
    `, [contact.normalized_value]);

    if (sessionResult.rowCount !== 1) {
      throw new Error("Expected one onboarding session for the 8605 contact");
    }

    const session = sessionResult.rows[0];
    if (String(session.pending_date_of_birth) !== "1987-07-23") {
      throw new Error(`Unexpected onboarding DOB for 8605 contact: ${session.pending_date_of_birth}`);
    }

    const jeanPierreMatches = await db.query(`
      SELECT id, display_name, date_of_birth, status
        FROM clients
       WHERE LOWER(display_name) = LOWER('Jean-Pierre')
         AND status = 'active'
       ORDER BY id
       FOR UPDATE
    `);

    let jeanPierreId;
    if (jeanPierreMatches.rowCount > 1) {
      throw new Error(`Multiple active Jean-Pierre clients found: ${jeanPierreMatches.rowCount}`);
    }

    if (jeanPierreMatches.rowCount === 1) {
      const jeanPierre = jeanPierreMatches.rows[0];
      if (jeanPierre.date_of_birth && String(jeanPierre.date_of_birth) !== "1987-07-23") {
        throw new Error("Existing Jean-Pierre client has a conflicting date of birth");
      }
      jeanPierreId = jeanPierre.id;
      await db.query(`
        UPDATE clients
           SET date_of_birth = COALESCE(date_of_birth, DATE '1987-07-23'), updated_at = NOW()
         WHERE id = $1
      `, [jeanPierreId]);
    } else {
      const created = await db.query(`
        INSERT INTO clients (display_name, date_of_birth, source)
        VALUES ('Jean-Pierre', DATE '1987-07-23', 'identity_repair')
        RETURNING id
      `);
      jeanPierreId = created.rows[0].id;
    }

    const christelId = contact.client_id;

    await db.query(`
      UPDATE client_contacts
         SET client_id = $2, updated_at = NOW()
       WHERE id = $1
    `, [contact.contact_id, jeanPierreId]);

    await db.query(`
      UPDATE client_onboarding_sessions
         SET client_id = $2, state = 'complete', pending_name = 'Jean-Pierre', updated_at = NOW()
       WHERE phone = $1
    `, [contact.normalized_value, jeanPierreId]);

    await db.query(`
      UPDATE clients
         SET date_of_birth = NULL, updated_at = NOW()
       WHERE id = $1
         AND date_of_birth = DATE '1987-07-23'
    `, [christelId]);

    await db.query("COMMIT");

    return {
      repaired: true,
      contactId: contact.contact_id,
      contactSuffix: contact.normalized_value.slice(-4),
      christelClientId: christelId,
      jeanPierreClientId: jeanPierreId,
    };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}

module.exports = { repairJeanPierreIdentity };
