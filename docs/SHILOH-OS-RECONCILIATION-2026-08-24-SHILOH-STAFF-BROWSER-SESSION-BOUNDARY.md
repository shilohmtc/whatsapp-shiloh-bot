# Shiloh OS — Production & DevOps — Staff Browser Session Boundary Completion

Date: 2026-08-24
Owning workstream: **40 — Production & DevOps**
Control acceptance owner: **00 — Control & Reconciliation**
Supporting reviewer: **10 — Booking & Admin UX**
Authorized by: PR #458
Status: **IMPLEMENTED / TESTED / MERGED / VERIFIED LIVE / RECONCILED — ACTIVATION REMAINS SEPARATE**

## Controlled unit

`SHILOH-STAFF-BROWSER-SESSION-BOUNDARY`

Authoritative implementation start was main **`8e842b4d6b1660b2d4acd6078a33420bd73e293c`**, the PR #458 Control acceptance/authorization state. PR #451–#458 and the completed architecture/security inspections were not redone.

## Recommended design and decision

Production & DevOps chose the existing WhatsApp `sendWhatsAppMessage` provider abstraction behind a new staff-auth-specific default-off gate instead of creating a second provider stack or credential set.

If Shiloh OS were my project, I would choose the same design now: reuse the already-proven provider boundary, add no new secret, keep delivery dark by default, mock it in automated tests, and make real challenge delivery a later explicit activation decision. This minimizes duplicate retry/log/credential surfaces while preserving Control authority over external messaging.

For schema delivery, the service has no Render pre-deploy migration command. A narrowly bounded startup ensure for exactly migration 078 was chosen instead of a broad `db:migrate` sweep. This reduced production mutation scope and failed startup closed on migration/checksum failure.

## Application implementation

Implementation branch: `production/staff-browser-session-boundary-20260824`.

Application PR: **#459 — Implement secure staff browser session boundary**.

Final tested head: **`5b4646ecb13fd79cb8074dda9d132907fbf46b1b`**.

Application merge: **`3a53a465bd1d9e803ac4931ec833d320d5a44fba`**.

Implemented surfaces include:

- `src/services/staffBrowserSession.js` — opaque server sessions, hash-only secrets, challenge/session expiry, rotation/revocation and current authority resolution;
- `src/services/staffBrowserChallengeDelivery.js` — existing provider adapter behind explicit default-off delivery gate;
- `src/middleware/staffBrowserSession.js` — secure cookie, same-origin/JSON/CSRF protections and separately gated trusted Calendar viewer context;
- `src/routes/staffBrowserSession.js` — challenge, verify, session, CSRF rotation and logout endpoints;
- `src/routes/calendar.js` — staff-auth mount and optional session middleware while preserving `/:token.ics`;
- `migrations/078_staff_browser_sessions.sql` — hash-only challenge/session persistence;
- `scripts/ensure-staff-browser-sessions.js` — exact migration 078 apply/checksum verification;
- focused security tests and CI stage;
- production runbook for security/activation boundaries.

## Security invariants

- 32-byte cryptographically random opaque session token;
- SHA-256-only session-token persistence;
- SHA-256-only challenge and CSRF persistence;
- approximately 5-minute challenge TTL and 8-hour session TTL;
- challenge issue-rate and verification-attempt limits;
- successful authentication revokes/rotates previous sessions;
- malformed/tampered/expired/revoked/inactive sessions fail closed;
- current canonical `staff_admin_accounts` and staff status re-resolved for every session validation;
- business-wide viewer scope only from current business-wide authority;
- own-staff viewer scope only from canonical active linked staff identity;
- browser-supplied identity/scope values never establish authority;
- production cookie is `__Host-`, HttpOnly, Secure, SameSite=Strict, Path=/, bounded Max-Age and has no Domain;
- same-origin JSON protection plus per-session CSRF for authenticated state changes;
- no `ADMIN_API_KEY` or `x-admin-key` exposure/reuse;
- no session token in URL/localStorage/sessionStorage.

## WhatsApp and Calendar holds

Staff auth challenge delivery requires exact explicit gate `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=true`; default is dark. Automated tests inject a mock provider. No real authentication message was sent during implementation, CI, merge or production verification.

Session-to-Calendar viewer bridging requires exact explicit gate `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=true`. Existing `SHILOH_CALENDAR_READONLY_UX_ENABLED=true` remains separately required. No Render environment-variable mutation was made by this unit, so deployment did not activate general staff Calendar access.

No Calendar booking, reschedule/cancel/drag-drop, practitioner/service reassignment, schedule/block/leave write or Google Calendar write was added or invoked.

## CI and repair evidence

Initial CI #1362 surfaced one stale assertion in the existing Calendar UX regression suite: it expected direct `/read-only` mounting and therefore failed after the authorized session middleware was inserted. The assertion was repaired to require the middleware-wrapped mount and its separate bridge gate. No weakening of the implementation occurred.

Final PR #459 CI:

- CI **#1363**;
- workflow run **32749267356**;
- job **97502068683**;
- Node **24.14.1**;
- maintenance **12/12**;
- SchedulingTimeline **6/6**;
- Calendar UX **8/8**;
- staff-session/security **21/21**;
- full regression **966/966**;
- 0 failures / cancellations / skips;
- npm install audit output **0 vulnerabilities**.

CI explicitly kept staff-auth WhatsApp delivery, the session Calendar bridge and Calendar UX gates false.

## Exact production verification

Render service: `shiloh-whatsapp-bot` / `srv-d9qbfmk9v7es73emgam0`.

Auto-deploy: **`dep-da66qejl550s738t5600`**.

Trigger: `new_commit`; no manual duplicate deploy was triggered.

Render checked out exact application merge **`3a53a465bd1d9e803ac4931ec833d320d5a44fba`**, used Node **24.14.1**, completed `npm ci`, built successfully and reached **LIVE** at **2026-08-24T16:12:16.893361Z**.

The deployed startup command includes the new bounded migration ensure before application startup.

Production logs prove:

- migration 074 remained checksum-valid/unreplayed;
- migration 078 emitted `staff_browser_session_schema_verified` with `appliedNow: true`, `checksumVerified: true`, `appliedAt: 2026-08-24T16:12:03.407Z`;
- existing publication/migration ensures remained checksum-valid;
- Google Calendar provider health check passed;
- Shiloh started;
- new-instance `/health` returned HTTP 200 after startup/cutover;
- bounded error-level logs for the new deployment returned no errors;
- Render declared the exact deployment LIVE.

A separate `query_render_postgres` observer call was attempted read-only after deployment, but the connector failed before SQL because it did not negotiate the database-required SSL mode. This is the known connector-side observer limitation, not a production database/application failure. The application connected through its normal production path, applied and checksum-verified migration 078, then became healthy.

## Authority preserved / do not redo

- PR #451–#458: Calendar architecture, projection, UX, Control acceptance and session authorization.
- PR #459: staff browser session implementation.
- PR #380: multi-practitioner booking/allocation semantics.
- PR #395: practitioner/shared Google conflict classification.
- Existing `/calendar/:token.ics` share/export contract.
- Existing shared Admin API key remains server/API-only.

Do not redo these units, broaden browser scope, weaken provider/Google authority or treat session implementation as Calendar mutation authorization.

## Reconciliation and next owner

Project Tracker addendum and Master Status addendum for this exact verified-live implementation are included in the same reconciliation branch/PR.

Recommended next owner: **00 — Control & Reconciliation** to accept/freeze the completed security boundary and decide later, separately, whether/when to authorize real staff authentication delivery and read-only Calendar activation. Until then both activation paths remain dark.
