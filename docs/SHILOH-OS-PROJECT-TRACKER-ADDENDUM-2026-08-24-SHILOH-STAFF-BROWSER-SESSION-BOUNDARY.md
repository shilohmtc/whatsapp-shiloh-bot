# Shiloh OS — Project Tracker Addendum — Staff Browser Session Boundary

Date: 2026-08-24
Owning workstream: **40 — Production & DevOps**
Control acceptance owner after completion: **00 — Control & Reconciliation**
Supporting reviewer: **10 — Booking & Admin UX**
State: **🟢 IMPLEMENTATION VERIFIED LIVE / COMPLETE — 🟠 CALENDAR ACTIVATION AND REAL AUTH MESSAGE DELIVERY REMAIN SEPARATE CONTROL GATES**

## Reconciliation

`SHILOH-STAFF-BROWSER-SESSION-BOUNDARY` is implementation-complete under Control authorization PR #458.

This addendum supersedes the prior Project Tracker authorization state for this unit. PR #451–#458 remain durable authority and must not be redone.

## Application authority

PR **#459 — Implement secure staff browser session boundary** merged as application commit **`3a53a465bd1d9e803ac4931ec833d320d5a44fba`**. Final tested PR head: **`5b4646ecb13fd79cb8074dda9d132907fbf46b1b`**.

The production implementation provides:

- 32-byte cryptographically random opaque browser-session tokens;
- SHA-256-only persistence for session tokens, authentication challenges and CSRF secrets;
- bounded challenge/session expiry, revocation, rotation and last-used metadata;
- challenge issue-rate and attempt limits;
- current canonical `staff_admin_accounts` and active staff authority re-resolution on session validation;
- `business_all_staff` only from current business-wide authority and `own_staff` only from canonical active linked staff identity;
- fixation-resistant rotation that revokes prior sessions after successful authentication;
- fail-closed malformed, tampered, expired, revoked or authority-revoked sessions;
- production `__Host-shiloh_staff_session` cookie with HttpOnly, Secure, SameSite=Strict, Path=/, bounded Max-Age and no Domain;
- same-origin JSON guards and per-session CSRF protection for state-changing session operations;
- no browser exposure/reuse of `ADMIN_API_KEY` or `x-admin-key`;
- no browser-supplied `staffId`, role or Calendar scope as authority.

Migration **`078_staff_browser_sessions.sql`** creates hash-only challenge/session storage. Production startup applies and checksum-verifies exactly migration 078 through `scripts/ensure-staff-browser-sessions.js`; checksum drift fails startup closed.

## WhatsApp delivery boundary

The existing `sendWhatsAppMessage` provider abstraction is reused only through `staffBrowserChallengeDelivery.js` and only when explicit gate `SHILOH_STAFF_BROWSER_AUTH_WHATSAPP_DELIVERY_ENABLED=true` is present.

The gate is default-off in code. CI uses an injected mock provider. This implementation and its production verification did **not** send a real staff authentication message and introduced no new provider secret.

Real authentication-message delivery remains a separate Control activation decision.

## Calendar boundary

Authenticated browser sessions can establish the trusted server viewer context only through the new default-off `SHILOH_STAFF_BROWSER_SESSION_CALENDAR_BRIDGE_ENABLED=true` gate.

The pre-existing `SHILOH_CALENDAR_READONLY_UX_ENABLED=true` gate remains independently required. The implementation did not mutate Render environment configuration to activate either capability. Therefore implementation/deployment does not itself activate general staff Calendar access.

`/calendar/:token.ics` remains the existing independent appointment-share/export surface. Calendar mutation authority remains unchanged and unavailable under this unit.

## Verification evidence

Final PR #459 CI: **#1363** / workflow run **32749267356** / job **97502068683** on Node **24.14.1**.

- maintenance framework: **12/12 passed**;
- SchedulingTimeline parity: **6/6 passed**;
- Calendar UX security/read-only suite: **8/8 passed**;
- focused staff browser session/security suite: **21/21 passed**;
- full non-mutating regression: **966/966 passed**, 0 failed, 0 cancelled, 0 skipped;
- `npm ci`: 174 packages installed, 175 audited, **0 vulnerabilities**.

An earlier CI run #1362 exposed one stale Calendar UX regression assertion that expected the previous direct route mount. The test was repaired to assert the authorized middleware-wrapped route without changing Calendar behavior; final CI is fully green.

## Production verification

Render auto-deploy **`dep-da66qejl550s738t5600`** checked out exact application merge **`3a53a465bd1d9e803ac4931ec833d320d5a44fba`**, used Node **24.14.1**, built successfully and reached **LIVE**, finishing **2026-08-24T16:12:16.893361Z**.

Startup evidence on the new instance proves:

- migration 074 remained checksum-valid and unreplayed;
- migration 078 logged `staff_browser_session_schema_verified`, `appliedNow: true`, `checksumVerified: true`, with `appliedAt: 2026-08-24T16:12:03.407Z`;
- Google Calendar provider health check passed;
- Shiloh started;
- new-instance `GET /health` returned HTTP **200** after startup/cutover;
- bounded production error-level logs after deploy contained no errors.

The Render Postgres connector's separate read-only query path still fails its connection handshake because that connector negotiates without the SSL mode required by this database. This observer limitation does not invalidate migration evidence: the production application itself connected through its normal database path, applied exactly migration 078, checksum-verified it, then started and served healthy traffic.

No real staff-authentication WhatsApp delivery, Calendar activation environment mutation, appointment/CRM mutation or Google Calendar write was performed for proof.

## Still separately controlled

General staff Calendar activation, real WhatsApp authentication challenge delivery, Calendar booking creation, reschedule/cancel/drag-drop, practitioner/service reassignment, schedule/block/leave writes, Google Calendar writes, reduced Google conflict authority or mirror-authority changes remain outside this completed unit.

## Next checkpoint

Owner: **00 — Control & Reconciliation**.

Control should accept/freeze PR #459 and this verified-live reconciliation, then make any later activation decision separately. The recommended sequence is to keep both the WhatsApp authentication-delivery gate and Calendar bridge/UX gates dark until Control deliberately authorizes a bounded activation proof.
