# Shiloh OS — Project Tracker Addendum — Staff Calendar Access Authorization

Date: 2026-08-24
Owning workstream: **00 — Control & Reconciliation**

## Completed controlled unit

### `SHILOH-STAFF-BROWSER-SESSION-BOUNDARY`

Status: **🟢 VERIFIED LIVE / CONTROL ACCEPTED / COMPLETE / DO NOT REDO**

Authority and delivery evidence:

- PR #458 — Control authorization;
- PR #459 — application implementation;
- tested head `5b4646ecb13fd79cb8074dda9d132907fbf46b1b`;
- application merge `3a53a465bd1d9e803ac4931ec833d320d5a44fba`;
- migration `078_staff_browser_sessions.sql`;
- CI #1363 / run `32749267356` / job `97502068683`;
- Node 24.14.1;
- maintenance 12/12;
- SchedulingTimeline 6/6;
- Calendar UX security 8/8;
- staff browser session/security 21/21;
- full regression 966/966, zero failures/cancellations/skips;
- application deploy `dep-da66qejl550s738t5600` reached production before normal supersession;
- PR #460 — Production & DevOps reconciliation;
- reconciled reviewed main `1de9071d5c6d22b4ba931c7e1b9b8bc61416790f`;
- reviewed final deploy `dep-da66t5rl550s738t9bn0` LIVE;
- migration 078 checksum re-verification passed on reconciliation startup;
- Google Calendar provider health passed;
- Shiloh started and repeated `/health` checks returned HTTP 200;
- bounded post-cutover error-level logs clean;
- no real staff-authentication WhatsApp challenge activity observed in the reviewed window.

Do not redo PR #451–#460, Calendar architecture/security inspection, staff-session architecture/security inspection, migration 078, or the completed security/regression proof merely to proceed with staff access.

## Next controlled unit

### `SHILOH-STAFF-CALENDAR-ACCESS-UX`

Status: **🟡 CONTROL AUTHORIZED / READY FOR IMPLEMENTATION / DEFAULT-OFF**

Owner: **10 — Booking & Admin UX**

Purpose: complete the human staff sign-in and read-only Calendar access journey using the already accepted session/API boundary.

Required delivery boundary:

- consume existing `/calendar/staff-auth` challenge/verify/session/CSRF/logout contracts;
- provide a clear staff sign-in entry surface;
- keep challenge initiation user-driven;
- preserve non-enumerating account behavior;
- handle accepted, invalid/expired, rate-limited, provider-unavailable, authenticated, revoked/expired-session and logout states;
- preserve opaque server-side sessions and existing cookie/CSRF controls;
- never expose/reuse `ADMIN_API_KEY` or browser-supplied scope authority;
- route successful authentication only into the existing read-only Calendar under server-derived scope;
- own-staff remains own-only;
- business-wide remains limited to current accepted server authority;
- preserve Day / Week / Agenda read-only behavior and `/calendar/:token.ics`;
- keep all production activation gates unchanged/default-off during implementation and automated testing;
- do not require a real WhatsApp authentication send for implementation proof.

Completion gate:

`inspect current accepted contracts → implement default-off access UX → focused security/UX tests → full regression → repair until green → PR/CI/merge → Render verification → Tracker reconciliation → Master reconciliation if durable state changes → return to 00 for acceptance`.

## Separate future activation gate

Status: **🔒 NOT AUTHORIZED**

Control retains authority over any production activation involving:

- `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=true`;
- `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=true`;
- `SHILOH_CALENDAR_READONLY_UX_ENABLED=true`.

If the access UX is later accepted, Control may authorize a bounded staff-access pilot. **40 — Production & DevOps** would execute only the exact activation authorized and independently verify real provider/session/Calendar behavior.

A future pilot is not authorized by this tracker entry and cannot be treated as general rollout authority.

## Still out of scope / unauthorized

- real staff-authentication WhatsApp message send now;
- general staff Calendar activation now;
- Calendar booking/reschedule/cancel/drag-drop mutation;
- practitioner/service reassignment;
- schedule/block/leave/clinic-closure mutation;
- weakening Google Calendar provider/conflict/mirror authority;
- alternate browser identity or password/JWT implementation;
- `ADMIN_API_KEY` browser exposure;
- migration of canonical scheduling truth.

## Priority sequence

Current Calendar programme priority:

1. **10 — `SHILOH-STAFF-CALENDAR-ACCESS-UX`** — do now, default-off.
2. **00 — Control acceptance and bounded pilot decision** — after verified UX completion.
3. **40 — exact pilot activation/verification** — only if separately authorized.
4. **00/10 — broader read-only rollout decision** — only after pilot evidence.
5. Calendar mutation units — later, separately authorized.
