# Shiloh OS — Control & Reconciliation — Staff Browser Session Acceptance

Date: 2026-08-24
Owning workstream: **00 — Control & Reconciliation**
Next implementation owner: **10 — Booking & Admin UX**
Later production activation owner: **40 — Production & DevOps**, only after a separate Control authorization
Status: **SESSION BOUNDARY ACCEPTED / COMPLETE / DO NOT REDO / PRODUCTION ACTIVATION STILL HELD**

## Authority reviewed

Control independently reviewed the completed `SHILOH-STAFF-BROWSER-SESSION-BOUNDARY` against:

- PR #458 — Control authorization for the staff browser session boundary;
- PR #459 — secure staff browser session implementation;
- migration `078_staff_browser_sessions.sql`;
- PR #460 — Production & DevOps reconciliation.

Authoritative reviewed main at acceptance: `1de9071d5c6d22b4ba931c7e1b9b8bc61416790f`.

## Independent Control verification

Control independently verified:

- PR #458 merged and authorized the bounded session/security architecture without Calendar activation;
- PR #459 merged at application merge `3a53a465bd1d9e803ac4931ec833d320d5a44fba` from tested head `5b4646ecb13fd79cb8074dda9d132907fbf46b1b`;
- PR #460 merged at `1de9071d5c6d22b4ba931c7e1b9b8bc61416790f` and reconciled Project Tracker and Master Status;
- GitHub `main` was exactly `1de9071d5c6d22b4ba931c7e1b9b8bc61416790f` at acceptance review;
- CI #1363 / run `32749267356` / job `97502068683` completed successfully on Node 24.14.1;
- focused maintenance tests passed 12/12;
- focused SchedulingTimeline tests passed 6/6;
- focused Calendar UX security tests passed 8/8;
- focused staff browser session/security tests passed 21/21;
- full regression passed 966/966 with zero failures, cancellations or skips and zero npm vulnerabilities;
- application deploy `dep-da66qejl550s738t5600` deployed the exact PR #459 application merge before being superseded normally by reconciliation;
- current reconciliation deploy `dep-da66t5rl550s738t9bn0` is LIVE on exact current main `1de9071d5c6d22b4ba931c7e1b9b8bc61416790f`;
- startup checksum verification reports `078_staff_browser_sessions.sql` with `appliedNow=false`, `checksumVerified=true`, original production apply time `2026-08-24T16:12:03.407Z`;
- Google Calendar provider health passed;
- `Shiloh started` was observed on the new instance;
- repeated new-instance `/health` requests returned HTTP 200;
- bounded post-cutover error-level production logs were clean;
- no staff sign-in challenge activity was observed in the reviewed post-cutover window.

## Control acceptance

Decision: **ACCEPT** `SHILOH-STAFF-BROWSER-SESSION-BOUNDARY` as **VERIFIED LIVE / COMPLETE / DO NOT REDO**.

The accepted boundary includes:

- high-entropy opaque server-side staff/Admin sessions;
- SHA-256-only persisted session-token material;
- hash-only one-time challenge and CSRF persistence;
- bounded challenge/session expiry;
- challenge attempt and request rate limits;
- rotation, revocation and fixation resistance;
- current canonical staff/Admin authority re-resolved server-side on validation;
- business-wide scope only from current business authority;
- own-staff scope only from canonical active linked staff;
- browser-supplied staff/scope claims cannot establish authority;
- production `__Host-` cookie semantics: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, bounded `Max-Age`, no `Domain`;
- same-origin JSON and per-session CSRF protection for state-changing session operations;
- no browser exposure or reuse of `ADMIN_API_KEY` / `x-admin-key`;
- no session token in URLs, localStorage or sessionStorage.

Do not rebuild, replace or weaken this security boundary merely to accelerate Calendar activation.

## Activation decisions

### 1. Real staff-auth WhatsApp delivery

Decision: **NOT AUTHORIZED YET**.

`SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=true` remains a separate production/provider mutation and outbound-message authority gate.

Reason:

- the secure provider adapter is implemented and tested dark/mocked;
- no real authentication message was required to prove the session boundary;
- the current implementation exposes JSON auth endpoints, but the complete staff-facing login/access journey has not yet been accepted by Booking & Admin UX;
- real provider delivery should be enabled only as part of a bounded staff-access pilot after the UX and failure/recovery states are verified.

### 2. Staff-session Calendar bridge

Decision: **NOT AUTHORIZED FOR GENERAL PRODUCTION USE YET**.

`SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=true` remains separately held.

### 3. Read-only Calendar UX activation

Decision: **NOT AUTHORIZED FOR GENERAL STAFF ACTIVATION YET**.

`SHILOH_CALENDAR_READONLY_UX_ENABLED=true` remains separately held.

The read-only Calendar implementation is complete and the session infrastructure is complete, but the human access journey is not yet a completed controlled unit.

## Next controlled unit

Control authorizes **10 — Booking & Admin UX** to implement:

`SHILOH-STAFF-CALENDAR-ACCESS-UX`

The unit is presentation/integration UX only and must remain default-off in production.

Required scope:

1. Provide a clear staff sign-in entry surface for the existing `/calendar/staff-auth/challenge` and `/calendar/staff-auth/verify` contracts.
2. Preserve the existing opaque-cookie session boundary; do not introduce browser credentials, passwords, JWT authority or duplicated authorization logic.
3. Keep the WhatsApp challenge user-initiated; never bulk-send or send unsolicited login messages.
4. Handle sign-in requested, challenge accepted, invalid/expired code, rate-limited/unavailable provider, authenticated, revoked/expired session and logout states clearly.
5. Do not expose whether an arbitrary supplied WhatsApp identity maps to an eligible staff account beyond the existing non-enumerating contract.
6. Do not put challenge codes, session tokens or CSRF tokens in URLs or persistent browser storage.
7. After successful authentication, direct only to the existing read-only Calendar surface under server-derived scope.
8. Own-staff viewers must remain unable to switch into another practitioner's timeline.
9. Business-wide viewers may consume only the current accepted business-wide read-only scope.
10. Preserve the existing read-only Day / Week / Agenda contract and all no-mutation guarantees.
11. Provide an explicit logout path using the existing CSRF-protected session endpoint.
12. Preserve `/calendar/:token.ics` as a separate existing surface.
13. Keep all three production activation flags unchanged/default-off during implementation and automated tests unless Control later issues an explicit activation authorization.

## Still not authorized

This acceptance does **not** authorize:

- a real staff authentication WhatsApp message;
- general staff Calendar activation;
- Calendar booking, reschedule, cancellation or drag/drop mutation;
- practitioner or service reassignment;
- schedule, block or leave mutation;
- Google Calendar writes or weakening of current provider/conflict authority;
- reuse of `ADMIN_API_KEY` as browser identity;
- migration of canonical appointment truth out of the currently accepted scheduling model.

## Sequencing recommendation

Do **now**: complete `SHILOH-STAFF-CALENDAR-ACCESS-UX` under 10 while all production activation gates remain off.

Do **later, after 10 returns verified evidence**: Control decides whether to authorize one bounded production staff-access pilot. If authorized, 40 performs the exact environment/provider activation and verifies real login/session/read-only behavior before any broader rollout.

If Shiloh OS were my own project, I would not turn on real WhatsApp login delivery or general staff Calendar access before the human login journey is complete and tested. The remaining work is no longer session cryptography; it is safe operational UX and controlled activation.
