const { pool } = require('../db/pool');
const { normalizePhone, processClientIdentityMessage, PREMIUM_GREETING } = require('./clientIdentityOnboarding');
const { processBookingMessage, getIntent, clearIntent, verifyService } = require('./bookingIntent');
const { processBookingPolicyMessage, sanitizeBookingReply } = require('./bookingPolicy');
const { guardClientFreelancerBooking } = require('./clientBookingStaffGuard');
const { prepareAdminBooking, confirmAdminBooking, cancelPendingBooking } = require('./adminBooking');
const { cancelBookingEvent } = require('./googleBookingCalendar');

const DEMO_START = /^(demo client|client demo|start client demo|start demo client)$/i;
const DEMO_EXIT = /^(exit demo|end demo|admin mode|back to admin)$/i;
const DEMO_DELETE = /^(delete demo booking|remove demo booking|purge demo booking)$/i;
const DEMO_DELETE_CONFIRM = /^(confirm delete demo booking|confirm demo deletion)$/i;
const BOOKING_CONFIRM = /^(confirm booking|yes|confirm)$/i;
const BOOKING_CANCEL = /^(cancel booking|cancel demo booking|0)$/i;

function clean(value = '') { return String(value).trim().replace(/\s+/g, ' '); }

async function getAdmin(sender) {
  const r = await pool.query(
    `SELECT id, display_name, business_role, service_scope, permissions
       FROM staff_admin_accounts
      WHERE normalized_whatsapp=$1 AND active=TRUE`,
    [normalizePhone(sender)]
  );
  return r.rows[0] || null;
}

function allowed(admin) { return admin?.permissions?.['demo:client'] === true; }

async function getSession(adminId) {
  const r = await pool.query(`SELECT * FROM admin_client_demo_sessions WHERE admin_id=$1`, [adminId]);
  return r.rows[0] || null;
}

function newVirtualPhone(adminId) {
  return `99999999${Date.now()}${String(adminId).padStart(4, '0')}`.slice(0, 31);
}

async function cleanupConversationArtifacts(virtualPhone) {
  if (!virtualPhone) return;
  await pool.query(`DELETE FROM booking_intents WHERE phone=$1`, [virtualPhone]);
  await pool.query(`DELETE FROM client_onboarding_sessions WHERE phone=$1`, [virtualPhone]);
  await pool.query(`DELETE FROM booking_policy_acceptances WHERE phone=$1`, [virtualPhone]);
}

async function archiveUnusedDemoClient(session) {
  if (!session?.demo_client_id) return;
  await pool.query(
    `UPDATE clients
        SET status='inactive', updated_at=NOW(),
            custom_attributes=COALESCE(custom_attributes,'{}'::jsonb) ||
              jsonb_build_object('demo_cleanup','unused_demo_session','demo_cleanup_at',NOW()::text)
      WHERE id=$1
        AND source='whatsapp_demo'
        AND NOT EXISTS (SELECT 1 FROM appointments WHERE client_id=$1)`,
    [session.demo_client_id]
  );
}

async function startDemo(admin, sender) {
  const existing = await getSession(admin.id);
  if (existing?.demo_appointment_id) {
    const appt = await pool.query(`SELECT id FROM appointments WHERE id=$1`, [existing.demo_appointment_id]);
    if (appt.rowCount) {
      return {
        handled: true,
        reply: `A demo booking is still linked to this demo session (appointment #${existing.demo_appointment_id}). Send *DELETE DEMO BOOKING* first so the next demonstration starts as a clean first-time client.`,
      };
    }
  }

  if (existing) {
    await cancelPendingBooking(admin.id);
    await cleanupConversationArtifacts(existing.virtual_phone);
    await archiveUnusedDemoClient(existing);
  }

  const virtualPhone = newVirtualPhone(admin.id);
  await pool.query(
    `INSERT INTO admin_client_demo_sessions
       (admin_id, normalized_whatsapp, virtual_phone, active, state, demo_client_id, demo_appointment_id, pending_staff_name, delete_pending, updated_at)
     VALUES ($1,$2,$3,TRUE,'client',NULL,NULL,NULL,FALSE,NOW())
     ON CONFLICT (admin_id) DO UPDATE SET
       normalized_whatsapp=EXCLUDED.normalized_whatsapp,
       virtual_phone=EXCLUDED.virtual_phone,
       active=TRUE,
       state='client',
       demo_client_id=NULL,
       demo_appointment_id=NULL,
       pending_staff_name=NULL,
       delete_pending=FALSE,
       created_at=NOW(),
       updated_at=NOW()`,
    [admin.id, normalizePhone(sender), virtualPhone]
  );
  await pool.query(
    `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,metadata)
     VALUES ($1,'admin.client_demo_started','admin_demo',$2::jsonb)`,
    [admin.id, JSON.stringify({ isolatedVirtualIdentity: true })]
  );
  return { handled: true, reply: PREMIUM_GREETING };
}

