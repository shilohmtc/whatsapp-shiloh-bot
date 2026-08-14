# Shiloh OS — Project Tracker

Updated: 2026-08-14
Purpose: concise operational dashboard. `docs/SHILOH-OS-MASTER-STATUS.md` is the current detailed ledger. The pre-approval tracker is preserved at `docs/archive/SHILOH-OS-PROJECT-TRACKER-pre-approval-2026-08-14.md`; do not redo completed work from that archive.

## Current Product-Critical Gate

🔵 **Real Client Perspective held-booking approval lifecycle acceptance.**

Production runtime baseline: PR #197 squash merge `61151ba771ffd90213cc8947ae28f661e152f768`; GitHub `main` CI #533 passed; Render deploy `dep-d9vd7n3ncjis738r6nq0` reached live and `/health` returned HTTP 200.

Pre-booking routing/presentation state:
- PR #194 fixed the English-language false positive on `Lymphatic drainage treatments`; real WhatsApp proved the rejection disappeared.
- PR #195 fixed the subsequent generic service-verification fallthrough. Regression-only commit `b8de7a6d7757661858ad7e51c7c296ef54c4e68a` failed CI #517; final head `c4343e07ec9cb99fb4ae6ea86136b4a7f385e934` passed CI #518; runtime/deploy reached live.
- **Real WhatsApp proves the exact phrase enters the CRM-backed Lymphatic treatment list.** Observed rows: `Facial Lymphatic Drainage Massage` • 60 min • R450 and `Lymphatic Drainage Reset Package` • 90 min • R500. C1-FAMILY-NL is closed; do not repeat solely for proof.
- PR #197 polished the actual booking-entry `Choose service` surface only: visible rows are now `Beauty & Aesthetics`, `Massage Treatments`, `Lymphatic Drainage`, and `Elim MediHeel Pedicures`, with `View ... treatments` descriptions. Stable `client_family_*` IDs and CRM/practitioner truth are unchanged.
- PR #197 regression-first evidence: `ed9e64437c1c858a790d506f8e8851a8f1ae8110` failed before implementation; final head `810992a9240d5f46f3b59955035b4c629bb2bf84` passed CI #532. A transient whole-file overwrite caused seven CI failures and was corrected before merge by restoring current `main` behavior and applying only the intended minimal presentation diff.
- Elim MediHeel Pedicures previously returned zero eligible active CRM rows. Preserve that fail-closed catalogue result pending authoritative CRM evidence.

Approval policy live:
- **CRM Dummy Test booking → JP/Jean-Pierre alone may approve/decline.** Unique Dummy Test and qualifying JP authority are required; ambiguity fails closed.
- Ordinary Marietjie booking → Marietjie alone.
- Ordinary Christel booking → Christel alone.
- Ordinary Abigail booking → Abigail or Christel, first explicit decision authoritative.
- Pending hold has no automatic expiry and blocks the slot until explicit approval/decline.
- Final client confirmation remains fail-closed until approval.

## At-a-glance

| ID | Workstream | State | Next evidence/action |
|---|---|---|---|
| C1-FAMILY-NL | Natural treatment-family routing | 🟢 REAL-ACCEPTED | Exact Lymphatic phrase rendered authoritative treatment list. Do not repeat. |
| C1-FAMILY-MENU | Booking-entry family menu presentation | 🔵 PRODUCTION-LIVE / REAL ACCEPTANCE PENDING | Observe naturally next time the menu appears; do not restart current journey solely for copy. |
| C1 | Client Perspective Testing | 🔵 ACTIVE / PRODUCT-CRITICAL | Continue current Dummy Test journey: choose a Lymphatic treatment, future slot, complete request, then stop at pending approval. Do not recreate #561. |
| C1-MEDIHEEL | Elim MediHeel catalogue | 🟠 WAITING FOR AUTHORITATIVE CRM EVIDENCE | Do not patch/seed speculatively. |
| C1-APP-DUMMY | Dummy Test → JP approval override | 🔵 LIVE / REAL ACCEPTANCE REQUIRED | Prove JP receives Approve/Decline and assigned practitioner is not required approver. No expiry. |
| C1-APP-ORD | Ordinary client approval rules | 🔵 LIVE / REAL ACCEPTANCE REQUIRED | Marietjie self; Christel self; Abigail or Christel first decision. |
| C1-RETURN | Registered-client return recognition | ⚪ READY / IN-JOURNEY | Observe naturally without redundant registration. |
| C1-CAL | Calendar/mobile presentation | 🟠 WAITING FOR GENUINE BOOKING | Verify on same next genuine future booking. |
| C1-TPL | Booking confirmation Meta template | 🟠 WAITING | Preserve plain-text path until exact Meta Active/APPROVED evidence. |
| A1 | Six known attendance finalizations | 🟠 WAITING | Genuine Completed/No-show truth only; never infer. |
| A2 | Finalization/earnings UX acceptance | ⚪ READY | Remaining authorized-account acceptance after client-critical gate. |
| B1 | Remaining Admin route acceptance | ⚪ READY | Only genuinely unverified role-specific paths after client gate. |
| D0 | Customer-care foundation | 🟢 VERIFIED | Real lifecycle/provider acceptance remains evidence-gated. |
| E1 | Ozow activation | 🟠 WAITING | Merchant configuration + explicit business rules. |
| F3 | Instagram ownership/connection | ⚪ READY | Verify existing `@shiloh_massage_studio`; never create duplicate by assumption. |
| PRIV | Destructive privacy execution | 🟠 WAITING / FAIL-CLOSED | Requires legal/owner authority and sufficient evidence. |

