# Shiloh OS — Master Project Status

Updated: 2026-08-14
Purpose: permanent current-state project-management source of truth across ChatGPT sessions.

## Authority model

Operational truth remains: GitHub `main`, Render production, Shiloh CRM, Google Calendar, and explicit real WhatsApp/human acceptance evidence. Never infer human/provider/CRM state that has not been positively observed.

Historical detail from the pre-approval ledger is preserved verbatim at `docs/archive/SHILOH-OS-MASTER-STATUS-pre-approval-2026-08-14.md`. That archive is supporting completion evidence; do not redo completed work merely because it is not repeated here.

## Current production baseline

- Production runtime code baseline: `0562ca279304ab8fd92b7bc2cb69bea758ba6f3e` after PR #199 (`Repair Marietjie MediHeel pedicure ownership`). Render deploy `dep-d9vdeonavr4c73ag8e30` reached `live` on that exact runtime commit.
- PR #190 polished new-booking availability client copy and is production-live.
- PR #191 introduced mandatory approval for future client-created bookings with an indefinite held slot and fail-closed final confirmation.
- PR #192 established the ordinary-client business rule: Marietjie bookings are Marietjie-only; Christel bookings are Christel-only; Abigail bookings may be decided by either Abigail or Christel, with the first valid decision authoritative and audited.
- PR #193 adds a controlled CRM Dummy Test override: the unique active CRM `Dummy Test` booking requires the existing qualifying Jean-Pierre (JP) business-admin binding alone to approve/decline. Ambiguity fails closed.
- Pending client booking holds have no automatic expiry, timer, TTL or background release. A pending hold remains a non-cancelled canonical appointment and blocks authoritative availability until explicit approval or decline.
- Final customer confirmation for `shiloh_client_whatsapp` appointments is fail-closed unless booking approval is exactly `approved`. Decline cancels the hold, releases Calendar mirrors/slot occupancy and safely notifies the client.
- PR #194 fixed the real English-language interception defect on `Lymphatic drainage treatments`.
- PR #195 fixed the subsequent natural-family routing fallthrough by narrowly resolving natural family phrases to the existing CRM-backed `client_family_*` routes.
- **Real WhatsApp acceptance on 2026-08-14 proves the exact phrase `Lymphatic drainage treatments` reaches the live CRM-backed Lymphatic treatment list.** The observed list contained `Facial Lymphatic Drainage Massage` (60 min, R450) and `Lymphatic Drainage Reset Package` (90 min, R500). This closes the PR #195 transport/presentation acceptance gate; do not repeat it solely for proof.
- PR #197 is a presentation-only booking-entry refinement: the four stable `client_family_*` IDs are unchanged, while the visible family rows now read `Beauty & Aesthetics`, `Massage Treatments`, `Lymphatic Drainage`, and `Elim MediHeel Pedicures`, with action-oriented `View ... treatments` descriptions. CRM catalogue and practitioner-eligibility truth are unchanged by that PR.
- During PR #197 implementation, a whole-file update initially overwrote newer booking-interactive behavior and caused seven CI failures. This was caught before merge. The branch was restored exactly to current `main` booking behavior and then reduced to an 8-line presentation diff plus aligned regressions. Final PR CI passed before merge. Treat this as evidence for preserving minimal-diff discipline on high-churn files.
- **PR #199 repaired a proven CRM ownership drift for Elim MediHeel Pedicures.** The original Goldie catalogue already contained two active `Pedicures & Foot Care` Medi-Heel services, but their imported `staff_services` mappings pointed to Abigail/Christel while the current client family rule is Marietjie-only. A later Marietjie-exclusive authorization migration omitted `Pedicures & Foot Care`, so the live family query correctly returned zero Marietjie rows. PR #199 adds a fail-closed, idempotent startup repair and matching migration; it does not create, activate, rename or reprice treatments.
- Production startup evidence on PR #199 recorded `Marietjie pedicure ownership verified` with `repaired: true`, `serviceCount: 2`, `marietjieId: 6` before the service became live. This is authoritative production evidence that two existing active pedicure/MediHeel service mappings were repaired to the unique active Marietjie practitioner.
- Direct Render Postgres read remains tooling-limited by the known SSL/TLS connector failure. Do not use that limitation to infer CRM rows; PR #199 startup evidence is positive application/database evidence for the ownership repair.

## Verification-quality rule clarified by real acceptance evidence

