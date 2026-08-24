# Shiloh OS — Project Tracker Addendum — Staff Calendar Access UX

Date: 2026-08-24
Owning workstream: **10 — Booking & Admin UX**
Control authority: **PR #461**

## Controlled unit

### `SHILOH-STAFF-CALENDAR-ACCESS-UX`

Status: **🟢 IMPLEMENTED / VERIFIED LIVE / COMPLETE — CONTROL ACCEPTANCE NEXT**

Application authority:

- PR #462 — `Build secure staff Calendar sign-in and access UX`;
- tested head `569b83368a3fddfda2c229f4169963fe22d6be5f`;
- application merge `12e91b29c095db7f41679cc9c51ba644f14442a9`;
- CI #1369 / run `32754036744` / job `97517345145`;
- Node 24.14.1;
- maintenance 12/12;
- SchedulingTimeline 6/6;
- Calendar UX/security 8/8;
- staff browser session/security 21/21;
- staff Calendar access UX/security 12/12;
- full regression 978/978, zero failures/cancellations/skips;
- npm audit 0 vulnerabilities.

Implemented human journey:

- framework-free `/calendar/staff` sign-in entry surface;
- user-driven challenge request using the accepted `/calendar/staff-auth/challenge` contract;
- one-time code verification using the accepted `/verify` contract;
- clear accepted, invalid, expired, rate-limited, provider-unavailable, authenticated, revoked/expired-session and logout states;
- successful sessions enter only the existing read-only Day / Week / Agenda Calendar;
- explicit logout uses the accepted CSRF rotation + CSRF-protected logout contract;
- own-staff presentation remains own-practitioner only;
- business-wide presentation remains limited to canonical server-derived business authority;
- no password, browser JWT authority, alternate identity system, browser `ADMIN_API_KEY`, browser-supplied role/scope authority, or persistent browser auth storage was added;
- `/calendar/:token.ics` remains separate and unchanged;
- no Calendar scheduling mutation endpoint/control was added.

## Production verification

The normal auto-deploy did not create a deployment for PR #462. Control separately authorized and executed one bounded recovery deployment. That recovery authority has been consumed and must not be reused.

Verified recovery deployment:

- Render deploy `dep-da6873on74is739g7nkg`;
- trigger `api`;
- clear cache `false`;
- exact deployed commit `12e91b29c095db7f41679cc9c51ba644f14442a9`;
- status `LIVE`;
- finished `2026-08-24T17:47:39.690236Z`;
- exact commit checkout confirmed;
- Node 24.14.1;
- `npm ci` added 174 packages / audited 175 packages;
- 0 vulnerabilities;
- migration `078_staff_browser_sessions.sql`: `appliedNow=false`, `checksumVerified=true`;
- Google Calendar provider health passed;
- `Shiloh started` observed;
- root and repeated `/health` returned HTTP 200 through cutover;
- bounded post-cutover error-level logs clean per Control verification;
- no activation environment mutation;
- no real staff-authentication WhatsApp message sent.

## Production activation remains held

Status: **🔒 NOT AUTHORIZED**

The following remain off unless separately authorized by Control:

- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=true`;
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=true`;
- `SHILOH_CALENDAR_READONLY_UX_ENABLED=true`.

No general staff Calendar production access is authorized by this completed implementation. No real staff-authentication WhatsApp send is authorized.

## Still out of scope / unauthorized

- Calendar booking creation;
- reschedule/cancel/drag-drop mutation;
- practitioner/service reassignment;
- schedule/block/leave/closure writes;
- weakening Google Calendar conflict/mirror authority;
- removing Google mirrors;
- making Google optional;
- alternate browser identity/security architecture.

## Next controlled action

Return this completed unit to **00 — Control & Reconciliation** for acceptance. Control may separately decide whether to authorize one bounded production staff-access pilot. If a pilot is authorized, **40 — Production & DevOps** should execute only the exact approved activation scope and verify genuine provider/session/read-only Calendar behavior before any broader rollout.
