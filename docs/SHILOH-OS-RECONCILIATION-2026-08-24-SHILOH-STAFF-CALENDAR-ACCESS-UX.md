# Shiloh OS — Reconciliation — Staff Calendar Access UX

Date: 2026-08-24
Owning workstream: **10 — Booking & Admin UX**
Return owner: **00 — Control & Reconciliation**

Status: **COMPLETE / VERIFIED LIVE / DEFAULT-OFF / CONTROL ACCEPTANCE NEXT**

## Authority

Control authorized `SHILOH-STAFF-CALENDAR-ACCESS-UX` in PR #461 over the frozen staff-browser session boundary and existing read-only SchedulingTimeline Calendar.

Application implementation is PR #462 — `Build secure staff Calendar sign-in and access UX`.

- tested head: `569b83368a3fddfda2c229f4169963fe22d6be5f`;
- merge: `12e91b29c095db7f41679cc9c51ba644f14442a9`.

## Implemented result

PR #462 provides the complete human staff sign-in and read-only Calendar access journey using only the accepted staff-auth contracts:

- `/calendar/staff` sign-in entry;
- user-driven challenge request;
- non-enumerating accepted-request behavior;
- one-time challenge/code entry and verification;
- invalid/expired/rate-limit/provider-unavailable recovery states;
- authenticated session recognition;
- revoked/expired-session handling;
- read-only Calendar entry only under current server-derived scope;
- own-staff practitioner switching hidden/blocked when only one practitioner is permitted;
- business-wide filtering restricted to canonical server scope;
- explicit CSRF-protected logout;
- preserved Day / Week / Agenda no-mutation behavior;
- preserved `/calendar/:token.ics` separation.

No password, browser JWT authority, alternate identity model, duplicate scope rules, browser `ADMIN_API_KEY`, browser-supplied role/staff/scope authority, URL secret, or persistent browser auth storage was added.

## CI evidence

PR #462 CI #1369 / run `32754036744` / job `97517345145`:

- Node 24.14.1;
- maintenance 12/12;
- SchedulingTimeline 6/6;
- Calendar UX/security 8/8;
- staff browser session/security 21/21;
- staff Calendar access UX/security 12/12;
- full regression 978/978;
- zero failures/cancellations/skips;
- zero npm vulnerabilities.

## Production recovery and verification

The expected Render auto-deploy did not create a deployment for PR #462. Control diagnosed the deployment-path exception and separately authorized one bounded manual recovery deploy. That authority was consumed successfully and must not be reused.

Verified deploy:

- Render: `dep-da6873on74is739g7nkg`;
- trigger: `api`;
- clear cache: `false`;
- exact deployed commit: `12e91b29c095db7f41679cc9c51ba644f14442a9`;
- status: LIVE;
- finished: `2026-08-24T17:47:39.690236Z`.

Independent connected-system verification confirms:

- exact commit checkout on branch `main`;
- Node 24.14.1;
- `npm ci` added 174 packages and audited 175 packages;
- 0 vulnerabilities;
- migration `078_staff_browser_sessions.sql` reported `appliedNow=false`, `checksumVerified=true`, original production apply time `2026-08-24T16:12:03.407Z`;
- established startup migration checks remained checksum healthy;
- Google Calendar provider health check passed;
- `Shiloh started` observed;
- new instance root returned HTTP 200;
- repeated new-instance `/health` checks returned HTTP 200 through and after cutover;
- Control's bounded post-cutover error-level review was clean;
- no activation environment mutation occurred;
- no real staff-authentication WhatsApp message was sent.

## Activation holds

The following remain **NOT AUTHORIZED** and unchanged/default-off:

- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=true`;
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=true`;
- `SHILOH_CALENDAR_READONLY_UX_ENABLED=true`.

General staff Calendar access is therefore not active. The implementation is deployed but dark by design.

## Mutation holds

Still not authorized:

- Calendar booking creation;
- reschedule/cancel/drag-drop;
- practitioner/service reassignment;
- schedule/block/leave/closure writes;
- Google Calendar authority weakening, mirror removal, bidirectional appointment authority or Google optionality.

## Reconciliation result

Project Tracker: **RECONCILED** through `SHILOH-OS-PROJECT-TRACKER-ADDENDUM-2026-08-24-SHILOH-STAFF-CALENDAR-ACCESS-UX.md`.

Master Status: **RECONCILED** through `SHILOH-OS-MASTER-STATUS-ADDENDUM-2026-08-24-SHILOH-STAFF-CALENDAR-ACCESS-UX.md` because PR #462 materially changes the durable deployed application state while preserving default-off activation.

## Next controlled action

Return to **00 — Control & Reconciliation** for independent acceptance. The recommended next decision is whether to authorize one narrowly scoped production staff-access pilot. No pilot, general rollout, real authentication send, or Calendar mutation is authorized by this reconciliation.