async function tagDemoClient(admin, session, clientId) {
  await pool.query(
    `UPDATE clients
        SET source='whatsapp_demo',
            custom_attributes=COALESCE(custom_attributes,'{}'::jsonb) ||
              jsonb_build_object('demo_admin_id',$2::text,'demo_owner',$3::text,'demo_only',true),
            updated_at=NOW()
      WHERE id=$1`,
    [clientId, admin.id, admin.display_name]
  );
  await pool.query(
    `UPDATE admin_client_demo_sessions
        SET demo_client_id=$2, updated_at=NOW()
      WHERE admin_id=$1 AND virtual_phone=$3`,
    [admin.id, clientId, session.virtual_phone]
  );
}

function practitionerName(text) {
  const v = clean(text).toLowerCase();
  if (/\bchristel(?:\s+botha)?\b/.test(v)) return 'Christel';
  if (/\babigail\b/.test(v)) return 'Abigail';
  if (/\bmarietjie\b|\bmariethie\b/.test(v)) return 'Marietjie';
  return null;
}

function exactTime(value) {
  const v = clean(value).toLowerCase();
  let hour;
  let minute;
  let meridiem = null;
  let m = v.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (m) {
    hour = Number(m[1]);
    minute = Number(m[2]);
    meridiem = m[3] || null;
  } else {
    m = v.match(/^(\d{1,2})\s*(am|pm)$/);
    if (!m) return null;
    hour = Number(m[1]);
    minute = 0;
    meridiem = m[2];
  }
  if (minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === 'pm' && hour !== 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
  } else if (hour > 23) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function localDateTime(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return null;
  const clock = exactTime(time);
  if (!clock) return null;
  const [y,m,d] = date.split('-');
  return `${d}/${m}/${y} ${clock}`;
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).format(new Date(iso));
}
function formatTime(iso) {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date(iso));
}

async function prepareDemoBooking(admin, session, requestedStaff) {
  const intent = await getIntent(session.virtual_phone);
  if (!intent || intent.status !== 'policy_accepted') {
    return { handled: true, reply: 'The demo booking details are no longer in a confirmed policy-accepted state. Send *I want to book an appointment* to start the booking again.' };
  }
  const staffName = practitionerName(requestedStaff || intent.therapist_text || '');
  if (!staffName) {
    await pool.query(`UPDATE admin_client_demo_sessions SET state='collect_practitioner',updated_at=NOW() WHERE admin_id=$1`, [admin.id]);
    return { handled: true, reply: 'Which practitioner would you prefer: *Christel*, *Abigail* or *Marietjie*?' };
  }
  const when = localDateTime(intent.preferred_date, intent.preferred_time);
  if (!when) {
    return { handled: true, reply: 'For this demonstration I need an exact appointment time, for example *14:30*. Send a new booking request with an exact time so I can verify the real schedule safely.' };
  }
  const service = await verifyService(intent.service_text);
  if (!service.verified || !service.canonicalName) {
    return { handled: true, reply: 'I can no longer verify that treatment against Shiloh’s active service catalogue. Please start the booking again with a current treatment name.' };
  }
  const current = await getSession(admin.id);
  const clientId = current?.demo_client_id;
  if (!clientId) return { handled: true, reply: 'The demo client identity is incomplete, so I will not create an appointment. Restart with *DEMO CLIENT*.' };

  const prepared = await prepareAdminBooking({
    adminId: admin.id,
    clientId,
    staffName,
    serviceName: service.canonicalName,
    localDateTime: when,
  });
  if (prepared.status !== 'pending_confirmation') {
    return { handled: true, reply: prepared.reply || 'That appointment cannot be booked safely. Please choose another time or practitioner.' };
  }

  await pool.query(
    `UPDATE admin_client_demo_sessions
        SET state='awaiting_booking_confirmation',pending_staff_name=$2,updated_at=NOW()
      WHERE admin_id=$1`,
    [admin.id, staffName]
  );
  return {
    handled: true,
    reply: [
      'Great — that appointment is available. 🌿',
      '',
      `✨ *Service:* ${prepared.service.name}`,
      `👤 *With:* ${prepared.staff.display_name}`,
      `📅 *Date:* ${formatDate(prepared.startsAt)}`,
      `🕙 *Time:* ${formatTime(prepared.startsAt)}–${formatTime(prepared.endsAt)}`,
      '',
      'Reply *CONFIRM BOOKING* to book it, or *CANCEL BOOKING* to stop.',
    ].join('\n'),
  };
}

