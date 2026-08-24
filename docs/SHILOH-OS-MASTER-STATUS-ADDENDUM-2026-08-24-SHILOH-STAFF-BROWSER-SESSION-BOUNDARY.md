# Shiloh OS — Master Status Addendum — Staff Browser Session Boundary

Date: 2026-08-24
Owning implementation workstream: **40 — Production & DevOps**
Control owner after implementation: **00 — Control & Reconciliation**
Supporting reviewer: **10 — Booking & Admin UX**
Control authorization: PR #458
Application authority: PR #459 / **`3a53a465bd1d9e803ac4931ec833d320d5a44fba`**
Durable state: **SECURE STAFF BROWSER SESSION BOUNDARY IMPLEMENTED / TESTED / MERGED / VERIFIED LIVE — EXTERNAL AUTH DELIVERY AND CALENDAR ACTIVATION REMAIN DARK**

## Durable operational state

Production now contains a browser-safe server-side staff/Admin authentication and session boundary without converting the shared Admin API secret into a browser credential.

Session secrets are high-entropy opaque values. The database stores only SHA-256 hashes for session tokens, authentication challenges and CSRF secrets. Session state is bounded by expiry, revocation, rotation and last-use metadata; challenge issue rate and verification attempts are bounded. Successful authentication revokes prior active sessions to resist fixation/reuse.

Every session validation re-resolves current `staff_admin_accounts` authority and current canonical staff status. Business-wide Calendar viewer authority is derived only from current business-wide Admin authority; own-staff authority is derived only from a canonical active linked staff profile. Browser-supplied role, staff ID or Calendar scope does not authorize access.

Malformed/tampered, expired, revoked and authority-revoked sessions fail closed.

## Browser security boundary

Production session cookies use the `__Host-` prefix with HttpOnly, Secure, SameSite=Strict, Path=/, bounded Max-Age and no Domain attribute. Session tokens are not placed in URLs or browser storage.

State-changing authentication/session requests require same-origin JSON. Authenticated mutation of session state additionally requires a per-session CSRF secret. The session layer does not expose or reuse `ADMIN_API_KEY` / `x-admin-key`; that existing server/API authority remains independent.

## WhatsApp authentication delivery

The implementation reuses the existing WhatsApp provider send abstraction rather than introducing a second provider/secret stack. Staff sign-in challenge delivery is possible only through explicit environment gate `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=true`.

That gate is default-off in code. Automated proof uses a mock provider only. Deployment/startup did not invoke a staff authentication challenge, and no real authentication message was manufactured for proof.

Real staff authentication-message delivery remains a later separate Control authorization/activation decision.

## Calendar integration boundary

The read-only Calendar can consume a valid browser session only when `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=true`. The pre-existing `SHILOH_CALENDAR_READONLY_UX_ENABLED=true` gate remains separately binding.

PR #459 changed no Render environment variable to activate these gates. Therefore deploying the session boundary does not itself turn on the staff Calendar.

When both gates are later separately authorized, only trusted middleware may attach `Symbol.for('shiloh.calendar.server.viewer')` with source `server_staff_session`; existing SchedulingTimeline/PR #380/PR #395 authority remains unchanged. `/calendar/:token.ics` remains the independent appointment-share/export route.

No Calendar mutation route is authorized by this unit.

## Schema authority

Migration **078 — `staff_browser_sessions.sql`** creates hash-only authentication challenge and browser session persistence with bounded expiry/revocation/attempt metadata and active-session/open-challenge indexes.

Normal production startup now executes the narrowly bounded `ensure-staff-browser-sessions.js` before application start. It applies exactly migration 078 through the repository migration framework and checksum-verifies the recorded migration. Failure or checksum drift fails startup closed rather than starting on an unknown schema.

## Verification authority

Final PR #459 CI **#1363** / workflow run **32749267356** / job **97502068683** passed on Node **24.14.1**:

- maintenance framework **12/12**;
- SchedulingTimeline parity **6/6**;
- Calendar UX security/read-only **8/8**;
- staff browser session/security **21/21**;
- full regression **966/966**, 0 failed, 0 cancelled, 0 skipped;
- npm audit output: **0 vulnerabilities**.

The preceding CI #1362 failed only because an existing Calendar UX source assertion still expected the pre-session direct `/read-only` mount. That regression assertion was updated to require the middleware-wrapped mount and independent bridge gate; final CI is green.

Render auto-deploy **`dep-da66qejl550s738t5600`** reached **LIVE** on exact application merge **`3a53a465bd1d9e803ac4931ec833d320d5a44fba`**, finishing **2026-08-24T16:12:16.893361Z**.

Production startup logged:

- exact migration 078 verification with `appliedNow: true` and `checksumVerified: true` at `2026-08-24T16:12:03.407Z`;
- Google Calendar provider health passed;
- Shiloh started;
- new-instance `/health` HTTP 200;
- no error-level entries in the bounded post-deploy error log window.

A separate Render read-only Postgres observer query could not negotiate the database-required SSL mode, consistent with the known connector limitation. Production application database connectivity and the startup migration/checksum verification succeeded normally, so this does not create an application or migration gate.

## Existing authority preserved / do not redo

Do not redo PR #451–#458, PR #459, Calendar architecture/security inspection, SchedulingTimeline, Day/Week/Agenda, PR #380 multi-practitioner semantics, or PR #395 Google conflict classification.

Do not expose `ADMIN_API_KEY`, trust browser-supplied scope, weaken Google/provider authority, or infer Calendar mutation authority from this security-boundary completion.

## Next durable decision

**00 — Control & Reconciliation** should accept/freeze the verified-live session boundary. The recommended next sequencing is deliberate activation planning: keep real WhatsApp auth delivery and the Calendar bridge/UX gates off until Control authorizes a bounded production activation/acceptance proof. Calendar mutation remains later and separately controlled.
