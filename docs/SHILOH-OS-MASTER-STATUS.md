# Shiloh OS — Master Project Status

Updated: 2026-08-14
Purpose: permanent current-state project-management source of truth across ChatGPT sessions.

## Authority model

Operational truth remains GitHub `main`, Render production, Shiloh CRM, Google Calendar, and explicit real WhatsApp/human acceptance evidence. Never infer human/provider/CRM state that has not been positively observed.

Historical detail from the pre-approval ledger is preserved verbatim at `docs/archive/SHILOH-OS-MASTER-STATUS-pre-approval-2026-08-14.md`. That archive remains completion evidence; do not redo completed work merely because it is not repeated here.

## Current production baseline

- Production runtime code baseline: PR #203 squash merge `cb8091ef36e5805635a4c4e82b7d198454d2c451` (`Fix Dummy Test JP admin-account approval hold`). Render deploy `dep-d9vdt1jbc2fs73cbjtk0` reached `live` on that exact runtime commit.
- PR #190 polished new-booking availability client copy and is production-live.
- PR #191 introduced mandatory approval for future client-created bookings with an indefinite held slot and fail-closed final confirmation.
- PR #192 established ordinary-client approval: Marietjie self; Christel self; Abigail may be decided by Abigail or Christel, with the first valid decision authoritative and audited.
- PR #193 introduced the controlled CRM Dummy Test override: unique active CRM `Dummy Test` bookings require JP/Jean-Pierre alone to approve/decline; ambiguity fails closed.
- **PR #203 corrects the JP identity model:** Jean-Pierre is an authenticated business-admin account and is intentionally not required to be clinic staff. His historical migration explicitly permits `staff_id = NULL`. Dummy Test approval now targets the unique qualifying `staff_admin_accounts.id` directly instead of incorrectly requiring a staff join.
- Pending client booking holds have no automatic expiry, timer, TTL or background release. A pending hold remains a non-cancelled canonical appointment and blocks authoritative availability until explicit approval or decline.
- Final customer confirmation for `shiloh_client_whatsapp` appointments is fail-closed unless booking approval is exactly `approved`. Decline cancels the hold, releases Calendar mirrors/slot occupancy and safely notifies the client.
- PR #194 fixed the English-language interception defect on `Lymphatic drainage treatments`; PR #195 fixed natural-family routing fallthrough. Real WhatsApp proved the exact phrase renders the CRM-backed Lymphatic list.
- PR #197 polished the booking-entry family menu while preserving stable `client_family_*` IDs: `Beauty & Aesthetics`, `Massage Treatments`, `Lymphatic Drainage`, `Elim MediHeel Pedicures` with action-oriented descriptions.
- Authoritative clinic evidence establishes **MediHeel treatments are Christel-only**. PR #201 corrected the family and CRM ownership contract accordingly. PR #199's temporary Marietjie assignment is superseded and must not be reused.
- Direct Render Postgres reads remain tooling-limited by the known SSL/TLS connector failure. Do not treat that limitation as CRM truth.

## Real Client Perspective evidence — 2026-08-14

### Completed/accepted in this session

- `Lymphatic drainage treatments` now reaches the CRM-backed family list. Observed: `Facial Lymphatic Drainage Massage` (60 min, R450) and `Lymphatic Drainage Reset Package` (90 min, R500).
- **Elim MediHeel Pedicures is real-accepted after the Christel correction.** WhatsApp displayed two existing treatments:
  - `Medi-Heel Pedicure (No Gel Toes) & Foot Massage` — 75 min — R490.
  - `Medi-Heel Pedicure (With Gel Toes) & Foot Massage` — 90 min — R510.
- Selecting `Medi-Heel Pedicure (With Gel Toes) & Foot Massage` correctly resolved `Practitioner: Christel`.
- Date selection for Saturday, 15 August 2026 correctly led to authoritative Christel availability.
- Real availability list displayed Christel slots from 10:45 through 12:30 with readable treatment descriptions; the prior truncation/pagination/internal-copy defects did not recur.
- Selecting 10:45 produced a correct booking-preference summary and explicitly stated `Nothing is booked yet`.
- Booking Policy & Terms version `2026-08-11-v1` displayed correctly and required explicit `I AGREE`.

