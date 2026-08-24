# Shiloh OS — Master Status Addendum — Staff Calendar Access UX

Date: 2026-08-24
Owning authority: **00 — Control & Reconciliation**
Implementation owner: **10 — Booking & Admin UX**
Future activation executor: **40 — Production & DevOps**, only after separate Control authorization

Status: **STAFF CALENDAR ACCESS UX IMPLEMENTED / VERIFIED LIVE / DEFAULT-OFF; CONTROL ACCEPTANCE NEXT**

## Durable application state

`SHILOH-STAFF-CALENDAR-ACCESS-UX` is now implemented and deployed over the accepted staff-browser session boundary and accepted read-only Calendar.

Authoritative chain:

- PR #451 — Calendar foundation architecture;
- PR #452 — Control ratification + Calendar-first future-product rule;
- PR #453/#454 — SchedulingTimeline implementation and reconciliation;
- PR #455 — projection acceptance + read-only UX authorization;
- PR #456/#457 — Day / Week / Agenda read-only Calendar implementation and reconciliation;
- PR #458 — Calendar UX acceptance + secure staff session authorization;
- PR #459/#460 — staff browser session boundary implementation and reconciliation;
- PR #461 — session boundary acceptance + staff Calendar access UX authorization;
- PR #462 — staff Calendar access UX implementation.

PR #462 application merge: `12e91b29c095db7f41679cc9c51ba644f14442a9`.

The durable human access model is:

- `/calendar/staff` is the staff-facing sign-in entry surface;
- challenge initiation is user-driven and consumes the existing non-enumerating `/calendar/staff-auth/challenge` contract;
- code verification consumes the accepted one-time `/verify` contract;
- browser authority remains the opaque server-side session boundary from PR #459;
- current staff/Admin identity and Calendar scope continue to be re-resolved server-side;
- own-staff scope remains own practitioner only;
- business-wide scope remains limited to current canonical business authority;
- browser-supplied staff IDs, roles or Calendar scope remain non-authoritative;
- `ADMIN_API_KEY` / `x-admin-key` remains server/API-only;
- no passwords, browser JWT authority, alternate identity store, URL session tokens, URL challenge codes, localStorage/sessionStorage session material or browser credential cache was introduced;
- successful authentication enters only the existing read-only Day / Week / Agenda Calendar;
- logout uses the existing CSRF-protected session boundary;
- `/calendar/:token.ics` remains a distinct export/share route;
- Calendar scheduling behavior remains read-only.

## Test authority

PR #462 CI #1369 / run `32754036744` / job `97517345145` completed successfully on Node 24.14.1:

- maintenance 12/12;
- SchedulingTimeline 6/6;
- Calendar UX/security 8/8;
- staff browser session/security 21/21;
- staff Calendar access UX/security 12/12;
- full regression 978/978;
- zero failures/cancellations/skips;
- npm audit 0 vulnerabilities.

## Production verification authority

The expected automatic deployment did not occur. Control separately authorized and consumed one bounded manual recovery deployment. That recovery is an operational exception only; it does not broaden activation or deployment authority.

Verified recovery:

- deploy `dep-da6873on74is739g7nkg`;
- trigger `api`;
- clear cache `false`;
- exact commit `12e91b29c095db7f41679cc9c51ba644f14442a9`;
- LIVE, finished `2026-08-24T17:47:39.690236Z`;
- Node 24.14.1;
- `npm ci` successful, 174 packages added / 175 audited, 0 vulnerabilities;
- migration `078_staff_browser_sessions.sql` remained `appliedNow=false`, `checksumVerified=true`;
- Google Calendar provider health passed;
- Shiloh started;
- root and repeated `/health` checks returned HTTP 200 through cutover;
- bounded post-cutover error-level logs were clean per Control verification;
- no activation environment mutation occurred;
- no real staff-authentication WhatsApp message was sent.

## Activation gates remain binding

Implementation/deployment presence does not authorize use.

The following remain **NOT AUTHORIZED**:

1. `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=true`;
2. `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=true`;
3. `SHILOH_CALENDAR_READONLY_UX_ENABLED=true`.

Therefore general staff Calendar production access remains off. The completed UX is production-deployed code but not yet an activated staff workflow.

## Calendar mutation authority remains unchanged

Still separately unauthorized:

- Calendar booking creation;
- reschedule/cancellation;
- drag/drop;
- practitioner/service reassignment;
- schedule, block, leave or closure mutation;
- weakening Google Calendar provider/conflict/mirror authority;
- removing Google mirrors;
- making Google optional;
- moving canonical scheduling truth out of the accepted Shiloh model.

## Next decision

Return to **00 — Control & Reconciliation** for acceptance of the completed default-off access UX. Control may then separately authorize or reject one bounded production staff-access pilot. If authorized, **40 — Production & DevOps** executes only the exact activation approved and returns genuine sign-in/session/read-only Calendar evidence before any broader rollout or any Calendar mutation work.
