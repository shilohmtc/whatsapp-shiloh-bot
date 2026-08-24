# Shiloh OS — Control Reconciliation — Christel Calendar Pilot Failed at Auth Delivery

Date: 2026-08-24
Owner: 00 — Control & Reconciliation

## Control disposition

`SHILOH-STAFF-CALENDAR-CHRISTEL-PILOT` is accepted as a valid failed production pilot.

Outcome: FAILED AT AUTHENTICATION-CHALLENGE DELIVERY / SAFELY RE-LOCKED.

The prior pilot challenge is consumed and MUST NOT be resent under PR #467 authority.

Production is again default-off/re-locked. No broad Calendar access or Calendar mutation is authorized.

## Accepted production evidence

- Pilot authority: PR #467.
- Authoritative application commit during the pilot: `80c5723016d8a294eaed2a2e7aa704f0955dcc91`.
- Pilot account remained canonical `staff_admin_accounts.id = 2`; no practitioner/staff-ID substitution occurred.
- Exactly the five authorized pilot controls were enabled, then restored to the non-active state after failure.
- Pre-pilot rollout was healthy: migration 078 checksum verified, Google Calendar provider health passed, Shiloh started, repeated HTTP health 200, bounded error window clean.
- Christel deliberately initiated the one authorized challenge through the deployed sign-in UX.
- No second challenge was attempted.
- Re-lock rollout was healthy and ordinary staff Calendar access was again unavailable.
- No appointment, schedule, block, leave, CRM record, booking truth, or Google Calendar event was mutated for proof.

## Control independent diagnosis

Control independently inspected Render production logs and the exact current code path.

At `2026-08-24T19:21:32Z` the staff-auth request produced:

- a real Meta/WhatsApp message ID;
- application log `WhatsApp message sent`;
- HTTP `POST /challenge` completed with status 202.

At `2026-08-24T19:21:33Z`, approximately 1.2 seconds later, Meta posted to `/webhook` and Shiloh returned HTTP 200.

Therefore the failed pilot was NOT a failure to create the challenge, invoke the dispatcher, or receive an immediate Meta API rejection. The send reached Meta and was accepted for processing.

Current `src/controllers/webhookController.js` returns HTTP 200 immediately when the webhook payload contains no `value.messages`; it does not process `value.statuses`. Consequently a status-only callback carrying WhatsApp delivery state is discarded and the actual historical `sent` / `delivered` / `failed` outcome and provider error detail from the pilot cannot be recovered from Shiloh application evidence.

Current `src/services/staffBrowserChallengeDelivery.js` dispatches the staff sign-in challenge through `sendWhatsAppMessage(...)` as free-form text. No staff-authentication template exists in the current `metaTemplateContracts` inventory.

These facts narrow the next work to the WhatsApp/Meta provider-delivery layer. They do not prove the final historical non-delivery cause. In particular, Control will not claim a specific Meta failure code without evidence.

## Next controlled unit

Control authorizes:

`SHILOH-STAFF-AUTH-WHATSAPP-DELIVERY-REPAIR`

Owner: 30 — WhatsApp & Meta Integration.
Supporting operator for Render rollout only when required: 40 — Production & DevOps.
Final acceptance owner: 00 — Control & Reconciliation.

Priority: NOW — highest Calendar dependency.

## Authorized scope

30 must keep all Calendar/staff-auth production activation gates OFF during implementation and automated verification.

The unit must:

1. Add sanitized handling for WhatsApp status-only webhook callbacks (`value.statuses`) without changing existing inbound-message handling.
2. Correlate provider status by Meta message ID only; do not log full recipient phone numbers, challenge codes, session tokens, CSRF tokens, provider credentials, or message bodies containing authentication secrets.
3. Capture at minimum provider status (`sent`, `delivered`, `read`, `failed` where supplied), provider timestamp, sanitized error code/title/message where supplied, and message ID.
4. Preserve webhook HTTP 200 behavior for valid status callbacks and fail closed on malformed/untrusted structures.
5. Add focused tests proving status-only callbacks are processed rather than silently discarded and that existing inbound WhatsApp messages remain unchanged.
6. Inspect the current Meta/WABA template inventory and confirm whether an exact approved authentication-template route is available for staff OTP delivery.
7. Replace the staff-auth challenge free-form production delivery with a Meta-compliant approved authentication-template transport if supported. The preferred target is an exact Shiloh Authentication-category OTP template, not a generic free-form text fallback.
8. Add the new template to Shiloh's exact template-contract/inventory safeguards so production sends fail closed unless the expected template is exact, approved, configured, and sendable.
9. Preserve the existing one-time challenge semantics: short TTL, single-use verification, hashed persistence, rate limits, non-enumerating request behavior, canonical pilot gating, secure server-side sessions, CSRF, and no browser secrets.
10. Verify the canonical staff-auth destination source and normalization path without persisting or exposing Christel's full phone number in GitHub/docs/chat evidence.
11. Add focused mocked-provider tests for successful template dispatch and provider rejection paths.
12. Run all existing WhatsApp/template, staff-session, Calendar-access, pilot-gate suites and full non-mutating regression.

## Exact provider-mutation authority

Control authorizes 30, if current Meta inventory proves no suitable exact approved staff-authentication template exists, to submit exactly ONE new Shiloh staff authentication OTP template for provider review under the existing WABA.

The template must:

- be dedicated to staff authentication only;
- use Meta's authentication/OTP template mechanism if supported by the provider account;
- contain no marketing content;
- contain no client/appointment data;
- expose only the minimum OTP/sign-in wording required;
- be represented by a version-controlled Shiloh exact template contract before any send is enabled.

This authority does NOT authorize sending the template to any real recipient.

If provider constraints prevent an Authentication-category OTP template, 30 must return exact provider evidence to Control rather than silently falling back to free-form text or an unrelated template category.

## No real challenge authority

No second genuine Christel authentication challenge is authorized in this unit.

30 may use mocks and provider inventory/status APIs that do not send a real message. A second real challenge requires a new exact Control authorization after the delivery path is corrected and production evidence is green.

## Completion path

Inspect authoritative current main and provider inventory
→ implement status-callback observability and exact auth-template delivery path
→ focused tests
→ full regression
→ repair until green
→ PR / CI / merge
→ exact Render verification
→ provider inventory/template verification
→ Project Tracker reconciliation
→ Master Status reconciliation
→ return to 00.

Do not stop at an intermediate `In progress` checkpoint while executable work remains and no genuine provider/platform/authorization gate exists.

## Still not authorized

- second genuine authentication challenge;
- enabling pilot/global Calendar access for staff;
- Calendar booking creation;
- reschedule/cancel/drag-drop;
- practitioner/service reassignment;
- schedule/block/leave/closure writes;
- broad staff rollout;
- Google Calendar writes, mirror removal, authority reduction, bidirectional appointment authority, or Google optionality.

## Priority after repair

After Control accepts a verified-live delivery repair, authorize one new bounded Christel read-only pilot challenge. If that pilot succeeds, move immediately to `SHILOH-CALENDAR-CREATE-BOOKING` under 10 — Booking & Admin UX so Christel can book clients from Shiloh Calendar, including eligible bookings with Abigail under canonical guarded booking authority.