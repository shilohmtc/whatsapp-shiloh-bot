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