- Code review, CI and non-mutating regression tests prove implementation contracts; they do not by themselves prove every real WhatsApp/Meta/CRM presentation path.
- Real Dummy Test evidence on 2026-08-14 exposed sequential deterministic client defects: language interception, natural-family routing fallthrough, and later MediHeel ownership drift. Each proven deterministic defect must become a permanent regression before repair where feasible.
- Exact defects discovered by human acceptance must become permanent regressions so the tester is not asked to rediscover the same failure later.
- The prior classification of the Elim MediHeel zero-row result as unknown catalogue truth is superseded. GitHub catalogue/import evidence plus the live PR #199 startup repair proved the root cause was practitioner-ownership drift, not an absent catalogue. Do not seed duplicate MediHeel services.
- PR #197 code/CI/deploy evidence proves the new booking-entry menu copy is live in production, but real WhatsApp presentation acceptance should only be marked complete after it is naturally observed through Meta transport.

## Self-test-first evidence for current approval/client-routing gates

- PR #191: final head `ac4d35eea6c47a9ca38252cb11e69e5c5b44fed1` passed CI #497; squash merge `bbdbbcc8f0d2a2bc8816ac56349c75c6c8d960fc`; Render deploy `dep-d9vaml6q1p3s738tp5l0` reached live.
- PR #192: regression-only commit `d5fe3f20b23d5cfb9b35ad8ef828998134e531b6` failed CI #499; final head `bf761b0ad7f1be91bc22b60d8fd18f32aad8bd5f` passed CI #500; squash merge `19428aecad9b79941c98885d6995eba46333a110`; Render deploy `dep-d9vc9mdbedkc7381femg` reached live.
- PR #193: regression-only commit `7bb7c8b10fa8cba9373fe2dc2282e7461740d3c9` failed CI #503; final head `ec2dfba4e69a5677d6177a29442333d45f127090` passed CI #506; squash merge `47fe6051a8255c66cdfe4956c02b575fc64f9d9b`; Render deploy `dep-d9vcfrou01pc73a9k3pg` reached live.
- PR #194: screenshot-derived regression commit `473f8a4679b8b8dfb8bbb106e032f9d4342d777e` failed CI #509 before implementation; final head `3c7d26265bef93c621352c50bf758a43459fe9bd` passed CI #511; squash merge `996f912ab927d0055cf284ed7db06a5a158dbcfd`; Render deploy `dep-d9vcoclbedkc7381r67g` reached live.
- PR #195: exact natural-family routing regression commit `b8de7a6d7757661858ad7e51c7c296ef54c4e68a` failed CI #517 before implementation. Final head `c4343e07ec9cb99fb4ae6ea86136b4a7f385e934` passed CI #518. Squash merge `7a9886a592791b1bb5cfcb8f8366297abd9c1dd6`; Render deploy `dep-d9vcrv8ae00c73fuecv0` reached live. Real WhatsApp acceptance subsequently proved the exact natural Lymphatic phrase renders the authoritative treatment list.
- PR #197: regression-first branch commit `ed9e64437c1c858a790d506f8e8851a8f1ae8110` failed as intended for the new menu copy. A later unsafe whole-file overwrite was detected because CI exposed seven failures; it was corrected before merge by restoring current `main` behavior and applying only the intended copy delta. Final head `810992a9240d5f46f3b59955035b4c629bb2bf84` passed CI #532. Squash merge `61151ba771ffd90213cc8947ae28f661e152f768`; GitHub `main` CI #533 passed; Render deploy `dep-d9vd7n3ncjis738r6nq0` reached live.
- PR #199: regression-only commit `1144d92441de1563b2ff9b430edae87672569673` failed CI #536 before implementation. Final head `b362c1391cb7d17f27ba9da239274604963f619e` passed CI #541. Squash merge `0562ca279304ab8fd92b7bc2cb69bea758ba6f3e`; Render deploy `dep-d9vdeonavr4c73ag8e30` reached live. Startup then positively proved two existing active pedicure/MediHeel mappings were repaired to Marietjie.

## Product-Critical Gate

🔵 **Client Perspective Testing remains product-critical. The immediate next acceptance check is Elim MediHeel family presentation after the proven ownership repair; once that passes, resume the genuine held-booking approval lifecycle.**

Do not recreate cancelled appointment #561. Its booking, reschedule and cancellation journey is accepted historical evidence.

The natural Lymphatic family routing gate is complete. The Elim MediHeel ownership defect is code/data-repaired and production-proven at startup, but its real Meta/WhatsApp list presentation still needs one minimal human acceptance check.

For Elim MediHeel Pedicures, do not create or seed services. Existing authoritative catalogue rows should now be visible through the Marietjie-only family route if their active/client-bookable state remains valid.

After the MediHeel presentation check, the next genuine future CRM Dummy Test booking must prove:

