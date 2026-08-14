# Shiloh OS — Project Tracker

Updated: 2026-08-14
Purpose: concise operational dashboard. `docs/SHILOH-OS-MASTER-STATUS.md` is the current detailed ledger. The pre-approval tracker is preserved verbatim at `docs/archive/SHILOH-OS-PROJECT-TRACKER-pre-approval-2026-08-14.md`; do not redo completed work from that archive.

## Current Product-Critical Gate

🔵 **Real Client Perspective booking acceptance with the new approval lifecycle.**

Production runtime baseline: PR #194 squash merge `996f912ab927d0055cf284ed7db06a5a158dbcfd`; Render deploy `dep-d9vcoclbedkc7381r67g` reached live. Documentation-only descendants may advance the exact `main`/Render head without changing runtime behavior; verify current heads each session.

Immediate pre-booking acceptance repair:
- Real WhatsApp evidence showed `Lymphatic drainage treatments` incorrectly rejected as non-English.
- PR #194 now deterministically treats short known English clinic-navigation phrases as English-compatible before probabilistic classification.
- Regression-only commit `473f8a4679b8b8dfb8bbb106e032f9d4342d777e` failed CI #509 before implementation; final head `3c7d26265bef93c621352c50bf758a43459fe9bd` passed CI #511; production deploy is live.
- Real WhatsApp must now re-check the exact phrase once. Code/CI are not a substitute for that final transport/presentation evidence.
- The same screenshot showed zero eligible active Elim MediHeel Pedicures CRM rows. That is presently a fail-closed catalogue result, **not a confirmed code defect**. Direct Render SQL verification remains blocked by the connector SSL/TLS failure; do not invent catalogue truth.

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
| C1-LANG | English clinic-navigation guard | 🔵 FIX LIVE / REAL ACCEPTANCE REQUIRED | Send exact `Lymphatic drainage treatments` from Dummy Test once. It must not produce the English-only rejection. |
| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | After C1-LANG real acceptance, continue one new genuine future **CRM Dummy Test** booking and stop first at pending approval. Do not recreate #561. |
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
| Previously observed service-family discovery paths | 🟢 VERIFIED / NARROW | Preserve only the exact real paths previously observed; do not generalize this to every family phrase. |
| Lymphatic English-navigation phrase | 🔵 FIX LIVE / REAL ACCEPTANCE REQUIRED | Exact screenshot phrase must route past language guard into CRM-backed family discovery. |
| Elim MediHeel Pedicures family | 🟠 CRM TRUTH REQUIRED | Current real result is zero eligible active rows; verify catalogue before any engineering change. |
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
- Every client-visible production defect found manually should be converted into a permanent regression before repair where feasible.
- Human real-WhatsApp acceptance remains the final check for Meta transport, live CRM state and presentation; the goal is for manual acceptance to validate the product, not repeatedly discover deterministic defects CI could have covered.

## Exact next test

From the active **CRM Dummy Test** WhatsApp identity, send exactly **`Lymphatic drainage treatments`**. If it reaches the Lymphatic family/treatment flow without the English-only rejection, continue the same genuine journey toward one future booking. Do not recreate #561. At booking completion, stop before anyone decides: capture what Dummy Test sees, confirm the selected slot is no longer offered, and confirm **JP/Jean-Pierre** receives actionable Approve/Decline controls as sole required approver. Then let JP press **Approve** and verify final client confirmation plus both Calendar mirrors. Test JP decline later on a separate genuine request.

## Guardrails

- GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence remain authoritative.
- Do not recreate cancelled appointment #561.
- Do not infer provider/template/attendance outcomes.
- CRM Dummy Test / JP authority ambiguity must fail closed; never fall back to practitioner approval.
- Direct Render Postgres connector SSL failure is a tooling limitation, not CRM truth.
- Re-rank after every defect/blocker resolution; product-critical client defects take precedence.
