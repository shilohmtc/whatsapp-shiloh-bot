# Shiloh OS — Master Project Status

Updated: 2026-08-14
Purpose: permanent current-state project-management source of truth across ChatGPT sessions.

## Authority model

Operational truth remains: GitHub `main`, Render production, Shiloh CRM, Google Calendar, and explicit real WhatsApp/human acceptance evidence. Never infer human/provider/CRM state that has not been positively observed.

Historical detail from the pre-approval ledger is preserved verbatim at `docs/archive/SHILOH-OS-MASTER-STATUS-pre-approval-2026-08-14.md`. That archive is supporting completion evidence; do not redo completed work merely because it is not repeated here.

## Current production baseline

- Production runtime code baseline: `47fe6051a8255c66cdfe4956c02b575fc64f9d9b` after PR #193 (`Require JP approval for CRM Dummy Test bookings`). Render deploy `dep-d9vcfrou01pc73a9k3pg` reached `live` on that runtime commit. Later documentation-only descendants may advance GitHub `main`/Render without changing runtime behavior; verify the exact current heads at the start of each session.
- PR #190 polished new-booking availability client copy and is production-live.
- PR #191 introduced mandatory approval for future client-created bookings with an indefinite held slot and fail-closed final confirmation.
- PR #192 established the ordinary-client business rule: Marietjie bookings are Marietjie-only; Christel bookings are Christel-only; Abigail bookings may be decided by either Abigail or Christel, with the first valid decision authoritative and audited.
- PR #193 adds a **controlled CRM Dummy Test override**. If the booking belongs to the unique active CRM client whose canonical display name is `Dummy Test`, the sole required approver is the existing Jean-Pierre (JP) business-admin staff binding. The assigned practitioner and Christel/Abigail ordinary approval rules do not apply to that Dummy Test request.
- Dummy Test identification deliberately reuses the guarded test-client uniqueness contract: there must be exactly one active CRM `Dummy Test` profile. JP resolution is also fail-closed: exactly one active Jean-Pierre staff-admin binding with `business_admin`, `all_business` Calendar scope and `all_services` service scope must exist. Ambiguity/missing authority aborts the booking transaction instead of falling back to practitioner approval.
- Pending client booking holds have no automatic expiry, timer, TTL or background release. A pending hold remains a non-cancelled canonical appointment and therefore blocks that slot in authoritative availability until explicit approval or decline.
- Final customer confirmation for `shiloh_client_whatsapp` appointments is fail-closed unless the booking approval record is exactly `approved`.
- Decline transitions the held appointment to cancelled, releases Calendar mirrors/slot occupancy and notifies the client that nothing is booked.
- Booking approval notification delivery and real Approve/Decline operation still require genuine WhatsApp acceptance evidence. Do not claim those human/provider surfaces verified from code or CI alone.
- Direct Render Postgres read remains tooling-limited by the known `SSL/TLS required` connector issue; do not use that limitation to infer CRM rows.

## Self-test-first evidence for approval gate

- PR #191: regression-first practitioner approval gate. Final head `ac4d35eea6c47a9ca38252cb11e69e5c5b44fed1` passed CI #497; squash merge `bbdbbcc8f0d2a2bc8816ac56349c75c6c8d960fc`; Render deploy `dep-d9vaml6q1p3s738tp5l0` reached live.
- PR #192: regression-only commit `d5fe3f20b23d5cfb9b35ad8ef828998134e531b6` failed CI #499 before implementation. Implementation head `bf761b0ad7f1be91bc22b60d8fd18f32aad8bd5f` passed CI #500. Squash merge `19428aecad9b79941c98885d6995eba46333a110`; Render deploy `dep-d9vc9mdbedkc7381femg` reached live.
- PR #193: regression-only commit `7bb7c8b10fa8cba9373fe2dc2282e7461740d3c9` failed CI #503 before implementation. Final head `ec2dfba4e69a5677d6177a29442333d45f127090` passed CI #506. Squash merge `47fe6051a8255c66cdfe4956c02b575fc64f9d9b`; Render deploy `dep-d9vcfrou01pc73a9k3pg` reached live. Migration `052_dummy_test_jp_booking_approval.sql` mirrors the runtime-enforced trigger update; Render still relies on idempotent runtime schema convergence because migrations are not automatically run on deploy.

## Product-Critical Gate

🔵 **Client Perspective Testing remains product-critical.**

Do not recreate cancelled appointment #561. Its booking, reschedule and cancellation journey is already accepted historical evidence.

The next highest-value actionable acceptance is a **new genuine future CRM Dummy Test booking**. It should prove the new held-booking lifecycle without using #561:

