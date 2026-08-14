# Shiloh OS — Project Tracker

Updated: 2026-08-14
Purpose: concise operational dashboard. `docs/SHILOH-OS-MASTER-STATUS.md` is the current detailed ledger. The pre-approval tracker is preserved verbatim at `docs/archive/SHILOH-OS-PROJECT-TRACKER-pre-approval-2026-08-14.md`; do not redo completed work from that archive.

## Current Product-Critical Gate

🔵 **Real Client Perspective booking acceptance with the new approval lifecycle.**

Production runtime baseline: PR #195 squash merge `7a9886a592791b1bb5cfcb8f8366297abd9c1dd6`; Render deploy `dep-d9vcrv8ae00c73fuecv0` reached live. Documentation-only descendants may advance exact `main`/Render head without changing runtime behavior; verify current heads each session.

Immediate pre-booking acceptance repairs:
- Real WhatsApp first showed `Lymphatic drainage treatments` incorrectly rejected as non-English. PR #194 fixed that language interception; real WhatsApp after deploy proved the English-only rejection no longer occurred.
- The next real response then exposed a second defect: the same phrase fell through to generic service verification instead of entering Lymphatic family discovery.
- PR #195 now maps narrow natural family phrases to the existing CRM-backed `client_family_*` routes. Regression-only commit `b8de7a6d7757661858ad7e51c7c296ef54c4e68a` failed CI #517 before implementation; final head `c4343e07ec9cb99fb4ae6ea86136b4a7f385e934` passed CI #518; squash merge/runtime `7a9886a592791b1bb5cfcb8f8366297abd9c1dd6`; deploy live.
- Unrelated specific services remain uncoerced; HIFU and `Swedish Massage 60 min` continue through their normal service paths.
- Elim MediHeel Pedicures previously returned zero eligible active CRM rows. That remains a fail-closed catalogue result, not a confirmed code defect; do not patch/seed speculatively.

Approval policy now live:
- **CRM Dummy Test booking → JP/Jean-Pierre alone may approve/decline.** This controlled override requires exactly one active CRM `Dummy Test` profile and exactly one qualifying active JP business-admin staff binding; ambiguity fails closed.
- Ordinary Marietjie booking → Marietjie alone may approve/decline.
- Ordinary Christel booking → Christel alone may approve/decline.
- Ordinary Abigail booking → either Abigail or Christel may make the first explicit approve/decline decision.
- First valid decision is final and audited with the actual decision-maker.
- Pending hold has **no automatic expiry** and continues blocking the slot until explicit approval/decline.
- Final client confirmation remains fail-closed until approval.

## At-a-glance

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| C1-FAMILY-NL | Natural treatment-family routing | 🔵 FIX LIVE / REAL ACCEPTANCE REQUIRED | Send exact `Lymphatic drainage treatments` from Dummy Test once. It must enter the Lymphatic family/treatment flow, not language or generic verification fallback. |
| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | After C1-FAMILY-NL acceptance, continue one new genuine future **CRM Dummy Test** booking and stop first at pending approval. Do not recreate #561. |
| C1-MEDIHEEL | Elim MediHeel catalogue | 🟠 WAITING FOR AUTHORITATIVE CRM EVIDENCE | Real WhatsApp returned no eligible active rows. Do not patch/seed speculatively; establish CRM catalogue truth first. |
| C1-APP-DUMMY | Dummy Test → JP approval override | 🔵 LIVE / REAL ACCEPTANCE REQUIRED | Real WhatsApp must prove JP receives Approve/Decline and assigned practitioner is not the required approver. No expiry. |
| C1-APP-ORD | Ordinary client approval rules | 🔵 LIVE / REAL ACCEPTANCE REQUIRED | Marietjie self; Christel self; Abigail or Christel first decision. Real ordinary-client acceptance remains after Dummy Test path. |
| C1-RETURN | Registered-client return recognition | ⚪ READY / IN-JOURNEY | Observe whether returning Dummy Test is recognized without redundant registration. |
| C1-CAL | Calendar/mobile presentation | 🟠 WAITING FOR GENUINE BOOKING | Verify on the same next genuine future booking; never fabricate a booking solely for this check. |
| C1-TPL | Booking confirmation Meta template | 🟠 WAITING | Preserve plain-text path until exact Meta Active/APPROVED evidence and real template acceptance. |
| A1 | Six known attendance finalizations | 🟠 WAITING | Genuine Completed/No-show truth only; never infer. |
| A2 | Finalization/earnings UX acceptance | ⚪ READY | Remaining real authorized-account acceptance after client-critical gate. |
| B1 | Remaining Admin route acceptance | ⚪ READY | Finish only genuinely unverified role-specific paths after product-critical client testing. |
| D0 | Customer-care foundation | 🟢 VERIFIED | Real lifecycle/provider acceptance remains evidence-gated. |
| E1 | Ozow activation | 🟠 WAITING | Merchant configuration + explicit payment/deposit/refund/gift-voucher rules. |
| F3 | Instagram ownership/connection | ⚪ READY | Verify existing `@shiloh_massage_studio`; never create a duplicate by assumption. |
| PRIV | Destructive privacy execution | 🟠 WAITING / FAIL-CLOSED | Requires legal/owner authority and sufficient evidence; existing safeguards remain active. |

