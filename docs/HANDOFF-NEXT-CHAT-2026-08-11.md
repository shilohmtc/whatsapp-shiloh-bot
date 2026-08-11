# Shiloh Production Handoff — Next Chat — 11 Aug 2026

This is the authoritative concise next-chat entry point. GitHub `main`, Render production, Shiloh CRM and Google Calendar override older handoff wording.

## Current state

- ✅ P0 closed / complete.
- ✅ P1 closed / complete; Goldie is retired from Shiloh's active booking stack and remains archival only. Goldie's Google third-party booking link removal has been requested and may take up to 5 days to disappear publicly.
- ✅ P2 functionally complete; role-scoped WhatsApp admin access and dedicated Marietjie/Abigail calendars are live.
- 🟡 P3 core experience complete, with the prioritized customer-care/reporting items below genuinely unfinished.
- ⬜ P4 not started.

## 11 Aug final GitHub / Render audit

- GitHub `main` and Render production were aligned before the audit at `ad6c5b1dcd3491921aaaadde92844b4167383499`; subsequent audit fixes were committed directly to `main` and auto-deployed.
- GitHub CI uses Node `24.14.1`, `npm ci`, and the non-mutating `npm test` regression suite.
- Render service `shiloh-whatsapp-bot` is on `main`, auto-deploy is enabled, health path is `/health`, one Starter instance is running, and recent production health checks return HTTP 200.
- No error-level logs were present after the then-current clean production deploy window.
- Audit finding fixed: `englishLanguageGuard` used `max_output_tokens:8`, which current OpenAI Responses rejects because the minimum is 16. It was corrected to 16 and regression-locked.
- Audit finding fixed: the temporary `BIRTHDAY_TEMPLATE_INSPECT_ONCE` startup hook/import was still present in `app.js`; it was removed and regression-locked so normal startup contains only long-running production schedulers.
- Historical same-day startup/test errors seen in Render logs were from superseded deploys/one-time rollout work; do not reopen them unless they recur on the clean current deploy.

## Recently completed and production-verified

- ✅ Christel personal-account Google Calendar permission test.
- ✅ Staff-scoped CRM authorization and role-specific WhatsApp admin menus.
- ✅ Marietjie tenant-practitioner permissions + `Shiloh — Marietjie` calendar.
- ✅ Abigail employee-practitioner permissions + `Shiloh — Abigail` calendar.
- ✅ Existing future appointments populated into staff calendars.
- ✅ Premium customer greeting and walk-in QR registration.
- ✅ Booking confirmation/calendar-add, client cancellation/rescheduling and reminder/customer-care infrastructure.
- ✅ Birthday/loyalty foundations.
- ✅ Catalogue cleanup and legacy Goldie naming cleanup.
- ✅ Google Calendar presentation cleanup.
- ✅ Final Goldie reconciliation and Shiloh-side public booking shutdown/cutover.
- ✅ Public CRM-backed services catalogue, professional descriptions, WhatsApp deep links and Shiloh-hosted service imagery.
- ✅ Versioned Booking Policy & explicit WhatsApp consent gate with safe synthetic production verification.
- ✅ Staff-scoped WhatsApp `Today` operational reporting. Christel/Jean-Pierre receive business-wide summaries; Marietjie/Abigail receive practitioner-self summaries only. Production read-only self-test proved zero cross-staff/cross-service leakage and no practitioner revenue exposure.
- ✅ Public Shiloh booking landing page `/book`, linked to the official WhatsApp assistant with a prefilled booking intent and no hidden auto-redirect. Public branding is now `Shiloh Massage Therapy and Aesthetic Clinic`; headline is `Your appointment starts with Shiloh, your AI assistant.`
- 🟡 Google Business Profile: Shiloh `/book` has been set as the PREFERRED booking link. Goldie provider-link removal was already requested; wait for provider/Google propagation rather than repeatedly editing the profile.
- 🟡 Booking-page photography enhancement is optional polish and waits for original clinic image files; do not use screenshots containing obsolete Goldie copy.
- ✅ Safe self-test-first engineering workflow is authoritative.