1. Dummy Test completes the normal registered-client booking flow and policy acceptance.
2. Shiloh creates a canonical held appointment but tells Dummy Test it is pending approval, not confirmed.
3. Before decision, the exact practitioner/time is not offered as available to another client.
4. The hold remains indefinitely pending until an explicit decision; no automatic expiry is allowed.
5. **JP/Jean-Pierre alone receives actionable Approve/Decline controls for the CRM Dummy Test request.** The assigned practitioner must not be the required approver for this controlled test identity.
6. JP approval unlocks the existing final client confirmation and calendar-link flow.
7. A later separate Dummy Test request should exercise JP decline: cancellation/release of the held slot and safe client notification.
8. Both shared and practitioner Google Calendar presentation, including client mobile metadata, should be checked on the same genuine future booking rather than by creating an extra artificial booking solely for Calendar acceptance.
9. Ordinary-client approval acceptance remains open afterward: Marietjie self; Christel self; Abigail or Christel first decision.

## Remaining-work ledger

### A — Attendance/finalization/earnings

- 🟡 Six previously known Christel/Abigail attendance finalizations remain fail-closed until genuine Completed/No-show truth is supplied. Never infer attendance from elapsed time or Calendar presence.
- ⬜ Real authorized-user finalization/earnings UX acceptance remains open where not previously proven, including Marietjie self-view.
- ✅ Historical attendance/earnings foundations, explicit authority rules and completed-only reporting remain accepted. See archived Master for detailed evidence.

### B — Admin acceptance

- ⬜ Finish only genuinely unverified role-specific WhatsApp Admin paths after the product-critical client journey.
- ✅ Permission-gated read-only full client detail and CRM #836 acceptance are completed.
- Preserve Jean-Pierre business-admin authority and dedicated non-admin identities for genuine client testing.

### C — Client Perspective Testing

- 🔵 Registered-client return recognition remains real-acceptance work and can be observed naturally when Dummy Test returns.
- ✅ First-time Dummy Test registration, service-family discovery, HIFU→Marietjie routing, authoritative availability, booking #561, reschedule and cancellation are completed historical evidence.
- ✅ Beauty & Aesthetics treatment-list readability/pagination/price presentation was repaired and real-accepted.
- ✅ New-booking availability client copy was polished by PR #190 and is production-live; real journey should naturally exercise it again without repeating completed acceptance solely for copy.
- 🔵 Approval lifecycle is production-live but awaiting genuine WhatsApp acceptance. For CRM Dummy Test specifically, JP is now the sole approver; ordinary-client approval rules remain as defined above.
- 🟡 Booking-confirmation Meta template remains fail-closed until exact provider Active/APPROVED evidence and real template acceptance exist. Plain-text confirmation remains the safe active path unless provider truth changes.
- 🟡 Calendar-mobile presentation acceptance waits for the next genuine future booking; do not fabricate a booking only for this evidence.
- ⬜ Natural practitioner/service conversational questions should continue to be exercised during the real client journey to verify CRM-consistent, non-invented answers.

### D — Customer care/lifecycle

- ✅ Backend customer-care/lifecycle foundation remains deployed.
- 🟡 Real lifecycle/provider-template acceptance remains evidence-gated.
- Birthday/template provider states must be verified exactly before activation or sending.

### E — Payments

- 🟡 Ozow remains blocked on merchant/account configuration and explicit deposit/payment/refund/gift-voucher business rules.
- Safe lower-priority P4 engineering must not displace current client acceptance.

### F — Meta/business assets

- ✅ Preserve Meta keeper portfolio `406573210678288` and existing ownership chain.
- ⬜ Verify existing Instagram `@shiloh_massage_studio` ownership/access before connection; never create a duplicate by assumption.
- ⬜ Business verification/naming rejection investigation remains open.

### Privacy/governance

- Existing P-PRIV safety foundations remain mandatory and fail-closed.
- Destructive privacy execution remains disabled pending legal/owner authorization and sufficient evidence.
- Historical Goldie retention inventory/synthetic rollback work is preserved in the archived Master and must not be repeated unnecessarily.

## Exact continuation state

Production code is live and ready for real acceptance. Do **not** recreate appointment #561. The next controlled test is one new genuine future booking from the active CRM Dummy Test identity, stopped first at pending approval. Capture the client pending/held wording, verify the same practitioner/time is no longer available, and confirm that JP/Jean-Pierre receives the actionable Approve/Decline request as the sole required approver. Then let JP approve and verify final client confirmation plus both Calendar mirrors. Test JP decline separately with a later genuine request.

Before any new engineering, verify GitHub `main` and Render again. Preserve all WAITING items fail-closed and continue to the next actionable priority when external evidence is unavailable.
