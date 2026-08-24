# Shiloh OS — Project Tracker Addendum — Staff Browser Session Authorization

Date: 2026-08-24
Control owner: **00 — Control & Reconciliation**
Implementation owner: **40 — Production & DevOps**
Calendar consumer/reviewer: **10 — Booking & Admin UX**
State: **🟢 CALENDAR READ-ONLY UX ACCEPTED / STAFF SESSION BOUNDARY AUTHORIZED**

## Completed Calendar unit

`SHILOH-CALENDAR-READONLY-UX` is **🟢 VERIFIED LIVE / CONTROL ACCEPTED / COMPLETE / DO NOT REDO**.

Authority chain:

- PR #451 — foundation architecture;
- PR #452 — Control ratification + future Calendar-first booking rule;
- PR #453 — SchedulingTimeline implementation;
- PR #454 — projection reconciliation;
- PR #455 — projection acceptance + read-only UX authorization;
- PR #456 / `533907a704e29106ef67852ddedd800164521cc5` — Day / Week / Agenda application implementation;
- PR #457 / `e187f7c857c41d575a59666ad19df4653f504d67` — UX reconciliation.

The read-only UX code is production-deployed but remains deliberately unavailable to staff because no proven browser-safe staff/Admin session boundary currently supplies the trusted server viewer context. No staff workflow has been replaced yet.

## Next controlled unit

`SHILOH-STAFF-BROWSER-SESSION-BOUNDARY`

State: **🟢 AUTHORIZED FOR IMPLEMENTATION**

Owner: **40 — Production & DevOps**

Supporting consumer/reviewer: **10 — Booking & Admin UX**

Control authority retained by: **00 — Control & Reconciliation** for later Calendar activation and all Calendar mutations.

Priority: **NOW — highest-priority Calendar dependency**

## Authorized implementation outcome

Build and prove a browser-safe staff/Admin authentication and session boundary that can later supply trusted server-side Calendar viewer identity/scope without exposing shared secrets.

Required target:

- server-side opaque, revocable sessions;
- cryptographically random session tokens; only hashes persisted server-side;
- `HttpOnly`, `Secure`, restrictive `SameSite` production cookie with bounded expiry;
- no session token in URL, localStorage or sessionStorage;
- session rotation/fixation resistance;
- explicit logout/revocation;
- server-side canonical staff/Admin identity resolution;
- server-side current scope/permission derivation;
- no browser authority from arbitrary `staffId`, `business_role` or `calendarScope` input;
- no browser exposure or reuse of `ADMIN_API_KEY`;
- CSRF protection where applicable;
- sanitized auth/session logs.

Preferred first-login mechanism, if safely supportable by current provider authority: user-initiated one-time passwordless challenge through the existing verified staff WhatsApp channel, with short TTL, single use, hashed challenge/code storage, rate limiting and no token/code logging.

If the provider pathway cannot safely support that mechanism, return the exact constraint to Control. Do not improvise a shared password or introduce permanent password credentials without new authority.

## Calendar integration acceptance target

Authenticated middleware must be capable of deriving the current SchedulingTimeline viewer authority server-side and supplying the trusted Calendar request context equivalent to:

- `source: 'server_staff_session'`;
- `calendarScope: 'business_all_staff'` or `calendarScope: 'own_staff'` only when current Shiloh authority permits it;
- canonical `staffId` for own-staff scope.

Reuse existing staff/Admin scope authority such as `staffAdminScope` / `staffScopeAuthorization` where applicable.

## Holds remain binding

This unit does **not** authorize:

- enabling the read-only Calendar for general staff production use;
- Calendar create/reschedule/cancel;
- drag/drop;
- service/practitioner reassignment;
- schedule/block/leave writes;
- Google Calendar writes;
- reduction/removal of Google conflict or mirror authority;
- bidirectional Google appointment authority;
- Google optionality.

Calendar activation remains a later explicit **00 — Control & Reconciliation** decision after the secure session boundary is verified live and reconciled.

## Verification gate

Before completion, require focused tests proving secret non-leakage, cookie flags, invalid/expired/revoked/tampered-session denial, session rotation, logout/revocation, server-side scope derivation, privilege-escalation denial, CSRF defenses as applicable, rate limiting, challenge security if used, no unauthorized scheduling exposure, trusted Calendar viewer-context establishment, Calendar still default-off, and preservation of booking/WhatsApp/Google/SchedulingTimeline/ICS behavior.

Run the full non-mutating regression suite, repair until green, merge, verify exact Render deploy/health/provider state, reconcile Tracker and Master, then return to **00 — Control & Reconciliation** for Calendar activation decision.
