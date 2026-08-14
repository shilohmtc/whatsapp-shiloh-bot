# Shiloh OS — Project Tracker

Updated: 2026-08-14
Purpose: concise operational dashboard. `docs/SHILOH-OS-MASTER-STATUS.md` is the current detailed ledger. The pre-approval tracker is preserved verbatim at `docs/archive/SHILOH-OS-PROJECT-TRACKER-pre-approval-2026-08-14.md`; do not redo completed work from that archive.

## Current Product-Critical Gate

🔵 **Real Client Perspective booking acceptance with the new approval lifecycle.**

Production runtime baseline: PR #193 squash merge `47fe6051a8255c66cdfe4956c02b575fc64f9d9b`; Render deploy `dep-d9vcfrou01pc73a9k3pg` reached live. Documentation-only descendants may advance the exact `main`/Render head without changing runtime behavior; verify current heads each session.

Approval policy now live:
- **CRM Dummy Test booking → JP/Jean-Pierre alone may approve/decline.** This controlled override requires exactly one active CRM `Dummy Test` profile and exactly one qualifying active JP business-admin staff binding; ambiguity fails closed.
- Ordinary Marietjie booking → Marietjie alone may approve/decline.
- Ordinary Christel booking → Christel alone may approve/decline.
- Ordinary Abigail booking → either Abigail or Christel may make the first explicit approve/decline decision.
- First valid decision is final and audited with the actual decision-maker.
- Pending hold has **no automatic expiry** and continues blocking the slot until explicit approval/decline.
- Final client confirmation remains fail-closed until approval.

Self-test-first evidence: PR #193 regression-only commit `7bb7c8b10fa8cba9373fe2dc2282e7461740d3c9` failed CI #503; final head `ec2dfba4e69a5677d6177a29442333d45f127090` passed CI #506; squash merge `47fe6051a8255c66cdfe4956c02b575fc64f9d9b`; Render deploy `dep-d9vcfrou01pc73a9k3pg` live.

## At-a-glance

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | Run one new genuine future **CRM Dummy Test** booking and stop first at pending approval. Verify client pending copy, held-slot exclusion, JP-only actionable approval request, then JP approval → final confirmation. Do not recreate #561. |
| C1-APP-DUMMY | Dummy Test → JP approval override | 🔵 LIVE / REAL ACCEPTANCE REQUIRED | Code/CI/deploy verified. Real WhatsApp must prove JP receives Approve/Decline and the assigned practitioner is not the required approver. No expiry. |
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
| Service-family discovery | 🟢 VERIFIED | Historical real WhatsApp evidence retained. |
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

## Exact next test

Use the active **CRM Dummy Test** WhatsApp identity for one new genuine future booking. Do not recreate #561. Complete the normal booking flow and policy acceptance, then stop before anyone decides. Capture what Dummy Test sees, confirm the selected slot is no longer offered, and confirm **JP/Jean-Pierre** receives actionable Approve/Decline controls as the sole required approver. Then let JP press **Approve**. Verify Dummy Test receives the final confirmation/calendar links and check both Calendar mirrors. Test JP decline later on a separate genuine request.

## Guardrails

- GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence remain authoritative.
- Do not recreate cancelled appointment #561.
- Do not infer provider/template/attendance outcomes.
- CRM Dummy Test / JP authority ambiguity must fail closed; never fall back to practitioner approval.
- Direct Render Postgres connector SSL failure is a tooling limitation, not CRM truth.
- Re-rank after every defect/blocker resolution; product-critical client defects take precedence.
