# Shiloh OS — Project Tracker Addendum — Christel Staff Calendar Pilot

Date: 2026-08-24
Owner: 00 — Control & Reconciliation

## Completed / frozen

`SHILOH-STAFF-CALENDAR-PILOT-GATE`

State: COMPLETE / VERIFIED LIVE / RECONCILED / CONTROL ACCEPTED / DO NOT REDO.

Authority chain through PR #466 remains durable.

## Current authorized unit

`SHILOH-STAFF-CALENDAR-CHRISTEL-PILOT`

State: AUTHORIZED FOR EXECUTION NOW.
Owner: 40 — Production & DevOps.
Priority: HIGHEST CURRENT CALENDAR PRIORITY.

Pilot account: canonical Christel `staff_admin_accounts.id = 2` only.

Exact bounded production values authorized for the pilot:

- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED=true`
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS=2`
- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=true`
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=true`
- `SHILOH_CALENDAR_READONLY_UX_ENABLED=true`

Exactly one genuine authentication challenge is authorized, and only when deliberately initiated by Christel through the deployed sign-in experience after 40 has verified the activation rollout.

No proactive challenge send and no second genuine challenge are authorized.

## Completion evidence required

40 must return sanitized evidence of:

- exact environment update limited to the five authorized keys;
- correct current-main Render rollout and healthy startup;
- one-user pilot restriction;
- one Christel-initiated real challenge and provider delivery outcome;
- successful secure session establishment;
- correct server-derived Calendar scope;
- Day / Week / Agenda read-only access;
- logout and revoked-session fail-closed behavior;
- no unrelated account access;
- no scheduling/CRM/Google mutation;
- mandatory post-pilot re-lock and healthy re-lock rollout.

Authentication secrets and full contact values are not Tracker evidence.

## Mandatory post-pilot state

Before returning to Control, 40 must restore:

- pilot mode false;
- pilot Admin allowlist removed/empty;
- auth WhatsApp delivery false;
- Calendar session bridge false;
- read-only Calendar UX false.

## Next sequence

If the Christel read-only pilot passes and Control accepts it:

1. 10 — Booking & Admin UX: `SHILOH-CALENDAR-CREATE-BOOKING` guarded implementation.
2. 00 — Control & Reconciliation: accept booking-write evidence and decide Christel production booking activation.
3. Only later: broader rollout, nonessential polish, drag/drop, reschedule/cancel, Google optionality.

The business objective is the shortest safe path to Christel booking clients directly in Shiloh Calendar.