### Product-Critical failure found and repaired

After Dummy Test sent `I AGREE`, production safely replied that policy acceptance was recorded but the final appointment write could not be completed and **did not claim a booking**. This fail-closed behavior was correct, but the write failure was a Product-Critical defect.

Root cause is proven from repository truth:
- migration `012_add_jean_pierre_admin.sql` says Jean-Pierre is a project administrator, not necessarily clinic staff, and `staff_id` may remain NULL;
- the PR #193 approval trigger incorrectly required Jean-Pierre's admin row to join an active `staff` row and stored the required approver only in `approver_staff_id`;
- because the trigger executes on `appointment_staff` inside the booking transaction, that mismatch aborted the canonical final write.

PR #203 repairs the model without creating a fake clinic staff record:
- `appointment_booking_approvals` now supports nullable `approver_staff_id` plus `approver_admin_id` referencing `staff_admin_accounts(id)`;
- ordinary practitioner approvals continue to use `approver_staff_id` unchanged;
- Dummy Test resolves exactly one active Jean-Pierre `business_admin` account with `all_business`, `all_services`, and a WhatsApp identity, then stores that admin-account ID as the sole approver;
- decision authorization compares JP's actual admin-account ID; JP's `staff_id` may remain NULL;
- the atomic hold trigger uses the same admin-account contract and still fails closed on missing/ambiguous JP authority;
- migration `031_dummy_test_jp_admin_approver.sql` backs the runtime schema correction.

The failed booking transaction rolled back, while the already-recorded policy-accepted booking intent remains available for the explicit retry path. `RETRY BOOKING` re-runs final canonical availability/calendar checks and does not start a second booking journey.

## Self-test-first evidence

- PR #191: final head `ac4d35eea6c47a9ca38252cb11e69e5c5b44fed1` passed CI #497; merge `bbdbbcc8f0d2a2bc8816ac56349c75c6c8d960fc`; Render live.
- PR #192: regression `d5fe3f20b23d5cfb9b35ad8ef828998134e531b6` failed CI #499; final head `bf761b0ad7f1be91bc22b60d8fd18f32aad8bd5f` passed CI #500; Render live.
- PR #193: regression `7bb7c8b10fa8cba9373fe2dc2282e7461740d3c9` failed CI #503; final head `ec2dfba4e69a5677d6177a29442333d45f127090` passed CI #506; Render live.
- PR #194: screenshot-derived regression failed CI #509; final head passed CI #511; Render live.
- PR #195: natural-family routing regression failed CI #517; final head passed CI #518; real WhatsApp subsequently accepted.
- PR #197: regression-first copy change; an unsafe branch overwrite was caught by CI and corrected before merge; final CI #532 passed and production deployed.
- PR #201: Christel-only MediHeel regression `b28919fb99a38474bcb13a05536d88f7af24a658` failed CI #545; final head `0e43c29e1dcd31079a7f85db7ee0fa163e5db5d1` passed CI #552; Render live.
- **PR #203:** exact JP-admin-account regression commit `564a143363d20c3ff089b4f3b98dc4b331eba3aa` failed CI #556 before implementation. Final head `aad08a5c672083004e1511d5c5af44b809d61505` passed CI #559. Squash merge `cb8091ef36e5805635a4c4e82b7d198454d2c451`; Render deploy `dep-d9vdt1jbc2fs73cbjtk0` reached live.

## Verification-quality rule

- Code/CI proves implementation contracts; it does not replace real WhatsApp/Meta/CRM acceptance.
- Deterministic client-visible defects found manually must become regressions before repair where feasible.
- Explicit clinic/operator evidence overrides engineering inference about service/practitioner eligibility.
- Do not seed duplicate MediHeel services or invent staff records to satisfy authorization schemas.
- On high-churn files, preserve current `main` and apply the smallest safe semantic delta.

## Product-Critical Gate

🔵 **Client Perspective Testing remains product-critical. Immediate next action: continue the already accepted Dummy Test request by sending exactly `RETRY BOOKING` once.**

Do not restart the journey and do not recreate cancelled appointment #561.

