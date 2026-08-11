# Shiloh Production Handoff — Next Chat — 11 Aug 2026

This is the concise next-chat entry point. GitHub `main`, Render production, Shiloh CRM and Google Calendar are authoritative over older handoff wording.

## Current state

- ✅ P0 closed / complete.
- ✅ P1 closed / complete; Goldie is retired from active booking and remains archival only.
- ✅ P2 functionally complete; role-scoped WhatsApp admin access and dedicated Marietjie/Abigail calendars are live.
- 🟡 P3 core experience complete, with remaining customer-care/reporting expansion work.
- ⬜ P4 not started.
- ✅ Goldie disconnect gate cleared.

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
- ✅ Final Goldie reconciliation and public booking shutdown.
- ✅ Public CRM-backed services catalogue, professional descriptions, WhatsApp deep links and Shiloh-hosted service imagery.
- ✅ Versioned Booking Policy & explicit WhatsApp consent gate with safe synthetic production verification.
- ✅ Staff-scoped WhatsApp `Today` operational reporting. Christel/Jean-Pierre receive business-wide summaries; Marietjie/Abigail receive practitioner-self summaries only. Production read-only self-test proved zero cross-staff/cross-service leakage and no practitioner revenue exposure.
- ✅ Safe self-test-first engineering workflow is now an authoritative rule.

## Safe self-test-first rule

For every new feature or production change, first attempt automated/CI tests, then synthetic/isolated/dry-run/read-only production verification. Use narrowly guarded temporary test hooks only when needed; remove them afterward and verify the clean final state. Do not send unnecessary real-client messages, alter genuine bookings/calendar events, impersonate staff, weaken authorization or expose cross-staff data merely to test. Ask Christel/Jean-Pierre to intervene only when a real external/personal-account/human-approval step genuinely cannot be performed safely through available tooling.

## New prioritized checklist

1. 🟡 **P3 — WhatsApp birthday template approval/configuration.** Birthday outbound remains fail-closed until an approved Meta template is configured. Inspect current customer-care implementation first, prepare the exact template payload/content, verify safely without messaging real clients, and only ask for Meta-side intervention if provider approval genuinely requires it.
2. 🟡 **P3 — Treatment-aware aftercare and rebooking specialization.** Build service/category-aware aftercare and rebooking guidance on top of the existing customer-care scheduler, with fail-closed mapping for unknown services.
3. 🟡 **P3 — Loyalty redemption automation.** Convert the existing loyalty foundation into a controlled redemption lifecycle with auditability and idempotency.
4. 🟡 **P3 — Reporting expansion.** Reuse the verified scope engine in this order: Tomorrow → This Week → Services/Trends → Availability → optional scheduled weekly owner summary. Never introduce a separate authorization path.
5. 🟡 **P3 optional — Dedicated reminder-confirmation response state.** Implement only if operationally useful after the higher-value P3 items above.
6. ⬜ **P4 — Ozow/payment/voucher architecture.** Discovery/design first, then payment ledger + webhook idempotency, then voucher lifecycle.

## Do not reopen unless a regression is found

- P0 stabilization work.
- P1 Goldie reconciliation/cutover work.
- P2 staff-scope/calendar rollout.
- Existing service catalogue/imagery work.
- Booking Policy consent gate.
- Staff-scoped Today reporting.

## Start here in the next chat

Continue the Shiloh production project from `docs/HANDOFF-NEXT-CHAT-2026-08-11.md`.

Treat GitHub `main`, Render production, Shiloh CRM and Google Calendar as authoritative. Do not redo completed work. Apply the safe self-test-first engineering rule automatically. Start with the highest-priority genuinely unfinished item: **P3 WhatsApp birthday template approval/configuration**.
