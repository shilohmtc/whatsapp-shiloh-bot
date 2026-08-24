# Shiloh OS — Control Reconciliation — Christel Staff Calendar Pilot Authorization

Date: 2026-08-24
Owner: 00 — Control & Reconciliation

## Decision

`SHILOH-STAFF-CALENDAR-PILOT-GATE` is ACCEPTED / VERIFIED LIVE / COMPLETE / FROZEN / DO NOT REDO.

Control authorizes the next bounded operational unit: `SHILOH-STAFF-CALENDAR-CHRISTEL-PILOT`.

Execution owner: 40 — Production & DevOps.
Application consumer: 10 — Booking & Admin UX.
Final acceptance owner: 00 — Control & Reconciliation.

## Accepted implementation evidence

- Control authority: PR #464.
- Pilot-gate implementation: PR #465.
- PR #465 tested head: `b472936c47765474b06032c3478a2262f1fc3a74`.
- PR #465 merge: `2b9ccd91d11caabcd572280c3ad900100ea968a2`.
- CI #1375 / run `32762341818` / job `97543847318` passed the existing Calendar/session/access focused suites, the new pilot-gate suite 8/8, full regression 986/986, and npm audit with zero vulnerabilities.
- Pilot-gate reconciliation: PR #466.
- Reconciled application authority before this Control record: `9b1e368e191da8bba9bb5359f61b62a62a97a736`.
- Reconciliation CI #1377 / run `32763914350` / job `97548912216` succeeded with full regression 986/986.
- Render application and reconciliation deployments reached LIVE; current-main startup verified migration 078 checksum state, Google Calendar provider health, Shiloh startup, repeated HTTP health 200, and a clean bounded error-level window.
- No real staff-authentication challenge or Calendar activation occurred during implementation/reconciliation.

## Canonical pilot identity

The one authorized pilot account is Christel's canonical active `staff_admin_accounts` row with immutable account ID:

`2`

This is the Admin-account ID, not the practitioner/staff ID.

Control resolved this from the durable identity-ledger creation sequence and current runtime corroboration without persisting Christel's phone number in this authority record:

- migration 011 creates `staff_admin_accounts` with generated identity primary key and initially inserts Marietjie, Christel, then Abigail in order;
- the immediately following Jean-Pierre Admin migration adds the fourth Admin row;
- current production runtime independently identifies Jean-Pierre as Admin ID 4;
- later role/scope authority migrations update the existing named Admin rows in place;
- no repository evidence was found of a delete, truncate, or reseed of `staff_admin_accounts` that would invalidate that sequence.

If 40 obtains contradictory current canonical evidence before activation, STOP and return to Control; do not substitute another ID.

## Exact bounded production activation authority

40 is authorized to set exactly these values on Render service `srv-d9qbfmk9v7es73emgam0` in workspace `tea-d9qb67n10e5c739at6j0`:

- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED=true`
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS=2`
- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=true`
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=true`
- `SHILOH_CALENDAR_READONLY_UX_ENABLED=true`

The update must merge only these exact keys. It must not replace the service environment or alter any other environment variable, repository/branch setting, credential, integration, build/start command, database configuration, Google Calendar setting, or WhatsApp provider configuration.

After the environment update, 40 must verify the resulting Render rollout is on current authoritative `main`, starts normally, retains Google provider health and HTTP health, and exposes no error-level regression before the human pilot begins.

## One genuine authentication challenge authority

Control authorizes exactly one genuine authentication challenge for the canonical Christel pilot account during this pilot.

The challenge MUST be user-initiated by Christel through the deployed staff sign-in experience after the bounded environment activation is verified. 40 must not proactively originate, simulate, resend, or manually inject the production challenge.

The challenge code, session token, CSRF token, full phone number, provider credential, and other authentication secrets must not be copied into GitHub, Control records, Project Tracker, Master Status, or chat evidence.

If challenge delivery fails, no automatic second genuine challenge is authorized. Re-lock the pilot and return sanitized failure evidence to Control for a new decision.

## Required production pilot proof

The single pilot must prove, using Christel's actual canonical account and no synthetic scheduling mutation:

1. only Admin ID 2 is eligible while pilot mode is active;
2. Christel can deliberately request the one authorized challenge;
3. the real provider delivers it to her current canonical staff-auth destination;
4. verification creates the accepted secure opaque browser session;
5. browser-supplied Admin/staff/role/scope claims remain unable to elevate authority;
6. current canonical authority resolves Christel to the correct server-derived Calendar scope;
7. Day, Week, and Agenda open successfully from the accepted `SchedulingTimeline`;
8. the Calendar remains read-only and exposes no booking/reschedule/cancel/drag-drop mutation control;
9. PR #380 multi-practitioner and PR #395 Google-only-busy semantics remain intact;
10. logout revokes the session and subsequent protected access fails closed;
11. no unrelated staff/Admin account receives an authentication challenge or gains pilot access;
12. no appointment, schedule, block, leave, CRM, Google Calendar, or booking truth is mutated for proof.

## Mandatory re-lock

After the pilot succeeds or fails, before the unit returns to Control, 40 must restore the bounded access gates to the non-active state:

- `SHILOH_STAFF_BROWSER_PILOT_MODE_ENABLED=false`
- `SHILOH_STAFF_BROWSER_PILOT_ADMIN_IDS` removed or empty
- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=false`
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=false`
- `SHILOH_CALENDAR_READONLY_UX_ENABLED=false`

40 must verify the post-pilot re-lock rollout and that ordinary staff production Calendar access is again unavailable.

No broader staff rollout is authorized by this pilot.

## Still not authorized

- Calendar booking creation;
- reschedule/cancel/drag-drop;
- practitioner/service reassignment;
- schedule/block/leave/closure writes;
- broad staff Calendar rollout;
- a second real authentication challenge;
- Google Calendar writes, mirror removal, authority reduction, bidirectional appointment authority, or Google optionality.

## Priority after pilot

If Control accepts a successful Christel read-only pilot, the immediate highest-priority next unit is guarded `SHILOH-CALENDAR-CREATE-BOOKING`, owned by 10 — Booking & Admin UX, so Christel can book clients from Shiloh Calendar through the existing canonical guarded booking owner.

Do not divert into nonessential Calendar polish, broad rollout, drag/drop, reschedule/cancel, or Google optionality first.
