# Shiloh OS — Production Handoff — 12 Aug 2026

This is the authoritative next-chat entry point. GitHub `main`, Render production, Shiloh CRM and Google Calendar override older notes.

## Audited current production state

- GitHub `main` and Render production are aligned at `f65dac00e8a6afcefa4b7cc0dfb3fdb178cece25` after PR #131.
- Render service `shiloh-whatsapp-bot` remains on `main` with auto-deploy enabled and health path `/health`.
- Post-release verification for the current release showed clean startup, repeated HTTP 200 health checks, and a booking-integrity scan with zero unlinked booking-like events.
- CRM remains authoritative for appointments, services, staff eligibility, client identity, reporting and attendance state. Google Calendar remains availability/diary/mirror infrastructure rather than appointment truth.
- Client-bookable practitioners remain Christel, Abigail and Marietjie only. Savanna/Pieter remain internal overflow freelancers and are excluded from direct client discovery and routing.

## Completed checklist

1. ✅ **Admin Menu reliability + real WhatsApp UI.** Top-level Admin uses genuine WhatsApp interactive controls with stable action IDs; route coverage is regression-locked for Christel, Abigail and Marietjie; scoped authorization, hard Menu/Home escape and no advertised-action generic fallback are preserved.
2. ✅ **Client booking UX + service/practitioner discovery.** CRM-backed WhatsApp-native category/service/practitioner/availability journey, including explicit Any available, identity/onboarding preservation and guarded confirmation. Clients can start with a treatment and see only currently eligible practitioners, or start with a practitioner and see only their active mapped services. A missing practitioner preference no longer silently defaults to Any available; the client must explicitly choose a named practitioner or the explicit Any available option before date/time/confirmation UI proceeds. Internal freelancers are excluded.
3. ✅ **Authoritative practitioner profiles + AI knowledge.** Active practitioner/service mappings are authoritative in AI context. Approved public titles are now Christel — “Massage practitioner”, Abigail — “Massage practitioner”, and Marietjie — “Esthetician”. Internal owner/employee/tenant classifications are not exposed as client-facing booking roles. No bio, qualification, specialty, credential or experience claim may be inferred; such descriptive fields remain approval-gated and fail-closed unless explicitly supplied.
4. ✅ **Booking-path end-to-end production audit.** Explicit policy acceptance leads to final locked revalidation and canonical CRM write; stale slots fail closed, transient failures are retryable, shared/practitioner calendar mirroring is synchronized and partial calendar writes are compensated.
5. ✅ **Admin reporting/earnings production audit.** Earnings are completed-only and fail closed/provisional when final attendance truth is missing. Production audit found zero unresolved Goldie exceptions. Today was clean for Christel and Abigail. Historical provisional totals were caused only by canonical past appointments awaiting explicit final status. A guarded WhatsApp-native “Finalize past visits” workflow is live: authorized admins explicitly choose Completed or No-show; the appointment is revalidated/row-locked and canonical status, status history, lifecycle state and CRM audit are updated transactionally. Attendance is never inferred from elapsed time.
7. ✅ **Remaining P3 customer-care engineering.** Treatment-aware aftercare/rebooking is live and suppresses rebooking pressure for recovery cases. Loyalty visits/rewards are completed-appointment-backed, idempotent and have explicit guarded redemption. PR #127 added explicit reminder confirmation: only after a reminder has actually been sent, the WhatsApp number must resolve to exactly one active CRM client; ambiguous appointments require a booking number; final confirmation is row-locked/transactional and moves canonical `scheduled` -> `confirmed` only when needed plus lifecycle -> `confirmed_by_client`. It never marks attendance/completion/no-show/cancellation or payment truth.

## External blocker — birthday template

6. 🟡 **Birthday template approval/configuration.** Current Meta provider state was rechecked read-only on 12 Aug 2026. `shiloh_birthday_wish_v2` exists, category `MARKETING`, language `en`, submitted copy uses the current “Shiloh Massage Therapy and Aesthetic Clinic” brand, but provider status is still `PENDING`. Legacy `shiloh_birthday_wish_v1` is also `PENDING`. `WHATSAPP_BIRTHDAY_TEMPLATE` remains unset, so birthday sending is disabled. `safeToEnable=false`. Do not enable unless v2 becomes positively `APPROVED` and brand-copy verification still passes.

## P4 payments foundation

