# Shiloh OS — Master Project Status

Updated: 2026-08-14
Purpose: permanent current-state project-management source of truth across ChatGPT sessions.

## Authority model

Operational truth remains GitHub `main`, Render production, Shiloh CRM, Google Calendar, and explicit real WhatsApp/human acceptance evidence. Never infer human/provider/CRM state that has not been positively observed. Historical detail remains preserved in `docs/archive/SHILOH-OS-MASTER-STATUS-pre-approval-2026-08-14.md`; do not redo completed work merely because it is summarized here.

## Current production baseline

- PR #203 fixed Dummy Test approval identity: Jean-Pierre is an authenticated business-admin account and does not require a clinic `staff_id`; Dummy Test bookings target JP's qualifying `staff_admin_accounts.id` directly and fail closed on ambiguity.
- Ordinary approval policy remains: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative.
- Client-created pending holds have no automatic expiry and remain unavailable until explicit approval/decline.
- MediHeel treatment ownership remains **Christel only**.
- PR #205 corrected pending-hold reviewer copy so client-facing text reflects the resolved approval authority rather than blindly naming the assigned practitioner.
- PR #207 replaced raw confirmation calendar links/typed-only change instructions with native WhatsApp calendar CTAs and Reschedule/Cancel controls while preserving typed fallbacks.
- PR #209 polished calendar CTA card wording to `Add to Google Calendar` / `Add to Apple / Outlook`.
- PR #210 added deterministic appointment-selection controls for multi-booking Reschedule/Cancel journeys: up to three reply buttons, paginated list above three, typed booking-number fallback, and no guessing.
- **PR #211 is the current runtime baseline for reminder/change coordination:** squash merge `e701baaa06565b81675bf7de7ad48efdf21c8eec`; Render deploy `dep-d9vf0cdbedkc7383lcig` reached `live`.
- Direct Render Postgres reads remain tooling-limited by the known SSL/TLS connector failure; do not treat that limitation as CRM truth.

## Real Client Perspective acceptance — 2026-08-14

### Appointment #564 — fully accepted positive approval path

Real Dummy Test WhatsApp evidence proves the complete positive approval chain for appointment **#564**:
- Medi-Heel Pedicure (With Gel Toes) & Foot Massage resolved to Christel.
- `RETRY BOOKING` created one canonical held appointment after the earlier JP identity defect was repaired.
- Client was told the slot was held, there was no automatic expiry, and the booking was not yet confirmed.
- JP received the correct actionable Approve/Decline request and was explicitly named as the sole required approver for Dummy Test.
- While pending, the 10:45 slot disappeared from fresh authoritative availability.
- JP approved #564 and received confirmation that Jean-Pierre approved it.
- Dummy Test received the correct final confirmation for Saturday 15 August 2026, 10:45–12:15.
- Google Calendar independently showed the event on **Shiloh — Bookings** with CRM appointment #564, Dummy Test, mobile `27716742646`, service, Christel, and source `shiloh_client_whatsapp`.
- The visible calendar architecture has no separate `Shiloh — Christel`; Christel's booking is correctly represented on shared `Shiloh — Bookings`. Do not invent a separate-Christel-calendar requirement.

This closes the positive Dummy Test approval lifecycle. A separate genuine JP-decline case remains open, as do ordinary-client approval acceptance cases.

### Confirmation UX — real accepted

A new controlled Dummy Test booking **#565** was created for the same MediHeel treatment with Christel at 12:30–14:00 and approved by JP. Real WhatsApp confirmed the production confirmation UX:
- concise `Booking confirmed 🌿` summary;
- no raw calendar URLs;
- Google Calendar CTA button;
- Apple / Outlook CTA button;
- Reschedule reply button;
- Cancel booking reply button;
- typed `RESCHEDULE` / `CANCEL` fallbacks retained;
- `We look forward to seeing you. 🌿` retained.

PR #209 subsequently polished the CTA card body copy without changing links or booking semantics.

### Multi-booking change selection — real accepted

Dummy Test has #564 and #565. Pressing Reschedule correctly refused to infer which appointment the client meant. After PR #210, the same flow displayed deterministic selection buttons:
- `10:45 · #564`
- `12:30 · #565`

The message also retained full appointment summaries, stated that other bookings remain unchanged, and retained typed booking-number fallback. Selecting `12:30 · #565` correctly isolated appointment #565 and entered its reschedule journey without changing #564.

The reschedule flow then accepted `Tomorrow` and retained the canonical service/practitioner context, reaching the new-date time-of-day selection for #565.

## Product-Critical defect found during #565 reschedule — reminder collision

While Dummy Test was actively rescheduling #565, the lifecycle scheduler sent the existing appointment reminder for the same 12:30 booking. The real screenshot exposed three issues:
- reminder delivery collided with an active reschedule journey and could confuse the client about which state was authoritative;
- visible reminder greeting fell back to `Hello there` even though CRM knows the client as Dummy Test;
- the currently approved Meta reminder template still presents typed change wording rather than the newer confirmation-button UX.

Repository inspection proved the coordination defect: `appointmentLifecycle.claimDueReminder()` claimed due reminders solely from lifecycle timing/status and did not inspect `appointment_change_intents`.