## P3 birthday template exact state

- Template submitted to Meta: `shiloh_birthday_wish_v1`.
- Meta template ID: `1537607374270230`.
- WABA ID: `4002592316709920`.
- Last verified provider state: `PENDING` / `MARKETING`.
- Production remains intentionally fail-closed: Render logs show `birthdayTemplateConfigured:false`; `WHATSAPP_BIRTHDAY_TEMPLATE` must not be enabled until Meta approval is positively verified.
- Customer-care code already enforces explicit birthday opt-in and once-per-client/per-birthday-year delivery tracking.
- Important branding note for the next birthday-template pass: the already-submitted v1 body contains `Shiloh Medical & Training Centre`, while the current public brand is `Shiloh Massage Therapy and Aesthetic Clinic`. Before enabling an approved template, explicitly decide whether the Meta template copy must be replaced/versioned to the current public brand. Do not silently enable mismatched customer-facing copy.

## Safe self-test-first rule

For every new feature or production change, first attempt automated/CI tests, then synthetic/isolated/dry-run/read-only production verification. Use narrowly guarded temporary test hooks only when genuinely needed; remove them afterward and verify the clean final state. Do not send unnecessary real-client messages, alter genuine bookings/calendar events, impersonate staff, weaken authorization or expose cross-staff data merely to test. Ask Christel/Jean-Pierre to intervene only when a real external/personal-account/human-approval step genuinely cannot be performed safely through available tooling.

## New prioritized checklist

1. 🟡 **P3 — WhatsApp birthday template approval/configuration.** First verify current Meta status for `shiloh_birthday_wish_v1`. Keep outbound fail-closed while pending/rejected. Resolve the public-brand mismatch before enabling customer-facing delivery. If the final approved template is correct, configure `WHATSAPP_BIRTHDAY_TEMPLATE`, then safely verify opt-in/idempotency without unintended client messages.
2. 🟡 **P3 — Treatment-aware aftercare and rebooking specialization.** Build service/category-aware aftercare and rebooking guidance on top of the existing customer-care scheduler, with fail-closed mapping for unknown services.
3. 🟡 **P3 — Loyalty redemption automation.** Convert the existing loyalty foundation into a controlled redemption lifecycle with auditability, authorization, atomic state transitions and idempotency.
4. 🟡 **P3 — Reporting expansion.** Reuse the verified scope engine in this order: Tomorrow → This Week → Services/Trends → Availability → optional scheduled weekly owner summary. Never introduce a separate authorization path.
5. 🟡 **P3 optional — Dedicated reminder-confirmation response state.** Implement only if operationally useful after the higher-value P3 items above.
6. ⬜ **P4 — Ozow/payment/voucher architecture.** Discovery/design first, then payment ledger + webhook signature/idempotency, then voucher lifecycle. Keep payment truth separate from appointment truth and never mark paid from a browser redirect alone.

## Do not reopen unless a regression is found

- P0 stabilization work.
- P1 Goldie reconciliation/cutover work.
- P2 staff-scope/calendar rollout.
- Existing service catalogue/imagery work.
- Booking Policy consent gate.
- Staff-scoped Today reporting.
- Completed Google Calendar rollout/presentation cleanup.

## Start here in the next chat

Continue the Shiloh production project from `docs/HANDOFF-NEXT-CHAT-2026-08-11.md`.

Treat GitHub `main`, Render production, Shiloh CRM and Google Calendar as authoritative. Do not redo completed work. Apply the safe self-test-first engineering rule automatically. First verify GitHub/Render are clean on the handoff commit, then start the highest-priority genuinely unfinished item: **P3 WhatsApp birthday template approval/configuration**, including the current-brand copy check before enabling outbound birthday delivery.
