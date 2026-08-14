# Shiloh OS — Master Project Status

Updated: 2026-08-14
Purpose: permanent current-state project-management source of truth across ChatGPT sessions.

## Authority model

Operational truth remains: GitHub `main`, Render production, Shiloh CRM, Google Calendar, and explicit real WhatsApp/human acceptance evidence. Never infer human/provider/CRM state that has not been positively observed.

Historical detail from the pre-approval ledger is preserved verbatim at `docs/archive/SHILOH-OS-MASTER-STATUS-pre-approval-2026-08-14.md`. That archive is supporting completion evidence; do not redo completed work merely because it is not repeated here.

## Current production baseline

- Production runtime code baseline: `7a9886a592791b1bb5cfcb8f8366297abd9c1dd6` after PR #195 (`Route natural treatment-family phrases into discovery`). Render deploy `dep-d9vcrv8ae00c73fuecv0` reached `live` on that exact runtime commit. Later documentation-only descendants may advance GitHub `main`/Render without changing runtime behavior; verify exact current heads each session.
- PR #190 polished new-booking availability client copy and is production-live.
- PR #191 introduced mandatory approval for future client-created bookings with an indefinite held slot and fail-closed final confirmation.
- PR #192 established the ordinary-client business rule: Marietjie bookings are Marietjie-only; Christel bookings are Christel-only; Abigail bookings may be decided by either Abigail or Christel, with the first valid decision authoritative and audited.
- PR #193 adds a **controlled CRM Dummy Test override**. If the booking belongs to the unique active CRM client whose canonical display name is `Dummy Test`, the sole required approver is the existing Jean-Pierre (JP) business-admin staff binding. The assigned practitioner and Christel/Abigail ordinary approval rules do not apply to that Dummy Test request.
- Dummy Test identification deliberately reuses the guarded test-client uniqueness contract: there must be exactly one active CRM `Dummy Test` profile. JP resolution is also fail-closed: exactly one active Jean-Pierre staff-admin binding with `business_admin`, `all_business` Calendar scope and `all_services` service scope must exist. Ambiguity/missing authority aborts the booking transaction instead of falling back to practitioner approval.
- Pending client booking holds have no automatic expiry, timer, TTL or background release. A pending hold remains a non-cancelled canonical appointment and therefore blocks that slot in authoritative availability until explicit approval or decline.
- Final customer confirmation for `shiloh_client_whatsapp` appointments is fail-closed unless the booking approval record is exactly `approved`.
- Decline transitions the held appointment to cancelled, releases Calendar mirrors/slot occupancy and notifies the client that nothing is booked.
- PR #194 repairs the real English-language interception defect: short English clinic-navigation phrases such as `Lymphatic drainage treatments` are treated as English-compatible before probabilistic language classification. Real WhatsApp evidence after deployment proved that this phrase no longer triggered the English-only rejection.
- That same real post-PR-#194 evidence exposed the next deterministic defect: the exact phrase then fell through to generic service verification rather than entering the CRM-backed Lymphatic family flow. PR #195 adds a narrow natural-family command resolver at the existing family-discovery boundary. Exact family phrases now resolve to the same internal `client_family_*` paths used by interactive UI; unrelated concrete service names such as HIFU and `Swedish Massage 60 min` are deliberately not coerced.
- Direct Render Postgres read remains tooling-limited by the known SSL/TLS connector failure. Do not use that limitation to infer CRM rows.

## Verification-quality rule clarified by real acceptance evidence

- Code review, CI and non-mutating regression tests prove implementation contracts; they do **not** by themselves prove every real WhatsApp/Meta/CRM presentation path.
- Real Dummy Test evidence on 2026-08-14 exposed two sequential deterministic defects in one natural phrase: first language interception, then family-routing fallthrough. Both now have permanent regressions.
- Final client-facing acceptance still requires genuine WhatsApp evidence. Exact defects discovered by human acceptance must become permanent regressions so the tester is not asked to rediscover the same failure later.
- The Elim MediHeel Pedicures family previously returned zero currently eligible active CRM treatments. That response is **not classified as a code defect**. The family query is intentionally CRM-backed, active-only, practitioner/client-bookable scoped, and fails closed when zero rows qualify. Direct production Postgres inspection could not be completed because the Render SQL connector failed on SSL/TLS. Preserve CRM truth and do not invent/activate MediHeel services without authoritative catalogue evidence.

## Self-test-first evidence for current approval/client-routing gates