## Client acceptance board

| Item | State | Required evidence |
|---|---|---|
| First-time Dummy Test registration | 🟢 VERIFIED | Historical real WhatsApp evidence retained; do not redo. |
| Lymphatic language-guard false positive | 🟢 REAL-ACCEPTED FIXED | Real post-PR-#194 WhatsApp evidence. |
| Natural Lymphatic family routing | 🟢 REAL-ACCEPTED | Exact phrase rendered two CRM-backed Lymphatic treatment rows with duration/pricing. |
| Booking-entry family menu presentation | 🔵 PRODUCTION-LIVE | PR #197 CI/deploy verified; observe new `Massage Treatments` + `View ... treatments` copy naturally through real WhatsApp. |
| Elim MediHeel Pedicures family | 🟠 CRM TRUTH REQUIRED | Current real result zero eligible active rows. |
| Beauty & Aesthetics treatment-list presentation | 🟢 VERIFIED | PR #172 + real WhatsApp acceptance. |
| HIFU → Marietjie eligibility/routing | 🟢 VERIFIED | Historical real WhatsApp evidence. |
| Authoritative availability | 🟢 VERIFIED | SQL repair + real acceptance retained. |
| New-booking availability client copy | 🟢 PRODUCTION-LIVE | Exercise naturally in next journey. |
| Appointment #561 booking/reschedule/cancellation | 🟢 VERIFIED / CANCELLED | Do not recreate #561. |
| New Dummy Test booking pending-approval copy | 🔵 REAL ACCEPTANCE REQUIRED | Client must see request received/time held/not yet confirmed. |
| Pending slot exclusion | 🔵 REAL ACCEPTANCE REQUIRED | Same practitioner/time must not appear available while pending. |
| Hold no-expiry behavior | 🔵 REAL ACCEPTANCE REQUIRED | Hold persists until explicit JP decision. |
| JP approval request for Dummy Test | 🔵 REAL ACCEPTANCE REQUIRED | JP receives actionable Approve/Decline as sole required approver. |
| Practitioner non-authority for Dummy Test | 🔵 REAL ACCEPTANCE REQUIRED | Assigned practitioner must not be required decision-maker. |
| JP approval → final client confirmation | 🔵 REAL ACCEPTANCE REQUIRED | Final confirmation/calendar links only after JP approval. |
| JP decline → release | ⚪ FOLLOW-UP TEST | Separate genuine Dummy Test request later. |
| Ordinary Abigail/Christel approval | ⚪ FOLLOW-UP REAL ACCEPTANCE | Normal client booking after Dummy Test path. |
| Calendar client-mobile metadata | 🟠 WAITING FOR NEXT GENUINE BOOKING | Check shared + practitioner Calendar on same genuine booking. |
| Registered-client return | ⚪ READY / IN-JOURNEY | Confirm recognition without redundant registration. |

## Verification-quality rule

- CI/unit/source-contract evidence is necessary but broad real WhatsApp acceptance requires actual transport/human observation.
- Every deterministic client-visible production defect found manually should become a permanent regression before repair where feasible.
- Human real-WhatsApp acceptance validates Meta transport, live CRM state and presentation.
- On high-churn files, preserve the current `main` implementation and apply the smallest possible delta; PR #197 demonstrated CI correctly catches accidental whole-file regressions before merge.

## Exact next test

Continue from the currently displayed **Lymphatic treatment list** as CRM Dummy Test. Select one genuine treatment, choose a genuine future slot and complete the booking request. Do not recreate #561. When Shiloh says the request is held/pending approval, **stop before JP decides**. Capture Dummy Test’s exact pending wording and JP’s actionable request. We then verify slot exclusion and sole-JP authority before JP presses Approve; afterward verify final client confirmation and both Calendar mirrors. JP decline is a later separate genuine request.

Do **not** restart this in-progress journey solely to re-open PR #197’s booking-family menu. Observe that menu naturally the next time it appears.

## Guardrails

- GitHub `main`, Render production, CRM, Google Calendar and explicit real WhatsApp/human evidence remain authoritative.
- Do not recreate cancelled appointment #561.
- Do not infer provider/template/attendance outcomes.
- CRM Dummy Test / JP authority ambiguity must fail closed; never fall back to practitioner approval.
- Direct Render Postgres connector SSL failure is a tooling limitation, not CRM truth.
- Re-rank after every defect/blocker resolution; product-critical client defects take precedence.