Expected next acceptance sequence:
1. `RETRY BOOKING` re-runs final availability, CRM/schedule and Calendar checks for the existing accepted MediHeel/Christel/Sat 15 Aug 2026 10:45 intent.
2. If the slot remains genuinely available, Shiloh creates one canonical held appointment and tells Dummy Test it is pending approval/not confirmed.
3. Stop before any decision. Capture Dummy Test's held wording and JP's actionable Approve/Decline request.
4. Verify the exact Christel/time slot is excluded from availability while pending.
5. The hold must persist indefinitely until explicit decision; no automatic expiry.
6. JP/Jean-Pierre alone must be authorized for this Dummy Test request; Christel is the assigned practitioner but not the required decision-maker.
7. JP approval should unlock final client confirmation and calendar-link flow.
8. Verify shared and Christel Google Calendar mirrors/client-mobile presentation on this same genuine booking.
9. Test JP decline later using a separate genuine Dummy Test request.
10. Ordinary-client approval acceptance remains afterward: Marietjie self; Christel self; Abigail or Christel first decision.

## Remaining-work ledger

### A — Attendance/finalization/earnings
- 🟡 Six known Christel/Abigail attendance finalizations remain fail-closed pending genuine Completed/No-show truth. Never infer attendance.
- ⬜ Remaining authorized-user finalization/earnings UX acceptance, including Marietjie self-view.
- ✅ Historical attendance/earnings foundations and completed-only reporting remain accepted.

### B — Admin acceptance
- ⬜ Finish only genuinely unverified role-specific WhatsApp Admin paths after the client-critical gate.
- ✅ Permission-gated read-only full client detail and CRM #836 acceptance completed.
- Preserve Jean-Pierre as business admin; do not fabricate a clinic staff identity for him.

### C — Client Perspective Testing
- ✅ First-time Dummy Test registration and historical #561 booking/reschedule/cancellation evidence retained; #561 remains cancelled.
- ✅ Lymphatic language/routing and treatment-list presentation real-accepted.
- ✅ Beauty & Aesthetics treatment-list presentation real-accepted.
- ✅ Elim MediHeel list + Christel routing real-accepted on 2026-08-14.
- ✅ New-booking availability client copy exercised cleanly in the current real journey through time selection.
- 🔵 Dummy Test pending-hold creation/wording awaiting one post-PR-#203 `RETRY BOOKING` acceptance.
- 🔵 JP approval request/sole authority, pending-slot exclusion, indefinite hold, approval→final-confirmation awaiting same genuine journey.
- 🟡 Booking-confirmation Meta template remains fail-closed until exact provider Active/APPROVED evidence; plain text remains safe active path.
- 🟡 Calendar-mobile presentation waits for the current genuine booking to reach held/approved state.
- ⬜ Natural practitioner/service conversational questions remain opportunistic acceptance work.

### D — Customer care/lifecycle
- ✅ Backend customer-care/lifecycle foundation deployed.
- 🟡 Real lifecycle/provider-template acceptance remains evidence-gated.

### E — Payments
- 🟡 Ozow remains blocked on merchant configuration and explicit payment/deposit/refund/gift-voucher rules.

### F — Meta/business assets
- ✅ Preserve Meta keeper portfolio `406573210678288` and existing ownership chain.
- ⬜ Verify existing Instagram `@shiloh_massage_studio` ownership/access before connection; never create a duplicate by assumption.
- ⬜ Business verification/naming rejection investigation remains open.

### Privacy/governance
- Existing privacy safety foundations remain mandatory and fail-closed.
- Destructive privacy execution remains disabled pending legal/owner authorization and sufficient evidence.

## Exact continuation state

PR #203 is merged, CI-green and production-live. The previous policy-accepted final write failed because the Dummy Test trigger required JP to be clinic staff even though his authoritative admin migration explicitly permits `staff_id = NULL`. That model is corrected to admin-account authorization. **Next real action is one message from the same CRM Dummy Test conversation: `RETRY BOOKING`.** Do not restart service/date/time selection. If it creates the pending hold, stop before JP decides and capture both Dummy Test and JP screens. Do not recreate #561. Preserve all WAITING items fail-closed.

## Latest operational reconciliation — appointment #564 / PR #205