- PR #191: final head `ac4d35eea6c47a9ca38252cb11e69e5c5b44fed1` passed CI #497; squash merge `bbdbbcc8f0d2a2bc8816ac56349c75c6c8d960fc`; Render deploy `dep-d9vaml6q1p3s738tp5l0` reached live.
- PR #192: regression-only commit `d5fe3f20b23d5cfb9b35ad8ef828998134e531b6` failed CI #499; final head `bf761b0ad7f1be91bc22b60d8fd18f32aad8bd5f` passed CI #500; squash merge `19428aecad9b79941c98885d6995eba46333a110`; Render deploy `dep-d9vc9mdbedkc7381femg` reached live.
- PR #193: regression-only commit `7bb7c8b10fa8cba9373fe2dc2282e7461740d3c9` failed CI #503; final head `ec2dfba4e69a5677d6177a29442333d45f127090` passed CI #506; squash merge `47fe6051a8255c66cdfe4956c02b575fc64f9d9b`; Render deploy `dep-d9vcfrou01pc73a9k3pg` reached live.
- PR #194: screenshot-derived regression commit `473f8a4679b8b8dfb8bbb106e032f9d4342d777e` failed CI #509 before implementation. CI #510 exposed eager OpenAI-client construction in the test environment; final head `3c7d26265bef93c621352c50bf758a43459fe9bd` passed CI #511 after lazy initialization. Squash merge `996f912ab927d0055cf284ed7db06a5a158dbcfd`; Render deploy `dep-d9vcoclbedkc7381r67g` reached live.
- PR #195: exact natural-family routing regression commit `b8de7a6d7757661858ad7e51c7c296ef54c4e68a` failed CI #517 before implementation. Final head `c4343e07ec9cb99fb4ae6ea86136b4a7f385e934` passed CI #518. Squash merge `7a9886a592791b1bb5cfcb8f8366297abd9c1dd6`; Render deploy `dep-d9vcrv8ae00c73fuecv0` reached live.

## Product-Critical Gate

🔵 **Client Perspective Testing remains product-critical.**

Do not recreate cancelled appointment #561. Its booking, reschedule and cancellation journey is already accepted historical evidence.

Immediate real acceptance is deliberately small: send **`Lymphatic drainage treatments`** once more from Dummy Test. It must now enter the CRM-backed Lymphatic family/treatment flow rather than either the English-only guard or generic service-verification fallback. If the resulting authoritative Lymphatic list is present, continue the same genuine journey rather than restarting completed work.

For Elim MediHeel Pedicures, preserve the current fail-closed zero-row response unless authoritative CRM catalogue evidence proves active Marietjie/client-bookable treatments should be present. Do not create service rows merely to make the menu populate.

The next genuine future CRM Dummy Test booking should then prove the held-booking lifecycle without using #561:

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
- ✅ First-time Dummy Test registration, HIFU→Marietjie routing, authoritative availability, booking #561, reschedule and cancellation are completed historical evidence.
- ✅ The English-only false-positive on `Lymphatic drainage treatments` is real-accepted as fixed: post-PR-#194 WhatsApp evidence no longer showed the English-only reply.
- 🔵 Natural phrase → Lymphatic family routing is production-live via PR #195 and requires one real WhatsApp acceptance message.
- ✅ Beauty & Aesthetics treatment-list readability/pagination/price presentation was repaired and real-accepted.
- 🟡 Elim MediHeel Pedicures returned no eligible active CRM treatment rows in real WhatsApp. Preserve fail-closed until catalogue truth is independently established; do not infer a missing-code defect from an empty authoritative query.
- ✅ New-booking availability client copy was polished by PR #190 and is production-live; real journey should naturally exercise it again without repeating solely for copy.
- 🔵 Approval lifecycle is production-live but awaiting genuine WhatsApp acceptance. For CRM Dummy Test specifically, JP is the sole approver; ordinary-client approval rules remain as defined above.
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

PR #195 is production-live. From the active CRM Dummy Test WhatsApp identity, send exactly **`Lymphatic drainage treatments`** once. It must reach the authoritative Lymphatic family/treatment flow. If it does, continue naturally toward one new genuine future booking; do not recreate #561. At booking completion, stop at pending approval before anyone decides, capture Dummy Test’s held/not-confirmed wording, confirm the slot is excluded from availability, and confirm **JP/Jean-Pierre alone** receives actionable Approve/Decline. Then JP approval should unlock final client confirmation plus both Calendar mirrors. Test JP decline separately later.

Before any new engineering, verify GitHub `main` and Render again. Preserve all WAITING items fail-closed and continue to the next actionable priority when external evidence is unavailable.