## Client acceptance board

| Item | State | Required evidence |
|---|---|---|
| First-time Dummy Test registration | 🟢 VERIFIED | Historical real WhatsApp evidence retained; do not redo. |
| Lymphatic language-guard false positive | 🟢 REAL-ACCEPTED FIXED | Real post-PR-#194 WhatsApp no longer produced English-only rejection. |
| Natural Lymphatic family routing | 🔵 FIX LIVE / REAL ACCEPTANCE REQUIRED | Exact phrase must now render CRM-backed Lymphatic treatment flow. |
| Previously observed service-family paths | 🟢 VERIFIED / NARROW | Preserve only exact real paths previously observed; do not generalize. |
| Elim MediHeel Pedicures family | 🟠 CRM TRUTH REQUIRED | Current real result is zero eligible active rows; verify catalogue before engineering change. |
| Beauty & Aesthetics treatment-list presentation | 🟢 VERIFIED | PR #172 + real WhatsApp acceptance. |
| HIFU → Marietjie eligibility/routing | 🟢 VERIFIED | Historical real WhatsApp evidence. |
| Authoritative availability | 🟢 VERIFIED | SQL repair + real acceptance retained. |
| New-booking availability client copy | 🟢 PRODUCTION-LIVE | PR #190; exercise naturally in next journey rather than repeating solely for copy. |
| Appointment #561 booking/reschedule/cancellation | 🟢 VERIFIED / CANCELLED | Do not recreate #561. |
| New Dummy Test booking pending-approval copy | 🔵 REAL ACCEPTANCE REQUIRED | Dummy Test must see request received/time held/not yet confirmed. |
| Pending slot exclusion | 🔵 REAL ACCEPTANCE REQUIRED | Same practitioner/time must not appear available while pending. |
| Hold no-expiry behavior | 🔵 REAL ACCEPTANCE REQUIRED | Hold persists until explicit JP decision; no timer/TTL. |
| JP approval request for Dummy Test | 🔵 REAL ACCEPTANCE REQUIRED | JP receives actionable Approve/Decline as sole required approver. |
| Practitioner non-authority for Dummy Test | 🔵 REAL ACCEPTANCE REQUIRED | Assigned practitioner must not be the required decision-maker on this controlled identity. |
| JP approval → final client confirmation | 🔵 REAL ACCEPTANCE REQUIRED | Client receives final confirmation/calendar links only after JP approval. |
| JP decline → release | ⚪ FOLLOW-UP TEST | Separate genuine Dummy Test request; JP decline cancels hold, releases slot/calendars, client told nothing is booked. |
| Ordinary Abigail/Christel approval | ⚪ FOLLOW-UP REAL ACCEPTANCE | On a normal client booking, Abigail or Christel can make the first decision. |
| Calendar client-mobile metadata | 🟠 WAITING FOR NEXT GENUINE BOOKING | Check shared + practitioner Calendar on the same genuine booking. |
| Registered-client return | ⚪ READY / IN-JOURNEY | Confirm recognition without redundant registration. |

## Verification-quality rule

- CI/unit/source-contract evidence is necessary engineering evidence, but never label a broad real WhatsApp surface “fully accepted” unless the relevant human/transport path was actually observed.
- Every client-visible deterministic production defect found manually should become a permanent regression before repair where feasible.
- Human real-WhatsApp acceptance remains the final check for Meta transport, live CRM state and presentation; manual acceptance should validate the product, not repeatedly rediscover deterministic defects CI could cover.

## Exact next test

From active **CRM Dummy Test**, send exactly **`Lymphatic drainage treatments`** once. Expected: the CRM-backed Lymphatic Drainage treatment list/flow, not the English-only reply and not generic “can’t verify” service text. If correct, continue the same genuine journey toward one future booking. Do not recreate #561. At booking completion, stop before anyone decides: capture Dummy Test’s pending/held wording, confirm the selected slot is no longer offered, and confirm **JP/Jean-Pierre** receives actionable Approve/Decline as sole required approver. Then let JP press **Approve** and verify final client confirmation plus both Calendar mirrors. Test JP decline later on a separate genuine request.

## Guardrails

- GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence remain authoritative.
- Do not recreate cancelled appointment #561.
- Do not infer provider/template/attendance outcomes.
- CRM Dummy Test / JP authority ambiguity must fail closed; never fall back to practitioner approval.
- Direct Render Postgres connector SSL failure is a tooling limitation, not CRM truth.
- Re-rank after every defect/blocker resolution; product-critical client defects take precedence.