**This section supersedes the earlier Product-Critical Gate and Exact continuation instructions above.** Real Dummy Test WhatsApp evidence proves `RETRY BOOKING` succeeded and created canonical held appointment **#564**. The client received `Booking request received — #564`, explicit wording that the selected time is being held, `there is no automatic expiry`, and `Your appointment is not yet confirmed`. This closes the final-write retry gate and provides real human evidence for the basic pending-hold/no-expiry/not-confirmed contract.

The same real screenshot exposed a new deterministic client-presentation defect: the pending message said `while Christel reviews the request`. For this controlled Dummy Test journey that is semantically wrong because Christel is the assigned MediHeel practitioner while **JP alone is the required approver**. Repository inspection proved authorization itself remained admin-account based after PR #203; the misleading text came from `bookingPolicy.stageCreatedBookingForApproval()` blindly interpolating `staff.staff_name_snapshot` and saying `the practitioner` in the no-expiry sentence.

PR #205 corrects the presentation boundary only:
- the client-visible reviewer is derived from the actual resolved approval notification's `approver` identity;
- if notification identity cannot be surfaced, copy safely says `an authorized approver` rather than inventing the assigned practitioner as decision-maker;
- the no-expiry sentence now says `an authorized approver explicitly approves or declines`;
- no approval authorization, appointment ownership, practitioner assignment, held-slot semantics, Calendar truth or appointment #564 state is changed.

Self-test-first PR #205 evidence:
- regression-only commit `e340bbe7752e2954e32fa4476f2e4f63b4370675` failed CI #563 before implementation;
- runtime commit `01c15f8e0657a9524f4bfb0f4cd9aacb3d783ed3` produced CI #564 failure only because the new source assertion required non-optional `notification.approver` while safe code used `notification?.approver`; runtime behavior was already correct;
- final head `63048e1ac17db084d1dd3e0975f28cde57699cb2` passed CI #565;
- squash merge `0fe9df17c32ba8503124a0f9e09936bdda612ab4` is production-live on Render deploy `dep-d9ve1glbedkc7382rng0`.

### Current Product-Critical Gate

🔵 **Appointment #564 is already held. Do not send `RETRY BOOKING` again, do not create another booking, and do not let JP decide yet.** The immediate evidence required is JP's side of this same appointment: confirm whether JP received actionable **Approve / Decline** controls for #564. This is the live Meta-delivery/sole-authority acceptance gate. If JP received nothing, preserve #564 unchanged and inspect notification evidence before any further state transition.

After JP receipt is proven, verify the exact Christel/time slot is excluded while #564 remains pending. Only after sole-JP delivery and slot exclusion are accepted should JP press Approve. Then verify final Dummy Test confirmation plus both shared and Christel Google Calendar mirrors/client-mobile presentation. A JP decline test remains a separate later genuine request. Ordinary Marietjie/Christel/Abigail approval acceptance remains open afterward. Preserve every unrelated WAITING item fail-closed.

## Latest operational reconciliation — #564 completed / PR #207 / Google Contacts

**This section supersedes every earlier #564 gate and continuation instruction above.** The controlled real Dummy Test journey for appointment **#564** is now fully accepted through approval and Calendar creation:
- JP received the correct actionable Approve / Decline request with Dummy Test, the MediHeel treatment, Christel, Sat 15 Aug 2026 10:45, and explicit sole-JP authority.
- Before JP decided, the same 10:45 slot disappeared from a fresh Christel/MediHeel availability check while #564 remained pending, proving authoritative held-slot exclusion.
- JP approved #564 and received explicit confirmation that Jean-Pierre approved it and that client confirmation was sent.
- Dummy Test received the correct final booking confirmation for Medi-Heel Pedicure (With Gel Toes) & Foot Massage, Christel, Saturday 15 August 2026, 10:45–12:15.
- Connected Google Calendar independently showed the matching event on **Shiloh — Bookings** with `Shiloh CRM appointment #564`, `Client: Dummy Test`, `Mobile: 27716742646`, service, `Practitioner: Christel`, and `Source: shiloh_client_whatsapp`.
- Visible Calendar configuration contains `Shiloh — Bookings`, `Shiloh — Abigail`, `Shiloh — Marietjie` and the primary account, but no separate `Shiloh — Christel`; therefore Christel's real booking architecture is the shared `Shiloh — Bookings` calendar. Do not invent or reopen a separate-Christel-calendar requirement without explicit clinic instruction.

