# Shiloh OS — Master Project Status

Updated: 2026-08-14
Purpose: permanent current-state project-management source of truth across ChatGPT sessions.

## Authority model

Operational truth remains GitHub `main`, Render production, Shiloh CRM, Google Calendar, and explicit real WhatsApp/human acceptance evidence. Never infer human/provider/CRM state that has not been positively observed. Historical detail remains preserved in `docs/archive/SHILOH-OS-MASTER-STATUS-pre-approval-2026-08-14.md`; do not redo completed work merely because it is summarized here.

## Current production baseline

- Ordinary approval policy remains: Marietjie self; Christel self; Abigail may be approved by Abigail or Christel, first valid decision authoritative.
- Dummy Test approval remains JP admin account alone.
- Client-created pending holds have no automatic expiry and remain unavailable until explicit approval/decline.
- MediHeel treatment ownership remains **Christel only**.
- PR #207 replaced raw confirmation calendar links/typed-only change instructions with native WhatsApp calendar CTAs and Reschedule/Cancel controls while preserving typed fallbacks.
- PR #209 polished calendar CTA card wording to `Add to Google Calendar` / `Add to Apple / Outlook`.
- PR #210 added deterministic appointment-selection controls for multi-booking Reschedule/Cancel journeys: up to three reply buttons, paginated list above three, typed booking-number fallback, and no guessing.
- PR #211 suppressed due reminders during active client change collection and made reminder greetings prefer one unambiguous active CRM client name.
- PR #213 fixed reschedule availability self-conflict by excluding only the appointment being moved and its own Google Calendar event from replacement-slot discovery; ordinary booking availability is unchanged.
- **PR #214 is the current runtime baseline:** squash merge `560ba16efd6bf58c79b757184d15e5292061d9a0`; Render deploy `dep-d9vfrkgu01pc73acdoq0` reached `live`. It adds reusable post-reschedule calendar/change controls plus provider-safe support/provisioning for a future reminder template with native Reschedule/Cancel quick replies.
- Direct Render Postgres reads remain tooling-limited by the known SSL/TLS connector failure; do not treat that limitation as CRM truth.

## Real Client Perspective acceptance — 2026-08-14

### Appointment #564 — fully accepted positive approval path

Real Dummy Test WhatsApp evidence proves the complete positive approval chain for appointment **#564**:
- Medi-Heel Pedicure (With Gel Toes) & Foot Massage resolved to Christel.
- Client was told the slot was held, there was no automatic expiry, and the booking was not yet confirmed.
- JP received the correct actionable Approve/Decline request and was explicitly named as the sole required approver for Dummy Test.
- While pending, the 10:45 slot disappeared from fresh authoritative availability.
- JP approved #564 and Dummy Test received the correct final confirmation for Saturday 15 August 2026, 10:45–12:15.
- Google Calendar independently showed the event on **Shiloh — Bookings** with CRM appointment #564, Dummy Test, mobile `27716742646`, service, Christel, and source `shiloh_client_whatsapp`.
- The visible calendar architecture has no separate `Shiloh — Christel`; Christel's booking is correctly represented on shared `Shiloh — Bookings`.

This closes the positive Dummy Test approval lifecycle. A separate genuine JP-decline case remains open, as do ordinary-client approval acceptance cases.

### Confirmation UX — real accepted

Controlled Dummy Test booking **#565** was created for the same MediHeel treatment with Christel and approved by JP. Real WhatsApp confirmed:
- concise `Booking confirmed 🌿` summary;
- no raw calendar URLs;
- Google Calendar CTA button;
- Apple / Outlook CTA button;
- Reschedule reply button;
- Cancel booking reply button;
- typed `RESCHEDULE` / `CANCEL` fallbacks retained;
- `We look forward to seeing you. 🌿` retained.

### Multi-booking change selection — real accepted

Dummy Test had #564 and #565. Reschedule correctly refused to infer which appointment the client meant and displayed deterministic buttons for `10:45 · #564` and `12:30 · #565`, while preserving full summaries, typed booking-number fallback, and the statement that other bookings remain unchanged. Selecting `12:30 · #565` isolated #565 only.

### #565 canonical reschedule — real accepted

The real #565 reschedule journey is now complete and accepted:
- client selected `Tomorrow` and retained canonical MediHeel + Christel context;
- initial `Afternoon` search exposed a genuine self-conflict defect because #565 could block its own replacement slots;
- PR #213 repaired that defect self-test-first;
- after deployment, the same journey returned authoritative **12:15** and **12:30** options;
- 12:15 was selected as the stronger boundary test because #564 ends exactly at 12:15;
- review screen clearly showed current 12:30 versus new 12:15 and stated `Nothing has changed yet.` before the write;
- `Confirm reschedule` produced the successful client confirmation;
- Google Calendar independently verified #565 updated to **12:15–13:45**, with the same canonical event identity and mobile `27716742646` retained;
- Google Calendar independently verified #564 remained unchanged at **10:45–12:15**;
- the two appointments meet exactly at 12:15 with no overlap.