async function confirmDemoBooking(admin, session) {
  const intent = await getIntent(session.virtual_phone);
  const result = await confirmAdminBooking(admin, { source: 'shiloh_demo_whatsapp' });
  if (result.status !== 'created') return { handled: true, reply: result.reply };

  const tagged = await pool.query(
    `UPDATE appointments
        SET notes=COALESCE(notes || E'\n','') || 'Controlled Christel WhatsApp client demonstration',
            updated_at=NOW()
      WHERE id=$1 AND client_id=$2 AND source='shiloh_demo_whatsapp'
      RETURNING id`,
    [result.appointmentId, session.demo_client_id]
  );
  if (!tagged.rowCount) throw new Error('Demo booking source verification failed after canonical creation');

  await pool.query(
    `UPDATE admin_client_demo_sessions
        SET active=FALSE,state='booked',demo_appointment_id=$2,delete_pending=FALSE,updated_at=NOW()
      WHERE admin_id=$1`,
    [admin.id, result.appointmentId]
  );
  await pool.query(
    `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata)
     VALUES ($1,'admin.demo_booking_created','appointment',$2,$3::jsonb)`,
    [admin.id, result.appointmentId, JSON.stringify({ demoClientId: session.demo_client_id, isolatedIdentity: true })]
  );

  return {
    handled: true,
    reply: [
      '*Booking confirmed 🌿*',
      '',
      'Your appointment is confirmed.',
      intent?.service_text ? `✨ *Service:* ${intent.service_text}` : null,
      session.pending_staff_name ? `👤 *With:* ${session.pending_staff_name}` : null,
      intent?.preferred_date ? `📅 *Date:* ${intent.preferred_date}` : null,
      intent?.preferred_time ? `🕙 *Time:* ${intent.preferred_time}` : null,
      '',
      'We look forward to seeing you. 🌿',
      '',
      `🧪 Demo complete — Christel is back in admin mode. Demo appointment #${result.appointmentId} is real in Shiloh CRM/Calendar so the team can inspect it. When finished, send *DELETE DEMO BOOKING*.`
    ].filter(Boolean).join('\n'),
  };
}

async function prepareDelete(admin, session) {
  if (!session?.demo_appointment_id) return { handled: true, reply: 'There is no linked demo booking to delete.' };
  const r = await pool.query(
    `SELECT a.id,a.client_id,a.starts_at,a.source,c.display_name,
            c.source AS client_source,c.custom_attributes,
            COALESCE((SELECT string_agg(service_name_snapshot,' + ' ORDER BY position) FROM appointment_services WHERE appointment_id=a.id),'') AS services
       FROM appointments a JOIN clients c ON c.id=a.client_id
      WHERE a.id=$1`,
    [session.demo_appointment_id]
  );
  const a = r.rows[0];
  if (!a) {
    await pool.query(`UPDATE admin_client_demo_sessions SET demo_appointment_id=NULL,delete_pending=FALSE,updated_at=NOW() WHERE admin_id=$1`, [admin.id]);
    return { handled: true, reply: 'The linked demo appointment is already absent from CRM.' };
  }
  const owner = String(a.custom_attributes?.demo_admin_id || '');
  if (String(a.client_id) !== String(session.demo_client_id) || a.source !== 'shiloh_demo_whatsapp' || a.client_source !== 'whatsapp_demo' || owner !== String(admin.id)) {
    return { handled: true, reply: 'Deletion refused: Shiloh cannot prove that this appointment belongs exclusively to Christel’s controlled demo session.' };
  }
  await pool.query(`UPDATE admin_client_demo_sessions SET delete_pending=TRUE,updated_at=NOW() WHERE admin_id=$1`, [admin.id]);
  return {
    handled: true,
    reply: [
      `Demo appointment #${a.id}`,
      a.services ? `• Service: ${a.services}` : null,
      `• Client: ${a.display_name || 'Demo client'}`,
      `• Starts: ${formatDate(a.starts_at)} ${formatTime(a.starts_at)}`,
      '',
      'This permanently removes the *demo appointment* from Shiloh CRM and removes its linked Google Calendar event. It cannot delete an ordinary client booking.',
      '',
      'Reply exactly *CONFIRM DELETE DEMO BOOKING* to continue.',
    ].filter(Boolean).join('\n'),
  };
}