This real journey closes the positive Dummy Test approval lifecycle: request → indefinite pending hold → JP-only actionable approval → held-slot exclusion → JP approval → final client confirmation → canonical Google Calendar event with staff-useful client mobile. A JP **decline** path remains for a separate genuine request. Ordinary-client approval acceptance (Marietjie self; Christel self; Abigail or Christel first valid decision) remains open.

### PR #207 — booking confirmation action UX

The user approved replacing raw confirmation links/typed-only change instructions with native WhatsApp controls. PR **#207** (`Polish booking confirmation actions`) implemented this self-test-first:
- regression-only commit `25842f425243332355a0cc7066f208da866e63b9` failed CI #573 before implementation;
- final head `65afe7fd35d54f1614e3bf224a994d32d13f1321` passed CI #576;
- squash merge `5c83b8f406f1cfce62175f7dc80904faa7cf6d56` is production-live on Render deploy `dep-d9veettbedkc73837hkg`.

Active plain-text confirmation behavior now:
- sends the concise appointment-confirmed summary and retains `We look forward to seeing you. 🌿`;
- removes raw Google/ICS URLs from the visible summary;
- sends **Google Calendar** and, when the ICS endpoint is available, **Apple / Outlook** as WhatsApp CTA URL controls;
- sends **Reschedule** and **Cancel booking** as WhatsApp reply buttons with stable IDs `client_reschedule_booking` / `client_cancel_booking`;
- those IDs normalize into the existing canonical `RESCHEDULE` / `CANCEL` appointment-change commands, while typed `RESCHEDULE` / `CANCEL` remain supported fallbacks;
- supplemental controls are independently logged; failure of an optional button after the core confirmation has already been provider-accepted does not release the idempotency claim and risk a duplicate core confirmation.

The client-phone-in-Calendar requirement was already protected by `tests/calendar-client-mobile.test.js`: client WhatsApp booking carries the uniquely resolved normalized phone into calendar creation and later updates preserve it. Real #564 provides production acceptance of that requirement. The phone is for staff Calendar context; it need not be echoed back to the client in their own WhatsApp confirmation.

### Google Contacts truth

🟠 **Google Contacts is not currently a synchronized Shiloh client store.** A connected Google Contacts search for `Dummy Test` returned no contact, and repository inspection found no Google Contacts / Google People API synchronization implementation. Therefore do **not** state that all existing or new CRM clients are automatically captured in Google Contacts today. Shiloh CRM remains authoritative.

If the clinic chooses to implement Google Contacts synchronization, use a separate explicit workstream and preserve CRM authority. Recommended contract: one-way CRM → Google Contacts; normalized-phone deduplication; durable CRM-client identity metadata where supported; controlled existing-active-client backfill; incremental sync for new/updated clients; auditable failures/retries; and explicit privacy/erasure propagation rules. Never import Google Contacts back into CRM as authoritative truth by assumption.

### Operational hygiene note

During PR #207 staging, two connector calls accidentally created non-runtime placeholder/test files directly on `main`; each was immediately deleted before engineering continued. The resulting cleanup commits `680045f9cd82a80a3c12acb131ccc776d08dde59` and `6cdd3dac01fe8735540923c1a93535134d7bfd52` restored the intended tree. No appointment, CRM, approval, Calendar or production runtime logic was changed by those transient files. PR #207 was then built from the restored `main` and passed its red→green gate normally.

### Exact continuation state

Appointment #564 is confirmed and should not be recreated. Cancelled #561 must never be recreated. The newly deployed PR #207 confirmation controls still need **real WhatsApp transport acceptance on a future genuine confirmation**; do not mutate #564 merely to manufacture that evidence. Once a safe genuine confirmation naturally occurs, verify the Google Calendar and Apple / Outlook CTA controls plus Reschedule / Cancel booking reply buttons. A separate genuine Dummy Test request is needed for the JP-decline path, and ordinary approval-rule acceptance remains open. Preserve all attendance/provider/payment/privacy WAITING items fail-closed.