This closes the canonical #565 reschedule lifecycle itself.

## Reminder/change coordination

During the first #565 reschedule attempt, the old reminder collided with the active change journey. PR #211 repaired this. Real re-observation after the successful reschedule showed the reminder only after the change completed, using the updated **12:15** appointment time and correct CRM name **Dummy Test**. This is accepted evidence that reminder/change coordination and CRM-name resolution now behave correctly in the tested journey.

The visible reminder still used the provider-approved legacy typed change wording. That is not a runtime text defect: the outbound reminder is a Meta template.

### PR #214 polish

PR **#214** adds two layers:
- **Post-reschedule controls:** after a successful reschedule reply, Shiloh now schedules the same Google Calendar CTA, Apple / Outlook CTA, Reschedule button and Cancel booking button used by booking confirmation. The helper reads the already-updated canonical appointment and reuses the existing calendar-share token; it does **not** create a new CRM appointment or Google Calendar event. Supplemental failures are isolated after the primary success reply.
- **Reminder template readiness:** code now supports WhatsApp template quick-reply payloads, routes template quick-reply webhook payloads through the existing canonical client-action router, and includes provisioning for utility template `shiloh_appointment_reminder_actions_v1` with `Reschedule` and `Cancel booking` quick replies. Production continues using the existing approved reminder template unless `WHATSAPP_REMINDER_ACTIONS_TEMPLATE` is explicitly configured after Meta approval. This stays fail-closed.

Self-test evidence for PR #214:
- post-reschedule regression commit `18e5bd0d594a9ab319100da1691b5634eaa46c6e` failed CI **#596** before implementation;
- post-reschedule implementation passed CI **#599**;
- reminder-template regression commit `ffa74aed0de935412c2b845bfea9a76661ac2a96` failed CI **#600** before implementation;
- final head `2985003a61ddd09b8aa9fe284c833325f2750a23` passed CI **#604**;
- squash merge `560ba16efd6bf58c79b757184d15e5292061d9a0` is live on Render deploy `dep-d9vfrkgu01pc73acdoq0`.

Post-reschedule calendar/change controls are code/CI/production-live but still require a future genuine successful reschedule to be marked REAL-ACCEPTED; do not mutate #564 merely for proof. Reminder native buttons remain provider-template WAITING until Meta approves the new template, the production env explicitly selects it, and real delivery is observed.

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
- ✅ #565 canonical reschedule lifecycle accepted through authoritative availability, review-before-write, final write and independent Google Calendar verification.
- ✅ Reminder suppression/name-resolution re-observed successfully after #565 reschedule completion.
- 🟡 Post-reschedule Google/Apple calendar CTAs + Reschedule/Cancel controls are code/CI/production-live via PR #214; REAL acceptance waits for a future genuine successful reschedule.
- 🟠 Reminder-template native Reschedule/Cancel buttons remain provider-template evidence-gated; Meta approval + production configuration + real delivery required.
- 🔵 **Next actionable Client Perspective priority: controlled client cancellation lifecycle.** Prefer appointment #565 if cancellation is intentionally acceptable for the test; preserve #564 as accepted positive-path evidence.
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

**Do not recreate cancelled #561. Do not recreate or mutate #564 merely for proof.**

Current controlled appointments:
- **#564** — confirmed, Saturday 15 August 2026, **10:45–12:15**, Christel, MediHeel; fully accepted positive approval evidence; leave unchanged.
- **#565** — successfully rescheduled and confirmed for Saturday 15 August 2026, **12:15–13:45**, Christel, same MediHeel service; Google Calendar independently verified and mobile retained.

The #565 reschedule intent is complete. A reminder was observed after completion with correct `Hello Dummy Test` and the updated 12:15 time, proving the reminder no longer collided with the active change and resumed against authoritative post-reschedule state.

**Next real Client Perspective action:** test the controlled **Cancel booking** lifecycle. Because cancellation is destructive to the selected appointment, use #565 only if intentionally willing to cancel that controlled test booking. Do not cancel #564. Verify review-before-write, canonical CRM cancellation, Google Calendar removal/update behavior, client confirmation, and that #564 remains unchanged.

Preserve all provider-template, attendance, payments, privacy and other externally blocked items fail-closed.