async function purgeDemoBooking(admin, session) {
  if (!session?.delete_pending || !session?.demo_appointment_id) {
    return { handled: true, reply: 'Start with *DELETE DEMO BOOKING* so Shiloh can verify the exact demo appointment first.' };
  }
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const locked = await db.query(
      `SELECT a.id,a.client_id,a.source,a.starts_at,a.ends_at,c.display_name,c.source AS client_source,c.custom_attributes,
              ace.event_id
         FROM appointments a
         JOIN clients c ON c.id=a.client_id
         LEFT JOIN appointment_calendar_events ace ON ace.appointment_id=a.id AND ace.provider='google_calendar'
        WHERE a.id=$1
        FOR UPDATE OF a,c`,
      [session.demo_appointment_id]
    );
    const row = locked.rows[0];
    if (!row) {
      await db.query('ROLLBACK');
      await pool.query(`DELETE FROM admin_client_demo_sessions WHERE admin_id=$1`, [admin.id]);
      return { handled: true, reply: 'The demo booking was already absent. The stale demo session has been cleared.' };
    }
    const owner = String(row.custom_attributes?.demo_admin_id || '');
    if (String(row.client_id) !== String(session.demo_client_id) || row.source !== 'shiloh_demo_whatsapp' || row.client_source !== 'whatsapp_demo' || owner !== String(admin.id)) {
      await db.query('ROLLBACK');
      return { handled: true, reply: 'Deletion refused: final locked-state verification could not prove this is Christel’s demo appointment.' };
    }

    const redemption = await db.query(`SELECT 1 FROM loyalty_redemptions WHERE appointment_id=$1 LIMIT 1`, [row.id]);
    if (redemption.rowCount) {
      await db.query('ROLLBACK');
      return { handled: true, reply: 'Deletion refused: this appointment has a loyalty redemption dependency and is no longer a clean demo-only booking.' };
    }

    if (row.event_id) await cancelBookingEvent(row.event_id);

    await db.query(
      `INSERT INTO crm_audit_events (actor_admin_id,action,entity_type,entity_id,metadata)
       VALUES ($1,'admin.demo_booking_purged','appointment',$2,$3::jsonb)`,
      [admin.id, row.id, JSON.stringify({ demoClientId: row.client_id, googleCalendarEventRemoved: Boolean(row.event_id), startsAt: row.starts_at })]
    );
    await db.query(`DELETE FROM appointments WHERE id=$1`, [row.id]);
    await db.query(
      `UPDATE clients
          SET status='inactive',updated_at=NOW(),
              custom_attributes=COALESCE(custom_attributes,'{}'::jsonb) ||
                jsonb_build_object('demo_cleanup','booking_purged','demo_cleanup_at',NOW()::text)
        WHERE id=$1 AND source='whatsapp_demo'`,
      [row.client_id]
    );
    await db.query(`DELETE FROM booking_intents WHERE phone=$1`, [session.virtual_phone]);
    await db.query(`DELETE FROM client_onboarding_sessions WHERE phone=$1`, [session.virtual_phone]);
    await db.query(`DELETE FROM booking_policy_acceptances WHERE phone=$1`, [session.virtual_phone]);
    await db.query(`DELETE FROM admin_client_demo_sessions WHERE admin_id=$1`, [admin.id]);
    await db.query('COMMIT');
    return { handled: true, reply: `✅ Demo appointment #${row.id} deleted from Shiloh CRM${row.event_id ? ' and removed from Google Calendar' : ''}. The synthetic demo client was archived, and Christel remains in normal admin mode.` };
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    db.release();
  }
}