### PR #211 repair

PR **#211** repairs the product-critical parts self-test-first:
- regression commit `563d0e817bd7d38f83cdbfa44b1386a9582a6025` failed CI **#586** before implementation;
- final implementation head `e7856e00384e6b3309737b502f79e2873a2ea707` passed CI **#588**;
- squash merge `e701baaa06565b81675bf7de7ad48efdf21c8eec` is production-live on Render deploy `dep-d9vf0cdbedkc7383lcig`.

Runtime contract now:
- a due appointment reminder is **not claimable** while the same WhatsApp client has an `appointment_change_intents` row with `status='collecting'` and action `reschedule` or `cancel`;
- because `reminder_sent_at` is not claimed during suppression, reminder eligibility can resume after the client change intent clears, against the then-authoritative appointment state;
- reminder greeting name now first resolves exactly one active CRM client through canonical client contacts and uses `clients.display_name`; only if that cannot be safely resolved does it fall back to transient profile memory / `there`.

The Meta reminder-template button presentation is **not claimed fixed** by PR #211. The active reminder is delivered as an approved provider template through `sendWhatsAppTemplate`, whose current sender supplies body parameters only. Do not bolt on a free-form interactive message outside the customer-service window and call that equivalent. Reminder-template Reschedule/Cancel buttons remain provider/template work and must stay fail-closed until the exact Meta template contract is updated/approved and real-delivery evidence exists.

## Google Contacts truth

🟠 **Google Contacts is not currently synchronized with Shiloh CRM.** Connected Contacts search did not find Dummy Test, and repository inspection found no Google Contacts/People API CRM client-sync implementation. Shiloh CRM remains authoritative. If implemented later, use a deliberate one-way CRM → Google Contacts design with normalized-phone deduplication, durable CRM identity linkage, controlled existing-active-client backfill, incremental sync, auditable failures, and privacy/deletion rules. Test/demo clients should be excluded by default unless explicitly authorized.

## Remaining-work ledger

### Client Perspective Testing
- ✅ Lymphatic family/routing and treatment presentation accepted.
- ✅ Beauty & Aesthetics treatment presentation accepted.
- ✅ Elim MediHeel presentation and Christel-only routing accepted.
- ✅ #564 positive Dummy Test approval, indefinite hold, slot exclusion, final confirmation and Google Calendar event accepted.
- ✅ Confirmation action UX accepted on #565.
- ✅ Multi-booking appointment-selection UX accepted for Reschedule entry.
- 🔵 **#565 reschedule lifecycle remains the immediate Product-Critical continuation.** Reminder collision is repaired and production-live; continue from the already selected #565 date/time-of-day step rather than restarting.
- 🟠 Reminder-template native Reschedule/Cancel buttons remain provider-template evidence-gated; do not claim complete until Meta template configuration is approved and observed live.
- ⬜ Complete #565 reschedule through authoritative availability, confirmation/write, Calendar update and final client message; verify #564 remains unchanged.
- ⬜ Later test Cancel booking on a controlled appointment.
- ⬜ Separate genuine Dummy Test JP-decline test.
- ⬜ Ordinary approval acceptance: Marietjie self; Christel self; Abigail or Christel first valid decision.

### Attendance/finalization/earnings
- 🟠 Six known Christel/Abigail attendance finalizations remain fail-closed pending genuine Completed/No-show truth. Never infer attendance.
- ⬜ Remaining authorized-user finalization/earnings UX acceptance, including Marietjie self-view.

### Admin / payments / Meta / privacy
- ⬜ Finish only genuinely unverified role-specific WhatsApp Admin paths after the client-critical gate.
- 🟠 Ozow remains blocked on merchant configuration and explicit payment/deposit/refund/gift-voucher rules.
- ⬜ Verify existing Instagram `@shiloh_massage_studio` ownership/access before connection; never create a duplicate by assumption.
- Existing privacy safety foundations remain mandatory; destructive privacy execution stays disabled pending legal/owner authorization and sufficient evidence.

## Exact continuation state

**Do not recreate cancelled #561. Do not recreate or mutate #564 merely for proof.** Appointment #564 is confirmed and accepted. Appointment **#565** is the controlled current reschedule test appointment.

Real WhatsApp state immediately before PR #211:
- client pressed Reschedule;
- Shiloh showed #564/#565 deterministic booking-selection buttons;
- client selected `12:30 · #565`;
- Shiloh entered #565 reschedule date selection;
- client selected `Tomorrow`;
- Shiloh retained `Medi-Heel Pedicure (With Gel Toes) & Foot Massage`, `Practitioner: Christel`, and asked for time of day with **Morning / Afternoon / Evening** buttons;
- the old reminder then collided with the journey; that collision is now repaired in production by PR #211.

**Next real action:** continue the existing #565 reschedule intent by pressing **Afternoon** on the current time-of-day prompt. Do not restart Reschedule and do not create another booking. Verify authoritative available times, then continue the canonical reschedule flow. #564 must remain unchanged throughout.

Preserve all provider-template, attendance, payments, privacy and other externally blocked items fail-closed.