# Shiloh OS — Project Tracker

Updated: 2026-08-14
Purpose: concise operational dashboard. `docs/SHILOH-OS-MASTER-STATUS.md` is the current detailed ledger. The pre-approval tracker is preserved verbatim at `docs/archive/SHILOH-OS-PROJECT-TRACKER-pre-approval-2026-08-14.md`; do not redo completed work from that archive.

## Current Product-Critical Gate

🔵 **Real Client Perspective booking acceptance with the new practitioner-approval lifecycle.**

Production baseline: GitHub `main` `19428aecad9b79941c98885d6995eba46333a110`; Render deploy `dep-d9vc9mdbedkc7381femg` is live.

Approval policy now live:
- Marietjie booking → Marietjie alone may approve/decline.
- Christel booking → Christel alone may approve/decline.
- Abigail booking → either Abigail or Christel may make the first explicit approve/decline decision.
- First valid decision is final and audited with the actual decision-maker.
- Pending hold has **no automatic expiry** and continues blocking the slot until explicit approval/decline.
- Final client confirmation remains fail-closed until approval.

Self-test-first evidence: PR #192 regression-only commit `d5fe3f20b23d5cfb9b35ad8ef828998134e531b6` failed CI #499; implementation `bf761b0ad7f1be91bc22b60d8fd18f32aad8bd5f` passed CI #500; squash merge `19428aecad9b79941c98885d6995eba46333a110`; Render deploy live.

## At-a-glance

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | Run one genuine future client booking, preferably Abigail, and stop first at pending approval. Verify client pending copy, held slot exclusion, dual Abigail/Christel actionable approval requests, then one first decision → final confirmation. |
| C1-APP | Practitioner approval lifecycle | 🔵 LIVE / REAL ACCEPTANCE REQUIRED | Code/CI/deploy verified. Real WhatsApp notification and decision evidence still required. No expiry. |
| C1-RETURN | Registered-client return recognition | ⚪ READY | Real registered-client WhatsApp return acceptance after/alongside current journey. |
| C1-CAL | Calendar/mobile presentation | 🟠 WAITING FOR GENUINE BOOKING | Verify on next genuine future booking; never fabricate a booking solely for this check. |
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
| New booking pending-approval client copy | 🔵 REAL ACCEPTANCE REQUIRED | Client must see request received/time held/not yet confirmed. |
| Pending slot exclusion | 🔵 REAL ACCEPTANCE REQUIRED | Same practitioner/time must not appear available while pending. |
| Hold no-expiry behavior | 🔵 REAL ACCEPTANCE REQUIRED | Hold persists until explicit decision; no timer/TTL. |
| Abigail approval request | 🔵 REAL ACCEPTANCE REQUIRED | Abigail receives actionable Approve/Decline. |
| Christel authority on Abigail booking | 🔵 REAL ACCEPTANCE REQUIRED | Christel also receives actionable Approve/Decline and may make first decision. |
| First-decision finality | 🔵 REAL ACCEPTANCE REQUIRED | Second decision attempt cannot override completed outcome. |
| Approval → final client confirmation | 🔵 REAL ACCEPTANCE REQUIRED | Client receives final confirmation/calendar links only after approval. |
| Decline → release | ⚪ FOLLOW-UP TEST | Separate genuine request; decline cancels hold, releases slot/calendars, client told nothing is booked. |
| Calendar client-mobile metadata | 🟠 WAITING FOR NEXT GENUINE BOOKING | Check shared + practitioner Calendar on the same genuine booking. |
| Registered-client return | ⚪ READY | Confirm recognition without redundant registration. |

## Exact next test

Use a genuine future booking with **Abigail** if practical. Complete the normal booking flow and policy acceptance. Stop before anyone decides. Capture what the client sees, what Abigail receives, what Christel receives, and confirm the same slot is no longer offered. Then let **either Abigail or Christel** press Approve. Verify the client receives final confirmation and both Calendar mirrors remain correct. Do not test decline on that same booking; use a later separate genuine request.

## Guardrails

- GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence remain authoritative.
- Do not recreate cancelled appointment #561.
- Do not infer provider/template/attendance outcomes.
- Direct Render Postgres connector SSL failure is a tooling limitation, not CRM truth.
- Re-rank after every defect/blocker resolution; product-critical client defects take precedence.