async function exitDemo(admin, session) {
  await cancelPendingBooking(admin.id);
  await pool.query(`UPDATE admin_client_demo_sessions SET active=FALSE,delete_pending=FALSE,updated_at=NOW() WHERE admin_id=$1`, [admin.id]);
  return { handled: true, reply: session.demo_appointment_id ? `Client demo mode ended. You are back in admin mode. Demo appointment #${session.demo_appointment_id} remains in CRM until you send *DELETE DEMO BOOKING*.` : 'Client demo mode ended. You are back in normal admin mode.' };
}

async function processActiveClientMode(admin, session, text) {
  if (DEMO_EXIT.test(clean(text))) return exitDemo(admin, session);

  if (session.state === 'collect_practitioner') {
    const staff = practitionerName(text);
    if (!staff) return { handled: true, reply: 'Please choose *Christel*, *Abigail* or *Marietjie*.' };
    return prepareDemoBooking(admin, session, staff);
  }

  if (session.state === 'awaiting_booking_confirmation') {
    if (BOOKING_CANCEL.test(clean(text))) {
      await cancelPendingBooking(admin.id);
      await pool.query(`UPDATE admin_client_demo_sessions SET state='client',pending_staff_name=NULL,updated_at=NOW() WHERE admin_id=$1`, [admin.id]);
      await clearIntent(session.virtual_phone);
      return { handled: true, reply: 'No problem — that appointment was not created. You can start another booking whenever you’re ready.' };
    }
    if (!BOOKING_CONFIRM.test(clean(text))) return { handled: true, reply: 'Reply *CONFIRM BOOKING* to create this appointment, or *CANCEL BOOKING* to stop.' };
    return confirmDemoBooking(admin, session);
  }

  const identity = await processClientIdentityMessage(session.virtual_phone, text);
  if (identity.handled) {
    let reply = identity.reply;
    if (identity.onboardingComplete && identity.client?.id) {
      await tagDemoClient(admin, session, identity.client.id);
      if (identity.resumeBooking) {
        const booking = await processBookingMessage(session.virtual_phone, 'I want to book an appointment');
        if (booking.handled && booking.reply) reply = `${reply}\n\n${sanitizeBookingReply(booking.reply)}`;
      }
    }
    return { handled: true, reply };
  }

  const freelancer = await guardClientFreelancerBooking(text);
  if (freelancer.blocked) return { handled: true, reply: freelancer.reply };

  const policy = await processBookingPolicyMessage(session.virtual_phone, text);
  if (policy.handled) {
    if (policy.intent?.status === 'policy_accepted') {
      const current = await getSession(admin.id);
      return prepareDemoBooking(admin, current || session, policy.intent.therapist_text);
    }
    return { handled: true, reply: policy.reply };
  }

  const booking = await processBookingMessage(session.virtual_phone, text);
  if (booking.handled) return { handled: true, reply: sanitizeBookingReply(booking.reply) };

  return {
    handled: true,
    reply: "I'm Shiloh, your smart booking assistant. In this demonstration I can register you and make a first appointment. Tell me which treatment you'd like to book.",
  };
}

async function processAdminClientDemoMessage(sender, text) {
  const value = clean(text);
  const wantsStart = DEMO_START.test(value);
  const wantsDelete = DEMO_DELETE.test(value);
  const wantsDeleteConfirm = DEMO_DELETE_CONFIRM.test(value);

  const admin = await getAdmin(sender);
  if (!admin) return { handled: false };

  if ((wantsStart || wantsDelete || wantsDeleteConfirm) && !allowed(admin)) {
    return { handled: true, admin, reply: 'Your admin account is not authorized to use the controlled client demonstration.' };
  }
  if (wantsStart) return { ...(await startDemo(admin, sender)), admin };

  const session = await getSession(admin.id);
  if (wantsDelete) return { ...(await prepareDelete(admin, session)), admin };
  if (wantsDeleteConfirm) return { ...(await purgeDemoBooking(admin, session)), admin };
  if (!session?.active) return { handled: false };

  return { ...(await processActiveClientMode(admin, session, text)), admin };
}

module.exports = {
  processAdminClientDemoMessage,
  practitionerName,
  exactTime,
  localDateTime,
};
