# Shiloh OS — Master Project Status

Updated: 2026-08-14
Purpose: permanent current-state project-management source of truth across ChatGPT sessions.

## Authority model

Operational truth remains: GitHub `main`, Render production, Shiloh CRM, Google Calendar, and explicit real WhatsApp/human acceptance evidence. Never infer human/provider/CRM state that has not been positively observed.

Historical detail from the pre-approval ledger is preserved verbatim at `docs/archive/SHILOH-OS-MASTER-STATUS-pre-approval-2026-08-14.md`. That archive is supporting completion evidence; do not redo completed work merely because it is not repeated here.

## Current production baseline

- GitHub `main`: `19428aecad9b79941c98885d6995eba46333a110` after PR #192.
- Render production: deploy `dep-d9vc9mdbedkc7381femg` reached `live` on the same commit.
- PR #190 polished new-booking availability client copy and is production-live.
- PR #191 introduced mandatory practitioner approval for future client-created bookings with an indefinite held slot and fail-closed final confirmation.
- PR #192 corrected the business rule for Abigail bookings: either Abigail or Christel may make the first explicit Approve/Decline decision. Marietjie bookings remain Marietjie-only approval; Christel bookings remain Christel-only approval.
- The first valid approval decision is authoritative. The other authorized Abigail decision-maker is informed of the outcome. CRM audit metadata records the actual decision-maker.
- Pending client booking holds have no automatic expiry, timer, TTL or background release. A pending hold remains a non-cancelled canonical appointment and therefore blocks that slot in authoritative availability until explicit approval or decline.
- Final customer confirmation for `shiloh_client_whatsapp` appointments is fail-closed unless the booking approval record is exactly `approved`.
- Decline transitions the held appointment to cancelled, releases Calendar mirrors/slot occupancy and notifies the client that nothing is booked.
- Booking approval notification delivery and real Approve/Decline operation still require genuine WhatsApp acceptance evidence. Do not claim those human/provider surfaces verified from code or CI alone.
- Direct Render Postgres read remains tooling-limited by the known `SSL/TLS required` connector issue; do not use that limitation to infer CRM rows.

## Self-test-first evidence for approval gate

- PR #191: regression-first practitioner approval gate. Final head `ac4d35eea6c47a9ca38252cb11e69e5c5b44fed1` passed CI #497; squash merge `bbdbbcc8f0d2a2bc8816ac56349c75c6c8d960fc`; Render deploy `dep-d9vaml6q1p3s738tp5l0` reached live.
- PR #192: regression-only commit `d5fe3f20b23d5cfb9b35ad8ef828998134e531b6` failed CI #499 before implementation. Implementation head `bf761b0ad7f1be91bc22b60d8fd18f32aad8bd5f` passed CI #500. Squash merge `19428aecad9b79941c98885d6995eba46333a110`; Render deploy `dep-d9vc9mdbedkc7381femg` reached live.

## Product-Critical Gate

🔵 **Client Perspective Testing remains product-critical.**

Do not recreate cancelled appointment #561. Its booking, reschedule and cancellation journey is already accepted historical evidence.

The next highest-value actionable acceptance is a **new genuine future client booking**, preferably with Abigail because it exercises the widest approval policy surface. The test must prove:

1. Client completes the normal booking and policy-acceptance flow.
2. Shiloh creates a canonical held appointment but tells the client it is pending approval, not confirmed.
3. Before decision, the exact practitioner/time is not offered as available to another client.
4. The hold remains indefinitely pending until an explicit decision; no automatic expiry is allowed.
5. For an Abigail booking, both Abigail and Christel receive actionable Approve/Decline controls.
6. Either Abigail or Christel may make the first decision; the other party cannot subsequently override it.
7. Approval unlocks the existing final client confirmation and calendar-link flow.
8. Decline is a separate follow-up test: it must cancel/release the hold and notify the client safely.
9. Both shared and practitioner Google Calendar presentation, including client mobile metadata, should be checked on the next genuine booking rather than by creating an artificial booking solely for Calendar acceptance.

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

- 🔵 Registered-client return recognition remains real-acceptance work.
- ✅ First-time Dummy Test registration, service-family discovery, HIFU→Marietjie routing, authoritative availability, booking #561, reschedule and cancellation are completed historical evidence.
- ✅ Beauty & Aesthetics treatment-list readability/pagination/price presentation was repaired and real-accepted.
- ✅ New-booking availability client copy was polished by PR #190 and is production-live; real journey should naturally exercise it again without repeating completed acceptance solely for copy.
- 🔵 New practitioner approval lifecycle is production-live but awaiting genuine WhatsApp acceptance as described above.
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

Production code is live and ready for real acceptance. Do **not** create or mutate any appointment merely to prove engineering. The next controlled test should be one genuine future client booking, preferably with Abigail, stopped first at the pending-approval state so the client message, dual Abigail/Christel approval requests, slot hold and no-expiry behavior can be observed before anyone approves. Then allow one of Abigail/Christel to approve and verify final client confirmation and Calendar mirrors. Test decline separately afterward with another genuine request.

Before any new engineering, verify GitHub `main` and Render again. Preserve all WAITING items fail-closed and continue to the next actionable priority when external evidence is unavailable.