8. 🟡 **P4 payments/Ozow/vouchers — architecture foundation complete, activation blocked on approved provider/business configuration.** PR #129 added `docs/P4-PAYMENTS-ARCHITECTURE.md` and a pure non-mutating `src/domain/paymentState.js` contract with CI coverage. No payment migration, provider credential, Ozow call, payment link, callback/webhook, payment route or WhatsApp payment message is enabled.

Authoritative P4 rules now recorded:

- payment truth is a separate state machine from booking, attendance, calendar and loyalty truth;
- `paid`, partial-refund and refund truth require verified-provider evidence;
- provider/browser redirects alone may never assert payment success;
- failed/cancelled/expired intents are not resurrected; retries use a new payment intent/reference;
- unique opaque merchant references must contain no treatment/health/client-sensitive meaning;
- appointment cancellation and monetary refund are separate operations;
- Ozow Voucher Redemption and any future Shiloh-issued gift voucher are separate product/domain concepts;
- real payment activation remains feature-off until current Ozow merchant integration details, credentials, clinic payment/deposit/refund policy, POPIA retention, idempotency/reconciliation and sandbox tests are approved.

Current next P4 gate: determine the actual Ozow merchant integration/account configuration and explicitly approve the clinic policy for what is payable (optional full payment vs deposit/full-payment requirement, refund handling, and whether Shiloh wants its own gift vouchers). Do not infer these business rules from booking prices.

## Reporting integrity details

- Christel and Abigail earnings use only canonical appointments with status `completed`.
- Abigail remains 20% commission on eligible completed appointments plus R5,000 monthly salary on the monthly view only; shorter-period views do not prorate salary.
- Joint-practitioner and unpriced appointments fail closed rather than being silently counted.
- Historical `scheduled`/`confirmed` visits remain provisional until an authorized admin explicitly records Completed or No-show.

## Booking/client-care truth boundaries

- Policy acceptance is not itself a booking claim; canonical booking occurs only after final identity, service/practitioner eligibility, clinic/schedule, CRM conflict and both Google Calendar checks.
- Public practitioner titles are presentation metadata only. `staff_services`, active/client-bookable state and authoritative availability decide who may actually perform/book a service.
- “Any available” is an explicit client preference, not the meaning of a missing practitioner field.
- Reminder confirmation means only “the client confirmed the upcoming booking”; it is not attendance/completion/payment evidence.
- Cancellation/rescheduling remain on their existing canonical paths with calendar synchronization.
- Loyalty qualification uses completed appointments only. Loyalty redemption never asserts payment truth.
- Birthday automation remains fail-closed while Meta approval is pending.
- Payment status never changes appointment attendance/status without a separately approved future business rule and implementation contract.

## Prioritized checklist — current state

1. ✅ Admin Menu reliability + real WhatsApp UI.
2. ✅ Client booking UX + service/practitioner discovery, including explicit practitioner preference semantics.
3. ✅ Authoritative practitioner profiles + AI knowledge; approved titles are Christel/Abigail “Massage practitioner” and Marietjie “Esthetician”; unapproved descriptive claims remain fail-closed.
4. ✅ Booking-path end-to-end production audit.
5. ✅ Admin reporting/earnings engineering and production audit; historical truth-review backlog remains operational and explicit.
6. 🟡 Birthday template approval/configuration — externally blocked on Meta `PENDING`, safely disabled.
7. ✅ P3 customer-care engineering — treatment-aware aftercare/rebooking, loyalty lifecycle and explicit reminder confirmation complete.
8. 🟡 **P4 payments/Ozow/vouchers.** Architecture and pure state contract complete. Real provider/data activation is deliberately blocked until merchant configuration and clinic payment/refund/voucher policy are explicitly known and sandbox-tested.

## Safe engineering rule

Test safely yourself first: CI/non-mutating regression tests -> synthetic/read-only production verification -> narrowly guarded test hooks only when necessary. Do not send unnecessary real-client messages, mutate genuine appointments, weaken authorization, bypass CRM/calendar integrity, or infer payment/attendance truth to test.

## Start here in the next chat

**Shiloh OS**

Continue the Shiloh OS production project from `docs/HANDOFF-NEXT-CHAT-2026-08-12.md` and `docs/P4-PAYMENTS-ARCHITECTURE.md`.

Treat GitHub `main`, Render production, Shiloh CRM and Google Calendar as authoritative. Do not redo completed work. Apply the safe self-test-first engineering rule automatically.

For P4, preserve payment activation fail-closed. The next provider implementation slice begins only after the actual Ozow merchant integration/account configuration and Shiloh payment/deposit/refund/voucher business policy are known. Preserve #6 birthday sending fail-closed until Meta positively approves `shiloh_birthday_wish_v2`.