1. Dummy Test completes the normal registered-client booking flow and policy acceptance.
2. Shiloh creates a canonical held appointment but tells Dummy Test it is pending approval, not confirmed.
3. Before decision, the exact practitioner/time is not offered as available to another client.
4. The hold remains indefinitely pending until an explicit decision; no automatic expiry is allowed.
5. **JP/Jean-Pierre alone receives actionable Approve/Decline controls for the CRM Dummy Test request.** The assigned practitioner must not be the required approver.
6. JP approval unlocks final client confirmation and calendar-link flow.
7. A later separate Dummy Test request should exercise JP decline: cancellation/release and safe client notification.
8. Shared and practitioner Google Calendar presentation, including client mobile metadata, should be checked on the same genuine future booking rather than by creating an artificial booking solely for Calendar acceptance.
9. Ordinary-client approval acceptance remains open afterward: Marietjie self; Christel self; Abigail or Christel first decision.

## Remaining-work ledger

### A — Attendance/finalization/earnings

- 🟡 Six previously known Christel/Abigail attendance finalizations remain fail-closed until genuine Completed/No-show truth is supplied. Never infer attendance from elapsed time or Calendar presence.
- ⬜ Real authorized-user finalization/earnings UX acceptance remains open where not previously proven, including Marietjie self-view.
- ✅ Historical attendance/earnings foundations, explicit authority rules and completed-only reporting remain accepted.

### B — Admin acceptance

- ⬜ Finish only genuinely unverified role-specific WhatsApp Admin paths after the product-critical client journey.
- ✅ Permission-gated read-only full client detail and CRM #836 acceptance are completed.
- Preserve Jean-Pierre business-admin authority and dedicated non-admin identities for genuine client testing.

### C — Client Perspective Testing

- 🔵 Registered-client return recognition remains real-acceptance work and can be observed naturally when Dummy Test returns.
- ✅ First-time Dummy Test registration, HIFU→Marietjie routing, authoritative availability, booking #561, reschedule and cancellation are completed historical evidence.
- ✅ English-only false-positive on `Lymphatic drainage treatments` is real-accepted fixed.
- ✅ Natural phrase → Lymphatic family routing via PR #195 is **real-accepted**: exact phrase rendered the live Lymphatic treatment list with two CRM-backed treatment rows and prices.
- ✅ Beauty & Aesthetics treatment-list readability/pagination/price presentation was repaired and real-accepted.
- 🔵 Booking-entry family menu copy via PR #197 is production-live and CI/deploy verified; real WhatsApp presentation acceptance remains to be observed naturally.
- 🔵 Elim MediHeel Pedicures ownership drift is **repaired and production-proven** by PR #199 startup evidence (`serviceCount: 2` remapped to Marietjie). One real WhatsApp family-list presentation check remains before marking the client surface accepted.
- ✅ New-booking availability client copy was polished by PR #190 and is production-live; exercise naturally rather than repeating solely for copy.
- 🔵 Approval lifecycle is production-live but awaiting genuine WhatsApp acceptance. For CRM Dummy Test specifically, JP is the sole approver; ordinary-client approval rules remain as defined above.
- 🟡 Booking-confirmation Meta template remains fail-closed until exact provider Active/APPROVED evidence and real template acceptance exist. Plain-text confirmation remains safe active path unless provider truth changes.
- 🟡 Calendar-mobile presentation acceptance waits for the next genuine future booking; do not fabricate a booking only for this evidence.
- ⬜ Natural practitioner/service conversational questions should continue during the real client journey to verify CRM-consistent, non-invented answers.

### D — Customer care/lifecycle

- ✅ Backend customer-care/lifecycle foundation remains deployed.
- 🟡 Real lifecycle/provider-template acceptance remains evidence-gated.

### E — Payments

- 🟡 Ozow remains blocked on merchant/account configuration and explicit payment/deposit/refund/gift-voucher rules.

### F — Meta/business assets

- ✅ Preserve Meta keeper portfolio `406573210678288` and existing ownership chain.
- ⬜ Verify existing Instagram `@shiloh_massage_studio` ownership/access before connection; never create a duplicate by assumption.
- ⬜ Business verification/naming rejection investigation remains open.

### Privacy/governance

- Existing P-PRIV safety foundations remain mandatory and fail-closed.
- Destructive privacy execution remains disabled pending legal/owner authorization and sufficient evidence.

## Exact continuation state

PR #199 is merged and production-live. Render startup positively proved two existing active pedicure/MediHeel service mappings were repaired to unique active Marietjie. **Next send/select `Elim MediHeel Pedicures` once from CRM Dummy Test and confirm the real WhatsApp treatment list appears.** Do not seed treatments and do not recreate #561. If the family list now renders, mark C1-MEDIHEEL real-accepted and continue the same Dummy Test client journey into a genuine future booking. At booking completion, stop at pending approval before anyone decides; capture Dummy Test’s held/not-confirmed wording, verify slot exclusion, and confirm JP/Jean-Pierre alone receives actionable Approve/Decline. Then JP approval should unlock final client confirmation plus both Calendar mirrors. Test JP decline separately later.

Before new engineering, verify GitHub `main` and Render again. Preserve all WAITING items fail-closed.